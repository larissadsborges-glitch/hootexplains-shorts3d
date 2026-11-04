import type { Cue } from '../../audio/Sfx';
import type { Timings } from '../../types';
import { COLD, type HouseTimeline } from './timeline';

export const houseSfxCues = (tm: Timings, T: HouseTimeline): Cue[] => {
  // cold open replays the crack (scene time = crack - 0.55 + t)
  const c: Cue[] = [
    { at: 0, sfx: 'creak', volume: 0.7 },
    { at: 0.55, sfx: 'crack', volume: 1 },
    { at: COLD - 0.1, sfx: 'whoosh', volume: 0.7 },
    { at: COLD, sfx: 'pop', volume: 0.5 },
  ];
  tm.beats.slice(1).forEach((b, i) => {
    if (b.shot !== tm.beats[i].shot) c.push({ at: b.start - 0.12, sfx: 'whoosh', volume: 0.45 });
    if (b.label) c.push({ at: b.start + 0.1, sfx: 'pop', volume: 0.5 });
  });
  for (let i = 0; i < 4; i++) c.push({ at: T.outline + i * 0.08 + 0.2, sfx: 'pop', volume: 0.35 });
  for (let i = 0; i < 6; i++) c.push({ at: T.wallsS + ((T.wallsE - T.wallsS) * i) / 6, sfx: 'clunk', volume: 0.55 });
  c.push(
    { at: T.roofLand, sfx: 'thud', volume: 0.8 },
    { at: T.sinkS + 0.2, sfx: 'creak', volume: 0.8 },
    { at: T.crack, sfx: 'crack', volume: 1 },
    { at: T.clear, sfx: 'riser', volume: 0.5 },
    { at: T.rebarE - 0.15, sfx: 'clunk', volume: 0.8 },
    { at: T.pourS, sfx: 'pour', volume: 0.8 },
    { at: T.houseLand, sfx: 'thud', volume: 1 },
    { at: T.sagS + 0.3, sfx: 'creak', volume: 0.8 },
    { at: T.sagS + 0.7, sfx: 'crack', volume: 0.7 },
    { at: T.beamS + 0.1, sfx: 'pour', volume: 0.7 },
    { at: T.level, sfx: 'thud', volume: 0.6 },
    { at: T.sugar + 0.6, sfx: 'drip', volume: 0.8 },
    { at: T.tarS + 0.1, sfx: 'brush', volume: 0.8 },
    { at: T.rain, sfx: 'rain', volume: 0.7, dur: T.rainStop + 0.8 - T.rain },
    { at: T.soggy + 0.3, sfx: 'creak', volume: 0.6 },
    { at: T.apronS + 0.1, sfx: 'pour', volume: 0.7 },
    { at: T.final, sfx: 'whoosh', volume: 0.6 },
  );
  for (let i = 0; i < 6; i++) c.push({ at: T.digS + 0.1 + ((T.digE - T.digS - 0.2) * i) / 6, sfx: 'dig', volume: 0.7 });
  for (let i = 0; i < 4; i++) c.push({ at: T.dampS + 0.4 + i * 0.6, sfx: 'drip', volume: 0.5 });
  T.recap?.words.forEach((w, i) => { if (i !== 2) c.push({ at: w.start, sfx: 'pop', volume: 0.7 }); });
  return c;
};
