#!/usr/bin/env node
// QA for the 2D Tavinho episodes (Remotion composition "Tavinho").
//   node scripts/qa/tavinho.mjs <videoId> [--video out/x.mp4] [--bundle build_m] [--step 3]
// Checks (exit code 1 if any fails):
//   freeze         ffmpeg freezedetect (noise 0.003, ≥ 0.4 s): no frozen picture          (needs --video)
//   black          ffmpeg blackdetect (≥ 0.1 s, pixel 0.10): no black frames               (needs --video)
//   caption-face   a caption covers > 15% of a visible face
//   caption-label  a caption covers > 10% of a visible label
//   label-face     a label covers > 15% of a visible face
//   label-edge     a visible label is cut by the frame edge (< 97% of it on screen)
//   label-bottom   a visible label reaches into the bottom 15% (platform UI)
//   sfx-overlap    more than 2 sound effects at once (from the episode's cue list)
//   label-short    a label is on screen < 1.5 s in total (labels share an id when one continues another)
// Faces, captions and labels are measured in the real render: src/tavinho/QaProbe.tsx logs their boxes per frame.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { renderFrames, selectComposition } from '@remotion/renderer';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const FF = 'C:/Users/borge/.hoottools/ffmpeg/ffmpeg.exe';
const argv = process.argv.slice(2);
const opt = { video: null, bundle: 'build_m', step: 3 };
let videoId = null;
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--video') opt.video = argv[++i];
  else if (a === '--bundle') opt.bundle = argv[++i];
  else if (a === '--step') opt.step = +argv[++i];
  else videoId = a;
}
if (!videoId) { console.error('usage: node scripts/qa/tavinho.mjs <videoId> [--video out/x.mp4] [--bundle build_m] [--step 3]'); process.exit(2); }

const FPS = 30, W = 1080, H = 1920, MIN_LABEL = 1.5;
const problems = [];
const add = (check, at, msg) => problems.push({ check, at, msg });
const fmt = (s) => `${s.toFixed(2)} s`;

// ---------------------------------------------------------------- 1. ffmpeg checks on the rendered video
if (opt.video) {
  const fz = execStderr(['-vf', 'freezedetect=n=0.003:d=0.4']);
  for (const m of fz.matchAll(/freeze_start: ([\d.]+)[\s\S]*?freeze_duration: ([\d.]+)/g)) add('freeze', +m[1], `picture frozen for ${(+m[2]).toFixed(2)} s`);
  const bk = execStderr(['-vf', 'blackdetect=d=0.1:pix_th=0.10']);
  for (const m of bk.matchAll(/black_start:([\d.]+) black_end:([\d.]+)/g)) add('black', +m[1], `black for ${(+m[2] - +m[1]).toFixed(2)} s`);
}
/** Run ffmpeg on the video and return its stderr, where the detect filters print their findings. */
function execStderr(args) {
  const r = spawnSync(FF, ['-hide_banner', '-nostats', '-i', opt.video, ...args, '-an', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 64 << 20 });
  return r.stderr ?? '';
}

// ---------------------------------------------------------------- 2. sound effects: at most 2 at once (the episode's real cue list)
{
  const esbuild = (await import('esbuild')).default;
  const tmp = path.join(ROOT, 'out/qa', videoId, 'cues.mjs');
  fs.mkdirSync(path.dirname(tmp), { recursive: true });
  await esbuild.build({
    stdin: { contents: "export { cuesFor } from './src/tavinho/Episode';\nexport { buildMoneyTimeline } from './src/scenes/money/timeline';\nexport { SFX_LEN } from './src/audio/Sfx';", resolveDir: ROOT, loader: 'ts' },
    bundle: true, platform: 'node', format: 'esm', outfile: tmp, jsx: 'automatic', logLevel: 'error', external: ['remotion', 'react', 'react-dom', '@remotion/*'],
  });
  const { cuesFor, buildMoneyTimeline, SFX_LEN } = await import(`file://${tmp.replace(/\\/g, '/')}?${Date.now()}`);
  const tm = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/videos', videoId, 'timings.json'), 'utf8'));
  const cues = cuesFor(tm, buildMoneyTimeline(tm));
  const len = (c) => c.dur ?? SFX_LEN[c.sfx] ?? 1;
  for (const c of cues) {
    const n = cues.filter((k) => k.at <= c.at && k.at + len(k) > c.at).length;
    if (n > 2) add('sfx-overlap', c.at, `${n} effects at once (${c.sfx})`);
  }
}

// ---------------------------------------------------------------- 3. measure faces, captions, labels in the real render
const serveUrl = path.join(ROOT, opt.bundle);
const inputProps = { videoId, qa: true };
const composition = await selectComposition({ serveUrl, id: 'Tavinho', inputProps });
const samples = new Map();
await renderFrames({
  serveUrl, composition, inputProps, outputDir: null, imageFormat: 'none', everyNthFrame: opt.step, concurrency: 4,
  chromiumOptions: { gl: 'angle' }, logLevel: 'error',
  onStart: () => {}, onFrameUpdate: () => {},
  onBrowserLog: (l) => { if (l.text.startsWith('QA|')) { const s = JSON.parse(l.text.slice(3)); samples.set(s.frame, s); } },
});
const frames = [...samples.keys()].sort((a, b) => a - b);
const lastFrame = composition.durationInFrames - 1;

