#!/usr/bin/env bash
# Finish a raw render: two-pass loudnorm to -14 LUFS and a clean upload copy.
# Usage: scripts/finish.sh <id>   (reads out/<id>_raw.mp4, writes out/<id>.mp4 and out/<id>_upload.mp4)
# Used by scripts/render.sh (local render) and the Lambda workflow (.github/workflows/lambda-render.yml).
set -euo pipefail
ID=${1:?id}
cd "$(dirname "$0")/.."

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
