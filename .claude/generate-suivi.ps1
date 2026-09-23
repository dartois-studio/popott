# Régénère suivi.md, suivi-actif.md (le sommaire) et lots\<ID>.md (une page par lot non clos)
# depuis suivi.json (source de vérité).
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
  [int]$MaxActifBytes = 8192        # 0 = illimité. Garde-fou du sommaire suivi-actif.md (ATL-013) :
                                    # depuis ATL-162 il ne coupe plus rien, il AVERTIT.
)
$ErrorActionPreference = 'Stop'
if (-not $MdPath) { $MdPath = Join-Path (Split-Path $JsonPath) 'suivi.md' }
$ActifPath = Join-Path (Split-Path $JsonPath) 'suivi-actif.md'
$LotsDir = Join-Path (Split-Path $JsonPath) 'lots'

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
# ATL-161 — le modèle derrière l'outil ; facultatif, '' si absent.
function ModelLabel($o) {
  if ($o.PSObject.Properties['model'] -and $o.model) { return [string]$o.model }
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

# ---- Projections actionnables : deux niveaux (ATL-162) ----------------------------------------
# Fondement : audits/2026-09-23-poids-du-suivi-actif.md (Atelier). Une page unique pour tous les
# lots obligeait à arbitrer un budget entre eux — réglé six fois : ATL-013, 023, 042, 056, 160,
# 162 — alors qu'une séance couvre UN lot (règle 1), et 3 fois sur 4 sait lequel en ouvrant.
#   1. suivi-actif.md, le SOMMAIRE : la ligne « Résumé », la première phrase de chaque reprise,
#      une ligne par lot non clos, les tickets SANS lot en entier, les autres comptés par lot.
#      Aucune décision. C'est ce que lisent une séance ouverte et `tools/depots.ps1`.
#   2. .claude\lots\<ID>.md, une PAGE PAR LOT non clos : reprise entière, but, tickets, TOUTES
#      les décisions (les marquées en tête), gains du lot. Rien n'y est coupé : un lot se borne
#      lui-même. La page d'un lot clos est supprimée — sinon une séance reprend un lot fini.
# Ce sont des dérivés, pas une seconde source de vérité. Le plafond $MaxActifBytes ne coupe plus
# rien : il reste un garde-fou du sommaire, qui AVERTIT s'il est franchi (ATL-013 : une
# projection qui grossit sans le dire, c'est la dérive d'ATL-001).
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
# "arrêt : … · reste : … · tenté sans succès : …" — '' si pas de reprise. Sert à suivi.md.
function RepriseStr($r) {
  if (-not $r) { return '' }
  $bits = @()
  if ($r.arret) { $bits += 'arrêt : ' + $r.arret }
  if ($r.reste) { $bits += 'reste : ' + $r.reste }
  if ($r.tente) { $bits += 'tenté sans succès : ' + $r.tente }
  return $bits -join ' · '
}

# ---- Comptage en OCTETS : la prose française coûte deux octets par accent. Le fichier est
# UTF-8 sans BOM, lignes jointes par un saut de ligne : une ligne coûte ses octets, plus un.
function LineBytes([string]$s) { return [Text.Encoding]::UTF8.GetByteCount($s) + 1 }
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
# Première phrase d'une prose : jusqu'au premier . ! ? suivi d'un blanc ou de la fin — un point
# dans un nom de fichier (`generate-suivi.ps1`) n'en est donc pas un. Bornée à $max octets : une
# « phrase » de reprise peut courir sur 300 caractères.
function FirstSentence([string]$s, [int]$max) {
  if (-not $s) { return '' }
  $m = [regex]::Match($s, '^.+?[.!?](?=\s|$)')
  $t = if ($m.Success) { $m.Value } else { $s }
  return (ClipBytes $t $max)
}
# ATL-023 — la marque « à lire avant de proposer quoi que ce soit sur ce lot ». Elle se pose à la
# main dans `suivi.json` (`"garde": true` sur la décision), et JAMAIS ne se déduit du texte : le
# rang par le texte est mesuré faux, décision n° 1 du lot L-projection. Depuis ATL-162 elle ne
# protège plus d'une éviction — rien n'est évincé d'une page de lot — elle ORDONNE : en tête.
function IsGarde($dec) {
  if ($null -eq $dec) { return $false }
  $v = $dec.garde
  return ($v -eq $true -or "$v" -eq 'true' -or "$v" -eq '1')
}
# Nom de fichier d'une page de lot : l'id, débarrassé de ce que Windows refuse dans un nom.
function LotFile([string]$id) { return (($id -replace '[\\/:*?"<>|\s]', '_') + '.md') }
function LotRel([string]$id) { return ('.claude/lots/' + (LotFile $id)) }
# Signature d'une page de lot, dans sa ligne d'en-tête : c'est elle, et elle seule, qui autorise
# le générateur à supprimer un fichier de .claude\lots\ — jamais un fichier posé là à la main.
$LOT_MARK = 'page de lot dérivée de `suivi.json`'
function TicketLine($e) {
  $lotTag = if ($e.lot) { ' · ' + [string]$e.lot } else { '' }
  return ('- ' + (IdStr $e) + ' · ' + $e.prio + ' · ' + [string]$e.stat + $lotTag + ' — ' + $e.title)
}
function DecisionLine($dec, [bool]$mark) {
  $m = if ($mark) { '**à lire d''abord** · ' } else { '' }
  return ('- 📌 ' + $m + $(if ($dec.date) { "$($dec.date) — " }) + [string]$dec.txt)
}
function Utf8Write([string]$Path, $lines) {
  [IO.File]::WriteAllText($Path, (($lines -join "`n").TrimEnd() + "`n"), (New-Object System.Text.UTF8Encoding($false)))
}

# ---- Niveau 1 : le sommaire ----
function Write-SuiviActif([string]$Path, $open, $parked, $live) {
  $a = New-Object System.Collections.Generic.List[string]
  $liveIds = @($live | ForEach-Object { [string]$_.id })
  # Un ticket dont le lot n'est pas (ou plus) non clos n'a pas de page : il reste listé ici en
  # entier. Masquer un ticket ouvert, c'est le perdre.
  $homeOpen = @($open | Where-Object { -not $_.lot -or ($liveIds -notcontains [string]$_.lot) })
  $homePark = @($parked | Where-Object { -not $_.lot -or ($liveIds -notcontains [string]$_.lot) })
  # « En cours » de la ligne de résumé = la classe `en-travail`, pas le libellé, et pas `branch`
  # non plus : décider d'après une extension est ce que le socle interdit (§5). Un dépôt dont
  # aucun lot n'est en travail affiche « — », ce qui est la vérité de son suivi.
  $cur = @($live | Where-Object { (ClasseLot $_) -eq 'en-travail' })

  $a.Add('# ' + $ProjectName + ' — suivi actif')
  $a.Add('')
  $a.Add('_Sommaire dérivé de `suivi.json` le ' + (Get-Date).ToString('dd/MM/yyyy HH:mm') + '. **Ne pas éditer** (`.claude\generate-suivi.ps1`). Un lot se travaille sur sa page `.claude/lots/<ID>.md` ; on écrit dans `suivi.json`._')
  $a.Add('')
  # Ligne de résumé au format STRICT : tools/depots.ps1 la relit pour la page agrégée.
  $curId = '—'; $curBranch = '—'
  if ($cur.Count) {
    $curId = [string]$cur[0].id
    if ($cur[0].branch) { $curBranch = [string]$cur[0].branch }
  }
  $a.Add('**Résumé** — ' + $open.Count + ' ouverts · ' + $live.Count + ' lots non clos · en cours : ' + $curId + ' · branche : ' + $curBranch)
  $a.Add('')

  # ---- Reprise : la première phrase de l'arrêt, et la page où lire le reste (ATL-004) ----
  # Une ligne « - » par lot : tools/depots.ps1 les recopie dans « Points d'arrêt à reprendre ».
  $reprises = @($live | Where-Object { $_.reprise })
  if ($reprises.Count) {
    $a.Add('## Reprise'); $a.Add('')
    foreach ($l in $reprises) {
      $d = if ($l.reprise.date) { ' (' + $l.reprise.date + ')' } else { '' }
      $s = FirstSentence ([string]$l.reprise.arret) 160
      if (-not $s) { $s = FirstSentence ([string]$l.reprise.reste) 160 }
      $a.Add('- **' + [string]$l.id + '**' + $d + ' — ' + $s + ' → `' + (LotRel ([string]$l.id)) + '`')
    }
    $a.Add('')
  }

  # ---- Lots non clos : une ligne chacun ----
  # Le chemin de la page n'est pas répété ligne à ligne : l'en-tête en donne la règle, et seule la
  # section Reprise le cite, parce que c'est là qu'une séance cherche quoi ouvrir.
  # « au travail » : le lot est en classe en-travail, OU un de ses tickets l'est, OU il porte une
  # reprise — un point d'arrêt fait un lot démarré, quel que soit son statut (décision du lot
  # L-lots-en-attente, 23/09/2026 : l'étiquette du lot n'est pas tenue à jour). Sinon « en attente ».
  $a.Add('## Lots non clos (' + $live.Count + ')'); $a.Add('')
  if (-not $live.Count) { $a.Add('_Aucun._') }
  foreach ($l in $live) {
    $id = [string]$l.id
    $nOpen = @($open | Where-Object { [string]$_.lot -eq $id }).Count
    $busy = ((ClasseLot $l) -eq 'en-travail') -or [bool]$l.reprise -or
            [bool]@($entries | Where-Object { [string]$_.lot -eq $id -and (ClasseEntree $_) -eq 'en-travail' }).Count
    # Parenthèses obligatoires : la virgule lie avant le +, et `'**' + $id + '**', $nom` colle
    # le nom au premier élément au lieu d'en faire un second.
    $bits = @(('**' + $id + '**'), [string]$l.name)
    if ($l.status) { $bits += [string]$l.status }
    $bits += $(if ($busy) { 'au travail' } else { 'en attente' })
    $bits += ('{0} ticket(s) ouvert(s)' -f $nOpen)
    if ($l.reprise -and $l.reprise.date) { $bits += ('reprise du ' + [string]$l.reprise.date) }
    $a.Add('- ' + ($bits -join ' · '))
  }
  $a.Add('')

  # ---- Tickets ouverts : ceux sans lot en entier, les autres comptés dans leur page ----
  # Les lignes de compte sont en italique : tools/depots.ps1 ne collecte que les lignes « - ».
  $a.Add('## Tickets ouverts (' + $open.Count + ')'); $a.Add('')
  if (-not $open.Count) { $a.Add('_Aucun._') }
  foreach ($e in $homeOpen) { $a.Add((TicketLine $e)) }
  foreach ($l in $live) {
    $n = @($open | Where-Object { [string]$_.lot -eq [string]$l.id }).Count
    if ($n) { $a.Add('_+ ' + $n + ' ticket(s) de ' + [string]$l.id + ' — dans sa page._') }
  }
  $a.Add('')

  # ---- Hors de l'actionnable : jamais silencieux ----
  # La section est décidée par la CLASSE 'hors', pas par un libellé — elle réunit « Parké » (en
  # pause, avec condition de réouverture) et « Abandonné » (on ne le fera pas, ATL-080).
  if ($parked.Count) {
    $a.Add('## Hors de l''actionnable (' + $parked.Count + ')'); $a.Add('')
    $a.Add('_Rien à y faire. **Parké** : en l''état seulement, la condition de réouverture est dans le ticket. **Abandonné** : on ne le fera pas._'); $a.Add('')
    foreach ($e in $homePark) { $a.Add((TicketLine $e)) }
    foreach ($l in $live) {
      $n = @($parked | Where-Object { [string]$_.lot -eq [string]$l.id }).Count
      if ($n) { $a.Add('_+ ' + $n + ' de ' + [string]$l.id + ' — dans sa page._') }
    }
    $a.Add('')
  }

  # ---- Gains mesurés : seulement ceux qui n'ont pas d'autre maison (ATL-010, ATL-042) ----
  # UN GAIN SUIT SON LOT : celui d'un lot non clos est dans la page du lot, celui d'un lot clos
  # dans `suivi.md`. Reste ici le gain SANS lot, qu'aucune page ne porte. Le second nombre du
  # titre est le total RÉEL : `tools/depots.ps1` le relit pour compter les gains du parc.
  $gAll = @($entries | Where-Object { $_.gain } | Sort-Object @{e = { [string]$_.gain.date }} -Descending)
  $gHome = @($gAll | Where-Object { -not $_.lot })
  $gLive = @($gAll | Where-Object { $_.lot -and ($liveIds -contains [string]$_.lot) }).Count
  $gArch = $gAll.Count - $gHome.Count - $gLive
  $GAIN_MAX = 2; $GAIN_NOTE = 160
  $gShown = @($gHome | Select-Object -First $GAIN_MAX)
  $a.Add('## Gains mesurés (' + $gShown.Count + ' sur ' + $gAll.Count + ')'); $a.Add('')
  if (-not $gAll.Count) { $a.Add('_Aucun gain renseigné — un ticket ne passe pas à `Fait` sans son `gain` : `{ date, avant, apres, note }`._') }
  foreach ($e in $gShown) { $a.Add('- ' + (IdStr $e) + ' · ' + [string]$e.gain.date + ' — ' + (ClipBytes (GainStr $e.gain) $GAIN_NOTE)) }
  if ($gHome.Count -gt $gShown.Count) { $a.Add('_(' + ($gHome.Count - $gShown.Count) + ' gain(s) sans lot plus ancien(s) — dans `suivi.md`.)_') }
  if ($gLive) { $a.Add('_(' + $gLive + ' gain(s) de lot non clos — dans la page de leur lot.)_') }
  if ($gArch) { $a.Add('_(' + $gArch + ' gain(s) de lot clos — ils suivent leur lot, dans `suivi.md`.)_') }

  Utf8Write $Path $a
  return @{ Open = $open.Count; Lots = $live.Count; Size = (Get-Item $Path).Length; Cap = $MaxActifBytes }
}

# ---- Niveau 2 : une page par lot non clos ----
function Write-LotPage([string]$Path, $l, $open, $parked) {
  $id = [string]$l.id
  $p = New-Object System.Collections.Generic.List[string]
  $p.Add('# ' + $id + ' · ' + [string]$l.name)
  $p.Add('')
  $p.Add('_' + $ProjectName + ' — ' + $LOT_MARK + ' le ' + (Get-Date).ToString('dd/MM/yyyy HH:mm') + '. **Ne pas éditer** : régénérer avec `.claude\generate-suivi.ps1`. Les autres lots : `.claude/suivi-actif.md`._')
  $p.Add('')
  $lotOpen = @($open | Where-Object { [string]$_.lot -eq $id })
  $lotPark = @($parked | Where-Object { [string]$_.lot -eq $id })
  $lotDone = @($entries | Where-Object { [string]$_.lot -eq $id -and (ClasseEntree $_) -eq 'clos' } |
    Sort-Object @{e = { [int]$_.n }})
  $meta = @()
  if ($l.status) { $meta += [string]$l.status }
  if ($l.difficulty) { $meta += [string]$l.difficulty }
  if ($l.branch) { $meta += 'branche `' + $l.branch + '`' }
  $pl = PrLabel $l; if ($pl) { $meta += $pl }
  if ($l.builtSw) { $meta += "$Participle le $($l.builtSw)" }
  $meta += '{0} ticket(s) ouvert(s)' -f $lotOpen.Count
  $p.Add('_' + ($meta -join ' · ') + '_'); $p.Add('')

  # La reprise ENTIÈRE : c'est ce que la séance vient chercher (ATL-004), rien n'en est coupé.
  if ($l.reprise) {
    $d = if ($l.reprise.date) { ' (' + $l.reprise.date + ')' } else { '' }
    $p.Add('## Reprise' + $d); $p.Add('')
    if ($l.reprise.arret) { $p.Add('- **Arrêt** — ' + [string]$l.reprise.arret) }
    if ($l.reprise.reste) { $p.Add('- **Reste** — ' + [string]$l.reprise.reste) }
    if ($l.reprise.tente) { $p.Add('- **Tenté sans succès** — ' + [string]$l.reprise.tente) }
    $p.Add('')
  }
  if ($l.goal) { $p.Add('## But'); $p.Add(''); $p.Add([string]$l.goal); $p.Add('') }

  $p.Add('## Tickets ouverts (' + $lotOpen.Count + ')'); $p.Add('')
  if (-not $lotOpen.Count) { $p.Add('_Aucun._') }
  foreach ($e in $lotOpen) { $p.Add((TicketLine $e)) }
  $p.Add('')
  if ($lotPark.Count) {
    $p.Add('## Hors de l''actionnable (' + $lotPark.Count + ')'); $p.Add('')
    foreach ($e in $lotPark) { $p.Add((TicketLine $e)) }
    $p.Add('')
  }
  if ($lotDone.Count) {
    $p.Add('## Livrés (' + $lotDone.Count + ')'); $p.Add('')
    foreach ($e in $lotDone) { $p.Add('- ' + (IdStr $e) + ' · ' + [string]$e.stat + ' — ' + $e.title) }
    $p.Add('')
  }

  # TOUTES les décisions (règle 8 : les relire avant de proposer une approche). Les marquées en
  # tête, les plus anciennes d'abord — ce sont les fondations ; puis les autres, chronologiques.
  $decs = @(@($l.decisions) | Where-Object { $_ })
  $p.Add('## Décisions (' + $decs.Count + ')'); $p.Add('')
  if (-not $decs.Count) { $p.Add('_Aucune._') }
  foreach ($dec in @($decs | Where-Object { IsGarde $_ })) { $p.Add((DecisionLine $dec $true)) }
  foreach ($dec in @($decs | Where-Object { -not (IsGarde $_) })) { $p.Add((DecisionLine $dec $false)) }
  $p.Add('')

  $lotGains = @($entries | Where-Object { [string]$_.lot -eq $id -and $_.gain } |
    Sort-Object @{e = { [string]$_.gain.date }} -Descending)
  if ($lotGains.Count) {
    $p.Add('## Gains mesurés (' + $lotGains.Count + ')'); $p.Add('')
    foreach ($e in $lotGains) { $p.Add('- ' + (IdStr $e) + ' · ' + [string]$e.gain.date + ' — ' + (GainStr $e.gain)) }
  }
  Utf8Write $Path $p
}

function Write-LotPages([string]$Dir, $open, $parked, $live) {
  if ($live.Count -and -not (Test-Path $Dir)) { New-Item -ItemType Directory -Path $Dir | Out-Null }
  $names = @(); $sizes = @()
  foreach ($l in $live) {
    $f = LotFile ([string]$l.id)
    $names += $f
    $path = Join-Path $Dir $f
    Write-LotPage $path $l $open $parked
    $sizes += (Get-Item $path).Length
  }
  # Une page de lot clos se supprime : lue par une séance, elle ferait reprendre un lot fini. Seule
  # une page qui porte la signature du générateur est supprimée.
  $removed = @()
  if (Test-Path $Dir) {
    foreach ($f in @(Get-ChildItem -Path $Dir -Filter '*.md' -File)) {
      if ($names -contains $f.Name) { continue }
      $txt = [IO.File]::ReadAllText($f.FullName)
      if ($txt.Substring(0, [Math]::Min(600, $txt.Length)).Contains($LOT_MARK)) {
        Remove-Item -LiteralPath $f.FullName -Force; $removed += $f.Name
      }
    }
  }
  $max = if ($sizes.Count) { ($sizes | Measure-Object -Maximum).Maximum } else { 0 }
  return @{ Pages = $names.Count; Max = [int]$max; Removed = $removed }
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
    $model = ModelLabel $e; if ($model) { $line += " · Modèle **$model**" }
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
    $model = ModelLabel $e; if ($model) { $sub += " · Modèle $model" }
    $pl = PrLabel $e; if ($pl) { $sub += " · $pl" }
    if ($e.branch) { $sub += ' · branche `' + $e.branch + '`' }
    if ($e.builtSw) { $sub += " · $Participle le $($e.builtSw)" }
    $out.Add("<sub>$sub</sub>"); $out.Add('')
  }
}