const clip = ([x, y, w, h]) => { const x0 = Math.max(0, x), y0 = Math.max(0, y), x1 = Math.min(W, x + w), y1 = Math.min(H, y + h); return x1 > x0 && y1 > y0 ? [x0, y0, x1 - x0, y1 - y0] : null; };
const area = (b) => (b ? b[2] * b[3] : 0);
const inter = (a, b) => { if (!a || !b) return 0; const w = Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0]), h = Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1]); return w > 0 && h > 0 ? w * h : 0; };

const runs = new Map(); // label id -> [[firstFrame, lastFrame], ...]
for (const f of frames) {
  const s = samples.get(f);
  const caps = s.caps.map(clip).filter(Boolean);
  for (const fb of s.faces) {
    const v = clip(fb);
    if (area(v) < 4000) continue;
    const cov = caps.reduce((n, c) => n + inter(v, c), 0) / area(v);
    if (cov > 0.15) add('caption-face', f / FPS, `caption covers ${(100 * cov).toFixed(0)}% of a face`);
  }
  const seen = new Set();
  for (const [id, ...b] of s.labels) {
    const v = clip(b);
    if (!v || area(v) < 0.5 * area(b)) continue; // less than half on screen: not readable
    seen.add(id);
    const fullScreen = b[2] >= 0.95 * W && b[3] >= 0.95 * H; // a full-screen card is meant to fill the frame
    if (!fullScreen && area(v) < 0.97 * area(b)) add('label-edge', f / FPS, `label "${id}" cut by the frame edge (${(100 * area(v) / area(b)).toFixed(0)}% visible)`);
    if (!fullScreen && v[1] + v[3] > 0.85 * H) add('label-bottom', f / FPS, `label "${id}" reaches ${(100 * (v[1] + v[3]) / H).toFixed(0)}% height (platform UI zone)`);
    const cov = caps.reduce((n, c) => n + inter(v, c), 0) / area(v);
    if (cov > 0.1) add('caption-label', f / FPS, `caption covers ${(100 * cov).toFixed(0)}% of label "${id}"`);
    for (const fb of s.faces) {
      const fv = clip(fb);
      if (area(fv) < 4000) continue;
      const lf = inter(v, fv) / area(fv);
      if (lf > 0.15) add('label-face', f / FPS, `label "${id}" covers ${(100 * lf).toFixed(0)}% of a face`);
    }
  }
  for (const id of seen) {
    const r = runs.get(id) ?? [];
    const cur = r[r.length - 1];
    if (cur && f - cur[1] <= opt.step) cur[1] = f; else r.push([f, f]);
    runs.set(id, r);
  }
}
// a label must be readable: on screen ≥ 1.5 s in total (a cut-in may interrupt it), unless it is still up when the video ends
for (const [id, r] of runs) {
  const total = r.reduce((n, [a, b]) => n + (b - a + opt.step) / FPS, 0);
  if (total < MIN_LABEL && r[r.length - 1][1] + opt.step <= lastFrame) add('label-short', r[0][0] / FPS, `label "${id}" on screen only ${total.toFixed(2)} s in total`);
}

// ---------------------------------------------------------------- 4. report (one line per problem; consecutive samples merged)
const merged = [];
for (const p of problems.sort((a, b) => a.check.localeCompare(b.check) || a.at - b.at)) {
  const m = merged[merged.length - 1];
  if (m && m.check === p.check && m.msg.replace(/\d+%/g, '') === p.msg.replace(/\d+%/g, '') && p.at - m.to <= (opt.step + 1) / FPS) m.to = p.at;
  else merged.push({ ...p, to: p.at });
}
// edge/bottom hits shorter than 0.2 s are labels sliding or popping in at a cut, not a framing problem
for (let i = merged.length - 1; i >= 0; i--) if ((merged[i].check === 'label-edge' || merged[i].check === 'label-bottom') && merged[i].to - merged[i].at < 0.2) merged.splice(i, 1);
const checks = ['freeze', 'black', 'sfx-overlap', 'caption-face', 'caption-label', 'label-face', 'label-edge', 'label-bottom', 'label-short'];
const L = [`QA ${videoId}: ${frames.length} frames measured (every ${opt.step})${opt.video ? `, video ${opt.video}` : ', no video given (freeze/black skipped)'}`];
for (const c of checks) {
  const list = merged.filter((m) => m.check === c);
  const skipped = !opt.video && (c === 'freeze' || c === 'black');
  L.push(`${skipped ? 'SKIP' : list.length ? 'FAIL' : 'PASS'}  ${c}`);
  for (const m of list) L.push(`      ${fmt(m.at)}${m.to > m.at ? `–${fmt(m.to)}` : ''}  ${m.msg}`);
}
L.push('', `faces measured in ${frames.filter((f) => samples.get(f).faces.some((b) => area(clip(b)) >= 4000)).length}/${frames.length} frames; caption words in ${frames.filter((f) => samples.get(f).caps.length).length}`);
L.push('', 'labels seen: ' + [...runs.entries()].map(([id, r]) => `${id} ${r.map(([a, b]) => ((b - a + opt.step) / FPS).toFixed(1) + 's').join('+')}`).join(', '));
const outDir = path.join(ROOT, 'out/qa', videoId);
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'tavinho_report.txt'), L.join('\n') + '\n');
console.log(L.join('\n'));
process.exit(merged.length ? 1 : 0);
