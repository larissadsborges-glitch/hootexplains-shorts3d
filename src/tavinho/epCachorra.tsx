import React from 'react';
import { limitSfx, type Cue } from '../audio/Sfx';
import { clamp01, easeOutBack } from '../lib/anim';
import { TitleCard } from '../overlays/Overlays';
import type { MoneyTimeline } from '../scenes/money/timeline';
import type { Timings } from '../types';
import { PAL, Tavinho } from './cast';
import { Bed, BedMeter, HomeSet } from './scenes';
import { CelesteChat, Dog, Living, Note, PetShop, Street } from './scenesCachorra';
import { makeVote } from './scenesVote';
import { Cliffhanger, FollowPill, FONT, RedCard, twistDip, W, type EpConfig, type SceneFC, type ShotRow } from './Shell';

/* "A Vida do Tavinho": A CACHORRA DA SOGRA (videos/tavcachorra/script.json, tavinho/especiais/ROTEIROS.md). */

const Home: SceneFC = (p) => (
  // the living-room sofa by day, yellow tee
  <HomeSet.Provider value={{ set: 'sofa', outfit: 'tee' }}>
    <BedMeter.Provider value={{ label: 'PRINCESA', value: '4%', word: 'quatro', fill: 30, micro: false }}><Bed {...p} /></BedMeter.Provider>
  </HomeSet.Provider>
);

const VoteB = makeVote({
  question: 'GRUPO ou SALSICHA?',
  questionWord: 'grupo',
  mission: (t) => <Tavinho t={t} mood="worried" sweat={1} slip={0.8} outfit="tee" />,
  left: {
    title: 'GRUPO', cost: 'é rápido', risk: ['mas a sogra', 'está no grupo'], riskWord: 'sogra', color: PAL.orange,
    figure: (t, focus) => (
      <Tavinho t={t} mood={focus ? 'happy' : 'worried'} sweat={0.5} outfit="tee"
        armL={[[360, 1150], [300, 1300], [470, 1260]]} armR={[[720, 1150], [780, 1300], [610, 1260]]}
        holdL={<g transform="translate(70 -60)"><rect x={-80} y={-130} width={160} height={260} rx={22} fill="#20232c" {...{ stroke: '#1b1420', strokeWidth: 6 }} /><rect x={-66} y={-116} width={132} height={232} rx={14} fill="#ffffff" /><rect x={-66} y={-116} width={132} height={50} rx={14} fill="#3ddc97" /><text x={0} y={-82} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={18} fill="#14171a">Bairro 🏘️</text><text x={0} y={0} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={16} fill="#c8322a">Dona Celeste</text><text x={0} y={22} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={14} fill="#14171a">entrou no grupo</text></g>} />
    ),
  },
  right: {
    title: 'SALSICHA', cost: 'ela ama salsicha', risk: ['mas os cachorros', 'do bairro também'], riskWord: 'cachorros', color: '#3a5ba0',
    figure: (t, focus) => (
      <g>
      {([['vira', 200, 1080], ['pug', 880, 1140], ['vira', 220, 1420]] as const).map(([k, x, y], i) => <g key={i} transform={`translate(${x} ${y + 10 * Math.sin(t * 8 + i)})`}><Dog kind={k} t={t + i} /></g>)}
      <Tavinho t={t} mood={focus ? 'proud' : 'worried'} sweat={0.6} outfit="tee"
        armR={[[720, 1150], [840, 1200], [800, 1000]]}
        holdR={<g transform="rotate(-10)"><rect x={-8} y={-200} width={16} height={210} fill="#9aa6b8" {...{ stroke: '#1b1420', strokeWidth: 4 }} /><rect x={-40} y={-300} width={80} height={130} rx={40} fill="#c8643a" {...{ stroke: '#1b1420', strokeWidth: 6 }} /></g>} />
      </g>
    ),

  },
});

const cuesB = (tm: Timings, T: MoneyTimeline): Cue[] => {
  const c: Cue[] = [
    { at: T.s('twist') - 0.02, sfx: 'hit', volume: 0.9 },
    { at: T.s('decide') - 0.9, sfx: 'riser', volume: 0.3 },
    { at: 0.05, sfx: 'pop', volume: 0.22 },
    { at: T.s('punch') + 0.3, sfx: 'pop', volume: 0.25 },
    { at: T.s('stakes') + 0.2, sfx: 'pop', volume: 0.2 },
    { at: W(T, 'stakes', 'duas', 1.8) - 0.05, sfx: 'toggle', volume: 0.2 },
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
    { at: W(T, 'truth', 'cachorra', 1.6) - 0.1, sfx: 'pop', volume: 0.25 },
    { at: W(T, 'twist', 'me', 1.1) - 0.1, sfx: 'ping', volume: 0.25 },
    { at: T.s('noreturn'), sfx: 'ping', volume: 0.22 },
    { at: W(T, 'percent', 'achar', 0.9), sfx: 'toggle', volume: 0.2 },
    { at: T.s('decide') + 1.2, sfx: 'gulp', volume: 0.3 },
    { at: T.s('mission'), sfx: 'riser', volume: 0.18 },
    { at: T.s('video'), sfx: 'swish', volume: 0.18 },
    { at: T.s('vo'), sfx: 'swish', volume: 0.18 },
    { at: T.s('decide') + 0.3, sfx: 'ping', volume: 0.22 },
  ];
  // the clock ticking while he has five minutes
  for (let x = T.s('noreturn') + 0.3; x < T.s('percent') - 0.1; x += 0.5) c.push({ at: x, sfx: 'toggle', volume: 0.12 });
  tm.beats.slice(1).forEach((b, i) => { if (b.shot !== tm.beats[i].shot) c.push({ at: b.start - 0.06, sfx: 'swish', volume: 0.14 }); });
  return limitSfx(c, 2);
};

