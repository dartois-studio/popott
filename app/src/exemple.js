import { addJ, iso, lundi, uid } from "./outils.js";

/* ==========================================================================
   Le jeu de donnees d'ouverture, et la reprise des documents enregistres
   avant l'ajout des creneaux hebdomadaires.
   ========================================================================== */

export function seed() {
  const rayons = [
    { id: "r1", nom: "Fruits & légumes", couleur: "#4C7A2B" },
    { id: "r2", nom: "Frais", couleur: "#2F6C86" },
    { id: "r3", nom: "Boucherie", couleur: "#9B3A3A" },
    { id: "r4", nom: "Épicerie", couleur: "#A9651B" },
    { id: "r5", nom: "Surgelés", couleur: "#4D63A8" },
    { id: "r6", nom: "Boissons", couleur: "#7A2E52" },
  ];
  const brut = [
    ["Courgette", "r1", "pièce", 0], ["Tomate", "r1", "pièce", 0], ["Oignon", "r1", "pièce", 0],
    ["Ail", "r1", "pièce", 1], ["Pomme de terre", "r1", "g", 0], ["Carotte", "r1", "pièce", 0],
    ["Potiron", "r1", "g", 0], ["Basilic", "r1", "botte", 0], ["Citron", "r1", "pièce", 0],
    ["Pomme", "r1", "pièce", 0], ["Poivron", "r1", "pièce", 0],
    ["Crème fraîche", "r2", "mL", 0], ["Gruyère râpé", "r2", "g", 0], ["Mozzarella", "r2", "g", 0],
    ["Œuf", "r2", "pièce", 0], ["Lait", "r2", "mL", 0], ["Beurre", "r2", "g", 1],
    ["Blanc de poulet", "r3", "g", 0], ["Lardons", "r3", "g", 0],
    ["Lentilles corail", "r4", "g", 0], ["Riz", "r4", "g", 1], ["Pâtes", "r4", "g", 0],
    ["Farine", "r4", "g", 1], ["Huile d'olive", "r4", "mL", 1], ["Sel", "r4", "pincée", 1],
    ["Poivre", "r4", "pincée", 1], ["Lait de coco", "r4", "mL", 0], ["Curry", "r4", "c. à c.", 1],
    ["Sucre", "r4", "g", 1], ["Pignons de pin", "r4", "g", 0], ["Bouillon de légumes", "r4", "pièce", 1],
    ["Petits pois", "r5", "g", 0], ["Jus d'orange", "r6", "L", 0],
    ["Flocons d'avoine", "r4", "g", 0], ["Confiture", "r4", "g", 0], ["Pain", "r4", "pièce", 0],
  ];
  const ingredients = brut.map((x, i) => ({ id: "i" + i, nom: x[0], rayonId: x[1], unite: x[2], garde: !!x[3] }));
  const ref = (n) => ingredients.find((x) => x.nom === n);
  // Le quatrieme argument marque la ligne optionnelle : elle fait partie du
  // plat, elle ne bloque rien et se saute sans regret en magasin.
  const L = (n, q, u, opt) => ({ id: uid(), ingId: ref(n).id, qte: q, unite: u || ref(n).unite, optionnel: !!opt });

  const plats = [
    { id: "p1", nom: "Gratin de courgettes", saison: "ete", cat: "plat", tags: ["végétarien"], portions: 4, lignes: [L("Courgette", 5), L("Crème fraîche", 200), L("Gruyère râpé", 100), L("Oignon", 1), L("Sel", 1), L("Huile d'olive", 20)] },
    { id: "p2", nom: "Dahl de lentilles corail", saison: "hiver", cat: "plat", tags: ["végétarien", "enfant"], portions: 4, lignes: [L("Lentilles corail", 250), L("Lait de coco", 400), L("Oignon", 1), L("Ail", 2), L("Curry", 2), L("Riz", 250)] },
    { id: "p3", nom: "Poulet basquaise", saison: "ete", cat: "plat", tags: [], portions: 4, lignes: [L("Blanc de poulet", 600), L("Poivron", 3), L("Tomate", 4), L("Oignon", 2), L("Riz", 250), L("Huile d'olive", 20)] },
    { id: "p4", nom: "Pâtes au pesto maison", saison: "ete", cat: "plat", tags: ["végétarien", "enfant", "rapide"], portions: 4, lignes: [L("Pâtes", 400), L("Basilic", 1), L("Pignons de pin", 40), L("Ail", 1), L("Huile d'olive", 80), L("Gruyère râpé", 60, "", true)] },
    { id: "p5", nom: "Soupe de potiron", saison: "hiver", cat: "entrée", tags: ["végétarien"], portions: 4, lignes: [L("Potiron", 800), L("Pomme de terre", 200), L("Oignon", 1), L("Crème fraîche", 100), L("Bouillon de légumes", 1)] },
    { id: "p6", nom: "Tomates mozzarella", saison: "ete", cat: "entrée", tags: ["végétarien", "rapide"], portions: 4, lignes: [L("Tomate", 4), L("Mozzarella", 250), L("Basilic", 1), L("Huile d'olive", 30)] },
    { id: "p7", nom: "Crêpes", saison: "toute", cat: "goûter", tags: ["enfant"], portions: 6, lignes: [L("Farine", 300), L("Œuf", 3), L("Lait", 600), L("Beurre", 50), L("Sucre", 40)] },
    { id: "p8", nom: "Tarte aux pommes", saison: "toute", cat: "dessert", tags: ["végétarien"], portions: 6, lignes: [L("Pomme", 5), L("Farine", 250), L("Beurre", 125), L("Sucre", 80), L("Œuf", 1)] },
    { id: "p9", nom: "Quiche lorraine", saison: "toute", cat: "plat", tags: [], portions: 4, lignes: [L("Lardons", 200), L("Œuf", 3), L("Crème fraîche", 200), L("Farine", 250), L("Beurre", 125), L("Gruyère râpé", 80)] },
    { id: "p10", nom: "Purée & petits pois", saison: "hiver", cat: "plat", tags: ["enfant", "végétarien"], portions: 4, lignes: [L("Pomme de terre", 800), L("Lait", 150), L("Beurre", 40), L("Petits pois", 300)] },
    { id: "p12", nom: "Porridge aux fruits", saison: "toute", cat: "petit déj", tags: ["végétarien"], portions: 2, lignes: [L("Flocons d'avoine", 80), L("Lait", 300), L("Pomme", 1)] },
    { id: "p13", nom: "Tartines & confiture", saison: "toute", cat: "petit déj", tags: ["végétarien", "enfant"], portions: 4, lignes: [L("Pain", 1), L("Confiture", 100), L("Beurre", 40)] },
    { id: "p11", nom: "Carottes râpées", saison: "toute", cat: "entrée", tags: ["végétarien", "rapide"], portions: 4, lignes: [L("Carotte", 5), L("Citron", 1), L("Huile d'olive", 30)] },
  ];

  const personnes = [
    { id: "u1", nom: "Papa", regime: "standard", notes: "" },
    { id: "u2", nom: "Maman", regime: "végétarien", notes: "" },
    { id: "u3", nom: "Léa", regime: "enfant", notes: "N'aime pas la crème" },
  ];
  const l = lundi(new Date());
  const tous = personnes.map((p) => p.id);
  const repas = [
    { id: uid(), date: iso(l), creneauId: "c2", platIds: ["p5", "p9"], convives: tous, ajust: [] },
    { id: uid(), date: iso(addJ(l, 1)), creneauId: "c2", platIds: ["p2"], convives: tous, ajust: [{ id: uid(), personneId: "u1", type: "add", ingId: ref("Blanc de poulet").id, qte: 150, unite: "g" }] },
    { id: uid(), date: iso(addJ(l, 2)), creneauId: "c1", platIds: ["p4"], convives: ["u2", "u3"], ajust: [] },
    { id: uid(), date: iso(l), creneauId: "c0", platIds: ["p12", "p13"], convives: tous, repetitions: 7, ajust: [] },
    { id: uid(), date: iso(l), creneauId: "c3", platIds: ["p7"], convives: tous, repetitions: 2, ajust: [] },
    { id: uid(), date: iso(addJ(l, 3)), creneauId: "c2", platIds: ["p1"], convives: tous, ajust: [{ id: uid(), personneId: "u3", type: "remove", ingId: ref("Crème fraîche").id, qte: 0, unite: "mL" }] },
    { id: uid(), date: iso(addJ(l, 5)), creneauId: "c2", platIds: ["p6", "p3", "p8"], convives: tous, ajust: [] },
  ];

  return {
    v: 1, nomFoyer: "À la maison", rayons, ingredients, plats, personnes, repas,
    creneaux: [
      { id: "c0", nom: "Petit déjeuner", portee: "semaine" },
      { id: "c1", nom: "Midi", portee: "jour" },
      { id: "c2", nom: "Soir", portee: "jour" },
      { id: "c3", nom: "Goûter", portee: "semaine" },
      { id: "c6", nom: "Dessert", portee: "semaine" },
      { id: "c4", nom: "Apéro", portee: "semaine" },
      { id: "c5", nom: "Extra", portee: "semaine" },
    ],
    categories: ["petit déj", "entrée", "plat", "dessert", "goûter", "apéro", "extra"],
    tags: ["végétarien", "enfant", "sans lactose", "rapide"],
    presets: [],
    manuels: [{ id: uid(), libelle: "Sacs poubelle", qte: 1, unite: "pièce", rayonId: "r4", etat: "todo" }],
    etats: {},
  };
}

