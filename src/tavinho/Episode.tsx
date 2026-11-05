import React, { useMemo } from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Music, Sfx, type Cue } from '../audio/Sfx';
import { clamp01, easeOutBack, easeOutCubic } from '../lib/anim';
import { TitleCard } from '../overlays/Overlays';
import { cleanWord } from '../lib/anim';
import { buildMoneyTimeline, type MoneyTimeline } from '../scenes/money/timeline';
import type { ShortProps, Timings } from '../types';
import { PAL } from './cast';
import { Bed, Building, ChatSogra, Fridge, Group, Sunday, Table12, Trash, Typing, Vote } from './scenes';

const FONT = "'Montserrat', 'Arial Black', sans-serif";
const W = (T: MoneyTimeline, ev: string, w: string, d = 0.5) => T.wordTime(ev, w, T.s(ev) + d);

const SCENES: Record<string, React.FC<{ T: MoneyTimeline; t: number }>> = {
  bed: Bed, chat: ChatSogra, table: Table12, sunday: Sunday, trash: Trash, fridge: Fridge, building: Building, typing: Typing, group: Group, vote: Vote,
};

/** Sound cues for EP1, all pinned to spoken words. */
const cuesFor = (tm: Timings, T: MoneyTimeline): Cue[] => {
  const c: Cue[] = [
    { at: T.s('twelve') - 0.1, sfx: 'pop', volume: 0.2 },
    { at: W(T, 'twelve', 'natal', 1.1) - 0.1, sfx: 'pop', volume: 0.2 },
    { at: W(T, 'twelve', 'doze', 2.5) - 0.1, sfx: 'pop', volume: 0.2 },
    { at: W(T, 'stakes', 'ovo', 2.8) + 0.05, sfx: 'splash', volume: 0.2 },
    { at: W(T, 'lie', 'fui', 0.9), sfx: 'ping', volume: 0.2 },
    { at: W(T, 'market', 'quatro', 1.0), sfx: 'ping', volume: 0.3 },
    { at: W(T, 'building', 'fritou', 1.9) + 0.3, sfx: 'alarm', volume: 0.18 },
    { at: W(T, 'building', 'desceu', 4.9) - 0.3, sfx: 'siren', volume: 0.12 },
    { at: W(T, 'camilamsg', 'camila', 0.4) - 0.1, sfx: 'ping', volume: 0.22 },
    { at: T.s('group') + 0.6, sfx: 'buzz', volume: 0.14 },
    { at: W(T, 'percent', 'dois', 0.9), sfx: 'toggle', volume: 0.2 },
    { at: T.s('mission'), sfx: 'riser', volume: 0.18 },
    { at: T.s('video'), sfx: 'whoosh', volume: 0.18 },
    { at: T.s('vo'), sfx: 'whoosh', volume: 0.18 },
    { at: W(T, 'decide', 'vó', 2.6) + 0.1, sfx: 'ping', volume: 0.22 },
  ];
  // typing clicks while he writes the truth
  const ts = W(T, 'truth', 'decide', 0.6), te = W(T, 'truth', 'verdade', 1.7);
  for (let x = ts; x < te; x += 0.16) c.push({ at: x, sfx: 'toggle', volume: 0.08 });
  tm.beats.slice(1).forEach((b, i) => { if (b.shot !== tm.beats[i].shot) c.push({ at: b.start - 0.1, sfx: 'whoosh', volume: 0.14 }); });
  return c;
};

/**
 * Phrase captions (2–4 words, broken at punctuation), the spoken word highlighted, the beat's key words in orange.
 * Placed at ~74% height: under the story props, above the apps' bottom UI.
 */
