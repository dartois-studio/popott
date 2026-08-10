/* ==========================================================================
   Popott — portail de synchronisation

   Ce module n'est charge que si Supabase est configure. Il enchaine :
   connexion → foyer → branchement du stockage partage → `Proto`.

   Un point de sequencement compte : `Proto` lit `window.storage` des son
   premier effet. Il ne doit donc pas etre rendu avant que le stockage
   partage soit en place, sinon il lirait le stockage local et repartirait
   des donnees d'exemple. D'ou l'etat `branche`.
   ========================================================================== */

import React, { useState, useEffect } from "react";
import Proto from "./Proto.jsx";
import { usePortail, EcranPortail, Liaison } from "./auth.jsx";
import { installerStockageDistant } from "./storage-distant.js";

/** Suit `#compte` dans l'adresse. Une ancre plutot qu'un bouton : la maquette
 *  du proto ne prevoit pas d'entree « compte », et en glisser une deplacerait
 *  des arbitrages ecrits dans doc/03-decisions.md. */
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

  useEffect(() => {
    if (etape !== "pret" || !foyerId || !membreId) { setBranche(false); return; }

    const liaison = installerStockageDistant(foyerId, membreId);
    setBranche(true);

    return () => { liaison.arreter(); setBranche(false); };
  }, [etape, foyerId, membreId]);

  if (etape !== "pret") return <EcranPortail portail={portail} />;
  if (!branche) return null; // le temps d'un rendu, avant que Proto ne lise

  return (
    <>
      <Proto />
      <Liaison />
      {compteOuvert && (
        <div className="pop-calque">
          <EcranPortail portail={portail} />
        </div>
      )}
    </>
  );
}
