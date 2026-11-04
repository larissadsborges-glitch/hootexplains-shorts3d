import type { Cue } from '../../audio/Sfx';
import type { Timings } from '../../types';
import type { PlaneWindowTimeline } from './timeline';

export const planeWindowSfxCues = (tm: Timings, T: PlaneWindowTimeline): Cue[] => {
  const c: Cue[] = [
    { at: 0, sfx: 'jet', volume: 0.3, dur: T.decomp },
    { at: 0.3, sfx: 'crack', volume: 0.3 },
    { at: 1.6, sfx: 'creak', volume: 0.2 },
    { at: T.rehook + 0.2, sfx: 'creak', volume: 0.3 },
    { at: T.rehook + 0.9, sfx: 'crack', volume: 0.3 },
    { at: T.decomp, sfx: 'thud', volume: 0.35 },
    { at: T.decomp, sfx: 'wind', volume: 0.45, dur: 4.5 },
    { at: T.decomp + 0.7, sfx: 'pop', volume: 0.3 },
    { at: T.clock + 0.5, sfx: 'heartbeat', volume: 0.35 },
    { at: T.clock + 2.0, sfx: 'heartbeat', volume: 0.3 },
    { at: T.clock + 3.5, sfx: 'heartbeat', volume: 0.25 },
    { at: T.descent, sfx: 'wind', volume: 0.18, dur: T.story - T.descent },
    { at: T.story + 1.2, sfx: 'thud', volume: 0.3 },
    { at: T.story + 1.2, sfx: 'wind', volume: 0.2, dur: T.landed - T.story - 1.2 },
    { at: T.landed, sfx: 'clunk', volume: 0.3 },
  ];
  tm.beats.slice(1).forEach((b, i) => {
    if (b.shot !== tm.beats[i].shot) c.push({ at: b.start - 0.12, sfx: 'whoosh', volume: 0.18 });
  });
  return c;
};
