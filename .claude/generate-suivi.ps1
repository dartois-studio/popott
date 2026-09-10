# Régénère suivi.md ET suivi-actif.md depuis suivi.json (source de vérité).
# Usage : powershell -ExecutionPolicy Bypass -File .claude\generate-suivi.ps1
# Même format que le buildMarkdown de suivi-projet.html, enrichi des champs PR/lot/codedWith.
#
# Nom du projet, préfixe des tickets et vocabulaire de livraison sont lus dans le bloc
# CONFIG (const PROJECT = { ... }) du suivi-projet*.html voisin : une seule source de vérité.
#
# ---- SOUCHE (ATL-045, 07/09/2026) ----------------------------------------------------------
# Ce fichier est la SOURCE des générateurs des dépôts, et il vit dans le dépôt Atelier, sous
# templates\suivi-projet\. Une correction se pose ICI d'abord, puis se propage aux dépôts
# (ATL-046) ; jamais l'inverse. Le dossier ~\.claude\templates\ n'est sous aucun git : il ne
# porte plus qu'un README de renvoi.
#
# Les « ATL-xxx » en commentaire sont les tickets de l'Atelier qui ont posé chaque règle. Leur
# mesure et les options écartées sont dans .claude\suivi.json de l'Atelier — les lire là avant
# de toucher à la règle qu'ils justifient.
#
# À SAVOIR AVANT DE PROPAGER : les statuts sont lus en CLASSES depuis le 07/09/2026 (ATL-044,
# fait) — ce script ne teste plus aucun libellé de statut en dur et ne lit plus `builtSw` pour
# décider. Un dépôt déclare son dialecte dans le bloc `socle` de son suivi.json ; sans ce bloc,
# repli annoncé sur les libellés de référence. Voir SOCLE.md §2, §3 et §4, dans ce dossier.
# Ce qui RESTE à faire de ce côté, et qui n'est pas dans ce fichier : `lotStage()` du tracker
# (suivi-projet.template.html) lit encore `builtSw` et `prState` avant `status` — c'est de
# l'affichage, donc permis, mais à passer aux classes avec ATL-046/ATL-049.
# --------------------------------------------------------------------------------------------
param(
  [string]$JsonPath = (Join-Path $PSScriptRoot 'suivi.json'),
  [string]$MdPath = '',
  [string]$ProjectName = '',
  [string]$Prefix = '',
  [string]$Participle = '',
  [string]$StageDone = ''
  ,
  [int]$MaxActifBytes = 8192        # 0 = illimité. Plafond du FICHIER suivi-actif.md (ATL-013),
                                    # réparti entre les décisions des lots, puis les gains.
  ,
  [int]$MaxDecisionChars = 0        # 0 = illimité. Plafond de secours PAR lot, en caractères :
                                    # le plafond de fichier gouverne désormais.
)
$ErrorActionPreference = 'Stop'
if (-not $MdPath) { $MdPath = Join-Path (Split-Path $JsonPath) 'suivi.md' }
$ActifPath = Join-Path (Split-Path $JsonPath) 'suivi-actif.md'

# ---- Config lue depuis le bloc PROJECT du tracker HTML (valeurs de repli si absent) ----
function Get-SuiviConfig([string]$dir) {
  $cfg = @{ Name = 'Projet'; Prefix = 'T'; Participle = 'livré'; StageDone = '' }
  $html = Get-ChildItem -Path $dir -Filter 'suivi-projet*.html' -File -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -notlike '*template*' -and $_.Name -notlike '*backup*' } |
    Select-Object -First 1
  if ($html) {
    $txt = [IO.File]::ReadAllText($html.FullName)
    $cut = $txt.IndexOf('FIN DE LA CONFIG')          # ne lire que le bloc de config
    if ($cut -gt 0) { $txt = $txt.Substring(0, $cut) }
    if ($txt -match '(?m)^\s*name:\s*"([^"]*)"')       { $cfg.Name = $Matches[1] }
    if ($txt -match '(?m)^\s*prefix:\s*"([^"]*)"')     { $cfg.Prefix = $Matches[1] }
    if ($txt -match '(?m)^\s*participle:\s*"([^"]*)"') { $cfg.Participle = $Matches[1] }
    if ($txt -match '(?m)^\s*stageDone:\s*"([^"]*)"')   { $cfg.StageDone = $Matches[1] }
  }
  return $cfg
}
$cfg = Get-SuiviConfig (Split-Path $JsonPath)
if (-not $ProjectName) { $ProjectName = $cfg.Name }
if (-not $Prefix)      { $Prefix = $cfg.Prefix }
if (-not $Participle)  { $Participle = $cfg.Participle }
if (-not $StageDone)   { $StageDone = $cfg.StageDone }

$state = [IO.File]::ReadAllText($JsonPath) | ConvertFrom-Json

