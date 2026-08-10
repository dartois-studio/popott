# Roadmap et points ouverts

## Phases

| Phase | Contenu | État |
|---|---|---|
| 0 — Cahier des charges | Ce dossier | ✅ |
| 1 — Proto UX/UI | Quatre écrans, parcours central fonctionnel, données locales | ✅ |
| 2 — Fonctionnel local | Profils, recherche par ingrédients, anti-répétition, garde-manger, ajustements, semaines types, remplissage automatique | ✅ *(absorbé par le proto)* |
| 3 — Persistance locale | Sauvegarde sur l'appareil, survit au rechargement | ✅ |
| 4 — Synchronisation | Stockage en ligne partagé, comptes, temps réel à deux | à faire |
| 5 — PWA / finitions | Service worker, hors-ligne, optimisations magasin | à faire |

Le prototype a absorbé les phases 2 et 3 en avance.

## Prochaine étape concrète

**Vivre une semaine avec.** L'application persiste et tourne sur téléphone : c'est
maintenant l'usage réel qui dira ce qui manque, pas une liste de fonctionnalités.

En parallèle, indépendant du reste : **découper `Proto.jsx`**. Le fichier est monolithique par
construction (un prototype se lit d'un bloc), ce qui n'est plus tenable dès qu'on est
plusieurs à intervenir dessus. Le découpage doit être un pur déplacement de code, à rendu
identique.

## Points encore ouverts

- **Solution de synchro** : Supabase, Firebase, ou autre. Non tranché. Contrainte :
  deux appareils sur le même foyer, en temps réel, et un mode hors-ligne réel en magasin —
  donc une résolution de conflit à définir sur la case cochée. Le point d'accroche est déjà
  isolé : `proto/src/storage.js` expose `get / set / delete / list`, il suffit de remplacer
  son implémentation.
- **Portions fines par personne** — reporté, voir `03-decisions.md`.
- **Restes et batch cooking** : un plat qui couvre plusieurs repas. Toucherait le modèle
  du repas planifié et la règle d'agrégation.
- **Conversion d'unités** : règle à définir avant de fusionner deux lignes d'un même
  ingrédient exprimé différemment.
- **Une valeur de fond à arbitrer** dans le design system, voir `05-design-system.md`.