[IO.File]::WriteAllText($MdPath, ($out -join "`n"), (New-Object System.Text.UTF8Encoding($false)))

# Les trois listes se décident sur la CLASSE et non sur le libellé (ATL-044). Un statut de
# clôture propre au dépôt — « En ligne » chez Sable, « Buildé SW » sur un add-in — sortait de
# l'actionnable seulement là où son libellé était écrit en dur. 'hors' (Parké, Abandonné) n'est
# pas masqué pour autant : listé à part, avec sa raison dans le ticket.
$open = @($entries | Where-Object { -not $_.archived -and @('clos', 'hors') -notcontains (ClasseEntree $_) } |
  Sort-Object @{e = { PrioRank $_.prio }}, @{e = { [int]$_.n }})
$parked = @($entries | Where-Object { -not $_.archived -and (ClasseEntree $_) -eq 'hors' } |
  Sort-Object @{e = { PrioRank $_.prio }}, @{e = { [int]$_.n }})
$live = @($lots | Where-Object { -not (LotIsClosed $_) } |
  Sort-Object @{e = { if ($_.order) { [int]$_.order } else { 999 } }}, @{e = { [string]$_.id }})
$act = Write-SuiviActif $ActifPath $open $parked $live
$pages = Write-LotPages $LotsDir $open $parked $live

