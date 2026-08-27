# Suivi popott

_Généré le 27/08/2026 16:04:10. Source de vérité : `suivi.json` — ne pas éditer ce .md à la main._

_Convention : au terme du code, chaque IA renseigne `codedWith` sur chaque ticket avec son nom exact avant tout passage à `Fait`._

## Résumé

| Statut | P0 | P1 | P2 | P3 | Total |
|---|---:|---:|---:|---:|---:|
| À faire | 0 | 1 | 2 | 2 | 5 |
| En cours | 0 | 0 | 0 | 0 | 0 |
| En PR | 0 | 0 | 0 | 0 | 0 |
| Fait | 1 | 2 | 0 | 0 | 3 |
| Parké | 0 | 0 | 0 | 0 | 0 |
| **Total** | 1 | 3 | 2 | 2 | **8** |

## Par lot

### Sans lot (backlog non planifié) — 8
- POP-002 · P0 · **Fait** · _Autre_ — Deux voies de publication concurrentes : le site tournait sans synchronisation · Codé avec **Claude Code**
- POP-001 · P1 · **Fait** · _Bug_ — Le titre de rayon se place au milieu des articles dans la liste de courses · Codé avec **Claude Code**
- POP-003 · P1 · **Fait** · _Autre_ — Découper App.jsx : 2 430 lignes dans un seul fichier · Codé avec **Claude Code**
- POP-004 · P1 · **À faire** · _Feature_ — PWA : le service worker manquant, pour ouvrir l'application en magasin
- POP-005 · P2 · **À faire** · _Autre_ — Sortir `etats` dans sa propre clé : ne plus renvoyer tout le document à chaque frappe
- POP-006 · P2 · **À faire** · _Autre_ — Quatre panneaux hors de portée du balayage automatique
- POP-007 · P3 · **À faire** · _UI & UX_ — Sept valeurs hexadécimales encore en dur, hors jetons
- POP-008 · P3 · **À faire** · _UI & UX_ — Le panneau compte vit à l'adresse `#compte`, hors de l'interface

## Détail par statut

### À faire (5)

#### POP-004 · Feature · P1 · Global
**PWA : le service worker manquant, pour ouvrir l'application en magasin**

Dernier point « à faire » de la roadmap (phase 5), et le seul qui gêne l'usage réel.

Le manifeste, les icônes et le HTTPS sont en place : l'application s'installe sur l'écran d'accueil. Mais sans service worker, **elle ne se lance pas hors ligne**. La nuance compte : la synchronisation garde déjà les écritures faites sans réseau — cocher des articles au rayon surgelés ne perd rien — mais si la page n'est pas déjà ouverte, elle ne s'ouvre pas du tout.

À faire : mettre en cache la coquille de l'application et la liste de courses. C'est la liste qui compte : c'est le seul écran dont on a besoin quand le réseau tombe.

Attention au piège des chemins : le site vit dans le sous-dossier `/popott/`, et un service worker enregistré sur un chemin absolu ne couvrirait rien. `verifier-publication.mjs` monte la garde sur les chemins du HTML, pas encore sur ceux du service worker.

<sub>créé le 2026-08-10T16:16:50.727Z</sub>

#### POP-005 · Autre · P2 · Performance
**Sortir `etats` dans sa propre clé : ne plus renvoyer tout le document à chaque frappe**

Tout l'état tient dans une seule clé `menus:v1` : plats, menus, réglages et cases cochées ensemble. Chaque frappe renvoie le document entier au serveur.

La fusion à trois voies rend ça **sûr** — personne n'écrase personne — mais pas **léger**. En magasin, cocher un article pousse quelques centaines de kilo-octets sur une connexion incertaine.

Premier gain, et le plus simple : sortir `etats` (les cases cochées) dans sa propre clé. C'est ce qui bouge le plus souvent et pèse le moins. Le stockage le supporte déjà — `get / set / delete / list` par clé — c'est `App.jsx` qui n'en écrit qu'une.

Prévoir la reprise des documents existants, comme `migrer()` le fait déjà pour les créneaux.