# ---- Statuts : des CLASSES, pas des libellés (ATL-044 ; SOCLE.md §2 et §4) ------------------
# Quatre classes — 'ouvert', 'en-travail', 'clos', 'hors'. Ce script demande la CLASSE d'un
# statut, jamais son libellé : c'est ce qui permet à un dépôt de nommer sa livraison
# (« Buildé SW », « Déployé », « En ligne ») sans que l'outillage partagé apprenne son
# vocabulaire. Chaque dépôt déclare le sien dans le bloc `socle` de son suivi.json ; sans ce
# bloc, version 0 : repli sur les tables de référence ci-dessous, ANNONCÉ sur la sortie du
# script — jamais décidé en silence.
# `builtSw` n'entre plus dans la décision de clôture : c'est une extension (SOCLE.md §3), et
# rien de partagé ne décide d'après une extension (§5). Mesuré le 07/09/2026 : aucun lot du
# parc, 0 sur 72, ne porte `builtSw` avec un statut non clos — la lecture ne servait plus. Il
# reste AFFICHÉ (« buildé le … »), ce qui est permis : afficher n'est pas dépendre.
$REF_LOT = @{
  'Planifié' = 'ouvert'
  'En cours' = 'en-travail'; 'En PR' = 'en-travail'; 'Mergé' = 'en-travail'
  'Terminé' = 'clos'; 'Buildé SW' = 'clos'; 'Déployé' = 'clos'; 'En ligne' = 'clos'
  'Clos' = 'clos'; 'Fait' = 'clos'
  'Abandonné' = 'hors'
}
$REF_ENTREE = @{
  'À faire' = 'ouvert'
  'En cours' = 'en-travail'; 'En PR' = 'en-travail'
  'Fait' = 'clos'; 'En ligne' = 'clos'
  'Parké' = 'hors'; 'En pause' = 'hors'; 'Abandonné' = 'hors'
}
$ORDRE_ENTREE = @('À faire', 'En cours', 'En PR', 'Fait', 'En ligne', 'Parké', 'En pause', 'Abandonné')
function DeclClasses($obj) {              # bloc socle -> table libellé→classe, ou $null
  if (-not $obj) { return $null }
  $h = @{}
  foreach ($p in $obj.PSObject.Properties) { if ($p.Value) { $h[$p.Name] = [string]$p.Value } }
  if ($h.Count) { return $h } else { return $null }
}
$socle = if ($state.PSObject.Properties['socle']) { $state.socle } else { $null }
$SocleVersion = if ($socle -and $socle.version) { [int]$socle.version } else { 0 }
$CL_LOT = if ($socle) { DeclClasses $socle.statutsLot } else { $null }
$CL_ENTREE = if ($socle) { DeclClasses $socle.statutsEntree } else { $null }
$SocleEtat = if ($CL_LOT -or $CL_ENTREE) { "v$SocleVersion, statuts déclarés" }
             else { 'aucun bloc `socle` (version 0) — repli sur les libellés de référence' }
# Classe d'un statut : la déclaration du dépôt d'abord, puis le libellé de livraison du bloc
# PROJECT ($StageDone), puis la table de référence. Un libellé inconnu rend '' — donc NI clos
# NI hors : un statut qu'on ne sait pas lire laisse le ticket dans l'actionnable, il ne
# disparaît pas. Le repli subsiste sous une déclaration : `estClos` doit continuer à lire
# l'historique et les archives, qui ne seront pas réécrits (SOCLE.md §3).
function ClasseStatut([string]$s, $decl, $ref, [bool]$livraison) {
  if (-not $s) { return '' }
  if ($decl -and $decl.ContainsKey($s)) { return [string]$decl[$s] }
  if ($livraison -and $StageDone -and $s -eq $StageDone) { return 'clos' }
  if ($ref.ContainsKey($s)) { return [string]$ref[$s] }
  return ''
}
function ClasseLot($l) { return (ClasseStatut ([string]$l.status) $CL_LOT $REF_LOT $true) }
function ClasseEntree($e) { return (ClasseStatut ([string]$e.stat) $CL_ENTREE $REF_ENTREE $false) }

# Les statuts d'entrée servis par suivi.md : ceux du dialecte, dans l'ordre de l'échelle, PUIS
# tout libellé réellement présent qui n'y serait pas. Sans ce dernier ajout, un libellé hors
# liste sort du fichier sans un mot — c'est le cas des 29 « En ligne » de Sable, invisibles
# dans un suivi.md engendré par la liste en dur d'avant ATL-044.
# Servir les libellés de TOLÉRANCE (« En ligne », « En pause ») à un dépôt qui ne les déclare
# pas ajouterait deux lignes à zéro dans le tableau de répartition : l'échelle de repli est
# donc celle du §2.1, pas la table de classes, qui est plus large exprès.
$ECHELLE_ENTREE = @('À faire', 'En cours', 'En PR', 'Fait', 'Parké', 'Abandonné')
$STATS = @()
$connus = if ($CL_ENTREE) { @($CL_ENTREE.Keys) } else { $ECHELLE_ENTREE }
foreach ($s in $ORDRE_ENTREE) { if ($connus -contains $s) { $STATS += $s } }
foreach ($s in $connus) { if ($STATS -notcontains $s) { $STATS += $s } }
foreach ($e in $state.entries) {
  $s = [string]$e.stat
  if ($s -and $STATS -notcontains $s) { $STATS += $s }
}
$PRIOS = @('P0', 'P1', 'P2', 'P3')

function PrioRank($p) { [Array]::IndexOf($PRIOS, [string]$p) }
function IdStr($e) { '{0}-{1:000}' -f $Prefix, [int]$e.n }
function CoderLabel($o) {
  if ($o.PSObject.Properties['codedWith'] -and $o.codedWith) { return [string]$o.codedWith }
  return ''
}
# Libellé PR compact : "PR #285 (mergée le 2026-07-09)" / "(ouverte)" / "(fermée sans merge)" — '' si pas de PR
function PrLabel($o) {
  if (-not $o.pr) { return '' }
  $s = 'PR #' + $o.pr
  switch ([string]$o.prState) {
    'merged' { if ($o.merged) { $s += " (mergée le $($o.merged))" } else { $s += ' (mergée)' } }
    'open'   { $s += ' (ouverte)' }
    'closed' { $s += ' (fermée sans merge)' }
  }
  return $s
}

