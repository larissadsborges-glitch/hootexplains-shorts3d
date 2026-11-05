import React, { useMemo } from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { limitSfx, Music, Sfx, type Cue } from '../../audio/Sfx';
import { clamp01, easeOutBack, easeOutCubic, lerp } from '../../lib/anim';
import { HootBadge } from '../../overlays/HootBadge';
import { Captions, Handle, TitleCard } from '../../overlays/Overlays';
import { Pill } from '../../scenes/learjet/overlays';
import { buildMoneyTimeline, type MoneyTimeline } from '../../scenes/money/timeline';
import type { ShortProps, Timings } from '../../types';
import { camAt, type Key, wt } from '../card/CardVideo';
import { HootGesture } from '../Hook2D';
import { Couch2D, Fed2D, Jars2D, Lobby2D, Shop2D } from './scenes';

const FONT = "'Montserrat', 'Arial Black', sans-serif";

const framings = (T: MoneyTimeline): Record<string, Key[]> => {
  const w = wt(T);
  return {
    lobby: [
      [0, 540, 960, 1.0],
      [w('hook', 'jake', 0.5) - 0.1, 400, 900, 1.35],
      [w('hook', '10000', 1.3) - 0.1, 520, 900, 1.15],
      [w('hook', 'paid', 4.5) - 0.2, 690, 840, 1.55],
      [T.s('bridge') - 0.05, 540, 960, 1.05],
      [w('bridge', 'ten', 2.3) - 0.2, 600, 900, 1.25],
      [T.s('final') - 0.05, 690, 840, 1.5],
      [w('final', 'when', 2.3) - 0.15, 620, 960, 1.1],
    ],
    shop: [
      [T.s('shrink'), 540, 960, 1.0],
      [w('shrink', 'half', 2) - 0.2, 520, 860, 1.25],
      [w('shrink', '37', 3.9) - 0.2, 640, 760, 1.5],
      [w('shrink', 'buy', 5.4) - 0.15, 540, 940, 1.05],
    ],
    fed: [
      [T.s('fed'), 540, 960, 1.0],
      [w('fed', '39', 1.4) - 0.2, 740, 640, 1.5],
      [w('fed', 'parking', 2.6) - 0.15, 520, 960, 1.0],
    ],
    couch: [
      [T.s('stay'), 540, 950, 1.0],
      [w('stay', 'leave', 2.6) - 0.2, 460, 840, 1.25],
      [w('stay', 'same', 4.6) - 0.2, 380, 860, 1.15],
    ],
    jars: [
      [T.s('exit'), 540, 960, 1.0],
      [w('exit', 'insured', 0.5) - 0.2, 540, 920, 1.15],
      [w('exit', '4', 2.4) - 0.2, 790, 900, 1.35],
      [w('exit', '400', 3.4) - 0.15, 540, 960, 1.05],
    ],
  };
};

