import {
  beatByEvent, clamp01, easeInOutSine, easeOutCubic, lerp, lerp3, progress, wordTime,
} from '../../lib/anim';
import type { Beat, Timings } from '../../types';
import type { CameraPose, Shot } from '../../world/Props';
import { RIVER_HALF } from '../../world/terrain';

export const HW = RIVER_HALF * 1.35; // river half-width
export const TUN_Y = -4.0; // tunnel axis height
export const TUN_R = 1.2; // bore radius
export const ROCK_Y = -7.4;
export const SHAFT_X = 12.5; // launch (left) / reception (right) shafts at ±SHAFT_X
export const SHAFT_W = 3.6;
export const SHAFT_BOTTOM = TUN_Y - TUN_R - 0.3;
export const TBM_LEN = 3.4;
export const X_START = -SHAFT_X + 1.6; // cutter-head x when the machine starts boring
export const X_END = SHAFT_X + 1.6; // cutter-head x after breaking into the far shaft
export const RING_W = 0.9;
export const CRANE_X = -16.5;

const S = (pos: number[], target: number[], fov = 50) => ({ pos, target, fov });
export const SHOTS: Record<string, Shot> = {
  floodClose: { from: S([-4.5, -2.0, 11], [-4.2, -3.6, 0]), to: S([-4.0, -2.4, 9.5], [-4.0, -3.7, 0]) },
  section: { from: S([-1, -1.6, 23], [-1, -2.8, 0], 52), to: S([0, -1.8, 21.5], [0, -2.8, 0], 52) },
  sectionMid: { from: S([0, -2.2, 14.5], [0, -3.3, 0], 50), to: S([0.5, -2.4, 13.5], [0.5, -3.4, 0], 50) },
  shaft: { from: S([-10.3, -1.0, 13], [-12.3, -2.6, 0]), to: S([-10.8, -1.6, 11.5], [-12.3, -2.8, 0]) },
  crane: { from: S([-10.5, 2.0, 19], [-13.5, 1.0, 0], 52), to: S([-11, 1.4, 17.5], [-13.5, 0.6, 0], 52) },
  surveyClose: { from: S([-1.5, -0.4, 13], [-1.5, -3.0, 0]), to: S([-1.2, -0.8, 11.8], [-1.2, -3.2, 0]) },
  shaftScale: { from: S([-10.4, -4.4, 4.8], [-11.7, -4.7, 0.4], 55), to: S([-10.6, -4.5, 4.2], [-11.8, -4.75, 0.4], 55) },
  fitClose: { from: S([0.6, TUN_Y + 0.6, 5.6], [0.5, TUN_Y - 0.1, -0.4], 55), to: S([0.3, TUN_Y + 0.5, 5.0], [0.4, TUN_Y - 0.1, -0.4], 55) },
  arrival: { from: S([10.2, -1.2, 12.5], [12.5, -2.8, 0]), to: S([10.6, -1.6, 11.2], [12.5, -3.0, 0]) },
  trainClose: { from: S([3.5, -2.0, 9], [0, -3.4, -0.4], 50), to: S([2.5, -2.3, 8], [-0.5, -3.5, -0.4], 50) },
  aerial: { from: S([8, 9, 24], [0, -2, -2], 52), to: S([14, 17, 32], [0, -2, -3], 54), ease: easeOutCubic },
};

const st = (b: Beat | undefined, d: number) => b?.start ?? d;
const next = (tm: Timings, b: Beat | undefined, d: number) => (b ? tm.beats[b.index + 1]?.start ?? tm.duration : d);

export type TunnelTimeline = ReturnType<typeof buildTunnelTimeline>;

export const buildTunnelTimeline = (tm: Timings) => {
  const b = (e: string) => beatByEvent(tm, e);
  const lower = st(b('lower'), 9);
  return {
    flood: st(b('flood'), 3.3),
    reset: st(b('reset'), 4),
    surveyS: st(b('survey'), 6), surveyE: next(tm, b('survey'), 9),
    shaftsS: st(b('shafts'), 9), shaftsE: next(tm, b('shafts'), 12),
    lower, lowerE: next(tm, b('lower'), 15),
    boreS: st(b('bore'), 17),
    boreE: st(b('breakthrough'), 45) + 0.6,
    leak: st(b('leak'), 22), counter: st(b('counter'), 25), scale: st(b('scale'), 15),
    gap: st(b('gap'), 40),
    muck: st(b('muck'), 29), jacks: st(b('jacks'), 32), jacksE: next(tm, b('jacks'), 35),
    segments: st(b('segments'), 35), seals: st(b('seals'), 38),
    grout: st(b('grout'), 41), laser: st(b('laser'), 44),
    breakthrough: st(b('breakthrough'), 47),
    fitS: st(b('fitout'), 50), fitE: next(tm, b('fitout'), 53),
    train: st(b('train'), 53),
    final: st(b('final'), 56),
    wordTime: (e: string, w: string, d: number) => wordTime(b(e), w, d),
  };
};

/** Cutter-head x: waits in the launch shaft, bores at constant speed, breaks into the far shaft. */
export const tbmFront = (T: TunnelTimeline, t: number) => lerp(X_START, X_END, progress(t, T.boreS, T.boreE));
export const tbmTail = (T: TunnelTimeline, t: number) => tbmFront(T, t) - TBM_LEN - 0.3;

