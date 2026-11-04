import { beatByEvent, clamp01, easeInOutSine, easeOutCubic, lerp, lerp3, wordTime } from '../../lib/anim';
import type { Beat, Timings } from '../../types';
import type { CameraPose, Shot } from '../../world/Props';

/** Places, far apart. The cabin reuses the plane window cabin (floor y=0, window wall at z=-1.25). Units ≈ metres. */
export const CABIN = [0, 0, 0];
export const EXTERIOR = [600, 0, 0];
export const TOWERS = [1200, 0, 0];
export const COCKPIT = [1800, 0, 0];
export const PHONEP = [2400, 0, 0];
export const SAT = [3000, 0, 0];
export const HOOT_SEAT = [0.8, 0.47, -0.72];
/** Hoot's phone, in Hoot's local frame (before his 0.42 scale and 0.5 rad turn). */
export const HOOT_PHONE = [-0.62, 0.72, 0.78];
/** The pico-cell under the cabin ceiling. */
export const MAST = [0.15, 2.47, 0.3];
/** Satellite position relative to SAT. */
export const SAT_POS = [-7, 26, -16];
/** Ground level under the low plane in the towers place. */
export const GROUND_Y = -22;

const st = (b: Beat | undefined, d: number) => b?.start ?? d;

export type AirplaneModeTimeline = ReturnType<typeof buildAirplaneModeTimeline>;
export const buildAirplaneModeTimeline = (tm: Timings) => {
  const b = (e: string) => beatByEvent(tm, e);
  const s = (e: string, d: number) => st(b(e), d);
  const e = (ev: string, d: number) => b(ev)?.end ?? d;
  return {
    myth: s('myth', 4.2), search: s('search', 10.7), towers: s('towers', 15.5), rehook: s('rehook', 21.7), buzz: s('buzz', 24.3), buzzEnd: e('buzz', 29),
    landing: s('landing', 30.7), verdict: s('verdict', 37.1), twist: s('twist', 43), satellite: s('satellite', 50), battery: s('battery', 53.8), final: s('final', 58.9),
    end: tm.duration,
    wordTime: (ev: string, w: string, d: number) => wordTime(b(ev), w, d),
  };
};

/** The headset buzz: when it plays (just after "Like this.") and its on/off gate, matching scripts/make_sfx_phone.py. */
export const BUZZ_STARTS = [0.0, 0.16, 0.32, 0.85, 1.0, 1.15, 1.3];
export const buzzT0 = (T: AirplaneModeTimeline) => T.buzzEnd + 0.08;
export const buzzOn = (T: AirplaneModeTimeline, t: number) => {
  const u = t - buzzT0(T);
  return BUZZ_STARTS.some((s) => u >= s && u < s + 0.11);
};
export const buzzActive = (T: AirplaneModeTimeline, t: number) => t >= buzzT0(T) && t < buzzT0(T) + 1.45;

/** Towers on the ground below the low plane: they scroll back as the plane flies. Returns world-relative (to TOWERS) positions. */
const TOWER_BASE: number[][] = [[-30, -6], [-18, 14], [-8, -20], [2, 8], [10, -9], [18, 20], [26, -2], [34, 12], [44, -16], [52, 4], [62, 18], [70, -10], [80, 6], [-40, 10], [88, -18]];
export const towerPositions = (T: AirplaneModeTimeline, t: number) => {
  const shift = (t - T.towers) * 9;
  const W = 130;
  return TOWER_BASE.map(([x, z]) => [((((x - shift + 45) % W) + W) % W) - 45, GROUND_Y, z]);
};
/** How far (horizontally) a phone in the low plane reaches. Grows in on "many towers". */
export const reachAt = (T: AirplaneModeTimeline, t: number) => 34 * easeOutCubic(clamp01((t - T.wordTime('towers', 'reach', T.towers + 2.2)) / 1.2));
export const towersReached = (T: AirplaneModeTimeline, t: number) => {
  const r = reachAt(T, t);
  return towerPositions(T, t).filter(([x, , z]) => Math.hypot(x, z) < r);
};

