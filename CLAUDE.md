# Consignes de travail — Popott

## Le projet en une phrase

Une application de foyer qui recense les plats faits à la maison, sert à composer le
menu de la semaine, et en déduit la liste de courses agrégée et cochable en magasin.

## Où sont les choses

| Chemin | Quoi |
|---|---|
| `app/` | L'application. Tout le code vit là. |
| `app/src/App.jsx` | L'assemblage seul : état du document, contexte, onglets, panneau ouvert |
| `app/src/ecrans/` | Les quatre écrans — `Plats`, `Semaine`, `Courses`, `Reglages` |
| `app/src/feuilles/` | Les panneaux coulissants, un fichier par famille |
| `app/src/ui/` | `styles.js` (la feuille de style), `icones.jsx`, `briques.jsx` |
| `app/src/outils.js` | Dates, unités, couleurs de catégorie — sans React, donc sans cycle |
| `doc/` | Le cahier des charges, en fiches courtes |
| `.claude/` | Le suivi projet |
| `icons/`, `supabase/` | Sources de marque, schéma SQL |

Le dossier s'est appelé `proto/` et le fichier `Proto.jsx` : c'est fini, l'application
est en production. Aucun fichier construit ne vit dans le dépôt — voir **Publication**.

**Avant/après un remaniement de rendu :** `node scripts/empreinte.mjs <popott.html> <a.json>`
sur la version d'avant, puis sur celle d'après, puis `--comparer`. Il monte l'application,
parcourt les quatre écrans et ouvre les panneaux, et compare le DOM caractère par caractère.
C'est ce qui permet d'affirmer « sans changer un pixel » autrement que de mémoire.

## Ordre de lecture

Ne pas charger tout `doc/` d'un coup. Ouvrir seulement ce qui concerne la tâche :

| Tâche | Fichiers à lire |
|---|---|
| Comprendre le projet | `doc/00-projet.md` |
| Toucher aux données, à l'agrégation, aux quantités | `doc/01-modele-donnees.md` |
| Modifier un écran, un composant, un geste | `doc/02-ecrans.md` |
| Se demander « pourquoi c'est comme ça ? » | `doc/03-decisions.md` |
| Couleurs, typo, espacements, composants | `doc/05-design-system.md` |
| Comptes, foyer, fusion, temps réel | `doc/07-synchronisation.md` |
| Logo, favicon, icône PWA | `doc/06-marque-et-icones.md` |
| Planifier, savoir ce qui reste ouvert (PWA, découpage du document) | `doc/04-roadmap.md` |

## Règles

**Ne pas toucher aux appels `window.storage`** dans `App.jsx`. Ils viennent de
l'environnement d'origine du prototype et sont réimplémentés par `src/storage.js`
(local seul) et `src/storage-distant.js` (foyer partagé). C'est ce qui permet au
fichier de tourner sans modification ici comme là-bas. Une seule addition a été faite
dans `App.jsx` : un écouteur de l'évènement `popott:distant`, qui adopte les
données venues d'un autre appareil sans perdre l'état d'interface. Il n'appelle rien.

**Le code fait autorité sur l'UX.** `app/src/App.jsx` est le résultat de plusieurs
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

**Chemins relatifs.** `base: "./"` dans `vite.config.js`, et des chemins relatifs dans
`index.html` et le manifeste : le site est publié dans un sous-dossier (`/popott/`).
Un chemin absolu casse la mise en ligne sans casser le mode développement — donc ça ne se
voit qu'après le push. `scripts/verifier-publication.mjs` monte la garde là-dessus.

**Français partout** : interface, noms de variables métier, commentaires, commits.

**Design system avant improvisation.** Les couleurs et les espacements viennent de
`app/src/brand.css`. Ne pas introduire de valeur hexadécimale en dur dans un composant.

## Publication

**Une seule voie, automatique.** Tout envoi sur `main` déclenche
`.github/workflows/pages.yml`, qui construit, vérifie et met en ligne
https://dartois.studio/popott/. Il n'y a **aucun fichier bâti dans le dépôt** — ne
jamais en réintroduire un, et ne jamais commiter `app/dist*`.

Le dépôt a longtemps porté un `index.html` de 477 Ko à la racine, régénéré à la main,
pendant que le workflow publiait autre chose. Les deux se sont écrasés mutuellement à
chaque push et le site a tourné sans synchronisation sans que ça se voie. D'où la règle
ci-dessus, et les gardes de `verifier-publication.mjs`.

**Avant de pousser :** `cd app && npm run verif`. C'est exactement ce que rejouera
GitHub — fusion, rendu de l'application, rendu de l'écran de connexion, puis contrôle
de `dist/`. Si ça échoue en ligne, le site ne change pas : l'ancienne version reste
servie.

Les clés Supabase vivent à deux endroits qu'il faut garder d'accord : `app/.env` en
local, et les secrets `SUPABASE_URL` / `SUPABASE_ANON_KEY` du dépôt pour la publication.

## Ce qui est volontairement reporté

Ne pas les implémenter sans demander : portions fines par personne, gestion des restes
et du batch cooking, conversion automatique entre unités. Raisons dans `doc/03-decisions.md`.

## Suivi projet (tickets & roadmap)

<!-- suiviRegles:debut — bloc posé par tools/propager-suivi.js, ne pas éditer ici -->
Le suivi vit dans `.claude`. **Avant d'écrire dans le suivi, lire `.claude/regles-suivi.md`** : format de
`suivi.json`, statuts, lots, clôture. C'est une copie identique dans tous les dépôts, posée par l'Atelier.

- **Reprendre** : « regarde le suivi » → `.claude/suivi-actif.md`, puis la page du lot visé,
  `.claude/lots/<ID>.md` — rien d'autre. Ne jamais lire `suivi.md` (dérivé complet) ni
  `suivi-projet.html` (trop gros) par défaut.
- **Écrire** : seulement dans `.claude/suivi.json`, puis régénérer les dérivés :
  `powershell -ExecutionPolicy Bypass -File .claude\generate-suivi.ps1`.
- **Avant `Fait`** : `codedWith`, `model` et `difficulty` sont obligatoires sur chaque ticket.
- **Ici** : tickets `POP-001`, `POP-002`… ; un lot clos passe à `Terminé`.
<!-- suiviRegles:fin -->

<!-- granularitePR:debut — paragraphe posé par tools/propager-suivi.js, ne pas éditer ici -->
**Granularité des PR** : `granularitePR` = `lot` (déclarée dans le CONFIG de `.claude/suivi-projet.html`).
Une PR par lot, clôture comprise : son dernier commit passe les tickets à `Fait` et le lot à son étape
d'après merge — pas de PR de solde. Le suivi voyage dans la PR du lot, jamais dans une PR « Suivi : … » à
part ; une correction après test est un commit de plus sur la PR ouverte.
<!-- granularitePR:fin -->

<!-- seancesParalleles:debut — paragraphe posé par tools/propager-suivi.js, ne pas éditer ici -->
**Séances parallèles** : une séance = un dépôt = une branche, avec un worktree par séance quand le dépôt en
prévoit. Deux séances dans le MÊME dépôt se gênent — Codex et Claude compris. On ne propage
(`propager-suivi.js --appliquer`) que si aucune autre séance n'est ouverte sur le dépôt cible.
<!-- seancesParalleles:fin -->
