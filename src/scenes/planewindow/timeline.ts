import { beatByEvent, clamp01, easeInOutSine, easeOutCubic, lerp, lerp3, progress, wordTime } from '../../lib/anim';
import type { Beat, Timings } from '../../types';
import type { CameraPose, Shot } from '../../world/Props';

/** Places, far apart. Cabin: floor y=0, the window wall at z=WALL_Z, aisle toward +z. Units ≈ metres. */
export const CABIN = [0, 0, 0];
export const WALL_Z = -1.25;
export const WIN = { x: 0, y: 1.35, w: 0.5, h: 0.66 }; // the hero window
export const EXTERIOR = [600, 0, 0];
export const PANES = [1200, 0, 0];
export const STORY = [1800, 0, 0];
export const HOOT_SEAT = [0.8, 0.47, -0.72]; // on the cushion, in front of the seat back (back is at row x - 0.22)

const st = (b: Beat | undefined, d: number) => b?.start ?? d;

export type PlaneWindowTimeline = ReturnType<typeof buildPlaneWindowTimeline>;
export const buildPlaneWindowTimeline = (tm: Timings) => {
  const b = (e: string) => beatByEvent(tm, e);
  const s = (e: string, d: number) => st(b(e), d);
  return {
    myth: s('myth', 5.5), pressure: s('pressure', 10.8), force: s('force', 9.2), panes: s('panes', 12.6), hole: s('hole', 16.2), holeWord: wordTime(b('hole'), 'tiny', 18),
    rehook: s('rehook', 19.6), decomp: s('decomp', 21.2) + 0.1, clock: s('clock', 26.9), masks: s('masks', 32.4), descent: s('descent', 36.3),
    story: s('story', 40.3), captain: s('captain', 46.2), survived: s('survived', 48.5), landed: wordTime(b('survived'), 'landed', 51.5), final: s('final', 54.7),
    end: tm.duration,
    wordTime: (e: string, w: string, d: number) => wordTime(b(e), w, d),
  };
};

/** Crack on the panes: 0 none, grows during the re-hook. */
export const crackAt = (T: PlaneWindowTimeline, t: number) => (t >= T.story ? 0 : t < T.rehook ? (t < T.myth ? 0.15 + 0.4 * progress(t, 0.2, 3.0) : 0) : clamp01(progress(t, T.rehook + 0.2, T.decomp)));
/** Window open (outer + middle panes gone) from the decompression on, until the story. */
export const brokenAt = (T: PlaneWindowTimeline, t: number) => t >= T.decomp && t < T.story;
/** Fog density in the cabin. */
export const fogAt = (T: PlaneWindowTimeline, t: number) => (t < T.decomp ? 0 : easeOutCubic(progress(t, T.decomp, T.decomp + 0.6)) * (1 - 0.85 * progress(t, T.decomp + 1.6, T.decomp + 4.5)));
/** Masks hanging down (0..1). */
export const masksAt = (T: PlaneWindowTimeline, t: number) => (t < T.decomp + 0.7 ? 0 : easeOutCubic(progress(t, T.decomp + 0.7, T.decomp + 1.2)));
/** Hoot pulls his mask on. */
export const hootMaskAt = (T: PlaneWindowTimeline, t: number) => (t >= T.final ? 0 : easeInOutSine(progress(t, T.wordTime('masks', 'yours', T.masks + 2), T.wordTime('masks', 'yours', T.masks + 2) + 0.7)));
/** Altitude shown during the descent (ft). */
export const descentAlt = (T: PlaneWindowTimeline, t: number) => 35000 - 25000 * easeInOutSine(progress(t, T.descent + 0.3, T.story - 0.2));

