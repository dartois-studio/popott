# Popott — Projet

> Document racine. Court par construction : chaque partie est dans un fichier séparé,
> à ouvrir seulement quand on travaille dessus.
> Version 3 — après le prototype et l'arrivée de l'identité de marque.

## Vision

Recenser tous les plats faits à la maison pour composer les menus de la semaine,
et en déduire automatiquement la liste de courses.

> **Bibliothèque de plats → Menu de la semaine → Liste de courses agrégée et cochable.**

Simple au quotidien, y compris en magasin, tout en gérant les subtilités d'un foyer
(quantités, régimes différents, produits déjà en stock).

## Utilisateurs

- **Foyer partagé**, au moins deux personnes synchronisées sur le même menu et la même liste.
- **Membres** aux régimes différents : standard, végétarien, enfant.

## Deux contextes d'usage, deux exigences

| Contexte | Exigence |
|---|---|
| À la maison, au calme | Densité d'information, édition confortable, vue d'ensemble de la semaine |
| **En magasin, debout, une main** | Cibles larges, aucun zoom, hors-ligne, une seule action par geste |

Le deuxième contexte est le plus contraignant : c'est lui qui décide en cas de conflit.

## Principes

- **Mobile d'abord**, desktop ensuite.
- **Navigation par onglets en bas** : Plats · Semaine · Courses · Réglages.
- **Rien de figé** : rayons, créneaux, catégories, régimes et unités sont des listes
  modifiables par l'utilisateur.
- **Jamais d'écran vide** : données d'exemple au démarrage, entièrement modifiables.
- **Enregistrement au fil de l'eau** : pas de bouton *Enregistrer* sans *Annuler* symétrique.
- **PWA** : installable, la liste de courses reste consultable hors-ligne.

## Les autres fichiers

| Fichier | Contenu |
|---|---|
| [`01-modele-donnees.md`](01-modele-donnees.md) | Entités, champs, règle d'agrégation |
| [`02-ecrans.md`](02-ecrans.md) | Les quatre écrans et leurs gestes |
| [`03-decisions.md`](03-decisions.md) | Ce qui a été tranché, et pourquoi |
| [`04-roadmap.md`](04-roadmap.md) | Phases et points ouverts |
| [`05-design-system.md`](05-design-system.md) | Couleurs, typo, composants |
| [`06-marque-et-icones.md`](06-marque-et-icones.md) | Logotype, icône, favicon, PWA |
