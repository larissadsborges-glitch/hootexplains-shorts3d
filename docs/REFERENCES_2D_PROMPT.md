# Owner's references: 2D Niche Prompt (PDF), GrowKaz Stickman plugin, cartoon-audio-short SKILL.md (5 Nov 2026)

Copies are in `C:\Users\borge\hoot\refs\downloads\` (the plugin is extracted to `GrowKaz_Stickman_extracted\`). Read only: nothing was installed or run.

## 1. What each file is
- **PDF "ScriptForge" (3 pages):** a system prompt for long-form faceless YouTube. Three gated steps: pick a niche from a menu, get 10 ideas (title under 60 characters plus a hook line), then a 3–4 min script of 450–600 words. Structure: hook, setup, 3–5 escalating beats each ending on a mini-cliffhanger, twist, outro + CTA. Every paragraph is tagged `[NARRATION]` and `[VISUAL]` with tone notes. It ends with alternative titles, 2–4 words of thumbnail text, 5 tags and the runtime. "Never invent statistics."
- **GrowKaz_Stickman.plugin (zip, v1.1.0):** a Claude Code plugin with 5 skills (`make-2d-video`, `/new-video`, `/video-styles`, `/render-video`, `/video-sound`). It turns a voiceover into a stick-figure film drawn on canvas with Three.js and captured with Playwright and FFmpeg. It also has Whisper alignment, synthesized music and SFX, and a long style bible.
- **SKILL.md `cartoon-audio-short` (single file):** see section 5.

## 2. The plugin: what it would install, risks, verdict
- **Claude config:** it adds 5 skills only. **No hooks, no MCP servers, no agents, no permission rules, no settings changes, no API keys.**
- **On first use the skills make Claude:** `winget install` FFmpeg and Node, run `npm install` (playwright, three, fonts) and `npx playwright install chromium`, and `pip install numpy scipy faster-whisper`. They also download a Whisper model from huggingface.co (~1 GB in total). `doctor.py --install` runs these fixes with `shell=True`, and it may search the whole disk (`find /`).
- **Code review:** no telemetry, no uploads, no obfuscation, no credential access. Minor issues: the render server calls `listen(0)` without binding to localhost, so the LAN can reach it during a render; the path check is a bare `startsWith`; Chromium runs with `--enable-unsafe-swiftshader`. The docs are inconsistent (Stage 5 names styles that don't exist).
- **The skill descriptions trigger very broadly** ("animate my script"), so they would compete with our `hootexplains-short` skill.
- **Verdict:** it looks benign, but **don't install it.** It would add a second engine next to Remotion and heavy dependencies. Borrow its ideas instead.

## 3. Techniques to apply (Tavinho first)
**Script**
1. A 55–61 s skeleton: hook 0–2 s (the moment of shame, no intro), setup with an open loop, 3 escalating "but/therefore" beats each ending on a mini-cliffhanger, a twist around 45 s, then the vote. A cold open freezes the worst moment, then "Três dias antes…".
2. Every beat in `script.json` gets `narration`, `visual` (one concrete picture sentence) and `tone` (pauses, emphasis).
3. Post kit: 3 alternative titles, 2–4 words of cover text, 5 tags, word count and runtime.

**Pacing and camera**
4. Shots touch end to end, each starting 0.1–0.2 s before its phrase (SKILL: reactions 0–3 frames before the word). Median ~1 s for Tavinho; the plugin's 2–3.5 s fits Hoot.
5. Mix shot types: an establishing wide per place, two-shot, over-the-shoulder with a blurred foreground, a giant face close-up every 3–5 s, inserts (a finger on the phone, absurd details), and 1–2 freeze-frames (white flash, sweat drops hanging in the air). Never more than 3 shots in a row with the same framing.
6. Never static (SKILL: not even 4 frames): push-in 1.0→1.05–1.10, drift ±20–60 px, a 3–5° roll on drama, a 7-frame shake on impacts. Build one Remotion `<Cam>` wrapper.

**Visual style (keep our ink outlines)**
7. 60–75% dark mid-tones (`#1c2340`) with 1–3 bright accents; stage Tavinho against the brightest area (the phone glow, the orange accent).
8. Parallax layers with a blurred foreground at depth ~1.6 (SVG `feGaussianBlur`), one visible key light with a glow, dust or phone-glow atmosphere.
9. Colours only from palette tokens, so `compare.ps1` can render grade grids.
10. A motif table per season: Dona Celeste's unopened message ("?"), the "FALTAM X DIAS" badge, the progress bar, sweat drops.