const S = (pos: number[], target: number[], fov = 50) => ({ pos, target, fov });
const add = (a: number[], b: number[]) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const SHOTS: Record<string, Shot> = {
  // the hook: Hoot in his window seat, the window right next to him (one shot)
  cabinHook: { from: S([0.95, 1.5, 2.1], [0.5, 1.08, -0.85], 54), to: S([0.88, 1.46, 1.75], [0.5, 1.1, -0.9], 54) },
  exterior: { from: S(add(EXTERIOR, [21, 4.5, 8.5]), add(EXTERIOR, [0.8, -0.4, 0]), 46), to: S(add(EXTERIOR, [19, 3.8, 7.6]), add(EXTERIOR, [0.8, -0.4, 0]), 46) },
  windowFront: { from: S([0.15, 1.42, -0.15], [0, 1.35, WALL_Z], 50), to: S([0.1, 1.4, -0.35], [0, 1.35, WALL_Z], 50) },
  panes: { from: S(add(PANES, [2.6, 0.9, 2.6]), add(PANES, [0, 0, -0.1]), 40), to: S(add(PANES, [2.1, 0.7, 2.3]), add(PANES, [0, 0, -0.1]), 40) },
  panesHole: { from: S(add(PANES, [1.6, 0.2, 2.2]), add(PANES, [0, -0.1, 0]), 40), to: S(add(PANES, [1.3, 0.1, 1.9]), add(PANES, [0, -0.15, 0]), 40) },
  cabinDecomp: { from: S([1.25, 1.95, 2.05], [0.3, 1.0, -0.9], 52), to: S([1.1, 1.9, 1.75], [0.35, 1.02, -0.9], 52) },
  cabinMasks: { from: S([1.25, 1.35, 1.2], [0.75, 1.0, -0.72], 48), to: S([1.15, 1.3, 1.0], [0.78, 1.0, -0.72], 48) },
  descent: { from: S(add(EXTERIOR, [21, 6, 9]), add(EXTERIOR, [0.5, -0.8, 0]), 46), to: S(add(EXTERIOR, [19, 4.5, 8]), add(EXTERIOR, [0.5, -1, 0]), 46) },
  story: { from: S(add(STORY, [14.5, 3.2, -6.0]), add(STORY, [6.2, 0.2, 0]), 40), to: S(add(STORY, [11.6, 2.4, -3.6]), add(STORY, [6.9, 0.45, -0.2]), 40) },
  cta: { from: S([1.2, 1.45, 1.8], [0.55, 1.05, -0.8], 50), to: S([1.05, 1.4, 1.5], [0.6, 1.05, -0.8], 50) },
};

export const cameraPose = (tm: Timings, T: PlaneWindowTimeline, t: number): CameraPose => {
  const beats = tm.beats;
  let bi = 0;
  for (let i = 0; i < beats.length; i++) if (t >= beats[i].start) bi = i;
  let a = bi;
  while (a > 0 && beats[a - 1].shot === beats[bi].shot) a--;
  let z = bi;
  while (z < beats.length - 1 && beats[z + 1].shot === beats[bi].shot) z++;
  const runS = a === 0 ? 0 : beats[a].start;
  const runE = z < beats.length - 1 ? beats[z + 1].start : tm.duration;
  const name = beats[bi].shot;
  const shot = SHOTS[name] ?? SHOTS.cabinHook;
  const e = (shot.ease ?? easeInOutSine)(clamp01((t - runS) / (runE - runS)));
  const pos = lerp3(shot.from.pos, shot.to.pos, e);
  const target = lerp3(shot.from.target, shot.to.target, e);
  const fov = lerp(shot.from.fov ?? 50, shot.to.fov ?? 50, e);
  if (a > 0 && t - runS < 0.3) {
    const k = 0.25 * (1 - easeOutCubic(clamp01((t - runS) / 0.28)));
    for (let i = 0; i < 3; i++) pos[i] += (pos[i] - target[i]) * k;
  }
  const kick = (t0: number, amp: number) => (t > t0 ? amp * Math.exp(-(t - t0) * 3) : 0);
  let sh = kick(T.decomp, 0.06) + kick(T.wordTime('captain', 'pulled', T.captain + 0.6), 0.03);
  if (t >= T.decomp && t < T.masks) sh += 0.006;
  if (name === 'descent') sh += 0.01;
  if (name === 'story' && t < T.landed) sh += 0.012;
  pos[1] += Math.sin(t * 47) * sh;
  pos[0] += Math.cos(t * 39) * sh * 0.6;
  return { pos, target, fov };
};

export const labelAnchor = (_T: PlaneWindowTimeline, key: string): number[] | null => {
  if (key === 'bleed') return [PANES[0], PANES[1] - 0.24, PANES[2]];
  return null;
};
