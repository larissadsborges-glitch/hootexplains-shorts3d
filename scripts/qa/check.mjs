#!/usr/bin/env node
// Pre-render QA for a Short: node scripts/qa/check.mjs <videoId> [options]   (see scripts/qa/README.md)
import fs from 'node:fs';
import path from 'node:path';
import { execSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { DEFAULTS, checkSample, checkSeries, mergeSpans } from './checks.mjs';

const require = createRequire(import.meta.url);
const QA = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(QA, '../..');
const FPS = 30;

// ---------------------------------------------------------------- args
const argv = process.argv.slice(2);
const opt = { step: 3, geo: 15, sheet: true, wait: true, overrides: [], style: undefined, from: 0, to: Infinity, out: null };
let videoId = null;
for (let i = 0; i < argv.length; i++) {
  const a = argv[i], next = () => argv[++i];
  if (a === '--step') opt.step = +next();
  else if (a === '--geo-step') opt.geo = +next();
  else if (a === '--no-sheet') opt.sheet = false;
  else if (a === '--no-wait') opt.wait = false;
  else if (a === '--style') opt.style = next();
  else if (a === '--from') opt.from = +next();
  else if (a === '--to') opt.to = +next();
  else if (a === '--out') opt.out = next();
  else if (a === '--override') { const [from, to] = next().split('='); opt.overrides.push([path.resolve(ROOT, from), path.resolve(to)]); }
  else if (a === '-h' || a === '--help') { console.log(fs.readFileSync(path.join(QA, 'README.md'), 'utf8')); process.exit(0); }
  else if (!videoId) videoId = a;
  else { console.error(`unknown argument ${a}`); process.exit(2); }
}
if (!videoId) { console.error('usage: node scripts/qa/check.mjs <videoId> [--step 3] [--geo-step 15] [--no-sheet] [--from s] [--to s] [--override src/file.ts=copy.ts]'); process.exit(2); }
if (opt.geo % opt.step) { console.error('--geo-step must be a multiple of --step'); process.exit(2); }

const timingsPath = path.join(ROOT, 'public/videos', videoId, 'timings.json');
const timings = JSON.parse(fs.readFileSync(timingsPath, 'utf8'));
const sceneName = timings.scene ?? 'river-bridge';
const tlPath = path.join(ROOT, 'src/scenes', sceneName, 'timeline.ts');
const outDir = path.resolve(opt.out ?? path.join(ROOT, 'out/qa', videoId));
const buildDir = path.join(ROOT, 'build_qa', videoId);
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(buildDir, { recursive: true });
const log = (...a) => console.log(`[qa ${videoId}]`, ...a);

// ---------------------------------------------------------------- be polite to running renders
// "[r]ender" so the pattern doesn't match the shell running pgrep itself
const rendersRunning = () => { try { return execSync('pgrep -f "remotion [r]ender"', { encoding: 'utf8' }).trim().split('\n').filter((p) => p && +p !== process.pid).length > 0; } catch { return false; } };
if (opt.wait) {
  let warned = false;
  while (rendersRunning()) {
    if (!warned) { log('a Remotion render is running; waiting for it to finish (pass --no-wait to skip)…'); warned = true; }
    await new Promise((r) => setTimeout(r, 30000));
  }
}

// ---------------------------------------------------------------- bundle the QA page (esbuild, own out dir)
const esbuild = require('esbuild');
const shimDir = path.join(QA, 'page/shims');
const overrides = new Map(opt.overrides);
for (const [from, to] of overrides) { if (!fs.existsSync(to)) { console.error(`override source missing: ${to}`); process.exit(2); } log(`override: ${path.relative(ROOT, from)} <- ${to}`); }
const t0 = Date.now();
await esbuild.build({
  entryPoints: [path.join(QA, 'page/entry.tsx')],
  bundle: true, outfile: path.join(buildDir, 'qa.js'), format: 'iife', platform: 'browser', target: 'chrome120',
  jsx: 'automatic', logLevel: 'error', sourcemap: false, minify: false,
  loader: { '.woff2': 'file', '.woff': 'file', '.png': 'file', '.jpg': 'file' }, publicPath: '/__qa/',
  define: { 'process.env.NODE_ENV': '"production"' },
  plugins: [{
    name: 'qa',
    setup(b) {
      b.onResolve({ filter: /^qa:scene$/ }, () => ({ path: 'qa:scene', namespace: 'qa' }));
      b.onLoad({ filter: /.*/, namespace: 'qa' }, () => ({
        contents: fs.existsSync(tlPath) ? `import * as tl from ${JSON.stringify(tlPath)};\nexport const qa = (tl as any).qa ?? null;` : 'export const qa = null;',
        loader: 'ts', resolveDir: ROOT,
      }));
      // QA-only wrappers so characters can be found in the scene graph (the video bundle never sees these)
      b.onResolve({ filter: /mascot\/(Jake|Mascots)$/ }, (a) => {
        if (a.importer.startsWith(shimDir)) return undefined;
        return { path: path.join(shimDir, `${a.path.endsWith('Jake') ? 'Jake' : 'Mascots'}.tsx`) };
      });
      // --override: load a scratch copy in place of a source file (imports still resolve from the original folder)
      b.onLoad({ filter: /\.[jt]sx?$/ }, (a) => {
        const o = overrides.get(a.path);
        if (!o) return undefined;
        return { contents: fs.readFileSync(o, 'utf8'), loader: a.path.endsWith('x') ? 'tsx' : 'ts', resolveDir: path.dirname(a.path) };
      });
    },
  }],
});
log(`bundled in ${((Date.now() - t0) / 1000).toFixed(1)} s`);

// ---------------------------------------------------------------- browser
const { chromium } = require('playwright');
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|play\(\)|NotAllowedError|AbortError|autoplay/i.test(m.text())) errors.push(m.text()); });
const MIME = { '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.html': 'text/html' };
await page.route('http://qa.local/**', async (route) => {
  const u = new URL(route.request().url());
  const p = decodeURIComponent(u.pathname);
  let file = null;
  if (p === '/__qa/index.html') return route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#000"><div id="app"></div><script src="/__qa/qa.js"></script></body></html>' });
  if (p.startsWith('/__qa/')) file = path.join(buildDir, p.slice(6));
  else if (p.startsWith('/public/')) file = path.join(ROOT, 'public', p.slice(8));
  if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) return route.fulfill({ status: 404, body: 'not found' });
  return route.fulfill({ contentType: MIME[path.extname(file)] ?? 'application/octet-stream', body: fs.readFileSync(file) });
});
await page.addInitScript((c) => { window.__qaConfig = c; window.remotion_staticBase = 'http://qa.local/public'; }, { videoId, timings, style: opt.style });
await page.goto('http://qa.local/__qa/index.html');
await page.waitForFunction(() => window.__qa?.ready && window.__qa.setFrame, null, { timeout: 60000 });
const ok0 = await page.evaluate(() => window.__qa.goto(0));
await page.evaluate(async () => { await document.fonts.ready; await Promise.all([document.fonts.load('900 40px Montserrat'), document.fonts.load('800 40px Montserrat')]); });
const fontsOk = await page.evaluate(() => document.fonts.check('900 40px Montserrat') && document.fonts.check('800 40px Montserrat'));
if (!ok0) { console.error('the page never rendered frame 0 (WebGL/three not running?)'); console.error(errors.join('\n')); await browser.close(); process.exit(1); }
if (!fontsOk) log('WARNING: Montserrat did not load; overlay sizes may be off');
const qaInfo = await page.evaluate(() => window.__qa.qaInfo);

