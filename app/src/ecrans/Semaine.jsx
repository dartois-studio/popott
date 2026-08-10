import { useState, useRef } from "react";
import { CAT_COULEURS, DOW, MOIS, addJ, iso, jourDe, lundi } from "../outils.js";
import { Ic, IcAuj, IcGrille, IcListe, IcPoints, IcStats } from "../ui/icones.jsx";

/* ==========================================================================
   Ecran 2 — le menu de la semaine.
   ========================================================================== */

export function EcranSemaine({ ctx, ui, setUi }) {
  const { db, setSheet, setTab, semaine, setSemaine, jours, datesSem, courses, platOf, persOf } = ctx;
  const vue = ui.semaineVue || "grille";
  const fin = addJ(semaine, 6);
  const auj = iso(new Date());
  const lundiSem = iso(semaine);
  const libelle = semaine.getMonth() === fin.getMonth()
    ? `${semaine.getDate()} – ${fin.getDate()} ${MOIS[fin.getMonth()]}`
    : `${semaine.getDate()} ${MOIS[semaine.getMonth()].slice(0, 4)}. – ${fin.getDate()} ${MOIS[fin.getMonth()].slice(0, 4)}.`;

  const repasSem = db.repas.filter((r) => datesSem.includes(r.date) && r.platIds.length);
  const creneauxJour = db.creneaux.filter((c) => c.portee !== "semaine");
  const creneauxHebdo = db.creneaux.filter((c) => c.portee === "semaine");
  const repasJour = repasSem.filter((r) => creneauxJour.some((c) => c.id === r.creneauId));

  const couleurCat = (cat) => {
    const k = db.categories.indexOf(cat);
    return k < 0 ? "#8A9A90" : CAT_COULEURS[k % CAT_COULEURS.length];
  };
  const teinte = (cat) => { const c = couleurCat(cat); return { background: c + "1F", color: c }; };

  /* --- Balayage horizontal pour changer de semaine (doigt ou souris) --- */
  const drag = useRef({ x: 0, y: 0, actif: false, dist: 0 });
  const [dx, setDx] = useState(0);
  const onDown = (e) => { drag.current = { x: e.clientX, y: e.clientY, actif: true, dist: 0 }; };
  const onMove = (e) => {
    if (!drag.current.actif) return;
    const d = e.clientX - drag.current.x;
    if (Math.abs(e.clientY - drag.current.y) > Math.abs(d) + 8) { drag.current.actif = false; setDx(0); return; }
    drag.current.dist = Math.abs(d);
    setDx(d);
  };
  const onUp = () => {
    if (!drag.current.actif) return;
    drag.current.actif = false;
    if (dx > 55) setSemaine(addJ(semaine, -7));
    else if (dx < -55) setSemaine(addJ(semaine, 7));
    setDx(0);
  };
  const ouvrir = (payload) => { if (drag.current.dist < 8) setSheet(payload); };

  const listePlats = (r, gros) => r.platIds.map((pid) => {
    const p = platOf(pid);
    if (!p) return null;
    return <span key={pid} className={gros ? "bloc-plat gros" : "bloc-plat"} style={teinte(p.cat)}>{p.nom}</span>;
  });

  return (
    <>
      <header className="top">
        <div style={{ minWidth: 0 }}>
          <div className="eyebrow">{repasSem.length} repas</div>
          <h1 className="title">{libelle}</h1>
        </div>
        <div style={{ display: "flex" }}>
          <button className="icon-btn" aria-label="Aller à la semaine en cours"
            style={lundiSem === iso(lundi(new Date())) ? { color: "var(--ink-3)", opacity: .45 } : { color: "var(--aubergine)" }}
            onClick={() => setSemaine(lundi(new Date()))}><Ic d={IcAuj} s={20} /></button>
          <button className="icon-btn" aria-label="Actions sur la semaine"
            onClick={() => setSheet({ t: "actions-semaine" })}><Ic d={IcPoints} s={20} /></button>
          <button className="icon-btn" aria-label="Bilan de la semaine"
            onClick={() => setSheet({ t: "bilan" })}><Ic d={IcStats} s={20} /></button>
          <button className="icon-btn" aria-label={vue === "grille" ? "Passer au détail" : "Passer à la grille"}
            onClick={() => setUi({ semaineVue: vue === "grille" ? "liste" : "grille" })}>
            <Ic d={vue === "grille" ? IcListe : IcGrille} s={20} />
          </button>
        </div>
      </header>

      <div className="swipe" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
        style={dx ? { transform: `translateX(${dx * 0.35}px)` } : undefined}>
        {vue === "grille" ? (
          <div className="grille">
            <div className="g-jours">
              {jours.map((d) => {
                const k = iso(d);
                const we = d.getDay() === 0 || d.getDay() === 6;
                return (
                  <span key={k} className={"g-day" + (k === auj ? " on" : "") + (we ? " we" : "")}>
                    <b>{DOW[(d.getDay() + 6) % 7]}</b><i>{d.getDate()}</i>
                  </span>
                );
              })}
            </div>
            {creneauxJour.map((c) => (
              <div key={c.id}>
                <div className="g-cren">{c.nom}</div>
                <div className="g-row">
                  {jours.map((d) => {
                    const k = iso(d);
                    const r = db.repas.find((x) => x.date === k && x.creneauId === c.id && x.platIds.length);
                    const partiel = r && r.convives.length !== db.personnes.length;
                    return (
                      <button key={k} className={"g-cell" + (k === auj ? " on" : "")}
                        aria-label={`${c.nom}, ${jourDe(d)}`}
                        onClick={() => ouvrir({ t: "repas", date: k, creneauId: c.id, repas: r })}>
                        {r ? <>{listePlats(r, false)}{partiel && <span className="g-pers">{r.convives.length}p</span>}</>
                          : <span className="g-vide">+</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="detail">
            {jours.map((d) => {
              const key = iso(d);
              return (
                <div key={key} className={"j-bloc" + (key === auj ? " on" : "")}>
                  <div className="j-tete">
                    <span className="num">{d.getDate()}</span>
                    <span className="dow">{DOW[(d.getDay() + 6) % 7]}</span>
                  </div>
                  {creneauxJour.map((c) => {
                    const r = db.repas.find((x) => x.date === key && x.creneauId === c.id && x.platIds.length);
                    return (
                      <button key={c.id} className="j-slot" onClick={() => ouvrir({ t: "repas", date: key, creneauId: c.id, repas: r })}>
                        <span className="slot-name">{c.nom}</span>
                        <span className="slot-body">
                          {r ? (
                            <>
                              {listePlats(r, true)}
                              <span className="qty" style={{ display: "block", marginTop: 3 }}>
                                {r.convives.length} couvert{r.convives.length > 1 ? "s" : ""}
                                {r.convives.length < db.personnes.length && ` · ${r.convives.map((u) => persOf(u)?.nom).filter(Boolean).join(", ")}`}
                                {(r.ajust || []).length > 0 && ` · ${r.ajust.length} ajustement${r.ajust.length > 1 ? "s" : ""}`}
                              </span>
                            </>
                          ) : <span className="slot-empty">+ Ajouter un plat</span>}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        <div className="hebdo">
          <div className="g-cren" style={{ margin: "0 0 6px 2px" }}>En vrac pour la semaine</div>
          {creneauxHebdo.map((c) => {
            const r = db.repas.find((x) => x.date === lundiSem && x.creneauId === c.id && x.platIds.length);
            return (
              <button key={c.id} className="h-slot" onClick={() => ouvrir({ t: "repas", date: lundiSem, creneauId: c.id, repas: r })}>
                <span className="slot-name">{c.nom}</span>
                <span className="slot-body">
                  {r ? listePlats(r, true) : <span className="slot-empty">+ Prévoir</span>}
                </span>
                {r && <span className="h-fois">×{r.repetitions || 1}</span>}
              </button>
            );
          })}
        </div>
        <div style={{ height: 22 }} />
      </div>
    </>
  );
}
