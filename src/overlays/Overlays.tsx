import React from 'react';
import { AbsoluteFill, interpolate, spring, useVideoConfig } from 'remotion';
import { cleanWord } from '../lib/anim';
import type { Timings } from '../types';
import { projectToScreen, type CameraPose } from '../world/Props';

const FONT = "'Montserrat', 'Arial Black', sans-serif";

const outline = (px: number, color = '#000') => {
  const s: string[] = [];
  for (let a = 0; a < 16; a++) {
    const r = (a / 16) * Math.PI * 2;
    s.push(`${(Math.cos(r) * px).toFixed(1)}px ${(Math.sin(r) * px).toFixed(1)}px 0 ${color}`);
  }
  return s.join(',');
};

const displayWord = (w: string) => {
  // keep thousands separators in numbers (10,000) and accented letters (você, limão); drop other punctuation
  const c = w.replace(/(\d),(\d)/g, '$1\u0000$2').replace(/[^\p{L}\p{N}'’\u0000-]/gu, '').replace(/\u0000/g, ',');
  return c.charAt(0).toUpperCase() + c.slice(1);
};

/** One word at a time, centred, popping in as it's spoken. */
export const Captions: React.FC<{ timings: Timings; t: number }> = ({ timings, t }) => {
  const { fps } = useVideoConfig();
  const words = timings.beats.flatMap((b) => b.words.map((w) => ({ ...w, beat: b })));
  let cur = -1;
  for (let i = 0; i < words.length; i++) {
    const next = words[i + 1];
    const until = next ? Math.min(next.start, words[i].end + 0.45) : words[i].end + 0.6;
    if (t >= words[i].start && t < until) cur = i;
  }
  if (cur < 0) return null;
  const w = words[cur];
  const hl = (w.beat.highlight ?? []).includes(cleanWord(w.word));
  const pop = spring({ frame: Math.round((t - w.start) * fps), fps, config: { damping: 11, stiffness: 260, mass: 0.6 } });
  return (
    <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', top: '63%' }}>
      <div
        style={{
          fontFamily: FONT, fontWeight: 900, fontSize: 100, letterSpacing: 1,
          color: hl ? '#ffd21f' : '#ffffff',
          textShadow: `${outline(7)}, 0 12px 0 rgba(0,0,0,0.35)`,
          transform: `scale(${interpolate(pop, [0, 1], [0.78, 1])})`,
        }}
      >
        {displayWord(w.word)}
      </div>
    </AbsoluteFill>
  );
};

/** Big yellow callout for a technical term, pinned above its object in the 3D scene. */
export const TermLabel: React.FC<{ timings: Timings; t: number; pose: CameraPose; anchor?: (key: string, t: number) => number[] | null }> = ({ timings, t, pose, anchor }) => {
  const { fps, width, height } = useVideoConfig();
  const beat = timings.beats.find((b) => b.label && t >= b.start - 0.1 && t < b.end + 0.6);
  if (!beat || !beat.label) return null;
  const key = (beat.labelWord ?? beat.label).toLowerCase().split(' ')[0];
  const w = beat.words.find((x) => cleanWord(x.word) === key);
  const tIn = w ? w.start : beat.start + 0.1;
  const tOut = beat.end + 0.6;
  if (t < tIn) return null;
  const pin = spring({ frame: Math.round((t - tIn) * fps), fps, config: { damping: 9, stiffness: 220 } });
  const pout = interpolate(t, [tOut - 0.2, tOut], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  // labelAt is a 3D point, or a key the scene resolves to a moving point (e.g. the tunnel machine)
  const p3 = typeof beat.labelAt === 'string' ? anchor?.(beat.labelAt, t) ?? null : beat.labelAt ?? null;
  const at = p3 ? projectToScreen(pose, p3, width, height) : { x: width / 2, y: height * 0.3, visible: true };
  // size so the label is at most ~72% of the frame wide, then keep it inside 5%..80% (right side has platform buttons)
  const size = Math.min(124, Math.floor((width * 0.72) / (beat.label.length * 0.82)));
  const labelW = beat.label.length * size * 0.82;
  const lo = width * 0.05 + labelW / 2, hi = width * 0.8 - labelW / 2;
  const x = lo > hi ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, at.x));
  const y = Math.min(height * 0.52, Math.max(height * 0.14, at.y - 150));
  return (
    <div style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) scale(${pin * pout}) rotate(-4deg)` }}>
      <div style={{
        fontFamily: FONT, fontWeight: 900, fontSize: size, letterSpacing: 4, whiteSpace: 'nowrap',
        color: '#ffd21f', textShadow: `${outline(9)}, 0 14px 0 rgba(0,0,0,0.3)`,
      }}>
        {beat.label}
      </div>
      <div style={{ width: 8, height: 70, margin: '0 auto', background: '#ffd21f', boxShadow: '0 0 0 5px #000', borderRadius: 4 }} />
    </div>
  );
};

/** Two-line title card (hook at the start, teaser at the end). */
/** Shrink a heavy uppercase line so it fits ~880px (room for the pop-in overshoot) (Montserrat 900 is ~0.68 em per character). */
const fit = (text: string, size: number) => Math.min(size, Math.floor(880 / (Math.max(1, text.length) * 0.68)));

export const TitleCard: React.FC<{ line1: string; line2: string; t: number; tIn: number; tOut: number; top?: string }> = ({ line1, line2, t, tIn, tOut, top = '13%' }) => {
  const { fps } = useVideoConfig();
  if (t < tIn || t > tOut) return null;
  const p1 = spring({ frame: Math.round((t - tIn) * fps), fps, config: { damping: 10, stiffness: 200 } });
  const p2 = spring({ frame: Math.round((t - tIn - 0.15) * fps), fps, config: { damping: 10, stiffness: 200 } });
  const out = interpolate(t, [tOut - 0.15, tOut], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const st = (size: number, color: string): React.CSSProperties => ({
    fontFamily: FONT, fontWeight: 900, fontSize: size, color, lineHeight: 1.05, textAlign: 'center', whiteSpace: 'nowrap',
    textShadow: `${outline(8)}, 0 12px 0 rgba(0,0,0,0.3)`,
  });
  return (
    <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', top, opacity: out }}>
      <div style={{ ...st(fit(line1, 66), '#ffffff'), transform: `scale(${p1})` }}>{line1}</div>
      <div style={{ ...st(fit(line2, 90), '#ffd21f'), transform: `scale(${Math.max(0, p2)}) rotate(-3deg)`, marginTop: 10 }}>{line2}</div>
    </AbsoluteFill>
  );
};

export const Handle: React.FC<{ handle: string }> = ({ handle }) => (
  <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'flex-end', padding: '200px 70px 0 0' }}>
    <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 30, color: '#ffffff', background: 'rgba(10,12,16,0.45)', borderRadius: 14, padding: '4px 12px' }}>
      {handle}
    </div>
  </AbsoluteFill>
);