// ---------------------------------------------------------------- pass 1: measure
const last = Math.ceil(timings.duration * FPS) - 1;
const f0 = Math.max(0, Math.round(opt.from * FPS)), f1 = Math.min(last, Number.isFinite(opt.to) ? Math.round(opt.to * FPS) : last);
const samples = [];
const t1 = Date.now();
let unsynced = 0;
for (let f = f0; f <= f1; f += opt.step) {
  const geo = (f - f0) % opt.geo === 0;
  const synced = await page.evaluate((fr) => window.__qa.goto(fr), f);
  if (!synced) unsynced++;
  samples.push({ ...(await page.evaluate((g) => window.__qa.measure(g), geo)), geo });
  if (samples.length % 50 === 0) log(`measured ${samples.length} samples (t=${(f / FPS).toFixed(1)} s)`);
}
log(`measured ${samples.length} samples in ${((Date.now() - t1) / 1000).toFixed(1)} s${unsynced ? ` (${unsynced} not confirmed in sync)` : ''}`);

// ---------------------------------------------------------------- checks
const per = samples.map((s) => ({ t: s.t, frame: s.frame, problems: checkSample(s, timings, DEFAULTS) }));
const instant = mergeSpans(per, opt.step / FPS);
const series = checkSeries(samples, timings, opt.step / FPS, qaInfo, DEFAULTS).map((p) => ({ ...p, frames: p.at.map((a) => a.frame), worst: p.at[0]?.frame }));
const problems = [...instant, ...series].sort((a, b) => a.t0 - b.t0 || a.type.localeCompare(b.type));

