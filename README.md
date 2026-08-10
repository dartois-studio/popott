# Popott

Recenser tous les plats faits à la maison pour composer les menus de la semaine,
et en déduire automatiquement la liste de courses.

> **Bibliothèque de plats → Menu de la semaine → Liste de courses agrégée et cochable.**

---

## Où regarder

| Dossier | Contenu |
|---|---|
| `doc/` | Le cahier des charges, découpé en fichiers courts. Point d'entrée : [`doc/00-projet.md`](doc/00-projet.md) |
| `proto/` | Le prototype UX/UI, application Vite + React à lancer en local |
| `icons/` | Les sources de marque : logotype et icône, en SVG |
| `CLAUDE.md` | Consignes de travail pour Claude Code |

## Lancer le prototype

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