const dynamicShot = (name: string, xF: number): Shot | null => {
  const y = TUN_Y;
  const tail = xF - TBM_LEN;
  switch (name) {
    case 'followTBM': return { from: S([xF + 1.4, y + 1.8, 10], [xF - 0.8, y + 0.2, 0]), to: S([xF + 1.0, y + 1.5, 9], [xF - 0.8, y + 0.2, 0]) };
    case 'faceClose': return { from: S([xF + 2.6, y + 1.3, 7.2], [xF + 0.6, y + 0.3, 0]), to: S([xF + 2.3, y + 1.1, 6.4], [xF + 0.6, y + 0.3, 0]) };
    case 'pipes': return { from: S([xF - 4.5, y + 1.3, 7.5], [xF - 7, y + 0.4, -0.5], 52), to: S([xF - 5, y + 1.2, 7], [xF - 7.5, y + 0.4, -0.5], 52) };
    case 'tailClose': return { from: S([tail + 1.4, y + 1.0, 6.2], [tail - 0.2, y, 0], 50), to: S([tail + 1.1, y + 0.9, 5.6], [tail - 0.2, y, 0], 50) };
    case 'ringsClose': return { from: S([xF - 2.0, y + 0.9, 6.4], [xF - 4.4, y, -0.4], 52), to: S([xF - 2.4, y + 0.8, 5.8], [xF - 4.6, y, -0.4], 52) };
    case 'insideTube': return { from: S([xF - 8.5, y + 0.3, -0.25], [xF - 1, y - 0.1, -0.25], 62), to: S([xF - 7.8, y + 0.25, -0.25], [xF - 1, y - 0.1, -0.25], 62) };
    case 'gapShot': return { from: S([xF - 6, y + 2.0, 10.5], [xF - 7.5, y + 1.3, 0], 50), to: S([xF - 6.4, y + 1.9, 9.5], [xF - 7.6, y + 1.3, 0], 50) };
    case 'groutShot': return { from: S([xF - 6.5, y + 0.6, 9.5], [xF - 7, y, 0], 50), to: S([xF - 7, y + 0.5, 8.5], [xF - 7.5, y, 0], 50) };
    default: return null;
  }
};

/** The hook replays the finished tunnel (train under the river), then the story starts. */
// slowed down so the train crosses the middle of the frame at ~1.2s
export const sceneTime = (T: TunnelTimeline, t: number) => (t < T.flood ? T.train + 0.2 + t * 0.55 : t);

export const cameraPose = (tm: Timings, T: TunnelTimeline, tReal: number): CameraPose => {
  const t = sceneTime(T, tReal);
  const beats = tm.beats;
  let bi = 0;
  for (let i = 0; i < beats.length; i++) if (t >= beats[i].start) bi = i;
  let a = bi;
  while (a > 0 && beats[a - 1].shot === beats[bi].shot) a--;
  let z = bi;
  while (z < beats.length - 1 && beats[z + 1].shot === beats[bi].shot) z++;
  const runS = a === 0 ? 0 : beats[a].start;
  const runE = z < beats.length - 1 ? beats[z + 1].start : tm.duration;
  const hook = tReal < T.flood; // the hook is one unbroken shot of the finished tunnel
  const name = hook ? 'trainClose' : beats[bi].shot;
  const shot = dynamicShot(name, tbmFront(T, t)) ?? SHOTS[name] ?? SHOTS.section;
  const e = (shot.ease ?? easeInOutSine)(hook ? clamp01(tReal / T.flood) : clamp01((t - runS) / (runE - runS)));
  const pos = lerp3(shot.from.pos, shot.to.pos, e);
  const target = lerp3(shot.from.target, shot.to.target, e);
  const fov = lerp(shot.from.fov ?? 50, shot.to.fov ?? shot.from.fov ?? 50, e);
  if (!hook && a > 0 && t - runS < 0.3) {
    const k = 0.3 * (1 - easeOutCubic(clamp01((t - runS) / 0.28)));
    for (let i = 0; i < 3; i++) pos[i] += (pos[i] - target[i]) * k;
  }
  const kick = (t0: number, amp: number) => (t > t0 ? amp * Math.exp(-(t - t0) * 6) : 0);
  const boring = t > T.boreS && t < T.boreE ? 0.012 : 0;
  const shake = kick(T.flood + 0.15, 0.12) + kick(T.lower + 1.0, 0.08) + kick(T.boreE - 0.3, 0.12) + boring;
  pos[1] += Math.sin(t * 47) * shake;
  pos[0] += Math.cos(t * 39) * shake * 0.6;
  return { pos, target, fov };
};

/** Label anchors that follow moving things. */
export const labelAnchor = (T: TunnelTimeline, key: string, t: number): number[] | null => {
  const xF = tbmFront(T, t);
  const tail = tbmTail(T, t);
  switch (key) {
    case 'tbmFront': return [xF + 0.2, TUN_Y + 1.4, 0.8];
    case 'tbmBody': return [xF - 1.9, TUN_Y + 1.4, 0.8];
    case 'face': return [xF + 0.4, TUN_Y + 1.4, 1.0];
    case 'jacks': return [xF - TBM_LEN - 0.2, TUN_Y + 1.2, 0.9];
    case 'segment': return [tail - 0.4, TUN_Y + 1.0, -0.2];
    case 'grout': return [tail - 4, TUN_Y + TUN_R + 0.15, 0.2];
    case 'laser': return [xF - 6, TUN_Y + 0.6, 0];
    default: return null;
  }
};