/** Story cues first; limitSfx keeps at most 2 at once in this order. */
export const savingsCues = (tm: Timings, T: MoneyTimeline): Cue[] => {
  const w = wt(T);
  const c: Cue[] = [
    { at: w('hook', 'jake', 0.5) - 0.05, sfx: 'pop', volume: 0.2 },
    { at: w('hook', '38', 4.9) - 0.02, sfx: 'thud', volume: 0.28 },
    { at: w('bridge', 'ten', 2.3) - 0.05, sfx: 'ping', volume: 0.16 },
    { at: w('shrink', 'half', 2) - 0.05, sfx: 'pop', volume: 0.16 },
    { at: w('shrink', '37', 3.9) - 0.05, sfx: 'toggle', volume: 0.18 },
    { at: w('shrink', '37', 3.9) + 0.12, sfx: 'toggle', volume: 0.16 },
    { at: w('shrink', 'buy', 5.4) - 0.05, sfx: 'thud', volume: 0.2 },
    { at: w('fed', '39', 1.4) - 0.05, sfx: 'ding', volume: 0.18 },
    { at: w('fed', 'parking', 2.6) - 0.1, sfx: 'whoosh', volume: 0.18 },
    { at: w('stay', 'leave', 2.6) - 0.05, sfx: 'pop', volume: 0.16 },
    { at: w('stay', '17', 5.5) - 0.02, sfx: 'thud', volume: 0.26 },
    { at: T.s('exit') - 0.02, sfx: 'hit', volume: 0.18 },
    { at: w('exit', 'insured', 0.5) - 0.05, sfx: 'pop', volume: 0.16 },
    { at: w('exit', '400', 3.4) - 0.05, sfx: 'ding', volume: 0.2 },
    { at: w('final', 'ten', 1.1) - 0.05, sfx: 'ping', volume: 0.16 },
    { at: w('final', 'when', 2.3) - 0.05, sfx: 'pop', volume: 0.16 },
  ];
  // coins drop into the good jar; the calendar flips through the years
  const c4 = w('exit', '4', 2.4);
  for (let k = 0; k < 5; k++) c.push({ at: c4 + k * 0.25, sfx: 'ping', volume: 0.1 });
  const y0 = w('stay', 'leave', 2.6);
  for (let k = 0; k < 6; k++) c.push({ at: y0 + k * 0.4, sfx: 'toggle', volume: 0.1 });
  tm.beats.slice(1).forEach((b, i) => { if (b.shot !== tm.beats[i].shot) c.push({ at: b.start - 0.12, sfx: 'whoosh', volume: 0.14 }); });
  return limitSfx(c, 2);
};

const Card: React.FC<{ t: number; t0: number; t1: number; top: string; width?: number; children: React.ReactNode }> = ({ t, t0, t1, top, width = 820, children }) => {
  if (t < t0 || t > t1) return null;
  return (
    <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', top, opacity: clamp01((t1 - t) / 0.15) }}>
      <div style={{ width, background: 'rgba(10,12,16,0.8)', borderRadius: 28, padding: '16px 26px', boxShadow: '0 8px 20px rgba(0,0,0,0.35)', transform: `scale(${easeOutBack(clamp01((t - t0) / 0.22))})` }}>{children}</div>
    </AbsoluteFill>
  );
};
const Row: React.FC<{ left: string; right: string; color: string; p?: number }> = ({ left, right, color, p = 1 }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 4px', transform: `scale(${p})`, transformOrigin: 'left center' }}>
    <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 36, color: '#fff' }}>{left}</div>
    <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 48, color }}>{right}</div>
  </div>
);

