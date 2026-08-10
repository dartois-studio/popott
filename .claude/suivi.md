# Suivi popott

_Généré le 10/08/2026 18:13:10. Source de vérité : `suivi.json` — ne pas éditer ce .md à la main._

_Convention : au terme du code, chaque IA renseigne `codedWith` sur chaque ticket avec son nom exact avant tout passage à `Fait`._

## Résumé

| Statut | P0 | P1 | P2 | P3 | Total |
|---|---:|---:|---:|---:|---:|
| À faire | 0 | 0 | 0 | 0 | 0 |
| En cours | 0 | 0 | 0 | 0 | 0 |
| En PR | 0 | 0 | 0 | 0 | 0 |
| Fait | 1 | 2 | 0 | 0 | 3 |
| Parké | 0 | 0 | 0 | 0 | 0 |
| **Total** | 1 | 2 | 0 | 0 | **3** |

## Par lot

### Sans lot (backlog non planifié) — 3
- POP-002 · P0 · **Fait** · _Autre_ — Deux voies de publication concurrentes : le site tournait sans synchronisation · Codé avec **Claude Code**
- POP-001 · P1 · **Fait** · _Bug_ — Le titre de rayon se place au milieu des articles dans la liste de courses · Codé avec **Claude Code**
- POP-003 · P1 · **Fait** · _Autre_ — Découper App.jsx : 2 430 lignes dans un seul fichier · Codé avec **Claude Code**

## Détail par statut

### Fait (3)

#### POP-002 · Autre · P0 · Global
**Deux voies de publication concurrentes : le site tournait sans synchronisation**

Le dépôt publiait par deux chemins à la fois, tous deux déclenchés à chaque envoi : un `index.html` de 477 Ko régénéré à la main à la racine, et le workflow GitHub Actions. Ils écrivaient sur le même site, le workflow finissant systématiquement une dizaine de secondes après — il gagnait donc toujours.

Deux conséquences. Le fichier construit à la main n'a jamais été servi une seule fois. Et comme le workflow n'avait pas les clés Supabase (elles ne vivaient que dans `app/.env`, en local), le site en ligne tournait sans compte ni foyer partagé : chaque appareil dans son coin, sans que rien ne le signale.

Résolution : une seule voie, l'automatique. Clés passées en secrets du dépôt, `index.html` et `pages.mjs` supprimés, plus aucun fichier bâti dans le dépôt. Rangement dans la foulée : `proto/` devient `app/`, `Proto.jsx` devient `App.jsx` (le composant s'appelait `App` depuis longtemps), le suivi rejoint `.claude/`, README et CLAUDE.md remis d'accord avec la réalité.

Trois gardes ajoutées à `npm run verif`, sur les pannes qui ne se voient qu'après la mise en ligne : chemin absolu qui casse le sous-dossier `/popott/`, synchronisation absente du fascicule publié, manifeste ou icônes manquants. Elles tournent avant la publication : si elles échouent, le site en ligne ne change pas. `solo.mjs` gagne un mode `--portail` pour que l'écran de connexion soit smoke-testé lui aussi.

`sync.bat` attend désormais la publication et annonce quand c'est en ligne, ou pourquoi ça a échoué.

<sub>créé le 2026-08-10 · maj 2026-08-10T15:46:46.349Z · Codé avec Claude Code</sub>

#### POP-001 · Bug · P1 · Interface
**Le titre de rayon se place au milieu des articles dans la liste de courses**

« Fruits et légumes » s'affichait entre Basilic et Courgette au lieu d'être en tête de son rayon.

Cause : `.ticket` portait `overflow:hidden` pour arrondir ses coins, ce qui en faisait un conteneur de défilement. Les en-têtes de rayon, en `position:sticky; top:69px`, se calaient donc à 69 px du haut du ticket au lieu du haut de la page. Le ticket ne défilant jamais, le premier en-tête était poussé une fois pour toutes de 69 px — un peu plus qu'une ligne de 56 px. Les rayons suivants ne bougeaient pas, leur position naturelle étant déjà au-delà du seuil.

Correctif : `overflow:clip` au lieu de `hidden`. Même rognage aux coins arrondis, mais sans créer de conteneur de défilement. Bénéfice au passage : les en-têtes de rayon s'épinglent enfin sous celui de l'écran pendant le défilement — le comportement voulu depuis le début, qui n'avait jamais pu s'exercer.

Dégradation si `overflow:clip` n'est pas connu du navigateur : le sticky fonctionne quand même, seuls les coins hauts du ticket redeviennent carrés.

<sub>créé le 2026-08-10 · Codé avec Claude Code</sub>

#### POP-003 · Autre · P1 · Global
**Découper App.jsx : 2 430 lignes dans un seul fichier**

Le prototype tenait dans un fichier unique : les quatre écrans, les quatorze panneaux, la feuille de style et les outils. Monolithique par construction — un proto se lit d'un bloc — mais intenable dès qu'on intervient dessus à plusieurs. C'était le chantier n°1 de CLAUDE.md.

Réparti en seize modules : `ecrans/`, `feuilles/`, `ui/` (styles, icônes, briques), plus `outils.js` et `exemple.js`. `App.jsx` ne fait plus que l'assemblage — état du document, contexte, onglets, panneau ouvert — en 209 lignes. Plus gros fichier restant : `feuilles/Repas.jsx`, 317 lignes.

Pur déplacement : le code des déclarations n'a pas été retouché d'un octet, seuls s'ajoutent les en-têtes, les `import` et les `export`. Un symbole n'est exporté que s'il franchit une frontière de fichier — six restent internes. Aucun cycle entre modules, 194 imports, aucun superflu.

**Deux preuves plutôt qu'une intuition.** Statique : les 82 déclarations (127 Ko) comparées une à une avec l'ancien fichier, toutes identiques octet pour octet. Dynamique : `scripts/empreinte.mjs`, écrit pour l'occasion, monte l'application dans un DOM simulé, parcourt les quatre écrans, ouvre les panneaux et enregistre le DOM de chaque état — 20 états identiques avant/après, feuille de style comprise.

L'empreinte a rattrapé un import manquant (`MOIS`) que la compilation laissait passer et qui cassait l'écran Semaine à l'exécution : mon extracteur de dépendances ignorait le contenu des interpolations `${…}`.

**Reste à vérifier à la main** : le balayage n'atteint que 11 des 14 panneaux. Copie de semaine, semaines types, remplissage automatique et fiche ingrédient ne sont couverts que par la preuve statique.

<sub>créé le 2026-08-10T16:13:01.961Z · Codé avec Claude Code</sub>
