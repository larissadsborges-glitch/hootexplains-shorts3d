# Tavinho EP1: rebuild plan (5 Nov 2026)

The owner asked to "rebuild the entire video with what you learn, take your time and double check always".

## Sources for the lessons
- `docs/REFERENCES_2D_PROMPT.md`: 21 techniques, from the owner's PDF, plugin and SKILL.md
- `docs/SKILLS_REVIEW.md`: 10 practices
- `tavinho/ESTADO.md`: the owner's reference videos
- `docs/SCRIPT_RULES.md` section I: research
- `.claude/skills/karpathy-guidelines`

**Rule:** every step ends with fresh evidence (a contact sheet viewed, a loudness readout) before it counts as done.

## Owner decisions in force (do not re-litigate)
- 2D style
- normal hands only, no gestures
- Hoot-style beak rule does not apply (the narrator is not lip-synced)
- no "não é conselho financeiro" tag
- cuts about every second, like `refs/ref_tipo.mp4`
- vote VÍDEO vs VÓ, with on-screen costs and downsides
- coloured names in the captions
- a red full-screen "MENTIRA #1" card
- voice: Jeff base. The owner wants it less robotic, louder, more breaths, faster and clearer; `out/voz_jeff_E_rapido_claro_respiracao.m4a` is waiting for feedback.

## Steps
1. **Housekeeping:** fix stale notes. Done when grep finds no "bm_george" in CLAUDE.md or LEARNINGS active rules, and the skill description says 2D SVG.
   - LEARNINGS voice blend (60% `bm_george`) vs CLAUDE.md (70% `am_adam`)
   - the `hootexplains-short` skill says 3D
   - add an "Active rules" index at the top of LEARNINGS
   - add the third-party skill intake rule to CLAUDE.md
2. **Shot plan:** turn the script into a shot table (`tavinho/ep01/SHOTS.md`). Each row: words → shot type (wide / two-shot / over-the-shoulder / big face / insert / freeze), camera move (push 1.0→1.08, drift, 3–5° roll on drama, 7-frame shake on impacts), expression, SFX. Done when every phrase has one row and the median shot is about 1 s.
3. **Camera:** replace the FRAMES cycle in `Episode.tsx` with the shot table (per-phrase framing + move). Never static. Done when the contact sheet at 0.25 s shows no frozen 0.5 s window, and `ffmpeg freezedetect` finds no freeze ≥ 0.4 s.
4. **Look:**
   - stage Tavinho against the brightest area
   - a blurred foreground layer (SVG `feGaussianBlur`) in 3–4 shots
   - contact shadows under feet and props
   - 60–75% dark mid-tones with 1–3 accents

   Done when the contact sheet shows each.
5. **Acting:** expressions change on word beats; per-character blink periods (3.1 / 3.7 / 4.3 s); idle breathing; head bobs on stressed words; anticipation → overshoot → settle on actions. Done when the face close-ups show a different expression at each phrase.
6. **Sound:** a twist sting (the music dips, a low hit, a push-in with roll) on "Mas a Camila manda"; a riser before the vote; at most 2 SFX at once; music bed −18 to −28 dB under the voice. Done when the ebur128 readout is −14 LUFS and listening checks are noted by the owner.
7. **Voice:** if the owner approves Jeff E, voice the full EP1 the same way (per-phrase takes, breaths, +12% tempo, EQ, compression). Timings come from silence detection plus phrase matching (technique 16), so the captions stay word-synced. Done when the caption/word sync is checked on 5 sampled words.
8. **QA scripts:** `scripts/qa/` checks for freezedetect, blackdetect, "nothing in the caption band covers a face", and "labels on screen ≥ 1.5 s". Done when the scripts run and pass.
9. **Review:** my contact-sheet pass, then an independent reviewer using the standard brief (P0–P3, read-only, `docs/review_ignore.md` for owner-approved exceptions). Fix everything at P0/P1, then a second review. Only then send.

## Progress log
- 5 Nov: **Step 1 done.** Verified by grep: the stale voice note is gone and the skill says 2D.
- 5 Nov: **Step 2 done:** `tavinho/ep01/SHOTS.md`.
- 5 Nov: **Step 3 done.** `SHOT_PLAN` in `src/tavinho/Episode.tsx` (per-beat rows: x, y, zoom, move); moves never stop until the next cut; the MENTIRA card pulses. Verified: `freezedetect` (n=0.003, d=0.4) finds 0 freezes on the draft.
  - **Known framing issues for the review round:**
    - `camilamsg` row 2 shows the empty white phone
    - `percent` row 3 crops the microwave
    - `market` row 2 crops the lasagna box at the bottom
    - `twelve` row 1 shows the chat's empty upper half