const Overlays: React.FC<{ T: MoneyTimeline; t: number }> = ({ T, t }) => {
  const w = wt(T);
  const tHalf = w('shrink', 'half', 2) - 0.1, t37 = w('shrink', '37', 3.9) - 0.1, tWhen = w('final', 'when', 2.3) - 0.05;
  return (
    <>
      <HootBadge t={t} />
      <Pill t={t} t0={w('bridge', 'where', 0.3) - 0.1} t1={T.s('shrink') - 0.05} text="WHERE'S HIS MONEY WORKING?" top="14.5%" dot="#ffd21f" />
      <Card t={t} t0={tHalf} t1={T.s('fed') - 0.05} top="14.5%" width={720}>
        <Row left="HIS SAVINGS" right="+0.38%" color="#7fd36a" />
        {t >= t37 && <Row left="PRICES" right="+3.7%" color="#ff4a3d" p={easeOutBack(clamp01((t - t37) / 0.2))} />}
        <div style={{ textAlign: 'right', fontFamily: FONT, fontWeight: 700, fontSize: 20, color: '#aab1bd', marginTop: 4 }}>FDIC (VIA FRED) · BLS CPI, SEPT 2026</div>
      </Card>
      <Card t={t} t0={w('shrink', 'buy', 5.4) - 0.15} t1={T.s('fed') - 0.05} top="70.5%" width={860}>
        <div style={{ textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 40, color: '#fff', lineHeight: 1.2 }}>HIS $10,038 NOW BUYS<br /><span style={{ color: '#ff4a3d' }}>WHAT $9,680 DID</span></div>
      </Card>
      <Pill t={t} t0={w('fed', '39', 1.4) - 0.1} t1={T.s('stay') - 0.05} text="FED PAYS BANKS 3.9% ON RESERVES" top="14.5%" dot="#7fd36a" />
      <Pill t={t} t0={w('fed', 'cash', 3) - 0.1} t1={T.s('stay') - 0.05} text="THE FED = THE BANK FOR BANKS" top="21.5%" dot="#ffffff" />
      <Pill t={t} t0={w('stay', 'leave', 2.6) - 0.1} t1={w('stay', 'same', 4.6) - 0.1} text="PEOPLE DON'T LEAVE" top="14.5%" dot="#ff4a3d" />
      <Pill t={t} t0={w('stay', 'same', 4.6) - 0.1} t1={T.s('exit') - 0.05} text="SAME ACCOUNT FOR 17 YEARS" top="14.5%" dot="#ffd21f" />
      <Pill t={t} t0={w('stay', 'same', 4.6) - 0.1} t1={T.s('exit') - 0.05} text="SOURCE: BANKRATE SURVEY, 2025" top="21.5%" dot="#ffffff" />
      <Pill t={t} t0={w('exit', 'insured', 0.5) - 0.1} t1={T.s('final') - 0.05} text="CHECK: FDIC OR NCUA INSURED" top="14.5%" dot="#7fd36a" />
      <Pill t={t} t0={w('exit', '4', 2.4) - 0.1} t1={T.s('final') - 0.05} text="SOURCE: BANKRATE, TOP RATES NOV 2026" top="21.5%" dot="#ffffff" />
      <Card t={t} t0={T.s('final') + 0.1} t1={tWhen} top="23.5%" width={760}>
        <Row left="BIG BANK 0.38%" right="$38" color="#ff4a3d" />
        <Row left="INSURED ~4%" right="$400" color="#7fd36a" />
      </Card>
      <Card t={t} t0={tWhen} t1={T.end + 1} top="24%" width={800}>
        <div style={{ textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 46, color: '#fff', lineHeight: 1.15 }}>WHEN DID YOU LAST<br /><span style={{ color: '#ffd21f' }}>CHECK YOUR RATE?</span></div>
      </Card>
    </>
  );
};

