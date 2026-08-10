# Synchronise les champs PR de suivi.json depuis GitHub (gh CLI) — 1 seule requête.
# Cibles : toute entrée ou lot portant un champ `pr` (numéro) ou `branch` (nom de branche).
# Met à jour : pr, prUrl, prState (open|merged|closed), merged (date). Ne touche JAMAIS aux statuts.
# S'il y a des changements, régénère suivi.md via generate-suivi.ps1.
# Usage : powershell -ExecutionPolicy Bypass -File .claude\sync-pr.ps1
#
# Le préfixe des identifiants est lu dans le bloc CONFIG du suivi-projet*.html voisin.
param(
  [string]$JsonPath = (Join-Path $PSScriptRoot 'suivi.json'),
  [string]$Prefix = ''
)
$ErrorActionPreference = 'Stop'

if (-not $Prefix) {
  $Prefix = 'T'
  $html = Get-ChildItem -Path (Split-Path $JsonPath) -Filter 'suivi-projet*.html' -File -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -notlike '*template*' -and $_.Name -notlike '*backup*' } |
    Select-Object -First 1
  if ($html) {
    $txt = [IO.File]::ReadAllText($html.FullName)
    $cut = $txt.IndexOf('FIN DE LA CONFIG'); if ($cut -gt 0) { $txt = $txt.Substring(0, $cut) }
    if ($txt -match '(?m)^\s*prefix:\s*"([^"]*)"') { $Prefix = $Matches[1] }
  }
}

# --- Sérialisation fidèle à JSON.stringify(x, null, 2) de l'app (suivi-projet.html) ---
# Même octet pour octet : indent 2 espaces, ": ", accents/emoji littéraux, LF, PAS de newline final.
# But : ne jamais reformater le fichier → zéro diff parasite réinjecté dans le contexte de Claude.
function Format-JsonString([string]$s) {
  $out = foreach ($ch in $s.ToCharArray()) {
    $code = [int][char]$ch
    if     ($code -eq 34) { '\"' }
    elseif ($code -eq 92) { '\\' }
    elseif ($code -eq 8)  { '\b' }
    elseif ($code -eq 9)  { '\t' }
    elseif ($code -eq 10) { '\n' }
    elseif ($code -eq 12) { '\f' }
    elseif ($code -eq 13) { '\r' }
    elseif ($code -lt 32) { '\u{0:x4}' -f $code }
    else { [string]$ch }
  }
  '"' + (-join $out) + '"'
}
function Format-JsonJs($v, [int]$depth) {
  $ind  = '  ' * $depth
  $ind2 = '  ' * ($depth + 1)
  if ($null -eq $v) { return 'null' }
  if ($v -is [bool]) { if ($v) { return 'true' } else { return 'false' } }
  if ($v -is [string]) { return Format-JsonString $v }
  if ($v -is [int] -or $v -is [long] -or $v -is [byte] -or $v -is [int16]) { return [string][long]$v }
  if ($v -is [double] -or $v -is [single] -or $v -is [decimal]) {
    return ([double]$v).ToString('R', [Globalization.CultureInfo]::InvariantCulture)
  }
  if ($v -is [System.Collections.IEnumerable] -and $v -isnot [string]) {
    $items = @($v)
    if ($items.Count -eq 0) { return '[]' }
    $parts = foreach ($it in $items) { $ind2 + (Format-JsonJs $it ($depth + 1)) }
    return "[`n" + ($parts -join ",`n") + "`n$ind]"
  }
  $props = @($v.PSObject.Properties)
  if ($props.Count -eq 0) { return '{}' }
  $parts = foreach ($p in $props) {
    $ind2 + (Format-JsonString $p.Name) + ': ' + (Format-JsonJs $p.Value ($depth + 1))
  }
  return "{`n" + ($parts -join ",`n") + "`n$ind}"
}

$rawJson = [IO.File]::ReadAllText($JsonPath)
$state = $rawJson | ConvertFrom-Json

