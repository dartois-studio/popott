import { useState } from "react";
import { seed } from "../exemple.js";
import { dateLisible, uid } from "../outils.js";
import { ListeCreneaux, ListeEditable } from "../ui/briques.jsx";
import { Ic, IcCompte, IcMaj, IcPen, IcPlus, IcR } from "../ui/icones.jsx";

/* ==========================================================================
   Ecran 4 — les reglages, le compte et la version.
   ========================================================================== */

/** Le compte connecté et le foyer qu'il partage. N'existe que quand la
 *  synchronisation est configurée : sans compte, il n'y a rien à dire. */
function BlocCompte({ compte }) {
  const [copie, setCopie] = useState(false);
  const depuis = compte.depuis ? dateLisible(compte.depuis) : "";

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(compte.foyerId);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch { /* pas de presse-papier : le code reste sélectionnable à la main */ }
  };

  return (
    <>
      <h3 className="sec">Compte</h3>
      <div className="card">
        <div className="line">
          <span className="muted" style={{ flex: "none", display: "grid" }}><Ic d={IcCompte} s={18} /></span>
          <span className="lbl">{compte.email}
            <span className="from">{depuis ? `Compte de cet appareil, depuis le ${depuis}` : "Compte de cet appareil"}</span>
          </span>
        </div>
        <div className="line" style={{ minHeight: 0, padding: "12px 14px 12px 12px", alignItems: "flex-start" }}>
          <span className="lbl">Code du foyer
            <span className="qty" style={{ display: "block", wordBreak: "break-all", marginTop: 3 }}>{compte.foyerId}</span>
          </span>
          <button className="btn ghost sm" style={{ flex: "none" }} onClick={copier}>{copie ? "Copié" : "Copier"}</button>
        </div>
      </div>
      <p className="muted" style={{ fontSize: 12.5, margin: "7px 0 0" }}>
        Le code se donne au deuxième téléphone, dans « Rallier un foyer existant ».
        Il se partage comme une clé de maison, pas comme une adresse.
      </p>
      <button className="btn ghost" style={{ width: "100%", marginTop: 12 }}
        onClick={compte.deconnecter}>Se déconnecter</button>
    </>
  );
}

/** Ce que ce téléphone a exactement dans les mains, et de quoi en changer.
 *  Sans service worker, on ne peut pas annoncer qu'une version plus récente
 *  existe : le bouton va chercher, il ne prévient pas. */
function BlocApplication({ version, surActualiser, flash }) {
  const publiee = version.date ? dateLisible(version.date, true) : "";
  const detail = [publiee && `Publiée le ${publiee}`, version.commit].filter(Boolean).join(" · ");

  return (
    <>
      <h3 className="sec">Application</h3>
      <div className="card">
        <div className="line">
          <span className="lbl">Version {version.numero}
            {detail && <span className="from">{detail}</span>}
          </span>
        </div>
        {surActualiser && (
          <button className="line" onClick={() => {
            flash("Récupération de la dernière version…");
            // L'enregistrement du document est différé de 400 ms : quitter la
            // page tout de suite emporterait la dernière modification.
            setTimeout(surActualiser, 700);
          }}>
            <span className="muted" style={{ flex: "none", display: "grid", color: "var(--aubergine)" }}><Ic d={IcMaj} s={18} /></span>
            <span className="lbl" style={{ color: "var(--aubergine)", fontWeight: 600 }}>Actualiser l'application
              <span className="from">Recharger le code depuis le serveur</span>
            </span>
          </button>
        )}
      </div>
      <p className="muted" style={{ fontSize: 12.5, margin: "7px 0 0" }}>
        Seul le code est retéléchargé : les plats, les menus et la liste de courses ne bougent pas.
      </p>
    </>
  );
}

