import { useState, useEffect, useMemo } from "react";
import { uid } from "../outils.js";
import { Ic, IcTrash, IcX } from "./icones.jsx";

/* ==========================================================================
   Les briques d'interface reutilisees par plusieurs ecrans : le panneau
   coulissant, l'interrupteur, le champ d'ingredient normalise et les deux
   listes editables des reglages.
   ========================================================================== */

export function Sheet({ title, sub, onClose, children, actions, plein, entete }) {
  useEffect(() => {
    const k = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className={"sheet" + (plein ? " plein" : "")} role="dialog" aria-modal="true" aria-label={typeof title === "string" ? title : "Repas"}>
        <div className="sheet-h">
          <div style={{ minWidth: 0 }}>
            {sub && <div className="eyebrow">{sub}</div>}
            <h2>{title}</h2>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Fermer"><Ic d={IcX} s={20} /></button>
        </div>
        {entete && <div className="sheet-e">{entete}</div>}
        <div className="sheet-b">{children}</div>
        {actions && <div className="sheet-f">{actions}</div>}
      </div>
    </>
  );
}

export function Switch({ on, onChange, label, hint }) {
  return (
    <button className="switch" onClick={() => onChange(!on)} aria-pressed={on}>
      <span>
        <span style={{ display: "block", fontSize: 14.5 }}>{label}</span>
        {hint && <span className="muted" style={{ fontSize: 12.5 }}>{hint}</span>}
      </span>
      <span className="sw" data-on={on ? 1 : 0}><i /></span>
    </button>
  );
}

export function IngredientCombo({ ingredients, onPick, onCreate, placeholder = "Ajouter un ingrédient…" }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const res = useMemo(() => {
    const s = q.trim().toLowerCase();
    return ingredients.filter((i) => !s || i.nom.toLowerCase().includes(s)).slice(0, 40);
  }, [q, ingredients]);
  const exact = ingredients.some((i) => i.nom.toLowerCase() === q.trim().toLowerCase());
  return (
    <div className="combo">
      <input value={q} placeholder={placeholder}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 180)} />
      {open && (
        <div className="combo-pop">
          {q.trim() && !exact && onCreate && (
            <button onMouseDown={(e) => e.preventDefault()} onClick={() => { onCreate(q.trim()); setQ(""); setOpen(false); }}>
              <span style={{ color: "var(--aubergine)", fontWeight: 600 }}>Créer « {q.trim()} »</span>
            </button>
          )}
          {res.map((i) => (
            <button key={i.id} onMouseDown={(e) => e.preventDefault()} onClick={() => { onPick(i); setQ(""); setOpen(false); }}>
              {i.nom}{i.unite && <span className="muted" style={{ fontSize: 12 }}> · {i.unite}</span>}
            </button>
          ))}
          {!res.length && !q.trim() && <div style={{ padding: 12 }} className="muted">Aucun ingrédient.</div>}
        </div>
      )}
    </div>
  );
}

export function ListeCreneaux({ db, up }) {
  const [nv, setNv] = useState("");
  const ajouter = () => {
    if (!nv.trim()) return;
    up((d) => d.creneaux.push({ id: uid(), nom: nv.trim(), portee: "jour" }));
    setNv("");
  };
  return (
    <>
      <h3 className="sec">Créneaux de repas</h3>
      <div className="card">
        {db.creneaux.map((c) => (
          <div key={c.id} className="line">
            <input className="lbl inline-in" defaultValue={c.nom} aria-label={c.nom}
              onBlur={(e) => { const v = e.target.value.trim(); if (v) up((d) => { const x = d.creneaux.find((y) => y.id === c.id); if (x) x.nom = v; }); }} />
            <button className="have-btn" style={{ minWidth: 86 }}
              onClick={() => up((d) => { const x = d.creneaux.find((y) => y.id === c.id); if (x) x.portee = x.portee === "semaine" ? "jour" : "semaine"; })}>
              {c.portee === "semaine" ? "semaine" : "chaque jour"}
            </button>
            <button className="icon-btn" aria-label={`Supprimer ${c.nom}`}
              onClick={() => up((d) => { d.creneaux = d.creneaux.filter((x) => x.id !== c.id); d.repas = d.repas.filter((r) => r.creneauId !== c.id); })}>
              <Ic d={IcTrash} s={17} />
            </button>
          </div>
        ))}
        <div className="line">
          <input className="inline-in" value={nv} placeholder="Nouveau créneau (brunch…)"
            onChange={(e) => setNv(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") ajouter(); }} />
          <button className="btn sm" disabled={!nv.trim()} onClick={ajouter}>Ajouter</button>
        </div>
      </div>
      <p className="muted" style={{ fontSize: 12.5, margin: "7px 0 0" }}>
        « Chaque jour » donne une ligne dans la grille de la semaine. « Semaine » regroupe tout en vrac, sans jour précis —
        pratique pour le petit déjeuner, le goûter ou l'apéro.
      </p>
    </>
  );
}

export function ListeEditable({ titre, items, onAdd, onDel, onRename, placeholder, note }) {
  const [nv, setNv] = useState("");
  const ajouter = () => { if (nv.trim()) { onAdd(nv.trim()); setNv(""); } };
  return (
    <>
      <h3 className="sec">{titre}</h3>
      <div className="card">
        {items.map((it) => (
          <div key={it.key} className="line">
            {it.dot && <span style={{ width: 10, height: 10, borderRadius: 3, background: it.dot, flex: "none" }} />}
            <input className="lbl inline-in" defaultValue={it.nom}
              onBlur={(e) => onRename(it, e.target.value)} aria-label={it.nom} />
            <button className="icon-btn" onClick={() => onDel(it)} aria-label={`Supprimer ${it.nom}`}><Ic d={IcTrash} s={17} /></button>
          </div>
        ))}
        <div className="line">
          <input className="inline-in" value={nv} placeholder={placeholder}
            onChange={(e) => setNv(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") ajouter(); }} />
          <button className="btn sm" disabled={!nv.trim()} onClick={ajouter}>Ajouter</button>
        </div>
      </div>
      {note && <p className="muted" style={{ fontSize: 12.5, margin: "7px 0 0" }}>{note}</p>}
    </>
  );
}
