import React from 'react';
import { AbsoluteFill, useVideoConfig } from 'remotion';
import { clamp01 } from '../../lib/anim';
import type { Timings } from '../../types';
import { projectToScreen } from '../../world/Props';
import { HootBadge } from '../../overlays/HootBadge';
import { Headline, Pill, PillBox } from '../learjet/overlays';
import { buzzActive, buzzOn, buzzT0, cameraPose, MAST, SAT, SAT_POS, towersReached, type AirplaneModeTimeline } from './timeline';

const FONT = "'Montserrat', 'Arial Black', sans-serif";

export const AirplaneModeOverlays: React.FC<{ timings: Timings; T: AirplaneModeTimeline; t: number }> = ({ timings, T, t }) => {
  const { width, height } = useVideoConfig();
  const w = (ev: string, word: string, d: number) => T.wordTime(ev, word, d);
  const pose = cameraPose(timings, T, t);
  const pin = (p: number[], text: string, dot: string, t0: number, t1: number, dy = 0) => {
    if (t < t0 || t > t1) return null;
    const s = projectToScreen(pose, p, width, height);
    return (
      <div key={text} style={{ position: 'absolute', left: Math.min(width * 0.74, Math.max(width * 0.26, s.x)), top: s.y + dy, transform: 'translate(-50%,-50%)', opacity: clamp01((t - t0) / 0.25) }}>
        <PillBox text={text} dot={dot} scale={0.8} />
      </div>
    );
  };
  // running total: a tower counts once it has been reached, even after it scrolls out of range
  const reached = (() => {
    if (t < T.towers || t >= T.rehook) return 0;
    let m = 0;
    for (let u = T.towers; u <= t; u += 1 / 15) m = Math.max(m, towersReached(T, u).length);
    return Math.max(m, towersReached(T, t).length);
  })();
  return (
    <>
      <HootBadge t={t} />

      {/* hook: the switch everyone ignores */}
      <Pill t={t} t0={0.5} t1={T.myth} text="AIRPLANE MODE: OFF" top="30%" dot="#ff4a3d" />

      {/* myth vs reality */}
      {t >= T.myth && t < T.search && (
        <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', top: '16%', gap: 14 }}>
          <div style={{ position: 'relative', opacity: clamp01((t - T.myth) / 0.25) }}>
            <PillBox text="MOVIES: PHONE = PLANE CRASH" dot="#ff4a3d" scale={0.9} />
            <div style={{ position: 'absolute', left: 20, right: 20, top: '50%', height: 6, background: '#ff4a3d', borderRadius: 3, transform: `scaleX(${clamp01((t - w('myth', 'proven', T.myth + 5)) / 0.3)})`, transformOrigin: 'left' }} />
          </div>
          <div style={{ opacity: clamp01((t - w('myth', 'proven', T.myth + 5)) / 0.25) }}>
            <PillBox text="REALITY: NO CRASH EVER PROVEN" dot="#7fd36a" scale={0.9} />
          </div>
        </AbsoluteFill>
      )}

      {/* the phone keeps searching */}
      <Pill t={t} t0={w('search', 'searching', T.search + 3) - 0.1} t1={T.towers} text="SEARCHING AT FULL POWER" top="16%" dot="#ff4a3d" />

      {/* towers: live counter */}
      {t >= T.towers && t < T.rehook && (
        <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', top: '15%' }}>
          <div style={{ background: 'rgba(10,12,16,0.72)', border: '3px solid rgba(255,255,255,0.75)', borderRadius: 18, padding: '8px 28px', textAlign: 'center', opacity: clamp01((t - T.towers) / 0.25) }}>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 24, color: 'rgba(255,255,255,0.8)', letterSpacing: 2 }}>CELL TOWERS REACHED</div>
            <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 72, color: reached > 1 ? '#ff6a5d' : '#fff', fontVariantNumeric: 'tabular-nums' }}>{reached}</div>
          </div>
        </AbsoluteFill>
      )}
      <Pill t={t} t0={w('towers', 'networks', T.towers + 4) - 0.1} t1={T.rehook} text="US BAN ON IN-FLIGHT CALLS · 1991" top="74%" dot="#ffd21f" />

      {/* re-hook + the buzz */}
      <Headline t={t} t0={T.rehook + 0.1} t1={T.buzz} text={'THE REAL\nREASON?'} color="#ffd21f" top="16%" size={84} />
      <Headline t={t} t0={w('buzz', 'buzzing', T.buzz + 2.6)} t1={T.landing} text={'PILOTS CAN HEAR\nYOUR PHONE'} color="#ffffff" top="16%" size={70} />
      {t >= buzzT0(T) - 0.3 && t < T.landing && (
        <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', top: '31%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, background: 'rgba(10,12,16,0.72)', borderRadius: 26, padding: '14px 26px' }}>
            <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 30, color: '#fff', letterSpacing: 2 }}>SOUND ON</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 70 }}>
              {Array.from({ length: 16 }, (_, i) => {
                const on = buzzActive(T, t) && buzzOn(T, t);
                const h = on ? 18 + 50 * Math.abs(Math.sin(i * 1.7 + t * 40)) : 8;
                return <div key={i} style={{ width: 9, height: h, borderRadius: 4, background: on ? '#ff4a3d' : 'rgba(255,255,255,0.5)' }} />;
              })}
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* 200 phones during landing */}
      <Headline t={t} t0={w('landing', '200', T.landing + 1) - 0.05} t1={T.verdict} text="200 PHONES" color="#ff6a5d" top="16%" size={84} />
      <Pill t={t} t0={w('landing', 'landing', T.landing + 2.5)} t1={T.verdict} text="DURING LANDING" top="24%" dot="#ffd21f" />
      <Pill t={t} t0={w('landing', 'tower', T.landing + 5.5) - 0.3} t1={T.verdict} text="PILOTS MUST HEAR THE TOWER" top="30%" dot="#ffffff" />

      {/* verdict */}
      <Pill t={t} t0={w('verdict', "won't", T.verdict + 1)} t1={T.twist} text="WON'T CRASH THE PLANE" top="16%" dot="#7fd36a" />
      <Pill t={t} t0={w('verdict', 'harder', T.verdict + 3.5)} t1={T.twist} text="MAKES THE PILOTS' JOB HARDER" top="22%" dot="#ff4a3d" />
      <Pill t={t} t0={w('verdict', 'moment', T.verdict + 5)} t1={T.twist} text="SOURCES: FAA · FCC · PILOTS" top="28%" dot="#ffffff" />

      {/* the European twist */}
      <Headline t={t} t0={T.twist + 0.05} t1={w('twist', 'Europe', T.twist + 1.3)} text="THE TWIST" color="#ffd21f" top="16%" size={84} />
      <Pill t={t} t0={w('twist', 'Europe', T.twist + 1.3)} t1={T.satellite} text="EUROPE: PHONES ALLOWED" top="16%" dot="#3ddc84" />
      <Pill t={t} t0={w('twist', 'allowed', T.twist + 2.5)} t1={T.satellite} text="EU RULE · 5G SINCE 2022" top="22%" dot="#ffd21f" />
      {pin(MAST, 'MINI MOBILE MAST', '#3ddc84', w('twist', 'tiny', T.twist + 4.5), T.satellite, 90)}
      <Pill t={t} t0={w('satellite', 'whispers', T.satellite + 0.8)} t1={T.battery} text="LOW POWER: IT WHISPERS" top="16%" dot="#3ddc84" />
      {pin([SAT[0] + SAT_POS[0], SAT[1] + SAT_POS[1] + 3.2, SAT[2] + SAT_POS[2]], 'SATELLITE', '#3ddc84', w('satellite', 'satellite', T.satellite + 2.6) - 0.2, T.battery, -70)}

      {/* bonus */}
      <Pill t={t} t0={w('battery', 'battery', T.battery + 1.5)} t1={T.final} text="BONUS: SAVES YOUR BATTERY" top="15%" dot="#7fd36a" />
      <Headline t={t} t0={w('battery', 'searching', T.battery + 2.8)} t1={T.final} text={'SEARCHING\nDRAINS IT'} color="#ffd21f" top="72%" size={64} />

      {/* CTA: yes / no, kept above the platform caption zone */}
      {t >= T.final && (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'flex-start', paddingTop: 1370, flexDirection: 'row', gap: 30, paddingLeft: 260 }}>
          {['YES', 'NO'].map((s, i) => (
            <div key={s} style={{ background: i ? '#ff4a3d' : '#34c759', borderRadius: 26, padding: '18px 44px', fontFamily: FONT, fontWeight: 900, fontSize: 58, color: '#fff', boxShadow: '0 8px 20px rgba(0,0,0,0.3)', opacity: clamp01((t - w('final', 'yes', T.final + 2.2) - i * 0.25) / 0.2) }}>{s}</div>
          ))}
        </AbsoluteFill>
      )}
    </>
  );
};
