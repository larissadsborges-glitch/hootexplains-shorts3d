import { beatByEvent, clamp01, easeInOutSine, easeOutCubic, lerp, lerp3, wordTime } from '../../lib/anim';
import type { Timings } from '../../types';
import type { CameraPose, Shot } from '../../world/Props';

/** Places. Room: floor y=0, back wall z=-2 (window left, clock right), bed along the left wall, desk on the right. Units ≈ metres. */
export const ROOM = [0, 0, 0];
export const ROAD = [600, 0, 0];
export const STORY = [1200, 0, 0];
export const HOOT_AT = [0.15, 0, -0.55];
export const CLOCK_AT = [0.95, 1.95, -1.95];
export const WINDOW_AT = [-0.75, 1.45, -2];
export const DESK_AT = [1.25, 0, -1.45];
export const BED_AT = [-1.3, 0, -0.9];

export type SleepTimeline = ReturnType<typeof buildSleepTimeline>;
export const buildSleepTimeline = (tm: Timings) => {
  const b = (e: string) => beatByEvent(tm, e);
  const s = (e: string, d = -1) => b(e)?.start ?? d;
  const en = (e: string, d = -1) => b(e)?.end ?? d;
  const day = ((tm as unknown as { day?: number }).day ?? 1) as 1 | 2 | 3;
  return {
    day,
    s, en,
    end: tm.duration,
    wordTime: (ev: string, w: string, d: number) => wordTime(b(ev), w, d),
  };
};

/** Hours awake shown on the counter (keyframes per day: [time, hours]). */
export const hoursAt = (T: SleepTimeline, t: number): number => {
  const k: number[][] =
    T.day === 1 ? [[0, 15], [T.s('h17'), 17], [T.s('h24') - 0.3, 22], [T.s('h24') + 0.6, 24]]
      : T.day === 2 ? [[0, 36], [T.s('body'), 37], [T.s('micro'), 42], [T.s('fog'), 45], [T.end, 48]]
        : [[0, 72], [T.s('urge'), 73], [T.s('halluc'), 75], [T.s('randy'), 78]];
  if (t <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) {
    if (t <= k[i][0]) return lerp(k[i - 1][1], k[i][1], easeInOutSine(clamp01((t - k[i - 1][0]) / Math.max(0.01, k[i][0] - k[i - 1][0]))));
  }
  return k[k.length - 1][1];
};
/** Clock time of day (0..24): you woke up at 7 am on day one. */
export const clockAt = (T: SleepTimeline, t: number) => (7 + hoursAt(T, t)) % 24;
/** 0 = night, 1 = full day, for the window sky and the room light. */
export const daylightAt = (T: SleepTimeline, t: number) => {
  if (T.day === 3 && T.s('recover') > 0 && t >= T.s('recover')) return 1;
  const h = clockAt(T, t);
  return clamp01(Math.min((h - 5.5) / 2, (20 - h) / 2));
};
/** Tiredness 0..1. */
export const tiredAt = (T: SleepTimeline, t: number) => {
  // after a night's sleep (day 3 ending) Hoot is rested again
  if (T.day === 3 && T.s('recover') > 0 && t >= T.s('recover')) return 0;
  const h = hoursAt(T, t);
  // day 1: wide awake to half-lidded by hour 24; day 2: heavier; day 3: barely open
  const k = h < 24 ? 0.1 + 0.35 * (h - 15) / 9 : h <= 48 ? 0.45 + 0.3 * (h - 24) / 24 : 0.8;
  return Math.min(0.85, clamp01(k));
};
/** Microsleep: eyes shut + blackout, 0..1. Day 2 on "switches" (and a nod on "Microsleeps"), day 3 on "longer". */
export const microAt = (T: SleepTimeline, t: number) => {
  const pulse = (t0: number, len: number) => (t >= t0 && t < t0 + len ? Math.min(1, (t - t0) / 0.12, (t0 + len - t) / 0.12) : 0);
  if (T.day === 2) return Math.max(pulse(T.wordTime('micro2', 'switches', T.s('micro2') + 0.6), 1.1), pulse(T.wordTime('micro', 'microsleeps', T.s('micro') + 1.4) + 0.2, 0.5));
  if (T.day === 3) return pulse(T.wordTime('urge', 'longer', T.s('urge') + 3.5), 1.3);
  return 0;
};
/** Hallucination strength (day 3 trip shots). */
export const tripAt = (T: SleepTimeline, t: number) => (T.day === 3 && T.s('halluc') > 0 && t >= T.s('halluc') && t < T.s('randy') ? easeOutCubic(clamp01((t - T.s('halluc')) / 1.5)) : 0);
/** Coffee mugs on the desk. */
export const mugsAt = (T: SleepTimeline, t: number) => Math.min(8, Math.floor(1 + hoursAt(T, t) / 9));
/** Road: seconds into the eyes-closed drive (day 2). */
export const driveAt = (T: SleepTimeline, t: number) => (T.day === 2 ? t - (T.s('road') + 0.45) : -1);

