/* ==========================================================================
   Popott — build en fichier unique

   Produit un HTML autonome : React, l'application, les jetons et les styles
   sont tous dedans. Aucun serveur, aucun reseau, aucun module ES — donc il
   s'ouvre d'un double-clic, y compris depuis une cle USB.

   Deux usages, deux modes :

     npm run solo              → dist-solo/popott.html
       Pour montrer l'application. Pas de synchronisation : le portail est
       remplace par un module vide au moment du build — laisse tel quel,
       l'import dynamique tirerait le client Supabase dans le fichier et le
       ferait doubler de taille pour rien.

     node scripts/solo.mjs --portail   → dist-verif/popott.html
       Pour la verification seule, jamais publie. Le site en ligne est
       construit par `vite build` en modules ES, que jsdom ne sait pas
       executer : sans cette variante en un seul fichier, l'ecran de connexion
       ne serait smoke-teste nulle part. Or c'est le premier ecran que voit
       quiconque ouvre le site.
   ========================================================================== */

import { build, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { sansPortail } from "./sans-portail.mjs";

const avecPortail = process.argv.includes("--portail");

const ici = dirname(fileURLToPath(import.meta.url));
const racine = resolve(ici, "..");
const tmp = resolve(racine, ".solo-tmp");
const dossier = avecPortail ? "dist-verif" : "dist-solo";
const sortie = resolve(racine, dossier);

/* Le mode portail a besoin des vraies variables ; le mode solo doit les
   ignorer, sans quoi un `.env` local suffirait a le brancher au reseau. */
const env = avecPortail ? loadEnv("production", racine, "VITE_") : {};

if (avecPortail && !(env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY)) {
  console.error("solo --portail : VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY absentes.");
  console.error("Sans elles, le build rendrait l'application et non l'ecran de connexion.");
  process.exit(1);
}

rmSync(tmp, { recursive: true, force: true });

await build({
  root: racine,
  logLevel: "warn",
  plugins: avecPortail ? [react()] : [react(), sansPortail],
  envPrefix: avecPortail ? "VITE_" : "AUCUN_",
  publicDir: false, // ne pas recopier public/ dans le dossier temporaire
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
console.log(`${dossier}/popott.html — ${ko} ko, autonome${avecPortail ? ", avec portail (verification seule)" : ""}`);