const SHOTS: Record<string, ShotRow[]> = {
  hook: [[600, 980, 1.25, 'push', 'shock'], [540, 960, 1.0, 'push', 'worried'], [600, 960, 1.4, 'push', 'gulp']],
  punch: [[540, 1000, 1.0, 'shake', 'shock'], [760, 760, 1.6, 'push', 'shock']],
  you: [[540, 960, 1.0, 'push', 'worried'], [540, 760, 1.5, 'drift', 'shock'], [540, 760, 1.5, 'drift', 'shock'], [540, 900, 1.15, 'push', 'neutral']],
  stakes: [[540, 960, 1.0, 'push', 'worried'], [760, 640, 1.5, 'push', 'gulp'], [760, 640, 1.5, 'push', 'gulp'], [420, 1000, 1.9, 'shake', 'gulp']],
  back: [[540, 960, 1.0, 'push'], [560, 780, 1.35, 'push'], [560, 780, 1.35, 'push']],
  rant: [[560, 680, 1.5, 'push'], [560, 800, 1.5, 'push'], [560, 860, 1.5, 'push'], [560, 860, 1.5, 'shake']],
  rant2: [[540, 960, 1.0, 'push'], [540, 1150, 1.28, 'push'], [760, 1120, 1.6, 'shake']],
  lunch: [[600, 1000, 1.0, 'push', 'happy'], [560, 1300, 1.6, 'push', 'happy']],
  card: [[540, 960, 1.0, 'shake'], [600, 1440, 2.0, 'push', 'neutral']],
  run: [[560, 1440, 2.0, 'push', 'shock'], [380, 1440, 2.0, 'push', 'shock'], [300, 1355, 1.7, 'shake', 'shock']],
  sit: [[540, 1100, 1.15, 'push', 'worried'], [420, 1240, 1.9, 'push', 'gulp'], [560, 960, 1.0, 'push', 'gulp']],
  follow: [[540, 1050, 1.0, 'push', 'gulp'], [420, 1190, 1.9, 'push', 'worried'], [420, 1190, 1.9, 'push', 'worried']],
  truth: [[540, 960, 1.0, 'push', 'neutral'], [560, 1000, 1.2, 'push', 'neutral'], [540, 1000, 1.1, 'shake', 'happy']],
  twist: [[190, 1110, 2.3, 'roll', 'shock'], [540, 640, 1.6, 'push', 'shock'], [540, 640, 1.6, 'push', 'shock'], [560, 640, 1.8, 'push', 'shock'], [190, 1110, 2.3, 'shake', 'gulp']],
  noreturn: [[540, 900, 1.05, 'push', 'gulp'], [560, 760, 1.5, 'shake', 'worried']],
  percent: [[540, 960, 1.0, 'push', 'gulp'], [220, 1200, 2.0, 'push', 'worried'], [540, 960, 1.05, 'shake', 'worried']],
  mission: [[540, 960, 1.0, 'push', 'worried'], [540, 900, 1.3, 'push', 'shock']],
  video: [[540, 960, 1.0, 'push', 'neutral'], [337, 900, 1.6, 'push', 'happy'], [337, 900, 1.6, 'push', 'happy'], [540, 960, 1.0, 'push', 'worried'], [337, 900, 1.6, 'shake', 'gulp']],
  vo: [[540, 960, 1.0, 'push', 'worried'], [743, 880, 1.7, 'push', 'proud'], [743, 880, 1.7, 'push', 'proud'], [540, 980, 1.1, 'push', 'worried'], [743, 860, 1.5, 'push', 'shock'], [540, 960, 1.0, 'shake', 'gulp']],
  decide: [[540, 960, 1.0, 'push', 'worried'], [540, 920, 1.0, 'shake', 'gulp']],
};

