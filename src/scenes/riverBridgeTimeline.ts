import {
  beatByEvent, clamp01, easeInOutSine, easeOutCubic, lerp, lerp3, progress, wordTime,
} from '../lib/anim';
import type { Timings } from '../types';
import type { Shot } from '../world/Props';

/** Camera shots this scene understands; the script picks one per beat. */
export const SHOTS: Record<string, Shot> = {
  hook: { from: { pos: [9, 28, 48], target: [0, -1, -10], fov: 52 }, to: { pos: [3.5, 8, 15], target: [0, -0.5, 0], fov: 50 }, ease: easeOutCubic },
  approach: { from: { pos: [-15, 4.6, 4.2], target: [1.5, -0.6, -0.6], fov: 48 }, to: { pos: [-12.5, 3.9, 3.2], target: [2.5, -0.6, -0.4], fov: 48 } },
  side: { from: { pos: [-7.5, 1.9, 9.5], target: [-1.5, 0.2, 0], fov: 50 }, to: { pos: [-6, 1.6, 8], target: [-0.6, 0.1, 0], fov: 50 } },
  sideClose: { from: { pos: [-4.5, 1.3, 7.2], target: [-0.6, -0.1, 0], fov: 50 }, to: { pos: [-3.6, 0.8, 6.2], target: [-0.6, -0.5, 0], fov: 50 } },
  push: { from: { pos: [10.5, 7.5, 14.5], target: [0, -0.2, 0], fov: 55 }, to: { pos: [9, 6, 12], target: [0, -0.2, 0], fov: 55 } },
  alongBeam: { from: { pos: [-17, 3.4, 3.8], target: [2, -0.3, -0.3], fov: 50 }, to: { pos: [-15.5, 3.0, 3.0], target: [3, -0.3, -0.2], fov: 50 } },
  widen: { from: { pos: [8, 12, 22], target: [0, -0.6, 0], fov: 52 }, to: { pos: [13, 21, 33], target: [0, -1, -2], fov: 54 } },
};

export const SPAN = 6.25; // half-length of the bridge at normal river width
export const DECK = 0.25; // deck top height
export const CAR_FALL_TO_WATER = 0.38; // s from the snap until the car hits the water

export type RiverBridgeTimeline = ReturnType<typeof buildTimeline>;

/** Every animation and sound cue is derived from the voiceover timings. */
export const buildTimeline = (timings: Timings) => {
  const build = beatByEvent(timings, 'buildPlanks');
  const drive = beatByEvent(timings, 'carDrives');
  const brk = beatByEvent(timings, 'break');
  const beam = beatByEvent(timings, 'dropBeam');
  const beamDrive = beatByEvent(timings, 'beamDrive');
  const widen = beatByEvent(timings, 'widen');
  const tBreak = wordTime(brk, 'snaps', brk?.start ?? 7);
  const tBeamLand = wordTime(beam, 'beam', (beam?.start ?? 9) + 1);
  const tWidenS = (widen?.start ?? 11) + 0.25;
  const tWidenE = wordTime(widen, 'wide', tWidenS + 1.2) + 0.15;
  return {
    buildS: build?.start ?? 2,
    buildE: build?.end ?? 4,
    drive: drive?.start ?? 5,
    tCrackWord: brk?.start ?? tBreak - 0.5,
    tBreak,
    tBeamLand,
    tBeamDrop: tBeamLand - 0.9,
    car2S: beamDrive?.start ?? tBeamLand + 0.5,
    car2E: (beamDrive?.start ?? tBeamLand + 0.5) + 2.4,
    tWidenS,
    tWidenE,
  };
};

/** How much wider the river is (1 = normal, 1.8 = widened). */
export const widenFactor = (T: RiverBridgeTimeline, t: number) =>
  1 + 0.8 * easeInOutSine(progress(t, T.tWidenS, T.tWidenE));

/** Camera pose at time t: hard cut per beat, a quick "whip-in" after each cut, shake on impacts. */
export const cameraPose = (timings: Timings, T: RiverBridgeTimeline, t: number) => {
  const beats = timings.beats;
  let bi = 0;
  for (let i = 0; i < beats.length; i++) if (t >= beats[i].start) bi = i;
  const winS = bi === 0 ? 0 : beats[bi].start;
  const winE = bi < beats.length - 1 ? beats[bi + 1].start : timings.duration;
  const shot = SHOTS[beats[bi].shot] ?? SHOTS.hook;
  const e = (shot.ease ?? easeInOutSine)(clamp01((t - winS) / (winE - winS)));
  const pos = lerp3(shot.from.pos, shot.to.pos, e);
  const target = lerp3(shot.from.target, shot.to.target, e);
  const fov = lerp(shot.from.fov ?? 45, shot.to.fov ?? shot.from.fov ?? 45, e);
  if (bi > 0) {
    const k = 0.35 * (1 - easeOutCubic(clamp01((t - winS) / 0.28)));
    for (let i = 0; i < 3; i++) pos[i] += (pos[i] - target[i]) * k;
  }
  const shake =
    (t > T.tBreak ? 0.06 * Math.exp(-(t - T.tBreak) * 5) : 0) +
    (t > T.tBeamLand ? 0.14 * Math.exp(-(t - T.tBeamLand) * 6) : 0);
  pos[1] += Math.sin(t * 47) * shake;
  pos[0] += Math.cos(t * 39) * shake * 0.6;
  return { pos, target, fov };
};

/** Sound-effect cues for this scene, from the same timeline as the animation. */
export const sfxCues = (timings: Timings, T: RiverBridgeTimeline) => {
  const cues: { at: number; sfx: string; volume?: number; dur?: number }[] = [
    { at: 0, sfx: 'whoosh', volume: 0.5 },
    { at: 0.05, sfx: 'pop', volume: 0.35 },
  ];
  timings.beats.slice(1).forEach((b) => cues.push({ at: b.start - 0.12, sfx: 'whoosh', volume: 0.3 }));
  for (let i = 0; i < 25; i += 3) {
    const tIn = T.buildS + 0.1 + (T.buildE - T.buildS - 0.35) * (i / 24);
    cues.push({ at: tIn + 0.22, sfx: 'clunk', volume: 0.35 });
  }
  cues.push(
    { at: T.drive, sfx: 'engine', volume: 0.3, dur: T.tBreak - T.drive },
    { at: T.tBreak - 0.75, sfx: 'creak', volume: 0.55 },
    { at: T.tBreak, sfx: 'crack', volume: 0.9 },
    { at: T.tBreak + 0.18, sfx: 'splash', volume: 0.5 },
    { at: T.tBreak + CAR_FALL_TO_WATER, sfx: 'splash', volume: 0.8 },
    { at: T.tBeamDrop + 0.2, sfx: 'whoosh', volume: 0.25 },
    { at: T.tBeamLand, sfx: 'thud', volume: 1 },
    { at: T.tBeamLand + 0.02, sfx: 'pop', volume: 0.3 },
    { at: T.car2S, sfx: 'engine', volume: 0.25, dur: T.car2E - T.car2S },
    { at: T.tWidenS, sfx: 'creak', volume: 0.6 },
    { at: T.tWidenS + 0.6, sfx: 'creak', volume: 0.5 },
  );
  const last = timings.beats[timings.beats.length - 1];
  cues.push({ at: last.end - 0.85, sfx: 'riser', volume: 0.3 }, { at: last.end + 0.05, sfx: 'pop', volume: 0.4 });
  return cues;
};
