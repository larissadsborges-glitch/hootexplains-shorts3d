import type { Cue } from '../../audio/Sfx';
import type { Timings } from '../../types';
import { carState, type ElevatorTimeline } from './timeline';

export const elevatorSfxCues = (tm: Timings, T: ElevatorTimeline): Cue[] => {
  const tImpact = carState(T, T.elseS + 0.5).tImpact;
  const c: Cue[] = [
    { at: 0, sfx: 'engine', volume: 0.5, dur: T.snap1 },
    { at: 0.1, sfx: 'creak', volume: 0.8 },
    { at: T.snap1, sfx: 'twang', volume: 1 },
    { at: T.snap1 + 0.05, sfx: 'whoosh', volume: 0.7 },
    { at: T.rewindS, sfx: 'riser', volume: 0.6 },
    { at: T.cwS, sfx: 'engine', volume: 0.4, dur: T.brakeS - T.cwS },
    { at: T.cut, sfx: 'zap', volume: 0.9 },
    { at: T.cut + 0.12, sfx: 'clunk', volume: 1 },
    { at: T.allSnap, sfx: 'twang', volume: 1 },
    { at: T.allSnap + 0.08, sfx: 'twang', volume: 0.7 },
    { at: T.allSnap + 0.1, sfx: 'whoosh', volume: 0.8 },
    { at: T.govS + 0.2, sfx: 'drill', volume: 0.3, dur: T.wedgeT - T.govS - 0.2 },
    { at: T.wedgeT, sfx: 'screech', volume: 1 },
    { at: T.wedgeT + 0.45, sfx: 'thud', volume: 0.9 },
    { at: T.otisCut + 0.2, sfx: 'twang', volume: 0.5 },
    { at: T.otisCut + 0.4, sfx: 'clunk', volume: 0.9 },
    { at: T.otisSafe + 0.1, sfx: 'pop', volume: 0.6 },
    { at: T.elseS, sfx: 'screech', volume: 0.6 },
    { at: T.elseS + 0.1, sfx: 'whoosh', volume: 0.9 },
    { at: tImpact, sfx: 'thud', volume: 1 },
    { at: tImpact + 0.02, sfx: 'spring', volume: 1 },
    { at: T.payoff + 0.2, sfx: 'riser', volume: 0.5 },
    { at: T.final, sfx: 'whoosh', volume: 0.6 },
  ];
  tm.beats.slice(1).forEach((b, i) => {
    if (b.shot !== tm.beats[i].shot) c.push({ at: b.start - 0.12, sfx: 'whoosh', volume: 0.4 });
    if (b.label) c.push({ at: b.start + 0.1, sfx: 'pop', volume: 0.5 });
  });
  for (let k = 0; k < 6; k++) c.push({ at: T.ropes + 0.3 + ((T.eachRope - T.ropes - 0.6) * k) / 6, sfx: 'pop', volume: 0.4 });
  const rc = tm.beats.find((b) => b.event === 'recap');
  rc?.words.forEach((w) => { if (!['wedges.'].includes(w.word.toLowerCase())) c.push({ at: w.start, sfx: 'pop', volume: 0.6 }); });
  return c;
};
