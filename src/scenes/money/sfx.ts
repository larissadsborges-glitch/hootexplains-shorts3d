import type { Cue } from '../../audio/Sfx';
import type { Timings } from '../../types';
import type { MoneyTimeline } from './timeline';

export const moneySfxCues = (tm: Timings, T: MoneyTimeline): Cue[] => {
  const s = T.s;
  const w = (ev: string, word: string, d: number) => T.wordTime(ev, word, d);
  const c: Cue[] = [
    // B1: scribble on the circled 7.3¢, a flick when the note flips, riser on "go back"
    { at: w('hook', 'cents', s('hook') + 1) - 0.05, sfx: 'brush', volume: 0.18 },
    { at: w('hook', 'worth', s('hook') + 2.4) + 0.1, sfx: 'whoosh', volume: 0.14 },
    { at: w('hook', 'back', s('hook') + 4.4) - 0.05, sfx: 'riser', volume: 0.2 },
    // B2: swap pop, buzzer on "hate"
    { at: w('barter', 'fish', s('barter') + 1.6) - 0.1, sfx: 'pop', volume: 0.18 },
    { at: w('barter', 'hate', s('barter') + 3.2) + 0.05, sfx: 'buzz', volume: 0.2 },
    // B3: lamps click on, shells, gold, silver, shine
    { at: s('coins') + 0.4, sfx: 'toggle', volume: 0.16 },
    { at: s('coins') + 0.9, sfx: 'toggle', volume: 0.16 },
    { at: w('coins', 'shells', s('coins') + 1.9) + 0.2, sfx: 'pop', volume: 0.16 },
    { at: w('coins', 'gold', s('coins') + 3.0), sfx: 'ping', volume: 0.2 },
    { at: w('coins', 'silver', s('coins') + 3.4) + 0.2, sfx: 'ping', volume: 0.16 },
    { at: w('coins', 'worth', s('coins') + 3.9), sfx: 'zap', volume: 0.08 },
    // B4: the sack is heavy, a paper note is handed over, the swap card pops
    { at: w('china', 'heavy', s('china') + 0.6), sfx: 'thud', volume: 0.22 },
    { at: w('china', 'printed', s('china') + 1.5) + 0.2, sfx: 'clunk', volume: 0.16 },
    { at: w('china', 'paper', s('china') + 1.85) - 0.05, sfx: 'whoosh', volume: 0.14 },
    { at: w('china', 'trade', s('china') + 3.0) - 0.1, sfx: 'pop', volume: 0.16 },
    // B5: chain clinks in, snip, the vault door slams
    { at: w('gold', 'backed', s('gold') + 1.8), sfx: 'toggle', volume: 0.16 },
    { at: w('gold', '1971', s('gold') + 3.2), sfx: 'ping', volume: 0.2 },
    { at: w('gold', 'cut', s('gold') + 4.4), sfx: 'crack', volume: 0.22 },
    { at: w('gold', 'link', s('gold') + 4.9) + 0.3, sfx: 'thud', volume: 0.3 },
    { at: w('gold', 'link', s('gold') + 4.9) + 0.32, sfx: 'rumble', volume: 0.18, dur: 0.8 },
    // B6: sticker pulse, the stamp, the two ticks, the trust chain
    { at: w('answer', '7', s('answer') + 1.4), sfx: 'pop', volume: 0.16 },
    { at: w('answer', 'law', s('answer') + 3.2), sfx: 'thud', volume: 0.26 },
    { at: w('answer', 'debt', s('answer') + 4.3), sfx: 'ping', volume: 0.16 },
    { at: w('answer', 'tax', s('answer') + 4.7), sfx: 'ping', volume: 0.16 },
    { at: w('answer', 'everyone', s('answer') + 5.6), sfx: 'pop', volume: 0.14 },
    // B7: the ask
    { at: w('final', 'would', s('final') + 1.7), sfx: 'pop', volume: 0.16 },
  ];
  tm.beats.slice(1).forEach((b, i) => { if (b.shot !== tm.beats[i].shot && b.event !== 'barter') c.push({ at: b.start - 0.12, sfx: 'whoosh', volume: 0.16 }); });
  return c;
};
