# Popott

Recenser tous les plats faits à la maison pour composer les menus de la semaine,
et en déduire automatiquement la liste de courses.

> **Bibliothèque de plats → Menu de la semaine → Liste de courses agrégée et cochable.**

---

## Où regarder

| Dossier | Contenu |
|---|---|
| `app/` | L'application : Vite + React, comptes, synchronisation, PWA |
| `doc/` | Le cahier des charges, découpé en fiches courtes. Point d'entrée : [`doc/00-projet.md`](doc/00-projet.md) |
| `supabase/` | Le schéma SQL de la synchronisation, à exécuter une fois |
| `icons/` | Les sources de marque : logotype et icône, en SVG |
| `.github/workflows/` | La publication automatique |
| `.claude/` | Le suivi projet (tickets, lots) et les consignes de travail |

## Voir l'application

**https://dartois.studio/popott/** — c'est l'adresse à ouvrir sur le téléphone.
L'adresse GitHub `dartois-studio.github.io/popott/` y redirige : c'est le domaine
personnalisé qui fait foi, et c'est lui qu'attendent les réglages Supabase.

## Publier

Il n'y a rien à faire. **Tout envoi sur `main` reconstruit et publie le site**,
via GitHub Actions. Aucun fichier construit ne vit dans le dépôt : ce qui est en
ligne est toujours ce qui vient d'être envoyé.

Sous Windows, `sync.bat` envoie, attend la publication et dit quand c'est en ligne.

Avant de publier, GitHub rejoue `npm run verif`. Si la vérification échoue, **le
site en ligne ne change pas** — l'ancienne version reste servie. Ce qui est
contrôlé :

- la fusion à trois voies, sur ses cas limites ;
- l'application s'affiche vraiment (une compilation qui passe ne prouve rien) ;
- l'écran de connexion s'affiche vraiment ;
- les chemins sont relatifs — un chemin absolu casse le sous-dossier `/popott/` ;
- la synchronisation est bien gravée dans le fascicule publié ;
- le manifeste et les icônes sont là.

Deux réglages GitHub, faits une fois : *Settings → Pages → Source → GitHub Actions*,
et les secrets `SUPABASE_URL` / `SUPABASE_ANON_KEY`.

## Travailler dessus

Sous Windows : **double-cliquer `dev.bat`**. Il installe ce qu'il faut la première
fois, démarre l'application et affiche deux adresses — une pour l'ordinateur, une
pour le téléphone.

En ligne de commande :

```bash
cd app
npm install
npm run dev      # rechargement a chaud
npm run verif    # tout controler, comme le fera GitHub
npm run solo     # un fichier unique ouvrable d'un double-clic
```

Ouvrir `app/index.html` directement ne marche pas : il faut passer par Vite.
`npm run solo` produit `app/dist-solo/popott.html`, autonome et hors-ligne, pour
montrer l'application sans rien installer.

## Partager entre plusieurs appareils

Deux téléphones et deux navigateurs sur les mêmes menus, en temps réel, avec un
mode hors-ligne qui ne perd rien en magasin.

La marche à suivre complète est dans
[`doc/07-synchronisation.md`](doc/07-synchronisation.md) — compter vingt minutes,
une seule fois. En résumé :

1. créer un projet sur [supabase.com](https://supabase.com) ;
2. y exécuter `supabase/schema.sql` ;
3. copier l'URL et la clé *anon* dans `app/.env` (modèle : `app/.env.example`) ;
4. déposer les deux mêmes valeurs dans les secrets GitHub du dépôt ;
5. sur le premier appareil : créer un compte, créer un foyer, relever le code
   affiché sur `…/popott/#compte` ;
6. sur les autres : créer un compte, coller ce code.

Sans `app/.env`, le développement local continue de fonctionner en local seul —
aucun compte, aucune requête réseau. Sans les secrets GitHub, la vérification
refuse de publier plutôt que de mettre en ligne une version sans synchronisation.

## État

| Phase | | |
|---|---|---|
| 0 | Cahier des charges | ✅ |
| 1 | Quatre écrans, parcours central | ✅ |
| 2 | Fonctionnel local | ✅ |
| 3 | Persistance locale — survit au rechargement | ✅ |
| 4 | Synchronisation à deux | ✅ |
| 5 | PWA, hors-ligne, finitions magasin | à faire |

Détail dans [`doc/04-roadmap.md`](doc/04-roadmap.md).
