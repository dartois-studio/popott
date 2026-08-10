/* ==========================================================================
   Popott — build « solo »

   Produit un fichier HTML unique et autonome : React, le proto, les jetons et
   les styles sont tous dedans. Aucun serveur, aucun reseau, aucun module ES —
   donc il s'ouvre d'un double-clic, y compris depuis une cle USB.

   C'est une commodite pour montrer le proto. Pour travailler dessus,
   utiliser `npm run dev` : rechargement a chaud, et le stockage local
   fonctionne de facon fiable.

   Usage : npm run solo   →   dist-solo/popott.html
   ========================================================================== */

import { build } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ici = dirname(fileURLToPath(import.meta.url));
const racine = resolve(ici, "..");
const tmp = resolve(racine, ".solo-tmp");
const sortie = resolve(racine, "dist-solo");

rmSync(tmp, { recursive: true, force: true });

await build({
  root: racine,
  logLevel: "warn",
  plugins: [react()],
  publicDir: false, // ne pas recopier public/ dans le dossier temporaire
  build: {
    outDir: tmp,
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: {
      entry: resolve(racine, "src/main.jsx"),
      name: "Popott",
      formats: ["iife"], // pas de module ES : indispensable pour file://
      fileName: () => "popott.js",
    },
  },
});

const js = readFileSync(`${tmp}/popott.js`, "utf8");
// Vite nomme la feuille d'apres le paquet, pas d'apres fileName.
const nomCss = readdirSync(tmp).find((f) => f.endsWith(".css"));
const css = nomCss ? readFileSync(`${tmp}/${nomCss}`, "utf8") : "";

const html = `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>Popott</title>
    <meta name="theme-color" content="#4A2440" />
    <style>${css}</style>
  </head>
  <body>
    <div id="root"></div>
    <script>${js}</script>
  </body>
</html>
`;

mkdirSync(sortie, { recursive: true });
writeFileSync(`${sortie}/popott.html`, html);
rmSync(tmp, { recursive: true, force: true });

const ko = Math.round(Buffer.byteLength(html) / 1024);
console.log(`dist-solo/popott.html — ${ko} ko, autonome`);
