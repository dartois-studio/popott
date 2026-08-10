import { MOIS, fmtQ, uid } from "../outils.js";
import { Ic, IcChk, IcPlus, IcR } from "../ui/icones.jsx";

/* ==========================================================================
   Ecran 3 — la liste de courses agregee, triee par rayon.
   ========================================================================== */

export function EcranCourses({ ctx, ui, setUi }) {
  const { db, up, setSheet, setTab, semaine, courses, flash } = ctx;
  const { groupes, garde, total, restants } = courses;
  const faits = total - restants;

  const setEtat = (item, etat) => {
    if (item.manuel) up((d) => { const m = d.manuels.find((x) => x.id === item.id); if (m) m.etat = etat; });
    else up((d) => { d.etats[item.key] = etat; });
  };

  return (
    <>
      <header className="top">
        <div style={{ minWidth: 0 }}>
          <div className="eyebrow">Semaine du {semaine.getDate()} {MOIS[semaine.getMonth()]}</div>
          <h1 className="title">Courses</h1>
        </div>
        <button className="btn ghost sm" onClick={() => setSheet({ t: "manuel" })}><Ic d={IcPlus} s={16} />Article</button>
      </header>

      <div className="pad" style={{ paddingTop: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 7 }}>
          <span className="qty">{faits} sur {total} dans le panier</span>
          {faits > 0 && (
            <button className="qty" style={{ color: "var(--aubergine)" }}
              onClick={() => up((d) => { d.etats = {}; d.manuels.forEach((m) => { m.etat = "todo"; }); })}>Tout décocher</button>
          )}
        </div>
        <div className="bar"><i style={{ width: total ? `${(faits / total) * 100}%` : "0%" }} /></div>
      </div>

      <div className="pad" style={{ marginTop: 16 }}>
        {!groupes.length ? (
          <div className="empty">
            <p>Rien à acheter : aucun plat n'est posé sur cette semaine.</p>
            <button className="btn" onClick={() => setTab("semaine")}>Composer le menu</button>
          </div>
        ) : (
          <>
            <div className="ticket">
              {groupes.map((g) => (
                <div key={g.rayon.id}>
                  <div className="rayon-h">
                    <span className="dot" style={{ background: g.rayon.couleur }} />
                    <b style={{ color: g.rayon.couleur }}>{g.rayon.nom}</b>
                    <span className="qty" style={{ marginLeft: "auto", fontSize: 11 }}>{g.items.filter((i) => i.etat === "todo").length}</span>
                  </div>
                  {g.items.map((it) => (
                    <div key={it.key} className="line" data-s={it.etat} role="button" tabIndex={0}
                      onClick={() => setEtat(it, it.etat === "done" ? "todo" : "done")}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setEtat(it, it.etat === "done" ? "todo" : "done"); } }}>
                      <span className="box">{it.etat === "done" && <Ic d={IcChk} s={15} />}</span>
                      <span className="lbl">
                        {it.nom}
                        {(it.sources.length > 0 || it.optionnel) && (
                          <span className="from">
                            {it.optionnel && <b style={{ color: "var(--ambre-text)" }}>optionnel{it.sources.length > 0 ? " · " : ""}</b>}
                            {it.sources.slice(0, 2).join(", ")}{it.sources.length > 2 ? "…" : ""}
                          </span>
                        )}
                        {it.manuel && <span className="from">ajouté à la main</span>}
                      </span>
                      <span className="qty">{fmtQ(it.qte)} {it.unite}</span>
                      <button className="have-btn" aria-label="J'ai déjà"
                        onClick={(e) => { e.stopPropagation(); setEtat(it, it.etat === "have" ? "todo" : "have"); }}>déjà</button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="ticket-edge" />
          </>
        )}

        {garde.length > 0 && (
          <>
            <h3 className="sec">Garde-manger — non listé</h3>
            <div className="card">
              <button className="plat" onClick={() => setUi({ ouvertGarde: !ui.ouvertGarde })}>
                <span style={{ flex: 1, fontSize: 14 }}>{garde.length} produits toujours en stock sont exclus</span>
                <span className="muted" style={{ display: "grid", transform: ui.ouvertGarde ? "rotate(90deg)" : "none" }}><Ic d={IcR} s={18} /></span>
              </button>
              {ui.ouvertGarde && garde.map((g) => (
                <div key={g.key} className="line" style={{ opacity: .75, minHeight: 48, borderTop: "1px solid var(--line-soft)" }}>
                  <span className="lbl" style={{ fontSize: 14 }}>{g.nom}</span>
                  <span className="qty">{fmtQ(g.qte)} {g.unite}</span>
                  <button className="have-btn" onClick={() => {
                    up((d) => d.manuels.push({ id: uid(), libelle: g.nom, qte: Math.max(1, Math.round(g.qte)), unite: g.unite, rayonId: g.rayonId, etat: "todo" }));
                    flash(`${g.nom} ajouté à la liste`);
                  }}>ajouter</button>
                </div>
              ))}
            </div>
            <p className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>Modifiable dans Réglages → Ingrédients.</p>
          </>
        )}
        <div style={{ height: 20 }} />
      </div>
    </>
  );
}