<sub>créé le 2026-08-10T16:16:50.727Z</sub>

#### POP-006 · Autre · P2 · Interface
**Quatre panneaux hors de portée du balayage automatique**

Dette de vérification laissée par POP-003.

`scripts/empreinte.mjs` ouvre les panneaux qu'un clic atteint depuis un écran au repos : 11 sur 14. Échappent au balayage **la copie de semaine, les semaines types, le remplissage automatique et la fiche ingrédient** — ils demandent une navigation préalable.

Leur code est identique octet pour octet à l'avant-découpage, donc le risque est faible. Mais « faible » n'est pas « vérifié ».

Deux façons de fermer le sujet : les ouvrir une fois à la main, ou apprendre à `empreinte.mjs` à les atteindre — ce qui protégerait aussi les remaniements suivants.

<sub>créé le 2026-08-10T16:16:50.727Z</sub>

#### POP-007 · UI & UX · P3 · Interface
**Sept valeurs hexadécimales encore en dur, hors jetons**

La règle du projet est qu'aucune couleur ne s'écrit en dur dans un composant : tout vient de `brand.css`. La fiche design system affirmait que c'était acquis. Ça ne l'est pas, et ça ne l'était pas avant le découpage.

Dans `ui/styles.js` : le rouge d'action destructrice (`#8E2F2F`, `#E4CACA`) et les deux fonds d'étiquette `.tag.warn` / `.tag.ok` (`#FBF0DE`, `#8A5A10`, `#E6F0DE`).

En dur dans des composants : le même `#8E2F2F` dans `feuilles/Plat.jsx` et `feuilles/Repas.jsx`.

Le `#000` du masque du ticket n'est pas concerné : c'est une opacité de masque, pas une couleur. Les couleurs de rayon et de catégorie non plus : ce sont des données, modifiables par l'utilisateur.

À faire : nommer un jeton pour le rouge d'alerte et deux pour les étiquettes, dans `brand.css`.

<sub>créé le 2026-08-10T16:16:50.727Z</sub>

#### POP-008 · UI & UX · P3 · Réglages
**Le panneau compte vit à l'adresse `#compte`, hors de l'interface**

Point ouvert relevé dans `doc/04-roadmap.md`.

Le compte et le code du foyer s'atteignent par l'adresse `#compte`, en plein écran — pas par un chemin visible dans l'application. Une entrée dans les réglages serait plus juste.

Ce n'est pas gratuit : le bloc est long (adresse, code du foyer, bouton copier) et le glisser dans les réglages déplace des arbitrages de mise en page déjà tranchés. À regarder avec `doc/02-ecrans.md` sous les yeux.

<sub>créé le 2026-08-10T16:16:50.727Z</sub>

### Fait (3)

#### POP-002 · Autre · P0 · Global
**Deux voies de publication concurrentes : le site tournait sans synchronisation**

Le dépôt publiait par deux chemins à la fois, tous deux déclenchés à chaque envoi : un `index.html` de 477 Ko régénéré à la main à la racine, et le workflow GitHub Actions. Ils écrivaient sur le même site, le workflow finissant systématiquement une dizaine de secondes après — il gagnait donc toujours.

Deux conséquences. Le fichier construit à la main n'a jamais été servi une seule fois. Et comme le workflow n'avait pas les clés Supabase (elles ne vivaient que dans `app/.env`, en local), le site en ligne tournait sans compte ni foyer partagé : chaque appareil dans son coin, sans que rien ne le signale.

Résolution : une seule voie, l'automatique. Clés passées en secrets du dépôt, `index.html` et `pages.mjs` supprimés, plus aucun fichier bâti dans le dépôt. Rangement dans la foulée : `proto/` devient `app/`, `Proto.jsx` devient `App.jsx` (le composant s'appelait `App` depuis longtemps), le suivi rejoint `.claude/`, README et CLAUDE.md remis d'accord avec la réalité.

