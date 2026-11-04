import {
  beatByEvent, clamp01, easeInOutSine, easeOutCubic, lerp, lerp3, progress, wordTime,
} from '../../lib/anim';
import type { Beat, Timings } from '../../types';
import type { CameraPose, Shot } from '../../world/Props';

export const SPAN = 6.25; // bridge half-length at the original river width
export const WIDE = 1.8; // river width factor after act 2
export const DECK = 0.25; // road height at the banks / beam top (acts 1-2)
export const DECK2 = 1.6; // raised deck from act 3 on, so the pier is visible above water
export const BEAM_H = 0.6;
export const CAR_FALL_TO_WATER = 0.38;
export const BED_Y = -2.0;
export const ROCK_Y = -5.5;
export const SLAB_H = 0.25;
export const N_SLABS = 4;
export const SLAB_GAP = 0.14;
/** Cold open: the first second shows the crash (scene time remapped), then the hook. */
export const COLD = 1.0;

/** Half-length of the long beam once the river is wide. */
export const HALF_LEN_WIDE = SPAN * WIDE + 0.7;

const S = (pos: number[], target: number[], fov = 50) => ({ pos, target, fov });

/** Camera shots; the script picks one per beat (from → to within the beat). */
export const SHOTS: Record<string, Shot> = {
  hook: { from: S([9, 28, 48], [0, -1, -10], 52), to: S([3.5, 8, 15], [0, -0.5, 0]), ease: easeOutCubic },
  approach: { from: S([-15, 4.6, 4.2], [1.5, -0.6, -0.6], 48), to: S([-12.5, 3.9, 3.2], [2.5, -0.6, -0.4], 48) },
  side: { from: S([-7.5, 1.9, 9.5], [-1.5, 0.2, 0]), to: S([-6, 1.6, 8], [-0.6, 0.1, 0]) },
  sideClose: { from: S([-4.5, 1.3, 7.2], [-0.6, -0.1, 0]), to: S([-3.6, 0.8, 6.2], [-0.6, -0.5, 0]) },
  push: { from: S([10.5, 7.5, 14.5], [0, -0.2, 0], 55), to: S([9, 6, 12], [0, -0.2, 0], 55) },
  alongBeam: { from: S([-17, 3.4, 3.8], [2, -0.3, -0.3]), to: S([-15.5, 3.0, 3.0], [3, -0.3, -0.2]) },
  widen: { from: S([8, 12, 22], [0, -0.6, 0], 52), to: S([13, 21, 33], [0, -1, -2], 54) },
  sagClose: { from: S([8, 4.2, 12.5], [0, -0.4, 0], 52), to: S([6, 3.0, 9.5], [0, -0.7, 0], 52) },
  pierDrop: { from: S([9, 4.5, 12], [0, 0.4, 0], 50), to: S([7, 3.5, 9.5], [0, 0.4, 0], 50) },
  pierLow: { from: S([-10, 0.9, 10], [0, 0.6, 0], 50), to: S([-8, 0.6, 8.5], [0, 0.6, 0], 50) },
  cutaway: { from: S([0, -1.6, 16], [0, -2.6, 0], 52), to: S([0, -1.8, 15], [0, -2.7, 0], 52) },
  cutawayClose: { from: S([1.6, -2.0, 10.5], [0, -2.8, 0], 50), to: S([1.0, -2.6, 9.2], [0, -3.4, 0], 50) },
  cutawayDeep: { from: S([0.8, -4.2, 10], [0, -5.2, 0], 50), to: S([0.4, -4.8, 9], [0, -5.8, 0], 50) },
  cutawayCap: { from: S([1.0, -1.0, 9], [0, -1.3, 0], 50), to: S([0.6, -1.2, 8], [0, -1.4, 0], 50) },
  deckTop: { from: S([-17, 13.5, 2.5], [3, 0.3, 0], 50), to: S([-15, 12, 2.0], [3.5, 0.3, 0], 50) },
  deckClose: { from: S([-7.5, 5.8, 3.4], [1.5, 1.1, 0], 50), to: S([-6.5, 4.9, 2.8], [2, 1.1, 0], 50) },
  jointClose: { from: S([-3.5, 4.4, 2.2], [0, 1.7, 0], 48), to: S([-2.6, 3.7, 1.6], [0, 1.7, 0], 48) },
  roadLow: { from: S([-18, 2.6, 0.7], [4, 1.6, 0], 52), to: S([-15, 2.6, 0.6], [5, 1.6, 0], 52) },
  railLow: { from: S([-9.5, 2.8, 3.6], [2, 1.9, -0.4], 50), to: S([-8, 2.6, 3.0], [3, 1.9, -0.4], 50) },
  recap: { from: S([13, 7, 15], [0, 0, 0], 52), to: S([-11, 7, 16], [0, 0, 0], 52) },
  finalAerial: { from: S([6, 4, 12], [0, 0.3, 0], 52), to: S([16, 22, 34], [0, -1, -6], 54), ease: easeOutCubic },
};

