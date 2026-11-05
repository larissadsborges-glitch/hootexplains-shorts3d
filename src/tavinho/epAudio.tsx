import React from 'react';
import { limitSfx, type Cue } from '../audio/Sfx';
import { clamp01, easeOutBack } from '../lib/anim';
import { TitleCard } from '../overlays/Overlays';
import type { MoneyTimeline } from '../scenes/money/timeline';
import type { Timings } from '../types';
import { PAL, Tavinho } from './cast';
import { Bed, BedMeter, HomeSet } from './scenes';
import { AudioChat, Contacts, Friday, Office } from './scenesAudio';
import { makeVote } from './scenesVote';
import { Cliffhanger, FollowPill, FONT, RedCard, twistDip, W, type EpConfig, type SceneFC, type ShotRow } from './Shell';

/* "A Vida do Tavinho": O ÁUDIO, dia 1 de 12 (videos/tavaudio/script.json, tavinho/especiais/ROTEIROS.md).
   Series format: every day ends on a vote; the next day's video starts from the winning option. */

const BedA: SceneFC = (p) => (
  // the present (Friday evening, minutes after): the kitchen, still in his work clothes
  <HomeSet.Provider value={{ set: 'kitchen', outfit: 'work', screen: <g><rect x={-40} y={-20} width={104} height={46} rx={14} fill="#3ddc97" /><text x={12} y={11} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={20} fill="#14171a">🎤 3:12</text></g> }}>
    <BedMeter.Provider value={{ label: 'EMPREGO', value: '3%', word: 'três', fill: 26, micro: false }}><Bed {...p} /></BedMeter.Provider>
  </HomeSet.Provider>
);

/** A phone held in front of him; `screen` is drawn in screen coords (0..132 × 0..232). */
const HeldPhone: React.FC<{ screen: React.ReactNode }> = ({ screen }) => (
  <g transform="translate(70 -60)">
    <rect x={-80} y={-130} width={160} height={260} rx={22} fill="#20232c" stroke="#1b1420" strokeWidth={6} />
    <g transform="translate(-66 -116)"><rect x={0} y={0} width={132} height={232} rx={14} fill="#ffffff" />{screen}</g>
  </g>
);

const VoteA = makeVote({
  question: 'APAGA ou DISFARÇA?',
  questionWord: 'apaga',
  missionLabel: 'DIA 1',
  mission: (t) => <Tavinho t={t} mood="worried" sweat={0.8} slip={0.8} />,
  left: {
    title: 'APAGAR', cost: 'é rápido', risk: ['mas ele pode', 'já ter visto'], riskWord: 'visto', color: PAL.orange,
    figure: (t, focus) => (
      <Tavinho t={t} mood={focus ? 'proud' : 'worried'} sweat={0.6}
        armL={[[360, 1150], [300, 1300], [470, 1260]]} armR={[[720, 1150], [780, 1300], [610, 1260]]}
        holdL={<HeldPhone screen={<g><rect x={0} y={0} width={132} height={44} rx={14} fill="#3a5ba0" /><text x={66} y={150} textAnchor="middle" fontSize={84}>🗑️</text><text x={66} y={210} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={17} fill="#c8322a">APAGAR</text></g>} />} />
    ),
  },
  right: {
    title: 'DISFARÇAR', cost: 'custa 1 mentira', risk: ['mas ele vai', 'perguntar pra quem'], riskWord: 'quem', color: '#3a5ba0',
    figure: (t, focus) => (
      <Tavinho t={t} mood={focus ? 'happy' : 'worried'} sweat={1} slip={0.6} stache={1}
        armL={[[360, 1150], [300, 1300], [470, 1260]]} armR={[[720, 1150], [780, 1300], [610, 1260]]}
        holdL={<HeldPhone screen={<g><rect x={0} y={0} width={132} height={44} rx={14} fill="#3a5ba0" /><rect x={8} y={70} width={116} height={92} rx={14} fill="#3ddc97" /><text x={66} y={104} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={15} fill="#14171a">era pra outra</text><text x={66} y={130} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={15} fill="#14171a">pessoa 😅</text></g>} />} />
    ),
  },
});

