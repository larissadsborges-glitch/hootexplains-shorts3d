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