Write-Host ("suivi.md régénéré — {0} entrées, {1} lot(s). Projet : {2}." -f $entries.Count, $lots.Count, $ProjectName)
# Le repli sur les libellés de référence se DIT (SOCLE.md §4) : sans cette ligne, un dépôt sans
# bloc `socle` serait lu au dialecte d'un autre sans que rien ne le signale.
Write-Host ("Socle : {0}." -f $SocleEtat)
$msg = "suivi-actif.md (sommaire) — {0} ticket(s) ouvert(s), {1} lot(s) non clos, {2} octets" -f $act.Open, $act.Lots, $act.Size
if ($act.Cap -gt 0) { $msg += " (plafond {0})" -f $act.Cap }
Write-Host ($msg + ".")
$msg = "lots\ — {0} page(s) de lot, la plus lourde {1} octets" -f $pages.Pages, $pages.Max
if ($pages.Removed.Count) { $msg += " ; supprimée(s), lot clos : {0}" -f ($pages.Removed -join ', ') }
Write-Host ($msg + ".")
# Le plafond ne coupe plus rien (ATL-162) mais ne se franchit JAMAIS en silence (ATL-013). Le
# sommaire ne grossit qu'avec les lots non clos et les tickets sans lot : c'est à eux de répondre.
if ($act.Cap -gt 0 -and $act.Size -gt $act.Cap) {
  Write-Warning ("Sommaire au-dessus du plafond : {0} o pour {1}. Rien n'est coupé ; la réponse est de clore des lots, ou de ranger les tickets sans lot dans un lot." -f $act.Size, $act.Cap)
}
