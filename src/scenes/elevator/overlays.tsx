import React from 'react';
import { AbsoluteFill, interpolate } from 'remotion';
import { clamp01, easeOutCubic, progress } from '../../lib/anim';
import type { Timings } from '../../types';
import { Recap } from '../house/overlays';
import { type ElevatorTimeline } from './timeline';

const FONT = "'Montserrat', 'Arial Black', sans-serif";
const outline = (px: number) =>
  Array.from({ length: 16 }, (_, a) => {
    const r = (a / 16) * Math.PI * 2;
    return `${(Math.cos(r) * px).toFixed(1)}px ${(Math.sin(r) * px).toFixed(1)}px 0 #000`;
  }).join(',');

const Chip: React.FC<{ text: string; bg: string; a: number; top?: string; icon?: React.ReactNode }> = ({ text, bg, a, top = '15%', icon }) =>
  a > 0 ? (
    <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', top, opacity: a }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontFamily: FONT, fontWeight: 900, fontSize: 58, letterSpacing: 3, color: '#fff', background: bg, padding: '12px 34px', borderRadius: 60, border: '6px solid #000' }}>
        {icon}{text}
      </div>
    </AbsoluteFill>
  ) : null;

const Rewind = () => (
  <div style={{ display: 'flex' }}>
    {[0, 1].map((i) => (
      <div key={i} style={{ width: 0, height: 0, borderTop: '20px solid transparent', borderBottom: '20px solid transparent', borderRight: '30px solid #fff' }} />
    ))}
  </div>
);

export const ElevatorOverlays: React.FC<{ timings: Timings; T: ElevatorTimeline; t: number }> = ({ timings, T, t }) => {
  const fade = (a: number, b: number) => clamp01((t - a) / 0.15) * (1 - clamp01((t - b) / 0.2));
  const rewindA = fade(T.rewindS, T.rewindS + 0.9);
  const sepia = fade(T.otisS - 0.05, T.elseS - 0.5);
  const slowmo = fade(T.govS, T.wedgeT);
  const redAt = (c: number) => interpolate(t, [c - 0.02, c + 0.05, c + 0.45], [0, 0.3, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const red = Math.max(redAt(T.snap1), redAt(T.allSnap));
  // counter: 0 → 18,000,000,000
  const cp = easeOutCubic(progress(t, T.payoff + 0.2, T.payoff + 1.6));
  const count = Math.round(18e9 * cp).toLocaleString('en-US');
  const countA = fade(T.payoff, T.final);
  return (
    <>
      {rewindA > 0 && (
        <AbsoluteFill style={{ opacity: rewindA * 0.5, background: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.10) 0 3px, rgba(0,0,0,0) 3px 12px), rgba(60,90,160,0.25)' }} />
      )}
      <Chip text="REWIND" bg="#1f2a44" a={rewindA} icon={<Rewind />} />
      {sepia > 0 && <AbsoluteFill style={{ opacity: sepia, background: 'radial-gradient(circle, rgba(112,74,30,0.25) 40%, rgba(40,25,10,0.75) 100%)' }} />}
      <Chip text="1850s" bg="#7a5230" a={sepia} />
      <Chip text="SLOW MOTION" bg="#1f2a44" a={slowmo} top="4%" />
      {red > 0 && <AbsoluteFill style={{ background: 'radial-gradient(circle, rgba(255,40,30,0) 35%, rgba(255,40,30,0.9) 100%)', opacity: red }} />}
      <Recap timings={timings} t={t} endAt={T.payoff} />
      {countA > 0 && (
        <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', top: '20%', opacity: countA }}>
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 92, color: '#ffd21f', textShadow: `${outline(8)}, 0 10px 0 rgba(0,0,0,0.3)` }}>{count}</div>
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 48, color: '#fff', marginTop: 8, textShadow: `${outline(6)}` }}>TRIPS A YEAR (US)</div>
        </AbsoluteFill>
      )}
    </>
  );
};
