# Synchronisation

Deux téléphones et deux navigateurs sur les mêmes données. Ce fichier dit
comment le mettre en route, puis comment ça marche.

---

## Mise en route

Une seule fois, pour le foyer entier. Compter vingt minutes.

### 1. Créer le projet Supabase

Sur [supabase.com](https://supabase.com), *New project*. Le compte GitHub suffit,
l'offre gratuite couvre largement un foyer. Noter la région (Frankfurt, pour être
proche) et le mot de passe de la base — il ne resservira pas ici, mais Supabase
le demande.

### 2. Créer les tables

*SQL Editor* → *New query* → coller tout `supabase/schema.sql` → *Run*.

Le script est rejouable : le relancer ne casse rien. Il crée trois tables
(`foyers`, `membres`, `documents`), les règles de sécurité, trois fonctions,
et ouvre le canal temps réel.

### 3. Régler les adresses de retour

*Authentication* → **URL Configuration** :

- **Site URL** → `https://dartois.studio/popott/` — le domaine personnalisé, pas
  l'adresse `github.io` qui n'est qu'une redirection ;
- **Redirect URLs** → ajouter `https://dartois.studio/popott/**` et
  `http://localhost:5173/**` pour pouvoir tester en local.

Sans ce réglage, le lien de confirmation reçu par mail renvoie vers
`http://localhost:3000`, qui n'existe pas : la création de compte reste bloquée.

On peut aussi supprimer l'étape de confirmation — *Sign In / Providers* → *Email*
→ décocher **Confirm email**. L'application gère les deux cas. À savoir : l'envoi
de mails intégré de Supabase est fortement bridé sur l'offre gratuite, quelques
messages par heure ; en cas de blocage, décocher débloque immédiatement.

### 4. Brancher l'application

*Project Settings* → *API*. Copier l'URL du projet et la clé **anon public**
dans un fichier `app/.env` :

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi…
```

`app/.env.example` sert de modèle. Le fichier `.env` n'est pas versionné.

> Ces deux valeurs sont **publiques par construction** : elles finissent dans le
> fichier publié, et c'est prévu. Ce qui protège les données, c'est le *row level
> security* du schéma — la clé anon ne donne accès à rien sans compte, et un
> compte ne voit que son foyer. La clé **service_role**, elle, ne doit jamais
> sortir de Supabase.

### 5. Donner les mêmes valeurs à GitHub

Le `.env` sert au développement local ; il n'est pas versionné, donc GitHub ne le
voit pas. Sans ces valeurs de son côté, le site publié se construirait très bien
mais **sans compte ni foyer partagé**.

*Settings → Secrets and variables → Actions*, deux secrets :

| Secret | Valeur |
|---|---|
| `SUPABASE_URL` | la même que `VITE_SUPABASE_URL` |
| `SUPABASE_ANON_KEY` | la même que `VITE_SUPABASE_ANON_KEY` |

En ligne de commande, depuis le dépôt :

```bash
gh secret set SUPABASE_URL
gh secret set SUPABASE_ANON_KEY
```

### 6. Publier

Rien à construire : `sync.bat` — ou `git push` — suffit. GitHub reconstruit et met
en ligne. La vérification refuse de publier si la synchronisation n'est pas gravée
dans le fichier servi, plutôt que de laisser la surprise pour le magasin.

### 7. Le premier appareil

Ouvrir le site, créer un compte, puis **Créer un foyer**. Les données déjà
présentes sur cet appareil deviennent celles du foyer — rien n'est perdu.

Aller ensuite dans **Réglages → Compte** pour lire le **code du foyer** et le
copier. (L'adresse `#compte` mène au même endroit, en plein écran.)

### 8. Les autres appareils

Sur chaque téléphone et chaque navigateur : ouvrir le site, créer un compte
(ou se connecter avec le même), coller le code dans **Rallier un foyer
existant**.

⚠ Sur un appareil qui a déjà servi, ses données locales ne remontent pas :
c'est le foyer qui gagne, et le local est remplacé. Faire le pas 7 depuis
l'appareil qui a les vraies données.

---

## Comment ça marche

### Le point d'accroche n'a pas bougé

`window.storage` expose toujours `get / set / delete / list`. `App.jsx`
ignore qu'il y a un serveur derrière. Deux implémentations coexistent :

| Fichier | Quand |
|---|---|
| `src/storage.js` | pas de configuration Supabase — localStorage seul, comme avant |
| `src/storage-distant.js` | un compte et un foyer — localStorage **et** serveur |

### Trois valeurs par clé

```
popott:<clé>                ce que l'application croit vrai (le cache)
popott-sync:base:<clé>      la dernière version reçue du serveur
popott-sync:version:<clé>   son numéro de version
```