const PhraseCaptions: React.FC<{ timings: Timings; t: number }> = ({ timings, t }) => {
  const groups = phraseGroups(timings);
  const g = groups.find((x, i) => t >= x.words[0].start - 0.05 && t < (groups[i + 1]?.words[0].start ?? x.words[x.words.length - 1].end + 0.8));
  if (!g) return null;
  const clean = (w: string) => w.replace(/[^\p{L}\p{N}%'’-]/gu, '');
  return (
    <div style={{ position: 'absolute', left: 60, right: 60, top: '73.5%', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0 22px' }}>
      {g.words.map((w, i) => {
        const on = t >= w.start - 0.03;
        return (
          <span key={i} style={{ fontFamily: FONT, fontWeight: 900, fontSize: 76, letterSpacing: 1, color: w.hl ? PAL.orange : on ? '#ffffff' : 'rgba(255,255,255,0.55)', textShadow: '0 0 2px #1b1420, 4px 4px 0 #1b1420, -4px 4px 0 #1b1420, 4px -4px 0 #1b1420, -4px -4px 0 #1b1420, 0 8px 0 rgba(0,0,0,0.35)', transform: `scale(${on && t < w.start + 0.12 ? 1.08 : 1})` }}>
            {clean(w.word).toUpperCase()}
          </span>
        );
      })}
    </div>
  );
};

/**
 * Virtual camera, cut on every caption phrase (~1 s), like the reference episodes:
 * each shot cycles through framings [x, y, zoom] in canvas units. The first framing of a shot is its opener.
 */
type Framing = [number, number, number];
const FRAMES: Record<string, Framing[]> = {
  bed: [[540, 960, 1], [540, 700, 2.1], [540, 960, 1.15], [560, 1120, 1.7]],
  chat: [[540, 900, 1.05], [540, 560, 1.7], [540, 780, 1.35]],
  table: [[540, 960, 1], [190, 1200, 2.4], [540, 780, 1.4], [790, 1240, 2.2]],
  sunday: [[540, 960, 1], [230, 1060, 2.3], [800, 1000, 2.0], [540, 1200, 1.6]],
  trash: [[540, 900, 1], [560, 600, 1.9], [540, 1150, 1.9]],
  fridge: [[540, 960, 1], [540, 900, 2.0], [450, 1260, 2.0]],
  building: [[540, 960, 1], [640, 720, 1.9], [540, 1210, 2.4], [320, 1470, 1.9], [540, 1000, 1.25]],
  typing: [[540, 900, 1.05], [540, 1300, 1.8], [200, 1250, 2.3], [540, 1080, 1.35]],
  group: [[540, 900, 1.05], [540, 620, 1.6], [700, 520, 1.9]],
  vote: [[540, 960, 1]],
};
const clampCam = ([x, y, z]: Framing): Framing => {
  const hw = 540 / z, hh = 960 / z;
  return [Math.min(1080 - hw, Math.max(hw, x)), Math.min(1920 - hh, Math.max(hh, y)), z];
};
/** Phrase groups (2–4 words), shared by the captions and the camera cuts. */
const phraseGroups = (timings: Timings) => {
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

/** A Vida do Tavinho, T1 EP1. */
export const TavinhoEpisode: React.FC<ShortProps> = ({ videoId, timings }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = useMemo(() => (timings ? buildMoneyTimeline(timings) : null), [timings]);
  const cues = useMemo(() => (timings && T ? cuesFor(timings, T) : []), [timings, T]);
  if (!timings || !T) return null;
  const t = frame / fps;
  const beat = timings.beats.reduce((b, x) => (t >= x.start ? x : b), timings.beats[0]);
  const idx = timings.beats.indexOf(beat);
  let a = idx;
  while (a > 0 && timings.beats[a - 1].shot === beat.shot) a--;
  const since = t - (a === 0 ? 0 : timings.beats[a].start);
  void since;
  const groups = phraseGroups(timings);
  let gi = 0;
  for (let i = 0; i < groups.length; i++) if (t >= groups[i].start - 0.04) gi = i;
  // index of this phrase within the current run of the same shot
  let k = 0;
  for (let i = gi; i > 0 && timings.beats[groups[i - 1].beat].shot === beat.shot && groups[i - 1].start >= (a === 0 ? -1 : timings.beats[a].start - 0.05); i--) k++;
  const frames = FRAMES[beat.shot] ?? [[540, 960, 1]];
  const [cx, cy, cz] = clampCam(frames[k % frames.length] as Framing);
  const sinceCut = t - Math.max(groups[gi]?.start ?? 0, timings.beats[a].start);
  const z = cz * (1 + 0.05 * (1 - easeOutCubic(clamp01(sinceCut / 0.25)))) * (1 + 0.02 * clamp01(sinceCut / 1.5));
  const Scene = SCENES[beat.shot] ?? Bed;
  const days = W(T, 'stakes', 'dias', 1.1);
  const pct = W(T, 'percent', 'dois', 0.9);
  const sepia = beat.shot === 'sunday';
  const followT = T.s('follow');
  const last = timings.beats[timings.beats.length - 1];
  const notifT = W(T, 'decide', 'vó', 2.6) + 0.05;
  return (
    <AbsoluteFill style={{ background: PAL.navy }}>
      <svg viewBox="0 0 1080 1920" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
        <g transform={`translate(540 960) scale(${z}) translate(${-cx} ${-cy})`}><Scene T={T} t={t} /></g>
      </svg>
      {sepia && <AbsoluteFill style={{ background: 'rgba(170,110,40,0.38)', mixBlendMode: 'multiply' }} />}
      {sepia && (
        <div style={{ position: 'absolute', left: 60, top: 300, background: '#fff4e0', border: '5px solid #1b1420', borderRadius: 14, padding: '6px 22px', fontFamily: FONT, fontWeight: 900, fontSize: 40, color: '#1b1420', transform: 'rotate(-4deg)' }}>DOMINGO</div>
      )}
      {/* hook text, matching the spoken hook */}
      <TitleCard line1="MENTIU" line2="PRA SOGRA" t={t} tIn={-0.7} tOut={T.s('twelve') - 0.05} top="12%" />
      {/* days counter: on from "dias" to the end */}
      {t >= days && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 200, display: 'flex', justifyContent: 'center' }}>
          <div style={{ background: '#1b1420', border: '4px solid #fff4e0', borderRadius: 20, padding: '6px 26px', fontFamily: FONT, fontWeight: 900, fontSize: 44, color: '#fff4e0', letterSpacing: 2, transform: `scale(${easeOutBack(clamp01((t - days) / 0.25))})` }}>
            FALTAM <span style={{ color: PAL.orange }}>49</span> DIAS
          </div>
        </div>
      )}
      {/* CHEF % bar: on from "dois por cento" */}
      {t >= T.s('mission') && (
        <div style={{ position: 'absolute', left: 140, right: 140, top: 282, transform: `scale(${easeOutBack(clamp01((t - pct) / 0.25))})` }}>
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 30, color: '#fff4e0', textAlign: 'center', marginBottom: 6 }}>CHEF <span style={{ color: Math.floor(t * 4) % 2 ? PAL.orange : '#fff4e0' }}>2%</span></div>
          <div style={{ height: 30, borderRadius: 15, background: '#2c3550', border: '4px solid #fff4e0', overflow: 'hidden' }}>
            <div style={{ width: '4%', height: '100%', background: PAL.mint }} />
          </div>
        </div>
      )}
      {/* follow ask at the laugh peak */}
      {t >= followT && t < T.s('truth') - 0.05 && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 560, display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: PAL.orange, border: '5px solid #1b1420', borderRadius: 40, padding: '12px 30px', fontFamily: FONT, fontWeight: 900, fontSize: 42, color: '#fff', transform: `scale(${easeOutBack(clamp01((t - followT) / 0.25))})` }}>
            SEGUE O @avidadotavinho
          </div>
        </div>
      )}
      {/* cliffhanger: a message nobody opens yet */}
      {t >= notifT && (
        <div style={{ position: 'absolute', left: 50, right: 50, top: Math.round(260 - 220 * (1 - easeOutCubic(clamp01((t - notifT) / 0.3)))), background: '#ffffff', border: '6px solid #1b1420', borderRadius: 34, padding: '22px 30px', fontFamily: FONT, fontWeight: 900, fontSize: 46, color: '#1b1420', boxShadow: '0 14px 26px rgba(0,0,0,0.45)', transform: `rotate(${1.5 * Math.sin(t * 20) * (1 - clamp01((t - notifT - 0.4) / 0.3))}deg)` }}>
          🌹 Dona Celeste<div style={{ fontWeight: 700, fontSize: 38, color: '#e2453c' }}>1 nova mensagem</div>
        </div>
      )}
      <PhraseCaptions timings={timings} t={t} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 120, textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 28, color: 'rgba(255,244,224,0.9)', textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>{timings.handle}</div>
      <Audio src={staticFile(`videos/${videoId}/voice.wav`)} />
      <Sfx cues={cues} timings={timings} />
      <Music timings={timings} src={timings.music} />
      {void last}
    </AbsoluteFill>
  );
};
