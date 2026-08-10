/* ==========================================================================
   Petits outils sans etat : identifiants, dates, unites, couleurs de categorie.
   Aucun de ces symboles ne connait React — c'est ce qui permet de les appeler
   depuis n'importe quel ecran sans creer de cycle.
   ========================================================================== */

export const uid = () => Math.random().toString(36).slice(2, 9);

export const UNITES = ["", "g", "kg", "mL", "L", "pièce", "c. à s.", "c. à c.", "pincée", "botte", "boîte"];

export const REGIMES = ["standard", "végétarien", "enfant", "autre"];

export const SAISONS = [{ id: "toute", nom: "Toute l'année" }, { id: "ete", nom: "Été" }, { id: "hiver", nom: "Hiver" }];

export const saisonDe = (d) => { const m = d.getMonth() + 1; return m >= 4 && m <= 9 ? "ete" : "hiver"; };

export const nomSaison = (id) => (SAISONS.find((x) => x.id === id) || SAISONS[0]).nom;

export const DOW = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"];

export const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

export const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const lundi = (d) => { const x = new Date(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); x.setHours(0, 0, 0, 0); return x; };

export const addJ = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

export const parseISO = (s) => { const [a, b, c] = s.split("-").map(Number); return new Date(a, b - 1, c); };

export const jourDe = (d) => `${DOW[(d.getDay() + 6) % 7]}. ${d.getDate()} ${MOIS[d.getMonth()]}`;

export const joursDepuis = (s) => Math.round((new Date().setHours(0, 0, 0, 0) - parseISO(s).getTime()) / 86400000);
/* Une date complète venue d'ailleurs (build, création de compte) : pas un jour
   de menu, donc pas le format court de `jourDe`. */

export const dateLisible = (horodatage, avecHeure) => {
  const d = new Date(horodatage);
  if (isNaN(d.getTime())) return "";
  const jour = `${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`;
  if (!avecHeure) return jour;
  return `${jour} à ${String(d.getHours()).padStart(2, "0")}h${String(d.getMinutes()).padStart(2, "0")}`;
};

export const fmtQ = (n) => {
  if (n == null || isNaN(n)) return "";
  const r = Math.round(n * 100) / 100;
  if (Math.abs(r - Math.round(r)) < 0.01) return String(Math.round(r));
  return String(r).replace(".", ",");
};

export const TRIS = [
  { id: "az", nom: "Nom, A → Z" },
  { id: "za", nom: "Nom, Z → A" },
  { id: "recent", nom: "Ajouté récemment" },
  { id: "ancien", nom: "Ajouté en premier" },
  { id: "oublies", nom: "Pas cuisiné depuis longtemps" },
];

export const CAT_COULEURS = ["#A9651B", "#4C7A2B", "#5C2A46", "#2F6C86", "#7A2E52", "#4D63A8"];

const couleurDe = (db, cat) => {
  const k = db.categories.indexOf(cat);
  return k < 0 ? "#8A9A90" : CAT_COULEURS[k % CAT_COULEURS.length];
};

export const teinteDe = (db, cat) => { const c = couleurDe(db, cat); return { background: c + "1F", color: c }; };
