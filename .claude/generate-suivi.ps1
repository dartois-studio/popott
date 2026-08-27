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
  [int]$MaxDecisionChars = 6000     # 0 = illimité. Budget de décisions affichées par lot.
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
# Contrat (ATL-002) : tickets ouverts en une ligne chacun, lots non clos avec TOUTES leurs
# décisions, la reprise en tête, les gains mesurés en pied. Aucun ticket Fait, aucune
# description longue. C'est un dérivé, pas une seconde source de vérité.
$DONE_LABELS = @('Terminé', 'Buildé SW', 'Déployé', 'Fait', 'Clos')
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
  $a.Add('## Tickets ouverts (' + $open.Count + ')'); $a.Add('')
  if (-not $open.Count) { $a.Add('_Aucun._') }
  foreach ($e in $open) {
    $lotTag = if ($e.lot) { ' · ' + [string]$e.lot } else { '' }
    $a.Add('- ' + (IdStr $e) + ' · ' + $e.prio + ' · ' + $e.stat + $lotTag + ' — ' + $e.title)
  }
  $a.Add('')

  # ---- Lots non clos : identité, méta, but, décisions ----
  $a.Add('## Lots non clos (' + $live.Count + ')'); $a.Add('')
  if (-not $live.Count) { $a.Add('_Aucun._'); $a.Add('') }
  foreach ($l in $live) {
    $a.Add('### ' + [string]$l.id + ' · ' + [string]$l.name)
    $meta = @()
    if ($l.status) { $meta += [string]$l.status }
    if ($l.difficulty) { $meta += [string]$l.difficulty }
    if ($l.branch) { $meta += 'branche `' + $l.branch + '`' }
    $pl = PrLabel $l; if ($pl) { $meta += $pl }
    $meta += '{0} ticket(s) ouvert(s)' -f @($open | Where-Object { [string]$_.lot -eq [string]$l.id }).Count
    $a.Add('_' + ($meta -join ' · ') + '_')
    if ($l.goal) { $a.Add('But : ' + $l.goal) }
    # Budget de décisions par lot : on garde les PLUS RÉCENTES et on ANNONCE l'omission.
    # Sans ça un lot dont les décisions servent de journal (RoomLab L03/L04 : 98 entrées,
    # 49 Ko) fait exploser la projection — ce que ce fichier existe précisément pour éviter.
    $decs = @(@($l.decisions) | Where-Object { $_ })
    $keep = $decs
    if ($MaxDecisionChars -gt 0 -and $decs.Count) {
      $keep = @(); $budget = $MaxDecisionChars
      for ($i = $decs.Count - 1; $i -ge 0; $i--) {
        $len = ([string]$decs[$i].txt).Length
        if ($keep.Count -and $budget -lt $len) { break }
        $budget -= $len
        $keep = @($decs[$i]) + $keep
      }
    }
    $cut = $decs.Count - $keep.Count
    if ($cut -gt 0) {
      $om = (@($decs[0..($cut - 1)]) | ForEach-Object { ([string]$_.txt).Length } | Measure-Object -Sum).Sum
      $a.Add(('- ({0} décision(s) plus ancienne(s) non affichée(s), {1} car. — dans `suivi.json`, lot {2})' -f $cut, $om, [string]$l.id))
    }
    foreach ($dec in $keep) {
      $a.Add('- 📌 ' + $(if ($dec.date) { "$($dec.date) — " }) + $dec.txt)
    }
    $a.Add('')
  }

  # ---- Gains mesurés : ce que les tickets livrés ont rapporté (ATL-010) ----
  $gains = @($entries | Where-Object { $_.gain } | Sort-Object @{e = { [string]$_.gain.date }} -Descending)
  $shown = @($gains | Select-Object -First 8)
  $a.Add('## Gains mesurés (' + $shown.Count + ' sur ' + $gains.Count + ')'); $a.Add('')
  if (-not $gains.Count) {
    $a.Add('_Aucun gain renseigné — un ticket ne passe pas à `Fait` sans son `gain` : `{ date, avant, apres, note }`._')
  }
  foreach ($e in $shown) {
    $a.Add('- ' + (IdStr $e) + ' · ' + [string]$e.gain.date + ' — ' + (GainStr $e.gain))
  }

  [IO.File]::WriteAllText($Path, (($a -join "`n").TrimEnd() + "`n"), (New-Object System.Text.UTF8Encoding($false)))
  return @{ Open = $open.Count; Lots = $live.Count; Size = (Get-Item $Path).Length }
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
Write-Host ("suivi-actif.md — {0} ticket(s) ouvert(s), {1} lot(s) non clos, {2} octets." -f $act.Open, $act.Lots, $act.Size)
