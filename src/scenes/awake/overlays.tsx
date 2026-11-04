import React from 'react';
import { AbsoluteFill } from 'remotion';
import { clamp01 } from '../../lib/anim';
import type { Timings } from '../../types';
import { HootBadge } from '../../overlays/HootBadge';
import { Headline, Pill } from '../learjet/overlays';
import { CirclePill } from '../sleep/overlays';
import { clockAt, hoursAt, type AwakeTimeline } from './timeline';

const FONT = "'Montserrat', 'Arial Black', sans-serif";
const fmtClock = (h: number) => {
  const hh = Math.floor(h) % 24, mm = Math.floor((h % 1) * 60);
  const ap = hh < 12 ? 'AM' : 'PM';
  return `${((hh + 11) % 12) + 1}:${String(mm).padStart(2, '0')} ${ap}`;
};

export const AwakeOverlays: React.FC<{ timings: Timings; T: AwakeTimeline; t: number }> = ({ T, t }) => {
  const s = T.s;
  const w = (ev: string, word: string, d: number) => T.wordTime(ev, word, d);
  const hours = hoursAt(T, t);
  const cold = t < s('wake');
  const final = s('final');
  const rewind = t >= s('wake') - 0.05 && t < s('wake') + 0.45;
  return (
    <>
      {/* night tint */}
      {rewind && <AbsoluteFill style={{ background: `rgba(255,255,255,${0.4 * (1 - clamp01((t - s('wake')) / 0.45))})` }} />}
      <HootBadge t={t} />

      {/* hours-awake counter, always on (red during the flash-forward) */}
      <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', top: cold ? '25%' : '71%' }}>
        <div style={{ background: 'rgba(10,12,16,0.72)', border: `3px solid ${cold ? '#ff6a5d' : 'rgba(255,255,255,0.75)'}`, borderRadius: 18, padding: '6px 26px', textAlign: 'center' }}>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 24, color: '#ffd21f', letterSpacing: 3 }}>DAY 1 OF 3 · {fmtClock(clockAt(T, t))}</div>
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 62, color: cold ? '#ff6a5d' : '#fff', lineHeight: 1.1 }}>HOUR {Math.floor(hours)}</div>
        </div>
      </AbsoluteFill>

      {/* cold open: the flash-forward, then the rewind */}
      <Pill t={t} t0={w('cold', 'hours', s('cold') + 3.6) - 0.1} t1={s('wake') - 0.05} text="24 H AWAKE = DRUNK DRIVER" top="72%" dot="#ff4a3d" />
      <Pill t={t} t0={s('wake')} t1={s('wake') + 1.6} text="REWIND · 7:00 AM" top="23%" dot="#ffffff" />

      {/* the normal day, fast-forwarded */}
      {t >= s('day') + 0.2 && t < s('h16') - 0.2 && (
        <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', top: '16%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'rgba(10,12,16,0.75)', borderRadius: 30, padding: '10px 28px' }}>
            {[0, 1].map((i) => <div key={i} style={{ width: 0, height: 0, borderTop: '18px solid transparent', borderBottom: '18px solid transparent', borderLeft: `28px solid ${Math.floor(t * 4) % 2 === i ? '#ffd21f' : '#ffffff'}` }} />)}
            <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 40, color: '#fff', letterSpacing: 3 }}>FAST FORWARD</div>
          </div>
        </AbsoluteFill>
      )}
      <Pill t={t} t0={w('day', 'Coffee', s('day') + 2.4) - 0.1} t1={s('h16') - 0.2} text="COFFEE · WORK · DINNER" top="23%" dot="#7fd36a" />
      {/* hour 16: adenosine meter */}
      {t >= w('h16', 'adenosine', s('h16') + 2) - 0.1 && t < s('h17') && (
        <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', top: '16%' }}>
          <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 26, padding: '12px 26px', boxShadow: '0 6px 18px rgba(0,0,0,0.3)', textAlign: 'center' }}>
            <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 34, color: '#14171a' }}>ADENOSINE = SLEEP PRESSURE</div>
            <div style={{ width: 560, height: 22, borderRadius: 11, background: '#e6e8ec', marginTop: 10, overflow: 'hidden' }}>
              <div style={{ width: `${100 * clamp01(0.55 + 0.45 * (t - w('h16', 'adenosine', s('h16') + 2)) / 3)}%`, height: '100%', background: 'linear-gradient(90deg,#ffd21f,#ff4a3d)' }} />
            </div>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 20, color: '#6b7280', marginTop: 6 }}>SOURCE: NIH</div>
          </div>
        </AbsoluteFill>
      )}

      {/* hour 17 */}
      <CirclePill t={t} t0={w('h17', 'slow', s('h17') + 1.7) - 0.3} t1={s('h20') - 0.15} before="17 H ≈" circled="0.05%" after="BLOOD ALCOHOL · CDC" top="16%" dot="#ffd21f" />
      <Pill t={t} t0={w('h17', 'reactions', s('h17') + 1) + 0.9} t1={s('h20')} text="REACTION: TOO SLOW" top="23%" dot="#ff4a3d" />

      {/* 3 am */}
      <Pill t={t} t0={w('h20', 'lowest', s('h20') + 2.5) - 0.2} t1={s('h22')} text="BODY CLOCK: LOWEST POINT" top="16%" dot="#3fb6ff" />
      <Pill t={t} t0={w('h20', 'hardest', s('h20') + 3.8) - 0.2} t1={s('h22')} text="THE HARDEST HOUR" top="23%" dot="#ff4a3d" />

      {/* hour 22 */}
      <Pill t={t} t0={w('h22', 'hunger', s('h22') + 1.2) - 0.1} t1={s('second')} text="HUNGER HORMONE (GHRELIN) UP" top="16%" dot="#ffd21f" />

      {/* sunrise second wind */}
      <Headline t={t} t0={s('second') + 0.05} t1={w('second', 'sun', s('second') + 1.4)} text="SOMETHING WEIRD" color="#ffd21f" top="16%" size={70} />
      <Pill t={t} t0={w('second', 'awake', s('second') + 3) - 0.1} t1={s('h24')} text="THE SECOND WIND" top="16%" dot="#7fd36a" />
      <Pill t={t} t0={w('second', "That's", s('second') + 3.6) - 0.1} t1={s('h24')} text="BODY CLOCK, NOT ENERGY" top="23%" dot="#ff4a3d" />

      {/* hour 24 */}
      <CirclePill t={t} t0={w('h24', 'drunk', s('h24') + 3) - 0.3} t1={final + 2.2} before="24 H ≈" circled="0.10%" after="· US LIMIT 0.08%" top="16%" dot="#ff4a3d" />
      <Pill t={t} t0={w('h24', 'drunk', s('h24') + 3) + 0.4} t1={final + 2.2} text="SOURCE: CDC" top="23%" dot="#ffffff" />

      {/* end */}
      {final > 0 && <Pill t={t} t0={final + 2.3} t1={T.end - 1.95} text="DON'T TRY THIS AT HOME" top="23%" dot="#ff4a3d" />}
    </>
  );
};
