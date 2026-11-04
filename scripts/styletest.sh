#!/usr/bin/env bash
# 10-second clips of one video in each visual style, plus a side-by-side comparison.
set -euo pipefail
VID=${1:?video id}
export REMOTION_BROWSER=${REMOTION_BROWSER:-/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell}
cd "$(dirname "$0")/.."
mkdir -p out/style
npx remotion bundle src/index.ts --out-dir=build-style --log=error >/dev/null
for st in blocky soft real; do
  npx remotion render build-style Short "out/style/${VID}_${st}_10s.mp4" --props="{\"videoId\":\"${VID}\",\"style\":\"${st}\"}" --frames=0-299 --concurrency=2 --crf=20 --log=error
  echo "CLIP $st"
done
ffmpeg -v error -y -i "out/style/${VID}_blocky_10s.mp4" -i "out/style/${VID}_soft_10s.mp4" -i "out/style/${VID}_real_10s.mp4" \
  -filter_complex "[0:v]scale=540:-2,drawtext=text='A  BLOCKY':x=20:y=h-60:fontsize=36:fontcolor=white:box=1:boxcolor=black@0.6[a];[1:v]scale=540:-2,drawtext=text='B  SOFT':x=20:y=h-60:fontsize=36:fontcolor=white:box=1:boxcolor=black@0.6[b];[2:v]scale=540:-2,drawtext=text='C  REALISTIC':x=20:y=h-60:fontsize=36:fontcolor=white:box=1:boxcolor=black@0.6[c];[a][b][c]hstack=3[v]" \
  -map "[v]" -map 2:a -c:v libx264 -crf 20 -c:a aac "out/style/${VID}_styles_compare.mp4"
echo "COMPARE done"
