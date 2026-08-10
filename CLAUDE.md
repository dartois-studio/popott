# Consignes de travail — Popott

## Le projet en une phrase

Une application de foyer qui recense les plats faits à la maison, sert à composer le
menu de la semaine, et en déduit la liste de courses agrégée et cochable en magasin.

## Où sont les choses

| Chemin | Quoi |
|---|---|
| `app/` | L'application. Tout le code vit là. |
| `app/src/App.jsx` | Les quatre écrans, et tout le CSS. 2 430 lignes. |
| `doc/` | Le cahier des charges, en fiches courtes |
| `.claude/` | Le suivi projet |
| `icons/`, `supabase/` | Sources de marque, schéma SQL |

Le dossier s'est appelé `proto/` et le fichier `Proto.jsx` : c'est fini, l'application
est en production. Aucun fichier construit ne vit dans le dépôt — voir **Publication**.

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
| Planifier | `doc/04-roadmap.md` |

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

## Chantiers ouverts

Dans l'ordre où ils ont du sens :

1. **Découpage de `App.jsx`** — 2 430 lignes. Le découper en modules
   (`state/`, `screens/`, `sheets/`, `ui/`) **sans changer un pixel du rendu**.
2. **PWA** — manifeste et icônes sont en place, le site est publié en HTTPS sur
   GitHub Pages, il manque le service worker et la mise en cache de la liste de courses.
   C'est ce qui bloque le lancement hors ligne en magasin : la synchronisation garde
   déjà les écritures faites sans réseau, mais la page elle-même ne se charge pas.
3. **Découper le document** — tout l'état tient dans une seule clé `menus:v1`, renvoyée
   en entier à chaque frappe. La fusion à trois voies rend ça sûr, pas léger. Sortir
   `etats` dans sa propre clé serait le premier gain.

## Ce qui est volontairement reporté

Ne pas les implémenter sans demander : portions fines par personne, gestion des restes
et du batch cooking, conversion automatique entre unités. Raisons dans `doc/03-decisions.md`.

## Suivi projet (tickets & roadmap)

Le suivi vit dans `.claude` :

| Fichier | Statut | Usage |
|---|---|---|
| `.claude/suivi.json` | **source de vérité** | à lire et à écrire |
| `.claude/suivi.md` | dérivé | lecture rapide — **ne jamais éditer à la main** |
| `.claude/suivi-projet.html` | interface | ouvert par Guillaume dans le navigateur |
| `.claude/suivi-captures/` | captures PNG | référencées par les tickets |

**Règles :**

1. « Regarde le suivi » → lire `.claude/suivi.json` (pas le `.html`, trop gros ; pas le `.md`, dérivé).
2. Toute écriture se fait dans `suivi.json`, en **conservant le format exact** : indentation
   2 espaces, `": "` après les clés, accents littéraux, LF, **pas** de newline final. C'est le
   format de `JSON.stringify(x, null, 2)` — le respecter évite un diff parasite à chaque tour.
3. Après une écriture de `suivi.json`, régénérer le dérivé :
   `powershell -ExecutionPolicy Bypass -File .claude\generate-suivi.ps1`
4. Identifiants de tickets : `POP-001`, `POP-002`… (champ `n` dans le JSON).
5. **`codedWith` est obligatoire avant `Fait`.** Au terme du code, renseigner sur chaque ticket
   traité l'IA réellement utilisée (`Claude Code`, `ChatGPT`, `Mixte`, ou le nom exact d'une autre).
   Un ticket ne doit jamais passer à `Fait` sans cette attribution.
6. Statuts : `À faire` → `En cours` → `En PR` → `Fait` (+ `Parké`).
   `En PR` = la PR attend le merge de Guillaume.
7. Les **lots** (`state.lots`) regroupent les tickets tenant dans **une seule PR cohérente**.
   Proposer le découpage, laisser Guillaume valider. Noter les choix tranchés dans
   `lot.decisions` (`{date, txt}`) pour ne pas les re-débattre.
8. Renseigner `branch` (et `pr` dès qu'elle existe) sur le lot ou le ticket : l'étape affichée
   dans le Planning en est déduite. `powershell -File .claude\sync-pr.ps1` met à jour l'état des
   PR depuis GitHub.
9. Après le merge, il reste `rien de particulier : le merge clôt le lot` —
   c'est Guillaume qui la déclenche, puis marque le lot `Terminé` dans l'app.

**Ne jamais** lire `.claude/suivi-projet.html` en entier (≈ 210 Ko) : `Grep` puis `Read` ciblé.
Son bloc `PROJECT` (en tête du `<script>`) porte la config du suivi ; le reste est générique.