# ---- Projection actionnable : suivi-actif.md — le SEUL fichier de suivi à lire ----
# Contrat (ATL-002) : tickets ouverts en une ligne chacun, lots non clos avec leurs décisions,
# la reprise en tête, les gains mesurés en pied. Aucun ticket Fait, aucune description longue.
# C'est un dérivé, pas une seconde source de vérité.
#
# Budget (ATL-013) : le plafond est celui du FICHIER — $MaxActifBytes — et non un forfait par
# lot, qui laissait la taille croître sans borne avec le nombre de lots ouverts. Ordre de
# service, du jamais coupé au premier sacrifié :
#   1. entête, ligne « Résumé », reprise, liste des tickets ouverts, identité de chaque lot
#      (titre, méta, but) — l'ossature ne se coupe jamais ;
#   2. les DÉCISIONS des lots, part dégressive, le lot en cours servi le premier puis par
#      `order` ; ce qu'un lot ne consomme pas passe au suivant ;
#   3. les GAINS, sur le solde : ce sont des mesures acquises, pas ce qui fait redémarrer.
# Toute omission est annoncée sur place, et la ligne de sortie du script AVERTIT quand le
# plafond mord — sinon la dérive redevient invisible, comme les tailles périmées d'ATL-001.
$UNLIMITED = 1073741824          # budget « sans plafond », borné pour rester en arithmétique 32 bits
# UN LOT OUVERT EST UN LOT NON CLOS (ATL-044) : la question posée ici est la seule qui compte,
# et elle passe par la classe. Un statut vide ou inconnu n'est PAS clos — un lot qu'on ne sait
# pas lire reste visible.
function LotIsClosed($l) { return (ClasseLot $l) -eq 'clos' }
# "37k tokens → 1,2k tokens · mesuré sur PatternStudio" — '' si pas de gain
function GainStr($g) {
  if (-not $g) { return '' }
  $bits = @()
  if ($g.avant) { $bits += [string]$g.avant }
  if ($g.apres) { $bits += [string]$g.apres }
  $s = $bits -join ' → '
  if ($g.note) { if ($s) { $s += ' · ' }; $s += [string]$g.note }
  return $s
}
# "arrêt : … · reste : … · tenté sans succès : …" — '' si pas de reprise
function RepriseStr($r) {
  if (-not $r) { return '' }
  $bits = @()
  if ($r.arret) { $bits += 'arrêt : ' + $r.arret }
  if ($r.reste) { $bits += 'reste : ' + $r.reste }
  if ($r.tente) { $bits += 'tenté sans succès : ' + $r.tente }
  return $bits -join ' · '
}

# ---- Comptage en OCTETS : le plafond est une taille de fichier, pas un nombre de caractères,
# et la prose française coûte deux octets par accent. Le fichier est UTF-8 sans BOM, lignes
# jointes par un saut de ligne : une ligne coûte ses octets, plus un.
function LineBytes([string]$s) { return [Text.Encoding]::UTF8.GetByteCount($s) + 1 }
function BlockBytes($lines) {
  $n = 0
  foreach ($l in $lines) { $n += LineBytes ([string]$l) }
  return $n
}
# Coupe une prose à $max octets sur une frontière de mot, en montrant la coupe.
function ClipBytes([string]$s, [int]$max) {
  $suffix = ' […]'
  $room = $max - [Text.Encoding]::UTF8.GetByteCount($suffix)
  if ($room -le 0) { return '' }
  if ([Text.Encoding]::UTF8.GetByteCount($s) -le $max) { return $s }
  $n = $s.Length
  while ($n -gt 0 -and [Text.Encoding]::UTF8.GetByteCount($s.Substring(0, $n)) -gt $room) { $n-- }
  $t = $s.Substring(0, $n)
  $sp = $t.LastIndexOf(' ')
  if ($sp -gt 40) { $t = $t.Substring(0, $sp) }
  return $t.TrimEnd() + $suffix
}
# Part dégressive : un peu moins du double de la part égale du reste. Le premier servi prend
# la plus grosse part et laisse toujours de quoi servir les suivants ; le dernier prend le solde.
function Share([int]$budget, [int]$rest) {
  if ($rest -le 1) { return $budget }
  return [int][Math]::Floor(2 * $budget / ($rest + 1))
}
# Ligne d'omission d'un lot : combien de décisions manquent, leur poids, et où les lire.
# ATL-023 — la marque « à lire avant de proposer quoi que ce soit sur ce lot ». Elle se pose à la
# main dans `suivi.json` (`"garde": true` sur la décision), et JAMAIS ne se déduit du texte : le
# rang par le texte est mesuré faux, décision n° 1 du lot L-projection. Vérifié le 04/09 en
# exécutant le pipeline du tracker : une clé imbriquée survit à une sauvegarde de `suivi-projet.html`.
function IsGarde($dec) {
  if ($null -eq $dec) { return $false }
  $v = $dec.garde
  return ($v -eq $true -or "$v" -eq 'true' -or "$v" -eq '1')
}

