import React from 'react';
import { limitSfx, type Cue } from '../audio/Sfx';
import { clamp01, easeOutBack } from '../lib/anim';
import { TitleCard } from '../overlays/Overlays';
import type { MoneyTimeline } from '../scenes/money/timeline';
import type { Timings } from '../types';
import { PAL, Tavinho } from './cast';
import { Bed, BedMeter, HomeSet } from './scenes';
import { CelesteChat, Living, Note, Princesa, Street } from './scenesCachorra';
import { makeVote } from './scenesVote';
import { Cliffhanger, FollowPill, FONT, RedCard, twistDip, W, type EpConfig, type SceneFC, type ShotRow } from './Shell';

/* "A Vida do Tavinho": A CACHORRA DA SOGRA, dia 1 de 15 (videos/tavcachorra/script.json, tavinho/especiais/ROTEIROS.md).
   Series format: every day ends on a vote; the next day's video starts from the winning option. */

const Home: SceneFC = (p) => (
  // the living-room sofa that evening, yellow tee
  <HomeSet.Provider value={{ set: 'sofa', outfit: 'tee' }}>
    <BedMeter.Provider value={{ label: 'NÃO PERCEBER', value: '4%', word: 'quatro', fill: 30, micro: false }}><Bed {...p} /></BedMeter.Provider>
  </HomeSet.Provider>
);

const VoteB = makeVote({
  question: 'ANTIGA ou ALMOFADA?',
  questionWord: 'antiga',
  missionLabel: 'DIA 1',
  mission: (t) => <Tavinho t={t} mood="worried" sweat={1} slip={0.8} outfit="tee" />,
  left: {
    title: 'FOTO ANTIGA', cost: 'é perfeita', risk: ['mas ela está com', 'o laço de Natal'], riskWord: 'natal', color: PAL.orange,
    figure: (t, focus) => (
      <Tavinho t={t} mood={focus ? 'proud' : 'worried'} sweat={0.5} outfit="tee"
        armL={[[360, 1150], [300, 1300], [460, 1250]]} armR={[[720, 1150], [780, 1300], [620, 1250]]}
        holdL={
          // a printed photo: Princesa with her Christmas bow, "NATAL 2024" written on it
          <g transform="translate(80 -90) rotate(-4)">
            <rect x={-170} y={-150} width={340} height={300} rx={8} fill="#ffffff" stroke="#1b1420" strokeWidth={7} />
            <rect x={-146} y={-126} width={292} height={210} fill="#ffe2df" />
            <g transform="translate(-10 0) scale(0.75)"><Princesa t={0} xmas /></g>
            <text x={0} y={128} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={30} fill="#c8322a">NATAL 2024 🎄</text>
          </g>
        } />
    ),
  },
  right: {
    title: 'ALMOFADA', cost: 'é de hoje', risk: ['mas a almofada', 'não tem cara'], riskWord: 'cara', color: '#3a5ba0',
    figure: (t, focus) => (
      <Tavinho t={t} mood={focus ? 'happy' : 'worried'} sweat={0.6} outfit="tee"
        armL={[[360, 1150], [300, 1300], [440, 1300]]} armR={[[720, 1150], [780, 1300], [640, 1300]]}
        holdL={
          // the white cushion, wearing her pink bow
          <g transform="translate(100 -40)">
            <path d="M-170 -100 C -110 -146 110 -146 170 -100 C 202 -10 202 46 170 112 C 110 146 -110 146 -170 112 C -202 46 -202 -10 -170 -100 Z" fill="#ffffff" stroke="#1b1420" strokeWidth={7} />
            <path d="M-70 -20 Q 0 14 70 -20" fill="none" stroke="#d8dde6" strokeWidth={9} strokeLinecap="round" />
            <g transform="translate(0 -128)">
              <path d="M0 0 L -96 -50 L -96 50 Z M0 0 L 96 -50 L 96 50 Z" fill="#ff5fb0" stroke="#1b1420" strokeWidth={6} strokeLinejoin="round" />
              <circle cx={0} cy={0} r={20} fill="#ff2f8f" stroke="#1b1420" strokeWidth={5} />
            </g>
          </g>
        } />
    ),
  },
});

