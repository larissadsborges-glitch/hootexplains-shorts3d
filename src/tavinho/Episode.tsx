import React from 'react';
import { limitSfx, type Cue } from '../audio/Sfx';
import { clamp01, easeOutBack, easeOutCubic } from '../lib/anim';
import { TitleCard } from '../overlays/Overlays';
import type { MoneyTimeline } from '../scenes/money/timeline';
import type { ShortProps, Timings } from '../types';
import { Camila, PAL } from './cast';
import { EP_AUDIO } from './epAudio';
import { EP_CACHORRA } from './epCachorra';
import { Bed, Building, ChatSogra, Fridge, Group, Sunday, Table12, Trash, Typing, Vote } from './scenes';
import { Cliffhanger, EpisodeShell, FollowPill, FONT, RedCard, twistDip, W, type EpConfig, type ShotRow } from './Shell';

/** Sound cues for EP1, all pinned to spoken words. Story cues first: limitSfx keeps at most 2 at once and drops the later-listed filler. */
const cuesEp1 = (tm: Timings, T: MoneyTimeline): Cue[] => {
  const c: Cue[] = [
    // twist sting on "Mas a Camila manda": a low hit while the music dips (see musicDip)
    { at: T.s('camilamsg') - 0.02, sfx: 'hit', volume: 0.9 },
    // riser into the final question
    { at: T.s('decide') - 0.9, sfx: 'riser', volume: 0.3 },
    { at: T.s('twelve') - 0.1, sfx: 'pop', volume: 0.2 },
    { at: W(T, 'twelve', 'natal', 1.1) - 0.1, sfx: 'pop', volume: 0.2 },
    { at: W(T, 'twelve', 'doze', 2.5) - 0.1, sfx: 'pop', volume: 0.2 },
    { at: W(T, 'stakes', 'ovo', 2.8) + 0.05, sfx: 'splat', volume: 0.3 },
    { at: W(T, 'twelve', 'quarenta', 2.0) - 0.05, sfx: 'pop', volume: 0.25 },
    { at: W(T, 'lie', 'fui', 0.9), sfx: 'ping', volume: 0.2 },
    { at: W(T, 'market', 'quatro', 1.0), sfx: 'ping', volume: 0.3 },
    // the microwave's PIM! (same time as the PIM! text in scenes.tsx Trash)
    { at: W(T, 'market', 'micro-ondas', 1.8), sfx: 'ding', volume: 0.3 },
    { at: W(T, 'building', 'fritou', 1.9) + 0.3, sfx: 'alarm', volume: 0.18 },
    { at: W(T, 'building', 'desceu', 4.9) - 0.3, sfx: 'siren', volume: 0.12, dur: 2.5 },
    { at: W(T, 'camilamsg', 'camila', 0.4) - 0.1, sfx: 'ping', volume: 0.22 },
    { at: T.s('group') + 0.6, sfx: 'notif', volume: 0.22 },
    { at: W(T, 'percent', 'dois', 0.9), sfx: 'toggle', volume: 0.2 },
    { at: T.s('mission'), sfx: 'riser', volume: 0.18 },
    { at: T.s('video'), sfx: 'swish', volume: 0.18 },
    { at: T.s('vo'), sfx: 'swish', volume: 0.18 },
    { at: T.s('decide') + 0.3, sfx: 'ping', volume: 0.22 },
  ];
  // typing clicks while he writes the truth
  const ts = W(T, 'truth', 'decide', 0.6), te = W(T, 'truth', 'verdade', 1.7);
  for (let x = ts; x < te; x += 0.16) c.push({ at: x, sfx: 'toggle', volume: 0.08 });
  tm.beats.slice(1).forEach((b, i) => { if (b.shot !== tm.beats[i].shot) c.push({ at: b.start - 0.06, sfx: 'swish', volume: 0.14 }); });
  return limitSfx(c, 2);
};

/**
 * Shot plan from tavinho/ep01/SHOTS.md (script v4): per beat event, one row per caption phrase (extra phrases reuse the last row).
 * Two phrases in a row with the same framing are one shot (no cut), so a one-word phrase never restarts the move.
 */
