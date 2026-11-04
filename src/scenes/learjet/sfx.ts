import type { Cue } from '../../audio/Sfx';
import type { Timings } from '../../types';
import type { LearjetTimeline } from './timeline';

export const learjetSfxCues = (tm: Timings, T: LearjetTimeline): Cue[] => {
  const c: Cue[] = [
    // hook: roaring air in the dive, then into the cloud
    { at: 0, sfx: 'wind', volume: 0.5, dur: T.route },
    { at: T.route - 0.45, sfx: 'whoosh', volume: 0.35 },
    // calm cruise, then weather
    { at: T.cruise, sfx: 'jet', volume: 0.4, dur: T.radio - T.cruise },
    { at: T.storms + 0.5, sfx: 'thunder', volume: 0.4 },
    { at: T.storms + 1.6, sfx: 'thunder', volume: 0.25 },
    { at: T.ice + 0.3, sfx: 'radio', volume: 0.4 },
    { at: T.climb + 0.1, sfx: 'radio', volume: 0.35 },
    // the radio changes
    { at: T.radio + 0.85, sfx: 'radio', volume: 0.45 },
    { at: T.radio + 0.9, sfx: 'alarm', volume: 0.18, dur: T.stress - T.radio - 0.9 },
    { at: T.mayday, sfx: 'wind', volume: 0.35, dur: T.everest - T.mayday },
    { at: T.overspeedWord, sfx: 'riser', volume: 0.3 },
    // far away: a low rumble, sirens
    { at: T.wordTime('impact', 'hits', T.impact + 2), sfx: 'rumble', volume: 0.3 },
    { at: T.crater, sfx: 'siren', volume: 0.22, dur: 5 },
    { at: T.evac, sfx: 'siren', volume: 0.12, dur: 5 },
    { at: T.question, sfx: 'heartbeat', volume: 0.4 },
    { at: T.question + 1.6, sfx: 'heartbeat', volume: 0.3 },
  ];
  tm.beats.slice(1).forEach((b, i) => {
    if (b.shot !== tm.beats[i].shot) c.push({ at: b.start - 0.12, sfx: 'whoosh', volume: 0.18 });
  });
  for (const [ev, words] of [['checklist', ['weather', 'ice', 'radar', 'wreckage']]] as const) {
    for (const w of words) c.push({ at: T.wordTime(ev, w, T.checklist), sfx: 'pop', volume: 0.3 });
  }
  return c;
};
