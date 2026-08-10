import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

/* Le numero de version affiche dans Reglages repond a une question posee
   depuis le telephone, au magasin : « est-ce que j'ai bien la derniere ? ».
   Le numero de `package.json` seul n'y suffirait pas — il bouge rarement —
   d'ou la date du build et le commit, qui bougent a chaque publication.

   Grave ici plutot que dans chaque script de build : `dev`, `solo` et `pages`
   passent tous par ce fichier, aucun ne peut l'oublier. */
const paquet = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));

const commit = (() => {
  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString().trim();
  } catch {
    return ""; // pas de depot : archive telechargee, dossier recopie
  }
})();

const VERSION = { numero: paquet.version, date: new Date().toISOString(), commit };

export default defineConfig({
  // Chemins relatifs : le site fonctionne a la racine d'un domaine comme dans
  // un sous-dossier (github.io/popott/), sans rien changer.
  base: "./",
  plugins: [react()],
  define: { __POPOTT_VERSION__: JSON.stringify(VERSION) },
  server: {
    host: true, // accessible depuis le telephone sur le meme reseau
    port: 5173,
  },
});
