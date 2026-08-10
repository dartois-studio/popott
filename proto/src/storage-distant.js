/* ==========================================================================
   Popott — stockage partage

   Meme interface que `storage.js` : get / set / delete / list. Le proto ne
   sait pas qu'elle a change de nature, et c'est tout l'interet.

   Le principe tient en trois idees.

   1. Le local d'abord. Toute ecriture va dans localStorage immediatement,
      puis part vers le serveur. Le reseau peut tomber, le telephone
      s'endormir dans le rayon surgeles : rien n'est perdu, la poussee
      reprend au retour.

   2. Personne n'ecrase personne. Chaque document porte un numero de version.
      Une ecriture dit « je remplace la version 12 » ; si le serveur en est a
      la 13, la mise a jour ne touche rien et le client sait qu'il doit
      fusionner d'abord (voir `fusion.js`), puis reessayer.

   3. Les autres appareils sont prevenus. Un canal temps reel signale « la
      cle X est passee en version N ». Le client va chercher le contenu et
      previent l'interface par un evenement `popott:distant`.

   Trois valeurs par cle, cote navigateur :

     popott:<cle>              ce que l'application croit vrai (le cache)
     popott-sync:base:<cle>    la derniere version recue du serveur
     popott-sync:version:<cle> son numero de version

   L'ecart entre le cache et la base, c'est exactement ce que j'ai change et
   qui n'est pas encore parti. C'est la matiere de la fusion.
   ========================================================================== */

import { supabase } from "./supabase.js";
import { fusionnerJSON } from "./fusion.js";

const PREFIXE = "popott:";
const PREFIXE_SYNC = "popott-sync:";

const cleCache = (cle) => PREFIXE + cle;
const cleBase = (cle) => PREFIXE_SYNC + "base:" + cle;
const cleVersion = (cle) => PREFIXE_SYNC + "version:" + cle;

const DELAI_POUSSEE = 700;   // ms — le proto ecrit deja par salves de 400 ms
const TENTATIVES_MAX = 6;

/* ----------------------------------------------------------- etat local --- */

const lire = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const ecrire = (k, v) => { try { localStorage.setItem(k, v); } catch { /* quota */ } };
const effacer = (k) => { try { localStorage.removeItem(k); } catch { /* rien */ } };

const version = (cle) => { const v = lire(cleVersion(cle)); return v === null ? null : Number(v); };

/** Purge tout ce qui concerne Popott. Appele quand on change de foyer :
 *  garder le cache d'un autre foyer ne pourrait produire que des fusions
 *  absurdes entre deux jeux de donnees sans rapport. */
export function purgerStockage() {
  const aJeter = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && (k.startsWith(PREFIXE) || k.startsWith(PREFIXE_SYNC))) aJeter.push(k);
  }
  aJeter.forEach(effacer);
}

/* ------------------------------------------------------------- signaux --- */

/** Previent l'interface qu'un document a change ailleurs qu'ici. */
function annoncer(cle, valeur) {
  if (cle !== "menus:v1") return; // la seule cle que le proto sait recevoir
  try {
    const data = JSON.parse(valeur);
    window.dispatchEvent(new CustomEvent("popott:distant", { detail: data }));
  } catch { /* document illisible : on n'impose rien a l'interface */ }
}

/** Etat de la liaison, pour l'indicateur discret de `main.jsx`. */
function etat(quoi, detail) {
  window.dispatchEvent(new CustomEvent("popott:synchro", { detail: { etat: quoi, ...detail } }));
}

/* ========================================================================= */

/**
 * Remplace `window.storage` par la version partagee.
 *
 * @param {string} foyerId  le foyer dont on lit et ecrit les documents
 * @param {string} membreId l'utilisateur connecte, pour ignorer ses propres echos
 * @returns {{arreter: () => void}}
 */
