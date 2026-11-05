---
name: hootexplains-short
description: Build, review and deliver a Hoot Explains (or A Vida do Tavinho) 2D cartoon Short in the house style (flat SVG in Remotion, src/toon2d and src/tavinho), from topic to post kit.
---

# Hoot Explains Short

Page: Hoot Explains (@hootexplains), a general page covering how things work, your body, and money series.
- **Hoot:** the owl host and narrator (brown, navy glasses, teal bow tie, pencil). He has ONE beak, which opens with the voice, and he always faces the camera.
- **Jake:** a recurring human character who lives the story.
- **Audience:** US, with metric units shown on screen.

## Before you start
- Read CLAUDE.md, then docs/SCRIPT_RULES.md (MANDATORY for every idea, title and script), docs/LEARNINGS.md (the last sections first), docs/GAME_PLAN.md, docs/LAUNCH_PLAN.md and docs/COMPETITOR_SCAN.md.
- Propose 3–8 titles and let the user pick. Score each for: stakes, a "you" connection, the named person someone would send it to, proven on other pages, can become a series.

## Script rules (summary)
- **First frame:** shows the payoff or the action.
- **Hook line:** under 12 words, containing the title phrase.
- **Captions:** visible from the first second.
- **Beats:** linked with "but" or "therefore". Keep an open loop at every moment.
- **Re-hooks and pacing:** a re-hook every 10–15 s, and a visual change every ~2 s.
- **Numbers:** make every one concrete. Myth, then truth.
- **No timeline jumps:** bridge them.
- **CTA:** mid-video at peak action. End on the punchline, with one specific closing ask.
- **Length:** 30–45 s (stories up to 60 s).
- **Sources:** every fact is sourced. Health: "don't try this". Money: "not financial advice".

## Workflow
1. **Research:** save a BRIEF.md with sources in videos/<id>/.
2. **Script:** write script.json (see videos/awake1/script.json).
3. **Voice:** run `python3 scripts/tts.py videos/<id>/script.json`, then `python3 scripts/mouth.py <id>`, then a pause scan.
4. **Scene:** build it in src/scenes/<id>/ and register it in src/Short.tsx.
5. **Preview:** a 10 s preview for any new design or characters.
6. **Stills:** check them with scripts/sheet.sh, and the automated checks in scripts/qa when available.
7. **Render:** `scripts/render.sh <id>`.
8. **Review twice:** your own pass (a sheet every 0.5 s plus a loudness scan) AND an independent review agent. Never send before both pass.
9. **Deliver:** the upload mp4, the cover and the post kit.
10. **Learn:** update docs/LEARNINGS.md.

## Talking to the user
- Give short updates, with a text progress bar when asked.
- Never send the user's email anywhere.