function OmitLine([string]$lotId, [int]$cut, [int]$chars, [bool]$all, [int]$gardes = 0) {
  # ATL-023 — une décision MARQUÉE qui saute quand même doit se voir, sinon la marque ment. Et
  # « plus ancienne(s) » disparaît de la formule : depuis que les marquées passent devant, ce qui
  # saute n'est plus le début du tableau, et l'annoncer ainsi serait faux.
  # Écart relevé le 07/09/2026 (séance ATL-043, lot à 4 marquées) : la ligne COMPTE la marquée
  # écartée sans la NOMMER, alors que la règle 8 du CLAUDE.md écrit « est nommée dans la ligne
  # d'omission ». Le code ou la règle doit céder — ne pas trancher ici sans mesure : c'est le
  # territoire d'ATL-042, qui doit avoir vécu une semaine (règle 1 du dépôt).
  $g = if ($gardes -gt 0) { ', dont {0} MARQUÉE(S) « à lire d''abord »' -f $gardes } else { '' }
  if ($all) {
    return ('- ({0} décision(s) non affichée(s){1}, {2} car. — plafond de fichier atteint ; dans `suivi.json`, lot {3})' -f $cut, $g, $chars, $lotId)
  }
  return ('- ({0} décision(s) non affichée(s){1}, {2} car. — dans `suivi.json`, lot {3})' -f $cut, $g, $chars, $lotId)
}

# ATL-042 — la section des gains, titre et annonces comprises. Une seule fonction pour la
# réserver dans l'ossature et pour l'écrire : réservée d'un côté et rendue de l'autre par deux
# formules différentes, le plafond deviendrait faux au moment précis où il doit tenir.
function GainsTitle([int]$shown, [int]$total) { return ('## Gains mesurés (' + $shown + ' sur ' + $total + ')') }
function GainsOmitLine([int]$n) { return ('_(' + $n + ' gain(s) plus ancien(s) non affiché(s) — dans `suivi.md`.)_') }
function GainsArchLine([int]$n) { return ('_(' + $n + ' gain(s) de lot clos — ils suivent leur lot, dans `suivi.md`.)_') }
function GainsLines($shown, [int]$keep, [int]$total, [int]$arch) {
  # Le second nombre du titre est le total RÉEL, archivés compris : `tools/depots.ps1` le relit
  # (`^##\s+Gains mesurés\s+\((\d+)\s+sur\s+(\d+)\)`) pour compter les gains du parc. N'y mettre
  # que les candidats ferait sous-déclarer la page agrégée de 28 gains sur 32.
  $l = @((GainsTitle $keep ($total + $arch)), '')
  if (-not ($total + $arch)) { $l += '_Aucun gain renseigné — un ticket ne passe pas à `Fait` sans son `gain` : `{ date, avant, apres, note }`._' }
  $l += @(@($shown) | Select-Object -First $keep)
  if ($total -gt $keep) { $l += (GainsOmitLine ($total - $keep)) }
  if ($arch -gt 0) { $l += (GainsArchLine $arch) }
  return @($l)
}
function GainsBytes($shown, [int]$keep, [int]$total, [int]$arch) { return (BlockBytes (GainsLines $shown $keep $total $arch)) }

