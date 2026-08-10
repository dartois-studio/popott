/* ==========================================================================
   Popott — fusion a trois voies

   Le proto enregistre tout son etat dans un seul document JSON. Tant qu'on
   etait seul sur un appareil, ca suffisait. A deux telephones et deux
   navigateurs, ecrire ce document entier veut dire ecraser le voisin :
   celui qui coche une case en magasin annule le plat que l'autre vient
   d'ajouter a la maison.

   D'ou cette fusion. Trois versions entrent :

     base    le document tel qu'on l'avait recu du serveur
     mien    ce que j'en ai fait depuis
     distant ce que le serveur contient maintenant

   Comparer `mien` a `base` dit ce que *j'ai* change — et rien d'autre.
   On repart donc de `distant`, et on ne rejoue par-dessus que mes
   changements a moi. Personne n'ecrase personne : chacun ne pose que ses
   propres gestes.

   Aucun nom de champ n'est ecrit ici. La regle se deduit de la forme :

     tableau d'objets a `id`  →  appariement par id, element par element
     objet simple             →  cle par cle, en descendant
     tout le reste            →  si je l'ai touche, ma valeur ; sinon la sienne

   Ce qui couvre les plats, les repas, les ajustements, la carte des cases
   cochees, sans jamais nommer « plats », « repas » ni « etats ».
   ========================================================================== */

/** Egalite structurelle. Les documents sont du JSON : la comparaison de
 *  formes serialisees est exacte et largement assez rapide ici. */
const identique = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

const estObjet = (x) => x !== null && typeof x === "object" && !Array.isArray(x);

/** Un tableau d'entites : que des objets, tous porteurs d'un `id` unique.
 *  C'est la forme de `plats`, `repas`, `ingredients`, `lignes`, `ajust`…
 *  Un tableau vide passe : c'est une collection dont on a tout retire, pas
 *  une liste de valeurs simples — la question se tranche sur l'autre cote. */
function estListeEntites(x) {
  if (!Array.isArray(x)) return false;
  const vus = new Set();
  for (const e of x) {
    if (!estObjet(e) || typeof e.id !== "string") return false;
    if (vus.has(e.id)) return false;
    vus.add(e.id);
  }
  return true;
}

/** Deux cotes a apparier par id. Il faut au moins un element quelque part,
 *  sinon `[]` et `[]` se ressemblent trop pour qu'on tranche quoi que ce soit. */
const estCollection = (a, b) =>
  estListeEntites(a) && estListeEntites(b) && (a.length > 0 || b.length > 0);

const parId = (liste) => new Map((liste || []).map((e) => [e.id, e]));

/* --------------------------------------------------------- collections ---
   L'ordre compte : c'est l'ordre du service dans un repas, l'ordre d'affichage
   ailleurs. On garde celui de `distant`, qui fait foi, et on insere mes ajouts
   a la place ou je les avais mis.
*/
function fusionnerCollection(base, mien, distant) {
  const bB = parId(base), bM = parId(mien), bD = parId(distant);
  const sortie = [];
  const poses = new Set();

  for (const e of distant) {
    const dansBase = bB.has(e.id);
    const dansMien = bM.has(e.id);

    // Je l'ai supprime et le serveur ne l'avait pas retouche depuis : ma
    // suppression tient. S'il l'a modifie entre-temps, on le garde — perdre
    // le travail de quelqu'un est pire que garder une ligne en trop.
    if (dansBase && !dansMien) {
      if (identique(bB.get(e.id), e)) { poses.add(e.id); continue; }
      sortie.push(e); poses.add(e.id); continue;
    }

    if (dansMien) {
      sortie.push(fusionner(bB.get(e.id), bM.get(e.id), e));
      poses.add(e.id);
      continue;
    }

    sortie.push(e); // il l'a ajoute, je ne le connais pas
    poses.add(e.id);
  }

  // Ce qui me reste : mes ajouts (absents de base et de distant), et les
  // elements que lui a supprimes mais que j'ai modifies — remettre ces
  // derniers ferait revivre une suppression volontaire, on les laisse partir.
  for (let i = 0; i < mien.length; i++) {
    const e = mien[i];
    if (poses.has(e.id)) continue;
    if (bB.has(e.id)) continue; // il l'a supprime : sa suppression tient
    const avant = mien[i - 1];
    const ancre = avant ? sortie.findIndex((x) => x.id === avant.id) : -1;
    if (ancre >= 0) sortie.splice(ancre + 1, 0, e);
    else sortie.push(e);
  }

  return sortie;
}

/* -------------------------------------------------------------- objets ---
   Cle par cle. C'est ce qui fait que la carte des cases cochees (`etats`)
   fusionne proprement : chacun ne pose que les cases qu'il a touchees.
*/
function fusionnerObjet(base, mien, distant) {
  const sortie = { ...distant };
  const cles = new Set([...Object.keys(base || {}), ...Object.keys(mien), ...Object.keys(distant)]);

  for (const k of cles) {
    const b = base ? base[k] : undefined;
    const m = mien[k];
    const d = distant[k];

    if (identique(m, b)) continue; // je n'y ai pas touche : sa valeur reste

    // J'ai supprime la cle, et lui ne l'avait pas retouchee.
    if (!(k in mien)) {
      if (identique(b, d)) delete sortie[k];
      continue;
    }

    sortie[k] = identique(d, b) ? m : fusionner(b, m, d);
  }

  return sortie;
}

/* --------------------------------------------------------------- entree --- */

/**
 * Fusionne trois etats d'une meme valeur.
 *
 * @param {*} base    la valeur telle qu'on l'avait recue du serveur
 * @param {*} mien    la valeur locale, modifiee depuis
 * @param {*} distant la valeur actuelle du serveur
 * @returns une valeur qui contient les changements des deux cotes
 */
export function fusionner(base, mien, distant) {
  if (identique(mien, distant)) return distant;      // rien a arbitrer
  if (identique(mien, base)) return distant;         // je n'ai rien touche
  if (identique(distant, base)) return mien;         // lui n'a rien touche

  // Sans base commune, on ne peut pas distinguer un ajout d'une suppression.
  // Le serveur fait alors foi : c'est ce que les autres appareils voient deja.
  if (base === undefined) return distant;

  if (estCollection(mien, distant)) {
    return fusionnerCollection(estListeEntites(base) ? base : [], mien, distant);
  }

  if (estObjet(mien) && estObjet(distant)) {
    return fusionnerObjet(estObjet(base) ? base : {}, mien, distant);
  }

  // Deux valeurs indivisibles modifiees des deux cotes : un nom de plat, une
  // liste de tags, une quantite. Il n'y a rien a couper en deux — je viens
  // d'agir, ma valeur passe devant.
  return mien;
}

/** Fusionne deux documents serialises. Renvoie une chaine JSON. */
export function fusionnerJSON(baseJSON, mienJSON, distantJSON) {
  const lire = (s) => { try { return s == null ? undefined : JSON.parse(s); } catch { return undefined; } };
  const base = lire(baseJSON);
  const mien = lire(mienJSON);
  const distant = lire(distantJSON);

  if (mien === undefined) return distantJSON;
  if (distant === undefined) return mienJSON;

  return JSON.stringify(fusionner(base, mien, distant));
}
