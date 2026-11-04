import {
  beatByEvent, clamp01, easeInOutSine, easeOutCubic, lerp, lerp3, progress, wordTime,
} from '../../lib/anim';
import type { Beat, Timings } from '../../types';
import type { CameraPose, Shot } from '../../world/Props';

// ---- building + shaft geometry ----
export const XC = -0.2; // car centre x
export const CAR_W = 1.6, CAR_H = 2.3, CAR_D = 1.6, CAR_Z = -0.3;
export const RAIL_X = [XC - 0.9, XC + 0.9];
export const CW_X = 1.35; // counterweight x
export const SHEAVE = { x: 0.575, y: 19.9, r: 0.775 }; // drive sheave: left edge over the car, right edge over the counterweight
export const GOV = { x: -1.3, y: 19.7, r: 0.32 };
export const FLOOR_H = 3, FLOORS = 6, TOP_Y = FLOORS * FLOOR_H + 1; // machine-room floor
export const PIT_Y = -2.5; // pit floor
export const BUF_TOP = -1.3; // buffer top (car floor rests here on impact)
export const CW_BUF_TOP = -1.0;
export const Y0 = 12; // car parked at floor 4
export const OTIS_AT: [number, number, number] = [40, 0, 0];

const S = (pos: number[], target: number[], fov = 50) => ({ pos, target, fov });
export const SHOTS: Record<string, Shot> = {
  machineRoom: { from: S([1.6, 21.0, 5.6], [0.6, 20.0, 0], 52), to: S([1.3, 20.8, 5.0], [0.6, 20.0, 0], 52) },
  governorClose: { from: S([-0.4, 20.2, 3.4], [-1.3, 19.7, 0], 48), to: S([-0.5, 20.1, 3.0], [-1.3, 19.7, 0], 48) },
  otis: { from: S([42.4, 2.6, 7.5], [40, 1.8, 0], 48), to: S([41.9, 2.3, 6.4], [40, 1.6, 0], 48) },
  pitShot: { from: S([1.4, 0.6, 7.5], [-0.2, -1.0, 0], 52), to: S([1.2, 0.3, 6.6], [-0.2, -1.2, 0], 52) },
  buildingWide: { from: S([6, 9.5, 31], [0, 9.5, 0], 52), to: S([7, 10, 29], [0, 9.5, 0], 52) },
  final: { from: S([5, 2.5, 13], [0, 2.5, 0], 50), to: S([10, 7, 25], [0, 6, -1], 52), ease: easeOutCubic },
};

const st = (b: Beat | undefined, d: number) => b?.start ?? d;
const nx = (tm: Timings, b: Beat | undefined, d: number) => (b ? tm.beats[b.index + 1]?.start ?? tm.duration : d);

export type ElevatorTimeline = ReturnType<typeof buildElevatorTimeline>;

export const buildElevatorTimeline = (tm: Timings) => {
  const b = (e: string) => beatByEvent(tm, e);
  const hook = b('hook');
  return {
    snap1: wordTime(hook, 'snapped', 1.0),
    rewindS: st(b('rewind'), 3),
    ropes: st(b('ropes'), 6), eachRope: st(b('eachRope'), 9),
    cwS: st(b('counterweight'), 11), cwE: nx(tm, b('counterweight'), 14),
    brakeS: st(b('brake'), 14), cut: wordTime(b('brake'), 'cut', 17),
    allSnap: st(b('allSnap'), 20) + 0.55,
    govS: st(b('governor'), 22),
    wedgeT: wordTime(b('wedges'), 'wedges', 26),
    stopS: st(b('stop'), 28),
    otisS: st(b('otis'), 30), otisCut: wordTime(b('otis'), 'cut', 33),
    elseS: st(b('elseFails'), 37) + 0.45,
    buffersS: st(b('buffers'), 39),
    recapS: st(b('recap'), 42), payoff: st(b('payoff'), 46), final: st(b('final'), 50),
    otisSafe: st(b('otisSafe'), 36),
    wordTime: (e: string, w: string, d: number) => wordTime(b(e), w, d),
  };
};

const G1 = 5, G2 = 6, G3 = 14;

