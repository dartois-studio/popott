import { useState, useEffect, useMemo, useRef } from "react";
import { EcranCourses } from "./ecrans/Courses.jsx";
import { EcranPlats } from "./ecrans/Plats.jsx";
import { EcranReglages } from "./ecrans/Reglages.jsx";
import { EcranSemaine } from "./ecrans/Semaine.jsx";
import { migrer, seed } from "./exemple.js";
import { SheetIngredient, SheetManuel, SheetPersonne } from "./feuilles/Fiches.jsx";
import { SheetInverse } from "./feuilles/Inverse.jsx";
import { SheetActionsPlat, SheetPlat } from "./feuilles/Plat.jsx";
import { SheetRemplissage } from "./feuilles/Remplissage.jsx";
import { SheetRepas } from "./feuilles/Repas.jsx";
import { SheetActionsSemaine, SheetBilan, SheetCopie, SheetPresetSave, SheetPresets, SheetTri } from "./feuilles/Semaine.jsx";
import { addJ, iso, lundi } from "./outils.js";
import { Ic, IcCal, IcCart, IcPlats, IcSet } from "./ui/icones.jsx";
import { CSS } from "./ui/styles.js";

/* ==========================================================================
   POPOTT — l'application
   Bibliotheque de plats → Menu de la semaine → Liste de courses agregee

   Ce fichier ne fait plus que l'assemblage : l'etat du document, le contexte
   passe aux ecrans, la barre d'onglets et le panneau ouvert. Les ecrans sont
   dans `ecrans/`, les panneaux dans `feuilles/`, les briques dans `ui/`.
   ========================================================================== */

const TABS = [["plats", "Plats", IcPlats], ["semaine", "Semaine", IcCal], ["courses", "Courses", IcCart], ["reglages", "Réglages", IcSet]];

/* Trois entrees facultatives, toutes fournies par le point d'entree :
     compte         qui est connecte et sur quel foyer — absent en local seul
     version        ce qui est grave dans le fichier publie
     surActualiser  redemander le code au serveur
   Absentes, les réglages s'affichent comme avant : le proto tourne toujours
   tel quel, sans rien autour. */

