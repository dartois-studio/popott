import { useState } from "react";
import { MOIS, TRIS, addJ, iso, parseISO, uid } from "../outils.js";
import { Sheet } from "../ui/briques.jsx";
import { Ic, IcCal, IcChk, IcCopie, IcEtoile, IcIdee, IcImport, IcMagie, IcTrash } from "../ui/icones.jsx";

/* ==========================================================================
   Les panneaux qui agissent sur la semaine entiere : tri, actions,
   copie d'une semaine a l'autre, semaines types, bilan.
   ========================================================================== */

export function SheetTri({ ctx, ui, setUi }) {
  const { setSheet } = ctx;
  const tri = ui.tri || "az";
  return (
    <Sheet title="Trier la bibliothèque" sub="Affichage" onClose={() => setSheet(null)}>
      <div className="card" style={{ marginTop: 12 }}>
        {TRIS.map((t) => (
          <button key={t.id} className="line" onClick={() => { setUi({ tri: t.id }); setSheet(null); }}>
            <span className="lbl">{t.nom}</span>
            {tri === t.id && <span style={{ color: "var(--vert)" }}><Ic d={IcChk} s={18} /></span>}
          </button>
        ))}
      </div>
    </Sheet>
  );
}

export function SheetActionsSemaine({ ctx }) {
  const { db, up, setSheet, semaine, datesSem, flash } = ctx;
  const nb = db.repas.filter((r) => datesSem.includes(r.date) && r.platIds.length).length;
  const vider = () => {
    if (!confirm("Vider toute la semaine affichée ?")) return;
    up((d) => { d.repas = d.repas.filter((r) => !datesSem.includes(r.date)); });
    setSheet(null);
    flash("Semaine vidée");
  };
  return (
    <Sheet title="Cette semaine" sub={`${nb} repas`} onClose={() => setSheet(null)}>
      <div className="card" style={{ marginTop: 12 }}>
        <button className="line" onClick={() => setSheet({ t: "remplissage" })}>
          <span className="muted"><Ic d={IcMagie} s={18} /></span>
          <span className="lbl">Composer automatiquement<span className="from">Une proposition à ajuster</span></span>
        </button>
        <button className="line" onClick={() => setSheet({ t: "inverse" })}>
          <span className="muted"><Ic d={IcIdee} s={18} /></span>
          <span className="lbl">Trouver une idée<span className="from">Partir de ce qu'on a et poser dans le calendrier</span></span>
        </button>
        <button className="line" onClick={() => setSheet({ t: "copie", sens: "vers" })}>
          <span className="muted"><Ic d={IcCopie} s={18} /></span>
          <span className="lbl">Copier vers une autre semaine<span className="from">Cette semaine sert de modèle</span></span>
        </button>
        <button className="line" onClick={() => setSheet({ t: "copie", sens: "depuis" })}>
          <span className="muted"><Ic d={IcImport} s={18} /></span>
          <span className="lbl">Importer depuis une autre semaine<span className="from">Remplace la semaine affichée</span></span>
        </button>
        <button className="line" onClick={() => setSheet({ t: "presets" })}>
          <span className="muted"><Ic d={IcCal} s={18} /></span>
          <span className="lbl">Importer une semaine type<span className="from">{db.presets.length} modèle{db.presets.length > 1 ? "s" : ""} enregistré{db.presets.length > 1 ? "s" : ""}</span></span>
        </button>
        <button className="line" onClick={() => setSheet({ t: "preset-save" })} disabled={!nb}>
          <span className="muted"><Ic d={IcEtoile} s={18} /></span>
          <span className="lbl">Enregistrer comme semaine type</span>
        </button>
        <button className="line" onClick={vider} style={{ color: "#8E2F2F" }} disabled={!nb}>
          <span><Ic d={IcTrash} s={18} /></span><span className="lbl">Vider la semaine</span>
        </button>
      </div>
    </Sheet>
  );
}