const ev = (tm: Timings, e: string) => beatByEvent(tm, e);
const st = (b: Beat | undefined, d: number) => b?.start ?? d;
/** Start of the beat after b (its "window" end, including any hold). */
const nextStart = (tm: Timings, b: Beat | undefined, d: number) =>
  b ? (tm.beats[b.index + 1]?.start ?? tm.duration) : d;

export type FullTimeline = ReturnType<typeof buildFullTimeline>;

/** Every animation and sound cue is derived from the voiceover timings. */
export const buildFullTimeline = (tm: Timings) => {
  const b = (e: string) => ev(tm, e);
  const tBreak = wordTime(b('break'), 'snaps', 7);
  const tBeamLand = wordTime(b('dropBeam'), 'beam', 9);
  const tWidenS = st(b('widen'), 11) + 0.25;
  const tWidenE = wordTime(b('widen'), 'wide', tWidenS + 1.2) + 0.15;
  const mud = tm.beats.find((x) => x.label === 'MUD');
  return {
    // act 1
    buildS: st(b('buildPlanks'), 2), buildE: b('buildPlanks')?.end ?? 4,
    drive: st(b('carDrives'), 5), tBreak,
    // act 2
    tBeamDrop: Math.max(st(b('dropBeam'), 0) + 0.05, tBeamLand - 1.2), tBeamLand,
    car2S: st(b('beamDrive'), 10), car2E: st(b('beamDrive'), 10) + 2.4,
    tWidenS, tWidenE,
    tSagS: st(b('beamSnap'), 14), tSnap2: wordTime(b('beamSnap'), 'breaks', 15),
    // act 3
    tBeam2Drop: st(b('dropPier'), 16), tBeam2Land: st(b('dropPier'), 16) + 0.55,
    tPierLand: wordTime(b('dropPier'), 'pier', 17),
    car3S: st(b('pierHolds'), 18), car3E: st(b('pierHolds'), 18) + 2.6,
    tCreak3: wordTime(b('pierHolds'), 'now', 19),
    tCutS: st(b('cutawayIn'), 20),
    tMud: mud ? wordTime(mud, 'mud', mud.start) : 21,
    tSinkS: st(b('pierSinks'), 22), tSinkE: nextStart(tm, b('pierSinks'), 23),
    tDropS: st(b('bridgeDrops'), 23), tDropE: nextStart(tm, b('bridgeDrops'), 25),
    // act 4
    tResetS: st(b('resetPier'), 25),
    tPilesS: st(b('drivePiles'), 27), tPilesE: nextStart(tm, b('drivePiles'), 30),
    tRock: wordTime(b('pilesHitRock'), 'rock', 31),
    tCapS: st(b('pierOnPiles'), 32),
    tCutE: st(b('deckPieces'), 34),
    // act 5
    tSlabsS: st(b('deckPieces'), 34), tSlabsE: b('deckPieces')?.end ?? 36,
    tHeat: st(b('heat'), 37),
    tGrow: wordTime(b('expandShrink'), 'expands', 38), tShrink: wordTime(b('expandShrink'), 'shrinks', 39),
    tOneSlab: st(b('slabCracks'), 40), tSlabCrack: wordTime(b('slabCracks'), 'apart', 41),
    tJoints: st(b('joints'), 42), tJointWord: wordTime(b('joints'), 'expansion', 43),
    // act 6
    tAsphaltS: st(b('asphalt'), 44), tAsphaltE: nextStart(tm, b('asphalt'), 45.5),
    tSwerveS: st(b('swerve'), 46),
    tRailsS: wordTime(b('rails'), 'guard', 47) - 0.15, tRailsE: wordTime(b('rails'), 'guard', 47) + 0.35,
    tHit: wordTime(b('rails'), 'guard', 47) + 0.45,
    // act 7
    recap: b('recap'),
    tFinal: st(b('traffic'), 50),
  };
};