const cuesB = (tm: Timings, T: MoneyTimeline): Cue[] => {
  const c: Cue[] = [
    { at: T.s('twist') - 0.02, sfx: 'hit', volume: 0.9 },
    { at: W(T, 'twist', 'primeira', 0.6) - 0.1, sfx: 'notif', volume: 0.25 },
    { at: T.s('decide') - 0.9, sfx: 'riser', volume: 0.3 },
    { at: 0.05, sfx: 'pop', volume: 0.22 },
    { at: T.s('punch') + 0.3, sfx: 'pop', volume: 0.25 },
    { at: T.s('stakes') + 0.2, sfx: 'pop', volume: 0.2 },
    { at: W(T, 'stakes', 'quinze', 1.4) - 0.05, sfx: 'toggle', volume: 0.2 },
    { at: W(T, 'stakes', 'foto', 2.4) - 0.1, sfx: 'pop', volume: 0.2 },
    { at: T.s('back') + 0.2, sfx: 'pop', volume: 0.2 },
    { at: W(T, 'rant', 'ração', 0.6) - 0.1, sfx: 'pop', volume: 0.2 },
    { at: W(T, 'rant', 'música', 1.5) - 0.1, sfx: 'pop', volume: 0.2 },
    { at: W(T, 'rant', 'escovar', 2.4) - 0.1, sfx: 'pop', volume: 0.2 },
    { at: T.s('rant2'), sfx: 'pop', volume: 0.22 },
    { at: W(T, 'rant2', 'oncinha', 1.2) - 0.1, sfx: 'pop', volume: 0.22 },
    // doorbell when the lunch arrives
    { at: T.s('lunch') + 0.1, sfx: 'ding', volume: 0.25 },
    { at: T.s('card'), sfx: 'pop', volume: 0.3 },
    { at: T.s('run') + 0.1, sfx: 'swish', volume: 0.2 },
    { at: W(T, 'sit', 'dois', 0.9) - 0.1, sfx: 'pop', volume: 0.22 },
    { at: W(T, 'percent', 'quatro', 0.9), sfx: 'toggle', volume: 0.2 },
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
  hook: [[600, 980, 1.25, 'push', 'shock'], [720, 1000, 1.3, 'push'], [540, 960, 1.0, 'push', 'worried'], [600, 960, 1.4, 'push', 'gulp']],
  punch: [[540, 1000, 1.0, 'shake', 'shock'], [700, 1200, 1.4, 'push', 'shock']],
  you: [[540, 960, 1.0, 'push', 'worried'], [540, 760, 1.5, 'drift', 'shock'], [540, 760, 1.5, 'drift', 'shock'], [540, 900, 1.15, 'push', 'neutral']],
  stakes: [[540, 960, 1.0, 'push', 'worried'], [600, 720, 1.35, 'push', 'gulp'], [600, 720, 1.35, 'push', 'gulp'], [640, 560, 1.5, 'shake', 'gulp'], [600, 760, 1.3, 'push', 'gulp']],
  back: [[540, 960, 1.0, 'push'], [560, 900, 1.3, 'push']],
  rant: [[560, 760, 1.45, 'push'], [560, 860, 1.45, 'push'], [560, 900, 1.45, 'push'], [560, 900, 1.45, 'shake']],
  rant2: [[540, 960, 1.0, 'push'], [540, 1150, 1.28, 'push'], [700, 1120, 1.55, 'shake']],
  lunch: [[600, 1000, 1.0, 'push', 'happy'], [560, 1300, 1.6, 'push', 'happy']],
  card: [[540, 960, 1.0, 'shake'], [600, 1320, 1.6, 'push', 'neutral']],
  run: [[540, 1000, 1.05, 'push', 'shock'], [560, 1040, 1.15, 'shake', 'shock']],
  sit: [[540, 1060, 1.1, 'push', 'shock'], [540, 1060, 1.1, 'push', 'shock'], [420, 1234, 1.4, 'push', 'gulp']],
  follow: [[540, 1182, 1.3, 'push', 'gulp'], [420, 1234, 1.4, 'push', 'worried'], [420, 1234, 1.4, 'push', 'worried']],
  twist: [[190, 1110, 2.3, 'roll', 'shock'], [540, 640, 1.6, 'push', 'shock'], [540, 640, 1.6, 'push', 'shock'], [540, 640, 1.6, 'shake', 'shock']],
  percent: [[540, 1000, 1.05, 'push', 'gulp'], [540, 1080, 1.2, 'drift', 'worried'], [540, 1000, 1.1, 'shake', 'worried']],
  mission: [[540, 960, 1.0, 'push', 'worried'], [540, 900, 1.3, 'push', 'shock']],
  video: [[540, 960, 1.0, 'push', 'neutral'], [337, 900, 1.6, 'push', 'proud'], [540, 960, 1.0, 'push', 'worried'], [337, 900, 1.6, 'push', 'worried'], [337, 900, 1.6, 'shake', 'gulp']],
  vo: [[540, 960, 1.0, 'push', 'worried'], [743, 1000, 1.4, 'push', 'happy'], [743, 1000, 1.4, 'push', 'happy'], [540, 980, 1.1, 'push', 'worried'], [743, 860, 1.5, 'push', 'shock'], [743, 860, 1.5, 'shake', 'gulp']],
  decide: [[540, 960, 1.0, 'push', 'worried'], [540, 920, 1.0, 'shake', 'gulp']],
};

/** "SOGRA VOLTA EM 15 DIAS" from "quinze" (hidden in the flashback); from the twist: "FOTO DE HOJE ❌" in red. */
const DayChip: React.FC<{ T: MoneyTimeline; t: number }> = ({ T, t }) => {
  const t0 = W(T, 'stakes', 'quinze', 1.4) - 0.05, tw = T.s('twist') - 0.05;
  if (t < t0 || t >= T.s('video') + 0.3) return null;
  if (t >= T.s('back') - 0.05 && t < tw) return null;
  const red = t >= tw;
  const k = red ? tw : t0;
  return (
    <div style={{ opacity: 1 - clamp01((t - T.s('video')) / 0.3), position: 'absolute', left: 0, right: 0, top: 200, display: 'flex', justifyContent: 'center' }}>
      <div data-qa-label="timer" style={{ background: red ? '#e2453c' : '#1b1420', border: '4px solid #fff4e0', borderRadius: 20, padding: '6px 26px', fontFamily: FONT, fontWeight: 900, fontSize: 44, color: '#fff4e0', letterSpacing: 2, transform: `scale(${easeOutBack(clamp01((t - k) / 0.25)) * (1 + 0.5 * Math.exp(-Math.max(0, t - k - 0.25) * 4))})` }}>
        {red ? <>FOTO DE HOJE: <span>❌</span></> : <>SOGRA VOLTA EM <span style={{ color: PAL.orange }}>15 DIAS</span></>}
      </div>
    </div>
  );
};

const OverlaysB: EpConfig['Overlays'] = ({ T, t }) => {
  const pct = W(T, 'percent', 'quatro', 0.9);
  const cardEnd = T.s('card') + Math.min(1.5, T.s('run') - T.s('card') - 0.05);
  return (
    <>
      <RedCard t={t} t0={T.s('card')} t1={cardEnd} word="ERRO" num="#1" tag="PORTÃO ABERTO" qa="erro" />
      <TitleCard line1="A CACHORRA" line2="FUGIU" t={t} tIn={-0.7} tOut={T.s('you') - 0.05} top="12%" />
      <DayChip T={T} t={t} />
      {t >= T.s('mission') && t < T.s('video') + 0.3 && (
        <div data-qa-label="chef" style={{ opacity: 1 - clamp01((t - T.s('video')) / 0.3), position: 'absolute', left: 140, right: 140, top: 282, transform: `scale(${easeOutBack(clamp01((t - pct) / 0.25))})` }}>
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 30, color: '#fff4e0', textAlign: 'center', marginBottom: 6 }}>SOGRA NÃO PERCEBER <span style={{ color: Math.floor(t * 4) % 2 ? PAL.orange : '#fff4e0' }}>4%</span></div>
          <div style={{ height: 30, borderRadius: 15, background: '#2c3550', border: '4px solid #fff4e0', overflow: 'hidden' }}>
            <div style={{ width: '6%', height: '100%', background: PAL.mint }} />
          </div>
        </div>
      )}
      <FollowPill t={t} t0={T.s('follow')} t1={T.s('twist') - 0.05} text="SEGUE O @avidadotavinho" />
      <Cliffhanger t={t} t0={T.s('decide') + 0.3} who="🌹 Dona Celeste" line="📸 cadê a foto???" qa="cliff" />
    </>
  );
};

export const EP_CACHORRA: EpConfig = {
  scenes: { living: Living, home: Home, street: Street, note: Note, celestechat: CelesteChat, vote: VoteB },
  fallback: Living,
  shotPlan: SHOTS,
  cues: cuesB,
  musicDip: twistDip('twist'),
  names: { princesa: '#ff7ac8' },
  Overlays: OverlaysB,
};
