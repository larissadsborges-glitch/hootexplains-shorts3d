import React from 'react';
import { AbsoluteFill, spring, useVideoConfig } from 'remotion';
import { clamp01, progress } from '../../lib/anim';
import type { Timings } from '../../types';
import { projectToScreen } from '../../world/Props';
import {
  AUSTIN, cameraPose, ELEUTHERA, EVEREST, geo, hookAltitude, hookClock, realAltitude, vsAt, type LearjetTimeline,
} from './timeline';

const FONT = "'Montserrat', 'Arial Black', sans-serif";
const outline = (px: number) =>
  Array.from({ length: 16 }, (_, a) => {
    const r = (a / 16) * Math.PI * 2;
    return `${(Math.cos(r) * px).toFixed(1)}px ${(Math.sin(r) * px).toFixed(1)}px 0 #000`;
  }).join(',');

const usePop = (t: number, t0: number) => {
  const { fps } = useVideoConfig();
  return spring({ frame: Math.max(0, Math.round((t - t0) * fps)), fps, config: { damping: 12, stiffness: 220 } });
};
const fadeOut = (t: number, t1: number) => 1 - clamp01((t - t1 + 0.2) / 0.2);

/** Big outlined headline (numbers, key words). */
export const Headline: React.FC<{ t: number; t0: number; t1: number; text: string; color?: string; top?: string; size?: number }> = ({ t, t0, t1, text, color = '#ffd21f', top = '19%', size = 84 }) => {
  const p = usePop(t, t0);
  if (t < t0 || t > t1) return null;
  return (
    <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', top, opacity: fadeOut(t, t1) }}>
      <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: size, color, textAlign: 'center', lineHeight: 1.05, whiteSpace: 'pre', textShadow: `${outline(7)}, 0 10px 0 rgba(0,0,0,0.3)`, transform: `scale(${p})` }}>{text}</div>
    </AbsoluteFill>
  );
};

/** Small white pill tag with a dot (calm, like the roof reference). */
export const PillBox: React.FC<{ text: string; dot?: string; scale?: number }> = ({ text, dot = '#e2453c', scale = 1 }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'rgba(255,255,255,0.95)', borderRadius: 40, padding: '10px 26px', boxShadow: '0 6px 18px rgba(0,0,0,0.3)', transform: `scale(${scale})`, whiteSpace: 'nowrap' }}>
    <div style={{ width: 16, height: 16, borderRadius: 8, background: dot }} />
    <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 40, color: '#14171a', letterSpacing: 1 }}>{text}</div>
  </div>
);
export const Pill: React.FC<{ t: number; t0: number; t1: number; text: string; top?: string; dot?: string }> = ({ t, t0, t1, text, top = '26%', dot }) => {
  const p = usePop(t, t0);
  if (t < t0 || t > t1) return null;
  return (
    <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', top, opacity: fadeOut(t, t1) }}>
      <PillBox text={text} dot={dot} scale={p} />
    </AbsoluteFill>
  );
};

/** Pill pinned to a 3D point. */
const PinPill: React.FC<{ x: number; y: number; text: string; dot?: string; a: number }> = ({ x, y, text, dot, a }) => {
  const { width } = useVideoConfig();
  const cx = Math.min(width * 0.78, Math.max(width * 0.2, x));
  return a > 0 ? (
    <div style={{ position: 'absolute', left: cx, top: y, transform: 'translate(-50%,-50%)', opacity: a }}>
      <PillBox text={text} dot={dot} scale={0.85} />
    </div>
  ) : null;
};

const Waveform: React.FC<{ t: number; color: string; n?: number; active?: boolean }> = ({ t, color, n = 22, active = true }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 70 }}>
    {Array.from({ length: n }, (_, i) => {
      const h = active ? 12 + 50 * Math.abs(Math.sin(t * 11 + i * 1.7) * Math.sin(t * 5.3 + i * 0.6)) : 8;
      return <div key={i} style={{ width: 9, height: h, borderRadius: 5, background: color }} />;
    })}
  </div>
);

