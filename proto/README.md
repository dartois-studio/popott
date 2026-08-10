# Prototype

Application Vite + React, sans backend. Le prototype UX/UI de Popott, en état de marche.

```bash
npm install
npm run dev
```

**`index.html` ne s'ouvre pas d'un double-clic, et c'est normal.** Il ne contient pas
l'application : il pointe vers `src/main.jsx`, du JSX qu'aucun navigateur ne sait lire,
chargé comme module ES — ce que le protocole `file://` refuse de toute façon. C'est Vite
qui compile et sert tout ça, d'où `npm run dev`.

Si Node n'est pas installé, ou pour montrer le proto à quelqu'un :

```bash
npm run solo    # → dist-solo/popott.html
npm run verif   # construit, puis vérifie que l'application démarre vraiment
```

Un fichier HTML unique et autonome, React compris, qui s'ouvre d'un double-clic.
Réserve : selon le navigateur, le stockage local peut être bloqué sur `file://` — le proto
retombe alors en mémoire seule et oublie tout au rechargement. Pour travailler, `npm run dev`.

`--host` est déjà actif : l'adresse réseau affichée par Vite s'ouvre depuis le téléphone
sur le même Wi-Fi. C'est la seule façon honnête de juger l'écran Courses.

## Le voir en ligne

Chaque `git push` sur `main` publie le proto sur
**https://dartois.studio/popott/** — c'est l'adresse à ouvrir sur le téléphone,
et celle depuis laquelle l'installer sur l'écran d'accueil.

Le workflow est dans `.github/workflows/pages.yml`. À faire **une seule fois** dans GitHub :
*Settings → Pages → Source → GitHub Actions*.

Le build utilise `base: "./"` : chemins relatifs partout, donc le site fonctionne aussi bien
à la racine d'un domaine que dans le sous-dossier `/popott/`. Ne pas repasser en chemins
absolus.

## Ce qu'il fait

Les quatre écrans, avec le parcours central réellement fonctionnel :
bibliothèque de plats → menu de la semaine → liste de courses agrégée, triée par rayon,
cochable. Plus les profils, la recherche par ingrédients, l'anti-répétition, le
garde-manger, les ajustements par personne, les semaines types et le remplissage
automatique. Détail dans `doc/02-ecrans.md`.

**Les données sont sauvegardées sur l'appareil** et survivent au rechargement.
Elles ne sont pas encore partagées entre deux téléphones — c'est la phase 4.

## Fichiers

| Fichier | Rôle |
|---|---|
| `src/Proto.jsx` | Le prototype. 2 270 lignes, un seul fichier, volontairement. |
| `src/brand.css` | Les jetons de design. Source de vérité, aucun hex ailleurs. |
| `src/Logo.jsx` | `<Logo />` et `<Mark />`, SVG inline en `currentColor` |
| `src/storage.js` | Adaptateur de stockage — voir ci-dessous |
| `public/` | Manifeste PWA et icônes générées |
| `scripts/icons.mjs` | `npm run icons` — régénère les icônes depuis `/icons` |
| `scripts/solo.mjs` | `npm run solo` — fabrique le HTML autonome |
| `scripts/verifier.mjs` | `npm run verif` — vérifie que l'app se monte, pas seulement qu'elle compile |

## Le point sensible : `storage.js`

Le prototype a été écrit dans les artefacts Claude, qui exposent une API `window.storage`.
Hors de cet environnement elle n'existe pas, et le proto tombait en mémoire seule.

`src/storage.js` la réimplémente sur `localStorage`, avec la même signature et les mêmes
clés. Conséquence : **`Proto.jsx` n'a aucune ligne à changer** et fonctionne des deux côtés.
Ne pas « nettoyer » les appels `window.storage` dans `Proto.jsx`.

C'est aussi le point d'accroche de la synchronisation : même interface
`get / set / delete / list`, backend distant. Un seul fichier à remplacer.

Pour repartir des données d'exemple, dans la console du navigateur :

```js
Object.keys(localStorage).filter(k => k.startsWith("popott:")).forEach(k => localStorage.removeItem(k));
```

## Un piège du build autonome

En mode bibliothèque, Vite ne substitue pas `process.env.NODE_ENV`. React le lit au
chargement : sans la ligne `define` de `scripts/solo.mjs`, le build réussit, le fichier est
valide, et la page est blanche. D'où `npm run verif` : une compilation qui passe ne prouve
pas qu'une application démarre.

## Ce qui a été adapté depuis le fichier d'origine

Trois changements, rien d'autre :

1. **Jetons de design** — les variables locales du proto sont remplacées par celles de
   `brand.css` (`--aub` → `--aubergine`, `--ink3` → `--ink-3`, `--line2` → `--line-soft`,
   `--card` → `--surface`, `--serif` → `--display`). Plus aucune valeur hexadécimale
   dans le fichier.
2. **Logotype** — il remplace le titre « Bibliothèque » dans le bandeau de l'écran Plats.
3. **Aubergine de marque** `#4A2440` et crème `#F6F4ED` à la place des valeurs provisoires ;
   `--ink-3` assombri pour passer le contraste AA.
