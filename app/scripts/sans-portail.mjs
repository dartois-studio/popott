/* ==========================================================================
   Popott — greffon de build : couper le portail de synchronisation

   `main.jsx` charge le portail par import dynamique, ce qui suffit a le
   sortir du fascicule principal en build normal. Mais le fichier unique de
   `solo.mjs` n'a pas de fascicules : tout est inline, y compris ce qui ne
   servira jamais. Sans ce greffon, un fichier sans synchronisation embarque
   quand meme le client Supabase et double de taille.

   Utilise par `solo.mjs` dans son mode par defaut. Son mode `--portail`, lui,
   veut justement le portail : il ne l'applique pas.
   ========================================================================== */

const VIDE = "\0popott-portail-vide";

export const sansPortail = {
  name: "popott-sans-portail",
  enforce: "pre", // avant la resolution de Vite, sinon on arrive trop tard
  resolveId(source) {
    return source.includes("portail.jsx") ? VIDE : null;
  },
  load(id) {
    return id === VIDE ? "export default function(){return null}" : null;
  },
};
