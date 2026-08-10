# Design system

Source de vérité technique : [`app/src/brand.css`](../app/src/brand.css).
Ce document explique **pourquoi**, le fichier CSS dit **combien**.

Règle unique : aucune valeur hexadécimale, aucun espacement en dur dans un composant.
Tout passe par une variable.

---

## 1. Le principe

Popott est un objet de cuisine, pas un tableau de bord. La direction tient en trois mots :
**calme, dense, lisible en magasin.**

Un seul écran a le droit d'être graphiquement fort — la liste de courses, traitée comme un
ticket de caisse. Tout le reste est délibérément silencieux : c'est ce qui rend le ticket
lisible. Ne pas ajouter d'accent ailleurs.

## 2. Le signe

L'icône Popott, ce sont **deux disques pleins** : les deux `o` du nom, et accessoirement
deux assiettes, deux feux, deux personnes dans le foyer.

C'est le motif géométrique récurrent de l'interface. Partout où un élément rond est
nécessaire, c'est ce disque :

- **La case à cocher de la liste de courses** est un cercle vide qui se remplit en aubergine.
  Cocher un article, c'est compléter la marque. C'est la signature de l'application.
- Pastille de compteur sur l'onglet Courses.
- Puce des listes à l'intérieur d'une fiche.
- Point de sélection des segments et des filtres actifs.

Ne pas introduire de deuxième forme signature (chevrons décoratifs, formes organiques,
dégradés). Le disque suffit.

## 3. Couleurs

### Marque

| Rôle | Valeur | Usage |
|---|---|---|
| `--aubergine` | `#4A2440` | Couleur de marque. Accent principal, état actif, logo. |
| `--creme` | `#F6F4ED` | Fond de l'application. |

Ces deux valeurs viennent des fichiers de `icons/`. Elles ne se négocient pas.

> **La feuille de style est migrée** sur ces jetons : `app/src/ui/styles.js`.
> Correspondances appliquées : `--aub` → `--aubergine`, `--ink2` → `--ink-2`,
> `--ink3` → `--ink-3`, `--line2` → `--line-soft`, `--card` → `--surface`,
> `--serif` → `--display`.
>
> Restent hors jetons, à traiter un jour : le rouge d'action destructrice
> (`#8E2F2F` / `#E4CACA`, aussi présent en dur dans `feuilles/Plat.jsx` et
> `feuilles/Repas.jsx`) et les deux fonds d'étiquette `.tag.warn` / `.tag.ok`.
> Le `#000` du masque du ticket, lui, n'est pas une couleur : c'est l'opacité
> d'un masque, il n'a rien à faire dans la palette.
>
> Les couleurs de rayon et de catégorie (`exemple.js`, `CAT_COULEURS`) ne sont pas
> concernées : ce sont des **données**, modifiables par l'utilisateur, pas du style.

> **Changement par rapport au proto.** Le proto utilisait un aubergine plus clair
> (`#5C2A46`) et un fond gris-vert (`#E9ECE4`), choisis avant l'existence du logo.
> L'aubergine de marque `#4A2440` les remplace sans discussion.
> Le fond, lui, est **le seul point à arbitrer** : voir §8.

### Encres

| Rôle | Valeur | Contraste sur crème | Usage |
|---|---|---|---|
| `--ink` | `#17241E` | 15:1 | Titres, texte principal |
| `--ink-2` | `#4A5C53` | 6,5:1 | Texte courant secondaire |
| `--ink-3` | `#607169` | 4,7:1 | Ligne de méta sous un nom de plat, légendes |
| `--muted` | `#8A9A90` | 2,7:1 | **Décor uniquement** — filets, icônes inertes, placeholders. Jamais de texte lisible. |

`--ink-3` a été assombri par rapport au proto (`#8A9A90`), qui ne passait pas le seuil AA
alors qu'il portait toute la ligne d'information sous les noms de plats. En magasin, sous
une lumière quelconque, ça se voit.

### Surfaces et filets

| Rôle | Valeur |
|---|---|
| `--surface` | `#FFFFFF` — cartes, feuilles, lignes de liste |
| `--backdrop` | `#DCE1D6` — au-delà de la colonne, en desktop |
| `--line` | `#D8DED4` — séparateur porteur |
| `--line-soft` | `#EDF0EA` — séparateur interne |

### Accents fonctionnels

| Rôle | Valeur | Usage |
|---|---|---|
| `--aubergine-soft` | `#EFE2EC` | Fond d'état actif, teinte de catégorie |
| `--vert` | `#3F6B2B` | Potager, végétarien, validation |
| `--ambre` | `#B8761E` | Attention, saison — **surfaces et icônes seulement** |
| `--ambre-text` | `#8F5A12` | La même intention, en texte lisible |

L'ambre de marque ne passe pas AA en petit corps sur crème (3,4:1). Deux jetons plutôt
qu'un compromis mou.

### Teintes de catégorie

