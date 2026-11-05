# Windows helper: bundle, draft-render frames at half size on the GPU, and tile a contact sheet (one frame every 0.5 s).
# Usage: powershell -File scripts/draft.ps1 <videoId> <lastFrame> [sheetName]
param([string]$Vid = 'money1', [int]$Last = 299, [string]$Sheet = 'sheet_draft', [string]$Comp = 'Short')
$ErrorActionPreference = 'Stop'
$ff = 'C:\Users\borge\.hoottools\ffmpeg\ffmpeg.exe'
Set-Location (Split-Path $PSScriptRoot -Parent)
npx remotion bundle src/index.ts --out-dir=build_m --log=error | Out-Null
$props = '{\"videoId\":\"' + $Vid + '\"}'
npx remotion render build_m $Comp "out/${Vid}_draft.mp4" --props=$props --frames=0-$Last --scale=0.5 --gl=angle --concurrency=4 --log=error
& $ff -v error -y -i "out/${Vid}_draft.mp4" -vf "fps=2,scale=270:-1,tile=12x2:padding=4" -frames:v 1 "out/$Sheet.jpg"
"SHEET out/$Sheet.jpg"
