/* ==========================================================================
   Popott — verification de fumee

   Charge un fichier HTML construit dans un DOM simule et verifie que
   l'application se monte vraiment. Ecrit apres une livraison sur page
   blanche : le build reussissait, le fichier etait valide, et rien ne
   s'affichait. Une compilation qui passe ne prouve pas qu'une application
   demarre.

   Deux fichiers a controler, et ils ne doivent pas montrer la meme chose :

     dist-solo/popott.html    toujours l'application, sans compte ni reseau
     dist-verif/popott.html   l'ecran de connexion, synchronisation branchee

   Les deux sont des fichiers uniques produits par `solo.mjs` : jsdom ne sait
   pas executer les modules ES du vrai `dist/`, que controle a sa maniere
   `verifier-publication.mjs`.

   Usage : node scripts/verifier.mjs [chemin] [--portail]
           npm run verif   (tout : fusion, les deux rendus, la publication)
   ========================================================================== */

import { JSDOM } from "jsdom";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ici = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const portailAdmis = args.includes("--portail");
const chemin = args.find((a) => !a.startsWith("--")) || "../dist-solo/popott.html";

const fichier = resolve(ici, chemin);
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

  const application = onglets === 4 && plats > 0 && logo;
  // Le portail se reconnait a sa colonne : un ecran de compte, pas l'appli.
  const portail = rendu.includes("pop-auth__colonne") && logo;

  const ok = application || (portailAdmis && portail);
  const quoi = application ? "application" : portail ? "portail de connexion" : "RIEN";

  console.log(`${ok ? "ok  " : "ECHEC"} ${chemin} sur ${url} — ${quoi}`
    + (application ? ` (${onglets} onglets, ${plats} plats)` : ""));
  if (!ok) echec = true;
  dom.window.close();
}

process.exit(echec ? 1 : 0);