/** Radio / quote card: who said it, what they said. */
const Quote: React.FC<{ t: number; t0: number; t1: number; who: string; text: string; top?: string; wave?: boolean }> = ({ t, t0, t1, who, text, top = '16%', wave }) => {
  const p = usePop(t, t0);
  if (t < t0 || t > t1) return null;
  return (
    <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', top, opacity: fadeOut(t, t1) }}>
      <div style={{ transform: `scale(${p})`, background: 'rgba(12,16,22,0.82)', borderRadius: 28, padding: '22px 34px', maxWidth: 820, boxShadow: '0 10px 30px rgba(0,0,0,0.35)', border: '3px solid rgba(255,255,255,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 30, color: '#9fdcff', letterSpacing: 2 }}>{who}</div>
          {wave && <Waveform t={t} color="#9fdcff" n={10} />}
        </div>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 50, color: '#fff', marginTop: 6, lineHeight: 1.15 }}>{text}</div>
      </div>
    </AbsoluteFill>
  );
};

const CounterBox: React.FC<{ label: string; value: string; red?: boolean; sub?: string }> = ({ label, value, red, sub }) => (
  <div style={{ background: 'rgba(10,12,16,0.72)', border: `3px solid ${red ? '#ff4a3d' : 'rgba(255,255,255,0.75)'}`, borderRadius: 16, padding: '6px 18px', minWidth: 210, textAlign: 'center' }}>
    <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 22, color: 'rgba(255,255,255,0.8)', letterSpacing: 2 }}>{label}</div>
    <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 46, color: red ? '#ff6a5d' : '#fff', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    {sub && <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 18, color: '#ffd21f', letterSpacing: 2 }}>{sub}</div>}
  </div>
);
const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

const Icon: React.FC<{ kind: string }> = ({ kind }) => {
  const s = { width: 64, height: 64 };
  if (kind === 'weather') return <svg {...s} viewBox="0 0 64 64"><path d="M18 46h30a10 10 0 0 0 0-20 14 14 0 0 0-27-3A11 11 0 0 0 18 46z" fill="#cfd8e2" /><path d="M30 46l-5 10h7l-3 8" stroke="#ffd21f" strokeWidth="4" fill="none" /></svg>;
  if (kind === 'ice') return <svg {...s} viewBox="0 0 64 64">{[0, 60, 120].map((a) => <line key={a} x1="32" y1="8" x2="32" y2="56" stroke="#9fdcff" strokeWidth="5" transform={`rotate(${a} 32 32)`} />)}</svg>;
  if (kind === 'radar') return <svg {...s} viewBox="0 0 64 64"><circle cx="32" cy="32" r="26" stroke="#7dd87d" strokeWidth="4" fill="none" /><circle cx="32" cy="32" r="14" stroke="#7dd87d" strokeWidth="3" fill="none" /><line x1="32" y1="32" x2="52" y2="16" stroke="#7dd87d" strokeWidth="4" /></svg>;
  return <svg {...s} viewBox="0 0 64 64"><circle cx="27" cy="27" r="16" stroke="#ffffff" strokeWidth="5" fill="none" /><line x1="39" y1="39" x2="56" y2="56" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" /></svg>;
};

