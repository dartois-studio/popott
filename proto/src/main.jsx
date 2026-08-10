import React from "react";
import { createRoot } from "react-dom/client";
import "./brand.css";
import { installerStockage } from "./storage.js";
import { synchroDisponible } from "./config.js";
import { VERSION, actualiser, nettoyerAdresse } from "./version.js";
import Proto from "./Proto.jsx";

/* ==========================================================================
   Popott — point d'entree

   Deux chemins, selon que la synchronisation est configuree ou non.

   Sans Supabase (fichier `npm run solo`, projet fraichement clone, variables
   d'environnement absentes) : exactement l'ancien comportement, stockage sur
   l'appareil, aucun compte, aucune requete reseau.

   Avec Supabase : un portail demande qui on est et quel foyer, branche le
   stockage partage, puis rend `Proto` — qui n'a jamais su qu'il y avait un
   serveur derriere `window.storage`.

   Le chargement des modules de synchronisation est differe : sans
   configuration, le client Supabase et la fusion ne sont meme pas telecharges.
   ========================================================================== */

function Local() {
  installerStockage();
  return <Proto version={VERSION} surActualiser={actualiser} />;
}

/* Le portail n'est charge que si la synchronisation existe : `import()` sort
   tout ce code du bundle principal quand il ne sert pas. */
const Portail = React.lazy(() => import("./portail.jsx"));

function Application() {
  if (!synchroDisponible) return <Local />;
  return (
    <React.Suspense fallback={null}>
      <Portail />
    </React.Suspense>
  );
}

// Le parametre laisse par « Actualiser l'application » a servi au moment de
// la requete ; l'adresse n'a pas a le garder.
nettoyerAdresse();

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Application />
  </React.StrictMode>
);