export function EcranReglages({ ctx, ui, setUi }) {
  const { db, up, setDb, setSheet, flash, compte, version, surActualiser } = ctx;

  if (ui.reglagesVue === "ingredients") {
    return (
      <>
        <header className="top">
          <div>
            <button className="eyebrow" onClick={() => setUi({ reglagesVue: "menu" })}>← Réglages</button>
            <h1 className="title">Ingrédients</h1>
          </div>
          <button className="btn" onClick={() => setSheet({ t: "ingredient", ing: null })}><Ic d={IcPlus} s={18} /></button>
        </header>
        <div className="pad" style={{ paddingTop: 12 }}>
          <p className="muted" style={{ fontSize: 13, margin: 0 }}>
            Liste normalisée : c'est elle qui permet d'additionner les quantités entre les plats.
          </p>
          {db.rayons.map((r) => {
            const l = db.ingredients.filter((i) => i.rayonId === r.id).slice().sort((a, b) => a.nom.localeCompare(b.nom));
            if (!l.length) return null;
            return (
              <div key={r.id}>
                <h3 className="sec" style={{ color: r.couleur }}>{r.nom}</h3>
                <div className="card">
                  {l.map((i) => (
                    <button key={i.id} className="line" style={{ minHeight: 50 }} onClick={() => setSheet({ t: "ingredient", ing: i })}>
                      <span className="lbl">{i.nom}</span>
                      {i.garde && <span className="tag">garde-manger</span>}
                      <span className="qty">{i.unite || "—"}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          <div style={{ height: 24 }} />
        </div>
      </>
    );
  }

  return (
    <>
      <header className="top">
        <div>
          <div className="eyebrow">Le foyer et ses listes</div>
          <h1 className="title">Réglages</h1>
        </div>
      </header>
      <div className="pad" style={{ paddingTop: 4 }}>
        {/* En tete de page : « est-ce que j'ai bien la derniere version ? » est
            la question qu'on se pose en arrivant ici, pas apres avoir fait
            defiler les rayons et les categories. */}
        {version && <BlocApplication version={version} surActualiser={surActualiser} flash={flash} />}

        <h3 className="sec">Foyer</h3>
        <div className="card">
          {/* `key` sur la valeur : le champ n'est pas contrôlé, et sans ça un
              renommage venu de l'autre téléphone ne se verrait pas ici. */}
          <div className="line">
            <span className="muted" style={{ flex: "none", fontSize: 13 }}>Nom du foyer</span>
            <input key={db.nomFoyer} className="lbl inline-in" defaultValue={db.nomFoyer}
              placeholder="Chez nous" aria-label="Nom du foyer" style={{ textAlign: "right" }}
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v !== db.nomFoyer) up((d) => { d.nomFoyer = v; });
              }} />
          </div>
          {db.personnes.map((p) => (
            <button key={p.id} className="line" onClick={() => setSheet({ t: "personne", pers: p })}>
              <span className="lbl">{p.nom}{p.notes && <span className="from">{p.notes}</span>}</span>
              <span className="tag aub">{p.regime}</span>
              <span className="muted"><Ic d={IcPen} s={16} /></span>
            </button>
          ))}
          <button className="line" style={{ color: "var(--aubergine)" }} onClick={() => setSheet({ t: "personne", pers: null })}>
            <span className="box" style={{ border: 0, color: "var(--aubergine)" }}><Ic d={IcPlus} s={18} /></span>
            <span className="lbl" style={{ fontWeight: 600 }}>Ajouter une personne</span>
          </button>
        </div>

        <h3 className="sec">Ingrédients</h3>
        <div className="card">
          <button className="line" onClick={() => setUi({ reglagesVue: "ingredients" })}>
            <span className="lbl">Gérer les {db.ingredients.length} ingrédients<span className="from">Rayon, unité, garde-manger</span></span>
            <span className="muted"><Ic d={IcR} s={18} /></span>
          </button>
        </div>

        <ListeEditable titre="Rayons du magasin" placeholder="Nouveau rayon"
          note="L'ordre des rayons est l'ordre de parcours en magasin. Un rayon encore utilisé ne peut pas être supprimé."
          items={db.rayons.map((r) => ({ key: r.id, id: r.id, nom: r.nom, dot: r.couleur }))}
          onAdd={(n) => up((d) => d.rayons.push({ id: uid(), nom: n, couleur: "#6B6B63" }))}
          onDel={(it) => {
            if (db.ingredients.some((i) => i.rayonId === it.id)) { alert("Ce rayon contient encore des ingrédients."); return; }
            up((d) => { d.rayons = d.rayons.filter((r) => r.id !== it.id); });
          }}
          onRename={(it, v) => { if (v.trim()) up((d) => { const r = d.rayons.find((x) => x.id === it.id); if (r) r.nom = v.trim(); }); }} />

        <ListeCreneaux db={db} up={up} />

        <ListeEditable titre="Catégories de plats" placeholder="Nouvelle catégorie"
          items={db.categories.map((c) => ({ key: c, nom: c }))}
          onAdd={(n) => up((d) => d.categories.push(n))}
          onDel={(it) => up((d) => { d.categories = d.categories.filter((c) => c !== it.nom); })}
          onRename={(it, v) => {
            if (!v.trim() || v.trim() === it.nom) return;
            up((d) => {
              d.categories = d.categories.map((c) => (c === it.nom ? v.trim() : c));
              d.plats.forEach((p) => { if (p.cat === it.nom) p.cat = v.trim(); });
            });
          }} />

        {compte && <BlocCompte compte={compte} />}

        <h3 className="sec">Données</h3>
        <div className="card" style={{ padding: 14 }}>
          <p className="muted" style={{ fontSize: 13, margin: "0 0 12px" }}>
            {compte
              ? "Tout est enregistré sur cet appareil et partagé avec le foyer. Réinitialiser ici efface aussi les données des autres téléphones."
              : "Tout est enregistré sur cet appareil, et nulle part ailleurs."}
          </p>
          <button className="btn danger" style={{ width: "100%" }}
            onClick={() => {
              if (confirm("Remettre les données d'exemple ? Vos plats et menus seront perdus.")) {
                setDb(seed()); setUi({ reglagesVue: "menu" }); flash("Données d'exemple restaurées");
              }
            }}>Réinitialiser avec les données d'exemple</button>
        </div>
        <div style={{ height: 24 }} />
      </div>
    </>
  );
}
