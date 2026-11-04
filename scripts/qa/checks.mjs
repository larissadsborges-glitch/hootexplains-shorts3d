// Pure checks: measurements (from page/entry.tsx) -> problems. No browser, no files.
export const W = 1080, H = 1920;

export const DEFAULTS = {
  safeX: [0.05, 0.95],      // overlay text must stay inside 5..95% of the width
  bottomZone: 0.85,         // bottom 15% is covered by the platform UI
  minLabelSec: 1.5,         // a label must stay on screen at least this long
  earlyTol: 0.3,            // a label may pop in this much before its word is spoken
  edgeFrac: 0.02,           // > 2% of a character's visible points outside the left/right/top edge
  faceByCharFrac: 0.2,      // face hidden by the other character
  faceBySceneFrac: 0.35,    // face hidden by scenery
  faceOverlayFrac: 0.15,    // overlay box covering this much of a face box
  heldGap: 0.03,            // metres between hand surface and held object
  minOpacity: 0.3,          // ignore fading-in/out overlays below this opacity for overlap checks
};

// ---------------------------------------------------------------- text helpers
const NUM = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100 };
const STOP = new Set('the a an of to in on at for and or is are it its not no yes you your my our by with this that from as be am pm vs than then just so do did does was were has have had his her him he she they them who what why how when where can will now up out all one'.split(' '));
export const canon = (raw) => {
  let w = String(raw).toLowerCase().replace(/[’']s$/, '').replace(/[^a-z0-9.\-]/g, '').replace(/^[.\-]+|[.\-]+$/g, '');
  if (!w) return '';
  if (/^\d+(\.\d+)?$/.test(w)) return String(parseFloat(w));
  const parts = w.split('-');
  if (parts.every((p) => p in NUM)) return String(parts.reduce((s, p) => s + NUM[p], 0));
  if (w.length > 5) w = w.replace(/(ing|ed|es)$/, '');
  if (w.length > 3) w = w.replace(/s$/, '');
  return w;
};
const tokens = (text) => String(text).split(/[\s·:,=≈()/]+/).map(canon).filter((w) => w && !STOP.has(w) && (w.length >= 3 || /^\d/.test(w)));

/** Same logic as the Captions component: which word is on screen at t. */
export const captionAt = (timings, t) => {
  const words = timings.beats.flatMap((b) => b.words);
  let cur = -1;
  for (let i = 0; i < words.length; i++) {
    const next = words[i + 1];
    const until = next ? Math.min(next.start, words[i].end + 0.45) : words[i].end + 0.6;
    if (t >= words[i].start && t < until) cur = i;
  }
  if (cur < 0) return null;
  const c = words[cur].word.replace(/(\d),(\d)/g, '$1\u0000$2').replace(/[^A-Za-z0-9'’\u0000-]/g, '').replace(/\u0000/g, ',');
  return c.charAt(0).toUpperCase() + c.slice(1);
};

export const classify = (item, timings, t) => {
  const txt = item.text;
  if (/^HOOT( EXPLAINS)?$/.test(txt) || (item.hasImg && !txt)) return 'badge';
  if (txt === timings.handle) return 'handle';
  const cap = captionAt(timings, t);
  if (cap && txt === cap && item.fontSize >= 90) return 'caption';
  for (const c of [timings.hook, timings.outro]) if (c && (txt === c.line1 || txt === c.line2)) return 'title';
  if (timings.beats.some((b) => b.label && b.label === txt)) return 'term';
  return 'label';
};

/** Key that stays the same while a counter ticks: times -> TIME, numbers -> #. */
export const counterKey = (text) => text.replace(/\b\d{1,2}:\d{2}\s*(AM|PM)\b/gi, 'TIME').replace(/\d+(?:[.,]\d+)?/g, '#');
const counterValues = (text) => {
  const vals = [];
  const re = /\b(\d{1,2}):(\d{2})\s*(AM|PM)\b|(\d+(?:[.,]\d+)?)/gi;
  let m;
  while ((m = re.exec(text))) {
    if (m[1]) vals.push({ time: true, v: ((+m[1] % 12) + (m[3].toUpperCase() === 'PM' ? 12 : 0)) * 60 + +m[2] });
    else vals.push({ time: false, v: parseFloat(m[4].replace(',', '')) });
  }
  return vals;
};

// ---------------------------------------------------------------- geometry helpers
const inter = (a, b) => {
  const x0 = Math.max(a.x, b.x), y0 = Math.max(a.y, b.y);
  const x1 = Math.min(a.x + a.w, b.x + b.w), y1 = Math.min(a.y + a.h, b.y + b.h);
  return x1 > x0 && y1 > y0 ? { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } : null;
};
const shrink = (b, k) => ({ x: b.x + k, y: b.y + k, w: Math.max(0, b.w - 2 * k), h: Math.max(0, b.h - 2 * k) });
const short = (s, n = 34) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
const NAME = { jake: 'Jake', hoot: 'Hoot' };
const who = (id) => id.replace(/^(jake|hoot)/, (m) => NAME[m]);

// ---------------------------------------------------------------- per-sample checks
/**
 * Instant problems in one sample. Each problem: {type, sev, key, msg, metric, boxes:[{x,y,w,h,label}]}
 * `key` identifies the same problem across samples (for merging into time spans).
 */
export const checkSample = (s, timings, opt = DEFAULTS) => {
  const out = [];
  const items = s.overlays.map((o) => ({ ...o, kind: classify(o, timings, s.t) }));
  s.overlays = items;
  const txt = (o) => (o.kind === 'badge' ? 'Hoot badge' : `"${short(o.text)}"`);

  for (const o of items) {
    if (o.opacity < opt.minOpacity) continue;
    const b = o.box;
    // safe width (the brand badge sits at 48 px by design: skip it)
    if (o.kind !== 'badge') {
      const lo = W * opt.safeX[0], hi = W * opt.safeX[1];
      if (b.x < lo - 2 || b.x + b.w > hi + 2) {
        const side = b.x < lo - 2 ? `left edge at ${(100 * b.x / W).toFixed(1)}%` : `right edge at ${(100 * (b.x + b.w) / W).toFixed(1)}%`;
        out.push({ type: 'overlay-safe-width', sev: 'error', key: `sw|${o.text}`, msg: `${o.kind} ${txt(o)} outside the 5–95% safe width (${side})`, metric: Math.max(lo - b.x, b.x + b.w - hi), boxes: [{ ...b }] });
      }
    }
    if (b.y + b.h > H * opt.bottomZone + 2) {
      out.push({ type: 'overlay-bottom-zone', sev: 'error', key: `bz|${o.text}`, msg: `${o.kind} ${txt(o)} in the bottom platform-UI zone (bottom at ${(100 * (b.y + b.h) / H).toFixed(1)}%)`, metric: b.y + b.h - H * opt.bottomZone, boxes: [{ ...b }] });
    }
  }
  // overlay vs overlay (items sharing a parent were laid out together, e.g. the 2 title lines)
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    const a = items[i], c = items[j];
    if (a.parent === c.parent || a.opacity < opt.minOpacity || c.opacity < opt.minOpacity) continue;
    if ((a.kind === 'badge' && c.kind === 'badge')) continue;
    const ib = inter(shrink(a.box, 2), shrink(c.box, 2));
    if (!ib) continue;
    const frac = (ib.w * ib.h) / Math.min(a.box.w * a.box.h, c.box.w * c.box.h);
    const [p, q] = [a, c].sort((x, y) => (x.text < y.text ? -1 : 1));
    out.push({ type: 'overlay-overlap', sev: 'error', key: `ov|${p.text}|${q.text}`, msg: `${p.kind} ${txt(p)} overlaps ${q.kind} ${txt(q)} (${Math.round(100 * frac)}% of the smaller)`, metric: frac, boxes: [{ ...a.box }, { ...c.box }] });
  }

  for (const ch of s.chars ?? []) {
    const b = ch.body, f = ch.face;
    const offLRT = b.off.left + b.off.right + b.off.top + f.off.left + f.off.right + f.off.top;
    const unocc = b.onVis + f.onVis + offLRT + b.off.bottom + f.off.bottom;
    // 1. partly outside the frame (left / right / top). Bottom crops are normal framing.
    if (b.onVis + f.onVis >= 3 && unocc > 0 && offLRT / unocc > opt.edgeFrac) {
      const edges = ['left', 'right', 'top'].filter((e) => b.off[e] + f.off[e] > 0);
      const ext = b.ext ? (() => { const x0 = b.ext.x, x1 = b.ext.x + b.ext.w, y0 = b.ext.y; return Math.round(Math.max(-x0, x1 - W, -y0)); })() : 0;
      const faceOut = f.off.left + f.off.right + f.off.top;
      out.push({ type: 'character-edge', sev: 'error', key: `edge|${ch.id}`, msg: `${who(ch.id)} partly outside the frame (${edges.join('/')}): ${Math.round(100 * offLRT / unocc)}% of the visible body is cut${ext > 0 ? `, ~${ext}px past the edge` : ''}${faceOut ? ' (incl. part of the face)' : ''}`, metric: offLRT / unocc, boxes: b.box ? [{ ...b.box, label: who(ch.id) }] : [] });
    }
    // 2. face hidden (by the other character = error, by scenery = warning)
    const fIn = f.onVis + f.onOcc;
    if (f.n >= 8 && fIn >= Math.max(5, 0.3 * f.n) && f.onOcc / fIn > Math.min(opt.faceByCharFrac, opt.faceBySceneFrac)) {
      const by = Object.entries(f.occBy).sort((x, y) => y[1] - x[1]);
      const byChar = by.filter(([n]) => /^(jake|hoot)/.test(n)).reduce((s, [, k]) => s + k, 0) / fIn;
      const byScene = f.onOcc / fIn - byChar;
      if (byChar > opt.faceByCharFrac) {
        const n = by.find(([nm]) => /^(jake|hoot)/.test(nm))[0];
        out.push({ type: 'face-covered', sev: 'error', key: `fc|${ch.id}|${n}`, msg: `${who(ch.id)}'s face ${Math.round(100 * byChar)}% covered by ${who(n)}`, metric: byChar, boxes: f.ext ? [{ ...f.ext, label: `${who(ch.id)} face` }] : [] });
      } else if (byScene > opt.faceBySceneFrac) {
        const n = by.find(([nm]) => !/^(jake|hoot)/.test(nm))[0];
        out.push({ type: 'face-hidden', sev: 'warn', key: `fh|${ch.id}|${n}`, msg: `${who(ch.id)}'s face ${Math.round(100 * byScene)}% hidden by ${n}`, metric: byScene, boxes: f.ext ? [{ ...f.ext, label: `${who(ch.id)} face` }] : [] });
      }
    }
    // 3. overlay on a face (uses the visible part of the face)
    if (f.box && f.onVis >= 5) {
      const fb = { x: f.box.x - 6, y: f.box.y - 6, w: f.box.w + 12, h: f.box.h + 12 };
      for (const o of items) {
        if (o.opacity < opt.minOpacity) continue;
        const ib = inter(o.box, fb);
        if (!ib) continue;
        const frac = (ib.w * ib.h) / (fb.w * fb.h);
        if (frac < opt.faceOverlayFrac) continue;
        out.push({ type: 'overlay-on-face', sev: 'error', key: `of|${ch.id}|${o.kind}|${o.kind === 'caption' ? '' : o.text}`, msg: `${o.kind} ${o.kind === 'caption' ? '' : txt(o) + ' '}covers ${Math.round(100 * frac)}% of ${who(ch.id)}'s face`, metric: frac, boxes: [{ ...o.box }, { ...fb, label: `${who(ch.id)} face` }] });
      }
    }
  }
  for (const h of s.held ?? []) {
    if (h.gap > opt.heldGap) out.push({ type: 'held-object-gap', sev: 'error', key: `held|${h.id}|${h.hand}`, msg: `object in ${who(h.id)}'s ${h.hand} hand floats ${(100 * h.gap).toFixed(1)} cm from the hand`, metric: h.gap, boxes: [{ x: h.screen.x - 50, y: h.screen.y - 50, w: 100, h: 100, label: 'hand' }] });
  }
  for (const p of s.furniture ?? []) {
    out.push({ type: 'inside-furniture', sev: 'error', key: `furn|${p.id}|${p.part}|${p.furniture}`, msg: `${who(p.id)}'s ${p.part} is ${(100 * p.depth).toFixed(1)} cm inside "${p.furniture}"`, metric: p.depth, boxes: p.box ? [{ ...p.box, x: p.box.x - 8, y: p.box.y - 8, w: p.box.w + 16, h: p.box.h + 16, label: p.part }] : [] });
  }
  return out;
};

// ---------------------------------------------------------------- time-series checks
/** Spans of each label (by counter key) over the fine samples. */
const labelSpans = (samples, step) => {
  const open = new Map(), spans = [];
  for (const s of samples) {
    const seen = new Set();
    for (const o of s.overlays) {
      if (o.kind === 'caption' || o.kind === 'handle' || o.kind === 'badge') continue;
      const k = counterKey(o.text);
      if (seen.has(k)) continue;
      seen.add(k);
      const sp = open.get(k);
      if (sp && s.t - sp.t1 <= step * 1.6) { sp.t1 = s.t; sp.items.push({ t: s.t, frame: s.frame, text: o.text, box: o.box }); }
      else { if (sp) spans.push(sp); open.set(k, { key: k, kind: o.kind, text: o.text, t0: s.t, t1: s.t, items: [{ t: s.t, frame: s.frame, text: o.text, box: o.box }] }); }
    }
  }
  for (const sp of open.values()) spans.push(sp);
  return spans.sort((a, b) => a.t0 - b.t0);
};

export const checkSeries = (samples, timings, step, qaInfo = {}, opt = DEFAULTS) => {
  const out = [];
  const spans = labelSpans(samples, step);
  const end = samples.length ? samples[samples.length - 1].t : 0;
  // 3a. label on screen too briefly
  for (const sp of spans) {
    const dur = sp.t1 - sp.t0 + step;
    const cutByEnd = sp.t1 >= end - 1e-6 && end < timings.duration - step; // only partially sampled range
    if (dur < opt.minLabelSec - 1e-6 && !cutByEnd && sp.t0 > samples[0].t + 1e-6) {
      out.push({ type: 'label-too-short', sev: 'error', t0: sp.t0, t1: sp.t1, msg: `${sp.kind} "${short(sp.text)}" is on screen for only ${dur.toFixed(1)} s (min ${opt.minLabelSec} s)`, metric: dur, at: sp.items.map((i) => ({ frame: i.frame, box: i.box })) });
    }
  }
  // 3b. counters must not go backwards (a reset declared in the scene's qa export is allowed)
  const resets = (qaInfo.counters ?? []);
  for (const sp of spans) {
    if (!sp.key.includes('#') && !sp.key.includes('TIME')) continue;
    for (let i = 1; i < sp.items.length; i++) {
      const a = counterValues(sp.items[i - 1].text), b = counterValues(sp.items[i].text);
      if (a.length !== b.length) continue;
      for (let k = 0; k < a.length; k++) {
        let back = false;
        if (a[k].time) { const d = (b[k].v - a[k].v + 1440) % 1440; back = d > 720; }
        else back = b[k].v < a[k].v - 1e-9;
        if (!back) continue;
        const ta = sp.items[i - 1].t, tb = sp.items[i].t;
        const allowed = resets.some((r) => sp.text.includes(r.match) && r.resets.some((rt) => rt >= ta - 0.05 && rt <= tb + 0.05));
        if (allowed) continue;
        out.push({ type: 'counter-backwards', sev: 'error', t0: ta, t1: tb, msg: `counter "${short(sp.key)}" goes backwards: "${sp.items[i - 1].text}" → "${sp.items[i].text}"`, metric: 1, at: [{ frame: sp.items[i].frame, box: sp.items[i].box }] });
      }
    }
  }
  // 5. label text that matches the narration must not appear before the word is spoken
  const words = timings.beats.flatMap((b) => b.words.map((w) => ({ w: canon(w.word), raw: w.word, start: w.start })));
  for (const sp of spans) {
    if (sp.kind !== 'label' && sp.kind !== 'term') continue;
    if (sp.t0 <= samples[0].t + 1e-6 && sp.t0 > 0.05) continue; // started before the sampled range
    if (new Set(sp.items.map((i) => i.text)).size > 1) continue; // a ticking counter / HUD, not a word-synced label
    const toks = tokens(sp.text);
    const hits = words.filter((w) => toks.includes(w.w) && w.start >= sp.t0 - 6 && w.start <= sp.t0 + 10);
    if (!hits.length) continue;
    if (hits.some((h) => h.start <= sp.t0 + opt.earlyTol)) continue;
    const first = hits.sort((a, b) => a.start - b.start)[0];
    const lead = first.start - sp.t0;
    out.push({ type: 'text-before-word', sev: lead > 1 ? 'error' : 'warn', t0: sp.t0, t1: first.start, msg: `"${short(sp.text)}" appears ${lead.toFixed(2)} s before "${first.raw.replace(/[^\w'’%.-]/g, '')}" is spoken (${first.start.toFixed(2)} s)`, metric: lead, at: sp.items.filter((i) => i.t <= first.start).map((i) => ({ frame: i.frame, box: i.box })) });
  }
  return out;
};

/** Merge per-sample problems with the same key into time spans. */
export const mergeSpans = (perSample, step) => {
  const open = new Map(), done = [];
  for (const { t, frame, problems } of perSample) {
    for (const p of problems) {
      const o = open.get(p.key);
      if (o && t - o.t1 <= step * 1.6) { o.t1 = t; o.frames.push(frame); if (p.metric > o.metric) { o.metric = p.metric; o.msg = p.msg; o.worst = frame; } }
      else { if (o) done.push(o); open.set(p.key, { type: p.type, sev: p.sev, key: p.key, msg: p.msg, metric: p.metric, t0: t, t1: t, frames: [frame], worst: frame }); }
    }
  }
  return [...done, ...open.values()].sort((a, b) => a.t0 - b.t0);
};