export const LearjetOverlays: React.FC<{ timings: Timings; T: LearjetTimeline; t: number }> = ({ timings, T, t }) => {
  const { width, height } = useVideoConfig();
  const w = (ev: string, word: string, d: number) => T.wordTime(ev, word, d);
  const pose = cameraPose(timings, T, t);
  const proj = (p: number[]) => projectToScreen(pose, p, width, height);

  // counters: sped-up replay in the hook, real time from the mayday on
  const hook = t < T.route;
  const dive = t >= T.mayday - 0.05 && t < T.everest;
  const clock = hookClock(T, t);
  const counters = hook ? (
    <>
      <CounterBox label="ALTITUDE" value={`${fmt(Math.round(hookAltitude(T, t) / 10) * 10)} FT`} red={clock > 3} />
      <CounterBox label="TIME" value={`0:${String(Math.floor(clock)).padStart(2, '0')}`.replace('0:60', '1:00')} sub="SPED UP" />
    </>
  ) : dive ? (
    <>
      <CounterBox label="ALTITUDE" value={`${fmt(Math.round(realAltitude(T, t) / 10) * 10)} FT`} red={vsAt(T, t) < -5000} />
      <CounterBox label="VERTICAL SPEED" value={`${fmt(Math.round(vsAt(T, t) / 100) * 100)}`} red={vsAt(T, t) < -5000} sub="FT / MIN" />
    </>
  ) : null;

  // whiteout as the hook dives into the cloud deck
  const white = clamp01((t - (T.route - 0.45)) / 0.4) * (1 - clamp01((t - T.route) / 0.35));

  // map labels
  const mapOn = t >= T.route && t < T.cruise;
  const mapLabel = (lonlat: number[], text: string, t0: number, dot: string) => {
    const s = proj(geo(lonlat[0], lonlat[1], 0.4));
    return <PinPill key={text} x={s.x} y={s.y - 70} text={text} dot={dot} a={mapOn ? clamp01((t - t0) / 0.3) : 0} />;
  };

  // Everest labels
  const evOn = t >= T.everest && t < T.impact;
  const evLabel = (p: number[], text: string, dot: string, t0: number) => {
    const s = proj(p);
    return <PinPill key={text} x={s.x} y={s.y} text={text} dot={dot} a={evOn ? clamp01((t - t0) / 0.3) : 0} />;
  };

  const sky = t >= T.skydiver;
  const pJet = progress(t, T.skydiver + 0.2, T.skydiver + 2.6) ** 1.2;
  const checklist = [['weather', 'WEATHER'], ['ice', 'ICE'], ['radar', 'RADAR DATA'], ['wreckage', 'WRECKAGE']] as const;

  return (
    <>
      {white > 0 && <AbsoluteFill style={{ background: '#f4f6f8', opacity: white }} />}
      {/* always-on recreation tag */}
      <div style={{ position: 'absolute', left: 54, top: 96, display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(10,12,16,0.6)', borderRadius: 20, padding: '6px 16px' }}>
        <div style={{ width: 12, height: 12, borderRadius: 6, background: '#ff4a3d' }} />
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 24, color: '#fff', letterSpacing: 2 }}>RECREATION</div>
      </div>
      {counters && (
        <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'flex-start', top: hook ? '8.5%' : '8.5%', flexDirection: 'row', gap: 18, paddingLeft: 120 }}>
          {counters}
        </AbsoluteFill>
      )}

      <Headline t={t} t0={w('onboard', 'nine', T.onboard)} t1={T.route - 0.4} text="9 ON BOARD" top="27%" />

      <Pill t={t} t0={T.route + 0.1} t1={T.cruise} text="SUNDAY · 1 NOV 2026" top="17%" dot="#3fb6ff" />
      <Pill t={t} t0={w('route', 'learjet', T.route + 2)} t1={T.cruise} text="LEARJET 60 · 22 YEARS OLD" top="23%" dot="#ffd21f" />
      {mapLabel(AUSTIN, 'AUSTIN, TX', T.route + 0.6, '#ffffff')}
      {mapLabel(ELEUTHERA, 'BAHAMAS', w('route', 'bahamas', T.route + 4), '#3fb6ff')}
      {mapLabel([-82.3, 28.6], 'FLORIDA', w('route', 'bahamas', T.route + 4) + 0.3, '#7fd36a')}

      <Headline t={t} t0={w('cruise', '35000', T.cruise + 0.6)} t1={T.storms} text="35,000 FT" />
      <Pill t={t} t0={T.storms + 0.3} t1={T.ice} text="SCATTERED STORMS" dot="#9aa6b1" />

      <Quote t={t} t0={T.ice + 0.5} t1={T.section} who="PILOT → MIAMI CENTER" text={'"Light, clear ice… manageable"'} wave />
      <Pill t={t} t0={w('ice', 'turbulence', T.ice + 3)} t1={T.section} text="MODERATE TURBULENCE · OUTSIDE -47°C" top="33%" dot="#9fdcff" />

      <Pill t={t} t0={T.section + 0.2} t1={T.climb} text="CROSS-SECTION OF A WING" top="15%" dot="#9fdcff" />
      <Headline t={t} t0={T.sectionShape} t1={T.climb} text="LESS LIFT" top="21%" size={80} />
      <Headline t={t} t0={T.sectionShape + 0.35} t1={T.climb} text="MORE DRAG" color="#ff6a5d" top="27%" size={80} />

      <Headline t={t} t0={w('climb', '2000', T.climb + 0.8)} t1={T.radio} text="+2,000 FT?" />

      {t >= T.radio && t < T.mayday && (
        <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', top: '19%' }}>
          <Waveform t={t} color={t > T.radio + 0.9 ? '#ff4a3d' : '#9fdcff'} n={22} />
        </AbsoluteFill>
      )}
      <Headline t={t} t0={T.mayday + 0.05} t1={T.overspeed} text="MAYDAY" color="#ff6a5d" />
      <Headline t={t} t0={T.overspeedWord} t1={T.stress} text="OVERSPEED" color="#ff6a5d" />
      <Pill t={t} t0={w('stress', 'safe', T.stress + 1)} t1={T.everest} text="FASTER THAN ITS SAFE LIMIT" dot="#ff4a3d" />

      <Headline t={t} t0={T.everest + 0.4} t1={T.skydiver} text={'26,500 FT\nIN ~1 MINUTE'} size={74} top="75%" />
      {evLabel([EVEREST[0] + 11, 35.25, EVEREST[2]], '35,250 FT', '#ffffff', T.everest + 0.3)}
      {!sky && evLabel([EVEREST[0] + 11, 8.75, EVEREST[2]], '8,750 FT', '#ff4a3d', T.everest + 3.4)}
      {!sky && evLabel([EVEREST[0] - 4, 26.5, EVEREST[2] - 8], 'EVEREST 29,032 FT', '#ffd21f', w('everest', 'everest', T.everest + 4))}
      <Headline t={t} t0={w('skydiver', 'twice', T.skydiver + 1)} t1={T.impact} text={'MORE THAN 2×\nA SKYDIVER'} size={74} top="75%" />
      {sky && evLabel([EVEREST[0] + 1.5, 35.25 - (26.5 * pJet) / 2.4 - 2.5, EVEREST[2]], 'SKYDIVER', '#ff9a3c', T.skydiver + 0.3)}
      {sky && evLabel([EVEREST[0] + 7.5, 35.25 - 26.5 * pJet - 4, EVEREST[2]], 'THE JET', '#ff4a3d', T.skydiver + 0.3)}

      <Pill t={t} t0={w('impact', 'palm', T.impact + 2.5)} t1={T.crater} text="PALM BEACH COUNTY, FLORIDA" top="17%" dot="#ff4a3d" />
      <Pill t={t} t0={w('impact', 'palm', T.impact + 2.5) + 0.3} t1={T.crater} text="12:50 PM · SUNDAY" top="23%" dot="#ffffff" />

      <Quote t={t} t0={T.crater + 0.3} t1={T.evac} who="FLORIDA GOV. RON DESANTIS" text={'"Looked like a missile going down"'} />

      <Headline t={t} t0={w('evac', '600', T.evac + 2)} t1={T.question} text={'600 RESIDENTS\nMOVED'} size={76} />
      <Pill t={t} t0={T.evac + 0.4} t1={T.question} text="NO INJURIES REPORTED ON THE GROUND" top="31%" dot="#7fd36a" />

      {t >= T.question && t < T.checklist && (
        <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', top: '15%' }}>
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 210, color: '#ffd21f', textShadow: `${outline(10)}`, transform: `scale(${0.9 + 0.05 * Math.sin(t * 3)})`, opacity: fadeOut(t, T.checklist) }}>?</div>
        </AbsoluteFill>
      )}
      <Headline t={t} t0={w('question', 'investigators', T.question + 2)} t1={T.checklist} text="CAUSE NOT KNOWN YET" top="31%" size={70} />

      {t >= T.checklist && t < T.memorial && (
        <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', top: '14%', opacity: fadeOut(t, T.memorial) }}>
          <div style={{ background: 'rgba(10,12,16,0.78)', borderRadius: 28, padding: '22px 40px', minWidth: 560 }}>
            <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 30, color: '#9fdcff', letterSpacing: 2, marginBottom: 8 }}>NTSB WILL LOOK AT</div>
            {checklist.map(([key, label]) => {
              const t0 = w('checklist', key === 'radar' ? 'radar' : key, T.checklist + 1);
              const a = clamp01((t - t0) / 0.25);
              return (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 22, margin: '10px 0', opacity: a, transform: `translateX(${(1 - a) * -40}px)` }}>
                  <div style={{ width: 40, height: 40, border: '4px solid #fff', borderRadius: 8 }} />
                  <Icon kind={key} />
                  <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 52, color: '#fff' }}>{label}</div>
                </div>
              );
            })}
          </div>
        </AbsoluteFill>
      )}

      <Headline t={t} t0={T.memorial + 0.2} t1={T.final} text="9 LIVES LOST" color="#ffffff" top="18%" />
      <Pill t={t} t0={w('memorial', 'cause', T.memorial + 2)} t1={T.final} text="CAUSE UNDER INVESTIGATION" top="26%" dot="#ffd21f" />
    </>
  );
};