// ---------------------------------------------------------------- pass 2: annotated frames + contact sheets
const fmt = (t) => `${t.toFixed(1)}s`;
const geoSamples = samples.filter((s) => s.geo);
const framesDir = path.join(outDir, 'frames');
fs.rmSync(framesDir, { recursive: true, force: true });
fs.mkdirSync(framesDir, { recursive: true });
const tmp = fs.mkdtempSync(path.join(outDir, '.tiles-'));
const problemTiles = [];
if (opt.sheet) {
  const t2 = Date.now();
  const perByFrame = new Map(per.map((p) => [p.frame, p.problems]));
  for (const s of geoSamples) {
    const shapes = [];
    for (const o of s.overlays) shapes.push({ ...o.box, color: 'rgba(0,229,255,0.8)', width: 3 });
    for (const c of s.chars ?? []) {
      if (c.body.box) shapes.push({ ...c.body.box, color: 'rgba(90,255,120,0.8)', width: 3 });
      if (c.face.box) shapes.push({ ...c.face.box, color: 'rgba(255,230,0,0.9)', width: 3 });
    }
    const here = [...(perByFrame.get(s.frame) ?? [])];
    // time-series problems: mark the label at the closest measured frame
    for (const p of series) {
      const hit = p.at.find((a) => Math.abs(a.frame - s.frame) <= opt.geo / 2);
      if (hit && s.t >= p.t0 - opt.geo / FPS / 2 && s.t <= p.t1 + opt.geo / FPS / 2) here.push({ ...p, boxes: [hit.box] });
    }
    let n = 0;
    for (const p of here) {
      n++;
      p.boxes.forEach((b, i) => shapes.push({ ...b, color: p.sev === 'error' ? '#ff2020' : '#ff9a00', width: 10, label: i === 0 ? `${n}` : undefined }));
    }
    await page.evaluate((fr) => window.__qa.goto(fr, true), s.frame);
    await page.evaluate(([sh, hd, bad]) => window.__qa.annotate(sh, hd, bad), [shapes, `${fmt(s.t)}  f${s.frame}${here.length ? `  ${here.length} issue${here.length > 1 ? 's' : ''}` : ''}`, here.length > 0]);
    const file = path.join(tmp, `f_${String(s.frame).padStart(5, '0')}.jpg`);
    await page.locator('#qa-root').screenshot({ path: file, type: 'jpeg', quality: 82 });
    await page.evaluate(() => window.__qa.clearAnnot());
    if (here.length) {
      const keep = path.join(framesDir, `f${String(s.frame).padStart(5, '0')}_${s.t.toFixed(1)}s.jpg`);
      fs.copyFileSync(file, keep);
      problemTiles.push({ file, frame: s.frame, list: here.map((p, i) => `${i + 1}. ${p.msg}`) });
    }
  }
  log(`rendered ${geoSamples.length} annotated frames in ${((Date.now() - t2) / 1000).toFixed(1)} s`);
}
await browser.close();

const tile = (files, out, w, h, cols) => {
  if (!files.length) return false;
  const dir = fs.mkdtempSync(path.join(tmp, 'set-'));
  files.forEach((f, i) => fs.copyFileSync(f, path.join(dir, `${String(i).padStart(5, '0')}.jpg`)));
  const rows = Math.ceil(files.length / cols);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', '1', '-i', path.join(dir, '%05d.jpg'), '-vf', `scale=${w}:${h},tile=${cols}x${rows}:padding=6:color=0x202020`, '-frames:v', '1', out]);
  return true;
};
const sheets = [];
if (opt.sheet) {
  const all = fs.readdirSync(tmp).filter((f) => f.startsWith('f_')).sort().map((f) => path.join(tmp, f));
  if (tile(all, path.join(outDir, 'contact.png'), 216, 384, 10)) sheets.push('contact.png');
  if (tile(problemTiles.map((p) => p.file), path.join(outDir, 'problems.png'), 360, 640, 5)) sheets.push('problems.png');
  else fs.rmSync(path.join(outDir, 'problems.png'), { force: true });
}
fs.rmSync(tmp, { recursive: true, force: true });

