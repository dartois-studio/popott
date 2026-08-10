/* ==========================================================================
   Popott — stockage local

   Le prototype a ete ecrit dans les artefacts Claude, qui exposent une API
   `window.storage` (get / set / delete / list). Hors de cet environnement,
   cette API n'existe pas : le proto tombait alors en memoire seule et perdait
   tout au rechargement.

   On la reimplemente ici sur localStorage, avec la meme signature et les memes
   cles. App.jsx n'a donc aucune ligne a changer, et il persiste vraiment.

   Le jour ou la synchronisation arrive, c'est ce fichier qu'on remplace :
   meme interface, backend distant. Rien d'autre ne bouge.
   ========================================================================== */

const PREFIXE = "popott:";
const nom = (cle) => PREFIXE + cle;

export function installerStockage() {
  if (typeof window === "undefined") return;
  if (window.storage) return; // deja dans un environnement qui en fournit une

  window.storage = {
    async get(cle) {
      const brut = localStorage.getItem(nom(cle));
      return brut === null ? null : { key: cle, value: brut, shared: false };
    },

    async set(cle, valeur) {
      localStorage.setItem(nom(cle), String(valeur));
      return { key: cle, value: String(valeur), shared: false };
    },

    async delete(cle) {
      localStorage.removeItem(nom(cle));
      return { key: cle, deleted: true, shared: false };
    },

    async list(prefixe = "") {
      const cles = [];
      for (let i = 0; i < localStorage.length; i++) {
        const brut = localStorage.key(i);
        if (brut && brut.startsWith(PREFIXE)) {
          const court = brut.slice(PREFIXE.length);
          if (court.startsWith(prefixe)) cles.push(court);
        }
      }
      return { keys: cles, prefix: prefixe, shared: false };
    },
  };
}

/** Efface les donnees de Popott. Utile pour repartir des donnees d'exemple.
 *  Inclut les traces de synchronisation (`popott-sync:`) : garder une base de
 *  comparaison sans le document qu'elle decrit ne produirait que des fusions
 *  incoherentes au prochain branchement. */
export function viderStockage() {
  if (typeof window === "undefined") return;
  Object.keys(localStorage)
    .filter((k) => k.startsWith(PREFIXE) || k.startsWith("popott-sync:"))
    .forEach((k) => localStorage.removeItem(k));
}
