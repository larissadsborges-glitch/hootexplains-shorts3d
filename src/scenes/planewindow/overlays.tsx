import React from 'react';
import { AbsoluteFill, useVideoConfig } from 'remotion';
import { clamp01 } from '../../lib/anim';
import type { Timings } from '../../types';
import { projectToScreen } from '../../world/Props';
import { HootBadge } from '../../overlays/HootBadge';
import { Headline, Pill, PillBox } from '../learjet/overlays';
import { cameraPose, descentAlt, PANES, type PlaneWindowTimeline } from './timeline';

const FONT = "'Montserrat', 'Arial Black', sans-serif";
const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

export const PlaneWindowOverlays: React.FC<{ timings: Timings; T: PlaneWindowTimeline; t: number }> = ({ timings, T, t }) => {
  const { width, height } = useVideoConfig();
  const w = (ev: string, word: string, d: number) => T.wordTime(ev, word, d);
  const pose = cameraPose(timings, T, t);
  const pin = (p: number[], text: string, dot: string, t0: number, t1: number) => {
    if (t < t0 || t > t1) return null;
    const s = projectToScreen(pose, p, width, height);
    return (
      <div key={text} style={{ position: 'absolute', left: Math.min(width * 0.78, Math.max(width * 0.22, s.x)), top: s.y, transform: 'translate(-50%,-50%)', opacity: clamp01((t - t0) / 0.25) }}>
        <PillBox text={text} dot={dot} scale={0.85} />
      </div>
    );
  };
  // hypoxia: the edges darken while the clock runs
  const dark = t >= T.clock && t < T.masks ? 0.55 * clamp01((t - T.clock) / 3) : t >= T.masks && t < T.masks + 1 ? 0.55 * (1 - (t - T.masks)) : 0;
  const clockP = clamp01((t - T.clock) / (T.masks - T.clock));
  const sepia = t >= T.story && t < T.final ? 1 : 0;
  return (
    <>
      {sepia > 0 && <AbsoluteFill style={{ background: 'radial-gradient(circle, rgba(112,74,30,0.12) 45%, rgba(40,25,10,0.55) 100%)' }} />}
      {dark > 0 && <AbsoluteFill style={{ background: `radial-gradient(circle, rgba(0,0,0,0) 35%, rgba(0,0,0,${dark}) 85%)` }} />}
      <HootBadge t={t} />

      <Pill t={t} t0={w('pressure', 'thin', T.pressure + 1)} t1={T.force} text="OUTSIDE: -67°F (-55°C) · THIN AIR" top="17%" dot="#9fdcff" />
      <Pill t={t} t0={w('pressure', 'pumped', T.pressure + 3.5)} t1={T.force} text="INSIDE: PRESSURISED" top="23%" dot="#ff4a3d" />
      <Headline t={t} t0={w('force', 'thousand', T.force + 1)} t1={T.panes} text="1,000+ LB" top="16%" />
      <Pill t={t} t0={w('force', 'thousand', T.force + 1.5) + 0.4} t1={T.panes} text="~500 KG ON EVERY WINDOW" top="23%" dot="#ff4a3d" />
      {t >= w('force', 'piano', T.force + 3) && t < T.panes && (
        <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', top: '29%', opacity: clamp01((t - w('force', 'piano', T.force + 3)) / 0.2) }}>
          <svg width="360" height="235" viewBox="0 0 230 150">
            <path d="M20 40 Q20 20 60 20 L150 20 Q200 20 210 60 Q215 90 170 95 L20 95 Z" fill="#1b1b1f" stroke="#fff" strokeWidth="4" />
            {Array.from({ length: 9 }, (_, i) => <rect key={i} x={28 + i * 15} y="80" width="13" height="14" fill="#fff" />)}
            <rect x="30" y="95" width="10" height="45" fill="#1b1b1f" stroke="#fff" strokeWidth="3" />
            <rect x="170" y="95" width="10" height="45" fill="#1b1b1f" stroke="#fff" strokeWidth="3" />
          </svg>
        </AbsoluteFill>
      )}
      {pin([PANES[0], PANES[1] + 0.75, PANES[2] - 0.35], 'OUTER · TAKES THE LOAD', '#ff4a3d', w('panes', 'outer', T.panes + 2), T.hole)}
      {pin([PANES[0] - 0.55, PANES[1] + 0.35, PANES[2]], 'MIDDLE · BACKUP', '#9fdcff', T.hole, T.hole + 1.6)}
      {pin([PANES[0] + 0.55, PANES[1] + 0.62, PANES[2] + 0.35], 'INNER · SCRATCH SHIELD', '#ffffff', w('panes', 'three', T.panes + 1.2), T.hole)}
      <Headline t={t} t0={T.rehook + 0.1} t1={T.decomp} text={'2 LAYERS\nBREAK?'} color="#ff6a5d" top="16%" size={80} />
      <Headline t={t} t0={T.decomp} t1={T.clock} text="UNDER 1 SECOND" top="16%" size={74} />
      {t >= T.clock && t < T.masks && (
        <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', top: '15%' }}>
          <div style={{ background: 'rgba(10,12,16,0.75)', borderRadius: 28, padding: '18px 34px', textAlign: 'center' }}>
            <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 28, color: '#9fdcff', letterSpacing: 2 }}>YOU'VE BEEN WATCHING</div>
            <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 96, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>0:{String(Math.floor(t)).padStart(2, '0')}</div>
            <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 30, color: '#ffd21f', marginBottom: 10 }}>CLEAR-HEADED UP HERE: 15–30 SEC</div>
            <div style={{ width: 520, height: 18, borderRadius: 9, background: 'rgba(255,255,255,0.2)', overflow: 'hidden' }}>
              <div style={{ width: `${(1 - clockP) * 100}%`, height: '100%', background: '#ff4a3d' }} />
            </div>
          </div>
        </AbsoluteFill>
      )}
      <Pill t={t} t0={T.clock + 2.5} t1={T.masks} text="SOURCE: FAA" top="31%" dot="#ffffff" />
      {/* the movie version vs reality */}
      {t >= T.myth && t < T.pressure && (
        <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', top: '16%', gap: 14 }}>
          <div style={{ position: 'relative', opacity: clamp01((t - T.myth) / 0.25) }}>
            <PillBox text="MOVIES: EVERYONE GETS SUCKED OUT" dot="#ff4a3d" scale={0.9} />
            <div style={{ position: 'absolute', left: 20, right: 20, top: '50%', height: 6, background: '#ff4a3d', borderRadius: 3, transform: `scaleX(${clamp01((t - T.wordTime('myth', 'reality', T.myth + 3)) / 0.3)})`, transformOrigin: 'left' }} />
          </div>
          <div style={{ opacity: clamp01((t - T.wordTime('myth', 'reality', T.myth + 3)) / 0.25) }}>
            <PillBox text="REALITY: DIFFERENT… BUT STILL SCARY" dot="#7fd36a" scale={0.9} />
          </div>
        </AbsoluteFill>
      )}
      {/* altitude, always visible in the cabin before the descent */}
      {t >= 2.6 && t < T.descent && (
        <div style={{ position: 'absolute', left: 300, top: 180, opacity: clamp01((t - 2.6) / 0.25), background: 'rgba(10,12,16,0.65)', borderRadius: 14, padding: '6px 14px', fontFamily: FONT, fontWeight: 900, fontSize: 30, color: '#fff' }}>
          35,000 FT <span style={{ color: '#ffd21f', fontSize: 22 }}>10.7 KM</span>
        </div>
      )}
      <Pill t={t} t0={w('masks', 'masks', T.masks + 0.6)} t1={T.descent} text="MASKS DROP AUTOMATICALLY" top="17%" dot="#ffd21f" />
      <Headline t={t} t0={w('masks', 'yours', T.masks + 2)} t1={T.descent} text={'YOURS\nFIRST'} top="23%" size={80} />
      {t >= T.descent && t < T.story && (
        <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', top: '16%' }}>
          <div style={{ background: 'rgba(10,12,16,0.72)', border: '3px solid rgba(255,255,255,0.75)', borderRadius: 18, padding: '8px 26px', textAlign: 'center' }}>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 24, color: 'rgba(255,255,255,0.8)', letterSpacing: 2 }}>ALTITUDE</div>
            <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 64, color: '#fff' }}>{fmt(Math.round(descentAlt(T, t) / 50) * 50)} FT</div>
            <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 30, color: '#ffd21f' }}>{(descentAlt(T, t) * 0.0003048).toFixed(1)} KM</div>
          </div>
        </AbsoluteFill>
      )}
      <Pill t={t} t0={w('descent', 'breathable', T.descent + 2.5)} t1={T.story} text="BREATHABLE AIR AGAIN" top="29%" dot="#7fd36a" />
      <Pill t={t} t0={T.story + 0.2} t1={T.captain} text="TRUE STORY · 1990" top="16%" dot="#ffd21f" />
      <Pill t={t} t0={w('story', '17000', T.story + 4)} t1={T.captain} text="17,000 FT (5.2 KM)" top="22%" dot="#ff4a3d" />
      <Pill t={t} t0={w('survived', '20', T.survived + 1.5)} t1={T.final} text="HELD FOR 20 MINUTES" top="16%" dot="#ffd21f" />
      <Headline t={t} t0={w('survived', 'survived', T.survived + 4)} t1={T.final} text={'EVERYONE\nSURVIVED'} color="#7fd36a" top="22%" size={80} />
      {t >= T.final && (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'flex-start', paddingTop: 1370, flexDirection: 'row', gap: 30, paddingRight: 120 }}>
          {['WINDOW', 'AISLE'].map((s, i) => (
            <div key={s} style={{ background: i ? '#3fb6ff' : '#ff8a3d', borderRadius: 26, padding: '18px 36px', fontFamily: FONT, fontWeight: 900, fontSize: 58, color: '#fff', boxShadow: '0 8px 20px rgba(0,0,0,0.3)', opacity: clamp01((t - T.final - 0.3 - i * 0.2) / 0.2) }}>{s}</div>
          ))}
        </AbsoluteFill>
      )}
    </>
  );
};
