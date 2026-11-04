import type { Cue } from '../../audio/Sfx';
import type { Timings } from '../../types';
import type { SinkTimeline } from './timeline';

export const sinkSfxCues = (tm: Timings, T: SinkTimeline): Cue[] => {
  const c: Cue[] = [
    { at: 0.2, sfx: 'drip', volume: 0.4 },
    { at: T.straight + 0.3, sfx: 'pour', volume: 0.35 },
    { at: T.sewerGas + 0.5, sfx: 'gush', volume: 0.15 },
    { at: T.stink + 0.6, sfx: 'pop', volume: 0.25 },
    { at: T.bend + 0.2, sfx: 'creak', volume: 0.3 },
    { at: T.seal + 0.1, sfx: 'pour', volume: 0.35 },
    { at: T.plug + 0.4, sfx: 'clunk', volume: 0.3 },
    { at: T.suck - 0.2, sfx: 'gush', volume: 0.3 },
    { at: T.vent + 0.2, sfx: 'riser', volume: 0.25 },
    { at: T.air, sfx: 'pour', volume: 0.3 },
    { at: T.strapBan - 0.2, sfx: 'gush', volume: 0.25 },
    { at: T.evap + 1.6, sfx: 'drip', volume: 0.3 },
    { at: T.tap, sfx: 'pour', volume: 0.35 },
    { at: T.ring + 0.3, sfx: 'pop', volume: 0.2 },
    { at: T.ring + 1.2, sfx: 'clunk', volume: 0.25 },
    { at: T.unscrew + 0.2, sfx: 'creak', volume: 0.25 },
  ];
  tm.beats.slice(1).forEach((b, i) => {
    if (b.shot !== tm.beats[i].shot) c.push({ at: b.start - 0.12, sfx: 'whoosh', volume: 0.18 });
  });
  return c;
};
