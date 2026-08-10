# Marque et icônes

Les sources vivent dans [`icons/`](../icons). Elles ne se modifient pas à la main :
toute variante se dérive de ces fichiers.

## Les six fichiers

| Fichier | Format | Couleur | Employer pour |
|---|---|---|---|
| `popott-logo.svg` | 3349 × 960 | `currentColor` | **Le logotype par défaut dans l'interface.** Il prend la couleur du texte parent. |
| `popott-logo-aubergine.svg` | 3349 × 960 | `#4A2440` | Export figé : documents, présentations, README |
| `popott-logo-inverse.svg` | 3349 × 960 | `#F6F4ED` | Logotype sur fond sombre |
| `popott-mark.svg` | 1024 × 1024 | `currentColor` | **Le signe seul dans l'interface** : bandeau compact, écran de chargement |
| `popott-icon.svg` | 1024 × 1024 | crème sur aubergine, coins arrondis | Icône d'application, favicon |
| `popott-icon-light.svg` | 1024 × 1024 | aubergine sur crème | Icône sur fond sombre, ou variante claire |

Les deux `o` du logotype sont des disques pleins : c'est le même signe que l'icône, et
c'est le motif géométrique repris dans toute l'interface (voir `05-design-system.md` §2).

## Dans l'application

**Utiliser le composant**, jamais une balise `<img>` posée à la main :

```jsx
import { Logo, Mark } from "./Logo";

<Logo height={22} />   // logotype, hérite de la couleur du texte
<Mark size={28} />     // les deux disques seuls
```

Les deux composants inlinent le SVG en `currentColor`. Conséquences :
la couleur suit le contexte, il n'y a pas de requête réseau, et le logo reste net
à toute taille.

**Où il apparaît :**

- **Écran Plats** : le logotype *remplace* le titre « Bibliothèque » dans le bandeau,
  hauteur 26 px, couleur `--aubergine`. C'est l'écran d'entrée, et l'onglet du bas dit déjà
  « Plats » — le titre était redondant, le logo ne l'est pas.
- Les trois autres écrans gardent leur titre en serif. Un logo répété partout est du bruit.
- Écran de chargement : le signe seul, centré, sur crème.

**Taille minimale** : 18 px de hauteur pour le logotype, 20 px pour le signe.
En dessous, les deux disques se referment visuellement.

**Zone de respect** : la hauteur d'un disque tout autour du logotype.

**Interdits** : ré-espacer les lettres, recolorer un seul disque, ajouter une ombre ou un
contour, poser le logotype aubergine sur un fond sombre (utiliser la version inverse).

## Fichiers générés pour la PWA

Dans `proto/public/`, dérivés de `popott-icon.svg` :

| Fichier | Taille | Rôle |
|---|---|---|
| `favicon.svg` | vectoriel | Onglet de navigateur |
| `apple-touch-icon.png` | 180 | Écran d'accueil iOS |
| `icon-192.png` | 192 | Android, manifeste |
| `icon-512.png` | 512 | Android, splash |
| `icon-maskable-512.png` | 512 | Android adaptatif — motif réduit pour rester dans la zone sûre de 80 % |

L'icône maskable a des disques plus petits et plus rapprochés : Android rogne jusqu'à 20 %
sur chaque bord, et les disques d'origine sortaient du cercle de sécurité.

Pour les régénérer après une modification de la source :

```bash
cd proto && npm run icons
```

## Couleur de thème

`#4A2440` — déclarée dans le manifeste et dans la balise `<meta name="theme-color">`.
C'est la couleur de la barre de statut une fois l'application installée.