export function SheetCopie({ ctx, sens }) {
  const { db, up, setSheet, semaine, jours, datesSem, flash } = ctx;
  const vers = sens === "vers";
  const source = db.repas.filter((r) => datesSem.includes(r.date) && r.platIds.length);

  const semaines = [-3, -2, -1, 1, 2, 3, 4].map((k) => {
    const l = addJ(semaine, k * 7);
    const f = addJ(l, 6);
    const dedans = db.repas.filter((r) => r.platIds.length && r.date >= iso(l) && r.date <= iso(f));
    return {
      k, l,
      libelle: k === 1 ? "Semaine prochaine" : k === -1 ? "Semaine dernière"
        : `${k > 0 ? "Dans" : "Il y a"} ${Math.abs(k)} semaines`,
      dates: `${l.getDate()} – ${f.getDate()} ${MOIS[f.getMonth()]}`,
      nb: dedans.length,
    };
  }).filter((c) => (vers ? true : c.nb > 0));

  const copier = (c) => {
    if (vers) {
      if (c.nb && !confirm(`La semaine du ${c.dates} contient déjà ${c.nb} repas. Ils seront remplacés.`)) return;
    } else if (source.length && !confirm("Les repas de la semaine affichée seront remplacés.")) return;

    up((d) => {
      const decal = vers ? c.k * 7 : -c.k * 7;
      const datesSource = vers ? datesSem : Array.from({ length: 7 }, (_, i) => iso(addJ(c.l, i)));
      const src = d.repas.filter((r) => datesSource.includes(r.date) && r.platIds.length);
      const datesCible = datesSource.map((dt) => iso(addJ(parseISO(dt), decal)));
      d.repas = d.repas.filter((r) => !datesCible.includes(r.date));
      src.forEach((r) => {
        const copie = structuredClone(r);
        copie.id = uid();
        copie.date = iso(addJ(parseISO(r.date), decal));
        d.repas.push(copie);
      });
    });
    setSheet(null);
    flash(vers ? "Semaine copiée" : "Semaine importée");
  };

  return (
    <Sheet title={vers ? "Copier vers…" : "Importer depuis…"}
      sub={vers ? `${source.length} repas à recopier` : "La semaine affichée sera remplacée"}
      onClose={() => setSheet(null)}>
      {vers && !source.length ? (
        <p style={{ fontSize: 14, marginTop: 14 }}>Cette semaine est vide, il n'y a rien à copier.</p>
      ) : !semaines.length ? (
        <p style={{ fontSize: 14, marginTop: 14 }}>Aucune semaine remplie à proximité. Essayez une semaine type.</p>
      ) : (
        <>
          <div className="card" style={{ marginTop: 12 }}>
            {semaines.map((c) => (
              <button key={c.k} className="line" onClick={() => copier(c)}>
                <span className="lbl">{c.libelle}<span className="from">{c.dates}</span></span>
                {c.nb > 0 && <span className={vers ? "tag warn" : "tag"}>{c.nb} repas</span>}
                <span className="muted"><Ic d={IcR} s={18} /></span>
              </button>
            ))}
          </div>
          <p className="muted" style={{ fontSize: 12.5, marginTop: 10 }}>
            Repas quotidiens, créneaux en vrac et ajustements sont recopiés à l'identique.
          </p>
        </>
      )}
    </Sheet>
  );
}

export function SheetPresetSave({ ctx }) {
  const { db, up, setSheet, jours, datesSem, flash } = ctx;
  const [nom, setNom] = useState("");
  const source = db.repas.filter((r) => datesSem.includes(r.date) && r.platIds.length);
  const enregistrer = () => {
    const entrees = source.map((r) => {
      const cr = db.creneaux.find((c) => c.id === r.creneauId);
      const jour = cr?.portee === "semaine" ? null : jours.findIndex((j) => iso(j) === r.date);
      return { jour, creneauId: r.creneauId, platIds: [...r.platIds], convives: [...r.convives], repetitions: r.repetitions || 1 };
    });
    up((d) => d.presets.push({ id: uid(), nom: nom.trim() || `Semaine type ${d.presets.length + 1}`, entrees }));
    setSheet(null);
    flash("Semaine type enregistrée");
  };
  return (
    <Sheet title="Enregistrer comme semaine type" sub={`${source.length} repas`} onClose={() => setSheet(null)}
      actions={<button className="btn" onClick={enregistrer} disabled={!source.length}>Enregistrer</button>}>
      <label className="f"><span>Nom du modèle</span>
        <input value={nom} placeholder="Semaine d'hiver, semaine light…" onChange={(e) => setNom(e.target.value)} /></label>
      <p className="muted" style={{ fontSize: 12.5, marginTop: 10 }}>
        Le modèle retient les plats, les convives et les créneaux, mais pas les dates : il se pose ensuite sur n'importe quelle semaine.
      </p>
    </Sheet>
  );
}

