/* ==========================================================================
   Popott — comptes et foyer

   Un portail devant l'application. Trois questions dans l'ordre :

     1. Qui es-tu ?          connexion par e-mail et mot de passe
     2. Quel foyer ?         en creer un, ou rallier celui du conjoint
     3. — et on s'efface     `Proto` prend la suite, inchange

   Le foyer est l'unite de partage : deux comptes rattaches au meme foyer
   voient les memes plats, le meme menu, la meme liste de courses. On rallie
   un foyer par son code, que le premier appareil affiche dans le panneau
   Compte (adresse suivie de `#compte`).
   ========================================================================== */

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase.js";
import { Logo } from "./Logo.jsx";
import "./auth.css";

/* --------------------------------------------------------- presentation --- */

function Cadre({ titre, eyebrow, children }) {
  return (
    <div className="pop-auth">
      <div className="pop-auth__colonne">
        <Logo height={26} style={{ display: "block", color: "var(--aubergine)" }} />
        <div>
          <p className="pop-auth__eyebrow">{eyebrow}</p>
          <h1 className="pop-auth__titre">{titre}</h1>
        </div>
        {children}
      </div>
    </div>
  );
}

const Erreur = ({ message }) =>
  message ? <p className="pop-auth__erreur">{message}</p> : null;

/** Les messages de Supabase sont en anglais et parlent de « credentials ».
 *  Ceux qu'on croise vraiment meritent une phrase lisible. */
function traduire(message) {
  const m = (message || "").toLowerCase();
  if (m.includes("invalid login credentials")) return "E-mail ou mot de passe incorrect.";
  if (m.includes("email not confirmed")) return "Il reste un e-mail de confirmation à valider.";
  if (m.includes("user already registered")) return "Ce compte existe déjà : connecte-toi.";
  if (m.includes("password should be")) return "Le mot de passe doit faire au moins 6 caractères.";
  if (m.includes("unable to validate email")) return "Cette adresse e-mail n'est pas valide.";
  if (m.includes("failed to fetch") || m.includes("networkerror")) return "Pas de réseau. Réessaie une fois connecté.";
  return message || "Quelque chose n'a pas fonctionné.";
}

/* ------------------------------------------------------------ connexion --- */

