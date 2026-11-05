import React, { useMemo } from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { limitSfx, Music, Sfx, type Cue } from '../../audio/Sfx';
import { clamp01, easeOutBack, easeOutCubic } from '../../lib/anim';
import { HootBadge } from '../../overlays/HootBadge';
import { Captions, Handle, TitleCard } from '../../overlays/Overlays';
import { Pill } from '../../scenes/learjet/overlays';
import { buildMoneyTimeline, type MoneyTimeline } from '../../scenes/money/timeline';
import type { ShortProps, Timings } from '../../types';
import { camAt, type Key, wt } from '../card/CardVideo';
import { HootGesture } from '../Hook2D';
import { Dial2D, Lot2D, Report2D, Screen2D } from './scenes';

const FONT = "'Montserrat', 'Arial Black', sans-serif";

const framings = (T: MoneyTimeline): Record<string, Key[]> => {
  const w = wt(T);
  return {
    lot: [
      [0, 540, 960, 1.0],
      [w('hook', '20000', 1) - 0.15, 430, 880, 1.3],
      [w('hook', 'savings', 4.2) - 0.25, 560, 900, 1.15],
      [w('hook', 'created', 4.9) - 0.2, 560, 860, 1.3],
      [T.s('bridge') - 0.05, 540, 960, 1.05],
      [w('bridge', 'forever', 2.8) - 0.2, 500, 900, 1.2],
      [T.s('final') - 0.05, 540, 960, 1.05],
      [w('final', 'did', 1.8) - 0.15, 560, 940, 1.1],
      [w('final', 'did', 1.8) + 1.0, 700, 860, 1.35],
    ],
    screen: [
      [T.s('type'), 540, 900, 1.0],
      [w('type', 'types', 2.1) - 0.2, 640, 780, 1.35],
      [w('type', 'brand', 3.6) - 0.15, 560, 860, 1.1],
      [T.s('repay'), 540, 900, 1.0],
      [w('repay', 'pays', 1.4) - 0.2, 600, 800, 1.2],
      [w('repay', 'disappears', 2.8) - 0.15, 600, 820, 1.15],
    ],
    report: [
      [T.s('proof'), 540, 900, 1.0],
      [w('proof', 'england', 2.3) - 0.3, 490, 640, 1.1],
      [w('proof', 'explained', 2.8) - 0.1, 490, 700, 1.3],
    ],
    dial: [
      [T.s('limits'), 540, 900, 1.0],
      [w('limits', 'fed', 2.2) - 0.2, 540, 900, 1.1],
    ],
  };
};

export const loanCues = (tm: Timings, T: MoneyTimeline): Cue[] => {
  const w = wt(T);
  const c: Cue[] = [
    { at: w('hook', '20000', 1) - 0.05, sfx: 'pop', volume: 0.16 },
    { at: w('hook', 'savings', 4.2) - 0.05, sfx: 'buzz', volume: 0.12, dur: 0.5 },
    { at: w('hook', 'created', 4.9) - 0.05, sfx: 'zap', volume: 0.14 },
    { at: w('hook', 'created', 4.9) + 0.05, sfx: 'ding', volume: 0.18 },
    { at: w('bridge', 'forever', 2.8) - 0.05, sfx: 'pop', volume: 0.14 },
    { at: w('type', 'approved', 0.8) - 0.02, sfx: 'thud', volume: 0.24 },
    { at: w('type', 'brand', 3.6) - 0.05, sfx: 'ding', volume: 0.18 },
    { at: w('proof', 'conspiracy', 0.4) - 0.05, sfx: 'pop', volume: 0.16 },
    { at: w('proof', 'explained', 2.8) - 0.05, sfx: 'brush', volume: 0.2 },
    { at: T.s('repay') - 0.02, sfx: 'hit', volume: 0.16 },
    { at: w('repay', 'disappears', 2.8) - 0.05, sfx: 'whoosh', volume: 0.2 },
    { at: w('limits', 'repay', 1.4) - 0.05, sfx: 'ping', volume: 0.16 },
    { at: w('limits', 'steers', 2.4) - 0.05, sfx: 'spring', volume: 0.14 },
    { at: w('final', 'typed', 1.4) - 0.05, sfx: 'thud', volume: 0.2 },
    { at: w('final', 'did', 1.8) - 0.05, sfx: 'pop', volume: 0.16 },
  ];
  // the keys tap while "types 20,000"
  const k0 = w('type', 'types', 2.1);
  for (let k = 0; k < 5; k++) c.push({ at: k0 + 0.1 + k * 0.12, sfx: 'toggle', volume: 0.12 });
  tm.beats.slice(1).forEach((b, i) => { if (b.shot !== tm.beats[i].shot) c.push({ at: b.start - 0.12, sfx: 'whoosh', volume: 0.14 }); });
  return limitSfx(c, 2);
};