/** River width factor: 1 at the start, widening to WIDE in act 2. */
export const widenFactor = (T: FullTimeline, t: number) =>
  1 + (WIDE - 1) * easeInOutSine(progress(t, T.tWidenS, T.tWidenE));

/** True while the underwater cross-section view is on. */
export const isCutaway = (T: FullTimeline, t: number) => t >= T.tCutS && t < T.tCutE;

/** Camera pose at t: hard cut per beat, whip-in after each cut, shake on impacts. */
/** Scene time: during the cold open, replay the crash; afterwards, real time. */
export const sceneTime = (T: FullTimeline, t: number) => (t < COLD ? T.tBreak - 0.3 + t : t);

export const cameraPose = (tm: Timings, T: FullTimeline, tReal: number): CameraPose => {
  const t = sceneTime(T, tReal);
  const beats = tm.beats;
  let bi = 0;
  for (let i = 0; i < beats.length; i++) if (t >= beats[i].start) bi = i;
  const winS = bi === 0 ? COLD : beats[bi].start;
  const winE = bi < beats.length - 1 ? beats[bi + 1].start : tm.duration;
  let shot = SHOTS[beats[bi].shot] ?? SHOTS.hook;
  let p = clamp01((t - winS) / (winE - winS));

  // recap: one quick shot per word
  if (beats[bi].event === 'recap') {
    const ws = beats[bi].words;
    let wi = 0;
    for (let i = 0; i < ws.length; i++) if (t >= ws[i].start) wi = i;
    const RECAP = ['pierDrop', 'pierLow', 'widen', 'push', 'railLow'];
    shot = SHOTS[RECAP[wi % RECAP.length]];
    const a = wi === 0 ? winS : ws[wi].start;
    const z = wi < ws.length - 1 ? ws[wi + 1].start : winE;
    p = clamp01((t - a) / (z - a));
  }

  const e = (shot.ease ?? easeInOutSine)(p);
  const pos = lerp3(shot.from.pos, shot.to.pos, e);
  const target = lerp3(shot.from.target, shot.to.target, e);
  const fov = lerp(shot.from.fov ?? 45, shot.to.fov ?? shot.from.fov ?? 45, e);
  if (bi > 0 && beats[bi].shot !== beats[bi - 1].shot) {
    const k = 0.3 * (1 - easeOutCubic(clamp01((t - winS) / 0.28)));
    for (let i = 0; i < 3; i++) pos[i] += (pos[i] - target[i]) * k;
  }
  const kick = (t0: number, amp: number) => (t > t0 ? amp * Math.exp(-(t - t0) * 6) : 0);
  const shake = kick(T.tBreak, 0.06) + kick(T.tBeamLand, 0.14) + kick(T.tSnap2, 0.08) + kick(T.tPierLand, 0.1)
    + kick(T.tDropS + 0.3, 0.08) + kick(T.tRock, 0.08) + kick(T.tSlabCrack, 0.07) + kick(T.tHit, 0.08);
  pos[1] += Math.sin(t * 47) * shake;
  pos[0] += Math.cos(t * 39) * shake * 0.6;
  return { pos, target, fov };
};
