import { beatByEvent, clamp01, easeInOutSine, easeOutCubic, lerp, lerp3, wordTime } from '../../lib/anim';
import type { Timings } from '../../types';
import type { CameraPose, Shot } from '../../world/Props';

/** Jake's bedroom. Floor y=0, back wall z=-2 (window at x -0.75, clock at x 0.95). Units ≈ metres. */
export const DESK = [0.15, 0, -0.85];        // desk centre (top at y 0.75), Jake sits behind it facing +z (the camera)
export const JAKE_DESK = [0.15, 0, -1.38];
export const BED = [-1.55, 0, -0.7];         // bed centre, head end against the back wall
/** Jake sits on the edge of the bed (on top of the blanket), feet on the floor. */
export const JAKE_BED = [-1.28, 0.1, -0.95];
export const NIGHTSTAND = [-0.72, 0, -1.62];
export const FRIDGE = [1.5, 0, -1.55];
export const JAKE_FRIDGE = [0.75, 0, -0.9];
export const JAKE_WINDOW = [-0.8, 0, -1.02];

export type AwakeTimeline = ReturnType<typeof buildAwakeTimeline>;
export const buildAwakeTimeline = (tm: Timings) => {
  const b = (e: string) => beatByEvent(tm, e);
  const s = (e: string, d = -1) => b(e)?.start ?? d;
  return {
    s,
    end: tm.duration,
    wordTime: (ev: string, w: string, d: number) => wordTime(b(ev), w, d),
  };
};

/** Hours awake (the cold open is a flash-forward to hour 24). */
export const hoursAt = (T: AwakeTimeline, t: number) => {
  if (t < T.s('wake')) return 24;
  // each spoken hour holds on screen while it's being talked about, then steps to the next
  const k: number[][] = [[T.s('day') + 0.3, 0], [T.wordTime('day', 'down', T.s('day') + 5) - 0.2, 12.4], [T.s('h16') - 0.4, 15.6], [T.s('h16'), 16], [T.s('h17') - 0.4, 16.4], [T.s('h17'), 17],
    [T.s('h20') - 0.5, 17.4], [T.s('h20'), 20], [T.s('h22') - 0.5, 20.4], [T.s('h22'), 22], [T.s('second') - 0.4, 22.4], [T.s('second') + 1.5, 23.4], [T.s('h24'), 24]];
  if (t <= k[0][0]) return 0;
  for (let i = 1; i < k.length; i++) if (t <= k[i][0]) return lerp(k[i - 1][1], k[i][1], easeInOutSine(clamp01((t - k[i - 1][0]) / Math.max(0.01, k[i][0] - k[i - 1][0]))));
  return 24;
};
/** Clock time (0..24); Jake woke at 7 am. */
export const clockAt = (T: AwakeTimeline, t: number) => (7 + hoursAt(T, t)) % 24;
export const daylightAt = (T: AwakeTimeline, t: number) => {
  const h = clockAt(T, t);
  return clamp01(Math.min((h - 5.6) / 1.6, (20 - h) / 2));
};
/** Jake's tiredness (eyelids). The sunrise "second wind" opens his eyes for a moment. */
export const lidsAt = (T: AwakeTimeline, t: number) => {
  const h = hoursAt(T, t);
  let l = h < 14 ? 0.05 : h < 24 ? 0.12 + 0.43 * (h - 14) / 10 : 0.6;
  const sw = T.wordTime('second', 'awake', T.s('second') + 3);
  if (t >= sw - 0.3 && t < T.s('h24')) l = 0.08;
  if (t < T.s('wake')) l = 0.62;
  return l;
};

const S = (pos: number[], target: number[], fov = 50) => ({ pos, target, fov });
export const SHOTS: Record<string, Shot> = {
  desk: { from: S([0.05, 1.42, 1.45], [-0.06, 1.12, -1.2], 40), to: S([0.04, 1.4, 1.2], [-0.06, 1.13, -1.2], 40) },
  bed: { from: S([-0.35, 1.45, 1.3], [-1.08, 1.0, -1.15], 55), to: S([-0.41, 1.43, 1.08], [-1.08, 1.02, -1.15], 55) },
  room: { from: S([1.05, 1.45, 1.25], [-0.05, 1.0, -1.1], 52), to: S([0.9, 1.42, 1.0], [-0.02, 1.02, -1.1], 52) },
  test: { from: S([0.05, 1.32, 1.35], [-0.08, 1.05, -1.15], 46), to: S([0.04, 1.3, 1.15], [-0.08, 1.05, -1.15], 46) },
  fridge: { from: S([0.45, 1.5, 2.35], [1.3, 1.18, -1.05], 50), to: S([0.5, 1.48, 2.1], [1.3, 1.2, -1.05], 50) },
  window: { from: S([-0.3, 1.45, 2.5], [-0.82, 1.12, -1.5], 52), to: S([-0.35, 1.43, 2.25], [-0.82, 1.15, -1.5], 52) },
};