export default function App({ compte = null, version = null, surActualiser = null }) {
  const [db, setDb] = useState(null);
  const [tab, setTab] = useState("plats");
  const [semaine, setSemaine] = useState(() => lundi(new Date()));
  const [sheet, setSheet] = useState(null);
  const [toast, setToast] = useState(null);
  const [ui, setUiRaw] = useState({ q: "", cat: "tous", inverse: false, sel: [], ouvertGarde: false, reglagesVue: "menu", semaineVue: "grille", tri: "az" });
  const premier = useRef(true);

  const setUi = (patch) => setUiRaw((u) => ({ ...u, ...patch }));

  useEffect(() => {
    let vivant = true;
    (async () => {
      let data = null;
      try {
        const r = await window.storage.get("menus:v1");
        if (r && r.value) data = JSON.parse(r.value);
      } catch { /* première ouverture ou stockage indisponible */ }
      if (vivant) setDb(data && data.plats ? migrer(data) : seed());
    })();
    return () => { vivant = false; };
  }, []);

  // Un autre appareil du foyer a modifié les données. La couche de
  // synchronisation a déjà fusionné et écrit le résultat ; il ne reste qu'à
  // l'adopter. On repose `premier` pour ne pas renvoyer aussitôt au serveur
  // ce qu'on vient d'en recevoir — sinon deux appareils se répondent en
  // boucle. Rien d'autre n'est touché : la semaine consultée, l'onglet et la
  // feuille ouverte restent où ils sont.
  useEffect(() => {
    const surDistant = (e) => {
      const data = e.detail;
      if (!data || !data.plats) return;
      premier.current = true;
      setDb(migrer(data));
    };
    window.addEventListener("popott:distant", surDistant);
    return () => window.removeEventListener("popott:distant", surDistant);
  }, []);

  useEffect(() => {
    if (!db) return;
    if (premier.current) { premier.current = false; return; }
    const t = setTimeout(() => {
      try {
        const p = window.storage.set("menus:v1", JSON.stringify(db));
        if (p && p.catch) p.catch(() => { });
      } catch { /* mémoire seule */ }
    }, 400);
    return () => clearTimeout(t);
  }, [db]);

  const up = (fn) => setDb((d) => { const n = structuredClone(d); fn(n); return n; });
  const flash = (m) => { setToast(m); setTimeout(() => setToast(null), 2200); };

  const jours = useMemo(() => Array.from({ length: 7 }, (_, i) => addJ(semaine, i)), [semaine]);
  const datesSem = useMemo(() => jours.map(iso), [jours]);

  const courses = useMemo(() => {
    const vide = { groupes: [], garde: [], total: 0, restants: 0 };
    if (!db) return vide;
    const map = new Map();
    /* `optionnel` ne survit qu'a l'unanimite : un ingredient optionnel dans un
       plat et obligatoire dans un autre reste un achat obligatoire. D'ou le
       depart a `true`, qui retombe des la premiere source qui en a besoin. */
    const push = (ingId, qte, unite, source, optionnel) => {
      const k = ingId + "|" + unite;
      if (!map.has(k)) map.set(k, { key: k, ingId, unite, qte: 0, sources: new Set(), optionnel: true });
      const e = map.get(k);
      e.qte += qte;
      if (!optionnel) e.optionnel = false;
      if (source) e.sources.add(source);
    };
    db.repas.filter((r) => datesSem.includes(r.date)).forEach((r) => {
      r.platIds.forEach((pid) => {
        const p = db.plats.find((x) => x.id === pid);
        if (!p) return;
        const fois = r.repetitions || 1;
        const coef = (r.convives.length && p.portions ? r.convives.length / p.portions : 1) * fois;
        p.lignes.forEach((l) => push(l.ingId, (l.qte || 0) * coef, l.unite, p.nom, l.optionnel));
      });
      (r.ajust || []).forEach((a) => { if (a.type === "add" && a.qte > 0) push(a.ingId, a.qte * (r.repetitions || 1), a.unite, "ajustement", false); });
    });

    const achetables = [], garde = [];
    map.forEach((e) => {
      const ing = db.ingredients.find((i) => i.id === e.ingId);
      if (!ing) return;
      const o = { ...e, nom: ing.nom, rayonId: ing.rayonId, sources: [...e.sources] };
      (ing.garde ? garde : achetables).push(o);
    });

    const groupes = db.rayons.map((r) => ({
      rayon: r,
      items: achetables.filter((l) => l.rayonId === r.id).sort((a, b) => a.nom.localeCompare(b.nom))
        .map((l) => ({ ...l, etat: db.etats[l.key] || "todo", manuel: false })),
    }));
    db.manuels.forEach((m) => {
      const g = groupes.find((x) => x.rayon.id === m.rayonId) || groupes[groupes.length - 1];
      if (g) g.items.push({ key: "m:" + m.id, id: m.id, nom: m.libelle, qte: m.qte, unite: m.unite, etat: m.etat || "todo", manuel: true, sources: [] });
    });
    const tous = groupes.flatMap((g) => g.items);
    return {
      groupes: groupes.filter((g) => g.items.length),
      garde: garde.sort((a, b) => a.nom.localeCompare(b.nom)),
      total: tous.filter((i) => i.etat !== "have").length,
      restants: tous.filter((i) => i.etat === "todo").length,
    };
  }, [db, datesSem]);

  const derniereFois = useMemo(() => {
    const m = {};
    if (!db) return m;
    const auj = iso(new Date());
    db.repas.forEach((r) => {
      if (r.date <= auj) r.platIds.forEach((p) => { if (!m[p] || r.date > m[p]) m[p] = r.date; });
    });
    return m;
  }, [db]);

  if (!db) {
    return <div className="mc"><style>{CSS}</style><div className="shell"><div className="empty" style={{ paddingTop: 140 }}>Chargement…</div></div></div>;
  }

  const ctx = {
    db, up, setDb, flash, setSheet, setTab, semaine, setSemaine, jours, datesSem, courses, derniereFois,
    compte, version, surActualiser,
    ingOf: (id) => db.ingredients.find((i) => i.id === id),
    platOf: (id) => db.plats.find((p) => p.id === id),
    persOf: (id) => db.personnes.find((p) => p.id === id),
    crenOf: (id) => db.creneaux.find((c) => c.id === id),
  };

  return (
    <div className="mc">
      <style>{CSS}</style>
      <div className="shell">
        {tab === "plats" && <EcranPlats ctx={ctx} ui={ui} setUi={setUi} />}
        {tab === "semaine" && <EcranSemaine ctx={ctx} ui={ui} setUi={setUi} />}
        {tab === "courses" && <EcranCourses ctx={ctx} ui={ui} setUi={setUi} />}
        {tab === "reglages" && <EcranReglages ctx={ctx} ui={ui} setUi={setUi} />}
      </div>

      <nav className="tabs">
        {TABS.map(([id, label, icon]) => (
          <button key={id} data-on={tab === id ? 1 : 0} onClick={() => setTab(id)} aria-label={label}>
            <span style={{ position: "relative", display: "grid" }}>
              <Ic d={icon} s={23} />
              {id === "courses" && courses.restants > 0 && <span className="badge">{courses.restants}</span>}
            </span>
            <span className="lb">{label}</span>
          </button>
        ))}
      </nav>

      {sheet?.t === "plat" && <SheetPlat ctx={ctx} plat={sheet.plat} />}
      {sheet?.t === "repas" && <SheetRepas key={sheet.date + sheet.creneauId} ctx={ctx} ui={ui} setUi={setUi} date={sheet.date} creneauId={sheet.creneauId} />}
      {sheet?.t === "ingredient" && <SheetIngredient ctx={ctx} ing={sheet.ing} />}
      {sheet?.t === "personne" && <SheetPersonne ctx={ctx} pers={sheet.pers} />}
      {sheet?.t === "manuel" && <SheetManuel ctx={ctx} />}
      {sheet?.t === "bilan" && <SheetBilan ctx={ctx} />}
      {sheet?.t === "remplissage" && <SheetRemplissage ctx={ctx} />}
      {sheet?.t === "tri" && <SheetTri ctx={ctx} ui={ui} setUi={setUi} />}
      {sheet?.t === "inverse" && <SheetInverse ctx={ctx} ui={ui} setUi={setUi} />}
      {sheet?.t === "actions-plat" && <SheetActionsPlat ctx={ctx} plat={sheet.plat} />}
      {sheet?.t === "actions-semaine" && <SheetActionsSemaine ctx={ctx} />}
      {sheet?.t === "copie" && <SheetCopie ctx={ctx} sens={sheet.sens} />}
      {sheet?.t === "preset-save" && <SheetPresetSave ctx={ctx} />}
      {sheet?.t === "presets" && <SheetPresets ctx={ctx} />}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
