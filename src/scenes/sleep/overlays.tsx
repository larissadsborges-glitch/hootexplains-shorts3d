import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Circle } from '@remotion/rough-notation';
import { clamp01 } from '../../lib/anim';
import type { Timings } from '../../types';
import { HootBadge } from '../../overlays/HootBadge';
import { Headline, Pill } from '../learjet/overlays';
import { driveAt, hoursAt, microAt, type SleepTimeline } from './timeline';

const FONT = "'Montserrat', 'Arial Black', sans-serif";

/** A white pill like PillBox, with one part circled by hand (rough-notation), drawn on over 0.5 s. */
export const CirclePill: React.FC<{ t: number; t0: number; t1: number; before: string; circled: string; after?: string; top: string; dot: string }> = ({ t, t0, t1, before, circled, after = '', top, dot }) => {
  if (t < t0 || t > t1) return null;
  const pop = Math.min(1, 0.6 + (t - t0) / 0.15 * 0.4);
  const fade = clamp01((t1 - t) / 0.2);
  const draw = clamp01((t - t0 - 0.15) / 0.35);
  return (
    <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', top, opacity: fade }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'rgba(255,255,255,0.95)', borderRadius: 40, padding: '10px 30px', boxShadow: '0 6px 18px rgba(0,0,0,0.3)', transform: `scale(${pop})`, whiteSpace: 'nowrap', fontFamily: FONT, fontWeight: 800, fontSize: 42, color: '#14171a', letterSpacing: 1 }}>
        <div style={{ width: 16, height: 16, borderRadius: 8, background: dot }} />
        <span>{before}</span>
        <Circle color="#ff3b30" strokeWidth={4} padding={{ left: 6, right: 6, top: 4, bottom: 4 }} iterations={2} progress={draw}><span style={{ color: '#d6281c' }}>{circled}</span></Circle>
        {after && <span>{after}</span>}
      </div>
    </AbsoluteFill>
  );
};