export const cameraPose = (tm: Timings, _T: AwakeTimeline, t: number): CameraPose => {
  const beats = tm.beats;
  let bi = 0;
  for (let i = 0; i < beats.length; i++) if (t >= beats[i].start) bi = i;
  let a = bi;
  while (a > 0 && beats[a - 1].shot === beats[bi].shot) a--;
  let z = bi;
  while (z < beats.length - 1 && beats[z + 1].shot === beats[bi].shot) z++;
  const runS = a === 0 ? 0 : beats[a].start;
  const runE = z < beats.length - 1 ? beats[z + 1].start : tm.duration;
  const shot = SHOTS[beats[bi].shot] ?? SHOTS.desk;
  const e = easeInOutSine(clamp01((t - runS) / (runE - runS)));
  const pos = lerp3(shot.from.pos, shot.to.pos, e);
  const target = lerp3(shot.from.target, shot.to.target, e);
  const fov = lerp(shot.from.fov ?? 50, shot.to.fov ?? 50, e);
  if (a > 0 && t - runS < 0.3) {
    const k = 0.25 * (1 - easeOutCubic(clamp01((t - runS) / 0.28)));
    for (let i = 0; i < 3; i++) pos[i] += (pos[i] - target[i]) * k;
  }
  return { pos, target, fov };
};

export const labelAnchor = (): number[] | null => null;

/**
 * Optional data for the pre-render QA checker (scripts/qa/check.mjs). Not used by the video.
 * furniture: world-space boxes (from the sizes in Scene.tsx) a character's body must not sink into
 *   (tol = allowed depth in metres; thin panels use 0 so any piercing counts).
 * counters: overlay counters that may legitimately jump back at the given times (the rewind).
 */
const box = (name: string, c: number[], size: number[], tol?: number) => ({
  name, tol,
  min: [c[0] - size[0] / 2, c[1] - size[1] / 2, c[2] - size[2] / 2],
  max: [c[0] + size[0] / 2, c[1] + size[1] / 2, c[2] + size[2] / 2],
});
const add = (a: number[], b: number[]) => a.map((v, i) => v + b[i]);
export const qa = (T: AwakeTimeline) => ({
  furniture: [
    box('desk top', add(DESK, [0, 0.75, 0]), [1.3, 0.05, 0.6], 0.005),
    box('desk front panel', add(DESK, [0, 0.42, 0.29]), [1.26, 0.62, 0.02], 0),
    box('chair seat', [JAKE_DESK[0], 0.42, JAKE_DESK[2] - 0.07], [0.46, 0.07, 0.44], 0.01),
    box('chair back', [JAKE_DESK[0], 0.75, JAKE_DESK[2] - 0.29], [0.46, 0.6, 0.05], 0.005),
    box('bed frame', add(BED, [0, 0.2, 0]), [1.0, 0.3, 2.0]),
    box('mattress', add(BED, [0, 0.41, 0]), [0.96, 0.14, 1.96]),
    box('blanket', add(BED, [0, 0.53, 0.25]), [0.98, 0.1, 1.4]),
    box('headboard', add(BED, [0, 0.6, -1.0]), [1.0, 0.8, 0.08], 0.005),
    box('nightstand', add(NIGHTSTAND, [0, 0.27, 0]), [0.4, 0.54, 0.36]),
    box('fridge', [FRIDGE[0], 0.86, FRIDGE[2]], [0.605, 1.72, 0.55]),
    box('floor', [0, -0.25, -0.1], [4.4, 0.5, 4.0], 0.04),
    box('back wall', [0, 1.4, -2.05], [4.4, 2.8, 0.1], 0.01),
    box('left wall', [-2.25, 1.4, -0.1], [0.1, 2.8, 4.0], 0.01),
    box('right wall', [2.25, 1.4, -0.1], [0.1, 2.8, 4.0], 0.01),
  ],
  counters: [{ match: 'HOUR', resets: [T.s('wake')] }],
});
