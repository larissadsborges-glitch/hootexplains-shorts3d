import type { Cue } from '../../audio/Sfx';
import type { Timings } from '../../types';
import { RING_W, TBM_LEN, X_END, X_START, type TunnelTimeline } from './timeline';

export const tunnelSfxCues = (tm: Timings, T: TunnelTimeline): Cue[] => {
  const c: Cue[] = [
    // hook: the finished tunnel, a train rushing under the river
    { at: 0, sfx: 'engine', volume: 0.8, dur: T.flood },
    { at: 0, sfx: 'whoosh', volume: 0.6 },
    { at: T.flood - 0.1, sfx: 'whoosh', volume: 0.6 },
    { at: T.flood + 0.1, sfx: 'creak', volume: 0.7 },
    { at: T.flood + 0.15, sfx: 'crack', volume: 1 },
    { at: T.flood + 0.3, sfx: 'gush', volume: 1 },
    { at: T.flood + 0.9, sfx: 'splash', volume: 0.7 },
    { at: T.reset, sfx: 'riser', volume: 0.4 },
    { at: T.shaftsS + 0.2, sfx: 'dig', volume: 0.7 },
    { at: T.shaftsS + 0.8, sfx: 'dig', volume: 0.7 },
    { at: T.shaftsS + 1.4, sfx: 'pour', volume: 0.5 },
    { at: T.lower + 1.1, sfx: 'thud', volume: 0.9 },
    { at: T.lower + 2.0, sfx: 'clunk', volume: 0.8 },
    { at: T.lower + 2.8, sfx: 'clunk', volume: 0.7 },
    { at: T.boreS, sfx: 'drill', volume: 0.5, dur: T.boreE - T.boreS },
    { at: T.leak, sfx: 'gush', volume: 0.45 },
    { at: T.counter + 0.1, sfx: 'pour', volume: 0.6 },
    { at: T.gap + 0.6, sfx: 'creak', volume: 0.8 },
    { at: T.gap + 1.2, sfx: 'creak', volume: 0.6 },
    { at: T.grout + 0.2, sfx: 'pour', volume: 0.7 },
    { at: T.breakthrough + 0.4, sfx: 'crack', volume: 0.9 },
    { at: T.breakthrough + 0.45, sfx: 'thud', volume: 0.8 },
    { at: T.train - 0.2, sfx: 'engine', volume: 0.6, dur: 3.8 },
    { at: T.final, sfx: 'whoosh', volume: 0.6 },
  ];
  for (let i = 0; i < 3; i++) c.push({ at: T.surveyS + 0.3 + i * 0.35, sfx: 'drill', volume: 0.25, dur: 1.2 });
  tm.beats.slice(1).forEach((b, i) => {
    if (b.shot !== tm.beats[i].shot) c.push({ at: b.start - 0.12, sfx: 'whoosh', volume: 0.4 });
    if (b.label) c.push({ at: b.start + 0.1, sfx: 'pop', volume: 0.5 });
  });
  // a clunk each time a segment is placed in view (segments + seals beats)
  const speed = (X_END - X_START) / (T.boreE - T.boreS);
  for (let k = 0; k < 40; k++) {
    const tp = T.boreS + (k * RING_W + RING_W + TBM_LEN + 0.3 - 1.6) / speed;
    if (tp > T.segments - 0.2 && tp < T.gap) for (let s = 0; s < 3; s++) c.push({ at: tp + s * 0.15, sfx: 'clunk', volume: 0.45 });
  }
  ['rails', 'lights', 'fans', 'pumps'].forEach((w) => c.push({ at: T.wordTime('fitout', w, T.fitS), sfx: 'pop', volume: 0.6 }));
  return c;
};
