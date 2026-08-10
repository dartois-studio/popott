# Roadmap et points ouverts

## Phases

| Phase | Contenu | État |
|---|---|---|
| 0 — Cahier des charges | Ce dossier | ✅ |
| 1 — Proto UX/UI | Quatre écrans, parcours central fonctionnel, données locales | ✅ |
| 2 — Fonctionnel local | Profils, recherche par ingrédients, anti-répétition, garde-manger, ajustements, semaines types, remplissage automatique | ✅ *(absorbé par le proto)* |
| 3 — Persistance locale | Sauvegarde sur l'appareil, survit au rechargement | ✅ |
| 4 — Synchronisation | Stockage en ligne partagé, comptes, temps réel à deux | ✅ |
| 5 — PWA / finitions | Service worker, hors-ligne, optimisations magasin | à faire |

Le prototype a absorbé les phases 2 et 3 en avance.

## Prochaine étape concrète

**Vivre une semaine avec, à deux.** L'application persiste, tourne sur téléphone et
partage désormais ses données entre les appareils du foyer : c'est maintenant l'usage
réel qui dira ce qui manque, pas une liste de fonctionnalités. La mise en route de la
synchronisation est décrite dans `07-synchronisation.md`.

Le découpage de `App.jsx` est fait : les 2 430 lignes du prototype — monolithique par
construction, un proto se lit d'un bloc — sont réparties en seize modules (`ecrans/`,
`feuilles/`, `ui/`, `outils.js`). Pur déplacement de code : le DOM des quatre écrans et
des panneaux a été comparé caractère par caractère avant et après, à l'identique.

## Points encore ouverts

- **Service worker** : sans lui, les écritures survivent à la coupure réseau mais
  l'application ne se *lance* pas hors ligne. C'est ce qui manque pour le magasin.
- **Un seul document pour tout l'état** : chaque frappe renvoie le document entier au
  serveur. La fusion à trois voies rend ça sûr, pas léger. Le premier découpage utile
  serait de sortir `etats` — les cases cochées — dans sa propre clé ; le stockage le
  supporte déjà, c'est `App.jsx` qui n'écrit qu'une seule clé.
- **Le panneau compte est à l'adresse `#compte`**, hors de l'interface. Une entrée dans
  les réglages serait plus juste, mais déplacerait des arbitrages de mise en page.
- **Portions fines par personne** — reporté, voir `03-decisions.md`.
- **Restes et batch cooking** : un plat qui couvre plusieurs repas. Toucherait le modèle
  du repas planifié et la règle d'agrégation.
- **Conversion d'unités** : règle à définir avant de fusionner deux lignes d'un même
  ingrédient exprimé différemment.
- **Une valeur de fond à arbitrer** dans le design system, voir `05-design-system.md`.