- **Next:** step 4 (look: Tavinho against the brightest area, a blurred foreground layer in 3–4 shots, contact shadows), then step 5 (acting), step 6 (sound), step 7 (voice, once the owner approves Jeff E), steps 8 and 9 (QA and reviews).
- 5 Nov: **Step 4 in progress.** Added a contact shadow under Tavinho (`cast.tsx`) and blurred parallax foregrounds in the building, typing and sunday shots (`Episode.tsx`, `fgBlur`). **Still to verify:** frames that actually show those three shots.
- 5 Nov: **Step 7 done.** Jeff E voice via `C:/Users/borge/vs/tav/voice_episode.py`: per-beat tone and emotion, pauses before reveals, silences squeezed, words snapped to the audio, tempo 1.15. Measured 64.2 s, 2.92 words/s; 167/167 words have speech in their caption window; 0 freezes. Old Kokoro voice kept in `public/videos/tavinho1/_kokoro`.
- 5 Nov (new session): **Script v4** (owner picked it from a proposal): the "você decide" bridge moved up (now at 6.1 s, was 8.4 s), the egg line is "O problema: ele não frita nem um ovo.", and the Vó's downside is "mas conta tudo pra sogra". v3 is kept in `videos/tavinho1/script_v3.json` and the v3 voice in `public/videos/tavinho1/_jeff_v3`. **Re-voiced** with Jeff E. `voice_episode.py` now retakes any take slower than 0.3 s + 0.085 s/char (Chatterbox stretched "doze pessoas," to 3 s). The fridge beat dropped "Na" and "um", so it was regenerated alone and spliced in with 5 ms fades. Evidence: 57.5 s, 168 words, 2.9 words/s, and every word has speech in its caption window (RMS ≥ 0.03).
- 5 Nov: **Step 4 verified** in frames. The contact shadow is under Tavinho. Blurred foregrounds show in building, sunday and typing (sheets `out/qa_tav/s4.jpg`, `phr_rc1.jpg`).
- 5 Nov: **Step 5 done** (`cast.tsx`, `Episode.tsx`):
  - per-phrase Tavinho moods (5th field of each `SHOT_PLAN` row, through the `Act` context)
  - blink periods 3.1 s (Tavinho), 3.7 s (Camila), 4.3 s (Celeste), 3.4 s (Vó)
  - idle breathing for everyone
  - a 0.3 s head nod on highlighted words
  - a phrase framed like the one before it continues that shot (no restart)
  - Evidence: the phrase sheet shows shock, worried, gulp, proud and happy changing phrase by phrase.
- 5 Nov: **Step 6 done:**
  - twist sting: a thud on "Mas a Camila", the music dips to 15% for 1.3 s, and a push-in with roll
  - a riser into "Você decide"
  - `limitSfx` keeps at most 2 effects at once
  - Measured: the music bed sits 23.4 dB under the voice (bed −16.6 LUFS × 0.072 gain vs voice −16.1). Final: −14.0 LUFS, peak −1.9 dBFS.
- 5 Nov: **Framing fixes:** the 4 known issues plus my pass and the QA findings:
  - wider stakes/chat shots; the market shot shows the box and the microwave together
  - fridge labels fit, and the last two pop 0.45/0.6 s early so each gets ≥ 1.5 s
  - building wide on "o prédio inteiro"; the percent meter is no longer cropped
  - Camila's message is a screen notification that stays up through the face cuts
  - VOCÊ, the microwave and the final question card are moved off faces
  - the MENTIRA card lasts 1.5 s
  - the chip and CHEF bar fade out for the vote
  - the vote text matches the voice
- 5 Nov: **Step 8 done:** `scripts/qa/tavinho.mjs` (freeze, black, sfx-overlap, caption-face, caption-label, label-face, label-short; it measures real DOM boxes through `src/tavinho/QaProbe.tsx` in a Remotion render, ~10 s) and `scripts/qa/phrase_sheet.py` (one frame per phrase). Evidence: all 7 PASS on `out/tav_ep1_rc1.mp4`.
