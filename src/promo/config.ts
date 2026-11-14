// "Unidos pela Inclusão" festival promo: timing + line-up.
// To add a song snippet for an artist: drop the file in public/promo_unidos/audio/
// and set `clip` (file name) and optionally `clipFrom` (seconds into the song).
// While a clip plays, the music bed is turned down automatically.

export const FPS = 30;
export const BEAT = 18; // frames (100 BPM)
export const BAR = 72;

export type Artist = {
  id: string;
  lines: string[]; // name split into display lines
  img: string; // public/promo_unidos/img/...
  mode: 'full' | 'card' | 'logo';
  pos?: string; // object-position for the photo
  logoBg?: string; // background colour behind a logo card
  clip?: string | null;
  clipFrom?: number;
  video?: string; // public/promo_unidos/video/... shown in the card instead of the photo
  videoFrom?: number; // seconds into the video
  videoAudio?: boolean; // play the video's own sound in this slot (bed ducks), unless `clip` is set
};

export const ARTISTS: Artist[] = [
  { id: 'rancho', lines: ['RANCHO FOLCLÓRICO', 'REGIONAL DO LAVRADIO'], img: 'rancho.jpg', mode: 'logo', logoBg: '#ffffff', clip: null },
  { id: 'safari', lines: ['SAFARI'], img: 'a2.jpg', mode: 'full', pos: '50% 30%', clip: null },
  // DJ Celine plays amapiano: Antuan will send her track -> set clip: 'celine.mp3' (+ clipFrom)
  { id: 'celine', lines: ['DJ CELINE'], img: 'a4.jpg', mode: 'full', pos: '45% 40%', clip: null },
  { id: 'variacoes', lines: ['TRIBUTO AO', 'ANTÓNIO VARIAÇÕES'], img: 'a5.jpg', mode: 'full', pos: '40% 25%', clip: null },
  { id: 'taiga', lines: ['TAIGA', 'ROCK MUSIC'], img: 'taiga.jpg', mode: 'logo', logoBg: '#000000', clip: null },
  { id: 'antuan', lines: ['DEEJAY', 'ANTUAN'], img: 'a3.jpg', mode: 'full', pos: '55% 30%', clip: null },
  { id: 'companhia', lines: ['COMPANHIA', 'LIMITADA'], img: 'companhia2.jpg', mode: 'card', video: 'companhia.mp4', videoFrom: 0, videoAudio: true, clip: null },
  // Nelson Anjos & Bailarinas removed from the line-up (Nov 2026)
];

export const HEADLINER: Artist = { id: 'rossi', lines: ['SÉRGIO', 'ROSSI'], img: 'a1.jpg', mode: 'card', clip: null };

const N = ARTISTS.length; // artists before the headliner, 2 bars each (must match make_festival_bed.py N_ART)
export const T = {
  intro: 0,
  artists: 3 * BAR,
  artistLen: 2 * BAR, // 144 frames = 4.8 s each
  tease: (3 + 2 * N) * BAR,
  headliner: (4 + 2 * N) * BAR,
  outro: (7 + 2 * N) * BAR,
  end: (10 + 2 * N) * BAR + 60,
};
