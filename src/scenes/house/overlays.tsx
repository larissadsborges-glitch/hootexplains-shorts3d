import React from 'react';
import { AbsoluteFill, interpolate, spring, useVideoConfig } from 'remotion';
import { cleanWord, clamp01 } from '../../lib/anim';
import type { Timings } from '../../types';
import { COLD, type HouseTimeline } from './timeline';

const FONT = "'Montserrat', 'Arial Black', sans-serif";
const outline = (px: number) =>
  Array.from({ length: 16 }, (_, a) => {
    const r = (a / 16) * Math.PI * 2;
    return `${(Math.cos(r) * px).toFixed(1)}px ${(Math.sin(r) * px).toFixed(1)}px 0 #000`;
  }).join(',');

const Tick: React.FC = () => (
  <div style={{ width: 80, height: 80, borderRadius: 40, background: '#2ecc71', border: '6px solid #000', position: 'relative', flexShrink: 0 }}>
    <div style={{ position: 'absolute', left: 24, top: 9, width: 20, height: 38, borderRight: '10px solid #fff', borderBottom: '10px solid #fff', transform: 'rotate(45deg)' }} />
  </div>
);

/** Recap checklist: one ticked item per item in script.recapItems, each popping on its first spoken word. */
export const Recap: React.FC<{ timings: Timings; t: number; endAt: number }> = ({ timings, t, endAt }) => {
  const { fps } = useVideoConfig();
  const b = timings.beats.find((x) => x.event === 'recap');
  const items = timings.recapItems ?? [];
  if (!b || t < b.start || t > endAt + 0.3) return null;
  const out = interpolate(t, [endAt, endAt + 0.3], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  let wi = 0;
  const starts = items.map((it) => {
    const first = it.split(' ')[0].toLowerCase();
    while (wi < b.words.length && cleanWord(b.words[wi].word) !== first) wi++;
    return b.words[Math.min(wi++, b.words.length - 1)]?.start ?? b.start;
  });
  return (
    <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', top: '13%', opacity: out }}>
      <div>
        {items.map((label, i) => {
          if (t < starts[i] - 0.1) return null;
          const pop = spring({ frame: Math.round((t - starts[i] + 0.1) * fps), fps, config: { damping: 12, stiffness: 320 } });
          return (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 26, marginBottom: 16, transform: `translateX(${(1 - pop) * -120}px)`, opacity: Math.min(1, pop * 1.5) }}>
              <Tick />
              <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: label.length > 10 ? 84 : 100, color: '#fff', whiteSpace: 'nowrap', textShadow: `${outline(7)}, 0 8px 0 rgba(0,0,0,0.3)` }}>
                {label}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const HouseOverlays: React.FC<{ timings: Timings; T: HouseTimeline; t: number }> = ({ timings, T, t }) => {
  const flash = interpolate(t, [COLD - 0.03, COLD, COLD + 0.18], [0, 0.85, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const gloom = clamp01((t - T.rain) / 0.8) * (1 - clamp01((t - T.rainStop) / 0.8));
  const redAt = (c: number) => interpolate(t, [c - 0.02, c + 0.05, c + 0.45], [0, 0.28, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const red = Math.max(redAt(T.crack), redAt(0.55)); // the crack itself, and its replay in the cold open
  const months = t >= T.dampS && t < T.dampS + 1.6 ? interpolate(t, [T.dampS, T.dampS + 0.2, T.dampS + 1.3, T.dampS + 1.6], [0, 1, 1, 0]) : 0;
  return (
    <>
      {red > 0 && <AbsoluteFill style={{ background: 'radial-gradient(circle, rgba(255,40,30,0) 35%, rgba(255,40,30,0.9) 100%)', opacity: red }} />}
      {gloom > 0 && <AbsoluteFill style={{ background: 'rgba(45,58,80,0.32)', opacity: gloom }} />}
      {months > 0 && (
        <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', top: '15%', opacity: months }}>
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 60, letterSpacing: 3, color: '#fff', background: '#1f2a44', padding: '14px 34px', borderRadius: 60, border: '6px solid #000' }}>
            MONTHS LATER
          </div>
        </AbsoluteFill>
      )}
      <Recap timings={timings} t={t} endAt={T.final} />
      {flash > 0 && <AbsoluteFill style={{ background: '#fff', opacity: flash }} />}
    </>
  );
};