Trois gardes ajoutées à `npm run verif`, sur les pannes qui ne se voient qu'après la mise en ligne : chemin absolu qui casse le sous-dossier `/popott/`, synchronisation absente du fascicule publié, manifeste ou icônes manquants. Elles tournent avant la publication : si elles échouent, le site en ligne ne change pas. `solo.mjs` gagne un mode `--portail` pour que l'écran de connexion soit smoke-testé lui aussi.

`sync.bat` attend désormais la publication et annonce quand c'est en ligne, ou pourquoi ça a échoué.

<sub>créé le 2026-08-10 · maj 2026-08-11T14:57:17.755Z · Codé avec Claude Code</sub>

#### POP-001 · Bug · P1 · Interface
**Le titre de rayon se place au milieu des articles dans la liste de courses**

« Fruits et légumes » s'affichait entre Basilic et Courgette au lieu d'être en tête de son rayon.

Cause : `.ticket` portait `overflow:hidden` pour arrondir ses coins, ce qui en faisait un conteneur de défilement. Les en-têtes de rayon, en `position:sticky; top:69px`, se calaient donc à 69 px du haut du ticket au lieu du haut de la page. Le ticket ne défilant jamais, le premier en-tête était poussé une fois pour toutes de 69 px — un peu plus qu'une ligne de 56 px. Les rayons suivants ne bougeaient pas, leur position naturelle étant déjà au-delà du seuil.

Correctif : `overflow:clip` au lieu de `hidden`. Même rognage aux coins arrondis, mais sans créer de conteneur de défilement. Bénéfice au passage : les en-têtes de rayon s'épinglent enfin sous celui de l'écran pendant le défilement — le comportement voulu depuis le début, qui n'avait jamais pu s'exercer.

Dégradation si `overflow:clip` n'est pas connu du navigateur : le sticky fonctionne quand même, seuls les coins hauts du ticket redeviennent carrés.

<sub>créé le 2026-08-10 · maj 2026-08-11T14:57:18.315Z · Codé avec Claude Code</sub>

#### POP-003 · Autre · P1 · Global
**Découper App.jsx : 2 430 lignes dans un seul fichier**

Le prototype tenait dans un fichier unique : les quatre écrans, les quatorze panneaux, la feuille de style et les outils. Monolithique par construction — un proto se lit d'un bloc — mais intenable dès qu'on intervient dessus à plusieurs. C'était le chantier n°1 de CLAUDE.md.

Réparti en seize modules : `ecrans/`, `feuilles/`, `ui/` (styles, icônes, briques), plus `outils.js` et `exemple.js`. `App.jsx` ne fait plus que l'assemblage — état du document, contexte, onglets, panneau ouvert — en 209 lignes. Plus gros fichier restant : `feuilles/Repas.jsx`, 317 lignes.

Pur déplacement : le code des déclarations n'a pas été retouché d'un octet, seuls s'ajoutent les en-têtes, les `import` et les `export`. Un symbole n'est exporté que s'il franchit une frontière de fichier — six restent internes. Aucun cycle entre modules, 194 imports, aucun superflu.

**Deux preuves plutôt qu'une intuition.** Statique : les 82 déclarations (127 Ko) comparées une à une avec l'ancien fichier, toutes identiques octet pour octet. Dynamique : `scripts/empreinte.mjs`, écrit pour l'occasion, monte l'application dans un DOM simulé, parcourt les quatre écrans, ouvre les panneaux et enregistre le DOM de chaque état — 20 états identiques avant/après, feuille de style comprise.

L'empreinte a rattrapé un import manquant (`MOIS`) que la compilation laissait passer et qui cassait l'écran Semaine à l'exécution : mon extracteur de dépendances ignorait le contenu des interpolations `${…}`.

**Reste à vérifier à la main** : le balayage n'atteint que 11 des 14 panneaux. Copie de semaine, semaines types, remplissage automatique et fiche ingrédient ne sont couverts que par la preuve statique.

<sub>créé le 2026-08-10T16:13:01.961Z · maj 2026-08-11T14:57:19.334Z · Codé avec Claude Code</sub>
