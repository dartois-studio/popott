import { Logo } from "../Logo.jsx";
import { TRIS, joursDepuis, nomSaison } from "../outils.js";
import { Ic, IcIdee, IcPlus, IcPoints, IcTri } from "../ui/icones.jsx";

/* ==========================================================================
   Ecran 1 — la bibliotheque de plats.
   ========================================================================== */

export function EcranPlats({ ctx, ui, setUi }) {
  const { db, setSheet, derniereFois, version } = ctx;
  const { q, cat } = ui;
  const tri = ui.tri || "az";
  const rang = (p) => db.plats.indexOf(p);

  const liste = db.plats
    .filter((p) => (cat === "tous" || p.cat === cat) && (!q || p.nom.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => {
      if (tri === "za") return b.nom.localeCompare(a.nom);
      if (tri === "recent") return rang(b) - rang(a);
      if (tri === "ancien") return rang(a) - rang(b);
      if (tri === "oublies") return (derniereFois[a.id] || "").localeCompare(derniereFois[b.id] || "") || a.nom.localeCompare(b.nom);
      return a.nom.localeCompare(b.nom);
    });

  return (
    <>
      <header className="top">
        <div style={{ minWidth: 0 }}>
          <div className="eyebrow">{db.plats.length} plats · {(TRIS.find((t) => t.id === tri) || TRIS[0]).nom}</div>
          {/* Le numero se lit contre le bas du logotype : aligne sur la ligne
              de base, il accompagne la marque sans faire un second titre. */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 5 }}>
            <Logo height={26} style={{ color: "var(--aubergine)" }} />
            {version && <span className="v-mini">v{version.numero}</span>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <button className="icon-btn" aria-label="Trouver une idée" onClick={() => setSheet({ t: "inverse" })}>
            <Ic d={IcIdee} s={20} />
          </button>
          <button className="icon-btn" aria-label="Trier" onClick={() => setSheet({ t: "tri" })}><Ic d={IcTri} s={20} /></button>
          <button className="btn rond" aria-label="Nouveau plat" onClick={() => setSheet({ t: "plat", plat: null })}>
            <Ic d={IcPlus} s={20} />
          </button>
        </div>
      </header>

      <div className="pad" style={{ paddingTop: 12 }}>
        <input placeholder="Chercher un plat…" value={q} onChange={(e) => setUi({ q: e.target.value })} />
        <div className="chips-wrap">
          <button className="chip sm" data-on={cat === "tous" ? 1 : 0} onClick={() => setUi({ cat: "tous" })}>Tout</button>
          {db.categories.map((c) => (
            <button key={c} className="chip sm" data-on={cat === c ? 1 : 0} onClick={() => setUi({ cat: c })}>
              {c[0].toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>

        {!liste.length ? (
          <div className="empty">
            <p>Aucun plat ici. Ajoutez-en un pour commencer votre bibliothèque.</p>
            <button className="btn" onClick={() => setSheet({ t: "plat", plat: null })}>Créer un plat</button>
          </div>
        ) : (
          <div style={{ marginTop: 4 }}>
            {liste.map((p) => {
              const d = derniereFois[p.id];
              const j = d ? joursDepuis(d) : null;
              const infos = [
                p.cat,
                `${p.lignes.length} ingr.`,
                `${p.portions} parts`,
                p.saison && p.saison !== "toute" ? nomSaison(p.saison).toLowerCase() : null,
                ...p.tags,
                j !== null && j >= 0 && j <= 10 ? (j === 0 ? "fait aujourd'hui" : `fait il y a ${j} j`) : null,
              ].filter(Boolean);
              return (
                <div key={p.id} className="p-row">
                  <button className="p-nom" onClick={() => setSheet({ t: "plat", plat: p })}>
                    <h4>{p.nom}</h4>
                    <span className="p-meta">{infos.join(" · ")}</span>
                  </button>
                  <button className="icon-btn" aria-label={`Actions sur ${p.nom}`}
                    onClick={() => setSheet({ t: "actions-plat", plat: p })}><Ic d={IcPoints} s={19} /></button>
                </div>
              );
            })}
          </div>
        )}
        <div style={{ height: 16 }} />
      </div>
    </>
  );
}