const S = (pos: number[], target: number[], fov = 50) => ({ pos, target, fov });
const add = (a: number[], b: number[]) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const SHOTS: Record<string, Shot> = {
  room: { from: S([1.5, 1.35, 1.75], [-0.1, 0.42, -0.85], 58), to: S([1.32, 1.28, 1.48], [-0.05, 0.42, -0.9], 58) },
  hoot: { from: S([0.8, 1.05, 1.75], [0.12, 0.58, -0.5], 46), to: S([0.7, 1.0, 1.5], [0.13, 0.6, -0.5], 46) },
  clock: { from: S([0.6, 1.75, 0.2], [0.9, 1.92, -1.95], 46), to: S([0.72, 1.85, -0.5], [0.93, 1.95, -1.95], 46) },
  desk: { from: S([1.95, 1.4, 0.05], [1.15, 0.8, -1.45], 50), to: S([1.75, 1.3, -0.35], [1.15, 0.8, -1.45], 50) },
  road: { from: S(add(ROAD, [-30, 32, 62]), add(ROAD, [52, 0, 0]), 50), to: S(add(ROAD, [-10, 30, 58]), add(ROAD, [62, 0, 0]), 50) },
  trip: { from: S([1.9, 1.6, 2.0], [-0.1, 1.0, -0.9], 60), to: S([1.4, 1.4, 1.5], [0.0, 1.0, -0.9], 64) },
  story: { from: S(add(STORY, [2.6, 1.6, 3.4]), add(STORY, [0, 1.0, 0]), 48), to: S(add(STORY, [2.1, 1.5, 2.8]), add(STORY, [0, 1.05, 0]), 48) },
  sleep: { from: S([-1.25, 2.0, -0.75], [-1.3, 0.66, -1.62], 50), to: S([-1.27, 1.8, -0.9], [-1.3, 0.66, -1.64], 50) },
};

export const cameraPose = (tm: Timings, T: SleepTimeline, t: number): CameraPose => {
  const beats = tm.beats;
  let bi = 0;
  for (let i = 0; i < beats.length; i++) if (t >= beats[i].start) bi = i;
  let a = bi;
  while (a > 0 && beats[a - 1].shot === beats[bi].shot) a--;
  let z = bi;
  while (z < beats.length - 1 && beats[z + 1].shot === beats[bi].shot) z++;
  const runS = a === 0 ? 0 : beats[a].start;
  const runE = z < beats.length - 1 ? beats[z + 1].start : tm.duration;
  const name = beats[bi].shot;
  const shot = SHOTS[name] ?? SHOTS.room;
  const e = (shot.ease ?? easeInOutSine)(clamp01((t - runS) / (runE - runS)));
  const pos = lerp3(shot.from.pos, shot.to.pos, e);
  const target = lerp3(shot.from.target, shot.to.target, e);
  const fov = lerp(shot.from.fov ?? 50, shot.to.fov ?? 50, e);
  if (a > 0 && t - runS < 0.3) {
    const k = 0.25 * (1 - easeOutCubic(clamp01((t - runS) / 0.28)));
    for (let i = 0; i < 3; i++) pos[i] += (pos[i] - target[i]) * k;
  }
  // the tired camera sways a little more each day; the trip shot breathes
  const sway = 0.004 + 0.01 * tiredAt(T, t) + 0.03 * tripAt(T, t);
  pos[0] += Math.sin(t * 0.9) * sway;
  pos[1] += Math.sin(t * 1.3 + 1) * sway;
  return { pos, target, fov };
};

export const labelAnchor = (_T: SleepTimeline, _key: string): number[] | null => null;