function EcranConnexion() {
  const [mode, setMode] = useState("connexion"); // connexion | inscription
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState(null);
  const [attente, setAttente] = useState(false);
  const [aVerifier, setAVerifier] = useState(false);

  const inscription = mode === "inscription";

  async function envoyer(e) {
    e.preventDefault();
    setErreur(null);
    setAttente(true);
    try {
      const db = supabase();
      if (inscription) {
        const { data, error } = await db.auth.signUp({ email: email.trim(), password: motDePasse });
        if (error) throw error;
        // Si la confirmation par e-mail est active dans le projet Supabase,
        // aucune session n'est ouverte tant que le lien n'est pas clique.
        if (!data.session) setAVerifier(true);
      } else {
        const { error } = await db.auth.signInWithPassword({ email: email.trim(), password: motDePasse });
        if (error) throw error;
      }
    } catch (err) {
      setErreur(traduire(err?.message));
    } finally {
      setAttente(false);
    }
  }

  if (aVerifier) {
    return (
      <Cadre eyebrow="Compte" titre="Vérifie ta boîte mail">
        <p className="pop-auth__texte">
          Un lien de confirmation vient d'être envoyé à <strong>{email}</strong>.
          Clique dessus, puis reviens ici pour te connecter.
        </p>
        <button className="pop-auth__btn pop-auth__btn--ghost"
          onClick={() => { setAVerifier(false); setMode("connexion"); }}>
          Revenir à la connexion
        </button>
      </Cadre>
    );
  }

  return (
    <Cadre eyebrow="Compte" titre={inscription ? "Créer un compte" : "Se connecter"}>
      <p className="pop-auth__texte">
        {inscription
          ? "Un compte par personne. Vous rejoindrez ensuite le même foyer, et vos deux téléphones verront les mêmes menus."
          : "Une seule fois par appareil : la connexion est ensuite gardée."}
      </p>

      <form onSubmit={envoyer} style={{ display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
        <label className="pop-auth__champ">
          <span className="pop-auth__label">E-mail</span>
          <input type="email" value={email} autoComplete="email" required
            onChange={(e) => setEmail(e.target.value)} />
        </label>

        <label className="pop-auth__champ">
          <span className="pop-auth__label">Mot de passe</span>
          <input type="password" value={motDePasse} required minLength={6}
            autoComplete={inscription ? "new-password" : "current-password"}
            onChange={(e) => setMotDePasse(e.target.value)} />
        </label>

        <Erreur message={erreur} />

        <button className="pop-auth__btn" type="submit" disabled={attente}>
          {attente ? "Un instant…" : inscription ? "Créer le compte" : "Se connecter"}
        </button>
      </form>

      <button className="pop-auth__lien"
        onClick={() => { setMode(inscription ? "connexion" : "inscription"); setErreur(null); }}>
        {inscription ? "J'ai déjà un compte" : "Créer un compte"}
      </button>
    </Cadre>
  );
}

/* ----------------------------------------------------------- le foyer --- */

function EcranFoyer({ email, surFoyer, surDeconnexion }) {
  const [code, setCode] = useState("");
  const [erreur, setErreur] = useState(null);
  const [attente, setAttente] = useState(false);

  async function appeler(fonction, args) {
    setErreur(null);
    setAttente(true);
    try {
      const { data, error } = await supabase().rpc(fonction, args);
      if (error) throw error;
      surFoyer(data);
    } catch (err) {
      setErreur(traduire(err?.message));
      setAttente(false);
    }
  }

  const codeValide = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(code.trim());

  return (
    <Cadre eyebrow={email} titre="Ton foyer">
      <p className="pop-auth__texte">
        Le foyer est ce qui est partagé. Si personne n'en a encore créé,
        commence par en créer un — tu donneras son code à l'autre appareil.
      </p>

      <Erreur message={erreur} />

      <button className="pop-auth__btn" disabled={attente}
        onClick={() => appeler("creer_foyer", { nom: "Foyer" })}>
        {attente ? "Un instant…" : "Créer un foyer"}
      </button>

      <hr className="pop-auth__sep" />

      <label className="pop-auth__champ">
        <span className="pop-auth__label">Rallier un foyer existant</span>
        <input type="text" value={code} placeholder="Colle le code du foyer"
          autoComplete="off" spellCheck={false}
          onChange={(e) => setCode(e.target.value)} />
      </label>

      <button className="pop-auth__btn pop-auth__btn--ghost"
        disabled={attente || !codeValide}
        onClick={() => appeler("rejoindre_foyer", { code: code.trim() })}>
        Rejoindre ce foyer
      </button>

      <button className="pop-auth__lien" onClick={surDeconnexion}>Se déconnecter</button>
    </Cadre>
  );
}

/* -------------------------------------------------------- panneau compte ---
   Accessible en ajoutant `#compte` a l'adresse. Volontairement en dehors de
   l'application : la maquette du proto ne prevoit pas d'entree « compte »
   dans les reglages, et en glisser une au chausse-pied deplacerait des
   choses qui ont ete arbitrees. Le jour ou une entree est ajoutee dans les
   reglages, elle n'aura qu'a pointer ici.
*/

function PanneauCompte({ email, foyerId, surDeconnexion, surFermer }) {
  const [copie, setCopie] = useState(false);

  async function copier() {
    try {
      await navigator.clipboard.writeText(foyerId);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch { /* pas de presse-papier : le code reste selectionnable a la main */ }
  }

  return (
    <Cadre eyebrow="Compte" titre={email}>
      <p className="pop-auth__texte">
        Code de ce foyer. Sur le deuxième téléphone : créer un compte, puis
        coller ce code dans « Rallier un foyer existant ».
      </p>

      <div className="pop-auth__code">{foyerId}</div>

      <button className="pop-auth__btn pop-auth__btn--ghost" onClick={copier}>
        {copie ? "Copié" : "Copier le code"}
      </button>

      <p className="pop-auth__note">
        Toute personne qui a ce code et crée un compte entre dans le foyer.
        Il se partage comme une clé de maison, pas comme une adresse.
      </p>

      <hr className="pop-auth__sep" />

      <button className="pop-auth__btn" onClick={surFermer}>Revenir à Popott</button>
      <button className="pop-auth__lien" onClick={surDeconnexion}>Se deconnecter</button>
    </Cadre>
  );
}

/* ------------------------------------------------------------- le hook --- */

/**
 * Suit la session et le foyer.
 *
 * @returns {{etape: string, session: object|null, foyerId: string|null,
 *            email: string, deconnecter: () => void, definirFoyer: (id) => void}}
 *
 * `etape` vaut : "chargement" | "connexion" | "foyer" | "pret"
 */
export function usePortail() {
  const [session, setSession] = useState(null);
  const [foyerId, setFoyerId] = useState(null);
  const [pret, setPret] = useState(false);

  // La session d'abord : elle est relue du stockage au demarrage, puis
  // suivie — un jeton expire ou une deconnexion sur un autre onglet doivent
  // ramener au portail sans rechargement.
  useEffect(() => {
    const db = supabase();
    let vivant = true;

    db.auth.getSession().then(({ data }) => {
      if (vivant) { setSession(data.session ?? null); setPret(true); }
    });

    const { data: sub } = db.auth.onAuthStateChange((_evenement, s) => {
      if (!vivant) return;
      setSession(s ?? null);
      if (!s) setFoyerId(null);
    });

    return () => { vivant = false; sub.subscription.unsubscribe(); };
  }, []);

  // Puis le foyer, des qu'on sait qui parle.
  useEffect(() => {
    if (!session) return;
    let vivant = true;
    supabase().rpc("mon_foyer").then(({ data }) => {
      if (vivant) setFoyerId(data ?? null);
    });
    return () => { vivant = false; };
  }, [session?.user?.id]);

  const deconnecter = useCallback(async () => {
    await supabase().auth.signOut();
    setFoyerId(null);
  }, []);

  const etape = !pret ? "chargement"
    : !session ? "connexion"
      : !foyerId ? "foyer"
        : "pret";

  return {
    etape,
    session,
    foyerId,
    email: session?.user?.email || "",
    membreId: session?.user?.id || null,
    deconnecter,
    definirFoyer: setFoyerId,
  };
}

/* ------------------------------------------------------------- l'ecran --- */

/** Rend l'ecran correspondant a l'etape du portail. Ne rend jamais `Proto`. */
export function EcranPortail({ portail }) {
  const { etape, email, foyerId, deconnecter, definirFoyer } = portail;

  if (etape === "chargement") {
    return (
      <div className="pop-auth">
        <div className="pop-auth__colonne">
          <p className="pop-auth__texte">Chargement…</p>
        </div>
      </div>
    );
  }

  if (etape === "connexion") return <EcranConnexion />;

  if (etape === "foyer") {
    return <EcranFoyer email={email} surFoyer={definirFoyer} surDeconnexion={deconnecter} />;
  }

  // etape === "pret" : le panneau compte, ouvert a la demande.
  return (
    <PanneauCompte
      email={email}
      foyerId={foyerId}
      surDeconnexion={deconnecter}
      surFermer={() => { window.location.hash = ""; }}
    />
  );
}

/* ------------------------------------------------- indicateur de liaison --- */

/** Ne s'affiche que quand la synchronisation ne va pas de soi. */
export function Liaison() {
  const [souci, setSouci] = useState(null);

  useEffect(() => {
    const surEtat = (e) => {
      const { etat } = e.detail || {};
      setSouci(etat === "ok" ? null : etat);
    };
    window.addEventListener("popott:synchro", surEtat);
    return () => window.removeEventListener("popott:synchro", surEtat);
  }, []);

  if (!souci) return null;

  return (
    <div className="pop-synchro" role="status">
      <span className="pop-synchro__point" />
      {souci === "hors-ligne"
        ? "Hors ligne — tout est gardé, ça repartira au réseau"
        : "Synchronisation en attente"}
    </div>
  );
}
