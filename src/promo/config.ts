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
};

export const ARTISTS: Artist[] = [
  { id: 'rancho', lines: ['RANCHO FOLCLÓRICO', 'REGIONAL DO LAVRADIO'], img: 'rancho.jpg', mode: 'logo', logoBg: '#ffffff', clip: null },
  { id: 'safari', lines: ['SAFARI'], img: 'a2.jpg', mode: 'full', pos: '50% 30%', clip: null },
  { id: 'celine', lines: ['DJ CELINE'], img: 'a4.jpg', mode: 'full', pos: '45% 40%', clip: null },
  { id: 'variacoes', lines: ['TRIBUTO AO', 'ANTÓNIO VARIAÇÕES'], img: 'a5.jpg', mode: 'full', pos: '40% 25%', clip: null },
  { id: 'taiga', lines: ['TAIGA', 'ROCK MUSIC'], img: 'taiga.jpg', mode: 'logo', logoBg: '#000000', clip: null },
  { id: 'antuan', lines: ['DEEJAY', 'ANTUAN'], img: 'a3.jpg', mode: 'full', pos: '55% 30%', clip: null },
  { id: 'companhia', lines: ['COMPANHIA', 'LIMITADA'], img: 'companhia.jpg', mode: 'card', clip: null },
  { id: 'nelson', lines: ['NELSON ANJOS', '& BAILARINAS'], img: 'nelson.jpg', mode: 'card', clip: null },
];

export const HEADLINER: Artist = { id: 'rossi', lines: ['SÉRGIO', 'ROSSI'], img: 'a1.jpg', mode: 'card', clip: null };

export const T = {
  intro: 0,
  artists: 3 * BAR, // 216
  artistLen: 2 * BAR, // 144 frames = 4.8 s each
  tease: 3 * BAR + 8 * 2 * BAR, // 1368
  headliner: 20 * BAR, // 1440
  outro: 23 * BAR, // 1656
  end: 23 * BAR + 3 * BAR + 60, // 1932 = 64.4 s
};