function Write-SuiviActif([string]$Path) {
  $a = New-Object System.Collections.Generic.List[string]
  # 'Parké' sort de l'actionnable : ce fichier est « l'actionnable seul », et un ticket parqué est
  # par définition ce qui ne l'est pas. Il n'est pas masqué pour autant — il est listé en dessous,
  # avec sa raison dans le ticket. Une liste qui se tait coûte plus cher qu'une liste longue.
  # Cas jamais rencontré avant le 01/09/2026 : aucun ticket n'avait été parqué dans ce dépôt.
  # Les trois listes se décident sur la CLASSE et non sur le libellé (ATL-044). Un statut de
  # clôture propre au dépôt — « En ligne » chez Sable, « Buildé SW » sur un add-in — sortait de
  # l'actionnable seulement là où son libellé était écrit en dur : les 29 entrées « En ligne »
  # de Sable étaient comptées ouvertes.
  $open = @($entries | Where-Object { -not $_.archived -and @('clos', 'hors') -notcontains (ClasseEntree $_) } |
    Sort-Object @{e = { PrioRank $_.prio }}, @{e = { [int]$_.n }})
  $parked = @($entries | Where-Object { -not $_.archived -and (ClasseEntree $_) -eq 'hors' } |
    Sort-Object @{e = { PrioRank $_.prio }}, @{e = { [int]$_.n }})
  $live = @($lots | Where-Object { -not (LotIsClosed $_) } |
    Sort-Object @{e = { if ($_.order) { [int]$_.order } else { 999 } }}, @{e = { [string]$_.id }})
  # « En cours » de la ligne de résumé = la classe `en-travail`, pas le libellé, et pas `branch`
  # non plus : décider d'après une extension est ce que le socle interdit (§5). Un dépôt dont
  # aucun lot n'est en travail affiche « — », ce qui est la vérité de son suivi.
  $cur = @($live | Where-Object { (ClasseLot $_) -eq 'en-travail' })

  $a.Add('# ' + $ProjectName + ' — suivi actif')
  $a.Add('')
  $a.Add('_Dérivé de `suivi.json` le ' + (Get-Date).ToString('dd/MM/yyyy HH:mm') + '. **Ne pas éditer** : régénérer avec `.claude\generate-suivi.ps1`. Pour écrire, ouvrir `suivi.json` par Edit ciblé._')
  $a.Add('')
  # Ligne de résumé au format STRICT : tools/depots.ps1 la relit pour la page agrégée.
  $curId = '—'; $curBranch = '—'
  if ($cur.Count) {
    $curId = [string]$cur[0].id
    if ($cur[0].branch) { $curBranch = [string]$cur[0].branch }
  }
  $a.Add('**Résumé** — ' + $open.Count + ' ouverts · ' + $live.Count + ' lots non clos · en cours : ' + $curId + ' · branche : ' + $curBranch)
  $a.Add('')

  # ---- Reprise : la première chose que lit la session suivante (ATL-004) ----
  # Jamais soumise au budget : sans elle la session repart à zéro, ce qui coûte bien plus
  # cher que le fichier entier.
  $reprises = @($live | Where-Object { $_.reprise })
  if ($reprises.Count) {
    $a.Add('## Reprise'); $a.Add('')
    foreach ($l in $reprises) {
      $d = if ($l.reprise.date) { ' (' + $l.reprise.date + ')' } else { '' }
      $a.Add('- **' + [string]$l.id + '**' + $d + ' — ' + (RepriseStr $l.reprise))
    }
    $a.Add('')
  }

  # ---- Tickets ouverts : une ligne chacun, titre seul ----
  # Non plafonnés : une ligne coûte ~80 octets, et masquer un ticket ouvert c'est le perdre.
  $a.Add('## Tickets ouverts (' + $open.Count + ')'); $a.Add('')
  if (-not $open.Count) { $a.Add('_Aucun._') }
  foreach ($e in $open) {
    $lotTag = if ($e.lot) { ' · ' + [string]$e.lot } else { '' }
    $a.Add('- ' + (IdStr $e) + ' · ' + $e.prio + ' · ' + $e.stat + $lotTag + ' — ' + $e.title)
  }
  $a.Add('')

  # ---- Hors de l'actionnable : jamais silencieux ----
  # La section est décidée par la CLASSE 'hors', pas par un libellé — elle réunit donc « Parké »
  # (en pause, avec condition de réouverture) et « Abandonné » (on ne le fera pas, ATL-080). Ces
  # deux-là ne se lisent pas pareil : le statut est écrit sur chaque ligne, sinon le sous-titre
  # d'avant — « la condition de réouverture est dans le ticket » — devenait faux pour la moitié.
  if ($parked.Count) {
    $a.Add('## Hors de l''actionnable (' + $parked.Count + ')'); $a.Add('')
    $a.Add('_Rien à y faire. **Parké** : en l''état seulement, la condition de réouverture est dans le ticket. **Abandonné** : on ne le fera pas._'); $a.Add('')
    foreach ($e in $parked) {
      $lotTag = if ($e.lot) { ' · ' + [string]$e.lot } else { '' }
      $a.Add('- ' + (IdStr $e) + ' · ' + $e.prio + ' · ' + [string]$e.stat + $lotTag + ' — ' + $e.title)
    }
    $a.Add('')
  }

  # ---- Lots non clos : identité (jamais coupée), puis décisions (au budget) ----
  $a.Add('## Lots non clos (' + $live.Count + ')'); $a.Add('')
  if (-not $live.Count) { $a.Add('_Aucun._'); $a.Add('') }

  # Ordre de service : le lot en cours d'abord, puis l'ordre de `order` déjà appliqué à $live.
  $curIds = @($cur | ForEach-Object { [string]$_.id })
  $ordered = @(@($live | Where-Object { $curIds -contains [string]$_.id }) +
               @($live | Where-Object { $curIds -notcontains [string]$_.id }))
  $blocks = @()
  foreach ($l in $ordered) {
    $head = @()
    $head += ('### ' + [string]$l.id + ' · ' + [string]$l.name)
    $meta = @()
    if ($l.status) { $meta += [string]$l.status }
    if ($l.difficulty) { $meta += [string]$l.difficulty }
    if ($l.branch) { $meta += 'branche `' + $l.branch + '`' }
    $pl = PrLabel $l; if ($pl) { $meta += $pl }
    $meta += '{0} ticket(s) ouvert(s)' -f @($open | Where-Object { [string]$_.lot -eq [string]$l.id }).Count
    $head += ('_' + ($meta -join ' · ') + '_')
    if ($l.goal) { $head += ('But : ' + $l.goal) }
    $blocks += , [pscustomobject]@{
      Id = [string]$l.id; Head = @($head); Decs = @(@($l.decisions) | Where-Object { $_ })
      Keep = @(); Omit = ''; Reserve = 0
    }
  }

  # ---- Ossature : ce qui est déjà écrit, l'identité des lots, la ligne d'omission de chaque
  # lot qui a des décisions — réservée au pire cas, rendue au budget si le lot passe entier —
  # et le titre des gains. Cette ligne-là s'affiche justement quand le plafond mord : l'oublier
  # dans le compte, c'est dépasser le plafond au moment précis où il doit tenir.
  # ATL-042 — UN GAIN SUIT SON LOT. Les décisions d'un lot clos quittent la projection avec lui
  # (LotIsClosed) ; ses gains le suivent, pour la même raison — ce fichier est « l'actionnable
  # seul », et la mesure d'un ticket livré dans un lot clos n'est plus actionnable. Elle reste
  # entière dans `suivi.md`. Un gain SANS lot n'est archivé par aucune clôture : il reste servi.
  $liveIds = @($live | ForEach-Object { [string]$_.id })
  $gAll = @($entries | Where-Object { $_.gain } | Sort-Object @{e = { [string]$_.gain.date }} -Descending)
  $gains = @($gAll | Where-Object { -not $_.lot -or ($liveIds -contains [string]$_.lot) })
  $gArch = $gAll.Count - $gains.Count
  # ATL-042 — PLANCHER, PAS SOLDE. Servis sur le solde, les gains étaient élastiques : ils
  # s'écrêtaient pour remplir TOUT ce qui restait, si bien qu'aucune place rendue par ailleurs
  # (décisions sorties au journal, part d'un lot vide) n'arrivait jamais aux décisions — mesuré
  # le 07/09, les 6 gains affichés étaient les 6 écrêtés. Ils ont donc une allocation fixe,
  # comptée dans l'ossature : deux mesures, écrêtées, et le reste du plafond va aux décisions.
  $GAIN_MAX = 2      # gains servis, les plus récents
  $GAIN_NOTE = 240   # octets de mesure par gain, au plus
  $gShown = @(); $gClipped = 0
  foreach ($e in @($gains | Select-Object -First $GAIN_MAX)) {
    $head = '- ' + (IdStr $e) + ' · ' + [string]$e.gain.date + ' — '
    $note = GainStr $e.gain
    if ((LineBytes $note) -le $GAIN_NOTE) { $gShown += , ($head + $note); continue }
    $gShown += , ($head + (ClipBytes $note $GAIN_NOTE)); $gClipped++
  }
  $fixed = BlockBytes $a
  foreach ($b in $blocks) {
    $fixed += (BlockBytes $b.Head) + 1                             # +1 : ligne vide de fin de bloc
    if ($b.Decs.Count) {
      $tc = (@($b.Decs) | ForEach-Object { ([string]$_.txt).Length } | Measure-Object -Sum).Sum
      # Pire cas : toutes omises, et toutes les marquées du lot comptées dans la mention.
      $gc = @($b.Decs | Where-Object { IsGarde $_ }).Count
      $b.Reserve = [Math]::Max((LineBytes (OmitLine $b.Id $b.Decs.Count $tc $true  $gc)),
                               (LineBytes (OmitLine $b.Id $b.Decs.Count $tc $false $gc)))
      $fixed += $b.Reserve
    }
  }
  # Le plancher des gains est de l'ossature, pas du solde : compté ici, jamais pris aux décisions.
  # Si c'est LUI qui fait déborder, il cède — une fondation du lot en cours passe avant une mesure
  # déjà livrée. On garde donc le plus grand nombre de gains qui tienne, en lâchant par le bas.
  $gKeep = $gShown.Count
  while ($gKeep -gt 0 -and $MaxActifBytes -gt 0 -and ($fixed + (GainsBytes $gShown $gKeep $gains.Count $gArch)) -gt $MaxActifBytes) { $gKeep-- }
  # Un gain lâché ICI, c'est le plafond qui mord — à distinguer de l'écrêtage à 240 o, qui est
  # une politique fixe et n'apprend rien sur la pression. Confondre les deux ferait crier
  # l'avertissement sur un fichier au septième de son plafond, et on cesserait de le lire.
  $gFloorCut = $gShown.Count - $gKeep
  if ($gFloorCut -gt 0) { $gShown = @($gShown | Select-Object -First $gKeep); $gClipped = [Math]::Min($gClipped, $gKeep) }
  $fixed += GainsBytes $gShown $gShown.Count $gains.Count $gArch

  $budget = $UNLIMITED
  $skeletonOver = $false
  if ($MaxActifBytes -gt 0) {
    $budget = [Math]::Max(0, $MaxActifBytes - $fixed)
    $skeletonOver = ($fixed -gt $MaxActifBytes)
  }

  # ---- Décisions : part dégressive, le lot en cours d'abord, le reliquat au suivant ----
  $cutDecs = 0; $cutLots = 0
  # ATL-042 — le dénominateur ne compte que les lots QUI ONT des décisions. Mesuré le 07/09 :
  # `$share` était calculé avant le `continue`, si bien qu'un lot sans aucune décision (L-suivi)
  # emportait un tiers du budget pour rien — et la fondation marquée n° 7 de L-projection sautait
  # au profit de la plus courte décision non marquée du lot. Une part réservée à ce qui ne sera
  # pas servi, c'est du plafond dépensé en silence.
  $rest = @($blocks | Where-Object { $_.Decs.Count }).Count
  foreach ($b in $blocks) {
    if (-not $b.Decs.Count) { continue }
    $share = Share $budget $rest
    $rest--
    # ATL-023 — ORDRE DE SERVICE : les marquées d'abord et LES PLUS ANCIENNES EN TÊTE (ce sont les
    # fondations, celles qu'une séance neuve ignore et doit lire avant de proposer), puis les autres
    # de la plus récente à la plus ancienne. Seule l'ÉVICTION change : l'affichage reste chronologique.
    $idx    = @(0..($b.Decs.Count - 1))
    $gardes = @($idx | Where-Object { IsGarde $b.Decs[$_] })
    $autres = @($idx | Where-Object { -not (IsGarde $b.Decs[$_]) } | Sort-Object -Descending)
    $kept = @{}; $spent = 0; $chars = 0
    foreach ($i in (@($gardes) + @($autres))) {
      $txt = [string]$b.Decs[$i].txt
      $line = '- 📌 ' + $(if ($b.Decs[$i].date) { "$($b.Decs[$i].date) — " }) + $txt
      if ($MaxDecisionChars -gt 0 -and $kept.Count -and ($chars + $txt.Length) -gt $MaxDecisionChars) { break }
      # Trop grosse pour la place qui reste : on tente la suivante au lieu de tout arrêter. L'ordre
      # n'étant plus contigu, s'arrêter ferait perdre des fondations à cause d'une seule décision longue.
      if (($spent + (LineBytes $line)) -gt $share) { continue }
      $spent += LineBytes $line; $chars += $txt.Length
      $kept[$i] = $true
    }
    $keep    = @($idx | Where-Object { $kept.ContainsKey($_) } | ForEach-Object { $b.Decs[$_] })
    $cutIdx  = @($idx | Where-Object { -not $kept.ContainsKey($_) })
    $cut = $cutIdx.Count
    $b.Keep = $keep
    $budget -= $spent
    if ($cut -gt 0) {
      $om   = (@($cutIdx | ForEach-Object { ([string]$b.Decs[$_].txt).Length }) | Measure-Object -Sum).Sum
      $cutG = @($cutIdx | Where-Object { IsGarde $b.Decs[$_] }).Count
      $b.Omit = OmitLine $b.Id $cut $om ($keep.Count -eq 0) $cutG
      $budget += $b.Reserve - (LineBytes $b.Omit)   # la ligne réelle est plus courte que la réserve
      $cutDecs += $cut; $cutLots++
    } else {
      $budget += $b.Reserve                          # rien d'omis : la réserve va aux lots suivants
    }
  }

  foreach ($b in $blocks) {
    foreach ($h in $b.Head) { $a.Add($h) }
    if ($b.Omit) { $a.Add($b.Omit) }
    foreach ($dec in $b.Keep) {
      $a.Add('- 📌 ' + $(if ($dec.date) { "$($dec.date) — " }) + $dec.txt)
    }
    $a.Add('')
  }

  # ---- Gains mesurés : ce que les tickets livrés ont rapporté (ATL-010) ----
  # Choisis et écrêtés PLUS HAUT, sur un plancher réservé dans l'ossature (ATL-042) : ici on ne
  # fait plus que rendre, par la même fonction que celle qui les a réservés. Les annonces sont en
  # italique et pas en « - » : tools/depots.ps1 ne collecte que les lignes « - ».
  $gCut = $gains.Count - $gShown.Count
  foreach ($l in (GainsLines $gShown $gShown.Count $gains.Count $gArch)) { $a.Add($l) }

  [IO.File]::WriteAllText($Path, (($a -join "`n").TrimEnd() + "`n"), (New-Object System.Text.UTF8Encoding($false)))
  return @{
    Open = $open.Count; Lots = $live.Count; Size = (Get-Item $Path).Length
    Cap = $MaxActifBytes; Fixed = $fixed; Skeleton = $skeletonOver
    CutDecisions = $cutDecs; CutLots = $cutLots; CutGains = $gCut; ClippedGains = $gClipped
    FloorCutGains = $gFloorCut; LiveGains = $gains.Count; ArchGains = $gArch
  }
}

