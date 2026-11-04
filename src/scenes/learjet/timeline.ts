import { beatByEvent, clamp01, easeInOutSine, easeOutCubic, lerp, lerp3, progress, wordTime } from '../../lib/anim';
import type { Beat, Timings } from '../../types';
import type { CameraPose, Shot } from '../../world/Props';

/**
 * The video is told in several "places", far apart in one world so fog hides each from the others.
 * Units: sky scenes ~1 unit = 1 m-ish (jet ~5 long); map 1 unit = 1 degree; Everest 1 unit = 1,000 ft.
 */
export const DIVE = [-400, 0, 0]; // jet held still, clouds stream past (hook, overspeed, frozen)
export const CRUISE = [0, 6, 0]; // jet level above the cloud deck, flying +x
export const MAP = [1000, 0, 0];
export const SECTION = [2000, 0, 0];
export const COCKPIT = [3000, 0, 0];
export const EVEREST = [4000, 0, 0];
export const TOWN = [5000, 0, 0];
export const CRASH = [TOWN[0] + 0.6, 0, TOWN[2] - 12]; // smoke source on the road (never shown up close)
export const CRUISE_SPEED = 7;

// map projection: x = lon, z = -lat (1 unit per degree), relative to MAP
export const geo = (lon: number, lat: number, y = 0): [number, number, number] => [MAP[0] + (lon + 87), MAP[1] + y, MAP[2] - (lat - 27)];
export const AUSTIN = [-97.74, 30.27];
export const ELEUTHERA = [-76.68, 25.47];
export const GREENACRES = [-80.12, 26.63];

const st = (b: Beat | undefined, d: number) => b?.start ?? d;
const en = (tm: Timings, b: Beat | undefined, d: number) => (b ? tm.beats[b.index + 1]?.start ?? tm.duration : d);

export type LearjetTimeline = ReturnType<typeof buildLearjetTimeline>;

export const buildLearjetTimeline = (tm: Timings) => {
  const b = (e: string) => beatByEvent(tm, e);
  const s = (e: string, d: number) => st(b(e), d);
  const e = (ev: string, d: number) => en(tm, b(ev), d);
  return {
    onboard: s('onboard', 5.7), route: s('route', 8.3), routeE: e('route', 15),
    cruise: s('cruise', 15.4), storms: s('storms', 19.7), ice: s('ice', 22), section: s('section', 27.2),
    sectionShape: wordTime(b('section'), 'shape', 30),
    climb: s('climb', 32.4), radio: s('radio', 35.1), mayday: s('mayday', 37), overspeed: s('overspeed', 39.6),
    overspeedWord: wordTime(b('overspeed'), 'overspeed', 40.3),
    stress: s('stress', 42.5), everest: s('everest', 49), skydiver: s('skydiver', 54.7),
    impact: s('impact', 57.8), crater: s('crater', 63.9), evac: s('evac', 68.7),
    question: s('question', 73.9), checklist: s('checklist', 77.9), memorial: s('memorial', 82.3), final: s('final', 86.2),
    end: tm.duration,
    wordTime: (ev: string, w: string, d: number) => wordTime(b(ev), w, d),
  };
};

/** Hook replay: a minute of the fall, sped up into the first ~8 s. */
export const hookClock = (T: LearjetTimeline, t: number) => 60 * progress(t, 0.15, T.route - 0.35);
const fallProfile = (u: number) => 0.45 * u + 0.55 * u * u; // accelerating
export const hookAltitude = (T: LearjetTimeline, t: number) => 35250 - 26500 * fallProfile(hookClock(T, t) / 60);

/** Real-time vertical speed during the cockpit / overspeed beats (ft/min, negative = down). */
export const vsAt = (T: LearjetTimeline, t: number) => {
  if (t < T.mayday) return 0;
  const a = -10000 * easeOutCubic(progress(t, T.mayday + 0.2, T.mayday + 1.4));
  const b = -10000 * easeOutCubic(progress(t, T.overspeedWord, T.overspeedWord + 1.2));
  const c = -5000 * progress(t, T.stress, T.everest);
  return a + b + c;
};
/** Real-time altitude from the mayday onward (integrates the vertical speed). */
export const realAltitude = (T: LearjetTimeline, t: number) => {
  let alt = 35250;
  const dt = 1 / 30;
  for (let x = T.mayday; x < Math.min(t, T.everest); x += dt) alt += (vsAt(T, x) / 60) * dt;
  return alt;
};

export type Place = 'dive' | 'cruise' | 'map' | 'section' | 'cockpit' | 'stress' | 'everest' | 'town' | 'frozen' | 'dusk';
export const placeAt = (T: LearjetTimeline, t: number): Place => {
  if (t < T.route) return 'dive';
  if (t < T.cruise) return 'map';
  if (t < T.section) return 'cruise';
  if (t < T.climb) return 'section';
  if (t < T.radio) return 'cruise';
  if (t < T.stress) return 'cockpit';
  if (t < T.everest) return 'stress';
  if (t < T.impact) return 'everest';
  if (t < T.question) return 'town';
  if (t < T.memorial) return 'frozen';
  return 'dusk';
};

