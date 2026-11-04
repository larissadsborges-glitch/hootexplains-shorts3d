import {
  beatByEvent, clamp01, easeInOutSine, easeOutCubic, lerp, lerp3, wordTime,
} from '../../lib/anim';
import type { Beat, Timings } from '../../types';
import type { CameraPose, Shot } from '../../world/Props';

// ---- world dimensions ----
export const HX = 4; // house half-width (x)
export const HZ_BACK = -5.6; // back wall z
export const HZ_FRONT = 0.3; // cut front edge z (just in front of the ground section)
export const WALL_H = 3.0;
export const COL_X = 3.85; // footing / column x (±)
export const PIT_DEPTH = 3.4; // footings reach the firm layer
export const RAISED = 0.45; // house base once it stands on footings
export const SOIL_Y = -3.0; // soft topsoil → firm ground boundary
export const ROCK_Y = -6.6;
export const SUGAR_AT: [number, number, number] = [40, 0, -1];
/** Cold open: replay the crack for the first second. */
export const COLD = 1.0;

const S = (pos: number[], target: number[], fov = 50) => ({ pos, target, fov });
export const SHOTS: Record<string, Shot> = {
  hook: { from: S([0, 14, 40], [0, 2, 0], 52), to: S([0, 3.2, 18.5], [0, 1.8, 0], 50), ease: easeOutCubic },
  front: { from: S([0, 3.2, 17.5], [0, 1.7, 0]), to: S([0, 3.0, 16.5], [0, 1.6, 0]) },
  soilPush: { from: S([0, 1.0, 16], [0, -0.6, 0]), to: S([0, 0.2, 11.5], [0, -1.2, 0]) },
  apronClose: { from: S([9, 2.4, 6.5], [5, 0.1, -2]), to: S([8, 2.0, 5.5], [5, 0, -2]) },
  corner: { from: S([-4.5, 2.6, 11.5], [1.2, 1.2, -2.8]), to: S([-3.8, 2.2, 10.2], [1.6, 1.1, -2.8]) },
  pitClose: { from: S([5.6, -0.6, 9.5], [3.85, -1.8, 0], 48), to: S([5.0, -1.0, 8.2], [3.85, -2.0, 0], 48) },
  beamClose: { from: S([2.2, 1.6, 9.5], [0, 0.2, 0], 48), to: S([1.5, 1.3, 8.2], [0, 0.2, 0], 48) },
  wallClose: { from: S([8.6, 1.7, -2.5], [4, 1.35, -2.6], 45), to: S([8.0, 1.6, -2.55], [4, 1.3, -2.6], 45) },
  sugarClose: { from: S([40.6, 2.4, 0.1], [40, 1.48, -1], 42), to: S([40.45, 2.2, -0.25], [40, 1.46, -1], 42) },
  rainFront: { from: S([5, 3.4, 17.5], [0, 1.6, 0], 50), to: S([4.2, 3.1, 16], [0, 1.6, 0], 50) },
  rainSide: { from: S([9, 1.8, 9.5], [4.8, -0.6, -0.5], 50), to: S([8, 1.5, 8.5], [4.8, -0.7, -0.5], 50) },
  recap: { from: S([0, 2.6, 21], [0, 0.6, 0], 50), to: S([3, 3.0, 20], [0, 0.6, 0], 50) },
  final: { from: S([6, 3.5, 16], [0, 1, -2], 50), to: S([12, 9, 26], [0, 1, -3], 52), ease: easeOutCubic },
};

const st = (b: Beat | undefined, d: number) => b?.start ?? d;
const next = (tm: Timings, b: Beat | undefined, d: number) => (b ? tm.beats[b.index + 1]?.start ?? tm.duration : d);

export type HouseTimeline = ReturnType<typeof buildHouseTimeline>;

