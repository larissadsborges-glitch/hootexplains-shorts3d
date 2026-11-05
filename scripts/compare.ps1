# Render the same frames in two styles and tile them: top row = style A, bottom row = style B.
# Usage: powershell -File scripts/compare.ps1 <videoId> <styleA> <styleB> <name> <frame> [frame...]
param([string]$Vid, [string]$A, [string]$B, [string]$Name, [Parameter(ValueFromRemainingArguments = $true)][int[]]$Frames)
$ErrorActionPreference = 'Stop'
$ff = 'C:\Users\borge\.hoottools\ffmpeg\ffmpeg.exe'
Set-Location (Split-Path $PSScriptRoot -Parent)
npx remotion bundle src/index.ts --out-dir=build_m --log=error | Out-Null
$tmp = "out/cmp_$Name"; New-Item -ItemType Directory -Force $tmp | Out-Null
$i = 0
foreach ($st in @($A, $B)) { foreach ($f in $Frames) {
  $props = '{\"videoId\":\"' + $Vid + '\",\"style\":\"' + $st + '\"}'
  npx remotion still build_m Short ("$tmp/{0:D3}.png" -f $i) --frame=$f --scale=0.4 --gl=angle --props=$props --log=error | Out-Null
  $i++ } }
& $ff -v error -y -i "$tmp/%03d.png" -vf "tile=$($Frames.Count)x2:padding=6" -frames:v 1 "out/$Name.jpg"
"COMPARE out/$Name.jpg"