$entries = @($state.entries)
$lots = @(); if ($state.lots) { $lots = @($state.lots) }
$out = New-Object System.Collections.Generic.List[string]

$out.Add('# Suivi ' + $ProjectName); $out.Add('')
$out.Add('_Généré le ' + (Get-Date).ToString('dd/MM/yyyy HH:mm:ss') + ' par `.claude\generate-suivi.ps1`. Source de vérité : `suivi.json` — ne pas éditer ce .md à la main._'); $out.Add('')
$out.Add('_Convention : au terme du code, chaque IA renseigne `codedWith` sur chaque ticket avec son nom exact avant tout passage à `Fait`._'); $out.Add('')

# ---- Résumé ----
$out.Add('## Résumé'); $out.Add('')
$out.Add('| Statut | P0 | P1 | P2 | P3 | Total |'); $out.Add('|---|---:|---:|---:|---:|---:|')
foreach ($s in $STATS) {
  $rows = @($entries | Where-Object { $_.stat -eq $s })
  $c = foreach ($p in $PRIOS) { @($rows | Where-Object { $_.prio -eq $p }).Count }
  $out.Add("| $s | $($c[0]) | $($c[1]) | $($c[2]) | $($c[3]) | $($rows.Count) |")
}
$t = foreach ($p in $PRIOS) { @($entries | Where-Object { $_.prio -eq $p }).Count }
$out.Add("| **Total** | $($t[0]) | $($t[1]) | $($t[2]) | $($t[3]) | **$($entries.Count)** |"); $out.Add('')

