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

# two-pass loudnorm to -14 LUFS integrated, -1 dBTP; video stream is copied untouched
STATS=$(ffmpeg -hide_banner -i "out/${ID}_raw.mp4" -af loudnorm=I=-14:TP=-1:LRA=7:print_format=json -vn -f null - 2>&1 | sed -n '/^{/,/^}/p')
get() { echo "$STATS" | python3 -c "import json,sys; print(json.load(sys.stdin)['$1'])"; }
ffmpeg -v error -y -i "out/${ID}_raw.mp4" -c:v copy \
  -af "loudnorm=I=-14:TP=-1:LRA=7:measured_I=$(get input_i):measured_TP=$(get input_tp):measured_LRA=$(get input_lra):measured_thresh=$(get input_thresh):offset=$(get target_offset):linear=true" \
  -ar 48000 -c:a aac -b:a 192k "out/${ID}.mp4"
echo "FINAL out/${ID}.mp4"
ffmpeg -hide_banner -i "out/${ID}.mp4" -af ebur128 -f null - 2>&1 | grep -E "^\s+I:" | tail -1

# clean upload copy: strip container/stream tags (encoder, "Made with Remotion")
ffmpeg -v error -y -i "out/${ID}.mp4" -map_metadata -1 -map_metadata:s:v -1 -map_metadata:s:a -1 -c copy -bsf:v filter_units=remove_types=6 -fflags +bitexact "out/${ID}_upload.mp4"
echo "UPLOAD out/${ID}_upload.mp4"
