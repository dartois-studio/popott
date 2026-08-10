/* ==========================================================================
   Popott — verification de fumee

   Charge dist-solo/popott.html dans un DOM simule et verifie que l'application
   se monte vraiment. Ecrit apres une livraison sur page blanche : le build
   reussissait, le fichier etait valide, et rien ne s'affichait.
   Une compilation qui passe ne prouve pas qu'une application demarre.

   Usage : npm run verif   (lance le build solo, puis controle)
   ========================================================================== */

import { JSDOM } from "jsdom";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const fichier = resolve(dirname(fileURLToPath(import.meta.url)), "../dist-solo/popott.html");
const html = readFileSync(fichier, "utf8");

let echec = false;

for (const url of ["https://exemple.test/", "file:///popott.html"]) {
  const dom = new JSDOM(html, { runScripts: "dangerously", pretendToBeVisual: true, url });
  dom.virtualConsole.on("jsdomError", (e) => {
    console.error(`  erreur JS : ${e.message}`);
    echec = true;
  });

  await new Promise((r) => setTimeout(r, 1500));

  const rendu = dom.window.document.getElementById("root").innerHTML;
  const onglets = (rendu.match(/class="lb"/g) || []).length;
  const plats = (rendu.match(/p-nom/g) || []).length;
  const logo = rendu.includes("3349 960");
  const ok = onglets === 4 && plats > 0 && logo;

  console.log(`${ok ? "ok  " : "ECHEC"} ${url} — ${onglets} onglets, ${plats} plats, logo ${logo ? "present" : "absent"}`);
  if (!ok) echec = true;
  dom.window.close();
}

process.exit(echec ? 1 : 0);
