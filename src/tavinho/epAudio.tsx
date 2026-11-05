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

/* "A Vida do Tavinho": O ÁUDIO (videos/tavaudio/script.json, tavinho/especiais/ROTEIROS.md). */

const BedA: SceneFC = (p) => (
  // present day: Saturday morning in the kitchen, still in pyjamas
  <HomeSet.Provider value={{ set: 'kitchen', outfit: 'pajama', screen: <g><rect x={-40} y={-20} width={104} height={46} rx={14} fill="#3ddc97" /><text x={12} y={11} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={20} fill="#14171a">🎤 3:12</text></g> }}>
    <BedMeter.Provider value={{ label: 'EMPREGO', value: '3%', word: 'três', fill: 26, micro: false }}><Bed {...p} /></BedMeter.Provider>
  </HomeSet.Provider>
);

const VoteA = makeVote({
  question: 'HACKER ou DESCULPA?',
  questionWord: 'hacker',
  mission: (t) => <Tavinho t={t} mood="worried" sweat={0.8} slip={0.8} outfit="pajama" />,
  left: {
    title: 'HACKER', cost: 'custa 1 mentira', risk: ['mas hacker não', 'imita chefe'], riskWord: 'hacker', color: PAL.orange,
    figure: (t, focus) => (
      <Tavinho t={t} mood={focus ? 'proud' : 'worried'} sweat={0.4} shades outfit="hoodie"
        armL={[[360, 1150], [300, 1300], [470, 1260]]} armR={[[720, 1150], [780, 1300], [610, 1260]]}
        holdL={<g transform="translate(70 -40)"><rect x={-130} y={-80} width={260} height={160} rx={12} fill="#20232c" {...{ stroke: '#1b1420', strokeWidth: 6 }} /><rect x={-114} y={-66} width={228} height={130} rx={8} fill="#0f2a18" />{['01001', '10110', '0111'].map((l, i) => <text key={i} x={-100} y={-30 + i * 40} fontFamily="monospace" fontWeight={700} fontSize={30} fill="#3ddc97">{l}</text>)}</g>} />
    ),
    gag: (t) => <g>{[0, 1, 2, 3].map((i) => { const k = (t * 0.7 + i * 0.25) % 1; return <text key={i} x={60 + i * 120} y={1000 - 300 * k} fontFamily="monospace" fontWeight={900} fontSize={36} fill="#3ddc97" opacity={0.8 * (1 - k)}>{i % 2 ? '1010' : '0110'}</text>; })}</g>,
  },
  right: {
    title: 'DESCULPA', cost: 'custa a vergonha', risk: ['mas o chefe quer', 'ouvir junto'], riskWord: 'chefe', color: '#3a5ba0',
    figure: (t, focus) => (
      <Tavinho t={t} mood={focus ? 'gulp' : 'worried'} sweat={1} slip={0.6}
        armL={[[360, 1150], [300, 1300], [440, 1240]]} armR={[[720, 1150], [780, 1300], [640, 1240]]}
        holdL={<g transform="translate(100 -70)"><rect x={-190} y={-90} width={380} height={170} rx={14} fill="#ffffff" {...{ stroke: '#1b1420', strokeWidth: 7 }} /><text x={0} y={20} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={58} fill="#c8322a">DESCULPA</text></g>} />
    ),
  },
});