**Characters and acting**
11. One fixed saturated signature item per character (Tavinho's red tie, Celeste's lipstick and glasses chain). Extras get none.
12. Expressions change on word beats; each character blinks on its own period (3.1 / 3.7 / 4.3 s); idle breathing; head bobs on stressed words; anticipation → overshoot → spring settle on actions; contact shadows.
13. Only on-screen dialogue moves mouths. The narrator is never lip-synced.

**Captions and graphics**
14. Keep faces and text inside the central 900×1500 area; keep characters above ~0.68H so captions never cover them; no captions on vote, title or end cards.
15. Every number spoken appears on its word (`wordTime`), at most 2 labels at once, popping in with `outBack` and a pop SFX.

**Voice and sound**
16. Timing for voices without timestamps (Chatterbox, Piper, a recorded human): either the SKILL's no-install fallback (silence detection plus a DP that matches script phrases to speech segments) or faster-whisper + difflib with a ≥90% match. Whisper needs a pip install, which is the owner's call.
17. A sting on the twist (the music stops, a low hit, a push-in with a roll). Ambience bed at −18 to −28 dB; at most 2 SFX at once; a riser before reveals.
18. Script writing: numbers written as words, 8–15-word sentences, never describing what is already on screen. Size scripts at ~3.7 words/s, then re-measure for our faster voice.

**Workflow**
19. Per episode: `bible.md` (cast, locations, motifs, music plan) → shot plan table (frames, words, light, camera, poses, SFX) → a 5–10 line summary for the owner.
20. Build in batches of 8–12 shots with a contact sheet after each batch. Add these checks to `scripts/qa/`: ffmpeg `freezedetect` (≥0.4 s) and `blackdetect`, "numbers match the narration", "nothing under the captions".
21. No `Math.random`/`Date.now`; use `random(seed)`. Offer choices as gated menus of 10 ideas.

## 4. Conflicts with our rules ⚠️
- **Engagement bait:** the PDF's "subscribe/comment" outro and the plugin's end screen (subscribe pill, comment bubble) are **not allowed**. Tavinho gets only the story vote.
- **Copying a creator's look:** GrowKaz's black stick figures with rim light, letterbox bars and named presets, plus its "no thick outlines" rule, contradict our house style. Take the techniques, not the look.
- **Owner approval:** the plugin says "take the defaults and continue" and the SKILL says "do everything without stopping". We stay with previews first and the owner choosing.
- **Lip-sync:** "the narrator is never lip-synced" applies to Tavinho only. Hoot's beak still syncs to the voice.
- **Format:** the PDF is 3–4 min, second person, and its niche menu includes "Dark Psychology". The plugin defaults to 16:9 at 24 fps. We make 9:16 at 30 fps.
- **Voice cloning:** none of the files asks for it. The rule stands.

## 5. SKILL.md `cartoon-audio-short`
**What it makes Claude do:** a gated flow with 10 ideas (title, hook line, twist, why it animates well, and whether it's "true or legend", checked with a web search). Then a 20–60 s script: hook, setting, 2–4 escalating beats, a "But…" pivot, and a twist as the last words. Then the user records the voiceover (ElevenLabs tips), and Claude builds a 1080×1920, 30 fps MP4: a Three.js 3D world with ink outlines, 2D "bean-head" character cards, depth of field, and synthesized music and SFX. It refers to a `kit/` folder that is **not included** (only the SKILL.md was shared). The kit is based on github.com/mromidev/claude-animated-shorts (MIT). Running it would mean `find /`, `bash setup.sh`, `npm i -g playwright` (a global install) and a Chromium download. Installing the SKILL alone would add one skill with a very broad trigger ("any cartoon short"). Same verdict: don't install it.

**Overlap:** with the PDF, the 10-idea menu and the hook → escalation → twist formula. With the plugin, an engine driven by a voiceover, Playwright frame capture, optional Whisper timing, synthesized audio, a contact sheet before the render, and −14 LUFS. New ideas it adds: the no-install timing fallback, the freeze/black QA pass, the "true or legend" check, stings, and continuous camera moves.

**Worth applying to Tavinho:** items 4, 6, 12, 16, 17, 18 and 20 above. Also: the last physical payoff lands on the final word (the vote cliffhanger "TIRA…"), light changes mark story beats (warm for normal, cold and blue at night for the panic), and a 6-frame white flash on time jumps.

**Conflicts:**
- "No captions unless asked" goes against Tavinho's captions, one word at a time.
- "Prefer continuous moves; hard cut only on place or time jumps" goes against Tavinho's ~1 s cuts (use it for Hoot only).
- Music fixed at 50% of the voice (−6 dB) with no ducking is much louder than our ducked bed. Test it by ear before adopting it.
- "Do everything without stopping" is covered in section 4.
- Its rules against copying, against real living people, and against brand mascots match ours.
