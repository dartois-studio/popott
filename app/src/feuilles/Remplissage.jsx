import { useState, useEffect } from "react";
import { DOW, addJ, iso, saisonDe, uid } from "../outils.js";
import { Sheet, Switch } from "../ui/briques.jsx";
import { Ic, IcDes, IcX } from "../ui/icones.jsx";

/* ==========================================================================
   Le remplissage automatique d'une semaine.
   ========================================================================== */

export function SheetRemplissage({ ctx }) {
  const { db, up, setSheet, flash, semaine, jours, datesSem, derniereFois, platOf } = ctx;
  const creneauxJour = db.creneaux.filter((c) => c.portee !== "semaine");
  const soir = creneauxJour.find((c) => c.id === "c2") || creneauxJour[creneauxJour.length - 1];
  const saisonSem = saisonDe(addJ(semaine, 3));
  const catPrincipale = db.categories.find((c) => c.toLowerCase().startsWith("plat")) || db.categories[0];
  const catEntree = db.categories.find((c) => c.toLowerCase().startsWith("entr"));
  const catDessert = db.categories.find((c) => c.toLowerCase().startsWith("dessert"));

  const [opt, setOpt] = useState({
    creneaux: creneauxJour.map((c) => c.id),
    ecraser: false,
    recents: true,
    saison: true,
    weekend: false,
  });
  const [reglages, setReglages] = useState(false);
  const [prop, setProp] = useState([]);
  const majO = (k, v) => setOpt((o) => ({ ...o, [k]: v }));

  /* Un tirage souple : on préfère, on n'exclut pas. */
  const tirer = (cat, exclus) => {
    let c = db.plats.filter((p) => p.cat === cat && !exclus.has(p.id));
    if (!c.length) c = db.plats.filter((p) => p.cat === cat);
    if (!c.length) return null;
    if (opt.saison) {
      const s = c.filter((p) => !p.saison || p.saison === "toute" || p.saison === saisonSem);
      if (s.length) c = s;
    }
    if (opt.recents && c.length > 2) {
      const tri = [...c].sort((a, b) => (derniereFois[a.id] || "").localeCompare(derniereFois[b.id] || ""));
      c = tri.slice(0, Math.max(2, Math.ceil(tri.length / 2)));
    }
    return c[Math.floor(Math.random() * c.length)];
  };

  const composerLigne = (cs, exclus) => {
    const ids = [];
    const principal = tirer(catPrincipale, exclus);
    if (principal) { ids.push(principal.id); exclus.add(principal.id); }
    if (opt.weekend && cs.weekend && (!soir || cs.creneauId === soir.id)) {
      const e = catEntree ? tirer(catEntree, exclus) : null;
      if (e) { ids.unshift(e.id); exclus.add(e.id); }
      const de = catDessert ? tirer(catDessert, exclus) : null;
      if (de) { ids.push(de.id); exclus.add(de.id); }
    }
    return ids;
  };

  const cases = () => {
    const l = [];
    jours.forEach((d, idx) => {
      opt.creneaux.forEach((cid) => {
        const date = iso(d);
        const pris = db.repas.find((r) => r.date === date && r.creneauId === cid && r.platIds.length);
        if (pris && !opt.ecraser) return;
        l.push({ date, creneauId: cid, weekend: idx >= 5, jour: d });
      });
    });
    return l;
  };

  const composer = () => {
    const exclus = new Set();
    db.repas.filter((r) => datesSem.includes(r.date)).forEach((r) => r.platIds.forEach((p) => exclus.add(p)));
    setProp(cases().map((cs) => ({ ...cs, platIds: composerLigne(cs, exclus) })).filter((x) => x.platIds.length));
  };

  const relancerLigne = (i) => {
    const exclus = new Set();
    db.repas.filter((r) => datesSem.includes(r.date)).forEach((r) => r.platIds.forEach((p) => exclus.add(p)));
    prop.forEach((x, k) => { if (k !== i) x.platIds.forEach((p) => exclus.add(p)); });
    setProp(prop.map((x, k) => (k === i ? { ...x, platIds: composerLigne(x, exclus) } : x)));
  };

  const retirer = (i) => setProp(prop.filter((_, k) => k !== i));

  useEffect(() => { composer(); /* eslint-disable-next-line */ }, [opt]);

  const appliquer = () => {
    up((d) => {
      prop.forEach((x) => {
        d.repas = d.repas.filter((r) => !(r.date === x.date && r.creneauId === x.creneauId));
        d.repas.push({
          id: uid(), date: x.date, creneauId: x.creneauId, platIds: x.platIds,
          convives: d.personnes.map((p) => p.id), repetitions: 1, ajust: [],
        });
      });
    });
    setSheet(null);
    flash(`${prop.length} repas posés`);
  };

  const nomCreneau = (id) => db.creneaux.find((c) => c.id === id)?.nom || "";

  return (
    <Sheet title="Composer la semaine" sub="Proposition" onClose={() => setSheet(null)}
      actions={<>
        <button className="btn flat" onClick={composer}>Relancer</button>
        <button className="btn" onClick={appliquer} disabled={!prop.length}>Poser sur la semaine</button>
      </>}>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
        <button className="chip sm" data-on={!opt.ecraser ? 1 : 0} onClick={() => majO("ecraser", false)}>Cases vides</button>
        <button className="chip sm" data-on={opt.ecraser ? 1 : 0} onClick={() => majO("ecraser", true)}>Tout recomposer</button>
        <button className="chip sm" data-on={reglages ? 1 : 0} style={{ marginLeft: "auto" }}
          onClick={() => setReglages(!reglages)}>Réglages</button>
      </div>

      {reglages && (
        <div className="card" style={{ padding: "4px 12px 12px", marginTop: 9 }}>
          <label className="f"><span>Créneaux</span></label>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {creneauxJour.map((c) => (
              <button key={c.id} className="chip sm" data-on={opt.creneaux.includes(c.id) ? 1 : 0}
                onClick={() => majO("creneaux", opt.creneaux.includes(c.id) ? opt.creneaux.filter((x) => x !== c.id) : [...opt.creneaux, c.id])}>
                {c.nom}
              </button>
            ))}
          </div>
          <Switch on={opt.recents} onChange={(v) => majO("recents", v)}
            label="Écarter les plats récents" hint="Pioche d'abord dans ce qu'on n'a pas fait depuis longtemps" />
          <Switch on={opt.saison} onChange={(v) => majO("saison", v)}
            label="Préférer la saison" hint={`Nous sommes en ${saisonSem === "ete" ? "été" : "hiver"}`} />
          <Switch on={opt.weekend} onChange={(v) => majO("weekend", v)}
            label="Entrée et dessert le week-end" hint="Sur le repas du soir, samedi et dimanche" />
        </div>
      )}

      {!prop.length ? (
        <p style={{ fontSize: 14, marginTop: 16 }}>
          Rien à composer : les cases choisies sont déjà remplies. Passez en « Tout recomposer » pour repartir de zéro.
        </p>
      ) : prop.map((x, i) => (
        <div key={x.date + x.creneauId} className="prop-ligne">
          <span className="slot-name">{DOW[(x.jour.getDay() + 6) % 7]} {x.jour.getDate()}</span>
          <span className="slot-body">
            <span className="eyebrow">{nomCreneau(x.creneauId)}</span>
            {x.platIds.map((pid) => (
              <span key={pid} style={{ display: "block", fontFamily: "var(--display)", fontSize: 16 }}>{platOf(pid)?.nom}</span>
            ))}
          </span>
          <button className="icon-btn" style={{ width: 34, height: 34 }} aria-label="Autre plat" onClick={() => relancerLigne(i)}>
            <Ic d={IcDes} s={17} />
          </button>
          <button className="icon-btn" style={{ width: 34, height: 34 }} aria-label="Laisser vide" onClick={() => retirer(i)}>
            <Ic d={IcX} s={16} />
          </button>
        </div>
      ))}
      {prop.length > 0 && (
        <p className="muted" style={{ fontSize: 12.5, marginTop: 12 }}>
          Le dé change un repas, la croix laisse la case vide. Rien n'est écrit tant que vous n'avez pas posé.
        </p>
      )}
    </Sheet>
  );
}