/** Where the cruising jet is, and how it is pitched. */
export const cruiseJet = (T: LearjetTimeline, t: number) => {
  const x = CRUISE[0] + CRUISE_SPEED * (t - T.cruise);
  const climbK = easeInOutSine(progress(t, T.climb + 0.2, T.climb + 1.6));
  const shakeK = t > T.ice ? 1 : 0;
  const y = CRUISE[1] + 0.25 * climbK + shakeK * 0.04 * Math.sin(t * 23) + 0.15 * Math.sin(t * 0.9);
  return { pos: [x, y, CRUISE[2]] as [number, number, number], pitch: 0.1 * climbK, roll: 0.03 * Math.sin(t * 0.7) + shakeK * 0.02 * Math.sin(t * 17) };
};

/** Ice thickness on the wing's leading edge (0..1). */
export const iceAt = (T: LearjetTimeline, t: number) => (t < T.ice + 0.6 ? 0 : 0.25 + 0.75 * easeOutCubic(progress(t, T.ice + 0.6, T.section - 0.4)));

const S = (pos: number[], target: number[], fov = 50) => ({ pos, target, fov });
const add = (a: number[], b: number[]) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

/** Shots that follow the cruising jet. */
const cruiseShot = (name: string, J: number[]): Shot | null => {
  switch (name) {
    case 'cruise': return { from: S(add(J, [6, 1.6, 9]), add(J, [0.5, 0, 0]), 45), to: S(add(J, [3, 1.2, 10.5]), add(J, [0.5, 0, 0]), 45) };
    case 'storm': return { from: S(add(J, [-5, 1.2, 6.5]), add(J, [4, -0.4, -6]), 52), to: S(add(J, [-5.6, 0.9, 6]), add(J, [4, -0.6, -6.5]), 52) };
    case 'wingIce': return { from: S(add(J, [2.8, 2.0, 4.4]), add(J, [-0.2, -0.25, 1.3]), 46), to: S(add(J, [2.3, 1.7, 3.9]), add(J, [-0.2, -0.25, 1.3]), 46) };
    case 'climb': return { from: S(add(J, [0.5, 0.6, 9]), add(J, [0, 0.2, 0]), 45), to: S(add(J, [-1, 0.8, 8.5]), add(J, [0, 0.3, 0]), 45) };
    default: return null;
  }
};

const SHOTS: Record<string, Shot> = {
  // hook: right above the diving jet, looking down past it at the ground
  dive: { from: S(add(DIVE, [6.5, 13, 0.8]), add(DIVE, [0, -1.5, 0]), 46), to: S(add(DIVE, [5.2, 11, 0.6]), add(DIVE, [0, -1.5, 0]), 46) },
  map: { from: S([MAP[0] - 10.2, 13, MAP[2] + 8], [MAP[0] - 10.4, 0, MAP[2] - 2.6], 48), to: S([MAP[0] - 0.3, 38, MAP[2] + 24], [MAP[0] - 0.3, 0, MAP[2] - 0.6], 50) },
  section: { from: S(add(SECTION, [0.6, 0.3, 13]), add(SECTION, [0.2, 0.2, 0]), 45), to: S(add(SECTION, [-0.4, 0.2, 12]), add(SECTION, [0, 0.2, 0]), 45) },
  cockpit: { from: S(add(COCKPIT, [0, 0.35, 3.6]), add(COCKPIT, [0, 0.25, 0]), 50), to: S(add(COCKPIT, [0, 0.3, 3.3]), add(COCKPIT, [0, 0.2, 0]), 50) },
  cockpitVsi: { from: S(add(COCKPIT, [0.05, 0.05, 1.6]), add(COCKPIT, [0, -0.05, 0]), 50), to: S(add(COCKPIT, [0, 0.0, 1.4]), add(COCKPIT, [0, -0.05, 0]), 50) },
  cockpitSpeed: { from: S(add(COCKPIT, [-0.5, 0.05, 1.5]), add(COCKPIT, [-0.62, 0.0, 0]), 50), to: S(add(COCKPIT, [-0.55, 0.0, 1.3]), add(COCKPIT, [-0.62, 0.0, 0]), 50) },
  stress: { from: S(add(DIVE, [1.5, 2.5, 9.5]), add(DIVE, [0, -0.5, 0]), 48), to: S(add(DIVE, [-1.5, 1.5, 8]), add(DIVE, [0, -0.5, 0]), 48) },
  everest: { from: S(add(EVEREST, [3, 19, 47]), add(EVEREST, [1, 17.5, 0]), 50), to: S(add(EVEREST, [5, 18, 44]), add(EVEREST, [2, 17.5, 0]), 50) },
  skydiver: { from: S(add(EVEREST, [8, 23, 30]), add(EVEREST, [5, 21, 0]), 50), to: S(add(EVEREST, [9, 19, 32]), add(EVEREST, [5, 18, 0]), 50) },
  town: { from: S(add(TOWN, [-30, 10, 40]), add(TOWN, [2, 7, -12]), 46), to: S(add(TOWN, [-27, 9, 36]), add(TOWN, [2, 7, -12]), 46) },
  crater: { from: S(add(CRASH, [13, 12, 30]), add(CRASH, [-0.5, 2.5, 0]), 46), to: S(add(CRASH, [10, 9, 24]), add(CRASH, [-0.5, 1.2, 0]), 46) },
  evac: { from: S(add(TOWN, [29, 7, 25]), add(TOWN, [25, 0.8, 6]), 40), to: S(add(TOWN, [28.5, 6.2, 23]), add(TOWN, [25, 0.8, 5]), 40) },
  frozen: { from: S(add(DIVE, [7, 2, 6]), add(DIVE, [0, -0.3, 0]), 46), to: S(add(DIVE, [-6, 3, 8]), add(DIVE, [0, -0.3, 0]), 46) },
  dusk: { from: S(add(TOWN, [-34, 2.5, 34]), add(TOWN, [-60, 6, 60]), 50), to: S(add(TOWN, [-35, 3.5, 35]), add(TOWN, [-60, 8, 60]), 50), ease: easeOutCubic },
};

