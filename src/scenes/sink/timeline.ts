import { beatByEvent, clamp01, easeInOutSine, easeOutCubic, lerp, lerp3, progress, wordTime } from '../../lib/anim';
import type { Beat, Timings } from '../../types';
import type { CameraPose, Shot } from '../../world/Props';

/** Bathroom cross-section, 1 unit ≈ 1 m. Floor top at y=0, sewer below, roof above. */
export const RIM_Y = 0.9, DRAIN_Y = 0.72;
export const U_CX = 0.13, U_CY = 0.42, U_R = 0.13; // U-bend: centre + radius
export const WEIR_Y = 0.47; // outlet level: water above this spills on
export const STACK_X = 0.62; // the stack in the wall: down to the sewer, up to the roof
export const SEWER_Y = -1.3;
export const CEIL_Y = 2.6, ROOF_TOP = 4.2, VENT_TOP = 4.0;
export const STRAP = [10, 0, 0]; // S-trap comparison, off to the side
export const HOOT_AT = [-1.05, 0, 0.35];

const st = (b: Beat | undefined, d: number) => b?.start ?? d;
const en = (tm: Timings, b: Beat | undefined, d: number) => (b ? tm.beats[b.index + 1]?.start ?? tm.duration : d);

export type SinkTimeline = ReturnType<typeof buildSinkTimeline>;
export const buildSinkTimeline = (tm: Timings) => {
  const b = (e: string) => beatByEvent(tm, e);
  const s = (e: string, d: number) => st(b(e), d);
  return {
    straight: s('straight', 4), sewerGas: s('sewerGas', 6.4), stink: s('stink', 9.3), bend: s('bend', 12.5),
    seal: s('seal', 14.3), plug: s('plug', 19.4), siphon: s('siphon', 23.2), suck: wordTime(b('siphon'), 'suck', 24.5),
    vent: s('vent', 26.6), air: s('air', 29.4), roof: s('roof', 32.4), strap: s('strap', 37.4), strapBan: wordTime(b('strap'), 'ban', 42),
    evap: s('evap', 45.6), evaporates: wordTime(b('evap'), 'evaporates', 48), refill: s('refill', 50.8), tap: wordTime(b('refill'), 'tap', 52.5),
    ring: s('ring', 53.6), unscrew: wordTime(b('ring'), 'unscrew', 57), final: s('final', 58.3), end: tm.duration,
    stripE: en(tm, b('strap'), 45.5),
    wordTime: (e: string, w: string, d: number) => wordTime(b(e), w, d),
  };
};

/** The hook shows the finished U (with its water) before the story rewinds to a straight pipe. */
export const pipeIsU = (T: SinkTimeline, t: number) => t < T.straight || t >= T.bend + 0.5;
export const bendMorph = (T: SinkTimeline, t: number) => (t < T.straight ? 1 : easeInOutSine(progress(t, T.bend + 0.2, T.bend + 1.2)));

/** Water level in the U (0 = empty, 1 = full to the weir). */
export const waterLevel = (T: SinkTimeline, t: number) => {
  if (t < T.straight) return 1;
  if (t < T.bend) return 0;
  let w = easeOutCubic(progress(t, T.seal + 0.2, T.seal + 1.6)); // first wash leaves water behind
  // siphon: a big rush pulls the plug out
  if (t >= T.suck) w = 1 - 0.85 * easeOutCubic(progress(t, T.suck, T.suck + 1.0));
  // the vent fixes it: back to full and stays put
  if (t >= T.air) w = Math.min(1, 0.15 + 0.85 * easeOutCubic(progress(t, T.air + 0.1, T.air + 0.8)));
  // weeks later: evaporation, then a quick run of the tap refills it
  if (t >= T.evap) w = 1 - 0.85 * easeInOutSine(progress(t, T.evap + 1.6, T.evaporates + 0.8));
  if (t >= T.refill) w = 0.15 + 0.85 * easeOutCubic(progress(t, T.tap, T.tap + 0.8));
  if (t >= T.ring) w = 1;
  return w;
};
/** Is water rushing through right now (and from where)? */
export const flowing = (T: SinkTimeline, t: number) =>
  (t >= T.straight + 0.3 && t < T.sewerGas + 0.6) || (t >= T.seal + 0.1 && t < T.seal + 1.4) || (t >= T.suck - 0.2 && t < T.suck + 1.0) ||
  (t >= T.air + 0.05 && t < T.air + 0.9) || (t >= T.tap && t < T.tap + 1.0);
