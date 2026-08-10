# Modèle de données

Décrit de façon fonctionnelle, indépendamment de la technologie de stockage.

## Personne

| Champ | Valeurs |
|---|---|
| Nom | Papa, Maman, Léa… |
| Régime par défaut | standard · végétarien · enfant · autre *(liste modifiable)* |
| Notes | libre : allergies, préférences |

Le régime par défaut pré-remplit la composition d'un repas et reste surchargeable à la volée.

## Ingrédient

| Champ | Valeurs |
|---|---|
| Nom | **normalisé et réutilisable** — « tomate » et « tomates » ne doivent pas coexister |
| Rayon | fruits/légumes · frais · épicerie · surgelés · boissons… *(liste modifiable)* |
| Unité par défaut | **sans unité** · g · kg · mL · L · pièce(s)… |
| Garde-manger permanent | oui/non — si oui, exclu par défaut de la liste de courses |

> **Point clé** : les ingrédients sont une liste normalisée, **jamais du texte libre**.
> C'est la condition de l'agrégation des quantités.

### Ligne optionnelle

Une ligne d'ingrédient peut être marquée **optionnelle** : le parmesan sur les pâtes,
la crème dans la soupe. Elle fait partie du plat et compte dans ses ingrédients, mais :

- elle apparaît sur la liste de courses **signalée comme telle**, jamais retirée en
  douce — un ingrédient qu'on ne verrait plus nulle part ne s'achèterait plus jamais ;
- elle ne compte pas dans les manquants de *Trouver une idée* : ne pas avoir de parmesan
  n'empêche pas de faire les pâtes.

## Plat

| Champ | Valeurs |
|---|---|
| Nom | |
| Catégorie | entrée · plat · dessert · goûter · apéro · extra… *(liste modifiable)* |
| **Saison** | toute l'année · été · hiver — **champ dédié, pas un tag** |
| Tags | végétarien · enfant · … |
| Portions de référence | ex. : recette pour 4 |
| Ingrédients | lignes **ingrédient + quantité + unité + optionnel**, ordonnées |
| Dernière fois cuisiné | dérivé du calendrier, sert à l'anti-répétition |

## Créneau

| Champ | Valeurs |
|---|---|
| Nom | Midi, Soir, Petit déjeuner… |
| **Portée** | `jour` (une ligne dans la grille) · `semaine` (en vrac, sans date) |

Par défaut : Midi et Soir en portée jour ; Petit déjeuner, Goûter, Dessert, Apéro, Extra
en portée semaine.

## Repas planifié

| Champ | Valeurs |
|---|---|
| Date | le jour, ou le lundi de la semaine pour un créneau de portée semaine |
| Créneau | |
| Plats | plusieurs, **dans l'ordre du service** |
| Convives | personnes concernées |
| **Répétitions** | pour les créneaux en vrac : combien de fois dans la semaine |
| Ajustements | par personne : `+ ingrédient` (compté aux courses) ou `− ingrédient` (assiette seulement) |

Un repas sans plat n'existe pas : il est supprimé automatiquement.

## Semaine type (preset)

Nom + liste d'entrées `{ jour (0-6 ou vide si en vrac), créneau, plats, convives, répétitions }`.
Sans dates : applicable à n'importe quelle semaine.

## Article de liste de courses

| Champ | Valeurs |
|---|---|
| Ingrédient (ou libellé libre) | |
| Quantité agrégée | somme des besoins de la semaine |
| Rayon | hérité de l'ingrédient |
| État | à acheter · déjà en stock · coché |
| Origine | généré depuis le menu · ajouté manuellement |

## Règle d'agrégation

```
quantité = quantité de la recette
         × (nombre de convives / portions de référence)
         × répétitions
```

Regroupement par **ingrédient + unité**. Deux unités différentes pour un même ingrédient
donnent deux lignes : la conversion reste un point ouvert.

Un article n'est **optionnel qu'à l'unanimité** : si un plat de la semaine en a besoin
pour de bon, l'achat redevient obligatoire, quel que soit le statut des autres.

Les ajustements par personne suivent une règle asymétrique : un `+ ingrédient` s'ajoute
aux courses, un `− ingrédient` ne retire rien, puisque l'ingrédient sert encore aux autres
portions.