const cuesA = (tm: Timings, T: MoneyTimeline): Cue[] => {
  const c: Cue[] = [
    { at: T.s('twist') - 0.02, sfx: 'hit', volume: 0.9 },
    { at: T.s('decide') - 0.9, sfx: 'riser', volume: 0.3 },
    { at: T.s('punch') - 0.1, sfx: 'pop', volume: 0.25 },
    { at: W(T, 'stakes', 'segunda', 1.0), sfx: 'pop', volume: 0.2 },
    { at: W(T, 'rant', 'cara', 1.6) - 0.1, sfx: 'pop', volume: 0.25 },
    { at: W(T, 'rant2', 'imitou', 0.6) - 0.1, sfx: 'pop', volume: 0.22 },
    { at: T.s('card'), sfx: 'pop', volume: 0.3 },
    { at: T.s('contacts') + 0.2, sfx: 'pop', volume: 0.2 },
    { at: T.s('detail') + 0.15, sfx: 'pop', volume: 0.2 },
    { at: T.s('truth'), sfx: 'toggle', volume: 0.2 },
    { at: W(T, 'twist', 'risquinhos', 1.6), sfx: 'ping', volume: 0.25 },
    { at: T.s('noreturn'), sfx: 'notif', volume: 0.22 },
    { at: W(T, 'percent', 'três', 2.4), sfx: 'toggle', volume: 0.2 },
    { at: T.s('mission'), sfx: 'riser', volume: 0.18 },
    { at: T.s('video'), sfx: 'swish', volume: 0.18 },
    { at: T.s('vo'), sfx: 'swish', volume: 0.18 },
    { at: T.s('decide') + 0.3, sfx: 'ping', volume: 0.22 },
  ];
  tm.beats.slice(1).forEach((b, i) => { if (b.shot !== tm.beats[i].shot) c.push({ at: b.start - 0.06, sfx: 'swish', volume: 0.14 }); });
  return limitSfx(c, 2);
};

const SHOTS: Record<string, ShotRow[]> = {
  hook: [[540, 700, 2.0, 'push', 'shock'], [480, 940, 1.6, 'drift', 'worried'], [540, 700, 2.2, 'push', 'gulp'], [540, 960, 1.0, 'push', 'worried']],
  punch: [[580, 560, 1.8, 'shake']],
  you: [[540, 960, 1.0, 'push', 'worried'], [540, 760, 1.5, 'drift', 'shock'], [540, 900, 1.15, 'push', 'neutral']],
  stakes: [[540, 960, 1.0, 'push'], [800, 560, 1.8, 'push'], [480, 1050, 1.8, 'push']],
  back: [[540, 960, 1.0, 'push', 'neutral'], [540, 960, 1.0, 'push', 'neutral'], [540, 900, 1.3, 'drift', 'happy']],
  rant: [[540, 860, 1.6, 'push', 'happy'], [540, 860, 1.6, 'push', 'happy'], [560, 620, 1.22, 'push', 'happy'], [560, 620, 1.22, 'shake', 'proud']],
  rant2: [[540, 760, 1.2, 'push', 'proud'], [560, 760, 1.22, 'push', 'happy']],
  card: [[540, 960, 1.0, 'shake'], [540, 620, 1.6, 'push']],
  contacts: [[600, 640, 1.7, 'push'], [600, 640, 1.7, 'push'], [620, 620, 1.4, 'shake']],
  detail: [[580, 600, 1.8, 'push'], [600, 680, 1.4, 'drift'], [190, 1110, 2.3, 'push', 'gulp']],
  follow: [[190, 1110, 2.3, 'push', 'gulp'], [540, 960, 1.0, 'push', 'worried']],
  truth: [[560, 800, 1.15, 'push', 'neutral'], [540, 820, 1.7, 'push', 'worried']],
  twist: [[190, 1110, 2.3, 'roll', 'shock'], [620, 600, 1.6, 'push'], [620, 600, 1.6, 'shake']],
  twist2: [[540, 460, 1.8, 'push', 'shock'], [540, 460, 1.8, 'drift', 'shock'], [190, 1110, 2.3, 'shake', 'gulp']],
  noreturn: [[480, 680, 1.6, 'shake', 'gulp']],
  percent: [[540, 620, 2.0, 'push', 'gulp'], [540, 1000, 1.45, 'push', 'worried'], [540, 1000, 1.45, 'push', 'worried']],
  mission: [[540, 960, 1.0, 'push', 'worried'], [540, 900, 1.3, 'push', 'shock'], [540, 1000, 1.15, 'drift', 'worried']],
  video: [[540, 960, 1.0, 'push', 'neutral'], [337, 900, 1.6, 'push', 'proud'], [337, 900, 1.6, 'push', 'proud'], [540, 960, 1.0, 'push', 'worried'], [337, 900, 1.6, 'shake', 'gulp']],
  vo: [[540, 960, 1.0, 'push', 'worried'], [743, 880, 1.7, 'push', 'worried'], [743, 880, 1.7, 'push', 'worried'], [540, 980, 1.1, 'push', 'worried'], [743, 860, 1.5, 'push', 'shock'], [540, 960, 1.0, 'shake', 'gulp']],
  decide: [[540, 960, 1.0, 'push', 'worried'], [540, 920, 1.0, 'shake', 'gulp']],
};

