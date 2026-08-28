# Régénère suivi.md depuis suivi.json (source de vérité).
# Usage : powershell -ExecutionPolicy Bypass -File .claude\generate-suivi.ps1
# Même format que le buildMarkdown de suivi-projet.html, enrichi des champs PR/lot/codedWith.
#
# Nom du projet, préfixe des tickets et vocabulaire de livraison sont lus dans le bloc
# CONFIG (const PROJECT = { ... }) du suivi-projet*.html voisin : une seule source de vérité.
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
$STATS = @('À faire', 'En cours', 'En PR', 'Fait', 'Parké')
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
$DONE_LABELS = @('Terminé', 'Buildé SW', 'Déployé', 'Fait', 'Clos')
$UNLIMITED = 1073741824          # budget « sans plafond », borné pour rester en arithmétique 32 bits
function LotIsClosed($l) {
  if ($l.builtSw) { return $true }
  $s = [string]$l.status
  if (-not $s) { return $false }
  if ($StageDone -and $s -eq $StageDone) { return $true }
  return ($DONE_LABELS -contains $s)
}
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
function OmitLine([string]$lotId, [int]$cut, [int]$chars, [bool]$all) {
  if ($all) {
    return ('- ({0} décision(s) non affichée(s), {1} car. — plafond de fichier atteint ; dans `suivi.json`, lot {2})' -f $cut, $chars, $lotId)
  }
  return ('- ({0} décision(s) plus ancienne(s) non affichée(s), {1} car. — dans `suivi.json`, lot {2})' -f $cut, $chars, $lotId)
}

