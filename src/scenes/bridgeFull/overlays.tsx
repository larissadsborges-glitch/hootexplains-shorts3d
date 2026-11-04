import React from 'react';
import { AbsoluteFill, interpolate, spring, useVideoConfig } from 'remotion';
import { progress } from '../../lib/anim';
import type { Timings } from '../../types';
import { COLD, type FullTimeline } from './timeline';

const FONT = "'Montserrat', 'Arial Black', sans-serif";
const outline = (px: number) =>
  Array.from({ length: 16 }, (_, a) => {
    const r = (a / 16) * Math.PI * 2;
    return `${(Math.cos(r) * px).toFixed(1)}px ${(Math.sin(r) * px).toFixed(1)}px 0 #000`;
  }).join(',');

/** Summer / winter colour grade with a chip, for the heat explanation. */
const Season: React.FC<{ T: FullTimeline; t: number }> = ({ T, t }) => {
  const { fps } = useVideoConfig();
  const summer = t >= T.tHeat && t < T.tShrink;
  const winter = t >= T.tShrink && t < T.tOneSlab;
  if (!summer && !winter) return null;
  const t0 = summer ? T.tHeat : T.tShrink;
  const pop = spring({ frame: Math.round((t - t0) * fps), fps, config: { damping: 10, stiffness: 220 } });
  const fade = interpolate(t, [t0, t0 + 0.25], [0, 1], { extrapolateRight: 'clamp' });
  const color = summer ? 'rgba(255,140,30,0.20)' : 'rgba(70,150,255,0.22)';
  return (
    <>
      <AbsoluteFill style={{ background: color, opacity: fade }} />
      <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', top: '15%' }}>
        <div style={{
          transform: `scale(${pop})`, fontFamily: FONT, fontWeight: 900, fontSize: 64, letterSpacing: 3, color: '#fff',
          background: summer ? '#ff8a1f' : '#3d8fff', padding: '14px 36px', borderRadius: 60, border: '6px solid #000',
          boxShadow: '0 10px 0 rgba(0,0,0,0.3)',
        }}>
          {summer ? 'SUMMER  +40°C' : 'WINTER  −10°C'}
        </div>
      </AbsoluteFill>
    </>
  );
};

const Tick: React.FC<{ ok: boolean }> = ({ ok }) =>
  ok ? (
    <div style={{ width: 80, height: 80, borderRadius: 40, background: '#2ecc71', border: '6px solid #000', position: 'relative' }}>
      <div style={{ position: 'absolute', left: 24, top: 9, width: 20, height: 38, borderRight: '10px solid #fff', borderBottom: '10px solid #fff', transform: 'rotate(45deg)' }} />
    </div>
  ) : (
    <div style={{ width: 80, height: 80, borderRadius: 40, background: '#e74c3c', border: '6px solid #000', position: 'relative' }}>
      {[45, -45].map((r) => (
        <div key={r} style={{ position: 'absolute', left: 13, top: 29, width: 42, height: 10, background: '#fff', transform: `rotate(${r}deg)` }} />
      ))}
    </div>
  );

/** What the finished bridge is made of: one ticked item per spoken word. */
const Recap: React.FC<{ T: FullTimeline; t: number }> = ({ T, t }) => {
  const { fps } = useVideoConfig();
  const b = T.recap;
  if (!b || t < b.start || t > T.tFinal + 0.3) return null;
  const out = interpolate(t, [T.tFinal, T.tFinal + 0.3], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const items = ['BEAMS', 'PIERS', 'PILES', 'JOINTS', 'GUARD RAILS'];
  return (
    <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', top: '13%', opacity: out }}>
      <div>
      {items.map((label, i) => {
        const w = b.words[i];
        if (!w || t < w.start) return null;
        const pop = spring({ frame: Math.round((t - w.start + 0.1) * fps), fps, config: { damping: 12, stiffness: 320 } });
        const ok = true;
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 28, marginBottom: 18, transform: `translateX(${(1 - pop) * -120}px)`, opacity: Math.min(1, pop * 1.5) }}>
            <Tick ok={ok} />
            <div style={{
              fontFamily: FONT, fontWeight: 900, fontSize: 104, color: ok ? '#fff' : '#ffb3a8',
              textShadow: `${outline(7)}, 0 8px 0 rgba(0,0,0,0.3)`, textDecoration: ok ? 'none' : 'line-through',
            }}>
              {label}
            </div>
          </div>
        );
      })}
      </div>
    </AbsoluteFill>
  );
};

/** "CROSS-SECTION" tag while the cutaway is on, so viewers know what they're seeing. */
const CutTag: React.FC<{ T: FullTimeline; t: number }> = ({ T, t }) => {
  if (t < T.tCutS || t >= T.tCutE) return null;
  const a = progress(t, T.tCutS, T.tCutS + 0.25) * (1 - progress(t, T.tCutE - 0.2, T.tCutE));
  return (
    <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', top: 270, opacity: a }}>
      <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 56, letterSpacing: 5, color: '#fff', background: 'rgba(0,0,0,0.55)', padding: '12px 28px', borderRadius: 14 }}>
        CROSS-SECTION
      </div>
    </AbsoluteFill>
  );
};

/** White flash when the cold open cuts to the hook. */
const Flash: React.FC<{ t: number }> = ({ t }) => {
  const a = interpolate(t, [COLD - 0.03, COLD, COLD + 0.18], [0, 0.85, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return a > 0 ? <AbsoluteFill style={{ background: '#fff', opacity: a }} /> : null;
};

export const BridgeFullOverlays: React.FC<{ timings: Timings; T: FullTimeline; t: number }> = ({ T, t }) => (
  <>
    <Flash t={t} />
    <Season T={T} t={t} />
    <CutTag T={T} t={t} />
    <Recap T={T} t={t} />
  </>
);
