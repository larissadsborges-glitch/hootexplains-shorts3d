#!/usr/bin/env bash
# Render one video end to end and normalise loudness for Shorts/Reels.
# Usage: STYLE=real scripts/render.sh <videoId>   (STYLE: blocky|soft|real, default from script.json)
set -euo pipefail
VID=${1:?video id}
STYLE=${STYLE:-}
ID=${VID}${STYLE:+_$STYLE}
PROPS="{\"videoId\":\"${VID}\"${STYLE:+,\"style\":\"$STYLE\"}}"
export REMOTION_BROWSER=${REMOTION_BROWSER:-/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell}
cd "$(dirname "$0")/.."
mkdir -p out
npx remotion bundle src/index.ts --out-dir=build --log=error >/dev/null
npx remotion render build Short "out/${ID}_raw.mp4" --props="$PROPS" --concurrency=2 --crf=18

scripts/finish.sh "$ID"
