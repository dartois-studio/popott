import { useState, useMemo } from "react";
import { DOW, MOIS, addJ, iso, lundi, parseISO, teinteDe, uid } from "../outils.js";
import { IngredientCombo, Sheet } from "../ui/briques.jsx";
import { Ic, IcL, IcR } from "../ui/icones.jsx";

/* ==========================================================================
   Partir d'un plat pour choisir son jour, au lieu de partir du jour.
   Le mini-calendrier montre ce qui est deja pose avant qu'on pose.
   ========================================================================== */

/* Mini-calendrier de placement : on voit ce qui existe déjà avant de poser */
function MiniCalendrier({ ctx, onPose }) {
  const { db, semaine, platOf } = ctx;
  const [sem, setSem] = useState(() => {
    const l = lundi(new Date());
    return semaine > l ? new Date(semaine) : l;
  });
  const jrs = Array.from({ length: 7 }, (_, i) => addJ(sem, i));
  const creneauxJour = db.creneaux.filter((c) => c.portee !== "semaine");
  const auj = iso(new Date());
  const f = addJ(sem, 6);
  const titre = sem.getMonth() === f.getMonth()
    ? `${sem.getDate()} – ${f.getDate()} ${MOIS[f.getMonth()]}`
    : `${sem.getDate()} ${MOIS[sem.getMonth()].slice(0, 4)}. – ${f.getDate()} ${MOIS[f.getMonth()].slice(0, 4)}.`;

  return (
    <div className="minical">
      <div className="minical-nav">
        <button className="icon-btn" aria-label="Semaine précédente" onClick={() => setSem(addJ(sem, -7))}><Ic d={IcL} s={18} /></button>
        <span className="eyebrow">{titre}</span>
        <button className="icon-btn" aria-label="Semaine suivante" onClick={() => setSem(addJ(sem, 7))}><Ic d={IcR} s={18} /></button>
      </div>
      <div className="g-jours" style={{ position: "static" }}>
        {jrs.map((d) => (
          <span key={iso(d)} className={"g-day" + (iso(d) === auj ? " on" : "")}>
            <b>{DOW[(d.getDay() + 6) % 7]}</b><i>{d.getDate()}</i>
          </span>
        ))}
      </div>
      {creneauxJour.map((c) => (
        <div key={c.id}>
          <div className="g-cren" style={{ margin: "8px 0 3px 2px" }}>{c.nom}</div>
          <div className="g-row">
            {jrs.map((d) => {
              const date = iso(d);
              const r = db.repas.find((x) => x.date === date && x.creneauId === c.id && x.platIds.length);
              const ecart = Math.round((parseISO(date) - new Date().setHours(0, 0, 0, 0)) / 86400000);
              const nom = c.nom.toLowerCase();
              const libelle = ecart === 0 ? `ce ${nom}` : ecart === 1 ? `demain ${nom}`
                : `${DOW[(d.getDay() + 6) % 7]}. ${d.getDate()} ${nom}`;
              return (
                <button key={date} className={"g-cell" + (date === auj ? " on" : "")} aria-label={libelle}
                  onClick={() => onPose({ date, creneauId: c.id, libelle, occupe: !!r })}>
                  {r ? r.platIds.map((pid) => {
                    const p = platOf(pid);
                    return p ? <span key={pid} className="bloc-plat" style={teinteDe(db, p.cat)}>{p.nom}</span> : null;
                  }) : <span className="g-vide">+</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <p className="muted" style={{ fontSize: 12, margin: "10px 0 0" }}>
        Touchez une case libre, ou une case occupée pour y ajouter le plat.
      </p>
    </div>
  );
}

export function SheetInverse({ ctx, ui, setUi }) {
  const { db, up, setSheet, semaine, flash, ingOf } = ctx;
  const sel = ui.sel || [];
  const set = (v) => setUi({ sel: v });
  const [ouvert, setOuvert] = useState(null);   // plat dont on choisit le créneau
  const [poses, setPoses] = useState({});       // plat → libellé du créneau où il vient d'être posé

  const frequents = useMemo(() => {
    const n = {};
    db.plats.forEach((p) => p.lignes.forEach((l) => { n[l.ingId] = (n[l.ingId] || 0) + 1; }));
    return Object.entries(n).sort((a, b) => b[1] - a[1]).map(([id]) => ingOf(id))
      .filter((i) => i && !i.garde && !sel.includes(i.id)).slice(0, 8);
  }, [db.plats, sel]);

  const suggestions = useMemo(() => {
    if (!sel.length) return [];
    return db.plats.map((p) => {
      const ids = p.lignes.map((l) => l.ingId);
      const ok = sel.filter((s) => ids.includes(s)).length;
      const manque = p.lignes.filter((l) => !sel.includes(l.ingId) && !l.optionnel && !ingOf(l.ingId)?.garde);
      return { p, ok, manque };
    }).filter((x) => x.ok > 0).sort((a, b) => a.manque.length - b.manque.length || b.ok - a.ok);
  }, [sel, db.plats]);

  const poser = (platId, slot) => {
    up((d) => {
      const ex = d.repas.find((r) => r.date === slot.date && r.creneauId === slot.creneauId);
      if (ex) { if (!ex.platIds.includes(platId)) ex.platIds.push(platId); }
      else d.repas.push({
        id: uid(), date: slot.date, creneauId: slot.creneauId, platIds: [platId],
        convives: d.personnes.map((p) => p.id), repetitions: 1, ajust: [],
      });
    });
    setPoses((x) => ({ ...x, [platId]: slot.libelle }));
    setOuvert(null);
    flash(`Posé ${slot.libelle}`);
  };

  return (
    <Sheet title="Trouver une idée" sub="Avec ce que j'ai sous la main" onClose={() => setSheet(null)}
      actions={sel.length ? <button className="btn flat" onClick={() => set([])}>Tout retirer</button> : null}>

      <label className="f"><span>J'ai sous la main</span></label>
      <IngredientCombo ingredients={db.ingredients.filter((i) => !sel.includes(i.id))}
        placeholder="Ajouter un ingrédient…" onPick={(i) => set([...sel, i.id])} />

      {sel.length > 0 && (
        <div className="chips-wrap">
          {sel.map((id) => (
            <button key={id} className="chip sm" data-on="1" onClick={() => set(sel.filter((x) => x !== id))}>
              {ingOf(id)?.nom} ✕
            </button>
          ))}
        </div>
      )}

      {frequents.length > 0 && (
        <>
          <label className="f"><span>Les plus utilisés</span></label>
          <div className="chips-wrap" style={{ marginTop: 0 }}>
            {frequents.map((i) => <button key={i.id} className="chip sm" onClick={() => set([...sel, i.id])}>+ {i.nom}</button>)}
          </div>
        </>
      )}

      {sel.length > 0 && (
        <>
          <label className="f"><span>{suggestions.length} plat{suggestions.length > 1 ? "s" : ""} possible{suggestions.length > 1 ? "s" : ""}</span></label>
          {!suggestions.length && <p className="muted" style={{ fontSize: 13 }}>Aucun plat ne contient ces ingrédients.</p>}
          {suggestions.map(({ p, ok, manque }) => (
            <div key={p.id}>
              <div className="p-row">
                <button className="p-nom" onClick={() => setSheet({ t: "plat", plat: p })}>
                  <h4>{p.nom}</h4>
                  <span className="p-meta">
                    {manque.length === 0
                      ? `${ok} sur place · rien ne manque`
                      : `${ok} sur place · manque ${manque.slice(0, 3).map((l) => ingOf(l.ingId)?.nom).join(", ")}${manque.length > 3 ? `, +${manque.length - 3}` : ""}`}
                  </span>
                </button>
                {poses[p.id] ? (
                  <span className="tag ok">{poses[p.id]}</span>
                ) : (
                  <button className="btn ghost sm" onClick={() => setOuvert(ouvert === p.id ? null : p.id)}>
                    {ouvert === p.id ? "Annuler" : "Poser"}
                  </button>
                )}
              </div>
              {ouvert === p.id && <MiniCalendrier ctx={ctx} onPose={(slot) => poser(p.id, slot)} />}
            </div>
          ))}
          {suggestions.length > 0 && (
            <p className="muted" style={{ fontSize: 12.5, marginTop: 12 }}>
              « Poser » ouvre le calendrier : on voit ce qui est déjà prévu avant de choisir. Convives et ajustements se règlent ensuite dans la semaine.
            </p>
          )}
        </>
      )}
    </Sheet>
  );
}
