import React, { useMemo } from 'react';
import { AbsoluteFill, Audio, getInputProps, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Music, Sfx, type Cue } from '../audio/Sfx';
import { clamp01, cleanWord, easeOutBack, easeOutCubic } from '../lib/anim';
import { buildMoneyTimeline, type MoneyTimeline } from '../scenes/money/timeline';
import type { ShortProps, Timings } from '../types';
import { Act, PAL, type Mood } from './cast';
import { QaProbe } from './QaProbe';

/**
 * The shared engine of every "A Vida do Tavinho" episode: the per-phrase camera, captions, acting cues,
 * audio and the QA probe. Each episode supplies an EpConfig (scenes, shot plan, sound cues, its own overlays).
 */
export const FONT = "'Montserrat', 'Arial Black', sans-serif";
export const W = (T: MoneyTimeline, ev: string, w: string, d = 0.5) => T.wordTime(ev, w, T.s(ev) + d);

export type SceneFC = React.FC<{ T: MoneyTimeline; t: number }>;
type Framing = [number, number, number];
export type Move = 'push' | 'drift' | 'roll' | 'shake';
/** x, y, zoom (canvas units), camera move, and Tavinho's mood for that phrase (undefined = the scene's own). */
export type ShotRow = [number, number, number, Move, Mood?];

export type EpConfig = {
  scenes: Record<string, SceneFC>;
  /** scene used when a beat's shot has no entry */
  fallback: SceneFC;
  /** per beat event, one row per caption phrase (extra phrases reuse the last row) */
  shotPlan: Record<string, ShotRow[]>;
  /** framing cycle per shot, for beats without a shot plan */
  frames?: Record<string, Framing[]>;
  cues: (tm: Timings, T: MoneyTimeline) => Cue[];
  musicDip?: (T: MoneyTimeline) => (t: number) => number;
  /** shots drawn as a sepia flashback */
  sepia?: string[];
  /** out-of-focus foreground layers (SVG, screen space), per shot */
  foreground?: (shot: string, t: number) => React.ReactNode;
  /** caption colours for names, on top of the cast defaults */
  names?: Record<string, string>;
  /** episode overlays (HTML), drawn between the scene and the captions */
  Overlays: React.FC<{ T: MoneyTimeline; t: number; timings: Timings }>;
};

const NAMES: Record<string, string> = { camila: '#5fb3ff', sogra: '#ff5a6a', celeste: '#ff5a6a', 'vó': '#7fd36a', tavinho: '#ffd21f' };

/** Phrase groups (2–4 words), shared by the captions and the camera cuts. */
export const phraseGroups = (timings: Timings) => {
  const groups: { start: number; beat: number; words: { word: string; start: number; end: number; hl: boolean }[] }[] = [];
  timings.beats.forEach((b, bi) => {
    let cur: { word: string; start: number; end: number; hl: boolean }[] = [];
    b.words.forEach((w, i) => {
      cur.push({ ...w, hl: (b.highlight ?? []).map((x) => x.toLowerCase()).includes(cleanWord(w.word)) });
      if (/[.,:;?!]$/.test(w.word) || cur.length >= 3 || i === b.words.length - 1) { groups.push({ start: cur[0].start, beat: bi, words: cur }); cur = []; }
    });
  });
  return groups;
};

/**
 * Phrase captions (2–4 words, broken at punctuation), the spoken word highlighted, the beat's key words in orange.
 * Placed at ~74% height: under the story props, above the apps' bottom UI.
 */
