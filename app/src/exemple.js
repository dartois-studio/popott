import { addJ, iso, lundi, uid } from "./outils.js";

/* ==========================================================================
   Le jeu de donnees d'ouverture, et la reprise des documents enregistres
   avant l'ajout des creneaux hebdomadaires.

   Les 82 plats viennent de la liste du foyer (liste_des_plats_popott.md).
   Les variantes y sont des plats a part entiere : le modele ne connait pas
   la notion de declinaison, et « Quiche aux epinards » ne se fait pas avec
   la meme liste de courses que « Quiche poireaux-champignons ».

   Les quantites sont deduites du nom du plat, pour quatre personnes. Elles
   amorcent la fiche, elles ne la remplacent pas : c'est en cuisinant qu'on
   les corrige.
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
    ["Ail", "r1", "pièce", 1], ["Aubergine", "r1", "pièce", 0], ["Brocoli", "r1", "g", 0],
    ["Butternut", "r1", "pièce", 0], ["Carotte", "r1", "pièce", 0], ["Champignon de Paris", "r1", "g", 0],
    ["Chou frisé", "r1", "g", 0], ["Chou rouge", "r1", "g", 0], ["Chou-fleur", "r1", "pièce", 0],
    ["Citron", "r1", "pièce", 0], ["Concombre", "r1", "pièce", 0], ["Coriandre", "r1", "botte", 0],
    ["Courgette", "r1", "pièce", 0], ["Échalote", "r1", "pièce", 0], ["Épinards", "r1", "g", 0],
    ["Gingembre", "r1", "pièce", 1], ["Haricots plats", "r1", "g", 0], ["Haricots verts", "r1", "g", 0],
    ["Oignon", "r1", "pièce", 0], ["Oignon rouge", "r1", "pièce", 0], ["Patate douce", "r1", "g", 0],
    ["Poireau", "r1", "pièce", 0], ["Poivron", "r1", "pièce", 0], ["Pomme de terre", "r1", "g", 0],
    ["Potimarron", "r1", "pièce", 0], ["Rhubarbe", "r1", "g", 0], ["Roquette", "r1", "g", 0],
    ["Tomate", "r1", "pièce", 0],

    ["Beurre", "r2", "g", 1], ["Crème fraîche", "r2", "mL", 0], ["Feta", "r2", "g", 0],
    ["Gnocchi", "r2", "g", 0], ["Gruyère râpé", "r2", "g", 0], ["Jambon végé", "r2", "g", 0],
    ["Lait", "r2", "mL", 0], ["Lardons végé", "r2", "g", 0], ["Œuf", "r2", "pièce", 0],
    ["Paneer", "r2", "g", 0], ["Parmesan", "r2", "g", 0], ["Pâte brisée", "r2", "pièce", 0],
    ["Pâte feuilletée", "r2", "pièce", 0], ["Raviolis", "r2", "g", 0], ["Reblochon", "r2", "pièce", 0],
    ["Saucisse végé", "r2", "pièce", 0], ["Seitan", "r2", "g", 0], ["Tempeh", "r2", "g", 0],
    ["Tofu ail des ours", "r2", "g", 0], ["Tofu fumé", "r2", "g", 0], ["Tofu nature", "r2", "g", 0],
    ["Tofu soyeux", "r2", "g", 0],

    ["Bouillon de légumes", "r4", "pièce", 1], ["Coquillettes", "r4", "g", 0], ["Cumin", "r4", "c. à c.", 1],
    ["Curcuma", "r4", "c. à c.", 1], ["Curry", "r4", "c. à c.", 1], ["Épices fajitas", "r4", "c. à c.", 1],
    ["Épices tikka masala", "r4", "c. à c.", 1], ["Farine", "r4", "g", 1], ["Farine de sarrasin", "r4", "g", 0],
    ["Graines de sésame", "r4", "g", 1], ["Haricots blancs", "r4", "g", 0], ["Haricots noirs", "r4", "g", 0],
    ["Haricots rouges", "r4", "g", 0], ["Huile d'olive", "r4", "mL", 1], ["Jackfruit", "r4", "g", 0],
    ["Lait de coco", "r4", "mL", 0], ["Lentilles corail", "r4", "g", 0], ["Lentilles vertes", "r4", "g", 0],
    ["Maïs", "r4", "g", 0], ["Moutarde", "r4", "c. à c.", 1], ["Olives", "r4", "g", 0],
    ["Orecchiette", "r4", "g", 0], ["Orzo", "r4", "g", 0], ["Pain", "r4", "pièce", 0],
    ["Pain de mie", "r4", "pièce", 0], ["Paprika", "r4", "c. à c.", 1], ["Pâtes", "r4", "g", 0],
    ["Petit épeautre", "r4", "g", 0], ["Pita", "r4", "pièce", 0], ["Plaques de lasagnes", "r4", "g", 0],
    ["Pois cassés", "r4", "g", 0], ["Pois chiches", "r4", "g", 0], ["Poivre", "r4", "pincée", 1],
    ["Protéines de soja", "r4", "g", 0], ["Quinoa", "r4", "g", 0], ["Ras el-hanout", "r4", "c. à c.", 1],
    ["Riz", "r4", "g", 1], ["Riz arborio", "r4", "g", 0], ["Sauce saté", "r4", "g", 0],
    ["Sauce soja", "r4", "mL", 1], ["Sel", "r4", "pincée", 1], ["Semoule de couscous", "r4", "g", 0],
    ["Sirop d'érable", "r4", "mL", 1], ["Sucre", "r4", "g", 1], ["Tahini", "r4", "g", 0],
    ["Tomates concassées", "r4", "g", 0], ["Tomates séchées", "r4", "g", 0], ["Tortillas", "r4", "pièce", 0],
    ["Vinaigre balsamique", "r4", "mL", 1],

    ["Panés végé", "r5", "pièce", 0], ["Petits pois", "r5", "g", 0],
  ];
  const ingredients = brut.map((x, i) => ({ id: "i" + i, nom: x[0], rayonId: x[1], unite: x[2], garde: !!x[3] }));
  const ref = (n) => ingredients.find((x) => x.nom === n);
  // Le quatrieme argument marque la ligne optionnelle : elle fait partie du
  // plat, elle ne bloque rien et se saute sans regret en magasin.
  const L = (n, q, u, opt) => ({ id: uid(), ingId: ref(n).id, qte: q, unite: u || ref(n).unite, optionnel: !!opt });
  // Tous ces plats sont vegetariens : le tag est pose partout plutot que nulle part.
  const P = (id, nom, saison, lignes, cat, portions) =>
    ({ id, nom, saison, cat: cat || "plat", tags: ["végétarien"], portions: portions || 4, lignes });

  const plats = [
    P("p1", "Bolognaise au seitan", "toute", [L("Seitan", 300), L("Tomates concassées", 400), L("Oignon", 1), L("Carotte", 1), L("Ail", 2), L("Pâtes", 400), L("Huile d'olive", 20)]),
    P("p2", "Bolognaise de lentilles, sauce tomate", "toute", [L("Lentilles vertes", 200), L("Tomates concassées", 400), L("Oignon", 1), L("Carotte", 1), L("Ail", 2), L("Pâtes", 400)]),
    P("p3", "Bowl quinoa + tempeh laqué + petits pois + carottes râpées", "toute", [L("Quinoa", 250), L("Tempeh", 250), L("Sauce soja", 40), L("Sirop d'érable", 20), L("Petits pois", 200), L("Carotte", 3)]),
    P("p4", "Bowl quinoa, concombre, chou rouge, pois chiches, maïs", "ete", [L("Quinoa", 250), L("Concombre", 1), L("Chou rouge", 300), L("Pois chiches", 400), L("Maïs", 150), L("Huile d'olive", 30)]),
    P("p5", "Brocoli", "toute", [L("Brocoli", 800), L("Huile d'olive", 20), L("Ail", 1)]),
    P("p6", "Brocoli à l'asiatique", "toute", [L("Brocoli", 800), L("Sauce soja", 40), L("Ail", 2), L("Gingembre", 1), L("Graines de sésame", 10), L("Riz", 250)]),
    P("p7", "Brocoli sauce saté", "toute", [L("Brocoli", 800), L("Sauce saté", 100), L("Riz", 250)]),

    P("p8", "Coquillettes au jambon végé", "toute", [L("Coquillettes", 400), L("Jambon végé", 150), L("Crème fraîche", 200), L("Gruyère râpé", 60, "", true)]),
    P("p9", "Couscous", "toute", [L("Semoule de couscous", 300), L("Pois chiches", 400), L("Carotte", 3), L("Courgette", 2), L("Ras el-hanout", 2), L("Bouillon de légumes", 1)]),
    P("p10", "Couscous carotte-courgette", "ete", [L("Semoule de couscous", 300), L("Carotte", 4), L("Courgette", 3), L("Pois chiches", 400), L("Ras el-hanout", 2), L("Bouillon de légumes", 1)]),
    P("p11", "Crêpes aux poireaux", "hiver", [L("Farine", 300), L("Œuf", 3), L("Lait", 600), L("Poireau", 3), L("Crème fraîche", 200), L("Gruyère râpé", 80)]),
    P("p12", "Crêpes champignons-poireaux", "hiver", [L("Farine", 300), L("Œuf", 3), L("Lait", 600), L("Poireau", 2), L("Champignon de Paris", 300), L("Crème fraîche", 200)]),
    P("p13", "Croque-monsieur végé", "toute", [L("Pain de mie", 1), L("Jambon végé", 150), L("Gruyère râpé", 120), L("Beurre", 30)]),
    P("p14", "Curry épinards-haricots blancs", "toute", [L("Épinards", 500), L("Haricots blancs", 400), L("Lait de coco", 400), L("Oignon", 1), L("Curry", 2), L("Riz", 250)]),

    P("p15", "Dahl de lentilles corail", "hiver", [L("Lentilles corail", 250), L("Lait de coco", 400), L("Oignon", 1), L("Ail", 2), L("Curry", 2), L("Riz", 250)]),
    P("p16", "Dahl de brocoli", "hiver", [L("Lentilles corail", 250), L("Brocoli", 500), L("Lait de coco", 400), L("Curry", 2), L("Riz", 250)]),

    P("p17", "Fajitas", "toute", [L("Tortillas", 8), L("Poivron", 3), L("Oignon", 2), L("Haricots rouges", 400), L("Épices fajitas", 2), L("Crème fraîche", 100, "", true)]),
    P("p18", "Fajitas + riz", "toute", [L("Tortillas", 8), L("Poivron", 3), L("Oignon", 2), L("Haricots rouges", 400), L("Épices fajitas", 2), L("Riz", 250), L("Crème fraîche", 100, "", true)]),
    P("p19", "Falafels + pita", "toute", [L("Pois chiches", 400), L("Ail", 2), L("Coriandre", 1), L("Cumin", 2), L("Pita", 6), L("Tahini", 60), L("Concombre", 1), L("Tomate", 2)]),
    P("p20", "Frittata courgette-feta", "ete", [L("Œuf", 8), L("Courgette", 2), L("Feta", 150), L("Huile d'olive", 20)]),

    P("p21", "Galettes sarrasin-poireaux", "hiver", [L("Farine de sarrasin", 250), L("Œuf", 1), L("Poireau", 3), L("Gruyère râpé", 80), L("Beurre", 30)]),
    P("p22", "Gnocchi, tofu ail des ours, haricots plats", "toute", [L("Gnocchi", 500), L("Tofu ail des ours", 200), L("Haricots plats", 400), L("Huile d'olive", 20)]),
    P("p23", "Gratin de chou-fleur", "hiver", [L("Chou-fleur", 1), L("Lait", 500), L("Farine", 40), L("Beurre", 40), L("Gruyère râpé", 100)]),
    P("p24", "Gratin de chou-fleur + tofu fumé", "hiver", [L("Chou-fleur", 1), L("Tofu fumé", 200), L("Lait", 500), L("Farine", 40), L("Beurre", 40), L("Gruyère râpé", 100)]),
    P("p25", "Gratin de chou-fleur + pommes de terre + tofu", "hiver", [L("Chou-fleur", 1), L("Pomme de terre", 500), L("Tofu nature", 200), L("Lait", 500), L("Farine", 40), L("Beurre", 40), L("Gruyère râpé", 100)]),

    P("p26", "Haricots noirs", "toute", [L("Haricots noirs", 400), L("Oignon", 1), L("Poivron", 1), L("Cumin", 2), L("Riz", 250)]),
    P("p27", "Haricots verts, lentilles, tahini", "ete", [L("Haricots verts", 500), L("Lentilles vertes", 200), L("Tahini", 60), L("Citron", 1), L("Huile d'olive", 20)]),

    P("p28", "Jackfruit", "toute", [L("Jackfruit", 400), L("Oignon", 1), L("Paprika", 2), L("Riz", 250)]),

    P("p29", "Lasagnes", "toute", [L("Plaques de lasagnes", 250), L("Tomates concassées", 800), L("Lentilles vertes", 200), L("Lait", 500), L("Farine", 40), L("Beurre", 40), L("Gruyère râpé", 100)]),

    P("p30", "Mijoté de tofu rosso + haricots rouges", "toute", [L("Tofu nature", 250), L("Tomates concassées", 400), L("Haricots rouges", 400), L("Oignon", 1), L("Paprika", 2), L("Riz", 250)]),

    P("p31", "One pot quinoa", "toute", [L("Quinoa", 250), L("Oignon", 1), L("Courgette", 1), L("Carotte", 2), L("Bouillon de légumes", 1)]),
    P("p32", "One pot quinoa, courgettes, carottes", "ete", [L("Quinoa", 250), L("Courgette", 2), L("Carotte", 3), L("Oignon", 1), L("Bouillon de légumes", 1)]),
    P("p33", "Orecchiette citron, petits pois", "toute", [L("Orecchiette", 400), L("Citron", 1), L("Petits pois", 300), L("Crème fraîche", 150), L("Parmesan", 60, "", true)]),

    P("p34", "Palak paneer", "toute", [L("Épinards", 600), L("Paneer", 250), L("Oignon", 1), L("Ail", 2), L("Curry", 2), L("Riz", 250)]),
    P("p35", "Pâtes petits pois, crème", "toute", [L("Pâtes", 400), L("Petits pois", 300), L("Crème fraîche", 200), L("Parmesan", 60, "", true)]),
    P("p36", "Patate douce + lentilles corail", "hiver", [L("Patate douce", 600), L("Lentilles corail", 200), L("Lait de coco", 400), L("Curry", 2)]),
    P("p37", "Petit salé aux lentilles", "hiver", [L("Lentilles vertes", 300), L("Lardons végé", 150), L("Carotte", 3), L("Oignon", 1), L("Bouillon de légumes", 1)]),
    P("p38", "Pois cassés", "hiver", [L("Pois cassés", 400), L("Carotte", 2), L("Oignon", 1), L("Bouillon de légumes", 1)]),
    P("p39", "Pommes de terre + légumes", "toute", [L("Pomme de terre", 800), L("Carotte", 3), L("Courgette", 2), L("Huile d'olive", 30)]),
    P("p40", "Protéines de soja façon poulet", "toute", [L("Protéines de soja", 150), L("Bouillon de légumes", 1), L("Paprika", 2), L("Crème fraîche", 200), L("Riz", 250)]),
    P("p41", "Purée de patate douce + tofu brouillé", "hiver", [L("Patate douce", 800), L("Tofu nature", 300), L("Curcuma", 1), L("Lait", 100)]),

    P("p42", "Quiche", "toute", [L("Pâte brisée", 1), L("Œuf", 3), L("Crème fraîche", 200), L("Gruyère râpé", 80)]),
    P("p43", "Quiche aux épinards", "toute", [L("Pâte brisée", 1), L("Épinards", 500), L("Œuf", 3), L("Crème fraîche", 200), L("Feta", 100)]),
    P("p44", "Quiche poireaux-champignons", "hiver", [L("Pâte brisée", 1), L("Poireau", 2), L("Champignon de Paris", 250), L("Œuf", 3), L("Crème fraîche", 200)]),
    P("p45", "Quiche tofu soyeux, lardons végé, tomates séchées", "toute", [L("Pâte brisée", 1), L("Tofu soyeux", 400), L("Lardons végé", 150), L("Tomates séchées", 80)]),
    P("p46", "Quinoa, patate douce, carottes", "toute", [L("Quinoa", 250), L("Patate douce", 500), L("Carotte", 3), L("Huile d'olive", 20)]),

    P("p47", "Ratatouille", "ete", [L("Aubergine", 2), L("Courgette", 2), L("Poivron", 2), L("Tomate", 4), L("Oignon", 1), L("Ail", 2), L("Huile d'olive", 40)]),
    P("p48", "Raviolis", "toute", [L("Raviolis", 500), L("Crème fraîche", 100, "", true), L("Parmesan", 40, "", true)]),
    P("p49", "Risotto aux poireaux", "hiver", [L("Riz arborio", 300), L("Poireau", 3), L("Bouillon de légumes", 1), L("Parmesan", 60), L("Beurre", 30)]),
    P("p50", "Risotto aux champignons", "toute", [L("Riz arborio", 300), L("Champignon de Paris", 400), L("Bouillon de légumes", 1), L("Parmesan", 60), L("Beurre", 30)]),
    P("p51", "Risotto d'orzo aux champignons", "toute", [L("Orzo", 300), L("Champignon de Paris", 400), L("Bouillon de légumes", 1), L("Parmesan", 60)]),
    P("p52", "Riz cantonais", "toute", [L("Riz", 300), L("Œuf", 3), L("Petits pois", 200), L("Jambon végé", 150), L("Sauce soja", 30)]),
    P("p53", "Riz mexicain", "toute", [L("Riz", 300), L("Haricots rouges", 400), L("Maïs", 150), L("Poivron", 1), L("Tomates concassées", 200), L("Cumin", 2)]),
    P("p54", "Riz pilaf carottes, coriandre", "toute", [L("Riz", 300), L("Carotte", 3), L("Coriandre", 1), L("Oignon", 1), L("Bouillon de légumes", 1)]),

    P("p55", "Salade concombre-feta", "ete", [L("Concombre", 2), L("Feta", 150), L("Citron", 1), L("Huile d'olive", 30)]),
    P("p56", "Salade de lentilles vertes", "toute", [L("Lentilles vertes", 250), L("Échalote", 2), L("Moutarde", 1), L("Huile d'olive", 30)]),
    P("p57", "Salade de lentilles, feta, carotte", "toute", [L("Lentilles vertes", 250), L("Feta", 150), L("Carotte", 3), L("Huile d'olive", 30)]),
    P("p58", "Salade de lentilles, feta, roquette", "ete", [L("Lentilles vertes", 250), L("Feta", 150), L("Roquette", 100), L("Huile d'olive", 30)]),
    P("p59", "Salade de lentilles, feta + soupe", "hiver", [L("Lentilles vertes", 250), L("Feta", 150), L("Poireau", 2), L("Pomme de terre", 400), L("Bouillon de légumes", 1)]),
    P("p60", "Salade de patate douce, haricots rouges, maïs", "toute", [L("Patate douce", 600), L("Haricots rouges", 400), L("Maïs", 150), L("Citron", 1), L("Huile d'olive", 30)]),
    P("p61", "Salade de petit épeautre", "ete", [L("Petit épeautre", 250), L("Tomate", 3), L("Feta", 100), L("Roquette", 80), L("Huile d'olive", 30)]),
    P("p62", "Salade de pommes de terre", "ete", [L("Pomme de terre", 800), L("Échalote", 2), L("Moutarde", 1), L("Huile d'olive", 40)]),
    P("p63", "Salade grecque", "ete", [L("Concombre", 1), L("Tomate", 4), L("Feta", 200), L("Olives", 100), L("Oignon rouge", 1), L("Huile d'olive", 40)]),
    P("p64", "Salade grecque + panés", "ete", [L("Concombre", 1), L("Tomate", 4), L("Feta", 200), L("Olives", 100), L("Oignon rouge", 1), L("Huile d'olive", 40), L("Panés végé", 6)]),
    P("p65", "Soupe", "hiver", [L("Poireau", 2), L("Pomme de terre", 400), L("Carotte", 2), L("Bouillon de légumes", 1)]),
    P("p66", "Soupe de butternut", "hiver", [L("Butternut", 1), L("Pomme de terre", 200), L("Oignon", 1), L("Bouillon de légumes", 1), L("Crème fraîche", 100, "", true)]),
    P("p67", "Soupe de potimarron", "hiver", [L("Potimarron", 1), L("Pomme de terre", 200), L("Oignon", 1), L("Bouillon de légumes", 1), L("Crème fraîche", 100, "", true)]),
    P("p68", "Soupe + caviar d'aubergine", "hiver", [L("Poireau", 2), L("Pomme de terre", 400), L("Bouillon de légumes", 1), L("Aubergine", 2), L("Tahini", 40), L("Citron", 1), L("Pain", 1)]),
    P("p69", "Soupe + salade de pommes de terre, roquette", "hiver", [L("Poireau", 2), L("Carotte", 2), L("Bouillon de légumes", 1), L("Pomme de terre", 800), L("Roquette", 80), L("Moutarde", 1)]),
    P("p70", "Stamppot", "hiver", [L("Pomme de terre", 1000), L("Chou frisé", 400), L("Lait", 100), L("Beurre", 40), L("Saucisse végé", 4)]),

    P("p71", "Tajine butternut-lentilles", "hiver", [L("Butternut", 1), L("Lentilles vertes", 200), L("Ras el-hanout", 2), L("Oignon", 1), L("Semoule de couscous", 250)]),
    P("p72", "Tarte à la rhubarbe", "ete", [L("Rhubarbe", 800), L("Pâte brisée", 1), L("Sucre", 120), L("Œuf", 2), L("Crème fraîche", 100)], "dessert", 6),
    P("p73", "Tarte oignons-butternut", "hiver", [L("Pâte feuilletée", 1), L("Oignon", 4), L("Butternut", 500), L("Feta", 100)]),
    P("p74", "Tartiflette", "hiver", [L("Pomme de terre", 1000), L("Reblochon", 1), L("Oignon", 2), L("Lardons végé", 200), L("Crème fraîche", 100)]),
    P("p75", "Tartinade de haricots blancs", "toute", [L("Haricots blancs", 400), L("Tahini", 40), L("Citron", 1), L("Ail", 1), L("Pain", 1)], "apéro"),
    P("p76", "Tatin d'échalotes", "toute", [L("Échalote", 800), L("Pâte feuilletée", 1), L("Sucre", 40), L("Beurre", 30), L("Vinaigre balsamique", 20)]),
    P("p77", "Terrine de lentilles", "toute", [L("Lentilles vertes", 250), L("Œuf", 2), L("Oignon", 1), L("Farine", 60), L("Champignon de Paris", 200)]),
    P("p78", "Tikka masala", "toute", [L("Pois chiches", 400), L("Tomates concassées", 400), L("Lait de coco", 200), L("Oignon", 1), L("Épices tikka masala", 2), L("Riz", 250)]),
    P("p79", "Tofu brouillé + purée", "toute", [L("Tofu nature", 300), L("Curcuma", 1), L("Pomme de terre", 800), L("Lait", 150), L("Beurre", 40)]),
    P("p80", "Tofu doré + purée de pommes de terre", "toute", [L("Tofu nature", 300), L("Sauce soja", 30), L("Pomme de terre", 800), L("Lait", 150), L("Beurre", 40)]),
    P("p81", "Tofu fumé", "toute", [L("Tofu fumé", 300), L("Riz", 250), L("Sauce soja", 30)]),

    P("p82", "Wok de légumes + tofu", "toute", [L("Tofu nature", 250), L("Carotte", 2), L("Poivron", 1), L("Brocoli", 300), L("Gingembre", 1), L("Sauce soja", 40), L("Riz", 250)]),
  ];

  const personnes = [
    { id: "u1", nom: "Papa", regime: "standard", notes: "" },
    { id: "u2", nom: "Maman", regime: "végétarien", notes: "" },
    { id: "u3", nom: "Léa", regime: "enfant", notes: "N'aime pas la crème" },
  ];
  const l = lundi(new Date());
  const tous = personnes.map((p) => p.id);
  const repas = [
    { id: uid(), date: iso(l), creneauId: "c2", platIds: ["p66", "p44"], convives: tous, ajust: [] },
    { id: uid(), date: iso(addJ(l, 1)), creneauId: "c2", platIds: ["p15"], convives: tous, ajust: [{ id: uid(), personneId: "u1", type: "add", ingId: ref("Tofu fumé").id, qte: 150, unite: "g" }] },
    { id: uid(), date: iso(addJ(l, 2)), creneauId: "c1", platIds: ["p35"], convives: ["u2", "u3"], ajust: [] },
    { id: uid(), date: iso(addJ(l, 3)), creneauId: "c2", platIds: ["p23"], convives: tous, ajust: [{ id: uid(), personneId: "u3", type: "remove", ingId: ref("Gruyère râpé").id, qte: 0, unite: "g" }] },
    { id: uid(), date: iso(addJ(l, 5)), creneauId: "c2", platIds: ["p63", "p47"], convives: tous, ajust: [] },
    { id: uid(), date: iso(l), creneauId: "c6", platIds: ["p72"], convives: tous, repetitions: 1, ajust: [] },
    { id: uid(), date: iso(l), creneauId: "c4", platIds: ["p75"], convives: tous, repetitions: 2, ajust: [] },
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
