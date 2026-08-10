/* ==========================================================================
   Popott — empreinte de rendu

   Charge un `popott.html` autonome, monte l'application, parcourt les quatre
   onglets puis ouvre un a un les panneaux atteignables, et ecrit le DOM de
   chaque etat dans un fichier JSON.

   Deux empreintes prises de part et d'autre d'un remaniement se comparent
   caractere par caractere : c'est ce qui permet d'affirmer « sans changer un
   pixel » autrement que de memoire. Elle a deja rattrape un import manquant
   qui compilait sans broncher et cassait a l'execution.

   Usage : node scripts/empreinte.mjs <popott.html> <sortie.json>
           node scripts/empreinte.mjs a.json b.json --comparer
   ========================================================================== */
import { JSDOM } from "jsdom";
import { readFileSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2);

/* ------------------------------------------------------------ comparaison -- */
if (args.includes("--comparer")) {
  const [x, y] = args.filter((a) => !a.startsWith("--"));
  const a = JSON.parse(readFileSync(x, "utf8"));
  const b = JSON.parse(readFileSync(y, "utf8"));
  /* On compare les erreurs plutot que d'en exiger zero : jsdom en produit une
     poignee qui n'appartiennent pas a l'application (navigation non
     implementee, par exemple). Ce qui compte est qu'il n'y en ait pas de
     nouvelle. */
  const memesErreurs = JSON.stringify(a.erreurs) === JSON.stringify(b.erreurs);
  let ok = memesErreurs;
  console.log(`erreurs JS       : ${a.erreurs.length} avant, ${b.erreurs.length} apres` + (memesErreurs ? " (les memes)" : " — DIFFERENTES"));
  console.log(`feuille de style : ${a.style === b.style ? `identique (${a.style.length} car.)` : "DIFFERENTE"}`);
  if (a.style !== b.style) ok = false;

  const clefs = [...new Set([...Object.keys(a.etats), ...Object.keys(b.etats)])];
  let pareils = 0;
  for (const k of clefs) {
    if (a.etats[k] === b.etats[k]) { pareils++; continue; }
    ok = false;
    const u = a.etats[k] || "", v = b.etats[k] || "";
    let i = 0; while (u[i] === v[i]) i++;
    console.log(`  DIFFERENT : ${k} — au caractere ${i}`);
    console.log(`    avant : ${JSON.stringify(u.slice(Math.max(0, i - 60), i + 60))}`);
    console.log(`    apres : ${JSON.stringify(v.slice(Math.max(0, i - 60), i + 60))}`);
  }
  console.log(`etats identiques : ${pareils}/${clefs.length}`);
  console.log(ok ? "\n>>> RENDU IDENTIQUE" : "\n>>> DIFFERENCES");
  process.exit(ok ? 0 : 1);
}

/* --------------------------------------------------------------- capture -- */
const [fichier, sortie] = args.filter((a) => !a.startsWith("--"));
const html = readFileSync(fichier, "utf8");

const dom = new JSDOM(html, { runScripts: "dangerously", pretendToBeVisual: true, url: "https://exemple.test/" });
const erreurs = [];
dom.virtualConsole.on("jsdomError", (e) => erreurs.push(e.message));

/* jsdom n'implemente ni alert ni confirm : sans ces bouchons, chaque clic sur
   une action destructrice remonterait une fausse erreur. `confirm` repond non,
   pour que le parcours n'efface pas les donnees qu'il est cense observer. */
dom.window.alert = () => {};
dom.window.confirm = () => false;
dom.window.prompt = () => null;
/* Present dans tout navigateur, absent de jsdom : l'application s'en sert a
   chaque ecriture du document (`up`). Sans ce relais, le parcours s'arrete au
   premier clic qui modifie quoi que ce soit. */
dom.window.structuredClone = structuredClone;

const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
await attendre(1500);

const doc = dom.window.document;
const racine = doc.getElementById("root");

/* Deux choses bougent d'un rendu a l'autre sans que le code ait change : les
   uid, tires au hasard a chaque montage, et l'horodatage de build grave par
   vite.config.js. Sans neutralisation, la comparaison crie a chaque fois. */
const stabiliser = (s) => s
  .replace(/\b[a-z0-9]{7}\b/g, (m) => (/\d/.test(m) && /[a-z]/.test(m) ? "UID" : m))
  .replace(/Publiée le [^<·]*·/g, "Publiée le DATE ·");

const empreinte = { erreurs, style: "", etats: {} };
empreinte.style = [...doc.querySelectorAll("style")].map((s) => s.textContent).join("\n/* --- */\n");

const clic = async (el, ms = 300) => {
  el.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  await attendre(ms);
};
const panneau = () => doc.querySelector(".sheet");
const fermer = async () => {
  for (let i = 0; i < 4 && panneau(); i++) {
    const x = panneau().querySelector(".sheet-h button:last-of-type") || panneau().querySelector("button");
    if (!x) break;
    await clic(x, 250);
  }
};

const onglets = () => [...racine.querySelectorAll("button")].filter((b) => b.querySelector(".lb"));
empreinte.etats["0 · au chargement"] = stabiliser(racine.innerHTML);

for (const [n, bo] of onglets().entries()) {
  const nom = bo.querySelector(".lb").textContent.trim();
  await clic(bo);
  empreinte.etats[`${n + 1} · ${nom}`] = stabiliser(racine.innerHTML);

  /* Les boutons de l'ecran, hors barre d'onglets : chacun est essaye, et l'on
     ne retient que ceux qui ouvrent vraiment un panneau. */
  const boutons = [...racine.querySelectorAll("button")].filter((b) => !b.querySelector(".lb"));
  for (const [i, b] of boutons.entries()) {
    if (!b.isConnected) continue;
    await clic(b);
    if (panneau()) {
      const titre = panneau().querySelector("h2")?.textContent.trim() || `bouton ${i}`;
      empreinte.etats[`${n + 1}.${i} · ${nom} → ${titre}`] = stabiliser(panneau().outerHTML);
      await fermer();
    }
    if (panneau()) await fermer();
  }
  await clic(bo); // retour a l'ecran nu avant l'onglet suivant
}

writeFileSync(sortie, JSON.stringify(empreinte, null, 2));
console.log(`${fichier}`);
console.log(`  erreurs JS : ${erreurs.length}`);
console.log(`  style      : ${empreinte.style.length} car.`);
console.log(`  etats      : ${Object.keys(empreinte.etats).length}`);
for (const k of Object.keys(empreinte.etats)) console.log(`    ${k} (${empreinte.etats[k].length} car.)`);
dom.window.close();
