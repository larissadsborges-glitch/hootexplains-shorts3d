import type { Cue } from '../../audio/Sfx';
import type { Timings } from '../../types';
import { driveAt, microAt, type SleepTimeline } from './timeline';

export const sleepSfxCues = (tm: Timings, T: SleepTimeline): Cue[] => {
  const c: Cue[] = [];
  const s = T.s;
  // a soft clock tick at the start of each beat in the room
  tm.beats.forEach((b) => { if (b.shot !== 'road' && b.shot !== 'story') c.push({ at: b.start + 0.05, sfx: 'toggle', volume: 0.12 }); });
  // microsleeps: a low thud as the lights go out
  for (let f = 0; f < tm.duration * 30; f++) {
    const t = f / 30, p = (f - 1) / 30;
    if (microAt(T, t) > 0 && microAt(T, p) === 0) c.push({ at: t, sfx: 'thud', volume: 0.25 });
  }
  if (T.day === 1) {
    c.push({ at: T.wordTime('h24', 'drunk', s('h24') + 1.3), sfx: 'pop', volume: 0.2 });
    c.push({ at: s('stress') + 0.3, sfx: 'heartbeat', volume: 0.3 });
    c.push({ at: s('stress') + 1.3, sfx: 'heartbeat', volume: 0.25 });
    c.push({ at: T.wordTime('hunger', 'snacks', s('hunger') + 3), sfx: 'pop', volume: 0.2 });
  }
  if (T.day === 2) {
    const d0 = s('road') + 0.45;
    c.push({ at: s('road'), sfx: 'engine', volume: 0.2, dur: s('fog') - s('road') });
    c.push({ at: d0 + 5, sfx: 'screech', volume: 0.25 });
    void driveAt;
  }
  if (T.day === 3) {
    c.push({ at: s('halluc') + 0.2, sfx: 'riser', volume: 0.2 });
    c.push({ at: T.wordTime('halluc', 'hearing', s('halluc') + 3), sfx: 'radio', volume: 0.15 });
    c.push({ at: s('recover'), sfx: 'ping', volume: 0.2 });
  }
  tm.beats.slice(1).forEach((b, i) => {
    if (b.shot !== tm.beats[i].shot) c.push({ at: b.start - 0.12, sfx: 'whoosh', volume: 0.16 });
  });
  return c;
};