/* Reprise des données enregistrées avant l'ajout des créneaux hebdomadaires */
export function migrer(d) {
  d.creneaux.forEach((c) => {
    if (!c.portee) c.portee = (c.id === "c1" || c.id === "c2") ? "jour" : "semaine";
  });
  if (!d.creneaux.some((c) => c.nom.toLowerCase().startsWith("petit"))) {
    d.creneaux.unshift({ id: "c0", nom: "Petit déjeuner", portee: "semaine" });
  }
  if (!d.categories.some((c) => c.toLowerCase().startsWith("petit"))) d.categories.unshift("petit déj");
  if (!d.creneaux.some((c) => c.nom.toLowerCase().startsWith("dessert"))) {
    const k = d.creneaux.findIndex((c) => c.nom.toLowerCase().startsWith("goût"));
    d.creneaux.splice(k < 0 ? d.creneaux.length : k + 1, 0, { id: "c6", nom: "Dessert", portee: "semaine" });
  }
  d.repas.forEach((r) => { if (!r.repetitions) r.repetitions = 1; });
  d.plats.forEach((p) => { if (!p.saison) p.saison = "toute"; });
  if (!d.presets) d.presets = [];
  if (typeof d.nomFoyer !== "string") d.nomFoyer = "";
  return d;
}
