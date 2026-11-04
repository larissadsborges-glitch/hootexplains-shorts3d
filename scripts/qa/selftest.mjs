// Unit tests for checks.mjs on synthetic measurements (no browser): node scripts/qa/selftest.mjs
import assert from 'node:assert/strict';
import { canon, checkSample, checkSeries, counterKey, mergeSpans, captionAt } from './checks.mjs';

const words = (list) => list.map(([word, start]) => ({ word, start, end: start + 0.3 }));
const timings = {
  handle: '@hootexplains', duration: 20,
  hook: { line1: 'WHY', line2: 'THIS?' },
  beats: [{ start: 0, end: 10, words: words([['Hour', 1], ['17.', 1.4], ['His', 2], ['reactions', 2.3], ['are', 2.7], ['slow', 3.5], ['like', 4], ['drinking.', 5]]) }],
};
const item = (text, x, y, w, h, extra = {}) => ({ text, hasImg: false, fontSize: 40, opacity: 1, parent: Math.random(), box: { x, y, w, h }, ...extra });
const stat = (o = {}) => ({ n: 100, onVis: 80, onOcc: 0, off: { left: 0, right: 0, top: 0, bottom: 0 }, offOcc: 0, behind: 0, occBy: {}, box: { x: 400, y: 600, w: 200, h: 400 }, ext: { x: 400, y: 600, w: 200, h: 400 }, ...o });
const types = (ps) => ps.map((p) => p.type).sort();

// text helpers
assert.equal(canon('seventeen'), '17');
assert.equal(canon('17.'), '17');
assert.equal(canon('twenty-four'), '24');
assert.equal(canon('Reactions'), canon('REACTION'));
assert.equal(counterKey('DAY 1 OF 3 · 11:30 PM HOUR 16'), 'DAY # OF # · TIME HOUR #');
assert.equal(captionAt(timings, 2.35), 'Reactions');

// clean frame: nothing to report
assert.deepEqual(checkSample({ t: 6, overlays: [item('A PILL', 300, 300, 400, 60)], chars: [{ id: 'jake', body: stat(), face: stat({ n: 20, onVis: 20, box: { x: 450, y: 620, w: 80, h: 80 } }) }], held: [], furniture: [] }, timings), []);

// overlap + safe width + bottom zone
let p = checkSample({ t: 6, overlays: [item('ONE', 300, 300, 400, 60), item('TWO', 350, 330, 400, 60), item('WIDE', 20, 500, 600, 60), item('LOW', 300, 1700, 300, 60)] }, timings);
assert.deepEqual(types(p), ['overlay-bottom-zone', 'overlay-overlap', 'overlay-safe-width']);
// siblings (same parent, e.g. the two title lines) never count as overlapping
p = checkSample({ t: 6, overlays: [item('WHY', 300, 300, 400, 80, { parent: 1 }), item('THIS?', 300, 370, 400, 80, { parent: 1 })] }, timings);
assert.deepEqual(p, []);
// the caption is recognised and checked against faces
p = checkSample({ t: 2.35, overlays: [item('Reactions', 380, 640, 300, 110, { fontSize: 100 })], chars: [{ id: 'hoot', body: stat(), face: stat({ n: 30, onVis: 30, box: { x: 400, y: 650, w: 120, h: 100 } }) }] }, timings);
assert.deepEqual(types(p), ['overlay-on-face']);
assert.match(p[0].msg, /^caption covers \d+% of Hoot's face/);

// character half off the left edge; Hoot's face covered by Jake
p = checkSample({ t: 6, overlays: [], chars: [
  { id: 'hoot', body: stat({ onVis: 40, off: { left: 30, right: 0, top: 0, bottom: 0 } }), face: stat({ n: 30, onVis: 10, onOcc: 20, occBy: { jake: 20 } }) },
] }, timings);
assert.deepEqual(types(p), ['character-edge', 'face-covered']);
assert.match(p[1].msg, /Hoot's face 67% covered by Jake/);
// a bottom crop alone is normal framing
p = checkSample({ t: 6, overlays: [], chars: [{ id: 'jake', body: stat({ off: { left: 0, right: 0, top: 0, bottom: 50 } }), face: stat({ n: 20, onVis: 20 }) }] }, timings);
assert.deepEqual(p, []);

// held object + furniture
p = checkSample({ t: 6, overlays: [], held: [{ id: 'jake', hand: 'right', gap: 0.08, screen: { x: 500, y: 900 } }, { id: 'jake', hand: 'left', gap: 0.0, screen: { x: 500, y: 900 } }], furniture: [{ id: 'jake', part: 'hips/thigh', furniture: 'chair seat', depth: 0.05, n: 12, box: null }] }, timings);
assert.deepEqual(types(p), ['held-object-gap', 'inside-furniture']);

// series: a 0.6 s label, a counter that goes 7 -> 8 -> 6, a reset that is allowed, a label shown 2.2 s early
const samples = [];
for (let i = 0; i <= 100; i++) {
  const t = i * 0.1, ov = [];
  if (t >= 6 && t < 6.6) ov.push(item('BLINK', 300, 300, 300, 60));
  const n = t < 3 ? 7 : t < 4 ? 8 : t < 5 ? 6 : 7;
  ov.push(item(`TOWERS ${n}`, 300, 400, 300, 60));
  ov.push(item(`HOUR ${t < 8 ? 24 : 0}`, 300, 500, 300, 60));
  if (t >= 2.2) ov.push(item('REACTION: TOO SLOW', 300, 600, 300, 60)); // "reactions" at 2.3: within tolerance
  if (t >= 0.7) ov.push(item('DRUNK DRIVING TEST', 300, 700, 300, 60)); // no word of it is spoken: not checked
  if (t >= 2.8) ov.push(item('SO SLOW', 300, 800, 300, 60)); // "slow" at 3.5 -> 0.7 s early
  for (const o of ov) o.parent = o.text;
  samples.push({ t: +t.toFixed(2), frame: i * 3, overlays: ov });
}
for (const s of samples) checkSample(s, timings); // classifies overlays in place
const series = checkSeries(samples, timings, 0.1, { counters: [{ match: 'HOUR', resets: [8] }] });
assert.deepEqual(types(series), ['counter-backwards', 'label-too-short', 'text-before-word']);
assert.match(series.find((x) => x.type === 'label-too-short').msg, /"BLINK" is on screen for only 0\.6 s/);
assert.match(series.find((x) => x.type === 'counter-backwards').msg, /"TOWERS 8" → "TOWERS 6"/);
assert.match(series.find((x) => x.type === 'text-before-word').msg, /"SO SLOW" appears 0\.70 s before "slow"/);

// merging per-sample problems into spans
const merged = mergeSpans([0, 0.1, 0.2, 0.9].map((t) => ({ t, frame: t * 30, problems: [{ type: 'x', sev: 'error', key: 'k', msg: 'm', metric: t, boxes: [] }] })), 0.1);
assert.equal(merged.length, 2);
assert.equal(merged[0].t1, 0.2);

console.log('selftest: all checks passed');
