# CLAUDE.md: start here (handoff for any new agent)

You are continuing the **Hoot Explains** project: code-generated 3D explainer Shorts/Reels/TikToks made with **Remotion + Three.js**. This file is the single entry point. Read it fully, then read the docs it points to before doing anything.

## 1. The project in one minute
- **Page:** Hoot Explains, @hootexplains on Instagram, TikTok and YouTube Shorts. The display name is "Hoot Explains | How Things Work". The owner lives in Portugal (Europe/Lisbon); the target audience is the **US** (show metric units too).
- **Characters:**
  - **Hoot:** a brown owl with navy round glasses, a teal bow tie and a pencil. He is the narrator and host, appears in the first frame, always faces the camera, and has **ONE beak** that opens with the voice (driven by `timings.mouth`). Never draw a separate mouth or nose.
  - **Jake:** a young guy in a red hoodie. He lives the stories so viewers relate to him (`src/mascot/Jake.tsx`). His arms must stay attached to his body, he must never sink into furniture, his hands must touch what they hold, and his look must fit the moment (fresh in the morning, tired later).
- **Voice:** Kokoro TTS blend of 70% `am_adam` + 30% `am_michael`, `lang: en-us`, speed 1.25. ElevenLabs is the planned upgrade when there's budget.
- **House visual style:** "real", a stylised 3D look with a realistic finish (`src/style/StylePass.tsx`). It is the default.
- **Posting:** 2 videos a day. The launch plan recommends **18:00 and 22:00 Lisbon** (13:00 and 17:00 New York) over the owner's original 12:00/18:00. Series episodes go one per day in the 18:00 slot. Instagram allows only 5 hashtags.

## 2. Status (4 Nov 2026)
| Video | State |
|---|---|
| Plane window (`planewindow`) | Posted. Its airliner tail cone was modelled back to front (fixed afterwards in the shared plane). |
| Airplane mode (`airplanemode`) | Final v3 delivered (`out/hootexplains_airplanemode_v3.mp4`), with a cover and post kit. |
| Sleep series Day 1 (`awake1`, scene `awake`) | Re-rendered on 4 Nov with all review fixes. Needs the final 2-pass review, then delivery. Days 2–3 not built yet (the old `sleep*` folders are an earlier version; ignore them). |
| Money series EP1–6 (`videos/money1..6`) | Scripts, briefs (with sources), shot lists and post kits written and checked. **Next to build: EP1.** Send the owner a 10 s preview first, since money may get a new look. |
| Profile picture | Hoot close-up, winking (`src/mascot/Avatar.tsx`, `bust`). The owner wasn't fully happy; revisit. |
| Automated QA checker (`scripts/qa/`) | Partly built by an agent that was cut off by a usage limit. Read scripts/qa/README.md, test it, and finish it. |
| Better Jake (rigged glTF character, outlines, contact shadows) | Not started. See docs/GAME_PLAN.md section 3. |

## 3. Docs to read (in this order)
1. `docs/SCRIPT_RULES.md`: **mandatory** for every idea, title and script (hooks, but/therefore, open loops, CTA placement, shareability, checklist).
2. `docs/LEARNINGS.md`: every mistake and fix since the start. Read the newest sections first.
3. `docs/GAME_PLAN.md`: research on virality, 3D quality, saving tokens, and next steps.
4. `docs/LAUNCH_PLAN.md`: posting times, the 14-day calendar, cross-posting rules, metrics and the cover template.
5. `docs/COMPETITOR_SCAN.md`, `docs/GROWTH_PLAYBOOK.md`, `docs/VIRAL_REFS.md`, `docs/IDEAS.md`, `docs/project/hootexplains-style-guide.md`.
6. The skill `.claude/skills/hootexplains-short/SKILL.md`: the step-by-step video workflow.

The same docs also live in the owner's claude.ai Project "Video Shirt Tutorials" (under `claude/hootexplains-*` and `claude/explainland-*`). If you have Project access, keep both copies in sync.

