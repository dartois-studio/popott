import { useState, useRef } from "react";
import { UNITES, addJ, fmtQ, iso, jourDe, joursDepuis, nomSaison, parseISO, uid } from "../outils.js";
import { IngredientCombo, Sheet } from "../ui/briques.jsx";
import { Ic, IcDown, IcIdee, IcL, IcMoins, IcPlus, IcR, IcSort, IcTrash, IcUp, IcX } from "../ui/icones.jsx";

/* ==========================================================================
   Poser des plats sur un creneau : convives, repetitions, et les
   ajustements par personne qui modifient la liste de courses.
   ========================================================================== */

function AjoutAjustement({ personnes, ingredients, onAdd }) {
  const [ouvert, setOuvert] = useState(false);
  const [a, setA] = useState({ personneId: "", type: "add", ingId: "", ingNom: "", qte: 100, unite: "g" });
  if (!personnes.length) return <p className="muted" style={{ fontSize: 13 }}>Choisissez d'abord des convives.</p>;
  if (!ouvert) {
    return <button className="btn flat sm" style={{ width: "100%", marginTop: 9 }}
      onClick={() => { setA({ personneId: personnes[0].id, type: "add", ingId: "", ingNom: "", qte: 100, unite: "g" }); setOuvert(true); }}>
      + Ajustement pour une personne
    </button>;
  }
  return (
    <div className="card" style={{ padding: 12, marginTop: 9 }}>
      <div className="row">
        <select value={a.personneId} onChange={(e) => setA({ ...a, personneId: e.target.value })} aria-label="Personne">
          {personnes.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
        </select>
        <select value={a.type} onChange={(e) => setA({ ...a, type: e.target.value })} style={{ width: 132 }} aria-label="Type">
          <option value="add">ajouter</option>
          <option value="remove">retirer</option>
        </select>
      </div>
      <div style={{ marginTop: 8 }}>
        <IngredientCombo ingredients={ingredients} placeholder={a.ingNom || "Quel ingrédient ?"}
          onPick={(i) => setA({ ...a, ingId: i.id, ingNom: i.nom, unite: i.unite })} />
      </div>
      {a.type === "add" && (
        <div className="row" style={{ marginTop: 8 }}>
          <input type="number" min="0" step="any" value={a.qte} aria-label="Quantité"
            onChange={(e) => setA({ ...a, qte: +e.target.value })} />
          <select value={a.unite} onChange={(e) => setA({ ...a, unite: e.target.value })} style={{ width: 112 }} aria-label="Unité">
            {UNITES.map((u) => <option key={u || "sans"} value={u}>{u || "— sans unité"}</option>)}
          </select>
        </div>
      )}
      <p className="muted" style={{ fontSize: 12, margin: "9px 0 0" }}>
        {a.type === "add"
          ? "La quantité s'ajoute à la liste de courses."
          : "Retiré de l'assiette seulement : l'ingrédient reste aux courses s'il sert aux autres."}
      </p>
      <div className="row" style={{ marginTop: 10 }}>
        <button className="btn flat sm" style={{ flex: 1 }} onClick={() => setOuvert(false)}>Annuler</button>
        <button className="btn sm" style={{ flex: 1 }} disabled={!a.ingId}
          onClick={() => { onAdd({ id: uid(), personneId: a.personneId, type: a.type, ingId: a.ingId, qte: a.type === "add" ? a.qte : 0, unite: a.unite }); setOuvert(false); }}>
          Ajouter
        </button>
      </div>
    </div>
  );
}

export function SheetRepas({ ctx, ui, setUi, date: date0, creneauId: cren0 }) {
  const { db, up, setSheet, ingOf, platOf, persOf, derniereFois } = ctx;
  const [date, setDate] = useState(date0);
  const [creneauId, setCreneauId] = useState(cren0);
  const [q, setQ] = useState("");
  const [catF, setCatF] = useState("tous");
  const [tagF, setTagF] = useState("tous");
  const [idee, setIdee] = useState(false);
  const [details, setDetails] = useState(false);
  const sel = ui?.sel || [];

  const cren = db.creneaux.find((c) => c.id === creneauId);
  const hebdo = cren?.portee === "semaine";
  const famille = db.creneaux.filter((c) => (c.portee === "semaine") === hebdo);
  const r = db.repas.find((x) => x.date === date && x.creneauId === creneauId);
  const platIds = r?.platIds || [];
  const convives = r?.convives || db.personnes.map((p) => p.id);
  const ajust = r?.ajust || [];
  const fois = hebdo ? (r?.repetitions || 1) : 1;
  const d = parseISO(date);

  /* Tout est écrit au fil de l'eau : pas de bouton Enregistrer, pas de confirmation au changement de jour */
  const maj = (fn) => up((dd) => {
    let rr = dd.repas.find((x) => x.date === date && x.creneauId === creneauId);
    if (!rr) {
      rr = { id: uid(), date, creneauId, platIds: [], convives: dd.personnes.map((p) => p.id), repetitions: 1, ajust: [] };
      dd.repas.push(rr);
    }
    fn(rr);
    dd.repas = dd.repas.filter((x) => x.platIds.length);
  });

  const ajouter = (pid) => maj((rr) => { if (!rr.platIds.includes(pid)) rr.platIds.push(pid); });
  const retirer = (pid) => maj((rr) => { rr.platIds = rr.platIds.filter((x) => x !== pid); });
  const deplacer = (i, dir) => maj((rr) => {
    const j = i + dir;
    if (j < 0 || j >= rr.platIds.length) return;
    [rr.platIds[i], rr.platIds[j]] = [rr.platIds[j], rr.platIds[i]];
  });
  const ranger = () => maj((rr) => {
    const rang = (pid) => { const k = db.categories.indexOf(platOf(pid)?.cat); return k < 0 ? 99 : k; };
    rr.platIds.sort((a, b) => rang(a) - rang(b));
  });

  /* Filtres de la bibliothèque */
  const cats = ["tous", ...db.categories];
  const dispo = db.plats
    .filter((p) => !platIds.includes(p.id)
      && (catF === "tous" || p.cat === catF)
      && (tagF === "tous" || p.tags.includes(tagF))
      && (!q || p.nom.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => (derniereFois[a.id] || "").localeCompare(derniereFois[b.id] || "") || a.nom.localeCompare(b.nom));

  const liste = (idee && sel.length)
    ? dispo.map((p) => {
      const ids = p.lignes.map((l) => l.ingId);
      const ok = sel.filter((x) => ids.includes(x)).length;
      const manque = p.lignes.filter((l) => !sel.includes(l.ingId) && !l.optionnel && !ingOf(l.ingId)?.garde).length;
      return { ...p, _ok: ok, _manque: manque };
    }).filter((p) => p._ok > 0).sort((a, b) => a._manque - b._manque || b._ok - a._ok)
    : dispo;

  /* Balayages : sur la date pour changer de jour, sur la liste pour changer de catégorie */
  const geste = useRef({ x: 0, y: 0, actif: false });
  const glisse = (surFin) => ({
    onPointerDown: (e) => { geste.current = { x: e.clientX, y: e.clientY, actif: true }; },
    onPointerMove: (e) => {
      const g = geste.current;
      if (g.actif && Math.abs(e.clientY - g.y) > Math.abs(e.clientX - g.x) + 10) g.actif = false;
    },
    onPointerUp: (e) => {
      const g = geste.current;
      if (!g.actif) return;
      g.actif = false;
      const dx = e.clientX - g.x;
      if (Math.abs(dx) > 50) surFin(dx > 0 ? -1 : 1);
    },
  });
  const glisseJour = glisse((s) => setDate(iso(addJ(d, s))));
  const glisseCat = glisse((s) => {
    const i = cats.indexOf(catF);
    setCatF(cats[(i + s + cats.length) % cats.length]);
  });
  const nomCat = catF === "tous" ? "Toutes catégories" : catF[0].toUpperCase() + catF.slice(1);

  const entete = (
    <>
      {!hebdo && (
        <div className="nav-jour" {...glisseJour}>
          <button className="icon-btn" aria-label="Jour précédent" onClick={() => setDate(iso(addJ(d, -1)))}><Ic d={IcL} s={18} /></button>
          <span>{jourDe(d)}</span>
          <button className="icon-btn" aria-label="Jour suivant" onClick={() => setDate(iso(addJ(d, 1)))}><Ic d={IcR} s={18} /></button>
        </div>
      )}
      <div className="segm">
        {famille.map((c) => (
          <button key={c.id} data-on={c.id === creneauId ? 1 : 0} onClick={() => setCreneauId(c.id)}>{c.nom}</button>
        ))}
      </div>
    </>
  );

  return (
    <Sheet plein entete={entete} title={hebdo ? cren.nom : (cren?.nom || "Repas")}
      sub={hebdo ? "En vrac pour la semaine" : "Composer le repas"} onClose={() => setSheet(null)}
      actions={<>
        {platIds.length > 0 && <button className="btn danger" aria-label="Vider ce repas"
          onClick={() => maj((rr) => { rr.platIds = []; })}><Ic d={IcTrash} s={17} /></button>}
        <button className="btn" onClick={() => setSheet(null)}>Terminé</button>
      </>}>

      {hebdo && (
        <div className="stepper" style={{ marginTop: 12 }}>
          <button className="icon-btn" disabled={fois <= 1} aria-label="Moins"
            onClick={() => maj((rr) => { rr.repetitions = Math.max(1, (rr.repetitions || 1) - 1); })}><Ic d={IcMoins} s={18} /></button>
          <span><b>{fois}</b> fois dans la semaine</span>
          <button className="icon-btn" aria-label="Plus"
            onClick={() => maj((rr) => { rr.repetitions = Math.min(21, (rr.repetitions || 1) + 1); })}><Ic d={IcPlus} s={18} /></button>
        </div>
      )}

      {platIds.length > 0 ? platIds.map((pid, i) => {
        const p = platOf(pid);
        if (!p) return null;
        const coef = (convives.length && p.portions ? convives.length / p.portions : 1) * fois;
        return (
          <div key={pid} className="au-menu">
            <span className="ordre">{i + 1}</span>
            <span className="nm">
              <span style={{ fontFamily: "var(--display)", fontSize: 16.5 }}>{p.nom}</span>
              <span className="qty" style={{ display: "block", fontSize: 11.5 }}>
                {p.cat} · ×{fmtQ(coef)} de la recette
              </span>
            </span>
            {platIds.length > 1 && (
              <span className="reorder">
                <button className="icon-btn mini" disabled={i === 0} aria-label={`Monter ${p.nom}`} onClick={() => deplacer(i, -1)}><Ic d={IcUp} s={15} /></button>
                <button className="icon-btn mini" disabled={i === platIds.length - 1} aria-label={`Descendre ${p.nom}`} onClick={() => deplacer(i, 1)}><Ic d={IcDown} s={15} /></button>
              </span>
            )}
            <button className="icon-btn" style={{ width: 32, height: 32 }} aria-label={`Retirer ${p.nom}`} onClick={() => retirer(pid)}><Ic d={IcX} s={16} /></button>
          </div>
        );
      }) : <p className="muted" style={{ fontSize: 13, margin: "12px 0 0" }}>Rien de prévu — choisissez un plat ci-dessous.</p>}

      {platIds.length > 1 && !hebdo && (
        <button className="btn flat sm" style={{ marginTop: 8 }} onClick={ranger}><Ic d={IcSort} s={16} />Ranger dans l'ordre du service</button>
      )}

      <button className="repli" onClick={() => setDetails(!details)}>
        <span>{convives.length} couvert{convives.length > 1 ? "s" : ""}
          {convives.length < db.personnes.length && ` · ${convives.map((u) => persOf(u)?.nom).filter(Boolean).join(", ")}`}
          {ajust.length > 0 && ` · ${ajust.length} ajustement${ajust.length > 1 ? "s" : ""}`}</span>
        <span className="muted" style={{ display: "grid", transform: details ? "rotate(90deg)" : "none" }}><Ic d={IcR} s={17} /></span>
      </button>

      {details && (
        <>
          <div className="chips-wrap" style={{ marginTop: 4 }}>
            {db.personnes.map((p) => (
              <button key={p.id} className="chip sm" data-on={convives.includes(p.id) ? 1 : 0}
                onClick={() => maj((rr) => {
                  rr.convives = rr.convives.includes(p.id) ? rr.convives.filter((y) => y !== p.id) : [...rr.convives, p.id];
                })}>
                {p.nom} <span style={{ opacity: .6, fontSize: 11, marginLeft: 4 }}>{p.regime}</span>
              </button>
            ))}
          </div>
          {ajust.map((a) => (
            <div key={a.id} className="au-menu">
              <span className="nm" style={{ fontSize: 14 }}>
                <b style={{ color: a.type === "add" ? "var(--vert)" : "#8E2F2F" }}>{a.type === "add" ? "+" : "−"}</b>{" "}
                {ingOf(a.ingId)?.nom} <span className="muted">pour {persOf(a.personneId)?.nom}</span>
                <span className="qty" style={{ display: "block", fontSize: 11.5 }}>
                  {a.type === "add" ? `${fmtQ(a.qte)} ${a.unite} ajoutés aux courses` : "retiré de l'assiette, gardé aux courses"}
                </span>
              </span>
              <button className="icon-btn" style={{ width: 32, height: 32 }} aria-label="Retirer l'ajustement"
                onClick={() => maj((rr) => { rr.ajust = rr.ajust.filter((y) => y.id !== a.id); })}><Ic d={IcX} s={16} /></button>
            </div>
          ))}
          <AjoutAjustement personnes={db.personnes.filter((p) => convives.includes(p.id))} ingredients={db.ingredients}
            onAdd={(a) => maj((rr) => { rr.ajust = [...(rr.ajust || []), a]; })} />
        </>
      )}

      <div className="picker">
        <input placeholder="Chercher un plat…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="picker-filtres">
          <select value={tagF} onChange={(e) => setTagF(e.target.value)} aria-label="Régime">
            <option value="tous">Tous régimes</option>
            {db.tags.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <button className={"idee-btn" + (idee ? " on" : "")} aria-label="Avec ce que j'ai"
            aria-pressed={idee} onClick={() => setIdee(!idee)}><Ic d={IcIdee} s={19} /></button>
        </div>

        {idee && (
          <div className="picker-idee">
            <IngredientCombo ingredients={db.ingredients.filter((i) => !sel.includes(i.id))}
              placeholder="J'ai sous la main…" onPick={(i) => setUi({ sel: [...sel, i.id] })} />
            {sel.length > 0 ? (
              <div className="chips-wrap" style={{ marginTop: 8 }}>
                {sel.map((id) => (
                  <button key={id} className="chip sm" data-on="1" onClick={() => setUi({ sel: sel.filter((x) => x !== id) })}>
                    {ingOf(id)?.nom} ✕
                  </button>
                ))}
              </div>
            ) : <p className="muted" style={{ fontSize: 12.5, margin: "8px 0 0" }}>Ajoutez ce que vous avez sous la main.</p>}
          </div>
        )}

        <div className="nav-cat">
          <button className="icon-btn" aria-label="Catégorie précédente"
            onClick={() => setCatF(cats[(cats.indexOf(catF) - 1 + cats.length) % cats.length])}><Ic d={IcL} s={16} /></button>
          <span>{nomCat} <em>{liste.length}</em></span>
          <button className="icon-btn" aria-label="Catégorie suivante"
            onClick={() => setCatF(cats[(cats.indexOf(catF) + 1) % cats.length])}><Ic d={IcR} s={16} /></button>
        </div>

        <div {...glisseCat} style={{ touchAction: "pan-y" }}>
          {liste.map((p) => {
            const dd = derniereFois[p.id];
            const j = dd ? joursDepuis(dd) : null;
            return (
              <button key={p.id} className="p-row" style={{ width: "100%" }} onClick={() => { ajouter(p.id); setQ(""); }}>
                <span className="p-nom" style={{ padding: "9px 0" }}>
                  <h4>{p.nom}</h4>
                  <span className="p-meta">
                    {p._manque !== undefined
                      ? (p._manque === 0 ? `${p._ok} sur place · rien ne manque` : `${p._ok} sur place · ${p._manque} manquant${p._manque > 1 ? "s" : ""}`)
                      : [p.cat, p.saison && p.saison !== "toute" ? nomSaison(p.saison).toLowerCase() : null, ...p.tags,
                        j !== null && j >= 0 && j <= 10 ? (j === 0 ? "fait aujourd'hui" : `fait il y a ${j} j`) : null].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <span className="muted"><Ic d={IcPlus} s={18} /></span>
              </button>
            );
          })}
          {!liste.length && (
            <div style={{ padding: "14px 0" }}>
              <span className="muted" style={{ fontSize: 14 }}>Aucun plat ici.</span>
              <div className="row" style={{ marginTop: 10 }}>
                <button className="btn flat sm" onClick={() => { setCatF("tous"); setTagF("tous"); setQ(""); setIdee(false); }}>Tout afficher</button>
                <button className="btn sm" onClick={() => setSheet({ t: "plat", plat: null })}>Créer un plat</button>
              </div>
            </div>
          )}
        </div>
        <p className="muted" style={{ fontSize: 12, margin: "14px 0 0" }}>
          Balayez la date pour changer de jour, la liste pour changer de catégorie. Tout est enregistré au fur et à mesure.
        </p>
      </div>
    </Sheet>
  );
}
