import { useState } from "react";
import { REGIMES, UNITES, uid } from "../outils.js";
import { Sheet, Switch } from "../ui/briques.jsx";
import { Ic, IcTrash } from "../ui/icones.jsx";

/* ==========================================================================
   Les trois fiches courtes : ingredient, personne, article hors menu.
   ========================================================================== */

export function SheetIngredient({ ctx, ing }) {
  const { db, up, setSheet } = ctx;
  const [f, setF] = useState(() => ing ? { ...ing } : { id: uid(), nom: "", rayonId: db.rayons[0].id, unite: "", garde: false });
  const supprimer = () => {
    if (db.plats.some((p) => p.lignes.some((l) => l.ingId === ing.id))) {
      alert("Cet ingrédient est utilisé dans au moins un plat. Retirez-le des plats avant de le supprimer.");
      return;
    }
    up((d) => { d.ingredients = d.ingredients.filter((i) => i.id !== ing.id); });
    setSheet(null);
  };
  return (
    <Sheet title={ing ? ing.nom : "Nouvel ingrédient"} sub="Ingrédient" onClose={() => setSheet(null)}
      actions={<>
        {ing && <button className="btn danger" onClick={supprimer} aria-label="Supprimer"><Ic d={IcTrash} s={17} /></button>}
        <button className="btn" disabled={!f.nom.trim()} onClick={() => {
          up((d) => { const i = d.ingredients.findIndex((x) => x.id === f.id); if (i >= 0) d.ingredients[i] = f; else d.ingredients.push(f); });
          setSheet(null);
        }}>Enregistrer</button>
      </>}>
      <label className="f"><span>Nom</span><input value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} placeholder="Courgette" /></label>
      <label className="f"><span>Rayon</span>
        <select value={f.rayonId} onChange={(e) => setF({ ...f, rayonId: e.target.value })}>
          {db.rayons.map((r) => <option key={r.id} value={r.id}>{r.nom}</option>)}
        </select></label>
      <label className="f"><span>Unité par défaut</span>
        <select value={f.unite} onChange={(e) => setF({ ...f, unite: e.target.value })}>
          {UNITES.map((u) => <option key={u || "sans"} value={u}>{u || "— sans unité"}</option>)}
        </select></label>
      <div style={{ marginTop: 10, borderTop: "1px solid var(--line)" }}>
        <Switch on={f.garde} onChange={(v) => setF({ ...f, garde: v })}
          label="Garde-manger permanent" hint="Toujours en stock : jamais listé dans les courses" />
      </div>
    </Sheet>
  );
}

export function SheetPersonne({ ctx, pers }) {
  const { db, up, setSheet } = ctx;
  const [f, setF] = useState(() => pers ? { ...pers } : { id: uid(), nom: "", regime: "standard", notes: "" });
  return (
    <Sheet title={pers ? pers.nom : "Nouvelle personne"} sub="Foyer" onClose={() => setSheet(null)}
      actions={<>
        {pers && db.personnes.length > 1 && <button className="btn danger" aria-label="Supprimer" onClick={() => {
          up((d) => {
            d.personnes = d.personnes.filter((p) => p.id !== pers.id);
            d.repas.forEach((r) => {
              r.convives = r.convives.filter((c) => c !== pers.id);
              r.ajust = (r.ajust || []).filter((a) => a.personneId !== pers.id);
            });
          });
          setSheet(null);
        }}><Ic d={IcTrash} s={17} /></button>}
        <button className="btn" disabled={!f.nom.trim()} onClick={() => {
          up((d) => { const i = d.personnes.findIndex((p) => p.id === f.id); if (i >= 0) d.personnes[i] = f; else d.personnes.push(f); });
          setSheet(null);
        }}>Enregistrer</button>
      </>}>
      <label className="f"><span>Prénom</span><input value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} placeholder="Léa" /></label>
      <label className="f"><span>Régime par défaut</span>
        <select value={f.regime} onChange={(e) => setF({ ...f, regime: e.target.value })}>
          {REGIMES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select></label>
      <label className="f"><span>Notes</span>
        <textarea rows="3" value={f.notes} placeholder="Allergies, préférences…" onChange={(e) => setF({ ...f, notes: e.target.value })} /></label>
      <p className="muted" style={{ fontSize: 12.5 }}>Le régime se pré-remplit à la composition d'un repas et reste modifiable à la volée.</p>
    </Sheet>
  );
}

export function SheetManuel({ ctx }) {
  const { db, up, setSheet, flash } = ctx;
  const [f, setF] = useState({ libelle: "", qte: 1, unite: "pièce", rayonId: db.rayons[0].id });
  return (
    <Sheet title="Article hors menu" sub="Liste de courses" onClose={() => setSheet(null)}
      actions={<button className="btn" disabled={!f.libelle.trim()} onClick={() => {
        up((d) => d.manuels.push({ id: uid(), ...f, libelle: f.libelle.trim(), etat: "todo" }));
        setSheet(null); flash("Ajouté à la liste");
      }}>Ajouter à la liste</button>}>
      <label className="f"><span>Article</span>
        <input value={f.libelle} onChange={(e) => setF({ ...f, libelle: e.target.value })} placeholder="Sacs poubelle, éponges…" /></label>
      <div className="row">
        <label className="f" style={{ width: 110 }}><span>Quantité</span>
          <input type="number" min="0" step="any" value={f.qte} onChange={(e) => setF({ ...f, qte: +e.target.value })} /></label>
        <label className="f" style={{ flex: 1 }}><span>Unité</span>
          <select value={f.unite} onChange={(e) => setF({ ...f, unite: e.target.value })}>
            {UNITES.map((u) => <option key={u || "sans"} value={u}>{u || "— sans unité"}</option>)}
          </select></label>
      </div>
      <label className="f"><span>Rayon</span>
        <select value={f.rayonId} onChange={(e) => setF({ ...f, rayonId: e.target.value })}>
          {db.rayons.map((r) => <option key={r.id} value={r.id}>{r.nom}</option>)}
        </select></label>
    </Sheet>
  );
}