const Card: React.FC<{ t: number; t0: number; t1: number; top: string; width?: number; children: React.ReactNode }> = ({ t, t0, t1, top, width = 820, children }) => {
  if (t < t0 || t > t1) return null;
  return (
    <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', top, opacity: clamp01((t1 - t) / 0.15) }}>
      <div style={{ width, background: 'rgba(14,16,20,0.96)', borderRadius: 28, padding: '16px 26px', boxShadow: '0 8px 20px rgba(0,0,0,0.35)', transform: `scale(${easeOutBack(clamp01((t - t0) / 0.22))})` }}>{children}</div>
    </AbsoluteFill>
  );
};

const Overlays: React.FC<{ T: MoneyTimeline; t: number }> = ({ T, t }) => {
  const w = wt(T);
  const tDid = w('final', 'did', 1.8) - 0.05;
  return (
    <>
      <HootBadge t={t} />
      <Pill t={t} t0={w('hook', 'savings', 4.2) - 0.15} t1={T.s('bridge') - 0.05} text="NOT SOMEONE'S SAVINGS" top="25%" dot="#ff4a3d" />
      <Pill t={t} t0={w('bridge', 'how', 0.3) - 0.1} t1={T.s('type') - 0.05} text="HOW? AND WHY NOT FOREVER?" top="14.5%" dot="#ffd21f" />
      <Pill t={t} t0={w('type', 'types', 2.1) - 0.1} t1={T.s('proof') - 0.05} text="TYPED IN = BRAND NEW MONEY" top="14.5%" dot="#7fd36a" />
      <Pill t={t} t0={w('proof', 'not', 0) - 0.05} t1={T.s('repay') - 0.05} text="NOT A CONSPIRACY THEORY" top="14.5%" dot="#ffd21f" />
      <Pill t={t} t0={w('repay', 'pays', 1.4) - 0.1} t1={T.s('limits') - 0.05} text="PAID BACK → MONEY GONE" top="14.5%" dot="#ff4a3d" />
      <Pill t={t} t0={w('limits', 'borrowers', 0.7) - 0.1} t1={T.s('final') - 0.05} text="LIMIT 1: BORROWERS MUST REPAY" top="14.5%" dot="#7fd36a" />
      <Pill t={t} t0={w('limits', 'while', 1.8) - 0.1} t1={T.s('final') - 0.05} text="LIMIT 2: FED RATE ≈ 3.9% (FRED)" top="21.5%" dot="#ffd21f" />
      <Card t={t} t0={T.s('final') + 0.1} t1={T.end + 1} top="71%" width={760}>
        <div style={{ textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 28, color: '#e6e9ef' }}>SOURCE: BANK OF ENGLAND, 2014<br />ALSO: ST. LOUIS FED, 2021</div>
      </Card>
      <Card t={t} t0={tDid} t1={T.end + 1} top="25.5%" width={760}>
        <div style={{ textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 42, color: '#fff', lineHeight: 1.15 }}>DID YOU KNOW YOUR<br /><span style={{ color: '#ffd21f' }}>BANK COULD DO THAT?</span></div>
      </Card>
    </>
  );
};