# ---- Cibles ----
$targets = @()
foreach ($e in @($state.entries)) {
  if ($e.pr -or $e.branch) { $targets += , @{ obj = $e; label = ('{0}-{1:000}' -f $Prefix, [int]$e.n); isEntry = $true } }
}
if ($state.lots) {
  foreach ($l in @($state.lots)) {
    if ($l -and ($l.pr -or $l.branch)) { $targets += , @{ obj = $l; label = "lot $($l.id) ($($l.name))"; isEntry = $false } }
  }
}
if (-not $targets.Count) { Write-Host 'Aucune entrée/lot lié à une PR — rien à synchroniser.'; exit 0 }

# ---- GitHub : une requête unique ----
Push-Location (Split-Path $PSScriptRoot -Parent)
try { $ghOut = gh pr list --state all --limit 200 --json number,state,mergedAt,url,headRefName } finally { Pop-Location }
if ($LASTEXITCODE -ne 0 -or -not $ghOut) { Write-Host '! gh indisponible ou erreur GitHub — suivi.json inchangé.'; exit 1 }
$prs = (@($ghOut) -join "`n") | ConvertFrom-Json

$byNum = @{}; $byBranch = @{}
foreach ($p in @($prs)) {
  $byNum[[int]$p.number] = $p
  # gh liste les PR de la plus récente à la plus ancienne : on garde la plus récente par branche
  if ($p.headRefName -and -not $byBranch.ContainsKey([string]$p.headRefName)) { $byBranch[[string]$p.headRefName] = $p }
}

# Ajoute ou met à jour une propriété ; renvoie $true si la valeur a changé
function Set-Field($obj, $name, $value) {
  if ($obj.PSObject.Properties[$name]) {
    if ($obj.$name -ne $value) { $obj.$name = $value; return $true }
    return $false
  }
  $obj | Add-Member -NotePropertyName $name -NotePropertyValue $value
  return $true
}

$today = (Get-Date).ToString('yyyy-MM-dd')
$changes = @(); $any = $false
foreach ($t in $targets) {
  $o = $t.obj
  $p = $null
  if ($o.pr) { $p = $byNum[[int]$o.pr] }
  if (-not $p -and $o.branch) { $p = $byBranch[[string]$o.branch] }
  if (-not $p) { $changes += "! $($t.label) : PR/branche introuvable sur GitHub"; continue }
  $mod = $false
  if (Set-Field $o 'pr' ([int]$p.number)) { $mod = $true }
  if (Set-Field $o 'prUrl' ([string]$p.url)) { $mod = $true }
  $old = [string]$o.prState
  $new = ([string]$p.state).ToLower()
  if (Set-Field $o 'prState' $new) {
    $mod = $true
    if ($old) { $changes += "$($t.label) : PR #$($p.number) $old -> $new" }
    else { $changes += "$($t.label) : PR #$($p.number) liée ($new)" }
  }
  if ($new -eq 'merged' -and $p.mergedAt) {
    if (Set-Field $o 'merged' ([datetime]$p.mergedAt).ToString('yyyy-MM-dd')) { $mod = $true }
  }
  if ($mod) {
    $any = $true
    if ($t.isEntry) { Set-Field $o 'updated' $today | Out-Null }
  }
}

if (-not $any) {
  $changes | ForEach-Object { Write-Host $_ }
  Write-Host 'PR déjà à jour — suivi.json inchangé.'
  exit 0
}

# ---- Réécriture du JSON (byte-identique au format de l'app, cf. Format-JsonJs) ----
$json = Format-JsonJs $state 0
if ($json -ceq $rawJson) {
  # Aucune différence textuelle réelle : ne pas toucher au fichier (préserve mtime + contexte Claude).
  $changes | ForEach-Object { Write-Host $_ }
  Write-Host 'PR déjà à jour (format) — suivi.json inchangé.'
  exit 0
}
[IO.File]::WriteAllText($JsonPath, $json, (New-Object System.Text.UTF8Encoding($false)))

$changes | ForEach-Object { Write-Host $_ }
& (Join-Path $PSScriptRoot 'generate-suivi.ps1') -JsonPath $JsonPath