const cuesA = (tm: Timings, T: MoneyTimeline): Cue[] => {
  const on = T.s('twist') + 0.3;
  const c: Cue[] = [
    { at: T.s('twist') - 0.02, sfx: 'hit', volume: 0.9 },
    { at: on, sfx: 'notif', volume: 0.25 },
    { at: T.s('decide') - 0.9, sfx: 'riser', volume: 0.3 },
    { at: T.s('punch') - 0.1, sfx: 'pop', volume: 0.25 },
    { at: W(T, 'stakes', 'volta', 0.8) - 0.1, sfx: 'pop', volume: 0.22 },
    { at: W(T, 'stakes', 'marcou', 2.6) - 0.1, sfx: 'ping', volume: 0.2 },
    { at: W(T, 'rant', 'cara', 1.6) - 0.1, sfx: 'pop', volume: 0.25 },
    { at: W(T, 'rant2', 'imitou', 0.6) - 0.1, sfx: 'pop', volume: 0.22 },
    { at: T.s('card') + 0.05, sfx: 'toggle', volume: 0.2 },
    { at: W(T, 'card', 'contato', 0.8) - 0.03, sfx: 'pop', volume: 0.3 },
    { at: T.s('detail') + 0.15, sfx: 'pop', volume: 0.2 },
    { at: W(T, 'percent', 'três', 1.4), sfx: 'toggle', volume: 0.2 },
    { at: T.s('decide') + 1.2, sfx: 'gulp', volume: 0.3 },
    { at: T.s('mission'), sfx: 'riser', volume: 0.18 },
    { at: T.s('video'), sfx: 'swish', volume: 0.18 },
    { at: T.s('vo'), sfx: 'swish', volume: 0.18 },
    { at: T.s('decide') + 0.3, sfx: 'ping', volume: 0.22 },
  ];
  tm.beats.slice(1).forEach((b, i) => { if (b.shot !== tm.beats[i].shot) c.push({ at: b.start - 0.06, sfx: 'swish', volume: 0.14 }); });
  return limitSfx(c, 2);
};

// one row per caption phrase (a beat's extra phrases reuse its last row)
const SHOTS: Record<string, ShotRow[]> = {
  hook: [[540, 800, 1.5, 'push', 'shock'], [480, 940, 1.6, 'drift', 'worried'], [540, 700, 2.2, 'push', 'gulp'], [540, 960, 1.0, 'push', 'worried']],
  punch: [[580, 560, 1.8, 'shake']],
  you: [[540, 960, 1.0, 'push', 'worried'], [540, 760, 1.5, 'drift', 'shock'], [540, 900, 1.15, 'push', 'neutral']],
  stakes: [[540, 960, 1.0, 'push'], [500, 1020, 1.7, 'push'], [650, 873, 1.1, 'push'], [650, 873, 1.1, 'push'], [700, 835, 1.15, 'push'], [700, 835, 1.15, 'push']],
  back: [[540, 960, 1.0, 'push', 'neutral'], [540, 900, 1.3, 'drift', 'happy']],
  rant: [[540, 860, 1.6, 'push', 'happy'], [560, 620, 1.22, 'push', 'happy'], [560, 620, 1.22, 'shake', 'proud']],
  rant2: [[540, 760, 1.2, 'push', 'proud'], [560, 760, 1.22, 'push', 'happy']],
  card: [[600, 640, 1.7, 'push']],
  detail: [[580, 600, 1.8, 'push'], [600, 680, 1.4, 'drift']],
  follow: [[432, 1000, 1.25, 'push', 'gulp'], [540, 960, 1.0, 'push', 'worried']],
  twist: [[420, 430, 2.0, 'roll', 'worried'], [600, 700, 1.3, 'shake', 'shock'], [600, 700, 1.3, 'shake', 'shock']],
  percent: [[540, 700, 1.9, 'push', 'gulp'], [540, 1000, 1.45, 'push', 'worried']],
  mission: [[540, 960, 1.0, 'push', 'worried'], [540, 900, 1.3, 'push', 'shock'], [540, 1000, 1.15, 'drift', 'worried']],
  video: [[540, 960, 1.0, 'push', 'neutral'], [337, 900, 1.6, 'push', 'proud'], [540, 960, 1.0, 'push', 'worried'], [337, 900, 1.6, 'shake', 'gulp']],
  vo: [[540, 960, 1.0, 'push', 'worried'], [743, 880, 1.7, 'push', 'happy'], [743, 880, 1.7, 'push', 'happy'], [540, 980, 1.1, 'push', 'worried'], [743, 860, 1.5, 'push', 'shock']],
  decide: [[540, 960, 1.0, 'push', 'worried'], [540, 920, 1.0, 'shake', 'gulp']],
};

