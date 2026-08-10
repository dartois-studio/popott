# Popott

Recenser tous les plats faits à la maison pour composer les menus de la semaine,
et en déduire automatiquement la liste de courses.

> **Bibliothèque de plats → Menu de la semaine → Liste de courses agrégée et cochable.**

---

## Où regarder

| Dossier | Contenu |
|---|---|
| `doc/` | Le cahier des charges, découpé en fichiers courts. Point d'entrée : [`doc/00-projet.md`](doc/00-projet.md) |
| `proto/` | Le prototype UX/UI, application Vite + React |
| `.github/workflows/` | Publication automatique du proto sur GitHub Pages |
| `icons/` | Les sources de marque : logotype et icône, en SVG |
| `CLAUDE.md` | Consignes de travail pour Claude Code |

## Voir le prototype

**https://dartois-studio.github.io/popott/** — c'est l'adresse à ouvrir sur le téléphone.

Le site est le fichier `index.html` à la racine : l'application entière dans un seul
fichier, React compris. Il est **fabriqué**, pas écrit à la main. Après toute modification
du proto :

```bash
cd proto
npm run pages     # regenere index.html a la racine
```

puis commiter et pousser. Réglage GitHub, une fois : *Settings → Pages → Source →
Deploy from a branch → main → / (root)*.

Un workflow GitHub Actions existe aussi (`.github/workflows/pages.yml`), qui fait la même
chose automatiquement à chaque push. Il demande de basculer la source sur « GitHub Actions ».
Les deux voies marchent, mais **pas en même temps** : c'est l'une ou l'autre.

## Lancer le prototype en local

Sous Windows : **double-cliquer `dev.bat`**. Il installe ce qu'il faut la première fois,
démarre le proto et affiche deux adresses — une pour l'ordinateur, une pour le téléphone.

En ligne de commande :

```bash
cd proto
npm install
npm run dev
```

Ouvrir `proto/index.html` directement ne marche pas : il faut passer par Vite.
Pour une version en un seul fichier, ouvrable d'un double-clic : `npm run solo`.

Le prototype est autonome : aucun backend, aucune dépendance en dehors de React.
Les données sont sauvegardées sur l'appareil et survivent au rechargement.

## État

| Phase | | |
|---|---|---|
| 0 | Cahier des charges | ✅ |
| 1 | Proto UX/UI — quatre écrans, parcours central | ✅ |
| 2 | Fonctionnel local — absorbé par le proto | ✅ |
| 3 | Persistance locale — survit au rechargement | ✅ |
| 4 | Synchronisation à deux | à faire |
| 5 | PWA, hors-ligne, finitions magasin | à faire |

Détail dans [`doc/04-roadmap.md`](doc/04-roadmap.md).
