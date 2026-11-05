import React, { useMemo } from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { limitSfx, Music, Sfx, type Cue } from '../../audio/Sfx';
import { clamp01, easeInOutSine, easeOutBack, easeOutCubic, lerp } from '../../lib/anim';
import { Captions, Handle, TitleCard } from '../../overlays/Overlays';
import { buildMoneyTimeline, type MoneyTimeline } from '../../scenes/money/timeline';
import type { ShortProps, Timings } from '../../types';
import { HootGesture } from '../Hook2D';
import { CardOverlays, yearAt } from './overlays';
import { Desk2D, Pay2D, Towers2D, Treadmill2D } from './scenes';

/** Word time helpers bound to this video's timeline. */
export const wt = (T: MoneyTimeline) => (ev: string, word: string, d = 1) => T.wordTime(ev, word, T.s(ev) + d);

type Key = [number, number, number, number]; // time, cx, cy, zoom (scene units)

/** Per-phrase framings for each shot (Tavinho lesson: the frame changes on every phrase, never static). */
const framings = (T: MoneyTimeline): Record<string, Key[]> => {
  const w = wt(T);
  return {
    desk: [
      [0, 540, 950, 1.15],
      [w('hook', 'credit', 1.5) - 0.2, 540, 1000, 1.3],
      [w('hook', 'paying', 2.4) - 0.1, 540, 1030, 1.5],
      [w('hook', '12', 4) - 0.25, 540, 960, 1.3],
      [T.s('bridge') - 0.05, 520, 960, 1.15],
      [w('bridge', 'number', 2.2) - 0.25, 590, 1000, 1.5],
    ],
    pay: [
      [T.s('split'), 540, 1000, 1.0],
      [w('split', '85', 1.5) - 0.3, 430, 920, 1.45],
      [w('split', '55', 2.6) - 0.2, 660, 1040, 1.3],
      [w('split', 'interest', 3.6) - 0.15, 760, 1060, 1.5],
      [T.s('rate') - 0.05, 600, 900, 1.25],
      [w('rate', 'so', 2) - 0.1, 560, 900, 1.15],
    ],
    treadmill: [
      [T.s('shrink'), 540, 940, 1.05],
      [w('shrink', 'minimum', 1.5) - 0.2, 540, 820, 1.35],
      [w('shrink', 'so', 2.4) - 0.15, 540, 980, 1.0],
    ],
    towers: [
      [T.s('total'), 540, 960, 1.0],
      [w('total', 'for', 2.6) - 0.15, 500, 1000, 1.15],
    ],
    exit: [
      [T.s('exit'), 540, 960, 1.2],
      [w('exit', 'printed', 1.5) - 0.3, 590, 1000, 1.5],
      [w('exit', 'about', 2.8) - 0.1, 570, 990, 1.42],
      [w('exit', 'clears', 4) - 0.2, 540, 960, 1.3],
      [T.s('final') - 0.05, 540, 950, 1.15],
      [w('final', 'do', 3.6) - 0.15, 450, 980, 1.2],
    ],
  };
};

/** Scene bounds for clamping the camera (the desk room is only 1080 wide). */
const BOUNDS: Record<string, [number, number, number, number]> = {
  desk: [0, 1080, 0, 1976], exit: [0, 1080, 0, 1976],
};

const camAt = (keys: Key[], t: number, shot: string) => {
  let i = 0;
  for (let k = 0; k < keys.length; k++) if (t >= keys[k][0]) i = k;
  const cur = keys[i], prev = keys[Math.max(0, i - 1)];
  const e = i === 0 ? 1 : easeInOutSine(clamp01((t - cur[0]) / 0.5));
  let cx = lerp(prev[1], cur[1], e), cy = lerp(prev[2], cur[2], e);
  // always alive: a slow push-in and a small drift on top of each framing
  const z = lerp(prev[3], cur[3], e) * (1 + 0.03 * clamp01((t - cur[0]) / 4));
  cx += 8 * Math.sin(t * 0.6);
  cy += 6 * Math.sin(t * 0.45 + 1);
  const b = BOUNDS[shot];
  if (b) {
    const hw = 540 / z, top = 1000 / z, bot = 920 / z;
    cx = Math.min(b[1] - hw, Math.max(b[0] + hw, cx));
    cy = Math.min(b[3] - bot, Math.max(b[2] + top, cy));
  }
  return { cx, cy, z };
};