const SHOT_PLAN: Record<string, ShotRow[]> = {
  hook: [[540, 700, 2.0, 'push', 'shock'], [480, 940, 1.6, 'drift', 'worried'], [540, 960, 1.0, 'push', 'gulp']],
  twelve: [[540, 640, 2.0, 'push'], [540, 760, 1.8, 'push'], [540, 760, 1.8, 'push'], [540, 840, 1.6, 'shake'], [540, 900, 1.25, 'push'], [540, 900, 1.25, 'push']],
  you: [[540, 960, 1.0, 'push', 'worried'], [540, 760, 1.5, 'drift', 'shock'], [540, 900, 1.15, 'push', 'neutral']],
  stakes: [[540, 900, 1.12, 'push', 'worried'], [190, 1200, 2.4, 'push', 'gulp'], [790, 1150, 2.0, 'shake', 'shock']],
  lasagna: [[540, 960, 1.0, 'push', 'neutral'], [540, 1250, 2.0, 'push', 'happy']],
  lie: [[230, 1060, 2.3, 'push', 'happy'], [800, 1000, 2.0, 'drift', 'neutral'], [640, 900, 1.4, 'push', 'proud']],
  market: [[540, 960, 1.0, 'shake'], [540, 1150, 1.9, 'push'], [560, 720, 1.2, 'push'], [560, 460, 2.2, 'shake']],
  fridge: [[540, 960, 1.0, 'push'], [500, 900, 1.8, 'drift'], [510, 1240, 1.5, 'push'], [470, 1230, 1.55, 'push']],
  building: [[540, 960, 1.0, 'push', 'worried'], [640, 600, 1.9, 'drift', 'gulp'], [540, 1250, 2.2, 'push', 'shock'], [540, 960, 1.05, 'push', 'gulp'], [320, 1470, 1.9, 'shake', 'worried']],
  follow: [[540, 1210, 2.4, 'push', 'gulp'], [540, 960, 1.0, 'push', 'worried']],
  truth: [[540, 1000, 1.25, 'push', 'neutral'], [540, 1300, 1.8, 'drift', 'worried']],
  camilamsg: [[200, 1250, 2.3, 'roll', 'shock'], [540, 960, 1.05, 'push', 'shock'], [200, 1250, 2.3, 'drift', 'worried'], [540, 1300, 1.8, 'push', 'gulp'], [200, 1250, 2.3, 'shake', 'shock']],
  group: [[600, 620, 1.6, 'push'], [600, 620, 1.6, 'push'], [560, 600, 1.45, 'shake'], [540, 960, 1.05, 'push']],
  noreturn: [[540, 1300, 1.8, 'drift', 'worried'], [200, 1250, 2.3, 'push', 'gulp']],
  percent: [[540, 620, 2.0, 'push', 'gulp'], [540, 1000, 1.45, 'push', 'worried'], [540, 1000, 1.45, 'push', 'worried'], [540, 1050, 1.3, 'drift', 'happy']],
  mission: [[540, 960, 1.0, 'push', 'worried'], [540, 900, 1.3, 'push', 'shock'], [540, 1000, 1.15, 'drift', 'worried']],
  video: [[540, 960, 1.0, 'push', 'neutral'], [337, 900, 1.6, 'push', 'happy'], [540, 960, 1.0, 'push', 'worried'], [337, 900, 1.6, 'shake', 'gulp']],
  vo: [[540, 960, 1.0, 'push', 'worried'], [743, 820, 1.7, 'push', 'worried'], [743, 820, 1.7, 'push', 'worried'], [540, 980, 1.1, 'push', 'worried'], [743, 800, 1.5, 'push', 'shock'], [540, 960, 1.0, 'shake', 'gulp']],
  decide: [[540, 960, 1.0, 'push', 'worried'], [540, 900, 1.12, 'shake', 'gulp']],
};