export const buildHouseTimeline = (tm: Timings) => {
  const b = (e: string) => beatByEvent(tm, e);
  const byLabel = (l: string) => tm.beats.find((x) => x.label === l);
  const recap = b('recap');
  return {
    outline: st(b('outline'), 2),
    wallsS: st(b('walls'), 3), wallsE: next(tm, b('walls'), 4),
    roofS: st(b('roof'), 4.5), roofLand: st(b('roof'), 4.5) + 0.55,
    sinkS: st(b('sink'), 6), sinkE: next(tm, b('sink'), 8),
    crack: st(b('crack'), 8),
    clear: st(b('clearLot'), 9),
    digS: st(b('dig'), 11), digE: next(tm, b('dig'), 12.5),
    rebarS: st(b('rebar'), 13), rebarE: next(tm, b('rebar'), 14),
    pourS: st(b('pour'), 14), pourE: next(tm, b('pour'), 15.5),
    footLabel: st(byLabel('FOOTINGS'), 16),
    houseBack: st(b('houseBack'), 17), houseLand: st(b('houseBack'), 17) + 0.6,
    sagS: st(b('sag'), 19), sagE: next(tm, b('sag'), 21),
    beamS: st(b('beam'), 21), beamE: next(tm, b('beam'), 23),
    level: st(b('level'), 25),
    dampS: st(b('damp'), 27),
    sugar: st(b('sugar'), 31), sugarRiseS: st(b('sugarRise'), 33), sugarRiseE: next(tm, b('sugarRise'), 35),
    tarS: st(b('tar'), 35), tarE: next(tm, b('tar'), 37),
    dampStop: st(b('dampStop'), 37),
    rain: st(b('rain'), 40), soak: st(b('soak'), 41.5), soggy: st(b('soggy'), 44),
    apronS: st(b('apron'), 46), apronE: next(tm, b('apron'), 48), drain: st(b('drain'), 48),
    recap,
    rainStop: st(recap, 51),
    final: st(b('final'), 54),
    wordTime: (e: string, w: string, d: number) => wordTime(b(e), w, d),
  };
};

export const sceneTime = (T: HouseTimeline, t: number) => (t < COLD ? T.crack - 0.55 + t : t);

export const cameraPose = (tm: Timings, T: HouseTimeline, tReal: number): CameraPose => {
  const t = sceneTime(T, tReal);
  const beats = tm.beats;
  let bi = 0;
  for (let i = 0; i < beats.length; i++) if (t >= beats[i].start) bi = i;
  const winS = bi === 0 ? COLD : beats[bi].start;
  const winE = bi < beats.length - 1 ? beats[bi + 1].start : tm.duration;
  const shot = SHOTS[beats[bi].shot] ?? SHOTS.front;
  // consecutive beats with the same shot continue one smooth move
  let a = bi;
  while (a > 0 && beats[a - 1].shot === beats[bi].shot) a--;
  let z = bi;
  while (z < beats.length - 1 && beats[z + 1].shot === beats[bi].shot) z++;
  const runS = a === 0 ? COLD : beats[a].start;
  const runE = z < beats.length - 1 ? beats[z + 1].start : tm.duration;
  void winS; void winE;
  const e = (shot.ease ?? easeInOutSine)(clamp01((t - runS) / (runE - runS)));
  const pos = lerp3(shot.from.pos, shot.to.pos, e);
  const target = lerp3(shot.from.target, shot.to.target, e);
  const fov = lerp(shot.from.fov ?? 50, shot.to.fov ?? shot.from.fov ?? 50, e);
  if (a > 0 && t - runS < 0.3) {
    const k = 0.3 * (1 - easeOutCubic(clamp01((t - runS) / 0.28)));
    for (let i = 0; i < 3; i++) pos[i] += (pos[i] - target[i]) * k;
  }
  const kick = (t0: number, amp: number) => (t > t0 ? amp * Math.exp(-(t - t0) * 6) : 0);
  const shake = kick(T.crack, 0.16) + kick(T.roofLand, 0.05) + kick(T.houseLand, 0.07) + kick(T.sagS + 0.6, 0.1);
  pos[1] += Math.sin(t * 47) * shake;
  pos[0] += Math.cos(t * 39) * shake * 0.6;
  return { pos, target, fov };
};
