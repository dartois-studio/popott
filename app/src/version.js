/* ==========================================================================
   Popott — version publiee et rafraichissement du code

   Deux besoins qui vont ensemble : savoir ce qu'on a, et pouvoir prendre la
   suite.

   `VERSION` est grave au build par `vite.config.js` — numero de
   `package.json`, date, commit. Rien n'est calcule ici : un numero devine a
   l'execution ne voudrait rien dire.

   `actualiser()` force la relecture du code. Sans service worker (phase 5),
   c'est le cache HTTP qui garde l'ancien `index.html` : un rechargement
   ordinaire peut resservir exactement le meme fichier, et le bouton n'aurait
   alors aucun effet visible — le pire des cas, puisqu'on croirait etre a
   jour. D'ou un parametre d'adresse unique, qu'aucun cache ne connait, apres
   avoir vide ce qui pourrait encore repondre a la place du reseau.

   Les donnees ne sont pas touchees : elles sont dans localStorage et, si un
   foyer est configure, sur le serveur. Seul le code est retelecharge.
   ========================================================================== */

export const VERSION = __POPOTT_VERSION__;

const PARAM = "maj";

export async function actualiser() {
  // Le jour ou un service worker existera, il repondrait depuis son propre
  // cache sans jamais aller au reseau. Le desinscrire d'abord, sinon le
  // rechargement ci-dessous retomberait sur la version qu'on veut quitter.
  try {
    if (navigator.serviceWorker) {
      const inscrits = await navigator.serviceWorker.getRegistrations();
      await Promise.all(inscrits.map((i) => i.unregister()));
    }
  } catch { /* navigateur sans service worker, ou contexte non securise */ }

  try {
    if (window.caches) {
      const noms = await caches.keys();
      await Promise.all(noms.map((n) => caches.delete(n)));
    }
  } catch { /* idem : on continue, le parametre d'adresse suffit souvent */ }

  try {
    const adresse = new URL(window.location.href);
    adresse.searchParams.set(PARAM, Date.now().toString(36));
    // `replace` plutot que `assign` : l'ancienne version ne reste pas dans
    // l'historique, ou le bouton « precedent » la ressortirait.
    window.location.replace(adresse.toString());
  } catch {
    window.location.reload();
  }
}

/** Retire le parametre de rafraichissement une fois la page chargee. Il a
 *  fait son travail, et il n'a rien a faire dans une adresse qu'on partage,
 *  qu'on met en favori ou qu'on installe sur l'ecran d'accueil. */
export function nettoyerAdresse() {
  try {
    const adresse = new URL(window.location.href);
    if (!adresse.searchParams.has(PARAM)) return;
    adresse.searchParams.delete(PARAM);
    history.replaceState(null, "", adresse.toString());
  } catch { /* file:// n'accepte pas toujours replaceState */ }
}
