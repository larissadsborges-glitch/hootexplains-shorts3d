# shorts3d

Code-generated low-poly 3D explainer videos for YouTube Shorts and Instagram Reels (1080×1920, 30fps, English).

## How a video is made

1. **Write a script:** `videos/<id>/script.json`. Each beat has a line of narration plus the shot, event and label.
2. **Voiceover:** `python3 scripts/tts.py videos/<id>/script.json` generates `public/videos/<id>/voice.wav` and `timings.json` with a free Kokoro voice (`bm_george`, British male).
3. **Preview stills:** `npx remotion bundle src/index.ts --out-dir=build`, then `scripts/sheet.sh out/sheet.jpg 0 60 120 ...`
4. **Render:** `npx remotion render build Short out/<id>.mp4 --props='{"videoId":"<id>"}'`

## Setup

```bash
npm install
pip install kokoro-onnx soundfile
mkdir -p models && cd models
curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
```

On a machine without a GPU, set `REMOTION_BROWSER` to a Chromium headless shell. Rendering uses software WebGL (`swangle`).

## Layout

- `src/world/`: reusable environment (terrain, water, trees, clouds, sky, lights), props (car, particle bursts) and the camera rig
- `src/scenes/`: one file per scene, driven by the script's events and timings
- `src/overlays/`: word-by-word captions, term labels, handle
- `LEARNINGS.md`: mistakes, fixes and ideas. Read it before each new video.