/** money5's sound cues, story cues first (limitSfx keeps at most 2 at once, in this order). */
export const cardCues = (tm: Timings, T: MoneyTimeline): Cue[] => {
  const w = wt(T);
  const c: Cue[] = [
    { at: w('hook', 'minimum', 2.6) - 0.05, sfx: 'toggle', volume: 0.18 },
    { at: w('hook', '12', 4) - 0.02, sfx: 'thud', volume: 0.3 },
    { at: w('bridge', 'goes', 1) - 0.05, sfx: 'pop', volume: 0.16 },
    { at: w('bridge', 'number', 2.2) - 0.05, sfx: 'pop', volume: 0.16 },
    { at: w('split', '85', 1.5) - 0.1, sfx: 'pop', volume: 0.2 },
    { at: w('split', '55', 2.6) - 0.05, sfx: 'swish', volume: 0.2 },
    { at: w('split', '55', 2.6) + 0.42, sfx: 'splat', volume: 0.26 },
    { at: w('rate', '22', 1) - 0.05, sfx: 'ping', volume: 0.2 },
    { at: w('rate', '30', 2.5) - 0.05, sfx: 'swish', volume: 0.16 },
    { at: w('rate', 'debt', 3.6) - 0.05, sfx: 'toggle', volume: 0.16 },
    { at: w('shrink', 'shrinks', 1) - 0.05, sfx: 'toggle', volume: 0.16 },
    { at: w('total', '7000', 1.5) - 0.02, sfx: 'thud', volume: 0.3 },
    { at: T.s('total') + 0.05, sfx: 'riser', volume: 0.16 },
    { at: w('total', '3000', 3.2) - 0.05, sfx: 'pop', volume: 0.16 },
    { at: T.s('exit') - 0.02, sfx: 'hit', volume: 0.18 },
    { at: w('exit', 'printed', 1.5) - 0.1, sfx: 'swish', volume: 0.2 },
    { at: w('exit', '115', 3) - 0.05, sfx: 'ding', volume: 0.18 },
    { at: w('exit', '3', 4.5) - 0.02, sfx: 'thud', volume: 0.26 },
    { at: w('final', 'sooner', 1) - 0.05, sfx: 'ping', volume: 0.16 },
    { at: w('final', '2900', 2.5) - 0.05, sfx: 'ding', volume: 0.16 },
    { at: w('final', 'do', 3.6) - 0.05, sfx: 'pop', volume: 0.16 },
  ];
  // the clock ticks while "it drags on, and on"
  const d0 = w('shrink', 'drags', 2.6);
  for (let k = 0; k < 6; k++) c.push({ at: d0 + k * 0.28, sfx: 'toggle', volume: 0.1 });
  tm.beats.slice(1).forEach((b, i) => { if (b.shot !== tm.beats[i].shot) c.push({ at: b.start - 0.12, sfx: 'whoosh', volume: 0.14 }); });
  return limitSfx(c, 2);
};

const shotOf = (tm: Timings, t: number) => tm.beats.reduce((b, x) => (t >= x.start - 0.02 ? x : b), tm.beats[0]);