const S = (pos: number[], target: number[], fov = 50) => ({ pos, target, fov });
const add = (a: number[], b: number[]) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const SHOTS: Record<string, Shot> = {
  // hook: Hoot in his window seat, phone in hand (one shot, no cut in the first 3 s)
  cabinHook: { from: S([1.12, 1.32, 1.6], [0.66, 0.98, -0.75], 52), to: S([1.06, 1.3, 1.36], [0.67, 1.0, -0.78], 52) },
  exterior: { from: S(add(EXTERIOR, [21, 4.5, 8.5]), add(EXTERIOR, [0.8, -0.4, 0]), 46), to: S(add(EXTERIOR, [19, 3.8, 7.6]), add(EXTERIOR, [0.8, -0.4, 0]), 46) },
  phone: { from: S(add(PHONEP, [0.9, 0.25, 4.6]), add(PHONEP, [0, 0.45, 0]), 40), to: S(add(PHONEP, [0.5, 0.15, 4.1]), add(PHONEP, [0, 0.45, 0]), 40) },
  towers: { from: S(add(TOWERS, [28, 9, 32]), add(TOWERS, [0, -5, 0]), 52), to: S(add(TOWERS, [25, 8, 29]), add(TOWERS, [0, -5.5, 0]), 52) },
  cockpit: { from: S(add(COCKPIT, [-2.1, 1.62, 0.05]), add(COCKPIT, [1.6, 1.2, 0]), 60), to: S(add(COCKPIT, [-1.85, 1.58, 0.05]), add(COCKPIT, [1.6, 1.2, 0]), 60) },
  headset: { from: S(add(COCKPIT, [0.55, 1.34, -1.08]), add(COCKPIT, [0.0, 1.2, -0.6]), 50), to: S(add(COCKPIT, [0.45, 1.31, -1.02]), add(COCKPIT, [0.0, 1.2, -0.62]), 50) },
  cabinWide: { from: S([3.7, 2.15, 1.75], [-0.6, 0.85, -0.45], 56), to: S([3.3, 2.05, 1.6], [-0.6, 0.85, -0.45], 56) },
  approach: { from: S(add(COCKPIT, [-2.1, 1.62, 0.05]), add(COCKPIT, [1.6, 1.15, 0]), 60), to: S(add(COCKPIT, [-1.85, 1.58, 0.05]), add(COCKPIT, [1.6, 1.12, 0]), 60) },
  mast: { from: S([2.1, 1.35, 1.7], [0.15, 2.05, -0.05], 58), to: S([1.85, 1.32, 1.55], [0.15, 2.1, -0.05], 58) },
  satellite: { from: S(add(SAT, [17, -3, 15]), add(SAT, [-2, 9, -5]), 58), to: S(add(SAT, [15, -2.5, 13]), add(SAT, [-2, 9.5, -5]), 58) },
  cta: { from: S([1.25, 1.45, 2.0], [0.6, 1.0, -0.8], 52), to: S([1.12, 1.42, 1.75], [0.62, 1.0, -0.8], 52) },
};

export const cameraPose = (tm: Timings, T: AirplaneModeTimeline, t: number): CameraPose => {
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
  const shot = SHOTS[name] ?? SHOTS.cabinHook;
  const e = (shot.ease ?? easeInOutSine)(clamp01((t - runS) / (runE - runS)));
  const pos = lerp3(shot.from.pos, shot.to.pos, e);
  const target = lerp3(shot.from.target, shot.to.target, e);
  const fov = lerp(shot.from.fov ?? 50, shot.to.fov ?? 50, e);
  // whip-in after every cut
  if (a > 0 && t - runS < 0.3) {
    const k = 0.25 * (1 - easeOutCubic(clamp01((t - runS) / 0.28)));
    for (let i = 0; i < 3; i++) pos[i] += (pos[i] - target[i]) * k;
  }
  // a tiny shake on every buzz burst
  const sh = buzzOn(T, t) && name === 'headset' ? 0.006 : 0;
  pos[1] += Math.sin(t * 61) * sh;
  pos[0] += Math.cos(t * 47) * sh;
  return { pos, target, fov };
};

export const labelAnchor = (_T: AirplaneModeTimeline, key: string): number[] | null => {
  if (key === 'mast') return MAST;
  if (key === 'sat') return add(SAT, SAT_POS);
  return null;
};
