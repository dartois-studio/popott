/* ==========================================================================
   Popott — build « pages »

   Regenere `index.html` a la racine du depot : c'est le fichier que GitHub
   Pages sert reellement sur https://dartois.studio/popott/ — la source est la
   branche, pas le workflow Actions.

   Meme technique que `npm run solo` — tout dans un fichier, aucun module ES,
   aucun chemin absolu — avec deux differences qui comptent :

     • le portail de synchronisation est inclus (solo le retire) ;
     • les variables VITE_SUPABASE_* sont lues et gravees dans le fichier.

   Sans ces variables au moment du build, le fichier publie fonctionne, mais
   en stockage local seul : chaque appareil dans son coin. Le script le dit
   plutot que de laisser la surprise pour apres le push.

   Usage : npm run pages   →   ../index.html
   ========================================================================== */

import { build, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync, writeFileSync, rmSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { sansPortail } from "./sans-portail.mjs";

const ici = dirname(fileURLToPath(import.meta.url));
const racine = resolve(ici, "..");
const depot = resolve(racine, "..");
const tmp = resolve(racine, ".pages-tmp");

const env = loadEnv("production", racine, "VITE_");
const synchro = Boolean(env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY);

rmSync(tmp, { recursive: true, force: true });

await build({
  root: racine,
  logLevel: "warn",
  // Sans configuration, le portail ne servira a rien : autant ne pas graver
  // 230 ko de client Supabase dans un fichier qui restera local.
  plugins: synchro ? [react()] : [react(), sansPortail],
  publicDir: false,
  define: {
    // En mode lib, Vite ne substitue ni NODE_ENV ni import.meta.env : sans ces
    // trois lignes, React s'ouvre sur une page blanche et la synchronisation
    // ne se voit pas configuree.
    "process.env.NODE_ENV": JSON.stringify("production"),
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(env.VITE_SUPABASE_URL || ""),
    "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(env.VITE_SUPABASE_ANON_KEY || ""),
  },
  build: {
    outDir: tmp,
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: {
      entry: resolve(racine, "src/main.jsx"),
      name: "Popott",
      formats: ["iife"], // pas de module ES : un seul fichier, aucune requete
      fileName: () => "popott.js",
    },
  },
});

const js = readFileSync(`${tmp}/popott.js`, "utf8");
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

writeFileSync(resolve(depot, "index.html"), html);
rmSync(tmp, { recursive: true, force: true });

const ko = Math.round(Buffer.byteLength(html) / 1024);
console.log(`index.html — ${ko} ko`);
console.log(synchro
  ? `synchronisation : ${env.VITE_SUPABASE_URL}`
  : "synchronisation : ABSENTE — proto/.env manquant ou incomplet, le site publie restera local");
