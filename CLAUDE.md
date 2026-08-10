# Consignes de travail — Popott

## Le projet en une phrase

Une application de foyer qui recense les plats faits à la maison, sert à composer le
menu de la semaine, et en déduit la liste de courses agrégée et cochable en magasin.

## Ordre de lecture

Ne pas charger tout `doc/` d'un coup. Ouvrir seulement ce qui concerne la tâche :

| Tâche | Fichiers à lire |
|---|---|
| Comprendre le projet | `doc/00-projet.md` |
| Toucher aux données, à l'agrégation, aux quantités | `doc/01-modele-donnees.md` |
| Modifier un écran, un composant, un geste | `doc/02-ecrans.md` |
| Se demander « pourquoi c'est comme ça ? » | `doc/03-decisions.md` |
| Couleurs, typo, espacements, composants | `doc/05-design-system.md` |
| Logo, favicon, icône PWA | `doc/06-marque-et-icones.md` |
| Planifier | `doc/04-roadmap.md` |

## Règles

**Ne pas toucher aux appels `window.storage`** dans `Proto.jsx`. Ils viennent de
l'environnement d'origine du prototype et sont réimplémentés par `src/storage.js`.
C'est ce qui permet au fichier de tourner sans modification ici comme là-bas.

**Le proto fait autorité sur l'UX.** `proto/src/Proto.jsx` est le résultat de plusieurs
allers-retours de design. Avant de réécrire un comportement, vérifier qu'il n'est pas déjà
tranché dans `doc/03-decisions.md` — plusieurs solutions « évidentes » ont été essayées puis
abandonnées pour des raisons écrites.

**Rien de codé en dur côté catégories.** Rayons, créneaux, catégories de plats, régimes,
unités : ce sont des listes que l'utilisateur modifie dans les réglages. Ne jamais figer
une valeur métier dans un `switch`.

**Les ingrédients sont normalisés**, jamais du texte libre. C'est la condition de
l'agrégation des quantités. Un ajout à la volée crée une entrée réutilisable, pas une chaîne.

**Mobile d'abord.** Colonne de 540 px maximum, cible tactile de 44 px minimum, une action
principale par écran. Le desktop est un élargissement, pas une refonte.

**Français partout** : interface, noms de variables métier, commentaires, commits.

**Design system avant improvisation.** Les couleurs et les espacements viennent de
`proto/src/brand.css`. Ne pas introduire de valeur hexadécimale en dur dans un composant.

## Chantiers ouverts

Dans l'ordre où ils ont du sens :

1. **Découpage du proto** — `Proto.jsx` fait 2 270 lignes. Le découper en modules
   (`state/`, `screens/`, `sheets/`, `ui/`) **sans changer un pixel du rendu**.
2. **Synchronisation** — stockage en ligne partagé, deux comptes sur le même foyer.
   Tout passe par `proto/src/storage.js` : c'est la seule implémentation à remplacer,
   l'interface `get / set / delete / list` ne bouge pas. Solution non tranchée.
3. **PWA** — manifeste et icônes sont déjà en place dans `proto/public/`, il manque le
   service worker et la mise en cache de la liste de courses.

## Ce qui est volontairement reporté

Ne pas les implémenter sans demander : portions fines par personne, gestion des restes
et du batch cooking, conversion automatique entre unités. Raisons dans `doc/03-decisions.md`.
