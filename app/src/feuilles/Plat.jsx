import { useState } from "react";
import { SAISONS, UNITES, uid } from "../outils.js";
import { IngredientCombo, Sheet } from "../ui/briques.jsx";
import { Ic, IcCopie, IcPen, IcTrash, IcX } from "../ui/icones.jsx";

/* ==========================================================================
   Editer un plat, et le menu de ses actions.
   ========================================================================== */

export function SheetPlat({ ctx, plat }) {
  const { db, up, setSheet, flash, ingOf } = ctx;
  const [f, setF] = useState(() => plat ? structuredClone(plat)
    : { id: uid(), nom: "", cat: db.categories.includes("plat") ? "plat" : db.categories[0], saison: "toute", tags: [], portions: 4, lignes: [] });
  const maj = (k, v) => setF((x) => ({ ...x, [k]: v }));

  const addIng = (ing) => setF((x) => ({ ...x, lignes: [...x.lignes, { id: uid(), ingId: ing.id, qte: 1, unite: ing.unite, optionnel: false }] }));
  const creerIng = (nom) => {
    const ni = { id: uid(), nom, rayonId: db.rayons[0].id, unite: "", garde: false };
    up((d) => d.ingredients.push(ni));
    addIng(ni);
  };
  const save = () => {
    if (!f.nom.trim()) return;
    up((d) => {
      const i = d.plats.findIndex((p) => p.id === f.id);
      if (i >= 0) d.plats[i] = f; else d.plats.push(f);
    });
    setSheet(null);
    flash(plat ? "Plat mis à jour" : "Plat ajouté à la bibliothèque");
  };
  const supprimer = () => {
    if (!confirm(`Supprimer « ${plat.nom} » ? Il sera aussi retiré des menus.`)) return;
    up((d) => {
      d.plats = d.plats.filter((p) => p.id !== plat.id);
      d.repas.forEach((r) => { r.platIds = r.platIds.filter((x) => x !== plat.id); });
      d.repas = d.repas.filter((r) => r.platIds.length);
    });
    setSheet(null);
  };

  return (
    <Sheet title={plat ? plat.nom : "Nouveau plat"} sub={plat ? "Modifier le plat" : "Bibliothèque"} onClose={() => setSheet(null)}
      actions={<>
        {plat && <button className="btn danger" onClick={supprimer} aria-label="Supprimer le plat"><Ic d={IcTrash} s={17} /></button>}
        <button className="btn" onClick={save} disabled={!f.nom.trim()}>Enregistrer</button>
      </>}>
      <label className="f"><span>Nom du plat</span>
        <input value={f.nom} onChange={(e) => maj("nom", e.target.value)} placeholder="Gratin de courgettes" /></label>

      <div className="row">
        <label className="f" style={{ flex: 1 }}><span>Catégorie</span>
          <select value={f.cat} onChange={(e) => maj("cat", e.target.value)}>
            {db.categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select></label>
        <label className="f" style={{ width: 122 }}><span>Recette pour</span>
          <input type="number" min="1" value={f.portions} onChange={(e) => maj("portions", Math.max(1, +e.target.value || 1))} /></label>
      </div>

      <label className="f"><span>Saison</span></label>
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
        {SAISONS.map((sa) => (
          <button key={sa.id} className="chip" data-on={(f.saison || "toute") === sa.id ? 1 : 0}
            onClick={() => maj("saison", sa.id)}>{sa.nom}</button>
        ))}
      </div>

      <label className="f"><span>Tags</span></label>
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
        {db.tags.map((t) => (
          <button key={t} className="chip" data-on={f.tags.includes(t) ? 1 : 0}
            onClick={() => maj("tags", f.tags.includes(t) ? f.tags.filter((x) => x !== t) : [...f.tags, t])}>{t}</button>
        ))}
      </div>

      <label className="f"><span>Ingrédients — {f.lignes.length}</span></label>
      <IngredientCombo ingredients={db.ingredients} onPick={addIng} onCreate={creerIng} />
      {f.lignes.map((l) => (
        <div key={l.id} className="ing-row" data-opt={l.optionnel ? 1 : 0}>
          <span className="nm">{ingOf(l.ingId)?.nom || "Ingrédient supprimé"}
            {l.optionnel && <span className="from">optionnel</span>}
          </span>
          <input type="number" min="0" step="any" value={l.qte} aria-label="Quantité"
            onChange={(e) => maj("lignes", f.lignes.map((x) => x.id === l.id ? { ...x, qte: +e.target.value } : x))} />
          <select value={l.unite} aria-label="Unité"
            onChange={(e) => maj("lignes", f.lignes.map((x) => x.id === l.id ? { ...x, unite: e.target.value } : x))}>
            {UNITES.map((u) => <option key={u || "sans"} value={u}>{u || "— sans unité"}</option>)}
          </select>
          <button className="opt-btn" aria-pressed={!!l.optionnel}
            aria-label={l.optionnel ? "Rendre obligatoire" : "Rendre optionnel"}
            onClick={() => maj("lignes", f.lignes.map((x) => x.id === l.id ? { ...x, optionnel: !x.optionnel } : x))}>opt</button>
          <button className="icon-btn" style={{ width: 34, height: 34 }} aria-label="Retirer l'ingrédient"
            onClick={() => maj("lignes", f.lignes.filter((x) => x.id !== l.id))}><Ic d={IcX} s={16} /></button>
        </div>
      ))}
      {!f.lignes.length && <p className="muted" style={{ fontSize: 13 }}>Sans ingrédients, ce plat n'alimentera pas la liste de courses.</p>}
      <p className="muted" style={{ fontSize: 12.5 }}>Les quantités valent pour {f.portions} parts. Elles seront ajustées au nombre de convives.</p>
      <p className="muted" style={{ fontSize: 12.5 }}>
        <b>opt</b> marque un ingrédient optionnel : il reste sur la liste de courses, signalé comme tel,
        et ne compte plus comme manquant quand on cherche une idée.
      </p>
    </Sheet>
  );
}

export function SheetActionsPlat({ ctx, plat }) {
  const { db, up, setSheet, flash } = ctx;
  const dupliquer = () => {
    const copie = structuredClone(plat);
    copie.id = uid();
    copie.nom = `${plat.nom} (copie)`;
    copie.lignes = copie.lignes.map((l) => ({ ...l, id: uid() }));
    up((d) => d.plats.push(copie));
    setSheet({ t: "plat", plat: copie });
    flash("Plat dupliqué");
  };
  const supprimer = () => {
    if (!confirm(`Supprimer « ${plat.nom} » ? Il sera aussi retiré des menus.`)) return;
    up((d) => {
      d.plats = d.plats.filter((p) => p.id !== plat.id);
      d.repas.forEach((r) => { r.platIds = r.platIds.filter((x) => x !== plat.id); });
      d.repas = d.repas.filter((r) => r.platIds.length);
    });
    setSheet(null);
    flash("Plat supprimé");
  };
  const fois = db.repas.filter((r) => r.platIds.includes(plat.id)).length;
  return (
    <Sheet title={plat.nom} sub={plat.cat} onClose={() => setSheet(null)}>
      <div className="card" style={{ marginTop: 12 }}>
        <button className="line" onClick={() => setSheet({ t: "plat", plat })}>
          <span className="muted"><Ic d={IcPen} s={18} /></span><span className="lbl">Modifier</span>
        </button>
        <button className="line" onClick={dupliquer}>
          <span className="muted"><Ic d={IcCopie} s={18} /></span>
          <span className="lbl">Dupliquer<span className="from">Pour une variante sans repartir de zéro</span></span>
        </button>
        <button className="line" onClick={supprimer} style={{ color: "#8E2F2F" }}>
          <span><Ic d={IcTrash} s={18} /></span>
          <span className="lbl">Supprimer{fois > 0 && <span className="from">Posé {fois} fois dans les menus</span>}</span>
        </button>
      </div>
    </Sheet>
  );
}