export const SavingsVideo: React.FC<ShortProps> = ({ videoId, timings }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = useMemo(() => (timings ? buildMoneyTimeline(timings) : null), [timings]);
  const keys = useMemo(() => (T ? framings(T) : null), [T]);
  const cues = useMemo(() => (timings && T ? savingsCues(timings, T) : []), [timings, T]);
  if (!timings || !T || !keys) return null;
  const t = frame / fps;
  const w = wt(T);
  const m = timings.mouth ?? [];
  const talk = ((m[frame - 1] ?? m[frame] ?? 0) + 2 * (m[frame] ?? 0) + (m[frame + 1] ?? m[frame] ?? 0)) / 4;
  const beat = timings.beats.reduce((b, x) => (t >= x.start - 0.02 ? x : b), timings.beats[0]);
  const shot = beat.shot;
  const last = timings.beats[timings.beats.length - 1];
  const idx = timings.beats.indexOf(beat);
  let a = idx;
  while (a > 0 && timings.beats[a - 1].shot === shot) a--;
  const runS = a === 0 ? 0 : timings.beats[a].start;
  const punch = a === 0 ? 0 : 0.06 * (1 - easeOutCubic(clamp01((t - runS) / 0.3)));
  const cam = camAt(keys[shot], t, shot);
  const camT = `translate(540 1000) scale(${cam.z * (1 + punch)}) translate(${-cam.cx} ${-cam.cy})`;

  const keyWords: [string, string, number][] = [['hook', '38', 4.9], ['bridge', 'ten', 2.3], ['shrink', '37', 3.9], ['fed', '39', 1.4], ['stay', '17', 5.5], ['exit', '400', 3.4], ['final', 'ten', 1.1]];
  const raise = Math.max(0, ...keyWords.map(([ev, word, d]) => {
    const w0 = w(ev, word, d);
    return clamp01((t - w0 + 0.15) / 0.18) * (1 - clamp01((t - w0 - 1.15) / 0.25));
  }));
  const cheer = t >= w('final', 'when', 2.3) - 0.1;
  const wink = t >= last.end + 0.5;
  const on = (t0: number, d = 0.2) => clamp01((t - t0) / d);
  const pulse = (t0: number, d: number) => clamp01((t - t0 + 0.12) / 0.15) * (1 - clamp01((t - t0 - d) / 0.3));

  let scene: React.ReactNode = null;
  if (shot === 'lobby') {
    const inFinal = beat.event === 'final';
    const t38 = w('hook', '38', 4.9);
    const shock = inFinal ? 0 : pulse(t38, 1.0);
    const worry = inFinal ? 0 : on(T.s('bridge'), 0.3);
    scene = (
      <Lobby2D
        t={t} talk={talk}
        face={inFinal ? { smile: 1, brows: 0.3 } : { brows: Math.max(shock, -0.5 * worry), smile: 0.5 - 0.5 * shock - 0.2 * worry, wide: shock, gasp: shock, sad: 0.4 * worry }}
        tag={inFinal ? 0 : on(w('hook', 'jake', 0.5) - 0.1, 0.25) * (1 - on(T.s('bridge') - 0.3, 0.25))}
        receipt={1}
        good={inFinal ? 1 : 0}
        pulse={inFinal ? pulse(w('final', 'ten', 1.1), 0.6) : pulse(t38, 0.6)}
      />
    );
  } else if (shot === 'shop') {
    const t37 = w('shrink', '37', 3.9);
    const sadK = on(w('shrink', 'buy', 5.4) - 0.2, 0.3);
    scene = <Shop2D t={t} talk={talk} face={{ brows: lerp(0, -0.6, sadK), smile: lerp(0.3, -0.2, sadK), sad: 0.5 * sadK, wide: pulse(t37, 0.8) }} flip={on(t37 - 0.05, 0.6)} />;
  } else if (shot === 'fed') {
    scene = <Fed2D t={t} talk={talk} face={{ brows: -0.3, smile: 0, sad: 0.3, wide: pulse(w('fed', '39', 1.4), 0.8) }} drive={on(w('fed', 'parking', 2.6) - 0.2, 1.4)} plate={on(w('fed', '39', 1.4) - 0.1, 0.25)} />;
  } else if (shot === 'couch') {
    const y0 = w('stay', 'leave', 2.6) - 0.1, y1 = w('stay', '17', 5.5);
    const k = clamp01((t - y0) / Math.max(0.5, y1 - y0));
    scene = <Couch2D t={t} talk={talk} face={{ smile: 0.6, brows: 0 }} year={1 + Math.round(16 * k)} web={easeOutCubic(k)} />;
  } else if (shot === 'jars') {
    const t4 = w('exit', '4', 2.4), t400 = w('exit', '400', 3.4);
    const fill = clamp01((t - t4 + 0.1) / Math.max(0.5, t400 - t4 + 0.1));
    scene = <Jars2D t={t} talk={talk} face={{ smile: 0.4 + 0.6 * fill, brows: 0.4 * pulse(t400, 0.8), wide: 0.5 * pulse(t400, 0.8) }} fill={fill} />;
  }

  return (
    <HootGesture.Provider value={{ raise, cheer, wink }}>
      <AbsoluteFill style={{ backgroundColor: '#1b1420' }}>
        <svg viewBox="0 0 1080 1920" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
          <g transform={camT}>{scene}</g>
        </svg>
        <Overlays T={T} t={t} />
        {timings.hook && <TitleCard {...timings.hook} t={t} tIn={-0.7} tOut={T.s('bridge') - 0.1} />}
        <Captions timings={timings} t={t} />
        {timings.outro && <TitleCard {...timings.outro} t={t} tIn={T.s('final') + 0.02} tOut={timings.duration + 1} top="13%" />}
        <Handle handle={timings.handle} />
        <Audio src={staticFile(`videos/${videoId}/voice.wav`)} />
        <Sfx cues={cues} timings={timings} />
        <Music timings={timings} src={timings.music} dip={(x) => 1 - 0.8 * clamp01((x - T.s('exit') + 0.05) / 0.1) * (1 - clamp01((x - T.s('exit') - 1.1) / 0.4))} />
      </AbsoluteFill>
    </HootGesture.Provider>
  );
};