/** "SOGRA VOLTA EM 2:00" ticks down from "duas horas"; from the twist it turns red: "VÍDEO EM 5:00". */
const Timer: React.FC<{ T: MoneyTimeline; t: number }> = ({ T, t }) => {
  const t0 = W(T, 'stakes', 'duas', 1.8) - 0.05, tw = T.s('noreturn');
  if (t < t0 || t >= T.s('video') + 0.3) return null;
  const red = t >= tw;
  const secs = red ? Math.max(0, 300 - Math.floor((t - tw) * 6)) : Math.max(0, 7200 - Math.floor((t - t0) * 60));
  const label = red ? `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}` : `${Math.floor(secs / 3600)}H${String(Math.floor((secs % 3600) / 60)).padStart(2, '0')}`;
  const k = red ? tw : t0;
  return (
    <div style={{ opacity: 1 - clamp01((t - T.s('video')) / 0.3), position: 'absolute', left: 0, right: 0, top: 200, display: 'flex', justifyContent: 'center' }}>
      <div data-qa-label="timer" style={{ background: red ? '#e2453c' : '#1b1420', border: '4px solid #fff4e0', borderRadius: 20, padding: '6px 26px', fontFamily: FONT, fontWeight: 900, fontSize: 44, color: '#fff4e0', letterSpacing: 2, transform: `scale(${easeOutBack(clamp01((t - k) / 0.25)) * (1 + 0.5 * Math.exp(-Math.max(0, t - k - 0.25) * 4))})` }}>
        {red ? 'VÍDEO EM ' : 'SOGRA VOLTA EM '}<span style={{ color: red ? '#ffffff' : PAL.orange }}>{label}</span>
      </div>
    </div>
  );
};

const OverlaysB: EpConfig['Overlays'] = ({ T, t }) => {
  const pct = W(T, 'percent', 'achar', 0.9);
  const cardEnd = T.s('card') + Math.min(1.5, T.s('run') - T.s('card') - 0.05);
  return (
    <>
      <RedCard t={t} t0={T.s('card')} t1={cardEnd} word="ERRO" num="#1" tag="PORTÃO ABERTO" qa="erro" />
      <TitleCard line1="A CACHORRA" line2="FUGIU" t={t} tIn={-0.7} tOut={T.s('you') - 0.05} top="12%" />
      <Timer T={T} t={t} />
      {t >= pct && t < T.s('mission') && (
        <div data-qa-label="chef" style={{ position: 'absolute', left: 170, right: 170, top: 440, background: '#1b1420', border: '6px solid #fff4e0', borderRadius: 30, padding: '18px 30px', transform: `scale(${easeOutBack(clamp01((t - pct) / 0.25))})` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: FONT, fontWeight: 900, fontSize: 52, color: '#fff4e0' }}><span>PRINCESA</span><span style={{ color: PAL.orange }}>4%</span></div>
          <div style={{ marginTop: 12, height: 46, borderRadius: 23, background: '#2c3550', border: '4px solid #fff4e0', overflow: 'hidden' }}><div style={{ width: '6%', height: '100%', background: PAL.mint }} /></div>
        </div>
      )}
      {t >= T.s('mission') && t < T.s('video') + 0.3 && (
        <div data-qa-label="chef" style={{ opacity: 1 - clamp01((t - T.s('video')) / 0.3), position: 'absolute', left: 140, right: 140, top: 282, transform: `scale(${easeOutBack(clamp01((t - pct) / 0.25))})` }}>
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 30, color: '#fff4e0', textAlign: 'center', marginBottom: 6 }}>ACHAR A PRINCESA <span style={{ color: Math.floor(t * 4) % 2 ? PAL.orange : '#fff4e0' }}>4%</span></div>
          <div style={{ height: 30, borderRadius: 15, background: '#2c3550', border: '4px solid #fff4e0', overflow: 'hidden' }}>
            <div style={{ width: '6%', height: '100%', background: PAL.mint }} />
          </div>
        </div>
      )}
      <FollowPill t={t} t0={T.s('follow')} t1={T.s('truth') - 0.05} text="SEGUE O @avidadotavinho" />
      <Cliffhanger t={t} t0={T.s('decide') + 0.3} who="🌹 Dona Celeste" line="📹 cadê o vídeo???" qa="cliff" />
    </>
  );
};

export const EP_CACHORRA: EpConfig = {
  scenes: { living: Living, home: Home, street: Street, note: Note, petshop: PetShop, celestechat: CelesteChat, vote: VoteB },
  fallback: Living,
  shotPlan: SHOTS,
  cues: cuesB,
  musicDip: twistDip('twist'),
  names: { princesa: '#ff7ac8' },
  foreground: (shot, t) => (
    <>
      {shot === 'street' && <g filter="url(#fgBlur)" opacity={0.85} transform={`translate(${-30 * Math.sin(t * 0.4)} 0)`}><rect x={-60} y={1100} width={150} height={900} rx={30} fill="#7a8a6a" /><ellipse cx={20} cy={1080} rx={170} ry={120} fill="#5f8f4a" /></g>}
    </>
  ),
  Overlays: OverlaysB,
};