/** EP1's own overlays: the MENTIRA card, DOMINGO tag, hook text, days chip, CHEF bar, follow ask, notifications. */
const OverlaysEp1: EpConfig['Overlays'] = ({ T, t, timings }) => {
  const beat = timings.beats.reduce((b, x) => (t >= x.start ? x : b), timings.beats[0]);
  const days = W(T, 'twelve', 'quarenta', 2.0) - 0.05;
  const pct = W(T, 'percent', 'dois', 0.9);
  const camT = W(T, 'camilamsg', 'camila', 0.4) - 0.1;
  const mentiraEnd = T.s('market') + Math.max(1.0, Math.min(1.5, W(T, 'market', 'mercado', 1.5) - T.s('market') - 0.05));
  return (
    <>
      <RedCard t={t} t0={T.s('market')} t1={mentiraEnd} word="MENTIRA" num="#1" tag={'"FUI EU QUE FIZ"'} qa="fui" />
      {beat.shot === 'sunday' && (
        <div data-qa-label="domingo" style={{ position: 'absolute', left: 60, top: 300, background: '#fff4e0', border: '5px solid #1b1420', borderRadius: 14, padding: '6px 22px', fontFamily: FONT, fontWeight: 900, fontSize: 40, color: '#1b1420', transform: 'rotate(-4deg)' }}>DOMINGO</div>
      )}
      {/* hook text, matching the spoken hook */}
      <TitleCard line1="MENTIU" line2="PRA SOGRA" t={t} tIn={-0.7} tOut={T.s('twelve') - 0.05} top="12%" />
      {/* days counter: on from "quarenta"; the chip and the CHEF bar make room for the vote panels' own titles */}
      {t >= days && t < T.s('video') + 0.3 && (
        <div style={{ opacity: 1 - clamp01((t - T.s('video')) / 0.3) }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 200, display: 'flex', justifyContent: 'center' }}>
          <div data-qa-label="dias" style={{ background: '#1b1420', border: '4px solid #fff4e0', borderRadius: 20, padding: '6px 26px', fontFamily: FONT, fontWeight: 900, fontSize: 44, color: '#fff4e0', letterSpacing: 2, transform: `scale(${easeOutBack(clamp01((t - days) / 0.25)) * (1 + 0.5 * Math.exp(-Math.max(0, t - days - 0.25) * 4))})` }}>
            FALTAM <span style={{ color: PAL.orange }}>49</span> DIAS
          </div>
        </div>
        </div>
      )}
      {/* CHEF % bar: on from "dois por cento" */}
      {t >= T.s('mission') && t < T.s('video') + 0.3 && (
        <div data-qa-label="chef" style={{ opacity: 1 - clamp01((t - T.s('video')) / 0.3), position: 'absolute', left: 140, right: 140, top: 282, transform: `scale(${easeOutBack(clamp01((t - pct) / 0.25))})` }}>
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 30, color: '#fff4e0', textAlign: 'center', marginBottom: 6 }}>CHEF <span style={{ color: Math.floor(t * 4) % 2 ? PAL.orange : '#fff4e0' }}>2%</span></div>
          <div style={{ height: 30, borderRadius: 15, background: '#2c3550', border: '4px solid #fff4e0', overflow: 'hidden' }}>
            <div style={{ width: '4%', height: '100%', background: PAL.mint }} />
          </div>
        </div>
      )}
      {/* follow ask at the laugh peak */}
      <FollowPill t={t} t0={T.s('follow')} t1={T.s('truth') - 0.05} text="SEGUE O @avidadotavinho" />
      {/* cliffhanger: a message nobody opens yet */}
      <Cliffhanger t={t} t0={T.s('decide') + 0.3} who="🌹 Dona Celeste" line="1 nova mensagem" qa="celeste" />
      {/* Camila's message drops in like a phone notification and stays up through the face cut-ins */}
      {t >= camT && t < T.s('group') && (
        <div data-qa-label="camila" style={{ position: 'absolute', left: 70, right: 70, top: Math.round(300 - 420 * (1 - easeOutCubic(clamp01((t - camT) / 0.25)))), display: 'flex', alignItems: 'center', gap: 22, background: '#ffffff', border: '6px solid #1b1420', borderRadius: 34, padding: '18px 26px', boxShadow: '0 14px 26px rgba(0,0,0,0.45)' }}>
          <svg viewBox="380 640 320 320" width={100} height={100} style={{ flex: 'none', borderRadius: 50, background: '#fff4e0', border: '4px solid #1b1420' }}><Camila t={t} mood="happy" /></svg>
          <div style={{ fontFamily: FONT, color: '#14171a', lineHeight: 1.25 }}>
            <div style={{ fontWeight: 900, fontSize: 34 }}>Camila 💛</div>
            <div style={{ fontWeight: 700, fontSize: 32 }}>minha mãe já contou pra família <span style={{ fontWeight: 900, color: '#c8322a' }}>INTEIRA</span> 🥹</div>
          </div>
        </div>
      )}
    </>
  );
};

/** A Vida do Tavinho, T1 EP1 "A mentira". */
export const EP1: EpConfig = {
  scenes: { bed: Bed, chat: ChatSogra, table: Table12, sunday: Sunday, trash: Trash, fridge: Fridge, building: Building, typing: Typing, group: Group, vote: Vote },
  fallback: Bed,
  shotPlan: SHOT_PLAN,
  frames: {
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
  },
  cues: cuesEp1,
  musicDip: twistDip('camilamsg'),
  sepia: ['sunday'],
  foreground: (shot, t) => (
    <>
      {shot === 'building' && <g filter="url(#fgBlur)" opacity={0.85} transform={`translate(${-40 * Math.sin(t * 0.3)} 0)`}><rect x={-40} y={300} width={70} height={1700} fill="#0e1430" /><ellipse cx={-5} cy={300} rx={70} ry={40} fill="#ffd98a" opacity={0.8} /></g>}
      {shot === 'typing' && <g filter="url(#fgBlur)" opacity={0.9}><ellipse cx={-60} cy={1820} rx={360} ry={260} fill="#7fb2df" /></g>}
    </>
  ),
  Overlays: OverlaysEp1,
};

/** Every episode, by video id (the composition "Tavinho" renders any of them). */
export const EPISODES: Record<string, EpConfig> = { tavinho1: EP1, tavinho1nb: EP1, tavaudio: EP_AUDIO, tavcachorra: EP_CACHORRA };

/** Sound cues of whichever episode these timings belong to (used by scripts/qa/tavinho.mjs). */
export const cuesFor = (tm: Timings, T: MoneyTimeline): Cue[] => (EPISODES[tm.id] ?? EP1).cues(tm, T);

/** A Vida do Tavinho: any episode. */
export const TavinhoEpisode: React.FC<ShortProps> = (props) => <EpisodeShell {...props} cfg={EPISODES[props.videoId] ?? EP1} />;
