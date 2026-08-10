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
| `supabase/` | Le schéma SQL de la synchronisation, à exécuter une fois |
| `.github/workflows/` | Publication automatique du proto sur GitHub Pages |
| `icons/` | Les sources de marque : logotype et icône, en SVG |
| `CLAUDE.md` | Consignes de travail pour Claude Code |

## Voir le prototype

**https://dartois.studio/popott/** — c'est l'adresse à ouvrir sur le téléphone.
L'adresse GitHub `dartois-studio.github.io/popott/` y redirige : c'est le domaine
personnalisé qui fait foi, et c'est lui qu'attendent les réglages Supabase.

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

Le prototype tourne tel quel, sans compte ni backend : les données sont
sauvegardées sur l'appareil et survivent au rechargement. Pour une version en un
seul fichier, ouvrable d'un double-clic et toujours hors ligne : `npm run solo`.

## Partager entre plusieurs appareils

Deux téléphones et deux navigateurs sur les mêmes menus, en temps réel, avec un
mode hors-ligne qui ne perd rien en magasin.

La marche à suivre complète est dans
[`doc/07-synchronisation.md`](doc/07-synchronisation.md) — compter vingt minutes,
une seule fois. En résumé :

1. créer un projet sur [supabase.com](https://supabase.com) ;
2. y exécuter `supabase/schema.sql` ;
3. copier l'URL et la clé *anon* dans `proto/.env` (modèle : `proto/.env.example`) ;
4. `npm run pages`, puis pousser ;
5. sur le premier appareil : créer un compte, créer un foyer, relever le code
   affiché sur `…/popott/#compte` ;
6. sur les autres : créer un compte, coller ce code.

Sans `proto/.env`, tout continue de fonctionner en local seul — aucun compte,
aucune requête réseau.

## État

| Phase | | |
|---|---|---|
| 0 | Cahier des charges | ✅ |
| 1 | Proto UX/UI — quatre écrans, parcours central | ✅ |
| 2 | Fonctionnel local — absorbé par le proto | ✅ |
| 3 | Persistance locale — survit au rechargement | ✅ |
| 4 | Synchronisation à deux | ✅ |
| 5 | PWA, hors-ligne, finitions magasin | à faire |

Détail dans [`doc/04-roadmap.md`](doc/04-roadmap.md).