Les catégories de plats sont modifiables par l'utilisateur : leurs couleurs sont donc
**dérivées**, pas listées. Chaque catégorie reçoit une teinte pastel désaturée dérivée de
son nom, à luminosité constante, pour que le texte reste lisible quelle que soit la teinte.
Ne jamais coder une couleur en dur pour « entrée » ou « dessert ».

## 4. Typographie

Trois rôles, trois familles.

| Rôle | Pile | Emploi |
|---|---|---|
| Display | `"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif` | Noms de plats, titres d'écran. Le serif donne la voix domestique. |
| Texte | `ui-sans-serif, -apple-system, "Segoe UI", Roboto, sans-serif` | Tout le reste de l'interface |
| Données | `ui-monospace, "SF Mono", Menlo, Consolas, monospace` | Quantités, en-têtes de section en petites capitales, dates |

Le monospace n'est pas décoratif : il aligne les quantités en colonne sur la liste de
courses, et il signale d'un coup d'œil « ceci est une valeur, pas une phrase ».

**Le logotype n'est pas une police.** Il ne se recompose pas en HTML : c'est le fichier
`icons/popott-logo.svg`. Voir `06-marque-et-icones.md`.

### Échelle

| Jeton | Taille | Emploi |
|---|---|---|
| `--t-display` | 29 px / 1.05 / −0.02em | Titre d'écran, serif |
| `--t-plat` | 17 px / serif | Nom de plat dans une liste |
| `--t-body` | 15 px / 1.45 | Base |
| `--t-meta` | 13 px | Ligne d'information secondaire |
| `--t-label` | 10,5 px / 0.14em / capitales / mono | En-tête de section, eyebrow |

Pas de niveau intermédiaire. Cinq tailles suffisent, et une échelle courte est ce qui
tient une interface dense.

## 5. Espacement, formes, ombres

- **Base 4 px.** Jetons `--s-1` (4) à `--s-8` (48). Rien entre les crans.
- **Rayons** : `--r` 14 px pour les cartes et feuilles, `--r-sm` 10 px pour les champs et
  boutons, `999px` pour les pastilles. Le rayon de l'icône (225/1024 ≈ 22 %) est celui du
  système d'exploitation, il ne se réplique pas dans l'interface.
- **Une seule ombre** : `0 8px 24px rgba(23,36,30,.14)`, pour ce qui flotte réellement
  (feuilles, toast). Une carte posée dans le flux n'a pas d'ombre, elle a un filet.
- **Colonne** : 540 px maximum, centrée, sur `--backdrop` en desktop.

## 6. Cibles tactiles

Contrainte non négociable, elle vient du contexte magasin :

- **44 × 44 px minimum** pour toute cible, 56 px pour une case à cocher de liste de courses.
- Espacement vertical de 8 px minimum entre deux cibles adjacentes.
- La zone cliquable d'une ligne de courses est **la ligne entière**, pas le cercle.
- Barre d'onglets : 4 cibles pleine largeur, respect de la zone sûre du bas.

## 7. Composants

| Composant | Règle |
|---|---|
| **Ligne de liste** | Nom en display, ligne de méta en `--ink-3`, séparateur `--line-soft`, action `⋯` à droite. Pas de carte. |
| **Feuille (sheet)** | Monte du bas, 94 % de hauteur pour les feuilles d'édition, bandeau fixe en haut, bouton *Terminé* — jamais *Enregistrer*. |
| **Segments** | Deux à quatre choix maximum. Au-delà, liste déroulante. |
| **Chips** | Tant qu'il y en a peu, et sur plusieurs lignes — jamais de défilement horizontal. Au-delà de six, liste déroulante. |
| **Champ** | Fond `--surface`, filet `--line`, rayon `--r-sm`, hauteur 44 px. |
| **Bouton principal** | Fond `--aubergine`, texte crème. Un seul par écran. |
| **Bouton discret** | Texte `--ink-2`, sans fond ni filet. |
| **Toast** | Fond `--ink`, texte crème, pastille, au-dessus de la barre d'onglets. |
| **En-tête de rayon** | Collant, teinté, mono en capitales — écran Courses uniquement. |

## 8. Le point à arbitrer

Le fond de l'application. Deux options défendables :

- **Crème `#F6F4ED`** — la valeur du logo. Cohérence totale avec la marque, ambiance plus
  chaude et plus claire. *Recommandé*, et c'est ce que contient `brand.css` aujourd'hui.
- **Gris-vert `#E9ECE4`** — la valeur du proto. Plus froid, plus discret, et un peu plus
  reposant sur un long défilement.

Les deux passent le contraste. C'est un choix d'ambiance, à faire en regardant l'écran
Courses en plein soleil. Basculer revient à changer une ligne de `brand.css`.

## 9. Accessibilité — plancher

- Contraste AA sur tout texte, `--muted` interdit en texte.
- Focus clavier **visible** : contour aubergine de 2 px, décalé de 2 px.
- `prefers-reduced-motion` respecté : les transitions tombent à zéro, les balayages
  restent fonctionnels.
- Cibles ≥ 44 px.
- Chaque icône seule porte un `aria-label`.
