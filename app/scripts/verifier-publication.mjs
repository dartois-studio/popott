/* ==========================================================================
   Popott — controle de ce qui part en ligne

   `verifier.mjs` regarde si l'application s'affiche. Celui-ci regarde le
   dossier `dist/` tel qu'il sera servi, et cherche les trois pannes qui ne se
   voient qu'apres la publication — trop tard, donc.

     1. Un chemin absolu. Le site vit dans un sous-dossier (/popott/) : un
        `/assets/...` marche en developpement et fait une page blanche en
        ligne. D'ou `base: "./"` dans vite.config.js, verifie ici.

     2. La synchronisation absente. Elle est gravee dans le fascicule au
        moment du build, depuis les variables d'environnement. Si elles
        manquent, le site se construit tres bien — et chaque telephone
        repart dans son coin, sans compte ni foyer. C'est arrive.

     3. La PWA incomplete. Sans manifeste ni icones, pas d'installation sur
        l'ecran d'accueil.

   Usage : node scripts/verifier-publication.mjs   (apres `vite build`)
   ========================================================================== */

import { loadEnv } from "vite";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ici = dirname(fileURLToPath(import.meta.url));
const racine = resolve(ici, "..");
const dist = resolve(racine, "dist");
// Meme source que le build : le `.env` local ici, les secrets sur GitHub.
const env = loadEnv("production", racine, "VITE_");

let echec = false;
const ok = (m) => console.log(`ok    ${m}`);
const ko = (m) => { console.error(`ECHEC ${m}`); echec = true; };

if (!existsSync(`${dist}/index.html`)) {
  ko("dist/index.html est absent — lancer `vite build` avant ce controle.");
  process.exit(1);
}

const html = readFileSync(`${dist}/index.html`, "utf8");

/* 1. Chemins relatifs */
const absolus = [...html.matchAll(/(?:src|href)="(\/[^"]*)"/g)].map((m) => m[1]);
if (absolus.length) ko(`chemin absolu dans index.html : ${absolus.join(", ")} — le site casse dans /popott/`);
else ok("tous les chemins sont relatifs");

/* 2. Synchronisation gravee */
const fascicules = [...html.matchAll(/(?:src|href)="\.\/(assets\/[^"]+)"/g)].map((m) => m[1]);
if (!fascicules.length) ko("index.html ne charge aucun fascicule depuis ./assets/");

const code = fascicules
  .filter((f) => f.endsWith(".js"))
  .map((f) => (existsSync(`${dist}/${f}`) ? readFileSync(`${dist}/${f}`, "utf8") : ""))
  .join("");

const attendue = (env.VITE_SUPABASE_URL || "").trim();
if (!attendue) {
  ko("VITE_SUPABASE_URL absente du build : le site publie n'aurait ni compte ni foyer partage.");
} else if (!code.includes(attendue)) {
  ko(`VITE_SUPABASE_URL fournie mais absente du fascicule : la synchronisation ne serait pas branchee.`);
} else {
  ok("synchronisation gravee dans le fascicule");
}

/* 3. PWA */
let pwa = true;
for (const f of ["manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png"]) {
  if (!existsSync(`${dist}/${f}`)) { ko(`${f} manquant : l'installation sur l'ecran d'accueil ne marchera pas`); pwa = false; }
}
if (!html.includes("manifest.webmanifest")) { ko("index.html ne declare pas le manifeste"); pwa = false; }
if (pwa) ok("manifeste et icones en place");

if (existsSync(`${dist}/assets`)) {
  const poids = readdirSync(`${dist}/assets`).reduce((n, f) => n + readFileSync(`${dist}/assets/${f}`).length, 0);
  console.log(`      dist/ — ${Math.round(poids / 1024)} ko de fascicules`);
}

process.exit(echec ? 1 : 0);
