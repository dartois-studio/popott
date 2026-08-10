# Les quatre écrans

Navigation par onglets en bas : **Plats · Semaine · Courses · Réglages**.
L'onglet Courses porte une pastille avec le nombre d'articles restants.

---

## 1. Plats — la bibliothèque

- Liste en lignes simples : nom en serif, puis une ligne grise
  `catégorie · n ingr. · n parts · saison · tags · fait il y a n j`.
- Recherche par nom. Filtres sur une seule ligne : deux listes déroulantes
  (catégorie, régime) et un bouton ampoule.
- **Tri** : A→Z, Z→A, ajouté récemment, ajouté en premier, **pas cuisiné depuis longtemps**.
- **Actions par plat** (bouton ⋯) : modifier, dupliquer, supprimer.
- **Trouver une idée** (icône ampoule) : feuille dédiée. On ajoute les ingrédients qu'on a
  via un champ de recherche — pas une grille de cases, ça ne tient pas à 300 ingrédients.
  Les plats sont classés par *ce qui manque le moins*, chaque ligne affiche
  « 3 sur place · 2 manquants », et un bouton **Poser** ouvre un mini-calendrier pour
  placer le plat en voyant ce qui est déjà prévu.

## 2. Semaine

Deux vues, bascule par un bouton du header.

- **Grille** (par défaut) : 7 colonnes pleine largeur × une ligne par créneau quotidien.
  Chaque plat est un bloc au fond teinté de sa catégorie. Cases vides marquées d'un `+`,
  jour courant surligné, week-end atténué, `2p` quand tout le monde n'est pas là.
- **Détail** : jour par jour, avec couverts et ajustements.
- Bouton **Aujourd'hui** dans le header, coloré quand on s'est éloigné de la semaine courante.
- Créneaux **en vrac** (petit déjeuner, goûter, dessert, apéro) affichés à part, avec un
  multiplicateur `× n fois` au lieu d'une case par jour.

**Trois opérations distinctes**, jamais mélangées :
*Copier vers une autre semaine* · *Importer depuis une autre semaine* (ne liste que
les semaines qui contiennent réellement des repas) · *Importer une semaine type*.
L'enregistrement d'un modèle est une entrée séparée.

**Remplissage automatique** : propose une semaine, ne la règle pas. Préférences souples
plutôt que quotas chiffrés, et un dé par repas pour relancer une proposition isolée.

### La fiche repas

L'écran le plus travaillé du proto.

- **Pleine hauteur** (94 % de l'écran), bandeau fixe en haut, contenu défilant dessous.
- **Balayage sur la date** pour changer de jour, chevrons visibles pour ceux qui préfèrent
  taper. On peut sortir de la semaine : la fiche devient un mini-planificateur.
- **Midi / Soir en segments** sous la date. Changer de créneau garde le jour, changer de jour
  garde le créneau. Sur un créneau en vrac, les segments deviennent
  Petit déj / Goûter / Dessert / Apéro.
- **Balayage sur la liste des plats** pour changer de catégorie, avec un bandeau
  `‹ TOUTES CATÉGORIES 13 ›`.
- **Convives et ajustements repliés** derrière une ligne de résumé
  (« 3 couverts · 1 ajustement »).
- **Tout s'écrit immédiatement.** Le bouton est *Terminé*, pas *Enregistrer* ; le balayage
  ne demande jamais de confirmation.
- Hiérarchie en trois niveaux : titres de section en petites capitales monospace
  (Au menu · Choisir un plat · Convives · Ajustements), sélecteur séparé par un filet,
  plats en simples lignes — pas de carte dans une carte dans une feuille.

## 3. Courses

Traitée comme un **ticket de caisse** : c'est le seul écran qui prend un parti graphique fort.

- Génération automatique depuis le menu de la semaine.
- **Tri par rayon**, en-têtes collants et colorés, pour un parcours magasin efficace.
- Quantités en chiffres monospace alignées à droite.
- Cases à cocher au pouce, barre de progression en haut.
- **« Déjà »** : marquage ponctuel de ce qu'on a en stock.
- **Garde-manger** exclu automatiquement mais consultable.
- **Ajout manuel** d'articles hors menu.

## 4. Réglages

Tout ce qui doit rester modifiable : personnes, ingrédients, rayons, créneaux (avec leur
portée), catégories, régimes, unités. Rien n'est codé en dur ailleurs dans l'application.

- **Foyer** : un **nom de foyer** renommable en tête de la carte, puis les personnes.
  Le nom vit dans le document `menus:v1`, comme les personnes et les rayons — il se
  synchronise donc tout seul et existe aussi en local seul.
- **Compte** *(seulement si la synchronisation est configurée)* : l'adresse e-mail du
  compte connecté sur cet appareil et depuis quand, le code du foyer avec un bouton
  **Copier**, et **Se déconnecter**. C'est l'entrée que `doc/07-synchronisation.md`
  attendait pour le panneau `#compte`, qui reste accessible mais n'est plus le seul
  chemin.
- **Application** : le numéro de version, la date de publication et le commit, plus
  **Actualiser l'application** — qui vide les caches et redemande le code au serveur.
  Aucune donnée n'est touchée. Voir `proto/src/version.js` pour le pourquoi du
  paramètre d'adresse.
