# Promo "Unidos pela Inclusão" (festival line-up video)

Composition: `PromoUnidos` (1080x1920, 30 fps, 59.6 s). Code: `src/promo/`.

## Timeline (100 BPM, 1 bar = 2.4 s)
| Time | Scene |
|---|---|
| 0.0–7.2 s | Intro: GDF presents → FESTIVAL SOLIDÁRIO → UNIDOS PELA INCLUSÃO |
| 7.2–45.6 s | 7 artists, 4.8 s each (01/08 … 07/08) |
| 45.6–48.0 s | "E o cabeça de cartaz é…" |
| 48.0–55.2 s | Sérgio Rossi (headliner) |
| 55.2–59.6 s | Info + sponsors + NÃO FALTES! |

Artist slots: Rancho 7.2 · Safari 12.0 · DJ Celine 16.8 · Tributo Variações 21.6 · Taiga 26.4 ·
Deejay Antuan 31.2 · Companhia Limitada 36.0 · Nelson Anjos 40.8 · Sérgio Rossi 48.0

## Adding each artist's song snippet
1. Put the audio file in `public/promo_unidos/audio/` (e.g. `safari.mp3`).
2. In `src/promo/config.ts`, set `clip: 'safari.mp3'` and `clipFrom: 62` (seconds into the song where the best bit starts).
3. Re-render. The music bed automatically drops to 18% while a clip plays (clips fade in/out).

## Render
```bash
python3 scripts/make_festival_bed.py          # only if you change the music bed
npx remotion bundle src/index.ts --out-dir=build_promo
npx remotion render build_promo PromoUnidos out/promo_unidos_raw.mp4 --crf=18
```
Then loudness-normalise like scripts/render.sh does (-14 LUFS).