const PhraseCaptions: React.FC<{ timings: Timings; t: number; names: Record<string, string> }> = ({ timings, t, names }) => {
  const groups = phraseGroups(timings);
  // a caption page ends where the next one starts (both 0.05 s ahead of their words, with the camera cut)
  const g = groups.find((x, i) => t >= x.words[0].start - 0.05 && t < (groups[i + 1] ? groups[i + 1].words[0].start - 0.05 : x.words[x.words.length - 1].end + 0.8));
  if (!g) return null;
  const clean = (w: string) => w.replace(/[^\p{L}\p{N}%'’-]/gu, '');
  const chars = g.words.reduce((n, w) => n + clean(w.word).length, 0) + g.words.length - 1;
  const size = chars > 18 ? 58 : chars > 14 ? 66 : 76;
  return (
    <div style={{ position: 'absolute', left: 100, right: 120, top: '73.5%', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0 30px' }}>
      {g.words.map((w, i) => {
        const on = t >= w.start - 0.03;
        return (
          <span key={i} data-qa="capword" style={{ fontFamily: FONT, fontWeight: 900, fontSize: size, letterSpacing: 1, color: names[cleanWord(w.word)] ?? (w.hl ? PAL.orange : on ? '#ffffff' : 'rgba(255,255,255,0.55)'), textShadow: '0 0 2px #1b1420, 4px 4px 0 #1b1420, -4px 4px 0 #1b1420, 4px -4px 0 #1b1420, -4px -4px 0 #1b1420, 0 8px 0 rgba(0,0,0,0.35)', transform: `scale(${on && t < w.start + 0.12 ? 1.08 : 1})` }}>
            {clean(w.word).toUpperCase()}
          </span>
        );
      })}
    </div>
  );
};

const clampCam = ([x, y, z]: Framing): Framing => {
  const hw = 540 / z, hh = 960 / z;
  return [Math.min(1080 - hw, Math.max(hw, x)), Math.min(1920 - hh, Math.max(hh, y)), z];
};

/** Music gain multiplier: the bed drops out under the twist (event `ev`) and comes back. Shared by the episodes. */
export const twistDip = (ev: string) => (T: MoneyTimeline) => (t: number) => {
  const a = T.s(ev) - 0.05, hold = 1.3, back = 0.6;
  if (t < a - 0.08 || t > a + hold + back) return 1;
  if (t < a) return 1 - 0.85 * ((t - (a - 0.08)) / 0.08);
  if (t < a + hold) return 0.15;
  return 0.15 + 0.85 * ((t - a - hold) / back);
};

/* ------------------------------------------------------------------ shared overlay pieces */

/** A red full-screen card ("MENTIRA #1", "ERRO #1") with a white tag under it. */
export const RedCard: React.FC<{ t: number; t0: number; t1: number; word: string; num: string; tag: string; qa: string }> = ({ t, t0, t1, word, num, tag, qa }) => {
  if (!(t >= t0 - 0.05 && t < t1)) return null;
  return (
    <AbsoluteFill data-qa-label={qa} data-qa-cover="1" style={{ background: '#e2453c', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.07) 0 40px, transparent 40px 80px)' }} />
      <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 120, color: '#fff', textAlign: 'center', lineHeight: 1, transform: `scale(${easeOutBack(clamp01((t - t0 + 0.02) / 0.2)) * (1 + 0.04 * Math.sin((t - t0) * 14))}) rotate(${-3 + 1.5 * Math.sin((t - t0) * 9)}deg)` }}>{word}<br /><span style={{ fontSize: 220 }}>{num}</span></div>
      <div style={{ marginTop: 30, background: '#fff', color: '#e2453c', borderRadius: 20, padding: '8px 24px', fontFamily: FONT, fontWeight: 900, fontSize: 46 }}>{tag}</div>
    </AbsoluteFill>
  );
};

/** The mid-video follow ask. */
export const FollowPill: React.FC<{ t: number; t0: number; t1: number; text: string }> = ({ t, t0, t1, text }) => {
  if (!(t >= t0 && t < t1)) return null;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 560, display: 'flex', justifyContent: 'center' }}>
      <div data-qa-label="segue" style={{ display: 'flex', alignItems: 'center', gap: 16, background: PAL.orange, border: '5px solid #1b1420', borderRadius: 40, padding: '12px 30px', fontFamily: FONT, fontWeight: 900, fontSize: 42, color: '#fff', transform: `scale(${easeOutBack(clamp01((t - t0) / 0.25))})` }}>
        {text}
      </div>
    </div>
  );
};

/** The cliffhanger notification nobody opens yet (drops in at the top at t0 and stays). */
export const Cliffhanger: React.FC<{ t: number; t0: number; who: string; line: string; qa: string }> = ({ t, t0, who, line, qa }) => {
  if (t < t0) return null;
  return (
    <div data-qa-label={qa} style={{ position: 'absolute', left: 50, right: 50, top: Math.round(150 - 220 * (1 - easeOutCubic(clamp01((t - t0) / 0.3)))), background: '#ffffff', border: '6px solid #1b1420', borderRadius: 34, padding: '22px 30px', fontFamily: FONT, fontWeight: 900, fontSize: 46, color: '#1b1420', boxShadow: '0 14px 26px rgba(0,0,0,0.45)', transform: `rotate(${1.5 * Math.sin(t * 20) * (1 - clamp01((t - t0 - 0.4) / 0.3))}deg)` }}>
      {who}<div style={{ fontWeight: 700, fontSize: 38, color: '#e2453c' }}>{line}</div>
    </div>
  );
};

/* ------------------------------------------------------------------ the episode */