## 4. How the owner wants you to work
- **Slow and careful.** Check every step, look again, then improve. Sub-agents get the same rule.
- **Review twice before sending anything:** your own pass (a sheet every 0.5 s plus sound scans) AND an independent review agent. **Never send before both pass.**
- **Previews first:** send a 10 s preview before building a full video with a new design.
- **Propose titles and scripts** and let the owner choose.
- **Updates:** keep them short. When asked for progress, show a text progress bar with ETAs.
- **English** answers.
- **Topics:** test topics and see what grows; don't lock the page to one niche.
- Never send the owner's email address anywhere.

## 5. Setup on a new machine (the owner's PC: i7-7700K + GTX 1050)
```bash
# Node 18+ and Python 3.10+
npm install
pip install kokoro-onnx soundfile numpy scipy
mkdir -p models && cd models
curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
cd ..
```
- **GPU rendering:** add `--gl=angle` to the `npx remotion render` line in `scripts/render.sh`. The cloud box used software rendering (`swangle` / `REMOTION_BROWSER`); on a PC with Chrome, Remotion downloads its own browser, so don't set `REMOTION_BROWSER`. Try `--concurrency=6` and benchmark with `npx remotion benchmark`.
- **Windows:** the `.sh` scripts need Git Bash or WSL. Alternatively run the commands inside them by hand.
- **Not in the repo** (too big, or can be regenerated): `node_modules/`, `models/`, `out/` (rendered videos), and the `build*/` bundles. The final delivered videos were sent to the owner in chat.

## 6. Making a video (short version)
1. Write `videos/<id>/script.json` (copy `videos/awake1/script.json`) plus a BRIEF.md with sources.
2. Generate the voice: `python3 scripts/tts.py videos/<id>/script.json`. This writes `public/videos/<id>/voice.wav` and `timings.json`.
3. Generate Hoot's beak sync: `python3 scripts/mouth.py <id>`.
4. **Scene:** `src/scenes/<id>/` holds `timeline.ts`, `Scene.tsx`, `overlays.tsx` and `sfx.ts`. Register it in `src/Short.tsx` (`SCENES`).
5. **Stills:** `npx remotion bundle src/index.ts --out-dir=build_x`, then `BUNDLE=build_x VID=<id> STYLE=real scripts/sheet.sh out/sheet.jpg 0 60 120 …`.
6. **Render:** `scripts/render.sh <id>` produces `out/<id>_upload.mp4` at -14 LUFS with metadata stripped.
7. **Cover:** `npx remotion still build_x Cover out/cover_<id>.png --props='{"videoId":"<id>","at":5,"small":"HOOT EXPLAINS · …","line1":"…","line2":"…"}'`.
8. **Review twice, fix, then deliver** the video, cover and post kit (`out/<id>_postkit.md`).

## 7. Code map
- `src/Short.tsx`: the main composition and scene registry. `src/Root.tsx`: compositions (Short, Cover, Avatar).
- `src/mascot/Mascots.tsx` (Hoot, with `talk`, `tired`, `asleep`, `wink`), `src/mascot/Jake.tsx`, `src/mascot/Avatar.tsx` (profile picture).
- `src/overlays/`: captions, the title card (auto-fit), the Hoot badge, the cover.
- `src/scenes/awake/`: the bedroom series (Jake + Hoot). `src/scenes/airplanemode/` and `src/scenes/planewindow/`: cabin, cockpit, exterior airliner. `src/scenes/learjet/assets.tsx`: sky, clouds, lights, Person.
- `src/scenes/sleep/overlays.tsx` exports `CirclePill` (hand-drawn red circle via `@remotion/rough-notation`).
- `scripts/`: `tts.py`, `mouth.py`, `render.sh`, `sheet.sh`, `make_sfx*.py`, `make_music*.py`, `qa/`.
