export type Word = { word: string; start: number; end: number };

export type Beat = {
  index: number;
  text: string;
  shot: string;
  event?: string;
  label?: string;
  labelAt?: number[] | string;
  labelWord?: string;
  speed?: number;
  highlight?: string[];
  start: number;
  end: number;
  words: Word[];
};

export type Timings = {
  id: string;
  title: string;
  lang: string;
  voice: string;
  handle: string;
  scene?: string;
  music?: string;
  style?: 'blocky' | 'soft' | 'real' | 'toon';
  recapItems?: string[];
  /** per-frame (30 fps) mouth openness 0..1 from the voice, see scripts/mouth.py */
  mouth?: number[];
  hook?: { line1: string; line2: string; top?: string };
  outro?: { line1: string; line2: string };
  duration: number;
  beats: Beat[];
};

export type ShortProps = { videoId: string; timings: Timings | null; style?: 'blocky' | 'soft' | 'real' | 'toon' };
