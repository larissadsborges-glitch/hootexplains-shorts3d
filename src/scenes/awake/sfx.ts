import type { Cue } from '../../audio/Sfx';
import type { Timings } from '../../types';
import type { AwakeTimeline } from './timeline';

export const awakeSfxCues = (tm: Timings, T: AwakeTimeline): Cue[] => {
  const s = T.s;
  const c: Cue[] = [
    { at: s('wake') - 0.1, sfx: 'riser', volume: 0.2 },
    { at: s('wake') + 0.1, sfx: 'pop', volume: 0.2 },
    { at: T.wordTime('h17', 'reactions', s('h17') + 1) + 0.6, sfx: 'thud', volume: 0.2 },
    { at: s('h22') + 1.2, sfx: 'pop', volume: 0.15 },
    { at: T.wordTime('second', 'awake', s('second') + 3) - 0.1, sfx: 'ping', volume: 0.25 },
  ];
  // a soft tick each time the hour counter jumps to a new checkpoint
  for (const e of ['h16', 'h17', 'h20', 'h22', 'h24']) c.push({ at: s(e) + 0.02, sfx: 'toggle', volume: 0.2 });
  tm.beats.slice(1).forEach((b, i) => { if (b.shot !== tm.beats[i].shot) c.push({ at: b.start - 0.12, sfx: 'whoosh', volume: 0.16 }); });
  return c;
};