export const cameraPose = (tm: Timings, T: LearjetTimeline, t: number): CameraPose => {
  const beats = tm.beats;
  let bi = 0;
  for (let i = 0; i < beats.length; i++) if (t >= beats[i].start) bi = i;
  // a few beats share a place but need their own camera
  const ev = beats[bi].event;
  let name = beats[bi].shot;
  if (ev === 'mayday') name = 'cockpitVsi';
  if (ev === 'overspeed') name = 'cockpitSpeed';
  if (ev === 'skydiver') name = 'skydiver';
  const sameShot = (i: number) => {
    const e2 = beats[i].event;
    const n2 = e2 === 'mayday' ? 'cockpitVsi' : e2 === 'overspeed' ? 'cockpitSpeed' : e2 === 'skydiver' ? 'skydiver' : beats[i].shot;
    return n2 === name;
  };
  let a = bi;
  while (a > 0 && sameShot(a - 1)) a--;
  let z = bi;
  while (z < beats.length - 1 && sameShot(z + 1)) z++;
  const runS = a === 0 ? 0 : beats[a].start;
  const runE = z < beats.length - 1 ? beats[z + 1].start : tm.duration;
  const J = cruiseJet(T, t).pos;
  const shot = cruiseShot(name, J) ?? SHOTS[name] ?? SHOTS.cruise;
  const e = (shot.ease ?? easeInOutSine)(clamp01((t - runS) / (runE - runS)));
  const pos = lerp3(shot.from.pos, shot.to.pos, e);
  const target = lerp3(shot.from.target, shot.to.target, e);
  const fov = lerp(shot.from.fov ?? 50, shot.to.fov ?? shot.from.fov ?? 50, e);
  // quick push-in after each cut (not on the hook)
  if (a > 0 && t - runS < 0.3) {
    const k = 0.25 * (1 - easeOutCubic(clamp01((t - runS) / 0.28)));
    for (let i = 0; i < 3; i++) pos[i] += (pos[i] - target[i]) * k;
  }
  // shake: buffeting in the hook and the dive, a jolt when the radio changes
  const kick = (t0: number, amp: number) => (t > t0 ? amp * Math.exp(-(t - t0) * 5) : 0);
  let shake = kick(T.radio + 0.9, 0.04) + kick(T.overspeedWord, 0.05);
  if (t < T.route) shake += 0.05 + 0.04 * progress(t, 0, T.route);
  if (t >= T.mayday && t < T.stress) shake += 0.008 + 0.012 * progress(t, T.mayday, T.stress);
  if (t >= T.stress && t < T.everest) shake += 0.06;
  if (ev === 'ice') shake += 0.012;
  pos[1] += Math.sin(t * 47) * shake;
  pos[0] += Math.cos(t * 39) * shake * 0.6;
  return { pos, target, fov };
};

/** Label anchors for moving things. */
export const labelAnchor = (T: LearjetTimeline, key: string, t: number): number[] | null => {
  const J = cruiseJet(T, t).pos;
  switch (key) {
    case 'wingEdge': return [J[0] + 0.35, J[1] + 0.1, J[2] + 1.6];
    default: return null;
  }
};