export function installerStockageDistant(foyerId, membreId) {
  const db = supabase();
  if (!db) throw new Error("Supabase n'est pas configure");

  // Changement de foyer : on repart d'une ardoise propre.
  const foyerPrecedent = lire(PREFIXE_SYNC + "foyer");
  if (foyerPrecedent && foyerPrecedent !== foyerId) purgerStockage();
  ecrire(PREFIXE_SYNC + "foyer", foyerId);

  const minuteries = new Map();   // cle → timeout de poussee
  const enCours = new Map();      // cle → promesse de poussee en vol
  let vivant = true;
  let canal = null;

  /* ----------------------------------------------------------- lecture --- */

  async function tirerLigne(cle) {
    const { data, error } = await db
      .from("documents")
      .select("valeur, version")
      .eq("foyer_id", foyerId)
      .eq("cle", cle)
      .maybeSingle();
    if (error) throw error;
    return data; // null si la cle n'existe pas encore
  }

  /**
   * Adopte la version du serveur. Si j'avais des changements non pousses,
   * ils sont rejoues par-dessus plutot que jetes.
   * @returns la valeur retenue, ou null
   */
  function adopter(cle, ligne) {
    const local = lire(cleCache(cle));
    const base = lire(cleBase(cle));

    ecrire(cleBase(cle), ligne.valeur);
    ecrire(cleVersion(cle), String(ligne.version));

    // Rien en attente : la version du serveur passe telle quelle.
    if (local === null || local === base) {
      ecrire(cleCache(cle), ligne.valeur);
      return ligne.valeur;
    }

    const fusionne = fusionnerJSON(base, local, ligne.valeur);
    ecrire(cleCache(cle), fusionne);
    if (fusionne !== ligne.valeur) planifier(cle); // il reste ma part a pousser
    return fusionne;
  }

  /** Va chercher une cle sur le serveur et previent l'interface si ca bouge. */
  async function rafraichir(cle) {
    if (!vivant) return;
    try {
      const ligne = await tirerLigne(cle);
      if (!ligne || !vivant) return;
      const avant = lire(cleCache(cle));
      const apres = adopter(cle, ligne);
      if (apres !== null && apres !== avant) annoncer(cle, apres);
      etat("ok");
    } catch (e) {
      etat(navigator.onLine ? "erreur" : "hors-ligne", { message: e?.message });
    }
  }

  /* ---------------------------------------------------------- ecriture --- */

  function planifier(cle) {
    clearTimeout(minuteries.get(cle));
    minuteries.set(cle, setTimeout(() => { minuteries.delete(cle); pousser(cle); }, DELAI_POUSSEE));
  }

  /** Pousse une cle, en serialisant les appels : deux poussees simultanees
   *  sur la meme cle se marcheraient dessus sur le numero de version. */
  function pousser(cle) {
    const precedente = enCours.get(cle) || Promise.resolve();
    const suite = precedente.then(() => pousserVraiment(cle)).catch(() => { });
    enCours.set(cle, suite);
    return suite;
  }

  async function pousserVraiment(cle, tentative = 0) {
    if (!vivant) return;

    const local = lire(cleCache(cle));
    if (local === null) return;
    if (local === lire(cleBase(cle))) return; // deja a jour cote serveur

    if (tentative >= TENTATIVES_MAX) {
      etat("erreur", { message: "Trop de conflits d'affilee" });
      return;
    }

    const v = version(cle);

    try {
      // Cle encore inexistante cote serveur : premiere poussee.
      if (v === null) {
        const { error } = await db.from("documents").insert({
          foyer_id: foyerId, cle, valeur: local, version: 1, maj_par: membreId,
        });
        if (!error) {
          ecrire(cleBase(cle), local);
          ecrire(cleVersion(cle), "1");
          etat("ok");
          return;
        }
        // 23505 : quelqu'un a insere avant nous. On lit, on fusionne, on repart.
        if (error.code !== "23505") throw error;
        const ligne = await tirerLigne(cle);
        if (ligne) adopter(cle, ligne);
        return pousserVraiment(cle, tentative + 1);
      }

      const { data, error } = await db
        .from("documents")
        .update({ valeur: local, version: v + 1, maj_le: new Date().toISOString(), maj_par: membreId })
        .eq("foyer_id", foyerId)
        .eq("cle", cle)
        .eq("version", v)          // le garde-fou : refuse si la version a bouge
        .select("version");

      if (error) throw error;

      if (data && data.length === 1) {
        ecrire(cleBase(cle), local);
        ecrire(cleVersion(cle), String(v + 1));
        etat("ok");
        return;
      }

      // Zero ligne touchee : le serveur a avance. On fusionne et on reessaie.
      const ligne = await tirerLigne(cle);
      if (!ligne) { effacer(cleVersion(cle)); return pousserVraiment(cle, tentative + 1); }

      const fusionne = adopter(cle, ligne);
      if (fusionne !== null) annoncer(cle, fusionne);
      return pousserVraiment(cle, tentative + 1);

    } catch (e) {
      // Hors ligne ou serveur indisponible : le cache local garde tout, la
      // poussee repartira au retour du reseau (voir les ecouteurs plus bas).
      etat(navigator.onLine ? "erreur" : "hors-ligne", { message: e?.message });
    }
  }

  /** Repousse tout ce qui n'est pas encore parti. */
  function rattraper() {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(PREFIXE) || k.startsWith(PREFIXE_SYNC)) continue;
      const cle = k.slice(PREFIXE.length);
      if (lire(cleCache(cle)) !== lire(cleBase(cle))) pousser(cle);
    }
  }

  /* ------------------------------------------------------- window.storage --- */

  window.storage = {
    async get(cle) {
      try {
        const ligne = await tirerLigne(cle);

        if (ligne) {
          const valeur = adopter(cle, ligne);
          etat("ok");
          return valeur === null ? null : { key: cle, value: valeur, shared: true };
        }

        // Rien sur le serveur. Si cet appareil a deja des donnees — le cas au
        // tout premier branchement, quand on a des mois de plats en local —
        // elles deviennent celles du foyer.
        const local = lire(cleCache(cle));
        if (local !== null) {
          effacer(cleVersion(cle));
          effacer(cleBase(cle));
          await pousser(cle);
          return { key: cle, value: local, shared: true };
        }

        etat("ok");
        return null;
      } catch (e) {
        // Premiere ouverture hors reseau : on sert ce qu'on a sous la main.
        etat(navigator.onLine ? "erreur" : "hors-ligne", { message: e?.message });
        const local = lire(cleCache(cle));
        return local === null ? null : { key: cle, value: local, shared: true };
      }
    },

    async set(cle, valeur) {
      const v = String(valeur);
      ecrire(cleCache(cle), v);
      planifier(cle);
      return { key: cle, value: v, shared: true };
    },

    async delete(cle) {
      effacer(cleCache(cle));
      effacer(cleBase(cle));
      effacer(cleVersion(cle));
      clearTimeout(minuteries.get(cle));
      minuteries.delete(cle);
      try {
        await db.from("documents").delete().eq("foyer_id", foyerId).eq("cle", cle);
      } catch { /* la suppression locale a eu lieu, le serveur suivra */ }
      return { key: cle, deleted: true, shared: true };
    },

    async list(prefixe = "") {
      const cles = new Set();
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || !k.startsWith(PREFIXE) || k.startsWith(PREFIXE_SYNC)) continue;
        const court = k.slice(PREFIXE.length);
        if (court.startsWith(prefixe)) cles.add(court);
      }
      try {
        const { data, error } = await db
          .from("documents").select("cle")
          .eq("foyer_id", foyerId)
          .like("cle", prefixe + "%");
        if (!error && data) data.forEach((r) => cles.add(r.cle));
      } catch { /* hors ligne : la liste locale fait l'affaire */ }
      return { keys: [...cles], prefix: prefixe, shared: true };
    },
  };

  /* ---------------------------------------------------------- temps reel --- */

  canal = db
    .channel("documents:" + foyerId)
    .on("postgres_changes",
      { event: "*", schema: "public", table: "documents", filter: `foyer_id=eq.${foyerId}` },
      (charge) => {
        const ligne = charge.new || charge.old || {};
        const cle = ligne.cle;
        if (!cle) return;
        if (charge.eventType === "DELETE") {
          effacer(cleCache(cle)); effacer(cleBase(cle)); effacer(cleVersion(cle));
          return;
        }
        // Le canal ne transporte pas `valeur` (voir schema.sql), juste de quoi
        // savoir qu'il faut aller la chercher.
        //
        // Le tri se fait sur la version, pas sur `maj_par` : deux navigateurs
        // du meme PC sont souvent connectes au meme compte, et se filtrer sur
        // l'identite les rendrait sourds l'un a l'autre. Une version deja
        // connue est forcement mon propre echo — ou une redite sans interet.
        const connue = version(cle);
        if (connue !== null && Number(ligne.version) <= connue) return;
        rafraichir(cle);
      })
    .subscribe((statut) => {
      if (statut === "SUBSCRIBED") {
        etat("ok");
        // Une reconnexion laisse un trou : on rattrape dans les deux sens.
        rafraichir("menus:v1");
        rattraper();
      } else if (statut === "CHANNEL_ERROR" || statut === "TIMED_OUT") {
        etat(navigator.onLine ? "erreur" : "hors-ligne");
      }
    });

  /* ----------------------------------------------------------- reveils --- */

  // Le temps reel meurt en silence quand un telephone se met en veille.
  // Ces trois reveils sont le filet : ils ne coutent rien et evitent de
  // rester des heures sur une version perimee sans le savoir.
  const auRetour = () => { rafraichir("menus:v1"); rattraper(); };
  const surVisibilite = () => { if (document.visibilityState === "visible") auRetour(); };
  const surHorsLigne = () => etat("hors-ligne");

  window.addEventListener("online", auRetour);
  window.addEventListener("offline", surHorsLigne);
  document.addEventListener("visibilitychange", surVisibilite);

  return {
    arreter() {
      vivant = false;
      minuteries.forEach((t) => clearTimeout(t));
      minuteries.clear();
      window.removeEventListener("online", auRetour);
      window.removeEventListener("offline", surHorsLigne);
      document.removeEventListener("visibilitychange", surVisibilite);
      if (canal) db.removeChannel(canal);
    },
  };
}