# ---- Par lot ----
$out.Add('## Par lot'); $out.Add('')
$groups = @()
foreach ($l in $lots) { $groups += , @{ key = [string]$l.id; name = [string]$l.name; lot = $l } }
$groups += , @{ key = ''; name = 'Sans lot (backlog non planifié)'; lot = $null }
foreach ($g in $groups) {
  $rows = @($entries | Where-Object { [string]$_.lot -eq $g.key } |
    Sort-Object @{e = { PrioRank $_.prio }}, @{e = { [int]$_.n }})
  if (-not $rows.Count) { continue }
  $out.Add("### $($g.name) — $($rows.Count)")
  if ($g.lot) {
    if ($g.lot.goal) { $out.Add("_Objectif : $($g.lot.goal)_") }
    $meta = @()
    if ($g.lot.status) { $meta += "statut : $($g.lot.status)" }
    $pl = PrLabel $g.lot; if ($pl) { $meta += $pl }
    if ($g.lot.branch) { $meta += 'branche `' + $g.lot.branch + '`' }
    if ($g.lot.builtSw) { $meta += "$Participle le $($g.lot.builtSw)" }
    if ($meta.Count) { $out.Add('_' + ($meta -join ' · ') + '_') }
    if ($g.lot.reprise) { $out.Add('> ↩ **Reprise** ' + $(if ($g.lot.reprise.date) { $g.lot.reprise.date + ' — ' }) + (RepriseStr $g.lot.reprise)) }
    foreach ($dec in @($g.lot.decisions)) {
      if ($dec) { $out.Add('> 📌 ' + $(if ($dec.date) { "$($dec.date) — " }) + $dec.txt) }
    }
  }
  foreach ($e in $rows) {
    $line = "- $(IdStr $e) · $($e.prio) · **$($e.stat)** · _$($e.type)_ — $($e.title)"
    $coder = CoderLabel $e; if ($coder) { $line += " · Codé avec **$coder**" }
    $pl = PrLabel $e; if ($pl) { $line += " · $pl" }
    $out.Add($line)
  }
  $out.Add('')
}

