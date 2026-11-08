#!/usr/bin/env bash
# Render the "Unidos pela Inclusão" promo on a PC (Git Bash / WSL / macOS / Linux).
# Usage: scripts/render_promo.sh            (GPU via ANGLE, 6 threads)
#        GL=swangle CONC=2 scripts/render_promo.sh   (no-GPU fallback)
set -euo pipefail
cd "$(dirname "$0")/.."
GL=${GL:-angle}
CONC=${CONC:-6}
mkdir -p out
npx remotion bundle src/index.ts --out-dir=build_promo --log=error
npx remotion render build_promo PromoUnidos out/promo_unidos_raw.mp4 --gl="$GL" --concurrency="$CONC" --crf=18

# loudness to -14 LUFS (Instagram/TikTok standard), then strip metadata
STATS=$(ffmpeg -hide_banner -i out/promo_unidos_raw.mp4 -af loudnorm=I=-14:TP=-1:LRA=7:print_format=json -vn -f null - 2>&1 | sed -n '/^{/,/^}/p')
get() { echo "$STATS" | python3 -c "import json,sys; print(json.load(sys.stdin)['$1'])"; }
ffmpeg -v error -y -i out/promo_unidos_raw.mp4 -c:v copy \
  -af "loudnorm=I=-14:TP=-1:LRA=7:measured_I=$(get input_i):measured_TP=$(get input_tp):measured_LRA=$(get input_lra):measured_thresh=$(get input_thresh):offset=$(get target_offset):linear=true" \
  -ar 48000 -c:a aac -b:a 192k out/promo_unidos.mp4
ffmpeg -v error -y -i out/promo_unidos.mp4 -map_metadata -1 -c copy -fflags +bitexact out/promo_unidos_upload.mp4
echo "DONE: out/promo_unidos_upload.mp4"