L'écart entre le cache et la base, c'est exactement ce que cet appareil a
changé et qui n'est pas encore parti.

### Le local d'abord

Toute écriture va dans localStorage immédiatement, puis part vers le serveur
après 700 ms. Réseau coupé, téléphone endormi au rayon surgelés : rien n'est
perdu, la poussée reprend au retour — au retour du réseau, au réveil de
l'onglet, ou à la reconnexion du canal temps réel.

### Personne n'écrase personne

Chaque document porte un numéro de version. Une écriture dit « je remplace la
version 12 » ; si le serveur en est à la 13, la mise à jour ne touche aucune
ligne. Le client sait alors qu'il doit fusionner avant de réessayer.

C'est le rôle de `src/fusion.js`, une fusion à trois voies :

- **base** — le document tel qu'on l'avait reçu ;
- **mien** — ce qu'on en a fait depuis ;
- **distant** — ce que le serveur contient maintenant.

Comparer *mien* à *base* dit ce que **j'ai** changé, et rien d'autre. On repart
donc de *distant* et on ne rejoue par-dessus que mes changements à moi.

Aucun nom de champ n'est écrit dans `fusion.js`. La règle se déduit de la forme :

| Forme rencontrée | Règle |
|---|---|
| tableau d'objets à `id` | appariement par `id`, élément par élément |
| objet simple | clé par clé, en descendant |
| tout le reste | si je l'ai touché, ma valeur ; sinon la sienne |

Ce qui couvre les plats, les repas, les ajustements et la carte des cases
cochées sans jamais nommer « plats », « repas » ni « états ».

Les cas sont vérifiés : `node scripts/verifier-fusion.mjs`, inclus dans
`npm run verif`. C'est la seule pièce qui puisse perdre des données en
silence — on ne verrait pas le bug à l'écran, on verrait un plat disparu
trois jours plus tard.

### Les autres appareils sont prévenus

Un canal temps réel signale « la clé X est passée en version N ». Le contenu
ne transite **pas** par le canal : le document complet peut peser plusieurs
centaines de kilo-octets et saturerait la liaison. Le client reçoit le
signal, va chercher la valeur par l'API normale, fusionne si besoin, puis
émet un évènement `popott:distant`.

`App.jsx` l'écoute et remplace ses données. La semaine consultée, l'onglet
ouvert et la recherche en cours ne bougent pas : seul `db` est remplacé.

Le tri se fait sur la **version**, pas sur l'identité de l'auteur : deux
navigateurs du même PC sont souvent connectés au même compte, et se filtrer
sur l'identité les rendrait sourds l'un à l'autre.

### Les comptes

Un compte par personne, un foyer par maison. Le foyer est l'unité de partage,
et il se rallie par son code — l'identifiant du foyer, affiché dans
**Réglages → Compte** (et toujours dans le panneau `#compte`, qui reste la
version plein écran du même contenu).

`App.jsx` ne connaît ni Supabase ni la notion de session. Il reçoit du
portail trois entrées facultatives — `compte`, `version`, `surActualiser` —
et affiche les blocs correspondants s'ils existent. Sans elles, en local
seul ou dans l'environnement d'origine du proto, l'écran est exactement
celui d'avant.

**Le nom du foyer est dans le document, pas dans la table `foyers`.** La
colonne `nom` existe côté serveur et reste inutilisée : la mettre à jour
demanderait une fonction SQL de plus, ne se propagerait pas par le canal
temps réel, et n'existerait pas en local seul. Rangé dans `menus:v1` à côté
des personnes et des rayons, le nom se fusionne, se synchronise et
s'affiche sur les deux téléphones sans une ligne de plus.

Les règles de sécurité tiennent en une phrase : **on ne voit que les documents
du foyer dont on est membre**. Aucune politique d'insertion n'existe sur
`foyers` ni `membres` ; la création et le ralliement passent obligatoirement
par les fonctions `creer_foyer` et `rejoindre_foyer`. Impossible de s'inviter
dans un foyer au hasard.

---

## Ce qui reste ouvert

- **Hors ligne, l'application doit déjà être ouverte.** Les écritures survivent
  à la coupure, mais lancer le site sans réseau ne charge rien : il manque le
  service worker. C'est la phase 5.

- **Un seul document pour tout l'état.** Chaque frappe renvoie le document
  entier. La fusion rend ça sûr, mais pas léger. Si ça devient gênant, sortir
  `etats` (les cases cochées) dans sa propre clé est le premier découpage
  utile — et le stockage le supporte déjà, c'est `App.jsx` qui n'écrit
  qu'une clé.

- **Pas de gestion de sortie de foyer** dans l'interface. La règle SQL existe
  (un membre peut se retirer lui-même), le bouton non.