export const EpisodeShell: React.FC<ShortProps & { cfg: EpConfig }> = ({ videoId, timings, cfg }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = useMemo(() => (timings ? buildMoneyTimeline(timings) : null), [timings]);
  const cues = useMemo(() => (timings && T ? cfg.cues(timings, T) : []), [timings, T, cfg]);
  if (!timings || !T) return null;
  const t = frame / fps;
  // the scene switches on the same frame as the camera cut (both 0.04 s ahead of the first word), so no 1-frame flash of the old scene
  const beat = timings.beats.reduce((b, x) => (t >= x.start - 0.04 ? x : b), timings.beats[0]);
  const idx = timings.beats.indexOf(beat);
  let a = idx;
  while (a > 0 && timings.beats[a - 1].shot === beat.shot) a--;
  const groups = phraseGroups(timings);
  let gi = 0;
  for (let i = 0; i < groups.length; i++) if (t >= groups[i].start - 0.04) gi = i;
  // index of this phrase within the current run of the same shot
  let k = 0;
  for (let i = gi; i > 0 && timings.beats[groups[i - 1].beat].shot === beat.shot && groups[i - 1].start >= (a === 0 ? -1 : timings.beats[a].start - 0.05); i--) k++;
  // the shot for this phrase: from the per-beat plan (index of the phrase inside its beat), else the shot's framing cycle
  const curGroup = groups[gi];
  const rowOf = (g: number): ShotRow => {
    const rows = cfg.shotPlan[timings.beats[groups[g].beat].event ?? ''];
    const inBeat = groups.filter((x, i) => i <= g && x.beat === groups[g].beat).length - 1;
    const fr = cfg.frames?.[timings.beats[groups[g].beat].shot] ?? [[540, 960, 1]];
    return rows ? rows[Math.min(inBeat, rows.length - 1)] : [...fr[k % fr.length], 'push'];
  };
  const row: ShotRow = curGroup ? rowOf(gi) : [540, 960, 1, 'push'];
  // a phrase framed like the one before it continues that shot (no cut)
  let g0 = gi;
  const same = (p: ShotRow, q: ShotRow) => p[0] === q[0] && p[1] === q[1] && p[2] === q[2] && p[3] === q[3];
  while (curGroup && g0 > 0 && groups[g0 - 1].beat === groups[gi].beat && same(rowOf(g0 - 1), row)) g0--;
  const [cx0, cy0, cz] = clampCam([row[0], row[1], row[2]]);
  const sinceCut = t - Math.max(groups[g0]?.start ?? 0, timings.beats[a].start);
  const move = row[3];
  // every move keeps moving until the next cut (never a static frame, even in gaps between sentences); the twist roll pushes in too
  const zMove = move === 'push' || move === 'roll' ? 1 + 0.065 * Math.min(sinceCut, 3) : 1 + 0.03 * Math.min(sinceCut, 3);
  const z = cz * zMove * (1 + 0.05 * (1 - easeOutCubic(clamp01(sinceCut / 0.25))));
  const shake = move === 'shake' && sinceCut < 7 / 30 ? 14 * Math.sin(sinceCut * 90) : 0;
  const [cx, cy] = clampCam([cx0 + (move === 'drift' ? 30 * Math.sin(sinceCut * 1.4) : 0) + shake, cy0 + (move === 'shake' ? shake * 0.6 : 0), z]);
  const roll = move === 'roll' ? -3.5 * easeOutCubic(clamp01(sinceCut / 0.3)) : 0;
  const Scene = cfg.scenes[beat.shot] ?? cfg.fallback;
  // head bob on the beat's stressed (highlighted) words: a quick nod over 0.3 s
  const bob = Math.max(0, ...(curGroup ? groups[gi].words : []).filter((w) => w.hl).map((w) => { const u = (t - w.start) / 0.3; return u > 0 && u < 1 ? Math.sin(Math.PI * u) : 0; }));
  const sepia = (cfg.sepia ?? []).includes(beat.shot);
  const qa = Boolean((getInputProps() as { qa?: boolean }).qa);
  const Overlays = cfg.Overlays;
  return (
    <AbsoluteFill style={{ background: PAL.navy }} data-qa="root">
      <svg viewBox="0 0 1080 1920" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
        <defs><filter id="fgBlur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="14" /></filter></defs>
        <Act.Provider value={{ mood: row[4], bob }}>
          <g transform={`translate(540 960) rotate(${roll}) scale(${z}) translate(${-cx} ${-cy})`}><Scene T={T} t={t} /></g>
        </Act.Provider>
        {/* out-of-focus foreground for depth, moving a little faster than the scene (parallax) */}
        {cfg.foreground?.(beat.shot, t)}
      </svg>
      {sepia && <AbsoluteFill style={{ background: 'rgba(170,110,40,0.38)', mixBlendMode: 'multiply' }} />}
      <Overlays T={T} t={t} timings={timings} />
      <PhraseCaptions timings={timings} t={t} names={{ ...NAMES, ...cfg.names }} />
      {!(T.s('video') > 0 && t >= T.s('video') - 0.04) && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 120, display: 'flex', justifyContent: 'center' }}>
          <div style={{ background: 'rgba(27,20,32,0.55)', borderRadius: 16, padding: '2px 14px', fontFamily: FONT, fontWeight: 800, fontSize: 28, color: 'rgba(255,244,224,0.95)' }}>{timings.handle}</div>
        </div>
      )}
      <Audio src={staticFile(`videos/${videoId}/voice.wav`)} />
      <Sfx cues={cues} timings={timings} />
      <Music timings={timings} src={timings.music} dip={cfg.musicDip?.(T)} />
      {qa && <QaProbe />}
    </AbsoluteFill>
  );
};
