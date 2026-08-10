/* ==========================================================================
   Popott — verification de la fusion

   La fusion est la seule piece de la synchronisation qui puisse perdre des
   donnees en silence. Elle n'a pas d'interface : on ne verra pas le bug a
   l'ecran, on verra un plat disparu trois jours plus tard. D'ou ces cas.

   Usage : node scripts/verifier-fusion.mjs   (inclus dans `npm run verif`)
   ========================================================================== */

import { fusionner, fusionnerJSON } from "../src/fusion.js";

let echecs = 0;

function cas(titre, obtenu, attendu) {
  const a = JSON.stringify(attendu);
  const o = JSON.stringify(obtenu);
  if (a === o) {
    console.log(`  ok   ${titre}`);
  } else {
    echecs++;
    console.log(`  ECHEC ${titre}`);
    console.log(`        attendu : ${a}`);
    console.log(`        obtenu  : ${o}`);
  }
}

console.log("\nFusion a trois voies\n");

/* --- Les cas triviaux, qui doivent court-circuiter --- */

cas("personne n'a bouge",
  fusionner({ a: 1 }, { a: 1 }, { a: 1 }),
  { a: 1 });

cas("moi seul ai bouge",
  fusionner({ a: 1 }, { a: 2 }, { a: 1 }),
  { a: 2 });

cas("lui seul a bouge",
  fusionner({ a: 1 }, { a: 1 }, { a: 2 }),
  { a: 2 });

/* --- Le cas qui motive tout : chacun coche ses cases --- */

cas("cases cochees des deux cotes, sans recouvrement",
  fusionner(
    { etats: {} },
    { etats: { "ing:tomate": "done" } },
    { etats: { "ing:pain": "done" } }),
  { etats: { "ing:pain": "done", "ing:tomate": "done" } });

cas("meme case cochee des deux cotes",
  fusionner(
    { etats: {} },
    { etats: { "ing:pain": "done" } },
    { etats: { "ing:pain": "done" } }),
  { etats: { "ing:pain": "done" } });

cas("je decoche ce qu'il n'a pas touche",
  fusionner(
    { etats: { "ing:pain": "done", "ing:lait": "done" } },
    { etats: { "ing:lait": "done" } },
    { etats: { "ing:pain": "done", "ing:lait": "done" } }),
  { etats: { "ing:lait": "done" } });

/* --- Collections appariees par id --- */

const p = (id, nom) => ({ id, nom });

// Mon ajout se replace derriere le voisin qu'il suivait chez moi, et non
// en fin de liste : l'ordre d'un repas est l'ordre du service.
cas("chacun ajoute un plat",
  fusionner(
    { plats: [p("p1", "Dahl")] },
    { plats: [p("p1", "Dahl"), p("p2", "Gratin")] },
    { plats: [p("p1", "Dahl"), p("p3", "Soupe")] }),
  { plats: [p("p1", "Dahl"), p("p2", "Gratin"), p("p3", "Soupe")] });

cas("je renomme un plat, il en ajoute un autre",
  fusionner(
    { plats: [p("p1", "Dahl")] },
    { plats: [p("p1", "Dahl de corail")] },
    { plats: [p("p1", "Dahl"), p("p2", "Soupe")] }),
  { plats: [p("p1", "Dahl de corail"), p("p2", "Soupe")] });

cas("je supprime un plat qu'il n'a pas touche",
  fusionner(
    { plats: [p("p1", "Dahl"), p("p2", "Soupe")] },
    { plats: [p("p1", "Dahl")] },
    { plats: [p("p1", "Dahl"), p("p2", "Soupe")] }),
  { plats: [p("p1", "Dahl")] });

cas("je supprime un plat qu'il vient de modifier : on le garde",
  fusionner(
    { plats: [p("p1", "Dahl"), p("p2", "Soupe")] },
    { plats: [p("p1", "Dahl")] },
    { plats: [p("p1", "Dahl"), p("p2", "Soupe de potiron")] }),
  { plats: [p("p1", "Dahl"), p("p2", "Soupe de potiron")] });