function Write-SuiviActif([string]$Path) {
  $a = New-Object System.Collections.Generic.List[string]
  $open = @($entries | Where-Object { -not $_.archived -and [string]$_.stat -ne 'Fait' } |
    Sort-Object @{e = { PrioRank $_.prio }}, @{e = { [int]$_.n }})
  $live = @($lots | Where-Object { -not (LotIsClosed $_) } |
    Sort-Object @{e = { if ($_.order) { [int]$_.order } else { 999 } }}, @{e = { [string]$_.id }})
  $cur = @($live | Where-Object { [string]$_.status -eq 'En cours' -or $_.branch })

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
  $gains = @($entries | Where-Object { $_.gain } | Sort-Object @{e = { [string]$_.gain.date }} -Descending)
  $fixed = BlockBytes $a
  foreach ($b in $blocks) {
    $fixed += (BlockBytes $b.Head) + 1                             # +1 : ligne vide de fin de bloc
    if ($b.Decs.Count) {
      $tc = (@($b.Decs) | ForEach-Object { ([string]$_.txt).Length } | Measure-Object -Sum).Sum
      $b.Reserve = [Math]::Max((LineBytes (OmitLine $b.Id $b.Decs.Count $tc $true)),
                               (LineBytes (OmitLine $b.Id $b.Decs.Count $tc $false)))
      $fixed += $b.Reserve
    }
  }
  $fixed += BlockBytes @(('## Gains mesurés (' + $gains.Count + ' sur ' + $gains.Count + ')'), '')
  if (-not $gains.Count) { $fixed += LineBytes '_Aucun gain renseigné — un ticket ne passe pas à `Fait` sans son `gain` : `{ date, avant, apres, note }`._' }
  # Même raison que pour les lots : l'annonce d'omission des gains s'affiche quand le plafond
  # mord, donc elle est réservée dans l'ossature — au pire cas, et sans être rendue.
  if ($gains.Count) { $fixed += LineBytes ('_(' + $gains.Count + ' gain(s) plus ancien(s) non affiché(s) — dans `suivi.md`.)_') }

  $budget = $UNLIMITED
  $skeletonOver = $false
  if ($MaxActifBytes -gt 0) {
    $budget = [Math]::Max(0, $MaxActifBytes - $fixed)
    $skeletonOver = ($fixed -gt $MaxActifBytes)
  }

  # ---- Décisions : part dégressive, le lot en cours d'abord, le reliquat au suivant ----
  $cutDecs = 0; $cutLots = 0
  $rest = $blocks.Count
  foreach ($b in $blocks) {
    $share = Share $budget $rest
    $rest--
    if (-not $b.Decs.Count) { continue }
    $keep = @(); $spent = 0; $chars = 0
    for ($i = $b.Decs.Count - 1; $i -ge 0; $i--) {
      $txt = [string]$b.Decs[$i].txt
      $line = '- 📌 ' + $(if ($b.Decs[$i].date) { "$($b.Decs[$i].date) — " }) + $txt
      if ($MaxDecisionChars -gt 0 -and $keep.Count -and ($chars + $txt.Length) -gt $MaxDecisionChars) { break }
      if (($spent + (LineBytes $line)) -gt $share) { break }
      $spent += LineBytes $line; $chars += $txt.Length
      $keep = @($b.Decs[$i]) + $keep
    }
    $cut = $b.Decs.Count - $keep.Count
    $b.Keep = $keep
    $budget -= $spent
    if ($cut -gt 0) {
      $om = (@($b.Decs[0..($cut - 1)]) | ForEach-Object { ([string]$_.txt).Length } | Measure-Object -Sum).Sum
      $b.Omit = OmitLine $b.Id $cut $om ($keep.Count -eq 0)
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
  # Servis sur le SOLDE. Les notes sont de la prose : sans plafond cette section devient le
  # fichier entier (même constat que tools/depots.ps1). On écrête en le montrant ; suivi.md
  # garde la version entière.
  $gShown = @(); $gClipped = 0
  $gRest = [Math]::Min($gains.Count, 8)
  foreach ($e in @($gains | Select-Object -First 8)) {
    $head = '- ' + (IdStr $e) + ' · ' + [string]$e.gain.date + ' — '
    $full = $head + (GainStr $e.gain)
    $share = Share $budget $gRest
    $gRest--
    if ((LineBytes $full) -le $share) {
      $gShown += , $full; $budget -= LineBytes $full; continue
    }
    $room = $share - (LineBytes $head)
    if ($room -lt 80) { break }        # sous 80 octets il ne reste pas une mesure lisible
    $line = $head + (ClipBytes (GainStr $e.gain) $room)
    $gShown += , $line; $budget -= LineBytes $line; $gClipped++
  }
  $gCut = $gains.Count - $gShown.Count

  $a.Add('## Gains mesurés (' + $gShown.Count + ' sur ' + $gains.Count + ')'); $a.Add('')
  if (-not $gains.Count) {
    $a.Add('_Aucun gain renseigné — un ticket ne passe pas à `Fait` sans son `gain` : `{ date, avant, apres, note }`._')
  }
  foreach ($g in $gShown) { $a.Add($g) }
  # Annonce en italique, pas en « - » : tools/depots.ps1 ne collecte que les lignes « - ».
  if ($gCut -gt 0) { $a.Add('_(' + $gCut + ' gain(s) plus ancien(s) non affiché(s) — dans `suivi.md`.)_') }

  [IO.File]::WriteAllText($Path, (($a -join "`n").TrimEnd() + "`n"), (New-Object System.Text.UTF8Encoding($false)))
  return @{
    Open = $open.Count; Lots = $live.Count; Size = (Get-Item $Path).Length
    Cap = $MaxActifBytes; Fixed = $fixed; Skeleton = $skeletonOver
    CutDecisions = $cutDecs; CutLots = $cutLots; CutGains = $gCut; ClippedGains = $gClipped
  }
}

$entries = @($state.entries)
$lots = @(); if ($state.lots) { $lots = @($state.lots) }
$out = New-Object System.Collections.Generic.List[string]

$out.Add('# Suivi ' + $ProjectName); $out.Add('')
$out.Add('_Généré le ' + (Get-Date).ToString('dd/MM/yyyy HH:mm:ss') + '. Source de vérité : `suivi.json` — ne pas éditer ce .md à la main._'); $out.Add('')
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
$msg = "suivi-actif.md — {0} ticket(s) ouvert(s), {1} lot(s) non clos, {2} octets" -f $act.Open, $act.Lots, $act.Size
if ($act.Cap -gt 0) { $msg += " (plafond {0})" -f $act.Cap }
Write-Host ($msg + ".")
# Le plafond ne mord JAMAIS en silence (ATL-013) : une projection qui rétrécit sans le dire,
# c'est la dérive d'ATL-001 qui recommence.
if ($act.Skeleton) {
  Write-Warning ("Plafond {0} o dépassé par la seule ossature ({1} o : {2} ticket(s) ouvert(s) + {3} identité(s) de lot). Aucune décision ni gain affiché : clore des lots ou des tickets, pas baisser le plafond." -f $act.Cap, $act.Fixed, $act.Open, $act.Lots)
} elseif ($act.CutDecisions -or $act.CutGains -or $act.ClippedGains) {
  $bits = @()
  if ($act.CutDecisions) { $bits += "{0} décision(s) écartée(s) sur {1} lot(s)" -f $act.CutDecisions, $act.CutLots }
  if ($act.CutGains) { $bits += "{0} gain(s) non affiché(s)" -f $act.CutGains }
  if ($act.ClippedGains) { $bits += "{0} gain(s) écrêté(s)" -f $act.ClippedGains }
  Write-Warning ("Plafond {0} o atteint — {1}. Rien n'est perdu (suivi.json), mais la réponse est de clore des lots ou d'en sortir les décisions-journal." -f $act.Cap, ($bits -join ", "))
}
