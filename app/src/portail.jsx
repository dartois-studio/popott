/* ==========================================================================
   Popott — portail de synchronisation

   Ce module n'est charge que si Supabase est configure. Il enchaine :
   connexion → foyer → branchement du stockage partage → `App`.

   Un point de sequencement compte : `App` lit `window.storage` des son
   premier effet. Il ne doit donc pas etre rendu avant que le stockage
   partage soit en place, sinon il lirait le stockage local et repartirait
   des donnees d'exemple. D'ou l'etat `branche`.
   ========================================================================== */

import React, { useState, useEffect, useMemo } from "react";
import App from "./App.jsx";
import { usePortail, EcranPortail, Liaison } from "./auth.jsx";
import { installerStockageDistant } from "./storage-distant.js";
import { VERSION, actualiser } from "./version.js";

/** Suit `#compte` dans l'adresse. Les reglages ont desormais un bloc Compte,
 *  mais l'ancre reste : c'est la version plein ecran du meme contenu, et le
 *  seul chemin quand l'application n'est pas encore montee. */
function useAncreCompte() {
  const [ouvert, setOuvert] = useState(() => window.location.hash === "#compte");
  useEffect(() => {
    const surHash = () => setOuvert(window.location.hash === "#compte");
    window.addEventListener("hashchange", surHash);
    return () => window.removeEventListener("hashchange", surHash);
  }, []);
  return ouvert;
}

export default function Portail() {
  const portail = usePortail();
  const compteOuvert = useAncreCompte();
  const [branche, setBranche] = useState(false);

  const { etape, foyerId, membreId } = portail;

  /* Ce que les reglages ont besoin de savoir du compte. `App` ne connait ni
     Supabase ni la notion de session : il recoit des valeurs deja lues et une
     action a declencher, rien de plus. */
  const compte = useMemo(() => ({
    email: portail.email,
    foyerId: portail.foyerId,
    depuis: portail.session?.user?.created_at || null,
    deconnecter: portail.deconnecter,
  }), [portail.email, portail.foyerId, portail.session?.user?.created_at, portail.deconnecter]);

  useEffect(() => {
    if (etape !== "pret" || !foyerId || !membreId) { setBranche(false); return; }

    const liaison = installerStockageDistant(foyerId, membreId);
    setBranche(true);

    return () => { liaison.arreter(); setBranche(false); };
  }, [etape, foyerId, membreId]);

  if (etape !== "pret") return <EcranPortail portail={portail} />;
  if (!branche) return null; // le temps d'un rendu, avant que App ne lise

  return (
    <>
      <App compte={compte} version={VERSION} surActualiser={actualiser} />
      <Liaison />
      {compteOuvert && (
        <div className="pop-calque">
          <EcranPortail portail={portail} />
        </div>
      )}
    </>
  );
}
