import type { Cue } from '../../audio/Sfx';
import type { Timings } from '../../types';
import { buzzT0, type AirplaneModeTimeline } from './timeline';

export const airplaneModeSfxCues = (tm: Timings, T: AirplaneModeTimeline): Cue[] => {
  const c: Cue[] = [
    // cabin hum under the whole video (quiet)
    { at: 0, sfx: 'jet', volume: 0.18, dur: tm.duration },
    { at: 0.35, sfx: 'ping', volume: 0.3 },
    { at: T.wordTime('myth', 'proven', T.myth + 5), sfx: 'pop', volume: 0.25 },
    { at: T.wordTime('towers', 'reach', T.towers + 2.2), sfx: 'riser', volume: 0.2 },
    { at: T.rehook + 0.05, sfx: 'thud', volume: 0.25 },
    // the star sound: plays in the pause after "Like this."
    { at: buzzT0(T), sfx: 'buzz', volume: 0.75, dur: 1.5 },
    { at: T.wordTime('landing', '200', T.landing + 1), sfx: 'buzz', volume: 0.12, dur: 1.4 },
    { at: T.wordTime('landing', 'tower', T.landing + 5.5) - 0.2, sfx: 'radio', volume: 0.3 },
    { at: T.wordTime('verdict', "won't", T.verdict + 1), sfx: 'pop', volume: 0.2 },
    { at: T.twist + 0.05, sfx: 'ping', volume: 0.3 },
    { at: T.wordTime('satellite', 'satellite', T.satellite + 2.6) - 1.2, sfx: 'zap', volume: 0.15 },
    { at: T.wordTime('battery', 'drains', T.battery + 3.5) - 0.6, sfx: 'riser', volume: 0.12 },
    { at: T.wordTime('final', 'turn', T.final + 1.6), sfx: 'toggle', volume: 0.5 },
  ];
  tm.beats.slice(1).forEach((b, i) => {
    if (b.shot !== tm.beats[i].shot) c.push({ at: b.start - 0.12, sfx: 'whoosh', volume: 0.18 });
  });
  return c;
};