export function SheetPresets({ ctx }) {
  const { db, up, setSheet, semaine, jours, datesSem, flash } = ctx;
  const lundiSem = iso(semaine);
  const occupee = db.repas.some((r) => datesSem.includes(r.date) && r.platIds.length);

  const appliquer = (pr) => {
    if (occupee && !confirm("Les repas de la semaine affichée seront remplacés.")) return;
    up((d) => {
      d.repas = d.repas.filter((r) => !datesSem.includes(r.date));
      pr.entrees.forEach((e) => {
        d.repas.push({
          id: uid(), date: e.jour == null ? lundiSem : iso(jours[e.jour]), creneauId: e.creneauId,
          platIds: [...e.platIds], convives: [...e.convives], repetitions: e.repetitions || 1, ajust: [],
        });
      });
    });
    setSheet(null);
    flash(`« ${pr.nom} » appliquée`);
  };

  return (
    <Sheet title="Semaines types" sub="Importer un modèle" onClose={() => setSheet(null)}>
      <div className="card" style={{ marginTop: 12 }}>
        {db.presets.map((pr) => (
          <div key={pr.id} className="line">
            <button className="lbl" style={{ textAlign: "left" }} onClick={() => appliquer(pr)}>
              {pr.nom}<span className="from">{pr.entrees.length} repas · poser sur la semaine affichée</span>
            </button>
            <button className="icon-btn" aria-label={`Supprimer ${pr.nom}`}
              onClick={() => up((d) => { d.presets = d.presets.filter((x) => x.id !== pr.id); })}><Ic d={IcTrash} s={17} /></button>
          </div>
        ))}
        {!db.presets.length && (
          <div style={{ padding: 16 }} className="muted">
            Aucune semaine type. Composez une semaine qui vous plaît, puis enregistrez-la depuis le menu de la semaine.
          </div>
        )}
      </div>
    </Sheet>
  );
}

export function SheetBilan({ ctx }) {
  const { db, setSheet, setTab, datesSem, courses, platOf } = ctx;
  const repasSem = db.repas.filter((r) => datesSem.includes(r.date) && r.platIds.length);
  const creneauxJour = db.creneaux.filter((c) => c.portee !== "semaine");
  const repasJour = repasSem.filter((r) => creneauxJour.some((c) => c.id === r.creneauId));
  const vege = repasJour.filter((r) => r.platIds.every((p) => platOf(p)?.tags.includes("végétarien"))).length;
  const compte = {};
  repasJour.forEach((r) => r.platIds.forEach((p) => { compte[p] = (compte[p] || 0) + 1; }));
  const repetes = Object.entries(compte).filter(([, n]) => n > 1)
    .map(([id, n]) => ({ nom: platOf(id)?.nom, n })).filter((x) => x.nom);
  const vides = creneauxJour.length * 7 - repasJour.length;

  return (
    <Sheet title="Bilan de la semaine" sub="Coup d'œil" onClose={() => setSheet(null)}
      actions={<button className="btn" onClick={() => { setSheet(null); setTab("courses"); }}>Voir la liste de courses</button>}>
      <div className="bilan">
        <span><b>{repasJour.length}<em>/{creneauxJour.length * 7}</em></b>repas posés</span>
        <span><b>{vege}</b>sans viande</span>
        <span><b>{courses.restants}</b>à acheter</span>
      </div>
      <p style={{ fontSize: 14, marginTop: 16 }}>
        {vides > 0 ? `${vides} créneau${vides > 1 ? "x" : ""} encore vide${vides > 1 ? "s" : ""}.` : "Tous les créneaux sont remplis."}
      </p>
      {repetes.length > 0 ? (
        <p style={{ fontSize: 14 }}>
          Revient plusieurs fois : {repetes.map((r) => `${r.nom} (${r.n}×)`).join(", ")}.
        </p>
      ) : <p style={{ fontSize: 14 }}>Aucun plat en double cette semaine.</p>}
      <p className="muted" style={{ fontSize: 13 }}>
        Le compte des repas ne porte que sur les créneaux quotidiens ; le petit déjeuner, le goûter et l'apéro sont comptés en vrac.
      </p>
    </Sheet>
  );
}