/** Is a vent present? */
export const hasVent = (T: SinkTimeline, t: number) => t < T.straight || t >= T.vent;

const S = (pos: number[], target: number[], fov = 50) => ({ pos, target, fov });
const SHOTS: Record<string, Shot> = {
  hook: { from: S([0.35, 0.75, 3.4], [0.2, 0.42, 0], 46), to: S([0.3, 0.6, 2.2], [0.2, 0.42, 0], 46) },
  room: { from: S([0.0, 0.5, 6.3], [-0.05, 0.1, 0], 48), to: S([0.1, 0.45, 5.7], [-0.05, 0.05, 0], 48) },
  uClose: { from: S([0.3, 0.62, 1.75], [0.24, 0.45, 0], 46), to: S([0.26, 0.6, 1.5], [0.24, 0.45, 0], 46) },
  house: { from: S([0.6, 1.3, 7.5], [0.5, 1.1, 0], 50), to: S([0.8, 2.4, 10.5], [0.5, 1.6, 0], 50), ease: easeOutCubic },
  roof: { from: S([3.4, 5.6, 5.2], [0.6, 3.9, -0.4], 46), to: S([2.6, 5.0, 4.2], [0.6, 4.0, -0.4], 46) },
  sTrap: { from: S([STRAP[0] + 0.3, 0.6, 3.0], [STRAP[0] + 0.25, 0.35, 0], 48), to: S([STRAP[0] + 0.28, 0.55, 2.6], [STRAP[0] + 0.25, 0.33, 0], 48) },
  final: { from: S([-0.3, 0.8, 4.6], [-0.4, 0.6, 0], 48), to: S([0.0, 1.2, 6.2], [-0.2, 0.7, 0], 48), ease: easeOutCubic },
};

export const cameraPose = (tm: Timings, T: SinkTimeline, t: number): CameraPose => {
  const beats = tm.beats;
  let bi = 0;
  for (let i = 0; i < beats.length; i++) if (t >= beats[i].start) bi = i;
  let a = bi;
  while (a > 0 && beats[a - 1].shot === beats[bi].shot) a--;
  let z = bi;
  while (z < beats.length - 1 && beats[z + 1].shot === beats[bi].shot) z++;
  const runS = a === 0 ? 0 : beats[a].start;
  const runE = z < beats.length - 1 ? beats[z + 1].start : tm.duration;
  const shot = SHOTS[beats[bi].shot] ?? SHOTS.room;
  const e = (shot.ease ?? easeInOutSine)(clamp01((t - runS) / (runE - runS)));
  const pos = lerp3(shot.from.pos, shot.to.pos, e);
  const target = lerp3(shot.from.target, shot.to.target, e);
  const fov = lerp(shot.from.fov ?? 50, shot.to.fov ?? 50, e);
  if (a > 0 && t - runS < 0.3) {
    const k = 0.25 * (1 - easeOutCubic(clamp01((t - runS) / 0.28)));
    for (let i = 0; i < 3; i++) pos[i] += (pos[i] - target[i]) * k;
  }
  const kick = (t0: number, amp: number) => (t > t0 ? amp * Math.exp(-(t - t0) * 6) : 0);
  const sh = kick(T.suck, 0.02) + kick(T.strapBan, 0.01);
  pos[1] += Math.sin(t * 47) * sh;
  return { pos, target, fov };
};

export const labelAnchor = (_T: SinkTimeline, key: string): number[] | null => {
  switch (key) {
    case 'seal': return [U_CX, U_CY - U_R, 0.1];
    case 'vent': return [STACK_X, 2.2, 0.1];
    default: return null;
  }
};
