import type { Beat, Timings, Word } from '../types';

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerp3 = (a: number[], b: number[], t: number): [number, number, number] => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
];
export const progress = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
export const smoothstep = (a: number, b: number, v: number) => {
  const x = clamp01((v - a) / (b - a));
  return x * x * (3 - 2 * x);
};
export const easeInOutSine = (x: number) => -(Math.cos(Math.PI * x) - 1) / 2;
export const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
export const easeInQuad = (x: number) => x * x;
export const easeOutBack = (x: number) => {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

/** Deterministic random numbers, so every render looks identical. */
export const rng = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export const cleanWord = (w: string) => w.replace(/[^A-Za-z0-9'’-]/g, '').toLowerCase();

export const beatByEvent = (timings: Timings, event: string): Beat | undefined =>
  timings.beats.find((b) => b.event === event);

/** Start time of a word inside a beat (falls back to the beat start). */
export const wordTime = (beat: Beat | undefined, word: string, fallback = 0): number => {
  if (!beat) return fallback;
  const w: Word | undefined = beat.words.find((x) => cleanWord(x.word) === word.toLowerCase());
  return w ? w.start : beat.start;
};