export const LoanVideo: React.FC<ShortProps> = ({ videoId, timings }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = useMemo(() => (timings ? buildMoneyTimeline(timings) : null), [timings]);
  const keys = useMemo(() => (T ? framings(T) : null), [T]);
  const cues = useMemo(() => (timings && T ? loanCues(timings, T) : []), [timings, T]);
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

  const keyWords: [string, string, number][] = [['hook', 'created', 4.9], ['bridge', 'forever', 2.8], ['type', 'types', 2.1], ['proof', 'england', 2.3], ['repay', 'disappears', 2.8], ['limits', 'fed', 2.2], ['final', 'typed', 1.4]];
  const raise = Math.max(0, ...keyWords.map(([ev, word, d]) => {
    const w0 = w(ev, word, d);
    return clamp01((t - w0 + 0.15) / 0.18) * (1 - clamp01((t - w0 - 1.15) / 0.25));
  }));
  const cheer = t >= w('final', 'did', 1.8) - 0.1;
  const wink = t >= last.end + 0.5;
  const on = (t0: number, d = 0.2) => clamp01((t - t0) / d);
  const pulse = (t0: number, d: number) => clamp01((t - t0 + 0.12) / 0.15) * (1 - clamp01((t - t0 - d) / 0.3));

  let scene: React.ReactNode = null;
  if (shot === 'lot') {
    const inFinal = beat.event === 'final';
    const tc = w('hook', 'created', 4.9);
    const shock = inFinal ? 0 : pulse(tc, 1.0);
    scene = (
      <Lot2D
        t={t} talk={talk}
        face={inFinal ? { smile: 0.9, brows: 0.3, wide: 0.4 * pulse(w('final', 'typed', 1.4), 0.6) } : { brows: Math.max(shock, 0.2), smile: 0.8 - 0.6 * shock, wide: shock, gasp: shock }}
        made={inFinal ? 1 : on(tc - 0.1, 0.4)}
      />
    );
  } else if (shot === 'screen') {
    const inRepay = beat.event === 'repay';
    const tt = w('type', 'types', 2.1);
    const full = '$20,000';
    const typed = Math.floor(clamp01((t - tt + 0.3) / 0.6) * 6);
    const balance = inRepay ? `$${Math.round(20000 * (1 - easeOutCubic(on(w('repay', 'pays', 1.4) - 0.1, 1.2)))).toLocaleString('en-US')}` : typed <= 0 ? '$0' : full.slice(0, [0, 2, 3, 5, 6, 7][typed]);
    scene = (
      <Screen2D
        t={t} talk={talk}
        face={inRepay ? { brows: 0.6 * pulse(w('repay', 'disappears', 2.8), 0.8), wide: pulse(w('repay', 'disappears', 2.8), 0.8), smile: 0.3 } : { brows: on(tt, 0.3), wide: on(tt, 0.3), smile: 0.6 }}
        balance={balance}
        approved={inRepay ? 0 : on(w('type', 'approved', 0.8) - 0.1, 0.2)}
        loanLeft={inRepay ? 20000 * (1 - easeOutCubic(on(w('repay', 'pays', 1.4) - 0.1, 1.2))) : null}
        poof={inRepay ? on(w('repay', 'disappears', 2.8) - 0.1, 0.7) : 0}
        glow={!inRepay && typed >= 5 ? 1 : 0}
      />
    );
  } else if (shot === 'report') {
    scene = <Report2D t={t} talk={talk} face={{ brows: 0.8, wide: 0.6, smile: 0.2, gasp: pulse(w('proof', 'england', 2.3), 0.8) }} hl={on(w('proof', 'explained', 2.8) - 0.1, 0.6)} />;
  } else if (shot === 'dial') {
    scene = <Dial2D t={t} talk={talk} needle={on(w('limits', 'steers', 2.4) - 0.15, 0.5)} repay={on(w('limits', 'repay', 1.4) - 0.15, 0.25)} />;
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
        {timings.outro && <TitleCard {...timings.outro} t={t} tIn={T.s('final') + 0.02} tOut={timings.duration + 1} top="14%" />}
        <Handle handle={timings.handle} />
        <Audio src={staticFile(`videos/${videoId}/voice.wav`)} />
        <Sfx cues={cues} timings={timings} />
        <Music timings={timings} src={timings.music} dip={(x) => 1 - 0.8 * clamp01((x - T.s('repay') + 0.05) / 0.1) * (1 - clamp01((x - T.s('repay') - 1.1) / 0.4))} />
      </AbsoluteFill>
    </HootGesture.Provider>
  );
};
