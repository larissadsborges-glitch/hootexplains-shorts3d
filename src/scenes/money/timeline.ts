import { beatByEvent, clamp01, easeInOutSine, easeOutCubic, lerp, lerp3, wordTime } from '../../lib/anim';
import type { Timings } from '../../types';
import type { CameraPose, Shot } from '../../world/Props';

/**
 * MONEY, EXPLAINED (series scene, one module for EP1–6, picked by script "ep").
 * Places (units ≈ metres, floor y=0):
 *  - Jake's room at the origin: same layout as the awake scene (desk at DESK, Jake behind it facing +z).
 *  - Market (EP1 barter flash-back) offset to x = MARKET[0].
 *  - Timeline table (EP1 shells → coins → paper) offset to x = TABLE[0].
 */
export const DESK = [0.15, 0, -0.85];
export const JAKE_DESK = [0.15, 0, -1.38];
export const MARKET = [600, 0, 0];
export const TABLE = [700, 0, 0];

export type MoneyTimeline = ReturnType<typeof buildMoneyTimeline>;
export const buildMoneyTimeline = (tm: Timings) => {
  const b = (e: string) => beatByEvent(tm, e);
  const s = (e: string, d = -1) => b(e)?.start ?? d;
  const e = (ev: string, d = -1) => b(ev)?.end ?? d;
  return {
    s,
    e,
    end: tm.duration,
    ep: (tm as unknown as { ep?: number }).ep ?? 1,
    wordTime: (ev: string, w: string, d: number) => wordTime(b(ev), w, d),
  };
};

const S = (pos: number[], target: number[], fov = 45) => ({ pos, target, fov });
const add = (a: number[], b: number[]) => a.map((v, i) => v + b[i]);
export const SHOTS: Record<string, Shot> = {
  // medium close-up of Jake at the desk holding the note up; slow push-in (≈1.35 m → 1.1 m)
  billHook: { from: S([0.0, 1.3, 0.45], [0.02, 1.0, -1.4], 50), to: S([0.0, 1.27, 0.2], [0.02, 1.01, -1.4], 50) },
  // market stall, wide, with a gentle drift
  barter: { from: S(add(MARKET, [0.35, 1.5, 3.1]), add(MARKET, [0, 1.05, 0]), 46), to: S(add(MARKET, [0.15, 1.45, 2.7]), add(MARKET, [0, 1.05, 0]), 46) },
  // tracking right along the long table of money objects
  timeline: { from: S(add(TABLE, [-1.1, 1.55, 1.9]), add(TABLE, [-1.1, 0.85, 0]), 40), to: S(add(TABLE, [1.1, 1.55, 1.9]), add(TABLE, [1.1, 0.85, 0]), 40) },
};

/** The table shot follows the words: shells (left), coins (middle), paper (right). */
const tablePose = (T: MoneyTimeline, t: number): CameraPose => {
  const ws = T.wordTime('coins', 'shells', T.s('coins') + 1.8), wc = T.wordTime('coins', 'coins', T.s('coins') + 2.5), wp = T.wordTime('coins', 'paper', T.s('coins') + 3.1);
  // slow drift from the old barter goods (left) to the paper (right); all three eras stay in frame
  const e = easeInOutSine(clamp01((t - T.s('coins')) / Math.max(0.5, wp + 0.6 - T.s('coins'))));
  const x = lerp(-0.42, 0.12, e);
  void ws; void wc;
  return { pos: [TABLE[0] + x, 1.42, 1.45], target: [TABLE[0] + x, 0.8, 0], fov: 42 };
};

export const cameraPose = (tm: Timings, T: MoneyTimeline, t: number): CameraPose => {
  const beats = tm.beats;
  const cur = beats.reduce((s, b) => (t >= b.start ? b.shot : s), beats[0].shot);
  if (cur === 'timeline') {
    const p = tablePose(T, t);
    const k = 0.25 * (1 - easeOutCubic(clamp01((t - T.s('coins')) / 0.28)));
    for (let i = 0; i < 3; i++) p.pos[i] += (p.pos[i] - p.target[i]) * k;
    return p;
  }
  let bi = 0;
  for (let i = 0; i < beats.length; i++) if (t >= beats[i].start) bi = i;
  let a = bi;
  while (a > 0 && beats[a - 1].shot === beats[bi].shot) a--;
  let z = bi;
  while (z < beats.length - 1 && beats[z + 1].shot === beats[bi].shot) z++;
  const runS = a === 0 ? 0 : beats[a].start;
  const runE = z < beats.length - 1 ? beats[z + 1].start : tm.duration;
  const shot = SHOTS[beats[bi].shot] ?? SHOTS.billHook;
  const e = easeInOutSine(clamp01((t - runS) / (runE - runS)));
  const pos = lerp3(shot.from.pos, shot.to.pos, e);
  const target = lerp3(shot.from.target, shot.to.target, e);
  const fov = lerp(shot.from.fov ?? 45, shot.to.fov ?? 45, e);
  // a short punch-in on every cut (not on the very first frame: the first 3 s are one unbroken shot)
  if (a > 0 && t - runS < 0.3) {
    const k = 0.25 * (1 - easeOutCubic(clamp01((t - runS) / 0.28)));
    for (let i = 0; i < 3; i++) pos[i] += (pos[i] - target[i]) * k;
  }
  return { pos, target, fov };
};

export const labelAnchor = (): number[] | null => null;