/** Where the elevator car is (floor y), and the state of everything attached to it. */
export const carState = (T: ElevatorTimeline, t: number) => {
  // scenario 1: the hook snap, then a rewind
  const ySnap1 = Y0 + 0.3 * T.snap1;
  const yFall1 = ySnap1 - 0.5 * G1 * Math.max(0, T.rewindS - 0.1 - T.snap1) ** 2;
  const rise = 1.5 * easeInOutSine(progress(t, T.cwS, T.cwE));
  // scenario 2: all ropes snap, the governor + wedges stop it
  const yAll = Y0 + 1.5;
  const dtFall = Math.min(0.75, Math.max(0, t - T.allSnap));
  const fall2a = 0.5 * G2 * dtFall ** 2;
  const vAtGov = G2 * 0.75;
  // slow motion while the governor is explained, then the wedges bite
  const slow = Math.max(0, Math.min(t, T.wedgeT) - (T.allSnap + 0.75)) * 0.45;
  const decel = (() => {
    const p = progress(t, T.wedgeT, T.wedgeT + 0.45);
    return 0.45 * (p - p * p / 2) * 0.9;
  })();
  const yStop = yAll - 0.5 * G2 * 0.75 ** 2 - Math.max(0, T.wedgeT - (T.allSnap + 0.75)) * 0.45 - 0.2;
  // scenario 3: the wedges slip, the car falls to the buffers
  const dtDrop = Math.max(0, t - T.elseS);
  const yDrop = yStop - 0.5 * G3 * dtDrop ** 2;
  const impactDt = Math.sqrt((2 * (yStop - BUF_TOP)) / G3);
  const tImpact = T.elseS + impactDt;
  const squash = t > tImpact ? 0.35 * Math.sin(Math.min(Math.PI, (t - tImpact) * 7)) * Math.exp(-(t - tImpact) * 2.5) + 0.12 * clamp01((t - tImpact) * 3) : 0;

  let y: number;
  if (t < T.snap1) y = Y0 + 0.3 * t;
  else if (t < T.rewindS) y = ySnap1 - 0.5 * G1 * Math.min(T.rewindS - 0.1 - T.snap1, t - T.snap1) ** 2;
  else if (t < T.rewindS + 0.9) y = lerp(yFall1, Y0, easeInOutSine(progress(t, T.rewindS, T.rewindS + 0.9)));
  else if (t < T.allSnap) y = Y0 + rise;
  else if (t < T.elseS) y = yAll - fall2a - slow - (t > T.wedgeT ? decel : 0) - (t > T.wedgeT + 0.45 ? 0 : 0);
  else if (t < tImpact) y = yDrop;
  else if (t < T.recapS) y = BUF_TOP - squash;
  else y = lerp(BUF_TOP - 0.12, 0.25, easeInOutSine(progress(t, T.recapS, T.recapS + 1.6)));

  const snapped = (t >= T.snap1 && t < T.rewindS + 0.85) || (t >= T.allSnap && t < T.recapS + 0.2);
  const snapAt = t < T.rewindS + 0.9 ? T.snap1 : T.allSnap;
  const wedges = t >= T.wedgeT && t < T.elseS ? clamp01((t - T.wedgeT) / 0.15) : 0;
  const powered = !(t >= T.cut && t < T.recapS);
  // counterweight moves opposite the car while the ropes are intact; falls to its buffer when they snap
  const cwFromCar = (cy: number) => 6 - (cy - Y0);
  let cwY = cwFromCar(y);
  if (snapped) {
    const cy0 = t < T.rewindS + 0.9 ? ySnap1 : yAll;
    const start = cwFromCar(cy0);
    cwY = Math.max(CW_BUF_TOP, start - 0.5 * 8 * (t - snapAt) ** 2);
  }
  return { y, snapped, snapAt, wedges, powered, cwY, tImpact, yStop, yFall1 };
};

export const carSpeed = (T: ElevatorTimeline, t: number) => (carState(T, t).y - carState(T, t - 1 / 30).y) * 30;

const dynamicShot = (name: string, cy: number): Shot | null => {
  switch (name) {
    case 'followCar': return { from: S([XC + 2.6, cy + 2.2, 9.5], [XC + 0.3, cy + 1.1, 0], 52), to: S([XC + 2.2, cy + 2.0, 8.8], [XC + 0.3, cy + 1.1, 0], 52) };
    case 'carTop': return { from: S([XC + 1.7, cy + 3.7, 4.8], [XC, cy + 2.6, -0.3], 50), to: S([XC + 1.4, cy + 3.5, 4.3], [XC, cy + 2.6, -0.3], 50) };
    case 'shaftWide': return { from: S([0.6, cy + 0.6, 15], [0.6, cy - 0.6, 0], 52), to: S([0.6, cy + 0.4, 14], [0.6, cy - 0.6, 0], 52) };
    case 'wedgeClose': return { from: S([RAIL_X[0] + 1.3, cy - 0.1, 4.2], [RAIL_X[0] + 0.45, cy - 0.15, 0], 46), to: S([RAIL_X[0] + 1.1, cy - 0.2, 3.6], [RAIL_X[0] + 0.45, cy - 0.15, 0], 46) };
    default: return null;
  }
};

export const cameraPose = (tm: Timings, T: ElevatorTimeline, t: number): CameraPose => {
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
  const cs = carState(T, t);
  // the camera holds still while the car falls, so the drop reads on screen
  const ev = beats[bi].event;
  const followY = ev === 'hook' ? Y0 + 0.3 * Math.min(t, T.snap1)
    : ev === 'elseFails' ? cs.yStop
    : Math.max(cs.y, BUF_TOP + 0.5);
  const shot = dynamicShot(name, followY) ?? SHOTS[name] ?? SHOTS.buildingWide;
  const e = (shot.ease ?? easeInOutSine)(clamp01((t - runS) / (runE - runS)));
  const pos = lerp3(shot.from.pos, shot.to.pos, e);
  const target = lerp3(shot.from.target, shot.to.target, e);
  const fov = lerp(shot.from.fov ?? 50, shot.to.fov ?? shot.from.fov ?? 50, e);
  if (a > 0 && t - runS < 0.3) {
    const k = 0.3 * (1 - easeOutCubic(clamp01((t - runS) / 0.28)));
    for (let i = 0; i < 3; i++) pos[i] += (pos[i] - target[i]) * k;
  }
  const kick = (t0: number, amp: number) => (t > t0 ? amp * Math.exp(-(t - t0) * 6) : 0);
  const shake = kick(T.snap1, 0.1) + kick(T.allSnap, 0.12) + kick(T.wedgeT, 0.14) + kick(cs.tImpact, 0.2) + kick(T.otisCut + 0.4, 0.05);
  pos[1] += Math.sin(t * 47) * shake;
  pos[0] += Math.cos(t * 39) * shake * 0.6;
  return { pos, target, fov };
};

export const labelAnchor = (T: ElevatorTimeline, key: string, t: number): number[] | null => {
  const cs = carState(T, t);
  switch (key) {
    case 'ropes': return [XC + 0.1, cs.y + CAR_H + 0.9, 0.3];
    case 'cw': return [CW_X, cs.cwY + 1.4, 0.3];
    case 'wedges': return [RAIL_X[0] + 0.15, cs.y - 0.2, 0.4];
    default: return null;
  }
};