export const CardVideo: React.FC<ShortProps> = ({ videoId, timings }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = useMemo(() => (timings ? buildMoneyTimeline(timings) : null), [timings]);
  const keys = useMemo(() => (T ? framings(T) : null), [T]);
  const cues = useMemo(() => (timings && T ? cardCues(timings, T) : []), [timings, T]);
  if (!timings || !T || !keys) return null;
  const t = frame / fps;
  const w = wt(T);
  const m = timings.mouth ?? [];
  const talk = ((m[frame - 1] ?? m[frame] ?? 0) + 2 * (m[frame] ?? 0) + (m[frame + 1] ?? m[frame] ?? 0)) / 4;
  const beat = shotOf(timings, t);
  const shot = beat.shot;
  const last = timings.beats[timings.beats.length - 1];
  // start of the current run of beats with this shot (for the punch-in on a cut)
  const idx = timings.beats.indexOf(beat);
  let a = idx;
  while (a > 0 && timings.beats[a - 1].shot === shot) a--;
  const runS = a === 0 ? 0 : timings.beats[a].start;
  const punch = a === 0 ? 0 : 0.06 * (1 - easeOutCubic(clamp01((t - runS) / 0.3)));
  const cam = camAt(keys[shot === 'exit' ? 'exit' : shot], t, shot);
  const z = cam.z * (1 + punch);
  const camT = `translate(540 1000) scale(${z}) translate(${-cam.cx} ${-cam.cy})`;

  // Hoot rests and raises the pencil only on key words (~1.3 s each); cheers on the question, winks at the end
  const keyWords: [string, string, number][] = [['hook', '12', 4], ['bridge', 'number', 2.2], ['split', '55', 2.6], ['rate', '22', 1], ['shrink', 'shrinks', 1], ['total', '7000', 1.5], ['exit', '115', 3], ['final', 'sooner', 1]];
  const raise = Math.max(0, ...keyWords.map(([ev, word, d]) => {
    const w0 = w(ev, word, d);
    return clamp01((t - w0 + 0.15) / 0.18) * (1 - clamp01((t - w0 - 1.15) / 0.25));
  }));
  const cheer = t >= w('final', 'do', 3.6) - 0.1;
  const wink = t >= last.end + 0.5;
  const on = (t0: number, dur = 0.2) => clamp01((t - t0) / dur);
  const pulse = (t0: number, dur: number) => clamp01((t - t0 + 0.12) / 0.15) * (1 - clamp01((t - t0 - dur) / 0.3));

  let scene: React.ReactNode = null;
  if (shot === 'desk' || shot === 'exit') {
    const inExit = shot === 'exit';
    const t12 = w('hook', '12', 4);
    const shock = pulse(t12, 1.1);
    const worry = inExit ? 0 : on(T.s('bridge'), 0.3);
    const tP = w('exit', 'printed', 1.5), t115 = w('exit', '115', 3), t3 = w('exit', '3', 4.5);
    const happy = inExit ? Math.max(0.6 * on(t115, 0.3), on(t3, 0.3)) : 0;
    const tMore = w('final', 'more', 4);
    scene = (
      <Desk2D
        t={t} talk={talk}
        brows={inExit ? Math.max(pulse(tP, 0.8), 0.3 * happy) : Math.max(shock, -0.6 * worry)}
        smile={inExit ? 0.4 + 0.6 * happy : 0.4 - 0.4 * shock - 0.2 * worry}
        wide={inExit ? 0.6 * pulse(tP, 0.8) : shock}
        gasp={inExit ? 0 : shock}
        sad={inExit ? 0 : 0.5 * worry}
        nod={inExit && t > tMore ? Math.max(0, Math.sin((t - tMore) * 8)) * (1 - clamp01((t - tMore - 0.8) / 0.3)) : 0}
        hl={inExit ? 0 : clamp01((t - w('hook', 'minimum', 2.6) + 0.1) / 0.2)}
        peel={inExit ? on(tP + 0.05, 0.55) : 0}
        stamp12={!inExit && t >= t12 - 0.05 ? on(t12 - 0.05, 0.2) * (1 - on(T.s('bridge') + 0.5, 0.3)) : 0}
        stamp3={inExit && t >= t3 - 0.05 ? on(t3 - 0.05, 0.2) : 0}
        hop={cheer && !wink ? Math.abs(Math.sin((t - w('final', 'do', 3.6)) * 7)) : 0}
        q={inExit ? 0 : easeOutBack(on(w('bridge', 'goes', 1) - 0.05, 0.25)) * (1 - on(T.s('split') - 0.25, 0.2))}
      />
    );
  } else if (shot === 'pay') {
    const t55 = w('split', '55', 2.6), t30 = w('rate', '30', 2.5), tDebt = w('rate', 'debt', 3.6);
    const eat = on(t55 - 0.05, 0.5);
    const give = on(t30 - 0.05, 0.5);
    const chomp = t > t55 + 0.35 ? Math.abs(Math.sin((t - t55 - 0.35) * 10)) * (1 - on(t55 + 0.35 + 0.9, 0.2)) : 0;
    const sadK = on(t55 + 0.4, 0.3);
    scene = (
      <Pay2D
        t={t} talk={talk}
        cashIn={on(w('split', '85', 1.5) - 0.2, 0.25)} eat={eat} give={give}
        rateOn={on(w('rate', '22', 1) - 0.1, 0.25)}
        debt={lerp(3000, 2970, easeOutCubic(on(tDebt - 0.45, 0.4)))}
        chomp={chomp}
        jake={{ brows: lerp(0.2, -0.6, sadK), smile: lerp(0.5, -0.2, sadK), sad: 0.6 * sadK, wide: pulse(t55 + 0.4, 0.6), gasp: 0 }}
      />
    );
  } else if (shot === 'treadmill') {
    const year = yearAt(T, t);
    const tired = on(w('shrink', 'drags', 2.6) - 0.1, 0.3);
    scene = <Treadmill2D t={t} talk={talk} year={year} run={1} jake={{ brows: -0.5 - 0.4 * tired, smile: -0.2, sad: 0.4 + 0.4 * tired, grit: tired }} />;
  } else if (shot === 'towers') {
    const t7 = w('total', '7000', 1.5);
    const grow = clamp01((t - T.s('total') - 0.1) / Math.max(0.5, t7 - T.s('total') - 0.1));
    const g = pulse(t7, 1.0);
    scene = <Towers2D t={t} talk={talk} grow={grow} jake={{ brows: Math.max(0.2, g), smile: 0.2 - 0.6 * g, wide: g, gasp: g, sad: 0.3 * (1 - g) }} />;
  }

  return (
    <HootGesture.Provider value={{ raise, cheer, wink }}>
      <AbsoluteFill style={{ backgroundColor: '#1b1420' }}>
        <svg viewBox="0 0 1080 1920" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
          <g transform={camT}>{scene}</g>
        </svg>
        <CardOverlays T={T} t={t} />
        {timings.hook && <TitleCard {...timings.hook} t={t} tIn={-0.7} tOut={T.s('bridge') - 0.1} />}
        <Captions timings={timings} t={t} />
        {timings.outro && <TitleCard {...timings.outro} t={t} tIn={T.s('final') + 0.02} tOut={timings.duration + 1} top="13%" />}
        <Handle handle={timings.handle} />
        <Audio src={staticFile(`videos/${videoId}/voice.wav`)} />
        <Sfx cues={cues} timings={timings} />
        {/* the twist sting: the music dips for a beat on "But the way out" */}
        <Music timings={timings} src={timings.music} dip={(x) => 1 - 0.8 * clamp01((x - T.s('exit') + 0.05) / 0.1) * (1 - clamp01((x - T.s('exit') - 1.1) / 0.4))} />
      </AbsoluteFill>
    </HootGesture.Provider>
  );
};
