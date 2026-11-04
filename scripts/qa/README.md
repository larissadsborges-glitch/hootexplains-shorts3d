# Pre-render QA checks

Catches our recurring review mistakes **before** a full render, in a few minutes instead of an hour.

```bash
node scripts/qa/check.mjs awake1                 # full check + contact sheets  (~2–6 min)
node scripts/qa/check.mjs awake1 --no-sheet      # measurements + report only    (~1 min)
node scripts/qa/check.mjs awake1 --from 25 --to 35   # just a time range
node scripts/qa/selftest.mjs                     # unit tests of the check logic (no browser)
```

Output goes to `out/qa/<videoId>/`:

| file | what |
|---|---|
| `report.txt` | the readable report: errors and warnings as time spans, a pass/fail line per check, and the problems listed per annotated frame |
| `contact.png` | every 0.5 s frame, annotated (red = error, orange = warning, numbered as in the report) |
| `problems.png` | only the frames with problems, larger |
| `frames/` | full-size annotated jpgs of the problem frames |
| `report.json` | every problem and every raw measurement (for scripting) |

Exit code: 0 = no errors (warnings allowed), 1 = errors found.

The checker waits if a `remotion render` is running, because both compete for the 2 CPU cores. Pass `--no-wait` to skip the wait.

## What it checks

| check | rule | how it's measured |
|---|---|---|
| `character-edge` | Jake or Hoot partly outside the left/right/top edge (bottom crops are normal framing) | silhouette points of the real 3D character, projected with the real camera; points hidden behind something don't count |
| `face-covered` | a character's face > 20% covered by the other character (Hoot behind Jake) | ray casts from the camera to the face points |
| `face-hidden` *(warning)* | a face > 35% hidden by scenery (seat backs, walls, the laptop) | same ray casts; the occluder is named (a furniture box name when it matches) |
| `overlay-overlap` | two overlay blocks overlap (pills, headlines, counters, captions, term labels, title, badge) | real DOM boxes in Chromium with the real fonts. Blocks laid out together, such as the 2 title lines, are not compared with each other |
| `overlay-safe-width` | an overlay outside 5–95% of the width (the Hoot badge sits at 48 px by design and is skipped) | DOM boxes, including pop-in overshoot |
| `overlay-bottom-zone` | an overlay in the bottom 15% (platform UI) | DOM boxes |
| `overlay-on-face` | an overlay or caption covers > 15% of a visible face | DOM box ∩ the projected face box (visible part only) |
| `label-too-short` | a label on screen < 1.5 s | overlays sampled every 0.1 s, matched by text (numbers ignored, so counters keep one identity) |
| `counter-backwards` | a number in an overlay goes down (clock times wrap at midnight) | consecutive samples; allowed resets come from the scene's `qa.counters` |
| `held-object-gap` | an object in Jake's hand is > 3 cm from the hand surface | real scene graph: the hand sphere vs the vertices of the held object |
| `inside-furniture` | a body part deeper inside a furniture box than its tolerance (default 2 cm) | all character vertices vs the boxes in the scene's `qa.furniture` |
| `text-before-word` | a label shown > 0.3 s before its narration word is spoken (> 1 s = error, else warning) | label words are matched to `timings.json` words within −6…+10 s. Numbers and number words are equal (17 = seventeen) and plurals/-ing/-ed are stemmed. A label is fine if any of its words was already said. Ticking counters are skipped |

Thresholds live in `DEFAULTS` in `checks.mjs`.

## How it works

`check.mjs` bundles `page/entry.tsx` with esbuild into `build_qa/<videoId>/`. It never touches `build*` folders used for renders. The page renders the **real `<Short>` composition** with `@remotion/player`'s `<Thumbnail>` in headless Chromium (Playwright) at each sampled frame. What it measures is therefore exactly what Remotion would render:

- **Overlays:** every DOM block that paints text or an image. Its box is the union of its text line boxes and its background, border and image boxes, after transforms.
- **3D:** `WebGLRenderer.render` is wrapped to grab the live scene and camera, and drawing is skipped except for the contact-sheet frames, which keeps measuring cheap. Jake and Hoot are found because, **in the QA bundle only**, `src/mascot/Jake` and `src/mascot/Mascots` resolve to `page/shims/`. The shims wrap the real component in a transform-free `<group name="qa:jake|qa:hoot">`. The video bundle is unchanged, and no scene needs per-character annotations.
  - Jake's head, face, hands and held objects are identified from his geometry (head sphere r 0.15, hand spheres r 0.042, the hold group next to each hand).
  - Hoot's face is the front of his local box y 1.05–1.7.

Sampling: overlays every 3 frames (`--step`), characters/3D and annotated frames every 15 frames (`--geo-step`, 0.5 s).

## The optional `qa` export (per scene)

Add it to `src/scenes/<scene>/timeline.ts`. Nothing in the video uses it. It may be an object or a function `(T, timings) => object`:

```ts
export const qa = (T: MyTimeline) => ({
  // world-space boxes the characters must not sink into; tol = allowed depth in metres (default 0.02, 0 for thin panels)
  furniture: [{ name: 'chair seat', min: [x0, y0, z0], max: [x1, y1, z1], tol: 0.01 }],
  // counters that may jump back on purpose (e.g. a rewind) at these times
  counters: [{ match: 'HOUR', resets: [T.s('wake')] }],
  // occluder names to ignore for face-hidden (e.g. a glass window)
  ignoreOccluders: ['window glass'],
});
```

Derive the boxes from the same constants the scene uses (see `src/scenes/awake/timeline.ts`) so they stay in sync.

## Testing a change without touching the real files

`--override <src file>=<copy>` bundles a scratch copy in place of a source file. The copy's imports still resolve from the original folder.

```bash
cp src/scenes/awake/timeline.ts /tmp/x/timeline.ts   # edit the copy
node scripts/qa/check.mjs awake1 --override src/scenes/awake/timeline.ts=/tmp/x/timeline.ts --out /tmp/x/qa
```

## Known limitations

- Characters other than Jake and Hoot (e.g. the sphere-head passengers) are not checked. A new character needs a shim like `page/shims/Jake.tsx` (a wrapper group) plus its face rule in `characterPoints()`.
- Edge and occlusion checks use a subsample of vertices (~260 body + ~150 face per character), so tiny slivers of a few pixels can be missed. Transparent materials (opacity < 0.5) and back-side-only meshes are treated as see-through.
- Furniture checks only know the boxes you declare. Curved or rotated furniture needs a box that fits it well enough.
- Held-object check is Jake-only (`holdR`). Hoot's pencil is part of his wing.
- Text-to-narration matching is word-based: a label whose words never occur in the narration (e.g. "SOURCE: CDC") is not checked, and synonyms ("drunk" vs "drinking") don't match.
- Overlays drawn inside the 3D scene (canvas textures such as phone screens) are not text boxes.
