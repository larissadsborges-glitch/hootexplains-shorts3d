# Learnings log

## Active rules index (read this first; details are below)
- **Style:** flat 2D SVG cartoons (`src/toon2d`, `src/tavinho`). The 3D style is only for old videos.
- **Hoot:** one beak, opening to half at most; pencil points only on key words; cheers and winks at the end.
- **Hands:** normal hands only. No pointing or other gestures (a pointing hand once read as a middle finger).
- **Layout:** keep props and faces out of the caption band and the bottom 20%; nothing beyond ~85% width at 35–80% height; labels on screen ≥ 1.5 s.
- **Editing (Tavinho):** cut on every phrase (~1 s); big face close-ups every 3–5 s; never a static frame.
- **Script:** name who and what in the first 3–5 words; bridge by ~5 s; story in order; answer the hook; no engagement bait; standalone videos.
- **Variety (owner, 5 Nov):** keep Hoot and Jake recognisable (faces, colours, Hoot's glasses and bow tie) but change places and outfits from video to video; new sets every time, and sometimes introduce him ("This is Jake.").
- **Money5 lessons:** tie every on-screen number to the same simulation as the script (a straight-line slide gave wrong yearly minimums); frame Hoot fully on the closing cheer and hold the wink to the last frame; a held prop wider than the hands keeps its text clear.
- **Money clarity (owner, 5 Nov):** label every amount with its period ("/MO", "A YEAR") and show a number that changes over time as a chart, not a single ticking value; the owner misread the money5 $85 as fixed. Size text boxes to the longest label (a jar label overflowed).
- **Review:** show fresh evidence before saying "done"; my contact-sheet pass, then an independent review; fix P0/P1 before sending.
- **Windows:** short paths (`C:/Users/borge/hoot`); `PYTHONUTF8=1` for the voice scripts; FFmpeg and Python in `C:/Users/borge/.hoottools`.

A running record of what went wrong, what fixed it, and ideas to decide on.
Read this before starting a new video; add to it after every render and review.

## 4 Nov 2026: owner's PC + switch to the 2D cartoon style

- **Style decision (owner):** videos are now **flat 2D vector cartoons** drawn as SVG in Remotion (`src/toon2d/`): dark ink outlines, flat colours with one cel-shadow tone, big expressive heads, story-telling room details. The owner disliked the 3D characters ("everything is round", tube legs) even after a cel-shaded + ink-outline pass (`style: 'toon'` in `StylePass.tsx`, kept as an option). Their reference was a viral 2D cartoon reel. Owner on the first 2D test: "it's perfect, I love it". Use our own characters; never copy a reference's character.
- **2D parts to reuse:** `Hook2D.tsx` (room, sitting Jake, `JakeHead` with brows/smile/sad/look, `Hoot2D` with one beak driven by `timings.mouth`), `parts.tsx` (`place()`, `Limb`, `Hand`, `JakeStanding` with hat option, `Fish2D`, `Shoes2D`, `Merchant`), `scenes.tsx` (`Market2D`, `Table2D`). Composition `Look2D` (Root.tsx) runs the money scene in 2D with the normal overlays, SFX and music.
- **Layout rules learned in 2D:** keep held props and key objects above the caption band (62–68% height) and out of the bottom 20% (Instagram UI). Hoot needs his own clear spot per shot (on books, on the awning end, on the table edge); a middle-of-the-counter perch got hidden by the fish. With fast word-by-word reveals (0.6 s apart), zoom close (×1.75) and whip the camera to each item as it is spoken; a slow pan missed every item.
- **Thumbnail:** `HootBadge`'s pop now starts 8 frames early so frame 0 already shows the tag. Keep blinks out of the first 1.5 s.
- **Windows PC setup:** project at `C:/Users/borge/hoot/hootexplains-shorts3d` (the app's scratch path was too long: Windows' 260-character limit broke git clone, uv's Python and Remotion's Chrome). Python venv `C:/Users/borge/.hoottools/venv`, FFmpeg `C:/Users/borge/.hoottools/ffmpeg` (winget installs were invisible to the app). Render with `--gl=angle` on the GTX 1050 Ti: a 12 s full-res 2D preview renders in ~18 s. Helpers: `scripts/draft.ps1 <id> <lastFrame> <sheet> [composition]` (half-size draft + 0.5 s contact sheet) and `scripts/compare.ps1` (two styles side by side).
- **Script structure (owner):** a shock hook must be followed by an explicit bridge ("Let's go back to the start") and an explicit answer later; jumping from the hook straight into history confused the owner. Tell the story in order and answer the hook's question by name.
- **Hoot (owner):** the beak looked bad when it opened wide (the lower half detached), so it now opens to half at most. Constant pencil waving read as a tic and looked like a pencil stuck in Jake's hair; Hoot now rests and points the pencil only on key words.
- **Review rounds that paid off:** labels needed ≥1.5 s on screen (stacked cards that stay up beat the one-by-one pills); props must not be covered by labels or by Hoot; years shown must be sourced ("LONG AGO" instead of an invented 3000 BC); the closing ask must state the question on screen for sound-off viewers.
- **Windows + accents:** run the voice scripts with `PYTHONUTF8=1`, otherwise Python reads script.json as cp1252, the TTS reads mojibake ("VocÃª") and the timings carry broken words. `cleanWord`/captions now keep Unicode letters (`\p{L}`), so word cues like "vó" and "limão" work.
- **Tavinho format (vote series):** use phrase captions (2–4 words) low on screen (~74%), keep the punchline props clear of them, and put both sides of the vote's trade-off on screen; viewers watching muted can't vote on a cost they never saw.
- **3D toon pass gotcha:** material/geometry changes made in a `useLayoutEffect` after the canvas has drawn don't show in a single still; call `gl.render(scene, camera)` at the end of the pass.

## Standing rules (from the user)

- **Hook + promise:** the first 1–2 seconds must tell viewers what they'll get by staying to the end (e.g. "how to build a bridge that won't fall"). Use both spoken words and on-screen text, with motion from frame 0.
- **Retention all the way through:** from the hook to the end, something new must catch the eye every ~2 seconds (a cut, an event, a sound, a label), and the payoff comes at the end. Give viewers no dead moments that make them want to leave.
- **Channel handle:** @hootexplains (on-screen, top right).
- **Voice (superseded):** the early videos used Kokoro 60% `bm_george` + 40% `bm_fable`. The current Hoot voice is in CLAUDE.md (70% `am_adam` + 30% `am_michael`). Tavinho uses Chatterbox (Voice Studio, Jeff base); see `tavinho/ESTADO.md`.
- **Every narrated line has an on-screen action at that moment** (from the v1 review).
- **Target length is 1.5–2 min** (Shorts/Reels allow 3). Structure each video as acts with a re-hook every 15–20s ("but there's a catch…"). Perfect the format on short segments first, then chain segments into full videos. Expect ~45 min render time here for 2 min.
- **Audio mix:** the voice is always on top. Effects are at 45% and dip to 60% of that while the narrator speaks. Music is a light, playful explainer bed at 16% that dips to 45% under the voice. Levels live in `MIX` in `src/audio/Sfx.tsx`. The user found v2's effects too loud.
- **Music is generated in code** (`scripts/make_music.py`), so it's copyright-free. A library track can replace `public/music/bed.wav` later.
- **Audio-only previews are cheap:** `npx remotion render build Short out/x.wav --codec=wav` takes ~1 min. Use them to check the mix without a video render.
- **Review every prototype before sending it (user rule):** after each render, check a contact sheet of the whole video against all the standing rules: the hook sound-off test, one unbroken shot for 0–3s, a "but…" every 15–20s, the subject filling the middle third, labels on spoken words and inside 5–80% of the frame width, script logic, and audio. Fix what's found, or list it clearly alongside the video.
- **Save tokens without losing quality:** render in the cloud workspace, but only report at start and finish (no progress bars). Check low-res stills before any full render. Run the independent review only on bigger versions. Keep messages short.

## Process

- **Workflow:** script.json → `scripts/tts.py` (voice + word timings) → Remotion render → independent review by a fresh agent → fixes → final render.
- **Review before delivery:** every finished render is reviewed by a fresh agent against the reference style and Shorts best practice before the user sees it.
- **Subagents:** use them for independent parallel work (new scenes, prop libraries, scripts, fact checks). Don't use them for the tight render/look/fix loop.

## Environment (cloud workspace)

- HuggingFace and the Whisper model host are blocked. The Kokoro voice model downloads from GitHub releases (`thewh1teagle/kokoro-onnx`, `model-files-v1.0`). Word timings are estimated per beat instead of coming from Whisper.
- There's no GPU. Render with `--gl=swangle` and point Remotion at Playwright's headless shell via the `REMOTION_BROWSER` env var. A full-res 3D frame takes about 0.8s with `--concurrency=2`: 15s of video (447 frames) rendered in 6 min, so a 60s short should take ~25 min. The first estimate (10s/frame) came from a still that included bundling and browser start-up, so time real renders instead.
- Render with normal logging (not `--log=error`). Otherwise there's no progress to report, and a silent render had to be restarted.
- Remotion needs a `tsconfig.json` at the repo root or it refuses to run.
- Bundle once (`npx remotion bundle`) and render stills from `build/`. Re-bundling for every still wastes about 5s each.

## Mistakes → fixes

| # | Video | Problem | Fix |
|---|-------|---------|-----|
| 1 | bridge-poc | The "approach" shot framed the bridge from the side at a distance, so the hero object barely showed in a vertical frame | Shoot along the bridge axis so it leads into the frame (portrait favours depth, not width) |
| 2 | bridge-poc | Planks dropping from 2.5 units looked like floating benches among the trees | Shorter drop (~1u) and appear near the camera first |
| 3 | bridge-poc | Shooting along the bridge from road level put the bank abutment huge in the foreground | Raise the camera (~4.5u) and aim down past the abutment |
| 4 | bridge-poc | The sunk car's roof stayed visible at the surface into the next beat | Sink faster (accelerating), and hide below -2.6 |
| 5 | bridge-poc | Sky and fog were washed-out grey next to the reference's saturated blue | Sky top `#2a7fe0`, horizon `#9fd2ff`, fog `#b4dcff` |
| 6 | bridge-poc | The beam fell from far above the frame, so the beat showed an empty river | Drop from y=7 over 0.9s; its shadow appearing first reads as anticipation |
| 7 | bridge-poc | Portrait frames are narrow, so long horizontal objects get cropped | Frame long objects diagonally or along their axis, not side-on |
| 8 | bridge-poc v2 | Hook title at 84/112px wrapped onto 4 lines | Title text ≤ 66px for line 1 and ≤ 90px for line 2, with `nowrap`. Check stills before rendering |
| 9 | bridge-poc v2 | Water ripple patches at high contrast looked like a noisy checkerboard | Keep patches sparse (~10% of faces) and low contrast |
| 10 | bridge-poc v2 | Animating the terrain would have re-coloured the grass every frame, because the RNG was called a different number of times per branch | Draw exactly one random number per face, whatever the branch |
| 11 | bridge-poc v2 | Beam sag of 1.0 pushed the middle under the water, so it read as two broken stubs | Sag ~0.75 so it visibly dips but stays readable; pull the camera out to show both ends |

**Template pieces added in v2:** a shared timeline per scene (animation, sound cues and camera all derive from the voice timings), labels pinned to 3D points (`labelAt`), hook and outro title cards, a "whip-in" after every cut, sound effects generated in code (`scripts/make_sfx.py`, replaceable with real recordings), and `scripts/render.sh` (render + two-pass loudnorm to -14 LUFS).

## Review of bridge-poc v1 (independent agent)

Measured: -21.5 LUFS integrated (target -14, the reference's level). Captions start within ~30ms of the speech. Technically clean.

| Sev | Issue | Fix |
|-----|-------|-----|
| High | 7.5 dB too quiet | Final `loudnorm=I=-14:TP=-1:LRA=7` pass in the pipeline, every video |
| High | Weak hook: static aerial, 0.38s of silence before the first word | Hook text on frame 0, motion from frame 0, lead-in < 0.1s |
| High | Last line ("river gets wider") is never shown | Every line must be visualised. Widen the bank or show the beam sagging |
| Med | "Much stronger" not shown; beam half-cropped | Car drives across the unbending beam, shot along its axis |
| Med | Beam reads as floating, not resting on the abutments | Frame so both bearing points are visible |
| Med | Term label floats in the sky, away from its object | Anchor labels to the 3D object (project its position to the screen) |
| Med | Side shot wastes half the frame on flat water | Lower, closer, 3/4 angle; subject fills the middle third |
| Med | Water is a flat blue; distant hills are muddy pink | Stylised ripple patches on the water; tan or green hills |
| Low | 0.9s silent static tail; hard cuts everywhere | Trim or loop the ending; 4–6 frame whip transitions |
| Low | Caption pop starts too small | Start scale at ~0.75 |
| Low | Placeholder handle | Real handle once chosen |

**User feedback on v1:** the voice is too slow and monotonous. Kokoro has no emotion control, so energy has to come from speed (1.2–1.35), tight gaps (~0.06s), a different speed per line, and short punchy lines with "!" and "...". Comparison file: `out/voice/voice_options.mp3`. If that isn't enough, a paid expressive voice is the upgrade path.

**Rule of thumb from this review:** every narrated claim needs an on-screen action at that moment. If a line isn't visualised, cut the line or add the action.

## Review of bridge-poc v2 (self-review)

Fixed: loudness (-14.0 LUFS, peak -0.9), hook text + motion from frame 0, every line visualised, label pinned to the beam, a second car proves "stronger", the river visibly widens, whip-in cuts, sound effects, Part 2 teaser. Rendered 385 frames in 5.3 min.

Still to improve:
- **Hook is a promise without a picture:** an empty river under the title. Try a *cold open*: flash the crash (0.6s) first, then the title. The most dramatic moment first is the strongest retention move.
- **Splash beat is far away:** the cut to the wide shot happens while the car is still splashing. Hold the close shot ~0.4s longer or cut after the splash.
- **Widen payoff is subtle:** the beam sag is gentle. Add a crack plus a red stress glow in the middle, or have it snap, so "twice as wide" lands.
- **BEAM label lingers into the next shot:** end labels at the cut.
- **Hook title is small** (66/90px): could be ~20% bigger with a dark backing strip for contrast over busy terrain.
- **Generated sound effects are placeholder quality:** real recordings plus a music bed would lift it a lot.

## Building bridge-full (first full-length version, ~59s)

| # | Problem | Fix |
|---|---------|-----|
| 12 | A deck only 0.8u above the water hid the pier underwater in the normal shots | Raise the deck (DECK2 = 1.6) from act 3 on; the abutments grow up as the new beam arrives. Keep structural parts *visible above the water* |
| 13 | Labels appeared at the start of their beat, before the object existed | `labelWord` in the script syncs the label to the spoken word (e.g. PIER on "middle") |
| 14 | "EXPANSION JOINT" at 106px ran off the frame | Auto-size labels: `size = (900/len − 4)/0.8`, capped at 124px |
| 15 | Recap shots reused close-ups that cars drive straight through | Recap uses only exterior, mid-distance shots |
| 16 | `sheet.sh` aborted on a frame past the end | Keep preview frames < duration × 30 |

**Template pieces added:** cross-section view (clip plane on terrain/water/trees plus a cut-face mesh with mud/rock layers and pebbles, tagged "CROSS-SECTION"), per-beat `hold` pauses after big moments, label anchors per beat, a scene registry (`scene` in script.json), and scene-specific overlays (summer/winter grade, recap checklist).

## Review of bridge-full v1 (independent agent)

Verdict: closer to the reference than v2 (structure, cross-section). **Biggest gap: the hero object is often small and distant just when the narration talks about it.** The reference keeps the bridge large in frame. Rule: whatever the line is about fills the middle third of the frame.

| Sev | Time | Issue | Fix |
|-----|------|-------|-----|
| High | 0–2.2s | Hook still shows an empty river (logged in v2, not fixed) | Cold open: 0.6s of the snap + splash, then the title over it |
| High | 12–15s | Beam sag and break unreadable (thin sliver, far away) | 3/4 mid-shot, exaggerated sag, red stress glow, crack, snap near the camera |
| High | 7–8.5s | Dead beat after the crash; beam only a cropped edge | Start the drop on "So", shadow already in frame, framed on the gap |
| Med | 42–44s | "Tear itself apart" isn't shown | Visible stretch, then a jagged crack with a red flash |
| Med | 40–55s | No re-hook in the last 15s; road/rail act has no stakes | "But one more danger…" + a car bouncing off the guard rail |
| Med | 15–17, 33–35s | Pier / pile cap < 15% of the frame | Push in so they fill the middle third |
| Med | 29–30s | PILES label under the right-side buttons | Clamp label anchors to x ≤ 80% |
| Med | 53–54s | Recap checklist small, last item late | ~2× bigger, centred, each item done by its word |
| Low | 18–35s | CROSS-SECTION tag and ROCK label small | 2× tag, stronger layer contrast, sinking arrows like the reference |
| Low | 25.5–26.2s | Audio gap (−29 dB) | Thud/rumble as the bridge hits bottom |

Works: word-synced captions within safe zones; cross-section teaching (mud → sink → piles → rock); the ending loops to the opening title with the finished bridge.

## Script logic review (user feedback on bridge-full v1)

The user caught that the recap ("Planks ✗ Beams ✓ …") mixed failures with ingredients, and that some lines didn't connect. **Rule: before any render, read the whole script top to bottom as a viewer would and check:**
- each line follows from the one before (cause → effect; a failure is named before its fix)
- no word is reused confusingly next to an event (e.g. "drop in a beam" right after the car **dropped** into the water)
- every on-screen label is a word the narrator actually says
- facts are accurate in plain words ("expands", not "grows"; the pier sits on piles, not on stone)
- no phrase repeats in back-to-back lines ("solid rock" twice)
- recaps list what the finished thing *is made of*, all consistent

| # | Problem | Fix |
|---|---------|-----|
| 17 | Exaggerated sag pushed the beam under the opaque water, so the snap shot showed an empty river | With a low deck, cap sag so the beam stays above water (~0.75u total); show stress with a red glow instead of depth |

## Video 2: house (from the second reference, same creator)

Reference pattern: a permanent cross-section (house cut open in front, soil layers below), a chain of failure → fix every 5–6s, an everyday analogy mid-video to reset attention, and a yellow label for each term. Our version: "How to build a house that won't crack". The analogy is our own (a sugar cube in coffee instead of their napkin).

| # | Problem | Fix |
|---|---------|-----|
| 18 | A crack drawn on a wall the camera can't see (hidden by the side wall) | Before choosing a shot, check the event's surface faces the camera |
| 19 | An object inside a container (cube in cup) was hidden by the container walls | Film containers from above, and make the key object stick out of them |

### Review of house v1 (independent agent)
Verdict: closer to the reference than the bridge in structure and script; ~60% there. **Biggest gap (again): key events are too small and too faint at the moment they're narrated.** Rule upgrade: *every failure gets drama: a big tilt, a thick jagged crack, a red flash and a shake, framed in the middle third.*

| Sev | Time | Issue | Fix |
|-----|------|-------|-----|
| High | 6–9s | Sink and crack don't land (thin line, small arrow, house cropped) | 3/4 shot, house in the middle third, visible tilt, thick crack + red flash + shake |
| High | 2–5, 16–27s | House and footings small; half the frame is soil | Tighter "front" shot: ~2 soil layers visible, not 4 |
| High | 34–36s | Sugar cube still white while "water climbs" is said | Start the brown rise at the dip and make it faster; closer, higher camera |
| Med | 41–45s | Rain faint; nothing pours off the roof; wet ground late | Heavier rain, streams from the eaves, wet patches start on "soaks" |
| Med | 47–50s | Apron a thin strip in a wide shot; arrow by the right edge | Side close-up on "border" with a pour; arrows < 80% width |
| Med | 24–25s | GRADE BEAM label clipped at the left edge | Label width estimate too small (letter spacing + rotation): use ×0.95 and clamp 10–80% |
| Med | 9–11, 25–27s | Dead spots (empty field; static shot) | SOFT SOIL lands with the cut + the ground squishing; push-in on "solid concrete" |
| Low | 27–29s | Tag "6 MONTHS LATER" vs spoken "Months later"; empty green band under the wall | Tag text = spoken words; reframe |

**v2 notes:** the label sizing and edge limits could contradict each other (a label wider than the allowed band ended up off-screen). Fixed generically: size labels to ≤72% of the frame width, and if the edge limits conflict, centre the label. Red full-screen flashes should be subtle (~0.28 opacity at the edges only).

**Template pieces added:** flat-ground cross-section (`GroundSection`), procedural brick texture and sign texture (canvas), a rain system, a generic `Recap` driven by `recapItems` in the script, new sounds (rain, dig, pour, brush, drip), and camera shots that continue smoothly across consecutive beats with the same shot.
**Speed:** the full house video (6 acts, all new assets) went from reference to render in about 1 hour, because the pipeline was reused.

## Video 3: tunnel ("How tunnels are built under rivers"), first video with no reference

Built straight from the rules: a question hook over drama from frame 0 (the hole floods), failure → fix chain, mid re-hook ("But the river still pushes water in…"), payoff (train under a boat), CTA ("Would you ride it? Tell me in the comments.") + outro card. **31s**, a deliberately shorter cut.

| # | Problem | Fix |
|---|---------|-----|
| 20 | Wide section shot made the payoff (train) tiny | Payoffs always get a close shot; wide shots only for context |
| 21 | The machine's trailing gantry blocked the ring close-up | Keep secondary parts inside or behind the cut plane |

**v2 (user request: longer and realistic):** 59s, 21 beats, each a real construction step, verified against sources (TfL DLR Thames tunnel; Sika, Swina river slurry TBM): boreholes → launch/reception shafts with concrete walls → TBM lowered in pieces and assembled in the shaft → cutter head + shield → slurry pressure balances the water at the face → muck pumped out through pipes → thrust jacks push off the last ring → erector builds rings from precast segments → rubber gaskets + bolts → tail-void grout stops settlement → laser guidance → breakthrough into the reception shaft → fit-out (rails, lights, fans, drainage pumps) → trains.
**Rule:** for "how it's built" topics, check the real sequence with a quick search before writing, and show processes as they really happen (e.g. rings go in right behind the machine from the start, not when the narrator first mentions them). The user values realism over simplification.

### Self-review of tunnel v2 (59s)
**Better than past videos:** a question hook over action at frame 0 (bridge: statement over an empty river); a real, source-checked process (12 labelled terms, the most educational so far); a CTA built in; labels that follow moving objects; built in ~1h with no reference.
**Weaker than the house video:** less variety. ~25s (0:14–0:39) are the same framing (yellow machine + tube from the front), and there's only one real "but…" re-hook (water pressure at 0:16) before "months later" at 0:47. The house had an analogy and weather to break the pattern.

| Sev | Time | Issue | Fix |
|-----|------|-------|-----|
| High | 0:02 | **Cut to the wide section shot exactly at 0:02 again** (same mistake as the bridge). The flood becomes a small strip | The second beat keeps the hook shot. *Rule: seconds 0–3 are one continuous dramatic shot, no cut* |
| High | 0:14–0:39 | Monotonous framing for ~25s | Change the angle at least every ~3 beats: a look inside the machine, a top view, a person for scale |
| Med | 0:20–0:45 | No failure/re-hook for 25s | Turn grout into a mini failure: show the riverbed sagging *without* grout, then the fix |
| Med | 0:05–0:10 | Borehole beat is static and wide (thin lines) | Closer shot, drill rigs moving, core samples coming up |
| Med | 0:39–0:46 | Grout band and laser line too thin to read | Thicker + glowing; close-ups |
| Low | 0:49–0:52 | Fans and pumps tiny | Quick close-ups per item, matched to each word |
| Low | all | No sense of scale (real machines are ~10–15 m) | A tiny worker figure next to the machine; one number ("as tall as a 4-storey building") |

**User insight (most important hook lesson so far):** a dramatic opening that *doesn't relate to the title* doesn't hook. The flood was dramatic, but viewers didn't know what the video was about. **The hook must show the title's promise *as* the eye-catching image**, ideally the payoff itself (here: a train running *under* a river with a boat above), plus a curiosity question ("There's a train running under this river. How did they build it?"). The problem (the flood) comes second, once the viewer knows what we're building. Hook check: *if someone sees only the first 2s with no sound, do they know what the video is about, and want to know how?*

**Rule upgrades:** (1) the first 3 seconds are one unbroken shot; (2) in longer process videos, vary the camera angle every ~3 beats and put a failure or "but…" at least every 15–20s; (3) every thin detail (lines, bands) needs thickness, glow and a close-up; (4) add a scale reference for big machines.

**Template pieces added:** cut face with an opening that grows as the tunnel is dug (`TunnelSection`), half-tubes to look *into* tunnels, labels that follow moving objects (`labelAt: "tbmFront"` + scene `anchor`), camera shots that track a moving object, and drill/gush sounds.

## Performance data

### bridge-full (final), posted 1 Nov 2026
- **TikTok:** 630 views, 39 likes (~6%), 0 comments, 0 shares, 2 saves. Avg watch 16.7s of 62.6s (27%); 8.8% watched to the end; 0 new followers. **Most viewers left at 0:02.** The curve drops from 100% to ~40% in the first seconds, then declines gently (14% left at 0:48).
- **Instagram:** ~290 views, ~2 likes (user's estimate). **YouTube:** pending.
- **Diagnosis:** the middle holds viewers; the opening loses them. At 0:01–0:02 we cut from the crash (cold open) to an empty river aerial under the title, the least interesting picture in the video, right at the decision point. The hook line is a statement ("Here's how…"), not tension.
- **Rules from this:**
  - Keep the drama on screen for the first 3s. Never cut to scenery in seconds 0–3.
  - Hook = a question or stakes over the action ("Would you drive across this?"), then the promise in seconds 2–3.
  - Always end with a CTA that invites comments (a question or a keyword).
  - Test shorter cuts (~35–40s) to raise completion.
  - Use Instagram trial reels to test hook variants.

## References 3 & 4: retention structure + premium design (meta videos about making viral videos)

**Spanish "8 pieces" video (rollercoaster metaphor, bright white 3D):** a video people watch to the end has 8 pieces, always in this order, and skipping one halves retention:
1. **Hook:** breaks the pattern of what they were scrolling, so they stop.
2. **Intro / promise:** says what they'll get, so they "buckle up".
3. **Body 1:** something useful they didn't know (lightbulb).
4. **Re-hook:** the piece that really traps them, a line like "but that's not all…" that leaves a question.
5–7. **Repeat:** another loop, then the last body.
8. **CTA:** for the most interested viewers, tell them the next step. Closing meta-twist: "Did you notice? This video was built the same way, and you made it to the end."
→ **Our gap: we have no CTA.** Every video should end with one (follow for part 2 / comment a word).

**English "folder" video (dark premium motion graphics; the creator uses Claude + a folder of rules):**
- *Process:* a senior motion designer's rules live in a folder (hook rules, voice timing, sync rules). The AI writes, voices, renders and checks frame by frame before the human sees it. "Every picture lands exactly on its word." That's what our LEARNINGS file is, and it should become a packaged skill.
- *Why videos blow up:* platforms show a video to more people when viewers watch to the end. They visualise "people watching" as a particle field that thins out over the timeline. Hooked in the first second, kept moving until the last.
- *Design system:* near-black navy background (~#0a0e15) + gold/amber accent (~#d4b062) + white; thin hairline UI frames; small mono uppercase annotations with wide letter spacing ("FRAMES", "VOICE", "60 FRAMES PER SECOND"); big number counters with an icon (34M → 35M); 3D-tilted exploded UI layers; a timeline playhead; terminal mock-ups; vignette; lots of negative space.
- *Captions (both videos):* a **2-line phrase at the top (~15–20% from the top)**, not a single word mid-screen. Words light up as spoken (upcoming words are faint grey), and the key word gets a thin outlined box. Calmer and more premium than our big single yellow words, and it frees the centre of the frame for the visual.
- *CTA:* the end shows the comment section filling with the keyword ("FOLDER").

## Ideas to decide on

- **Sound design:** add music plus SFX (wood creak, snap, splash, concrete thud). This is probably the biggest retention win still missing.
- **Text hook in the first second:** e.g. "Why don't bridges float?" over the opening aerial shot.
- **Cutaway/cross-section mode:** the reference's signature shot (cutting the riverbed open to show pillars and piles). Build it as a reusable scene feature.
- **Loop ending:** the last frame flows back into the first, which encourages rewatches.
- **Metadata generator:** title, description and hashtags for YouTube and Instagram from script.json.

## Elevator v1 (video #1 from IDEAS) — review notes
- Falls only read if the camera HOLDS while the object drops. Never follow a falling object; freeze the follow height at the pre-fall value (hook) or the stop height (elseFails).
- Small mechanisms (safety wedges) must sit where the camera can see them: outside the cabin, below the floor, sized ~0.4 units, and the close-up must aim at them, not at the passengers.
- Status chips (SLOW MOTION etc.) collide with anchored labels at 15% top; put secondary chips at 4% top.
- render.sh / sheet.sh now export REMOTION_BROWSER themselves (a background shell without it tried to download Chrome and failed).
- Minor open item: captions sit over passengers' heads in the rope close-ups.

## Learjet v1 (news explainer, real crash) — notes
- News format: hook = counter dropping on a diving jet (one shot), then map → what happened → scale comparison → open question → respectful end. 90.6s.
- Tone rules for real tragedies: RECREATION tag the whole video, only sourced facts with attribution on screen, no cause implied, no victim names, no final radio words, impact only as distant smoke; calm white "9 LIVES LOST" (not yellow), dark tense music instead of the upbeat bed.
- Multi-place scenes: put each "place" far apart (x offsets of 1000) and only mount the active one; sky dome follows the camera; the sun light's target follows the camera target so shadows work everywhere.
- "Held jet + streaming clouds" (CloudStream with wrap) is the cheap way to show speed in the sky.
- Captions now keep thousands separators (10,000). Per-video music via "music" in script.json; hook title position via hook.top.
- Bugs caught in stills: shot target added TOWN offset twice (camera aimed at origin); clouds in the hook hid the jet (raise clear radius); white jet on light-grey fog has no contrast (darken in-cloud fog).

## Learjet v1 → v2 review (user feedback: some SFX too loud, "1 p.m." pause)
- **Never write abbreviations with dots in narration** ("p.m.", "U.S.", "e.g."): Kokoro pauses at each dot. Write it out ("one in the afternoon") or use letters without dots. Check every beat with the pause scan below.
- **Pause scan:** find silences > 0.35 s inside a beat in voice.wav; anything not at a sentence end is a bug.
- **Loudness scan:** compare the final mix vs the gain-matched voice in 0.25 s windows; any window where the mix is > 3 dB over the voice, or non-speech within 6 dB of voice peaks, is a too-loud SFX. Run it on every render before sending.
- SFX volume defaults for news/serious tone: impacts/rumbles ≤ 0.3, alarms ≤ 0.2 (sine, not square), sirens ≤ 0.22, radio clicks ≤ 0.45, scene whooshes 0.18, long beds (wind/jet) 0.35–0.5.
- Visual review catches: people spawned inside buildings (heads through roofs), jet cut by the frame edge (put the jet on the camera→target line), jittered low-poly mountains look like shards (keep jitter ≤ 7% of radius), emissive "stress" glow reads as a pink box above ~0.3.

## Sink v1 (first video in the "How everyday things really work" lane, with Hoot)
- New lane + mascot: Hoot (owl, glasses, teal bow tie, pencil), avatar on orange. Hoot reacts in-scene (pinches beak when it stinks, waves at the end).
- Format: problem → fix → new problem chain (straight pipe → gas → U-bend → siphon → vent → S-trap ban → evaporation → free fix → ring tip). Ends with a numbered "Which one did you know? 1–4" list to drive comments, plus "Part 2" tease for follows.
- See-through pipes + coloured particles (water blue, gas green, air white) explain flow without words.
- Avoid emoji/✓✕ glyphs in overlays: headless Chromium has no emoji font.
- Background render jobs must use run_in_background, not `&` (detached jobs get killed).
- A render bundles the code at its start: edits made during a render (bow-tie fix) aren't in that video.

## Brand change (2 Nov 2026)
- The page is now **Hoot Explains** (@hootexplains). Display name: "Hoot Explains | How Things Work". Future languages: @hootexplica.es and @hootexplica.br. The owl is called "Hoot" in every language.
- Every new script.json uses "handle": "@hootexplains". The video opens with Hoot in the first frame and a HOOT EXPLAINS tag, then a small Hoot badge (HootBadge overlay) stays on for the rest of the video.
- Only use "Part 2" when the next video truly continues the same story. Otherwise the CTA is a fun, answerable question plus "follow Hoot for more".
- Topics need hold power: danger, huge scale, or a "no way" moment (plane window at 35,000 ft, carrier landings, the Taipei 101 damper…). Ordinary objects like sinks don't hold attention.
- Never use pkill with a pattern that matches your own command line: it kills the shell. Kill by PID.

## RULES from 3 viral references (roof 15M, car 809K, jet 1M in 7h)
1. **Open with a question the viewer wants answered** in the first 1–2 s, with the subject on screen ("How can a plane fall 8 km in a minute?", "Renting or buying: which is cheaper?").
2. **Keep the voice continuous:** no dead air, 60–65 s for most topics.
3. **Something on screen changes every second:** counters, bars, timers, numbers ticking.
4. **Use everyday analogies and comparisons** (hand out of a car window, F1 car, your roof) instead of technical diagrams.
5. **Small labels and number chips;** no flashy effects.
6. **End with a comment driver:** an open mystery ("only the black box knows") or a question about the viewer's own life ("which do you have?").
7. **The page's top hits are A-vs-B topics** ("morning or night shower", "vape or cigarette", "renting or buying"), so make A-vs-B a regular format.
8. **A recurring mascot or face** brands the page (2 of 3 references; we have Hoot).
9. **Captions:** 5 of 8 references use phrase captions, but our centre-word style also hits 1.3M (ref #8), so it's optional. Test: switch to a short phrase at the TOP (2–5 words) with the current word highlighted in a box, instead of one big centre word.
10. **"Truth or myth?" / A-vs-B framing of an everyday habit** works (fuel tank, renting vs buying, shower time). End with a verdict that still leaves room to argue.
11. **AI-content labels don't stop virality** (two of the reference pages are labelled AI-generated).

12. **Topic framing:** ask about a weird thing people have SEEN ("Why does X do this?"), not a technical question ("why is it shaped like a U?"). The same U-bend topic got 666K when framed as "This water isn't dirt: without it your house would stink!" (a plain sink video got 26.9K).
13. **Show the proof on screen:** slow motion, a reference line, a counter, an experiment. The viewer should see the answer, not just hear it.
14. **Myth first, then the real answer** ("it's for balance… no, it's the eyes").
15. **Every video needs a cover:** a bold 2-line question in our yellow and white text, plus the subject (and Hoot). The profile grid should read like a list of questions.
16. **The CTA is a comment keyword** ("Comment KNEW IT if you didn't know"), plus a follow / like / save / send end card.
17. **Post caption:** "Save this and send it to someone who [specific person]." On Instagram, add a poll.
18. **Show sources on screen** for health and science facts (small "SOURCE: …" chip).
19. **Hook styles that work:** a weird observation ("Why does X do this?"), a myth ("Does X really…?"), a contrarian statement ("8 hours in bed isn't enough"), or A-vs-B.
20. **Simple visuals are fine** (one accent colour, clay look). Idea, hook and clarity beat detail.
21. **Series = followers.** Single explainers get views but convert few followers. A real continuing series (episode counter "DAY 1/7", same cover template, a decision question, "follow for day 2") is what turns viewers into followers (27K followers from 13 posts). Plan a recurring Hoot series alongside the one-off explainers.
22. **"You" POV plus decision questions** ("Would you open the door?") make comments into votes.
23. **Use a fixed cover template and title format** ("HOOT EXPLAINS: WHY ___?") so the grid looks like a series and people know what they'll get by following.
24. **List CTA:** "Which of these would you put in your house?" / "Which one did you know?" plus a poll.
25. **Reading Instagram numbers:** lowercase "m" = thousand (mil), capital "M" = million.
26. **Numbered list format** ("5 things on a plane that keep you alive") with **progress dots** at the top. Viewers stay to see all 5, and save rates are the highest of all formats (2.6%).
27. **CTA stack:** "Comment 1–5: which one surprised you?" + "Save this" + "Follow for more". In the post, add a poll: "Which topic should Hoot explain next?"

## Visual style upgrade (2 Nov 2026, user feedback: "too Minecraft")
- A global **StylePass** (src/style/StylePass.tsx) restyles any scene without rewriting it. Selected with `"style"` in script.json, a `style` prop, or `STYLE=real scripts/render.sh <id>`.
  - **blocky:** as authored.
  - **soft:** rounded boxes, smooth spheres and cylinders, smooth shading.
  - **real:** soft + RoomEnvironment image-based lighting, Neutral tone mapping, satin paint, dimmed fill lights, CSS saturate(1.18) contrast(1.06).
- The target look is "stylised realistic" (like the @datos.zip jet and the @construindoassim house): smooth, glossy, bright skies, still cartoon.
- **Check characters for clipping into furniture** in every shot (Hoot was half inside a seat back). Place characters from the furniture's real geometry (seat back at row x − 0.22, cushion top y 0.48), then re-aim cameras.
- Tools: `scripts/styletest.sh <id>` renders 10 s clips in all 3 styles plus a side-by-side; `scripts/sheet.sh` takes BUNDLE= and STYLE=.

### Render notes (plane window v2)
- An audio-only Remotion render (--codec=wav) still steps through every frame: it took about 1h, so get SFX levels right in the 10s test clip first.
- The loudness scan flags short gaps between words (voice under -35 dBFS) as "SFX louder than voice". Check the absolute level before changing anything: about -22 dBFS in a gap is just the music bed.
- Style choice: soft and real share one soundtrack, so the audio can be swapped onto either video stream without re-rendering the frames.

## Plane window v3 — user notes after posting (Nov 2026)
Posted as is (no re-render), but the shared Airliner model was fixed for future videos:
- **No "rocket engine" look.** A commercial jet has no exhaust on the tail. Our engine was wider at the back with a flat black front disc, so it read as a rocket nozzle, and the tail cone ended in a blunt flat disc. Fix: the turbofan is **wide at the FRONT** with an open intake (lip ring, dark fan, 8 blades, silver spinner), **narrow at the back** with a small grey exhaust cone, plus a pylon to the wing; the tail cone tapers to a small rounded tip. Cylinders are closed by default, so their end cap hid the fan: use `openEnded` + DoubleSide.
- **No livery panels that stick out.** The teal belly stripe was a curved panel set *lower* than the fuselage, so in close shots it looked like a green wall/flap on a white plane. Removed. Livery = white body, teal tail fin only. Any future stripe must sit flush on the skin (same radius + 0.005, same centre) and be checked in a close-up.
- **QA rule:** check every 3D vehicle against a real photo of the same type (engines, tail, nose, wheels): "would a pilot laugh at it?" Check it in BOTH the wide shot and the closest shot of the video.

## Airplane mode v1 (Nov 2026)
- Title chosen by the user: "Why does your phone need airplane mode on a plane?" (plain and direct beat the clickbait "Can your phone crash a plane?"; the crash question went into the hook line instead, answered honestly with "no").
- Facts checked before scripting: FCC 1991 ban (ground networks), pilot headset buzz (pilot quotes), no crash ever proven caused by a phone, FAA 2013 devices-in-airplane-mode rule, EU 24 Nov 2022 5G-on-planes decision (pico-cell + satellite). Sources go in the post kit for replying to comments.
- **Let viewers HEAR the problem:** the headset buzz plays in a 1.6 s `hold` after "Like this.", with a SOUND ON chip + bouncing bars. A sound demo is a natural re-hook.
- Title card now auto-shrinks long lines (`fit()` in Overlays.tsx, ~0.68 em per char, 960 px). Long hook lines were running off the screen.
- Phone screens are a CanvasTexture redrawn every frame (switch, signal bars, battery). Keep important screen text above ~58% of the frame height, or the captions (~62–68%) cover it.
- **Camera inside the room:** a close-up camera placed beyond a wall gives a flat grey frame. Check the camera position against the room bounds.
- **Featureless sphere heads have no front/back:** if you need to show what people are doing (phones on), put a glowing marker above each head instead of relying on small props in their hands.
- Don't let Hoot peek in at the frame edge: either frame him fully or hide him for that shot.
- Cockpit: seat backs must sit lower than the pilots' heads, or a rear camera sees only seats.

## Voice change (3 Nov 2026, user decision)
- **New house voice: Kokoro 70% `am_adam` + 30% `am_michael`, `lang: en-us`, speed 1.25** (1.2 for short dramatic lines). It replaces the British George/Fable blend: the target audience is the US, and the user noticed that many viral explainers use an "Adam"-style voice. Pure Adam sounded a bit rough, so the Michael mix smooths it.
- Process that worked: send a short sample file (each voice says "Option N" before reading the hook) and let the user pick by ear, then an A/B of the two finalists on 4 real lines.
- ElevenLabs is the planned upgrade when there's budget (expressive, American). Visuals re-sync automatically from timings.json, so a voice swap only needs TTS + re-render.
- Switching the voice changes every timing: stop any running render first (it'd be wasted) and re-check stills of the timed moments (buzz, counters, CTA).

### Airplane mode v1: review notes (2 passes)
- **Counters must only go up** when they count something cumulative ("towers reached"): use the running maximum, not the current value (it went 7→8→6→7).
- **Pills must fit:** ~40 chars at 0.85 scale is the max; "SOURCES: FAA · FCC · AIRLINE PILOTS" ran off the edge. Shorten instead of shrinking.
- **Frame 0 is the thumbnail:** the hook title's spring overshoot peaked right at frame 0 and touched the edges. Title now starts at tIn=-0.7 (settled by frame 0) and long lines fit to 880 px.
- **Fixing a few seconds doesn't need a full re-render:** render just those frame ranges (`--frames=a-b --muted`), re-encode every part with the same x264 settings, join with the concat demuxer (`-c copy`), and take the audio from the mastered file. A single ffmpeg filter graph with several trims of the same 1080p input ran out of memory (killed); separate parts don't.
- Rendering stills during a full render roughly halves the render speed (2 cores). Batch the still checks.

### Airplane mode v2: user + independent agent review (3 Nov 2026)
- **Inverted tail cone (since the plane window video!):** `cylinderGeometry(radiusTop, radiusBottom)` rotated +90° about z sends the TOP radius to -x. Ours put the wide end at the tail tip, so the back of the plane looked like a centre engine / rocket. Always check which end of a rotated cylinder or cone is which, in a close shot.
- **Headset band orientation:** a torus arc lies in its local x-y plane. For a head facing +x it must be rotated 90° about y so it runs ear to ear, not front to back like a mohawk.
- **See-through floors:** a cockpit floor that stopped short of the dashboard let the ground show through between the seats ("road under the plane"). Interiors need a closed floor and a closed area under the dashboard.
- **Parts must touch:** the satellite dome floated above the roof (sky visible between). Check every attached part has contact.
- **Eye level:** seated pilots must have their eyes above the glareshield.
- **Text must match the picture:** "SAVES BATTERY" over a draining battery contradicted itself. The label now matches what's shown ("SEARCHING DRAINS IT").
- **Process that worked:** the user asked for an independent agent to check every frame against their notes plus its own findings. It confirmed all 3 user points with crops and found 9 more. Do this for every video before delivery.

### Sleep Day 1: agent review (3 Nov 2026)
- Fact labels must appear when the matching number is on screen and stay at least 1.5 s ("17 H" showed at hour 21 for 0.5 s).
- Rooms need a ceiling: close shots angled upward saw past the wall top (a dark band across the frame).
- Desk props must not sit on the laptop; snacks must be instantly recognisable (an open chip bag with chips spilling out, not a box with a stripe).
- Close-ups: aim the camera below the face (target ~0.6 instead of 0.72) so the word captions sit on the body, not the beak.
- Make progressive tiredness visible: half-closed lids by hour 24, heavier on day 2, barely open on day 3.
- Never `pkill -f` a pattern that appears in your own command line (it killed the shell again, including the file edits in the same command). Put edit scripts in a file.

## Research night (3–4 Nov 2026): what changes from now on
- **Scripts:** every idea and script must pass SCRIPT_RULES.md (project: claude/hootexplains-script-rules.md) before production. Key rules: payoff or action in the first frame; a hook line under 12 words; "but/therefore" linking; an open loop at all times; a re-hook every 10–15 s; a visual change every ~2 s; numbers made concrete; CTA mid-video at peak action; end on the punchline and loop back; one specific closing ask; name the person it would be sent to.
- **Platform data:** under 60% "stayed to watch" rarely performs (Paddy Galloway, 3.3B views); Reels: skip rate in the first 3 s, then shares, then likes *(Reddit strategist, low confidence)*; old reels get second waves, so the back catalogue matters; trial reels: compare only with other trials.
- **AI label (IG, 1 Sep 2026):** only for accounts whose central identity is an AI-made person. Hoot is a cartoon mascot; keep the bio honest and never present Jake as a real person.
- **Production:** test a rigged glTF human for Jake (RobotExpressive CC0 and Mixamo humans are reachable on the three.js GitHub; other asset sites are blocked here); drei Outlines + ContactShadows are compatible; Rhubarb lip sync is downloadable; build automated pre-render checks (frame edges, label overlaps, hand contact, label duration); render on the user's GPU PC with --gl=angle.
- **User feedback this week:** Hoot has ONE beak (no separate mouth or nose); his beak must open with the voice; he faces the camera; characters should look animated and expressive; a real person (Jake) helps people relate; no big jumps in a story's timeline (bridge them); fresh at the start of a day; no characters sunk into furniture.

## Sleep Day 1: final render (4 Nov 2026)
- **Long renders:** background commands are stopped at the time limit (the 90-min default killed a full render at 94%). Render in halves with `--frames=a-b --muted`, set the max timeout, then concat and mux the mastered audio. Don't run zips or pushes while rendering.
- **Fixes after a review:** re-render only the changed frame ranges and splice them in (re-encode the splice once at CRF 16). This is much faster than a full render.
- **Arm paths, not just poses:** check the frames *between* poses. A stretch that lowers the arms forward sweeps the hand through anything in front (Hoot). Raise and lower the arms out to the sides, and keep Hoot more than an arm's length (~0.9 m) from Jake's shoulders.
- **Held props:** a flat prop (a pizza slice) turns into a line or a "cocktail glass" when seen edge-on. Use chunky, layered props (a sandwich) that read from every angle, overlapping the hand.
- **Independent review caught what my pass missed** (4 Nov): hands poking through the laptop lid in the very first frame, a yawn hand sinking into the head, an idle arm overlapping Hoot by the window, a 1.0 s fact label, and a label covering the hour pill. Lessons:
  - Check every desk pose for hands passing the laptop lid on the camera side. Rest pose: armL [0.55,-0.15,1.05], armR [0.6,-0.05,1.0].
  - No hand-to-head gestures (a yawn becomes an arms-up stretch).
  - Idle standing arms hang close to the body (roll ≈ 0.04).
  - Every fact label starts with its first spoken word, lasts ≥1.5 s, and carries its source.
  - Labels never sit at the 71–72% band where the hour pill lives.
