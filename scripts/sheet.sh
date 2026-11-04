#!/usr/bin/env bash
# Render low-res stills at the given frames and tile them into one contact sheet.
# Usage: scripts/sheet.sh out/sheet.jpg 0 30 60 ...
set -e
OUT=$1; shift
export REMOTION_BROWSER=${REMOTION_BROWSER:-/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell}
TMP=$(mktemp -d)
for f in "$@"; do
  npx remotion still ${BUNDLE:-build} Short "$TMP/$(printf %04d $f).jpg" --frame=$f --scale=0.3 --log=error --props="{\"videoId\":\"${VID:-bridge-poc}\",\"style\":\"${STYLE:-blocky}\"}" >/dev/null 2>&1
done
ffmpeg -v error -y -pattern_type glob -i "$TMP/*.jpg" -vf "tile=${COLS:-6}x$(( ($# + ${COLS:-6} - 1) / ${COLS:-6} )):padding=4" -frames:v 1 "$OUT"
rm -rf "$TMP"