# ---- Détail par statut ----
$out.Add('## Détail par statut'); $out.Add('')
foreach ($s in $STATS) {
  $rows = @($entries | Where-Object { $_.stat -eq $s } |
    Sort-Object @{e = { PrioRank $_.prio }}, @{e = { [int]$_.n }})
  if (-not $rows.Count) { continue }
  $out.Add("### $s ($($rows.Count))"); $out.Add('')
  foreach ($e in $rows) {
    $out.Add("#### $(IdStr $e) · $($e.type) · $($e.prio) · $($e.dom)")
    $out.Add("**$($e.title)**"); $out.Add('')
    if ($e.desc) { $out.Add([string]$e.desc); $out.Add('') }
    if ($e.gain) { $out.Add('> 💰 **Gain** ' + $(if ($e.gain.date) { $e.gain.date + ' — ' }) + (GainStr $e.gain)); $out.Add('') }
    $i = 0
    foreach ($c in @($e.captures)) {
      if ($c -and $c.file) { $i++; $out.Add("![$(IdStr $e) capture $i]($($c.file))"); $out.Add('') }
    }
    $sub = "créé le $($e.created)"
    if ($e.updated -and $e.updated -ne $e.created) { $sub += " · maj $($e.updated)" }
    $coder = CoderLabel $e; if ($coder) { $sub += " · Codé avec $coder" }
    $pl = PrLabel $e; if ($pl) { $sub += " · $pl" }
    if ($e.branch) { $sub += ' · branche `' + $e.branch + '`' }
    if ($e.builtSw) { $sub += " · $Participle le $($e.builtSw)" }
    $out.Add("<sub>$sub</sub>"); $out.Add('')
  }
}


[IO.File]::WriteAllText($MdPath, ($out -join "`n"), (New-Object System.Text.UTF8Encoding($false)))
$act = Write-SuiviActif $ActifPath
Write-Host ("suivi.md régénéré — {0} entrées, {1} lot(s). Projet : {2}." -f $entries.Count, $lots.Count, $ProjectName)
# Le repli sur les libellés de référence se DIT (SOCLE.md §4) : sans cette ligne, un dépôt sans
# bloc `socle` serait lu au dialecte d'un autre sans que rien ne le signale.
Write-Host ("Socle : {0}." -f $SocleEtat)
$msg = "suivi-actif.md — {0} ticket(s) ouvert(s), {1} lot(s) non clos, {2} octets" -f $act.Open, $act.Lots, $act.Size
if ($act.Cap -gt 0) { $msg += " (plafond {0})" -f $act.Cap }
# L'écrêtage se dit ici, en information, et non dans l'avertissement du plafond.
$msg += " — gains : {0} servi(s) sur {1} candidat(s), {2} de lot clos" -f ($act.LiveGains - $act.CutGains), $act.LiveGains, $act.ArchGains
if ($act.ClippedGains) { $msg += ", {0} écrêté(s) à 240 o" -f $act.ClippedGains }
Write-Host ($msg + ".")
# Le plafond ne mord JAMAIS en silence (ATL-013) : une projection qui rétrécit sans le dire,
# c'est la dérive d'ATL-001 qui recommence.
if ($act.Skeleton) {
  Write-Warning ("Plafond {0} o dépassé par la seule ossature ({1} o : {2} ticket(s) ouvert(s) + {3} identité(s) de lot). Aucune décision ni gain affiché : clore des lots ou des tickets, pas baisser le plafond." -f $act.Cap, $act.Fixed, $act.Open, $act.Lots)
} elseif ($act.CutDecisions -or $act.FloorCutGains) {
  # ATL-042 — seuls le plafond QUI MORD s'avertit : une décision écartée, ou un gain lâché par
  # cession du plancher. L'écrêtage d'une note de gain à 240 o est une politique fixe, il ne dit
  # rien de la pression : avertir dessus faisait crier le générateur sur un fichier au septième
  # de son plafond, et un avertissement qui crie toujours cesse d'être lu.
  $bits = @()
  if ($act.CutDecisions) { $bits += "{0} décision(s) écartée(s) sur {1} lot(s)" -f $act.CutDecisions, $act.CutLots }
  if ($act.FloorCutGains) { $bits += "{0} gain(s) lâché(s) par cession du plancher" -f $act.FloorCutGains }
  Write-Warning ("Plafond {0} o atteint — {1}. Rien n'est perdu (suivi.json), mais la réponse est de clore des lots ou d'en sortir les décisions-journal." -f $act.Cap, ($bits -join ", "))
}
