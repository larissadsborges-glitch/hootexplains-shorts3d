import type { Cue } from '../../audio/Sfx';
import type { Timings } from '../../types';
import { CAR_FALL_TO_WATER, COLD, type FullTimeline } from './timeline';

/** Sound-effect cues, from the same timeline as the animation. Volumes are relative (MIX scales them). */
export const fullSfxCues = (tm: Timings, T: FullTimeline): Cue[] => {
  // cold open replays the snap (scene time = tBreak - 0.3 + t), then cuts to the hook
  const c: Cue[] = [
    { at: 0, sfx: 'creak', volume: 0.6 },
    { at: 0.3, sfx: 'crack', volume: 1 },
    { at: 0.48, sfx: 'splash', volume: 0.7 },
    { at: 0.3 + CAR_FALL_TO_WATER, sfx: 'splash', volume: 1 },
    { at: COLD - 0.1, sfx: 'whoosh', volume: 0.7 },
    { at: COLD, sfx: 'pop', volume: 0.5 },
  ];
  // a whoosh on every camera cut
  tm.beats.slice(1).forEach((b, i) => {
    if (b.shot !== tm.beats[i].shot) c.push({ at: b.start - 0.12, sfx: 'whoosh', volume: 0.45 });
    if (b.label) c.push({ at: b.start + 0.1, sfx: 'pop', volume: 0.5 });
  });
  for (let i = 0; i < 25; i += 3) c.push({ at: T.buildS + 0.1 + (T.buildE - T.buildS - 0.35) * (i / 24) + 0.22, sfx: 'clunk', volume: 0.6 });
  c.push(
    // act 1
    { at: T.drive, sfx: 'engine', volume: 0.5, dur: T.tBreak - T.drive },
    { at: T.tBreak - 0.75, sfx: 'creak', volume: 0.8 },
    { at: T.tBreak, sfx: 'crack', volume: 1 },
    { at: T.tBreak + 0.18, sfx: 'splash', volume: 0.7 },
    { at: T.tBreak + CAR_FALL_TO_WATER, sfx: 'splash', volume: 1 },
    // act 2
    { at: T.tBeamLand, sfx: 'thud', volume: 1 },
    { at: T.car2S, sfx: 'engine', volume: 0.4, dur: T.car2E - T.car2S },
    { at: T.tWidenS, sfx: 'creak', volume: 0.8 },
    { at: T.tSagS, sfx: 'creak', volume: 0.9 },
    { at: T.tSnap2, sfx: 'crack', volume: 1 },
    { at: T.tSnap2 + 0.55, sfx: 'splash', volume: 1 },
    // act 3
    { at: T.tBeam2Land, sfx: 'thud', volume: 0.8 },
    { at: T.tPierLand, sfx: 'splash', volume: 0.9 },
    { at: T.tPierLand + 0.05, sfx: 'thud', volume: 0.6 },
    { at: T.car3S, sfx: 'engine', volume: 0.4, dur: T.car3E - T.car3S },
    { at: T.tCreak3, sfx: 'creak', volume: 0.8 },
    { at: T.tCutS - 0.6, sfx: 'riser', volume: 0.6 },
    { at: T.tSinkS, sfx: 'creak', volume: 0.7 },
    { at: T.tSinkS + 0.7, sfx: 'creak', volume: 0.6 },
    { at: T.tDropS + 0.3, sfx: 'crack', volume: 0.8 },
    { at: T.tDropS + 0.35, sfx: 'thud', volume: 0.8 },
    { at: T.tDropE - 0.45, sfx: 'thud', volume: 0.9 },
    { at: T.tDropE - 0.4, sfx: 'creak', volume: 0.6 },
    // act 4
    { at: T.tResetS, sfx: 'riser', volume: 0.5 },
    { at: T.tRock, sfx: 'crack', volume: 0.6 },
    { at: T.tCapS + 0.45, sfx: 'thud', volume: 0.8 },
    { at: T.tCapS + 0.9, sfx: 'thud', volume: 0.9 },
    // act 5
    { at: T.tSlabCrack, sfx: 'crack', volume: 1 },
    { at: T.tSlabCrack + 0.05, sfx: 'thud', volume: 0.6 },
    { at: T.tJoints + 0.15, sfx: 'clunk', volume: 0.8 },
    { at: T.tSwerveS, sfx: 'engine', volume: 0.5, dur: T.tHit + 1.2 - T.tSwerveS },
    { at: T.tHit, sfx: 'crack', volume: 0.7 },
    { at: T.tHit, sfx: 'thud', volume: 0.8 },
  );
  // pile hammer hits: 7 per pile, staggered like the animation
  for (let i = 0; i < 3; i++) {
    const t0 = T.tPilesS + i * 0.25;
    for (let k = 0; k < 7; k++) c.push({ at: t0 + ((T.tRock - t0) * k) / 7, sfx: 'clunk', volume: 0.75 });
  }
  // slabs landing
  for (let i = 0; i < 4; i++) c.push({ at: T.tSlabsS + 0.15 + i * ((T.tSlabsE - T.tSlabsS - 0.3) / 4) + 0.33, sfx: 'thud', volume: 0.5 });
  // guard rails popping up
  c.push({ at: T.tRailsS + 0.1, sfx: 'pop', volume: 0.7 }, { at: T.tRailsS + 0.25, sfx: 'clunk', volume: 0.7 });
  // recap ticks
  T.recap?.words.forEach((w) => c.push({ at: w.start, sfx: 'pop', volume: 0.7 }));
  c.push({ at: T.tFinal, sfx: 'whoosh', volume: 0.6 }, { at: T.tFinal, sfx: 'engine', volume: 0.3, dur: tm.duration - T.tFinal });
  return c;
};