cas("il supprime un plat, je ne l'avais pas touche",
  fusionner(
    { plats: [p("p1", "Dahl"), p("p2", "Soupe")] },
    { plats: [p("p1", "Dahl"), p("p2", "Soupe"), p("p3", "Riz")] },
    { plats: [p("p1", "Dahl")] }),
  { plats: [p("p1", "Dahl"), p("p3", "Riz")] });

cas("modification en profondeur : deux lignes d'un meme plat",
  fusionner(
    { plats: [{ id: "p1", nom: "Dahl", lignes: [{ id: "l1", qte: 200 }, { id: "l2", qte: 100 }] }] },
    { plats: [{ id: "p1", nom: "Dahl", lignes: [{ id: "l1", qte: 250 }, { id: "l2", qte: 100 }] }] },
    { plats: [{ id: "p1", nom: "Dahl", lignes: [{ id: "l1", qte: 200 }, { id: "l2", qte: 150 }] }] }),
  { plats: [{ id: "p1", nom: "Dahl", lignes: [{ id: "l1", qte: 250 }, { id: "l2", qte: 150 }] }] });

/* --- Listes de valeurs simples : rien a apparier, le dernier geste passe --- */

cas("listes de chaines modifiees des deux cotes : la mienne passe",
  fusionner(
    { tags: ["vege"] },
    { tags: ["vege", "rapide"] },
    { tags: ["vege", "enfant"] }),
  { tags: ["vege", "rapide"] });

cas("liste de chaines videe d'un cote",
  fusionner(
    { convives: ["u1", "u2"] },
    { convives: [] },
    { convives: ["u1", "u2", "u3"] }),
  { convives: [] });

/* --- Cas limites --- */

cas("collection videe d'un cote, enrichie de l'autre",
  fusionner(
    { plats: [p("p1", "Dahl")] },
    { plats: [] },
    { plats: [p("p1", "Dahl"), p("p2", "Soupe")] }),
  { plats: [p("p2", "Soupe")] });

cas("sans base commune, le serveur fait foi",
  fusionner(undefined, { a: 1 }, { a: 2 }),
  { a: 2 });

cas("champ nouveau des deux cotes, valeurs differentes",
  fusionner({}, { presets: [] }, { presets: [{ id: "s1" }] }),
  { presets: [{ id: "s1" }] });

/* --- L'enveloppe JSON --- */

cas("fusionnerJSON rend une chaine fusionnee",
  JSON.parse(fusionnerJSON(
    JSON.stringify({ etats: {} }),
    JSON.stringify({ etats: { a: "done" } }),
    JSON.stringify({ etats: { b: "done" } }))),
  { etats: { b: "done", a: "done" } });

cas("fusionnerJSON tolere un distant illisible",
  fusionnerJSON("{}", '{"a":1}', "pas du json"),
  '{"a":1}');

/* --- Une passe sur un document de la forme reelle du proto --- */

const doc = (etats, plats) => ({
  v: 1,
  rayons: [{ id: "r1", nom: "Fruits & legumes" }],
  ingredients: [{ id: "i0", nom: "Tomate", rayonId: "r1" }],
  plats,
  personnes: [{ id: "u1", nom: "Papa" }],
  repas: [{ id: "m1", date: "2026-08-10", platIds: ["p1"], convives: ["u1"], ajust: [] }],
  creneaux: [{ id: "c1", nom: "Midi", portee: "jour" }],
  categories: ["plat"],
  tags: ["vege"],
  presets: [],
  manuels: [],
  etats,
});

const enMagasin = doc({ "ing:i0": "done" }, [p("p1", "Dahl")]);
const aLaMaison = doc({}, [p("p1", "Dahl"), p("p2", "Gratin")]);
const fusionne = fusionner(doc({}, [p("p1", "Dahl")]), enMagasin, aLaMaison);

cas("document complet : la case cochee survit",
  fusionne.etats,
  { "ing:i0": "done" });

cas("document complet : le plat ajoute survit",
  fusionne.plats.map((x) => x.id),
  ["p1", "p2"]);

console.log("");
if (echecs > 0) {
  console.log(`${echecs} cas en echec.\n`);
  process.exit(1);
}
console.log("Fusion : tous les cas passent.\n");
