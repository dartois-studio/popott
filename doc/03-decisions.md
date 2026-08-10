# Décisions

Ce qui a été tranché, et pourquoi. À lire avant de « corriger » quelque chose
qui a l'air bizarre : plusieurs solutions évidentes ont été essayées puis abandonnées.

## Modèle

- **Ingrédients normalisés**, jamais du texte libre → condition de l'agrégation.
- **Saison = champ dédié à trois valeurs** (toute l'année / été / hiver), pas un tag :
  le remplissage automatique doit la comprendre, un tag libre ne s'interprète pas.
  Trois valeurs plutôt que quatre saisons ou des mois : suffisant, et une seule question
  à l'ajout d'un plat.
- **Créneaux à portée** : goûter, apéro, petit déjeuner et dessert s'achètent en vrac,
  sans jour précis. Les forcer dans une grille quotidienne était faux. D'où le
  multiplicateur `× n fois` plutôt qu'une case par jour.
- **Unité « sans unité » par défaut** pour un nouvel ingrédient, plutôt que « g ».
- **Ordre des plats dans un repas conservé** : c'est l'ordre du service.
- **Un repas vidé de ses plats est supprimé** : balayer sept jours d'affilée ne doit pas
  laisser six coquilles vides derrière soi.

## Interface

- **Grille pleine largeur** plutôt qu'une colonne de libellés à gauche : les noms de plats
  ont besoin de chaque pixel. Le nom du créneau devient une bande au-dessus de sa ligne.
- **Fond teinté et non liseré** pour la couleur de catégorie : un liseré de 3 px coûte
  3 px de texte sur une colonne de 46 px.
- **Statistiques en pop-up** : utiles une fois par semaine, elles occupaient un écran par jour.
- **Recherche par ingrédients sortie du flux de la bibliothèque** : coincée entre le champ
  de recherche et la liste, elle brouillait la lecture, et une grille de chips ne passe pas
  l'échelle. Elle est devenue une icône ampoule qui ouvre sa propre feuille.
- **« Poser » ouvre un mini-calendrier** plutôt que des puces « ce soir / demain midi » :
  les puces masquaient justement ce qu'on voulait voir avant de choisir.
- **Enregistrement au fil de l'eau** : un bouton *Enregistrer* n'a de sens qu'avec un
  *Annuler* symétrique. Ici chaque geste est atomique et réversible. Dès qu'on navigue entre
  les jours dans la même fiche, ce bouton devient un piège — il faudrait confirmer à chaque
  balayage. Donc : tout s'écrit, le bouton devient *Terminé*.
- **Filtres : chips tant qu'il y en a peu, menu déroulant au-delà.** Onze catégories en chips
  faisaient quatre lignes avant le premier plat.
- **Chips sur plusieurs lignes** plutôt qu'un défilement horizontal quand on en garde :
  tout doit être atteignable au pouce du premier coup.
- **Liste de plats en lignes, pas en cartes** : nom en serif, tout le reste sur une ligne
  grise. Même densité d'information, deux fois moins de bruit visuel.
- **Le remplissage automatique propose, il ne règle pas.** Les quotas chiffrés
  (« n repas végé », « éviter 21 jours ») étaient arbitraires : remplacés par des préférences
  souples et un dé par repas.

## Synchronisation

- **Supabase plutôt que Firebase ou un Worker maison** : Postgres, temps réel natif,
  et des règles de sécurité qui s'écrivent en SQL à côté du schéma. Firebase masque
  les conflits au lieu de les traiter ; un Worker aurait demandé du sondage
  périodique faute de temps réel gratuit.
- **Comptes e-mail plutôt qu'un code de foyer secret** : le site est publié en clair
  sur GitHub Pages, et la clé anon est dans le fichier. Seule une vraie authentification
  permet aux règles de sécurité de distinguer les foyers.
- **Fusion à trois voies plutôt que dernier écrivain gagnant** : le conflit qui compte
  n'est pas théorique — l'un coche des cases en magasin pendant que l'autre ajoute un
  plat à la maison. Comparer l'état local à la dernière version reçue dit ce que *cet*
  appareil a changé ; on ne rejoue que ça par-dessus la version du serveur.
- **La fusion ne connaît aucun nom de champ** : la règle se déduit de la forme
  rencontrée (tableau d'objets à `id`, objet simple, valeur indivisible). Un `switch`
  sur « plats », « repas », « etats » serait devenu faux au premier champ ajouté.
- **Le canal temps réel ne transporte pas le document**, seulement son numéro de
  version. Le document complet pèse des centaines de kilo-octets ; au-delà de la limite
  du canal, le message serait purement abandonné.
- **Tri des échos sur la version, pas sur l'auteur** : deux navigateurs du même PC sont
  souvent connectés au même compte. Se filtrer sur l'identité les rendrait sourds
  l'un à l'autre.
- **Panneau compte à l'adresse `#compte`** au départ, hors de l'interface : la maquette
  ne prévoyait pas d'entrée « compte ». Les réglages en ont une désormais — un bloc
  *Compte* en bas de liste, avec l'e-mail, le code du foyer et la déconnexion. Le
  panneau `#compte` n'a pas été retiré : il sert d'écran plein quand il n'y a rien
  d'autre à montrer.
- **`Proto.jsx` ne parle toujours pas à Supabase** : il reçoit `compte`, `version` et
  `surActualiser` du point d'entrée, et affiche les blocs correspondants s'ils existent.
  Les trois sont facultatifs — sans eux, le proto tourne tel quel.
- **Nom du foyer dans le document, pas dans la colonne `foyers.nom`** : rangé à côté des
  personnes et des rayons, il profite de la fusion et du canal temps réel sans une ligne
  de SQL, et il existe aussi en local seul. La colonne serveur reste inutilisée.
- **« Actualiser l'application » passe par un paramètre d'adresse** (`?maj=…`), pas par
  un `location.reload()` : sans service worker, c'est le cache HTTP qui garde l'ancien
  `index.html`, et un rechargement peut resservir exactement le même fichier. Un bouton
  qui ne fait rien tout en laissant croire qu'on est à jour est pire que pas de bouton.
  Le paramètre est retiré de l'adresse au chargement suivant.

## Reporté volontairement

- **Portions fines par personne** (3 parts végé + 1 part poulet) : les ajustements par
  personne couvrent le besoin réel pour l'instant.
- **Restes et batch cooking** (un plat couvre plusieurs repas).
- **Conversion d'unités** (une recette en pièces, les courses en kg).