const OverlaysA: EpConfig['Overlays'] = ({ T, t, timings }) => {
  const beat = timings.beats.reduce((b, x) => (t >= x.start - 0.04 ? x : b), timings.beats[0]);
  const meet = W(T, 'stakes', 'reunião', 3.0) - 0.05;
  const pct = W(T, 'percent', 'três', 1.4);
  const card0 = W(T, 'card', 'contato', 0.8) - 0.05;
  return (
    <>
      <RedCard t={t} t0={card0} t1={T.s('detail') + 0.3} word="ERRO" num="#1" tag="CONTATO ERRADO" qa="erro" />
      {beat.shot === 'friday' && (
        <div data-qa-label="sexta" style={{ position: 'absolute', left: 60, top: 300, background: '#fff4e0', border: '5px solid #1b1420', borderRadius: 14, padding: '6px 22px', fontFamily: FONT, fontWeight: 900, fontSize: 40, color: '#1b1420', transform: 'rotate(-4deg)' }}>SEXTA 18:00</div>
      )}
      <TitleCard line1="ÁUDIO FALANDO" line2="MAL DO CHEFE" t={t} tIn={-0.7} tOut={T.s('punch') - 0.05} top="12%" />
      {/* the meeting chip: from "reunião" until the vote (not in the Friday flashback) */}
      {t >= meet && t < T.s('video') + 0.3 && beat.shot !== 'friday' && (
        <div style={{ opacity: 1 - clamp01((t - T.s('video')) / 0.3), position: 'absolute', left: 0, right: 0, top: 200, display: 'flex', justifyContent: 'center' }}>
          <div data-qa-label="reuniao" style={{ background: '#1b1420', border: '4px solid #fff4e0', borderRadius: 20, padding: '6px 26px', fontFamily: FONT, fontWeight: 900, fontSize: 44, color: '#fff4e0', letterSpacing: 2, transform: `scale(${easeOutBack(clamp01((t - meet) / 0.25)) * (1 + 0.5 * Math.exp(-Math.max(0, t - meet - 0.25) * 4))})` }}>
            REUNIÃO EM <span style={{ color: PAL.orange }}>12 DIAS</span>
          </div>
        </div>
      )}
      {/* the job bar from the day card on */}
      {t >= T.s('mission') && t < T.s('video') + 0.3 && (
        <div data-qa-label="chef" style={{ opacity: 1 - clamp01((t - T.s('video')) / 0.3), position: 'absolute', left: 140, right: 140, top: 282, transform: `scale(${easeOutBack(clamp01((t - pct) / 0.25))})` }}>
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 30, color: '#fff4e0', textAlign: 'center', marginBottom: 6 }}>EMPREGO <span style={{ color: Math.floor(t * 4) % 2 ? PAL.orange : '#fff4e0' }}>3%</span></div>
          <div style={{ height: 30, borderRadius: 15, background: '#2c3550', border: '4px solid #fff4e0', overflow: 'hidden' }}>
            <div style={{ width: '5%', height: '100%', background: PAL.mint }} />
          </div>
        </div>
      )}
      <FollowPill t={t} t0={T.s('follow')} t1={T.s('twist') - 0.05} text="SEGUE O @avidadotavinho" />
      <Cliffhanger t={t} t0={T.s('decide') + 0.3} who="👔 Seu Valdir · online" line="digitando…" qa="cliff" />
    </>
  );
};

export const EP_AUDIO: EpConfig = {
  scenes: { bed: BedA, audiochat: AudioChat, office: Office, friday: Friday, contacts: Contacts, vote: VoteA },
  fallback: BedA,
  shotPlan: SHOTS,
  cues: cuesA,
  musicDip: twistDip('twist'),
  sepia: ['friday'],
  names: { valdir: '#c9a6ff', chefe: '#ff9a3d' },
  foreground: (shot, t) => (
    <>
      {/* a palm frond in the beach foreground */}
      {shot === 'office' && <g filter="url(#fgBlur)" opacity={0.8} transform={`translate(${-30 * Math.sin(t * 0.4)} 0)`}><path d="M1000 1920 L 1040 1200" stroke="#6b4a2c" strokeWidth={40} /><path d="M1040 1200 C 900 1150 820 1220 780 1300 M1040 1200 C 1000 1080 900 1060 840 1080 M1040 1200 C 1120 1100 1180 1140 1200 1200" fill="none" stroke="#3f8f4a" strokeWidth={60} strokeLinecap="round" /></g>}
      {shot === 'audiochat' && <g filter="url(#fgBlur)" opacity={0.8}><ellipse cx={1140} cy={1850} rx={300} ry={220} fill="#7fb2df" /></g>}
    </>
  ),
  Overlays: OverlaysA,
};
