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
  [string]$Participle = ''
)
$ErrorActionPreference = 'Stop'
if (-not $MdPath) { $MdPath = Join-Path (Split-Path $JsonPath) 'suivi.md' }

# ---- Config lue depuis le bloc PROJECT du tracker HTML (valeurs de repli si absent) ----
function Get-SuiviConfig([string]$dir) {
  $cfg = @{ Name = 'Projet'; Prefix = 'T'; Participle = 'livré' }
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
  }
  return $cfg
}
$cfg = Get-SuiviConfig (Split-Path $JsonPath)
if (-not $ProjectName) { $ProjectName = $cfg.Name }
if (-not $Prefix)      { $Prefix = $cfg.Prefix }
if (-not $Participle)  { $Participle = $cfg.Participle }

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
Write-Host ("suivi.md régénéré — {0} entrées, {1} lot(s). Projet : {2}." -f $entries.Count, $lots.Count, $ProjectName)