export const SleepOverlays: React.FC<{ timings: Timings; T: SleepTimeline; t: number }> = ({ timings, T, t }) => {
  const w = (ev: string, word: string, d: number) => T.wordTime(ev, word, d);
  const s = T.s;
  const shot = timings.beats.reduce((a, b) => (t >= b.start ? b.shot : a), timings.beats[0].shot);
  const showCounter = shot !== 'story' && shot !== 'sleep' && !(T.s('final') > 0 && t >= T.s('final'));
  const hours = Math.floor(hoursAt(T, t));
  const micro = microAt(T, t);
  const d = driveAt(T, t);
  const lids = T.day === 2 && shot === 'road' ? (d < 0 ? 0 : d < 5 ? Math.min(1, d / 0.3) : Math.max(0, 1 - (d - 5) / 0.3)) : 0;
  const sepia = shot === 'story';
  const final = s('final');
  return (
    <>
      {sepia && <AbsoluteFill style={{ background: 'radial-gradient(circle, rgba(112,74,30,0.15) 45%, rgba(40,25,10,0.55) 100%)', mixBlendMode: 'multiply' }} />}
      {/* eyes closed while driving: lids from top and bottom, a slit in the middle */}
      {lids > 0 && (
        <>
          <AbsoluteFill style={{ top: 0, height: `${34 * lids}%`, background: 'linear-gradient(#000 80%, rgba(0,0,0,0))' }} />
          <AbsoluteFill style={{ top: `${100 - 34 * lids}%`, background: 'linear-gradient(rgba(0,0,0,0), #000 20%)' }} />
        </>
      )}
      {/* microsleep blackout */}
      {micro > 0 && (
        <AbsoluteFill style={{ background: `rgba(0,0,0,${0.93 * micro})`, justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 64, color: '#fff', letterSpacing: 6, opacity: micro }}>MICROSLEEP</div>
        </AbsoluteFill>
      )}
      <HootBadge t={t} />

      {/* the hours-awake counter */}
      {showCounter && (
        <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', top: '29%' }}>
          <div style={{ background: 'rgba(10,12,16,0.72)', border: '3px solid rgba(255,255,255,0.75)', borderRadius: 18, padding: '6px 26px', textAlign: 'center' }}>
            <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 24, color: '#ffd21f', letterSpacing: 3 }}>DAY {T.day} OF 3 · HOURS AWAKE</div>
            <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 66, color: hours >= 48 ? '#ff6a5d' : '#fff', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>{hours}</div>
          </div>
        </AbsoluteFill>
      )}

      {T.day === 1 && (
        <>
          <CirclePill t={t} t0={s('h17') + 0.4} t1={s('h24')} before="17 H ≈" circled="0.05%" after="BLOOD ALCOHOL" top="16%" dot="#ffd21f" />
          <CirclePill t={t} t0={w('h24', 'drunk', s('h24') + 1.3)} t1={s('stress')} before="24 H ≈" circled="0.10%" after="· US LIMIT 0.08%" top="16%" dot="#ff4a3d" />
          <Pill t={t} t0={w('h24', 'cranky', s('h24') + 4)} t1={s('stress')} text="SOURCE: CDC" top="22%" dot="#ffffff" />
          <Pill t={t} t0={w('stress', 'cortisol', s('stress') + 3)} t1={s('hunger')} text="CORTISOL UP" top="16%" dot="#ff4a3d" />
          <Pill t={t} t0={w('stress', 'adrenaline', s('stress') + 3.6)} t1={s('hunger')} text="ADRENALINE UP" top="22%" dot="#ff4a3d" />
          <Pill t={t} t0={w('hunger', 'hormone', s('hunger') + 1.5)} t1={s('rehook')} text="HUNGER HORMONE (GHRELIN) UP" top="16%" dot="#ffd21f" />
          <Headline t={t} t0={s('rehook') + 0.05} t1={final} text={"THAT'S JUST\nDAY 1"} color="#ffd21f" top="15%" size={80} />
        </>
      )}
      {T.day === 2 && (
        <>
          <Pill t={t} t0={w('body', 'inflammation', s('body') + 1.2)} t1={s('micro')} text="INFLAMMATION UP" top="16%" dot="#ff4a3d" />
          <Pill t={t} t0={w('body', 'temperature', s('body') + 3.5)} t1={s('micro')} text="BODY TEMPERATURE SWINGS" top="22%" dot="#ffd21f" />
          <Headline t={t} t0={w('micro', 'microsleeps', s('micro') + 1.4)} t1={s('micro2')} text="MICROSLEEPS" color="#ff6a5d" top="16%" size={84} />
          <Pill t={t} t0={w('micro2', 'half', s('micro2') + 3)} t1={s('road')} text="UP TO 30 SECONDS" top="16%" dot="#ff4a3d" />
          <Pill t={t} t0={w('micro2', 'notice', s('micro2') + 4.5) - 0.1} t1={s('road')} text="SOURCE: CLEVELAND CLINIC" top="22%" dot="#ffffff" />
          {shot === 'road' && d > -3 && (
            <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', top: '15%' }}>
              <div style={{ background: 'rgba(10,12,16,0.78)', borderRadius: 18, padding: '8px 26px', textAlign: 'center', border: '3px solid rgba(255,255,255,0.75)' }}>
                <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 24, color: '#ffd21f', letterSpacing: 3 }}>60 MPH (97 KM/H) · EYES CLOSED</div>
                <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 60, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
                  {Math.max(0, Math.min(5, d)).toFixed(1)} S · {Math.round(88 * Math.max(0, Math.min(5, d)))} FT
                </div>
                <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 26, color: 'rgba(255,255,255,0.8)' }}>{Math.round(26.8 * Math.max(0, Math.min(5, d)))} M</div>
              </div>
            </AbsoluteFill>
          )}
          <Pill t={t} t0={s('road') + 0.45 + 5} t1={s('fog')} text="LONGER THAN A FOOTBALL FIELD" top="70%" dot="#ff4a3d" />
          <Pill t={t} t0={w('fog', 'time', s('fog') + 2)} t1={final} text="LOSING TRACK OF TIME" top="16%" dot="#ffd21f" />
          <Pill t={t} t0={w('fog', 'anxious', s('fog') + 3)} t1={final} text="ANXIETY UP" top="22%" dot="#ff4a3d" />
        </>
      )}
      {T.day === 3 && (
        <>
          <Pill t={t} t0={w('urge', 'impossible', s('urge') + 1.5)} t1={s('halluc')} text="URGE TO SLEEP: UNSTOPPABLE" top="16%" dot="#ff4a3d" />
          <Pill t={t} t0={w('urge', 'longer', s('urge') + 3.5) + 1.3} t1={s('halluc')} text="MICROSLEEPS: LONGER + MORE OFTEN" top="22%" dot="#ffd21f" />
          <Headline t={t} t0={w('halluc', 'hallucinations', s('halluc') + 0.8)} t1={s('psych')} text="HALLUCINATIONS" color="#ff7ad9" top="15%" size={72} />
          <Pill t={t} t0={w('halluc', 'seeing', s('halluc') + 2.4)} t1={s('psych')} text="SEEING · HEARING · FEELING" top="22%" dot="#7af0ff" />
          <Pill t={t} t0={w('psych', 'psychosis', s('psych') + 4)} t1={s('randy')} text="LIKE PSYCHOSIS" top="16%" dot="#ff4a3d" />
          <Pill t={t} t0={w('psych', 'psychosis', s('psych') + 4) + 0.3} t1={s('randy')} text="SOURCE: REVIEW OF 21 STUDIES" top="22%" dot="#ffffff" />
          <Pill t={t} t0={s('randy') + 0.1} t1={s('recover')} text="TRUE STORY · 1964" top="16%" dot="#ffd21f" />
          <Pill t={t} t0={w('randy', '11', s('randy') + 4)} t1={s('recover')} text="11 DAYS = 264 HOURS" top="22%" dot="#ff4a3d" />
          <Pill t={t} t0={w('guinness', 'Guinness', s('guinness') + 0.8)} t1={s('recover')} text="GUINNESS STOPPED IT IN 1996" top="28%" dot="#ffffff" />
          <Pill t={t} t0={w('recover', 'fixes', s('recover') + 2)} t1={final} text="SLEEP FIXES MOST OF IT" top="16%" dot="#7fd36a" />
          <Pill t={t} t0={w('recover', '14', s('recover') + 3.5)} t1={final} text="SLEPT ~14 HOURS · SOURCE: NPR" top="22%" dot="#ffffff" />
          {shot === 'sleep' && ['Z', 'Z', 'Z'].map((z, i) => {
            const u = ((t * 0.5 + i / 3) % 1);
            return <div key={i} style={{ position: 'absolute', left: 300 + i * 70 + u * 60, top: 820 - u * 260, fontFamily: FONT, fontWeight: 900, fontSize: 60 + i * 18, color: '#fff', opacity: Math.sin(u * Math.PI), textShadow: '0 4px 10px rgba(0,0,0,0.4)' }}>{z}</div>;
          })}
        </>
      )}

      {/* end: safety line + the comment question */}
      {final > 0 && <Pill t={t} t0={final + 0.1} t1={T.end + 1} text="DON'T TRY THIS AT HOME" top="22%" dot="#ff4a3d" />}
      {final > 0 && T.day !== 2 && t >= final && (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'flex-start', paddingTop: 1370, flexDirection: 'row', gap: 26, paddingRight: 120 }}>
          {(T.day === 1 ? ['YES', 'NO'] : ['1', '2', '3']).map((c, i) => (
            <div key={c} style={{ background: ['#34c759', '#ff4a3d', '#3fb6ff'][i], borderRadius: 26, padding: '16px 40px', fontFamily: FONT, fontWeight: 900, fontSize: 58, color: '#fff', boxShadow: '0 8px 20px rgba(0,0,0,0.3)', opacity: clamp01((t - final - 1.0 - i * 0.2) / 0.2) }}>{c}</div>
          ))}
        </AbsoluteFill>
      )}
    </>
  );
};
