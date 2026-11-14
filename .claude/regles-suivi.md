<!-- Copie identique dans tous les dépôts de suivi — posée par tools/propager-suivi.js (Atelier). Ne pas éditer ici : corriger la souche, templates/suivi-projet/regles-suivi.md, puis propager. -->
# Règles du suivi (tickets & roadmap)

À lire **avant d'écrire** dans le suivi d'un dépôt. Le `CLAUDE.md` du dépôt garde l'essentiel (reprendre,
écrire, les trois champs avant `Fait`, son préfixe et son statut de clôture) et renvoie ici pour le reste.
Les règles propres à un dépôt vivent dans son `CLAUDE.md`, jamais dans ce fichier.

## Les fichiers de `.claude`

| Fichier | Statut | Usage |
|---|---|---|
| `.claude/lots/<ID>.md` | dérivé **à lire** | une page par lot non clos : reprise entière, but, tickets, toutes les décisions, gains. **Le seul fichier à lire pour reprendre un lot** |
| `.claude/suivi-actif.md` | dérivé **à lire** | le sommaire : une ligne par lot non clos, première phrase de chaque reprise, tickets sans lot. Pour choisir quel lot reprendre |
| `.claude/suivi.json` | **source de vérité** | à écrire, par Edit ciblé |
| `.claude/suivi.md` | dérivé complet | **ne jamais éditer, ni lire par défaut** |
| `.claude/suivi-projet.html` | interface | ouvert par Guillaume dans le navigateur ; **ne jamais le lire en entier** (trop gros) : `Grep` puis `Read` ciblé. Son bloc `PROJECT` (en tête du `<script>`) porte la config du dépôt ; le reste est générique |
| `.claude/regles-suivi.md` | ce fichier | copie identique partout |

Les captures des tickets sont des PNG, rangés dans `.claude/suivi-captures/` — dossier créé au premier
ajout, absent tant qu'aucun ticket n'en porte.

## Règles

1. « Regarde le suivi » → lire `.claude/suivi-actif.md`, puis la page du lot visé, `.claude/lots/<ID>.md` —
   **rien d'autre**. N'ouvrir `suivi.json` que pour **écrire** ; ne jamais ouvrir le `.html` ni `suivi.md`
   en fonctionnement normal.
2. Toute écriture se fait dans `suivi.json`, en **conservant le format exact** : indentation 2 espaces,
   `": "` après les clés, accents littéraux, LF, **pas** de newline final. C'est le format de
   `JSON.stringify(x, null, 2)` — le respecter évite un diff parasite à chaque tour.
3. Après une écriture de `suivi.json`, régénérer les dérivés (`suivi.md`, `suivi-actif.md` et les pages
   `lots/`) : `powershell -ExecutionPolicy Bypass -File .claude\generate-suivi.ps1`
4. Identifiants de tickets : `<PRÉFIXE>-001`, `<PRÉFIXE>-002`… (champ `n` dans le JSON ; le préfixe est celui du
   dépôt, dit par son `CLAUDE.md`). Un ticket neuf s'inscrit par
   `node <chemin de l'Atelier>\tools\ticket.js --titre="…"`, lancé depuis la racine du projet, jamais à la main :
   le numéro se calcule, il ne se lit pas dans `nextId`, que rien ne garantit à jour.
5. **`codedWith`, `model` et `difficulty` sont obligatoires avant `Fait`.** Au terme du code, renseigner sur
   chaque ticket traité : l'IA réellement utilisée (`codedWith` : `Claude Code`, `ChatGPT`, `Mixte`, ou le nom
   exact d'une autre), le modèle derrière l'outil (`model` : `Opus 5.5`, `Sonnet 5.5`…, `Mixte` s'il y en a eu
   plusieurs) et la difficulté réelle du travail (`difficulty` : `Facile`, `Moyen` ou `Difficile`). Un ticket ne
   doit jamais passer à `Fait` sans les trois. `generate-suivi.ps1` nomme ceux qui en manquent. Un modèle
   qu'on ne connaît pas se demande ou se mesure (`tools/cout-reel.js tickets`, Atelier) ; on ne l'invente pas.
6. Statuts : `À faire` → `En cours` → `En PR` → `Fait` (+ `Parké`). `En PR` = la PR attend le merge de
   Guillaume.
7. Les **lots** (`state.lots`) regroupent les tickets tenant dans **une seule PR cohérente**. Proposer le
   découpage, laisser Guillaume valider. Noter les choix tranchés dans `lot.decisions` (`{date, txt}`) pour ne
   pas les re-débattre.
8. Renseigner `branch` (et `pr` dès qu'elle existe) sur le lot ou le ticket : l'étape affichée dans le Planning
   en est déduite. `powershell -File .claude\sync-pr.ps1` met à jour l'état des PR depuis GitHub.
9. **Une seule PR par lot, clôture comprise** (sauf si la granularité du dépôt, dite dans son `CLAUDE.md`,
   en décide autrement). Le dernier commit de la PR du lot solde le suivi : chaque ticket du lot passe à `Fait`,
   le lot à son statut de clôture (dit par le `CLAUDE.md` du dépôt), `pr` est renseigné, les dérivés sont
   régénérés. Ce commit voyage avec le code : le merge porte la clôture dans `main`, une PR refermée sans merge
   ne l'y porte pas — `main` ne dit donc jamais clos un lot qu'il ne contient pas. **Jamais de PR de solde après
   le merge** (le 08/10/2026, Mirokai Creator : PR #13 pour le lot, puis PR #14 pour le seul solde). `merged` se
   rattrape par `sync-pr.ps1` à la prochaine écriture du suivi.