const OverlaysA: EpConfig['Overlays'] = ({ T, t, timings }) => {
  const beat = timings.beats.reduce((b, x) => (t >= x.start ? x : b), timings.beats[0]);
  const seg = W(T, 'stakes', 'segunda', 1.0) - 0.05;
  const pct = W(T, 'percent', 'três', 2.4);
  const cardEnd = T.s('card') + Math.min(1.5, T.s('contacts') - T.s('card') - 0.05);
  return (
    <>
      <RedCard t={t} t0={T.s('card')} t1={cardEnd} word="ERRO" num="#1" tag="CONTATO ERRADO" qa="erro" />
      {beat.shot === 'friday' && (
        <div data-qa-label="sexta" style={{ position: 'absolute', left: 60, top: 300, background: '#fff4e0', border: '5px solid #1b1420', borderRadius: 14, padding: '6px 22px', fontFamily: FONT, fontWeight: 900, fontSize: 40, color: '#1b1420', transform: 'rotate(-4deg)' }}>SEXTA 18:00</div>
      )}
      <TitleCard line1="ÁUDIO FALANDO" line2="MAL DO CHEFE" t={t} tIn={-0.7} tOut={T.s('punch') - 0.05} top="12%" />
      {/* the meeting chip: on from "segunda" until the vote */}
      {t >= seg && t < T.s('video') + 0.3 && (
        <div style={{ opacity: 1 - clamp01((t - T.s('video')) / 0.3), position: 'absolute', left: 0, right: 0, top: 200, display: 'flex', justifyContent: 'center' }}>
          <div data-qa-label="reuniao" style={{ background: '#1b1420', border: '4px solid #fff4e0', borderRadius: 20, padding: '6px 26px', fontFamily: FONT, fontWeight: 900, fontSize: 44, color: '#fff4e0', letterSpacing: 2, transform: `scale(${easeOutBack(clamp01((t - seg) / 0.25)) * (1 + 0.5 * Math.exp(-Math.max(0, t - seg - 0.25) * 4))})` }}>
            REUNIÃO: <span style={{ color: PAL.orange }}>SEGUNDA 9H</span>
          </div>
        </div>
      )}
      {/* the job bar from the mission card on */}
      {t >= T.s('mission') && t < T.s('video') + 0.3 && (
        <div data-qa-label="chef" style={{ opacity: 1 - clamp01((t - T.s('video')) / 0.3), position: 'absolute', left: 140, right: 140, top: 282, transform: `scale(${easeOutBack(clamp01((t - pct) / 0.25))})` }}>
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 30, color: '#fff4e0', textAlign: 'center', marginBottom: 6 }}>EMPREGO <span style={{ color: Math.floor(t * 4) % 2 ? PAL.orange : '#fff4e0' }}>3%</span></div>
          <div style={{ height: 30, borderRadius: 15, background: '#2c3550', border: '4px solid #fff4e0', overflow: 'hidden' }}>
            <div style={{ width: '5%', height: '100%', background: PAL.mint }} />
          </div>
        </div>
      )}
      <FollowPill t={t} t0={T.s('follow')} t1={T.s('truth') - 0.05} text="SEGUE O @avidadotavinho" />
      <Cliffhanger t={t} t0={T.s('decide') + 0.3} who="👔 Seu Valdir" line="🎤 áudio (4:07)" qa="cliff" />
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
      {shot === 'office' && <g filter="url(#fgBlur)" opacity={0.85} transform={`translate(${-30 * Math.sin(t * 0.4)} 0)`}><rect x={940} y={1300} width={220} height={700} rx={40} fill="#3a6b3a" /><ellipse cx={1050} cy={1290} rx={160} ry={120} fill="#4f8f4a" /></g>}
      {shot === 'audiochat' && <g filter="url(#fgBlur)" opacity={0.8}><ellipse cx={1140} cy={1850} rx={300} ry={220} fill="#7fb2df" /></g>}
    </>
  ),
  Overlays: OverlaysA,
};
