import React, { useMemo } from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Music, Sfx, type Cue } from '../audio/Sfx';
import { clamp01, easeOutBack, easeOutCubic } from '../lib/anim';
import { Handle, TitleCard } from '../overlays/Overlays';
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
  const groups: { words: { word: string; start: number; end: number; hl: boolean }[] }[] = [];
  for (const b of timings.beats) {
    let cur: { word: string; start: number; end: number; hl: boolean }[] = [];
    b.words.forEach((w, i) => {
      cur.push({ ...w, hl: (b.highlight ?? []).map((x) => x.toLowerCase()).includes(cleanWord(w.word)) });
      const endOfPhrase = /[.,:;?!]$/.test(w.word) || cur.length >= 3 || i === b.words.length - 1;
      if (endOfPhrase) { groups.push({ words: cur }); cur = []; }
    });
  }
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
  const z = (1 + (a === 0 ? 0 : 0.06 * (1 - easeOutCubic(clamp01(since / 0.3))))) * (1 + 0.03 * clamp01(since / 5));
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
        <g transform={`translate(540 1000) scale(${z}) translate(-540 -1000)`}><Scene T={T} t={t} /></g>
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
        <div style={{ position: 'absolute', left: 140, right: 140, top: 286, transform: `scale(${easeOutBack(clamp01((t - pct) / 0.25))})` }}>
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
      <Handle handle={timings.handle} />
      <Audio src={staticFile(`videos/${videoId}/voice.wav`)} />
      <Sfx cues={cues} timings={timings} />
      <Music timings={timings} src={timings.music} />
      {void last}
    </AbsoluteFill>
  );
};