// ---------------------------------------------------------------- report
const errs = problems.filter((p) => p.sev === 'error'), warns = problems.filter((p) => p.sev === 'warn');
const span = (p) => (Math.abs(p.t1 - p.t0) < 1e-6 ? `${p.t0.toFixed(1)} s` : `${p.t0.toFixed(1)}–${p.t1.toFixed(1)} s`);
const L = [];
L.push(`QA report: ${videoId} (scene "${sceneName}"), ${timings.duration.toFixed(1)} s, checked ${fmt(f0 / FPS)}–${fmt(f1 / FPS)}`);
L.push(`sampling: overlays every ${(opt.step / FPS).toFixed(2)} s, characters/3D every ${(opt.geo / FPS).toFixed(2)} s; style "${opt.style ?? timings.style ?? 'real'}"`);
L.push(`scene qa export: ${qaInfo.hasQa ? `yes (${qaInfo.furniture} furniture boxes, ${qaInfo.counters.length} counter rule(s))` : 'none (no furniture checks)'}`);
const seen = {};
for (const s of geoSamples) for (const c of s.chars ?? []) seen[c.id] = (seen[c.id] ?? 0) + (c.body.onVis > 0 ? 1 : 0);
L.push(`characters found: ${Object.keys(seen).length ? Object.entries(seen).map(([k, n]) => `${k} (visible in ${n}/${geoSamples.length} samples)`).join(', ') : 'none'}`);
if (!fontsOk) L.push('WARNING: Montserrat did not load; overlay sizes may be off');
if (unsynced) L.push(`WARNING: ${unsynced} samples were not confirmed in sync with the 3D camera`);
if (errors.length) L.push(`page errors: ${[...new Set(errors)].slice(0, 5).join(' | ')}`);
L.push('');
L.push(`RESULT: ${errs.length} error(s), ${warns.length} warning(s)`);
for (const [title, list] of [['ERRORS', errs], ['WARNINGS', warns]]) {
  if (!list.length) continue;
  L.push('', title);
  for (const p of list) L.push(`  ${span(p).padEnd(13)} [${p.type}] ${p.msg}${p.worst !== undefined ? `  (frame ${p.worst})` : ''}`);
}
L.push('', 'CHECKS');
const types = { 'character-edge': 'character partly outside left/right/top edge', 'face-covered': "a character's face covered by the other character", 'face-hidden': 'face hidden by scenery (warning)', 'overlay-overlap': 'overlay boxes overlapping each other', 'overlay-safe-width': 'overlay outside 5–95% width', 'overlay-bottom-zone': 'overlay in the bottom 15% platform zone', 'overlay-on-face': 'overlay/caption covering a face', 'label-too-short': `label on screen < ${DEFAULTS.minLabelSec} s`, 'counter-backwards': 'numeric counter going backwards', 'held-object-gap': `held object > ${DEFAULTS.heldGap * 100} cm from the hand`, 'inside-furniture': 'body inside a declared furniture box', 'text-before-word': `label shown > ${DEFAULTS.earlyTol} s before its narration word` };
for (const [k, d] of Object.entries(types)) { const n = problems.filter((p) => p.type === k).length; L.push(`  ${n ? 'FAIL' : 'ok  '} ${d}${n ? ` (${n})` : ''}`); }
if (sheets.length) L.push('', `contact sheets: ${sheets.map((s) => path.join(outDir, s)).join(', ')}`, `problem frames (full size): ${framesDir}`, 'legend: red = error, orange = warning (numbered as listed on the frame), cyan = overlay boxes, green = visible character, yellow = visible face, dashed = safe-width lines and bottom UI zone');
if (problemTiles.length) {
  L.push('', 'PER-FRAME (annotated frames)');
  for (const p of problemTiles) { L.push(`  frame ${p.frame} (${(p.frame / FPS).toFixed(1)} s)`); for (const l of p.list) L.push(`    ${l}`); }
}
const report = L.join('\n');
fs.writeFileSync(path.join(outDir, 'report.txt'), report + '\n');
fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify({ videoId, scene: sceneName, options: opt, qaInfo, problems: problems.map(({ at, boxes, ...p }) => p), samples }, null, 0));
console.log('\n' + report);
process.exit(errs.length ? 1 : 0);
