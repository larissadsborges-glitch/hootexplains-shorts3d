import React, { createContext, useContext, useMemo } from 'react';
import { clamp01, easeInOutSine, easeOutBack, easeOutCubic, lerp, rng } from '../lib/anim';
import type { MoneyTimeline } from '../scenes/money/timeline';
import { INK, ink } from '../toon2d/Hook2D';
import { Hand, Limb, place } from '../toon2d/parts';
import { Camila, Celeste, PAL, Tavinho, TavinhoHead, VoDita, type Outfit } from './cast';

type P = { T: MoneyTimeline; t: number };
const F = 'Montserrat, Arial Black, sans-serif';
const pop = (t: number, t0: number, d = 0.22) => easeOutBack(clamp01((t - t0) / d));
const W = (T: MoneyTimeline, ev: string, w: string, d = 0.5) => T.wordTime(ev, w, T.s(ev) + d);

/** A generic, invented smartphone (never a real app's layout). Children are drawn inside the screen (0..560 × 0..1100). */
export const Phone: React.FC<{ x: number; y: number; s?: number; rot?: number; children?: React.ReactNode; glow?: number }> = ({ x, y, s = 1, rot = 0, children, glow = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    {glow > 0 && <ellipse cx={280} cy={550} rx={520} ry={700} fill="#8fd0ff" opacity={0.12 * glow} />}
    <rect x={-26} y={-26} width={612} height={1152} rx={70} fill="#20232c" {...ink(8)} />
    <rect x={0} y={0} width={560} height={1100} rx={48} fill="#f4f6fb" />
    <g style={{ clipPath: 'inset(0 round 48px)' }}>{children}</g>
    <rect x={220} y={14} width={120} height={22} rx={11} fill="#20232c" />
  </g>
);

/** Chat header + message bubbles inside a Phone. */
export const Chat: React.FC<{ name: string; avatar: React.ReactNode; msgs: { text: string; at: number; me?: boolean; qa?: string }[]; t: number; typing?: string; header?: string }> = ({ name, avatar, msgs, t, typing, header = '#ff7a2e' }) => {
  let y = 170;
  return (
    <g>
      <rect x={0} y={0} width={560} height={140} fill={header} />
      <circle cx={70} cy={88} r={40} fill="#fff4e0" {...ink(4)} />
      <g data-qa-avatar="1" transform="translate(70 88) scale(0.16) translate(-540 -840)">{avatar}</g>
      <text x={128} y={84} fontFamily={F} fontWeight={900} fontSize={30} fill="#fff">{name}</text>
      <text x={128} y={118} fontFamily={F} fontWeight={700} fontSize={22} fill="#fff4e0">online</text>
      {msgs.map((m, i) => {
        const p = pop(t, m.at);
        if (p <= 0) { return null; }
        const lines = m.text.split('\n');
        const h = 30 + 46 * lines.length;
        const w = Math.min(470, 40 + 19 * Math.max(...lines.map((l) => l.length)));
        const x0 = m.me ? 540 - w : 20;
        const el = (
          <g key={i} data-qa-label={m.qa} transform={`translate(${x0 + (m.me ? w : 0)} ${y}) scale(${p}) translate(${-(m.me ? w : 0)} 0)`}>
            <rect x={0} y={0} width={w} height={h} rx={26} fill={m.me ? '#3ddc97' : '#ffffff'} {...ink(4)} />
            {lines.map((l, k) => <text key={k} x={22} y={52 + 46 * k} fontFamily={F} fontWeight={800} fontSize={32} fill="#14171a">{l}</text>)}
          </g>
        );
        y += h + 22;
        return el;
      })}
      {typing !== undefined && (
        <g>
          <rect x={16} y={980} width={528} height={86} rx={43} fill="#ffffff" {...ink(4)} />
          <text x={44} y={1036} fontFamily={F} fontWeight={700} fontSize={30} fill="#14171a">{typing}{Math.floor(t * 2.5) % 2 ? '|' : ''}</text>
        </g>
      )}
    </g>
  );
};

/** The bedroom's big meter on the "percent" beat: EP1 shows CHEF 2% plus the microwave; other episodes set their own. */
export const BedMeter = createContext<{ label: string; value: string; word: string; fill: number; micro: boolean }>({ label: 'CHEF', value: '2%', word: 'dois', fill: 22, micro: true });

/** Where the "home" shots happen: EP1's bedroom at night, a morning kitchen, or the living-room sofa by day; and what he wears. */
export const HomeSet = createContext<{ set: 'bed' | 'kitchen' | 'sofa'; outfit: Outfit }>({ set: 'bed', outfit: 'work' });

/* ------------------------------------------------------------------ bedroom at night: hook, "you", "2% chef" */
export const Bed: React.FC<P> = ({ T, t }) => {
  // the "você decide" beat, until just after its last word (any episode)
  const you = t >= T.s('you') && t < T.e('you', T.s('you') + 3) + 0.3;
  const point = you ? easeOutCubic(clamp01((t - T.s('you') - 0.1) / 0.3)) : 0;
  const pct = t >= T.s('percent');
  const meter = useContext(BedMeter);
  const home = useContext(HomeSet);
  const stars = useMemo(() => { const r = rng(3); return Array.from({ length: 24 }, () => [r() * 1080, r() * 600]); }, []);
  const mood = pct ? 'gulp' : you ? 'worried' : 'shock';
  const armL = [[360, 1150], [290, 1330], [440, 1250]];
  const armR = you ? [[720, 1150], [lerp(790, 780, point), lerp(1330, 1260, point)], [lerp(640, 760, point), lerp(1250, 1300, point)]] : [[720, 1150], [790, 1330], [640, 1250]];
  return (
    <g>
      {home.set === 'bed' && (
        <g>
          <rect x={0} y={0} width={1080} height={1920} fill={PAL.navy} />
          {/* window with stars and moon */}
          <rect x={90} y={250} width={380} height={460} rx={12} fill="#0e1430" {...ink(8)} />
          {stars.map(([x, y], i) => x > 100 && x < 460 && y > 260 && y < 700 ? <circle key={i} cx={x} cy={y} r={3} fill="#fff4e0" /> : null)}
          <circle cx={380} cy={590} r={44} fill="#fff4e0" />
          <circle cx={398} cy={578} r={40} fill="#0e1430" />
          <path d="M280 250 L 280 710 M 90 480 L 470 480" stroke="#2a3360" strokeWidth={14} />
          {/* headboard */}
          <rect x={140} y={900} width={800} height={520} rx={60} fill="#7a4a2c" {...ink(8)} />
          <rect x={180} y={940} width={720} height={60} rx={30} fill="#8f5a37" />
        </g>
      )}
      {home.set === 'kitchen' && (
        <g>
          {/* morning kitchen: warm wall, tiles, sunny window, cabinets, a clock */}
          <rect x={0} y={0} width={1080} height={1920} fill="#f3dfb8" />
          {Array.from({ length: 6 }, (_, r) => Array.from({ length: 9 }, (_, c) => <rect key={`${r}-${c}`} x={c * 124 - 20} y={880 + r * 110} width={118} height={104} fill={(r + c) % 2 ? '#e9f1f4' : '#d7e6ec'} />))}
          <rect x={90} y={260} width={380} height={440} rx={12} fill="#9fdcff" {...ink(8)} />
          <circle cx={380} cy={380} r={60} fill="#ffe08a" />
          <path d="M280 260 L 280 700 M 90 480 L 470 480" stroke="#1b1420" strokeWidth={10} />
          <rect x={600} y={240} width={420} height={260} rx={14} fill="#e98b5a" {...ink(8)} />
          <path d="M810 240 L 810 500" stroke="#1b1420" strokeWidth={8} />
          {[700, 920].map((x, i) => <circle key={i} cx={x} cy={420} r={10} fill="#1b1420" />)}
          <g transform="translate(810 640)"><circle r={60} fill="#fff" {...ink(6)} /><path d={`M0 0 L ${34 * Math.sin(t * 0.7)} ${-34 * Math.cos(t * 0.7)} M0 0 L 30 0`} stroke={INK} strokeWidth={7} strokeLinecap="round" /></g>
        </g>
      )}
      {home.set === 'sofa' && (
        <g>
          {/* living room by day: mint wall, a framed picture, a lamp, the sofa behind him */}
          <rect x={0} y={0} width={1080} height={1920} fill="#cfe7d6" />
          <rect x={120} y={300} width={300} height={230} rx={8} fill="#fff4e0" {...ink(8)} />
          <path d="M150 500 L 230 400 L 290 460 L 340 410 L 390 500 Z" fill="#7fb07a" {...ink(4)} />
          <circle cx={330} cy={370} r={22} fill="#ffd21f" {...ink(3)} />
          <path d="M860 300 L 940 300 L 980 420 L 820 420 Z" fill="#ffd166" {...ink(6)} />
          <rect x={890} y={420} width={20} height={480} fill="#5a4636" {...ink(4)} />
          <rect x={120} y={900} width={840} height={540} rx={70} fill="#3f8f7a" {...ink(8)} />
          <rect x={160} y={940} width={760} height={70} rx={34} fill="#4fa58d" />
        </g>
      )}
      {/* Tavinho sitting up in bed, phone in hand, lit by the screen */}
      <g transform={place(540, 1800, 0.95)}>
        <Tavinho t={t} mood={mood} sweat={1} slip={0.4 + 0.4 * Math.abs(Math.sin(t * 0.7))} armL={armL} armR={armR} outfit={home.outfit}
          holdL={<g transform="translate(40 -60) rotate(-8)"><rect x={-60} y={-110} width={150} height={240} rx={22} fill="#20232c" {...ink(6)} /><rect x={-46} y={-96} width={122} height={212} rx={14} fill="#bfe6ff" /></g>} />
      </g>
      {home.set === 'bed' && (
        <g>
          {/* phone glow on his face */}
          <ellipse cx={540} cy={1000} rx={380} ry={420} fill="#9fdcff" opacity={0.14 + 0.03 * Math.sin(t * 9)} />
          {/* blanket */}
          <path d="M40 1480 C 240 1400 840 1400 1040 1480 L 1080 1920 L 0 1920 Z" fill="#3a5ba0" {...ink(8)} />
          {Array.from({ length: 6 }, (_, i) => <path key={i} d={`M${120 + i * 160} 1500 l 40 380`} stroke="#2c4680" strokeWidth={10} />)}
        </g>
      )}
      {home.set === 'kitchen' && (
        <g>
          {/* the breakfast table in front of him, a steaming mug */}
          <rect x={0} y={1440} width={1080} height={480} fill="#b07a48" {...ink(8)} />
          <rect x={0} y={1440} width={1080} height={40} fill="#c98f58" />
          <g transform="translate(860 1400)">
            <rect x={-60} y={-90} width={120} height={130} rx={16} fill="#ffffff" {...ink(6)} />
            <path d="M60 -60 q 50 0 50 35 q 0 35 -50 35" fill="none" {...ink(8)} />
            {[0, 1].map((i) => <path key={i} d={`M${-20 + i * 36} -110 q 14 -30 0 -60 q -14 -30 0 -60`} fill="none" stroke="#ffffff" strokeWidth={8} opacity={0.6 + 0.3 * Math.sin(t * 3 + i)} strokeLinecap="round" />)}
          </g>
        </g>
      )}
      {home.set === 'sofa' && (
        <g>
          {/* sofa seat and arms in front of his legs */}
          <rect x={60} y={1440} width={960} height={260} rx={50} fill="#4fa58d" {...ink(8)} />
          {[80, 1000].map((x, i) => <rect key={i} x={x - 80} y={1200} width={160} height={520} rx={60} fill="#3f8f7a" {...ink(8)} />)}
          <rect x={0} y={1700} width={1080} height={220} fill="#d9b98a" />
        </g>
      )}
      {/* "it's you" ring when he points */}
      {you && t >= W(T, 'you', 'decide', 0.3) - 0.1 && (
        <g data-qa-label="voce" transform={`translate(540 450) scale(${pop(t, W(T, 'you', 'decide', 0.3) - 0.1) * (t >= W(T, 'you', 'você', 1.6) - 0.1 ? 0.8 + 0.2 * pop(t, W(T, 'you', 'você', 1.6) - 0.1, 0.2) : 0.45)}) rotate(-5)`}>
          <text x={0} y={0} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={170} fill={PAL.orange} stroke="#1b1420" strokeWidth={14} paintOrder="stroke">{t >= W(T, 'you', 'você', 1.6) - 0.1 ? 'VOCÊ' : 'QUEM DECIDE?'}</text>
        </g>
      )}
      {/* "2% chef" meter, big, with a microwave on "micro-ondas" */}
      {pct && (
        <g transform={`translate(540 1150) scale(${pop(t, W(T, 'percent', meter.word, 0.9) - 0.05)})`}>
          <rect data-qa-label="chef" x={-330} y={-110} width={660} height={220} rx={30} fill="#1b1420" {...ink(6)} />
          <text x={0} y={-30} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={60} fill="#fff4e0">{meter.label}</text>
          <rect x={-280} y={10} width={560} height={60} rx={30} fill="#2c3550" stroke="#fff4e0" strokeWidth={5} />
          <rect x={-276} y={14} width={meter.fill} height={52} rx={20} fill={PAL.mint} />
          <text x={240} y={-30} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={60} fill={PAL.orange}>{meter.value}</text>
          {meter.micro && t >= W(T, 'percent', 'graças', 2.9) - 0.1 && (
            <g data-qa-label="gracas" transform={`translate(200 -215) scale(${1.6 * pop(t, W(T, 'percent', 'graças', 2.9) - 0.1)})`}>
              <rect x={-80} y={-50} width={160} height={100} rx={12} fill="#f4f6fb" {...ink(5)} />
              <rect x={-68} y={-38} width={92} height={76} rx={6} fill="#ffe9a8" {...ink(3)} />
              <rect x={34} y={-34} width={34} height={18} rx={3} fill="#14171a" />
              <circle cx={51} cy={14} r={12} fill="#c9ced6" {...ink(3)} />
            </g>
          )}
        </g>
      )}
    </g>
  );
};

/* ------------------------------------------------------------------ the sogra's message */
export const ChatSogra: React.FC<P> = ({ T, t }) => (
  <g>
    <rect x={0} y={0} width={1080} height={1920} fill={PAL.navy} />
    <Phone x={260} y={310} s={1} glow={1}>
      <Chat name="Dona Celeste 🌹" avatar={<Celeste t={t} mood="happy" />} t={t}
        msgs={[
          { text: 'vc disse que cozinha\nigual chef 😍', at: T.s('twelve') - 0.1 },
          { text: 'então a ceia de Natal\né SUA 🎄', at: W(T, 'twelve', 'natal', 1.1) - 0.1 },
          { text: 'somos 12 😘', at: W(T, 'twelve', 'doze', 2.5) - 0.1, qa: 'doze' },
        ]} />
    </Phone>
  </g>
);

/* ------------------------------------------------------------------ 12 chairs + an egg that can't be fried */
export const Table12: React.FC<P> = ({ T, t }) => {
  const s0 = T.s('stakes');
  const egg = W(T, 'stakes', 'ovo', 2.8), frita = W(T, 'stakes', 'frita', 1.4);
  const chairs = Array.from({ length: 12 }, (_, i) => ({ side: i < 6 ? -1 : 1, k: i % 6 }));
  const eggFall = clamp01((t - egg + 0.35) / 0.35);
  return (
    <g>
      <rect x={0} y={0} width={1080} height={1920} fill={PAL.cream} />
      <rect x={0} y={1380} width={1080} height={540} fill="#e8d4b0" />
      {/* long Christmas table, seen from the front-top */}
      <path d="M260 700 L 820 700 L 900 1340 L 180 1340 Z" fill="#c8322a" {...ink(8)} />
      <path d="M300 720 L 780 720 L 850 1310 L 230 1310 Z" fill="#fff4e0" {...ink(5)} />
      {chairs.map(({ side, k }, i) => {
        const p = pop(t, s0 + i * 0.035, 0.18);
        if (p <= 0) return null;
        const y = 760 + k * 105, x = side < 0 ? 250 - k * 13 : 830 + k * 13;
        return <g key={i} transform={`translate(${x} ${y}) scale(${p})`}><rect x={-46} y={-40} width={92} height={80} rx={14} fill="#7a4a2c" {...ink(6)} /></g>;
      })}
      {/* turkey in the middle */}
      <g transform="translate(540 990)"><ellipse cx={0} cy={0} rx={110} ry={70} fill="#d9873a" {...ink(7)} />{[-1, 1].map((s) => <rect key={s} x={s * 90 - 12} y={-50} width={24} height={60} rx={10} fill="#fff4e0" {...ink(4)} transform={`rotate(${s * 30} ${s * 90} -20)`} />)}</g>
      {/* "12" counter */}
      <g data-qa-label="doze" transform={`translate(540 560) scale(${pop(t, s0)})`}>
        <circle cx={0} cy={0} r={92} fill={PAL.orange} {...ink(8)} />
        <text x={0} y={34} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={96} fill="#fff">12</text>
      </g>
      {/* big "49 DIAS" on "quarenta e nove" */}
      {t >= s0 && (
        <g data-qa-label="dias" transform={`translate(540 370) scale(${pop(t, s0 + 0.1)}) rotate(-4)`}>
          <rect x={-260} y={-80} width={520} height={160} rx={24} fill="#1b1420" />
          <text x={0} y={34} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={100} fill={PAL.orange}>49 DIAS</text>
        </g>
      )}
      {/* Tavinho at the end of the table, sweating */}
      <g transform={place(190, 1700, 0.42)}><Tavinho t={t} mood={t > egg ? 'shock' : 'worried'} sweat={1} slip={0.8} /></g>
      {/* the egg drops and splats */}
      {t >= frita && eggFall <= 0 && <ellipse cx={790} cy={900 + 8 * Math.sin(t * 18)} rx={34} ry={44} fill="#fff8ec" {...ink(6)} transform={`rotate(${10 * Math.sin(t * 11)} 790 900)`} />}
      {eggFall > 0 && (eggFall < 1
        ? <ellipse cx={790} cy={lerp(900, 1300, eggFall * eggFall)} rx={34} ry={44} fill="#fff8ec" {...ink(6)} />
        : <g transform="translate(790 1310)">
            <path d="M-110 6 C -120 -20 -70 -18 -50 -30 C -20 -48 10 -10 40 -26 C 80 -44 120 -6 104 14 C 90 34 30 22 0 30 C -40 40 -100 30 -110 6 Z" fill="#fff8ec" opacity={0.9} {...ink(5)} />
            <ellipse cx={-6} cy={-2} rx={30} ry={22} fill="#ffc21f" {...ink(5)} />
            {/* cracked shell halves */}
            <path d="M-150 -10 L -96 -10 L -104 -30 L -118 -18 L -130 -34 L -142 -20 Z" fill="#fff8ec" {...ink(5)} transform="rotate(-20 -123 -20)" />
            <path d="M96 -40 L 150 -40 L 144 -60 L 130 -48 L 118 -64 L 104 -50 Z" fill="#fff8ec" {...ink(5)} transform="rotate(25 123 -50)" />
          </g>)}
    </g>
  );
};

/* ------------------------------------------------------------------ flashback: the lasagna lie (sepia) */
export const Sunday: React.FC<P> = ({ T, t }) => {
  const lie = W(T, 'lie', 'fui', 0.9);
  const puff = easeOutBack(clamp01((t - lie) / 0.3));
  return (
    <g>
      <rect x={0} y={0} width={1080} height={1920} fill="#f3e2c0" />
      <rect x={0} y={0} width={1080} height={1150} fill="#e9d3a8" />
      {[200, 540, 880].map((x, i) => <rect key={i} x={x - 70} y={300} width={140} height={180} rx={10} fill="#d9bf8c" {...ink(5)} />)}
      {/* Celeste tasting with eyes closed, Camila proud, Tavinho puffing his chest (all seated behind the table) */}
      <g transform={place(220, 1640, 0.5)}><Celeste t={t} mood="happy" /></g>
      <g transform={place(540, 1650, 0.48)}><Camila t={t} mood="happy" /></g>
      <g transform={`${place(800, 1700, 0.52)}`}><Tavinho t={t} mood={puff > 0 ? 'proud' : 'neutral'} puff={puff} sweat={0}
        armL={puff > 0 ? [[360, 1150], [250, 1280], [420, 1250]] : undefined} armR={puff > 0 ? [[720, 1150], [800, 1080], [730, 930]] : undefined} /></g>
      {/* family table, in front of their bodies */}
      <rect x={40} y={1290} width={1000} height={70} rx={14} fill="#b07a48" {...ink(8)} />
      <rect x={70} y={1356} width={940} height={300} fill="#9a6a3c" {...ink(7)} />
      {/* the lasagna on the table */}
      <g transform="translate(540 1270)"><rect x={-130} y={-50} width={260} height={70} rx={10} fill="#e05a2c" {...ink(6)} /><path d="M-120 -40 Q 0 -70 120 -40" fill="none" stroke="#ffd21f" strokeWidth={14} strokeLinecap="round" /></g>
      {/* hearts over the sogra on "amou" */}
      {t >= W(T, 'lie', 'amou', 0.3) && [0, 1, 2].map((i) => { const k = ((t - W(T, 'lie', 'amou', 0.3)) * 0.9 + i * 0.3) % 1; return <path key={i} transform={`translate(${200 + i * 50} ${980 - 260 * k}) scale(${0.8})`} d="M0 10 C -30 -20 -20 -40 0 -24 C 20 -40 30 -20 0 10 Z" fill="#e2453c" opacity={1 - k} {...ink(3)} />; })}
      {/* his speech bubble */}
      {puff > 0 && (
        <g data-qa-label="fui" transform={`translate(600 760) scale(${puff})`}>
          <path d="M-230 -80 L 230 -80 Q 260 -80 260 -50 L 260 50 Q 260 80 230 80 L 200 80 L 230 150 L 140 80 L -230 80 Q -260 80 -260 50 L -260 -50 Q -260 -80 -230 -80 Z" fill="#fff" {...ink(7)} />
          <text x={0} y={22} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={60} fill="#14171a">FUI EU QUE FIZ!</text>
        </g>
      )}
      {/* thumbs-up sparkle */}
      {puff > 0 && [[960, 1000], [900, 1120], [1000, 1180]].map(([x, y], i) => <path key={i} transform={`translate(${x} ${y}) scale(${0.5 + 0.5 * Math.abs(Math.sin(t * 6 + i))})`} d="M0 -26 L 6 -6 L 26 0 L 6 6 L 0 26 L -6 6 L -26 0 L -6 -6 Z" fill="#fff6c8" {...ink(3)} />)}
    </g>
  );
};

/* ------------------------------------------------------------------ the truth: a supermarket box in the bin */
export const Trash: React.FC<P> = ({ T, t }) => {
  // the box rises out of the bin as the MENTIRA card ends (or on "mercado" if that comes first)
  const m = Math.min(W(T, 'market', 'mercado', 0.5), T.s('market') + 1.55);
  const ding = W(T, 'market', 'micro-ondas', 1.8);
  return (
    <g>
      <rect x={0} y={0} width={1080} height={1920} fill="#dfe8f0" />
      <rect x={0} y={1280} width={1080} height={640} fill="#b9c6d2" {...ink(6)} />
      {/* microwave on the counter, PIM */}
      <g transform="translate(560 560)">
        <rect x={-220} y={-140} width={440} height={280} rx={20} fill="#f4f6fb" {...ink(8)} />
        <rect x={-190} y={-110} width={280} height={220} rx={12} fill={t > ding ? '#ffe9a8' : '#2c3550'} {...ink(5)} />
        <rect x={110} y={-100} width={90} height={50} rx={8} fill="#14171a" />
        <text x={155} y={-64} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={30} fill="#3ddc97">{t > ding ? '0:00' : '4:00'}</text>
        {t > ding && t < ding + 1.5 && <text x={0} y={-170} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={110} fill={PAL.orange} stroke={INK} strokeWidth={10} paintOrder="stroke" transform={`scale(${pop(t, ding)})`}>PIM!</text>}
      </g>
      <rect x={300} y={700} width={520} height={30} rx={8} fill="#8a9099" {...ink(5)} />
      {/* bin with the box sticking out */}
      <g transform="translate(540 1300)">
        <g data-qa-label="lasanha" transform={`translate(0 ${-300 * pop(t, m - 0.15)}) rotate(-14)`}>
          <rect x={-180} y={-150} width={360} height={240} rx={12} fill="#ffd21f" {...ink(8)} />
          <text x={0} y={-60} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={52} fill="#c8322a">LASANHA</text>
          <text x={0} y={0} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={52} fill="#c8322a">PRONTA</text>
          <rect x={-90} y={22} width={180} height={50} rx={10} fill="#c8322a" />
          <text x={0} y={60} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={34} fill="#fff">4 MIN</text>
        </g>
        <path d="M-200 0 L 200 0 L 170 460 L -170 460 Z" fill="#5f6b7a" {...ink(8)} />
        <rect x={-220} y={-20} width={440} height={50} rx={14} fill="#4a5564" {...ink(7)} />
      </g>
    </g>
  );
};

/* ------------------------------------------------------------------ the fridge: expired mustard, one egg, a sad lemon */
export const Fridge: React.FC<P> = ({ T, t }) => {
  const items = [
    { w: 'mostarda', lead: 0, label: 'MOSTARDA VENCIDA', x: 500, y: 900, el: <g><rect x={-40} y={-90} width={80} height={170} rx={20} fill="#ffc21f" {...ink(6)} /><rect x={-20} y={-130} width={40} height={50} rx={8} fill="#c8322a" {...ink(5)} /></g> },
    { w: 'ovo', lead: 0.05, label: '1 OVO', x: 672, y: 1290, el: <ellipse cx={0} cy={0} rx={44} ry={58} fill="#fff8ec" {...ink(6)} /> },
    { w: 'limão', lead: 0.6, label: 'LIMÃO TRISTE', x: 360, y: 1290, el: <g><ellipse cx={0} cy={0} rx={70} ry={54} fill="#d8e85a" {...ink(6)} /><path d="M-30 -6 q 10 8 20 0 M10 -6 q 10 8 20 0" fill="none" {...ink(5)} /><path d="M-34 -24 l 18 -8 M34 -24 l -18 -8" {...ink(4)} /><path d="M-16 26 Q 0 14 16 26" fill="none" {...ink(5)} /><path d="M-22 6 q 4 10 0 16 q -4 -6 0 -16" fill="#8fd0ff" {...ink(2)} /></g> },
  ];
  return (
    <g>
      <rect x={0} y={0} width={1080} height={1920} fill="#2a3a55" />
      {/* kitchen wall tiles + floor */}
      {Array.from({ length: 9 }, (_, r) => Array.from({ length: 6 }, (_, c) => <rect key={`${r}-${c}`} x={c * 180 + (r % 2) * 90 - 90} y={r * 160} width={176} height={156} fill="#33466a" />))}
      <rect x={0} y={1640} width={1080} height={280} fill="#5a4636" />
      {/* the fridge body: freezer on top, main door open, feet */}
      <rect x={200} y={300} width={600} height={1340} rx={40} fill="#eef3f8" stroke="#1b1420" strokeWidth={12} />
      <rect x={200} y={300} width={600} height={300} rx={40} fill="#e2e9f1" stroke="#1b1420" strokeWidth={12} />
      <rect x={250} y={420} width={30} height={120} rx={14} fill="#9aa6b8" stroke="#1b1420" strokeWidth={6} />
      {/* open interior with a cold blue-white light */}
      <rect x={232} y={630} width={536} height={980} rx={18} fill="#dff3ff" stroke="#1b1420" strokeWidth={8} />
      <ellipse cx={500} cy={700} rx={300} ry={160} fill="#ffffff" opacity={0.75} />
      <circle cx={500} cy={660} r={22} fill="#ffffff" stroke="#1b1420" strokeWidth={5} />
      {[1000, 1380].map((y, i) => <rect key={i} x={232} y={y} width={536} height={18} fill="#a9c6e0" stroke="#1b1420" strokeWidth={5} />)}
      <rect x={250} y={1470} width={500} height={120} rx={14} fill="#c9e6f7" stroke="#1b1420" strokeWidth={6} />
      <text x={500} y={1545} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={34} fill="#7fa6c4">VAZIA</text>
      {[260, 740].map((x, i) => <rect key={i} x={x - 30} y={1636} width={60} height={30} rx={8} fill="#5f6b7a" stroke="#1b1420" strokeWidth={6} />)}
      {/* the open door, swung toward us on the right, with its own shelves and handle */}
      <path d="M800 610 L 1010 520 L 1010 1700 L 800 1610 Z" fill="#e2e9f1" stroke="#1b1420" strokeWidth={12} strokeLinejoin="round" />
      <path d="M822 660 L 990 590 L 990 1640 L 822 1570 Z" fill="#d3e6f5" stroke="#1b1420" strokeWidth={6} strokeLinejoin="round" />
      {[880, 1180, 1460].map((y, i) => <path key={i} d={`M822 ${y} L 990 ${y - 66} L 990 ${y - 20} L 822 ${y + 46} Z`} fill="#b9d6ee" stroke="#1b1420" strokeWidth={5} />)}
      <rect x={812} y={900} width={22} height={260} rx={10} fill="#9aa6b8" stroke="#1b1420" strokeWidth={6} />
      {/* cold air puffing out */}
      {[0, 1].map((i) => <path key={i} d={`M260 ${1660 + i * 30} q 120 ${-20 - 10 * Math.sin(t * 3 + i)} 240 0 q 120 ${20 + 10 * Math.sin(t * 3 + i)} 240 0`} fill="none" stroke="#ffffff" strokeWidth={10} opacity={0.55} strokeLinecap="round" />)}
      {items.map((it, i) => {
        const p = pop(t, W(T, 'fridge', it.w, 0.8 + i) - 0.1 - it.lead);
        return (
          <g key={i}>
            <g transform={`translate(${it.x} ${it.y - (it.w === 'mostarda' ? 0 : 60)}) scale(${0.6 + 0.4 * p})`}>{it.el}</g>
            {p > 0 && (
              <g data-qa-label={it.w} transform={`translate(${it.x} ${it.y + (it.w === 'mostarda' ? 120 : 40)}) scale(${p})`}>
                <rect x={-(it.label.length * 14 + 30)} y={-32} width={2 * (it.label.length * 14 + 30)} height={64} rx={14} fill={PAL.orange} {...ink(5)} />
                <text x={0} y={14} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={40} fill="#fff">{it.label}</text>
              </g>
            )}
          </g>
        );
      })}
      {/* a single cold breath of air */}
      <path d={`M300 ${1540 + 10 * Math.sin(t * 3)} q 120 -40 240 0 q 120 40 240 0`} fill="none" stroke="#ffffff" strokeWidth={10} opacity={0.6} strokeLinecap="round" />
    </g>
  );
};

/* ------------------------------------------------------------------ the egg that evacuated the building */
export const Building: React.FC<P> = ({ T, t }) => {
  const smoke = clamp01((t - W(T, 'building', 'fritou', 1.9)) / 0.6);
  const down = W(T, 'building', 'desceu', 4.9);
  const alarm = t > W(T, 'building', 'fritou', 1.9) + 0.3 && Math.floor(t * 4) % 2 === 0;
  const neighbours = useMemo(() => { const r = rng(9); return Array.from({ length: 9 }, (_, i) => ({ x: 90 + i * 112 + r() * 20, c: ['#ff9a8a', '#8fd0ff', '#ffd21f', '#c9a6ff', '#3ddc97'][i % 5], h: 0.9 + r() * 0.25 })); }, []);
  return (
    <g>
      <rect x={0} y={0} width={1080} height={1920} fill={PAL.navy} />
      {/* the building */}
      <rect x={160} y={260} width={760} height={1250} fill="#4a5578" {...ink(8)} />
      {Array.from({ length: 24 }, (_, i) => {
        const col = i % 4, row = Math.floor(i / 4);
        const isHis = row === 2 && col === 2;
        return <rect key={i} x={220 + col * 180} y={330 + row * 190} width={120} height={120} rx={8} fill={isHis ? (alarm ? '#ff4a3d' : '#ffb27a') : '#ffe9a8'} {...ink(5)} />;
      })}
      {/* smoke pouring from his window */}
      {smoke > 0 && [0, 1, 2, 3, 4].map((i) => {
        const k = ((t * 0.5 + i * 0.2) % 1);
        return <circle key={i} cx={640 + 40 * Math.sin(k * 6 + i)} cy={700 - 420 * k} r={(50 + 90 * k) * smoke} fill="#8a8f9a" opacity={0.75 * (1 - k)} {...ink(4)} />;
      })}
      {/* red alarm light */}
      {alarm && <circle cx={540} cy={240} r={60} fill="#ff4a3d" opacity={0.5} />}
      <rect x={510} y={220} width={60} height={40} rx={10} fill="#ff4a3d" {...ink(5)} />
      {/* street */}
      <rect x={0} y={1500} width={1080} height={420} fill="#2c3550" {...ink(6)} />
      {/* neighbours in pyjamas, looking up (arrive on "desceu") */}
      {neighbours.map((n, i) => {
        const p = clamp01((t - down + 0.4 - i * 0.05) / 0.3);
        if (p <= 0) return null;
        return (
          <g key={i} transform={`translate(${n.x} ${1640 + 80 * (1 - p)}) scale(${0.9 * n.h})`}>
            <path d="M-46 0 C -50 -110 -40 -160 0 -160 C 40 -160 50 -110 46 0 Z" fill={n.c} {...ink(5)} />
            {[-1, 1].map((s) => <path key={s} d={`M${s * 16} -150 l ${s * 4} 140`} stroke="#ffffff" strokeWidth={5} opacity={0.6} />)}
            <circle cx={0} cy={-200} r={44} fill="#f1bf94" {...ink(5)} />
            <circle cx={-12} cy={-212} r={6} fill={INK} /><circle cx={12} cy={-212} r={6} fill={INK} />
            <ellipse cx={0} cy={-186} rx={8} ry={10} fill="#5a1f1a" />
          </g>
        );
      })}
      {/* Tavinho with the smoking pan, sheepish */}
      <g transform={place(540, 1760, 0.45)}>
        <Tavinho t={t} mood="gulp" sweat={1} slip={1} armR={[[720, 1150], [860, 1180], [930, 1020]]}
          holdR={<g transform="rotate(-30)"><rect x={-12} y={-10} width={24} height={150} rx={10} fill="#3a3a3a" {...ink(5)} /><ellipse cx={0} cy={-80} rx={110} ry={40} fill="#3a3a3a" {...ink(6)} /><ellipse cx={0} cy={-84} rx={60} ry={18} fill="#2a1a12" /></g>} />
      </g>
    </g>
  );
};

/* ------------------------------------------------------------------ typing the truth, Camila's message, deleting it */
export const Typing: React.FC<P> = ({ T, t }) => {
  const full = 'Dona Celeste, na verdade';
  const tStart = W(T, 'truth', 'decide', 0.6), tEnd = W(T, 'truth', 'verdade', 1.7);
  const del0 = T.s('noreturn'), del1 = T.e('noreturn', del0 + 1.6);
  let n = Math.floor(full.length * clamp01((t - tStart) / Math.max(0.3, tEnd - tStart)));
  if (t >= del0) n = Math.floor(full.length * (1 - clamp01((t - del0) / Math.max(0.3, del1 - del0 - 0.1))));
  const banner = W(T, 'camilamsg', 'camila', 0.4);
  return (
    <g>
      <rect x={0} y={0} width={1080} height={1920} fill={PAL.navy} />
      <Phone x={260} y={310} s={1} glow={1}>
        <Chat name="Dona Celeste 🌹" avatar={<Celeste t={t} mood="happy" />} t={t}
          msgs={[{ text: 'então a ceia de Natal\né SUA 🎄', at: 0 }, { text: 'somos 12 😘', at: 0 }]} typing={full.slice(0, n)} />
      </Phone>
      {/* his plain hand tapping the keyboard while he types / deletes (no finger gesture: owner rule) */}
      {((t >= tStart && t < tEnd) || (t >= del0 && t < del1)) && (() => {
        const hx = 470 + 60 * Math.sin(t * 13), hy = 1350 - 30 * Math.abs(Math.sin(t * 16));
        return (
          <g>
            <Limb pts={[[hx + 160, 2200], [hx + 90, 1700], [hx, hy + 30]]} w={96} color="#a9d2f5" />
            <Hand x={hx} y={hy} angle={180} r={52} color="#f1bf94" />
          </g>
        );
      })()}
      {/* his sweating face at the bottom corner, reacting */}
      <g transform="translate(150 1250) scale(0.36) translate(-540 -840)"><TavinhoHead t={t} mood={t >= del0 ? 'gulp' : t >= banner ? 'shock' : 'worried'} sweat={1} slip={0.7} /></g>
    </g>
  );
};

/* ------------------------------------------------------------------ the family group chat */
export const Group: React.FC<P> = ({ T, t }) => {
  const g0 = T.s('group');
  const count = Math.min(99, Math.floor(Math.max(0, t - g0 - 0.6) * 40));
  const avatars = ['#ff9a8a', '#8fd0ff', '#ffd21f', '#c9a6ff', '#3ddc97', '#ff7a2e', '#f2b33d', '#7b4bb8', '#21b3a0', '#e2453c', '#5f8f6a', '#3a5ba0'];
  return (
    <g>
      <rect x={0} y={0} width={1080} height={1920} fill={PAL.navy} />
      <Phone x={260} y={310} s={1} glow={1}>
        <rect x={0} y={0} width={560} height={160} fill={PAL.mint} />
        <text data-qa-label="grupo" x={280} y={76} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={30} fill="#14171a">Ceia do Chef Tavinho 🎄</text>
        <text x={280} y={118} textAnchor="middle" fontFamily={F} fontWeight={700} fontSize={22} fill="#14171a">12 participantes</text>
        {avatars.map((c, i) => {
          const p = pop(t, g0 + 0.2 + i * 0.07, 0.18);
          return <circle key={i} cx={70 + (i % 4) * 140} cy={260 + Math.floor(i / 4) * 140} r={52 * p} fill={c} {...ink(4)} />;
        })}
        {[['Tia Lurdes', 'que chique!! 👨‍🍳'], ['Primo Beto', 'vai ter peru? 🦃'], ['Dona Celeste', 'tô contando os dias 🥰']].map(([who, msg], i) => {
          const p = pop(t, g0 + 1.2 + i * 0.45);
          if (p <= 0) return null;
          return (
            <g key={i} transform={`translate(20 ${700 + i * 120}) scale(${p})`}>
              <rect x={0} y={0} width={500} height={100} rx={22} fill="#ffffff" {...ink(4)} />
              <text x={20} y={40} fontFamily={F} fontWeight={900} fontSize={24} fill={avatars[i * 3]}>{who}</text>
              <text x={20} y={78} fontFamily={F} fontWeight={800} fontSize={28} fill="#14171a">{msg}</text>
            </g>
          );
        })}
      </Phone>
      {/* notifications climbing */}
      {count > 0 && (
        <g data-qa-label="count" transform={`translate(830 420) scale(${1 + 0.1 * Math.sin(t * 12)})`}>
          <circle cx={0} cy={0} r={70} fill="#e2453c" {...ink(7)} />
          <text x={0} y={22} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={60} fill="#fff">{count >= 99 ? '99+' : count}</text>
        </g>
      )}
    </g>
  );
};

/* ------------------------------------------------------------------ the vote: VÍDEO (orange) vs VÓ (blue) */
export const Vote: React.FC<P> = ({ T, t }) => {
  const v0 = T.s('video'), o0 = T.s('vo'), d0 = T.s('decide');
  const left = clamp01((t - v0 + 0.1) / 0.3), right = clamp01((t - o0 + 0.1) / 0.3);
  const focusL = t >= v0 && t < o0, focusR = t >= o0 && t < d0;
  const both = t >= d0;
  return (
    <g>
      <rect x={0} y={0} width={1080} height={1920} fill={PAL.navy} />
      {/* split panels slide in */}
      <g transform={`translate(${lerp(-560, 0, easeOutCubic(left))} 0)`} filter={focusR ? 'url(#grey)' : undefined} opacity={focusR ? 0.75 : 1}>
        <rect x={0} y={330} width={540} height={1180} fill={PAL.orange} {...ink(8)} />
        <g transform={place(270, 1560, 0.56)}><Tavinho t={t} mood={focusL ? 'neutral' : 'worried'} sweat={0.5} slip={0.5} armL={[[360, 1150], [300, 1300], [470, 1260]]} armR={[[720, 1150], [780, 1300], [610, 1260]]}
          holdL={<g transform="translate(70 -40)"><rect x={-120} y={-70} width={240} height={150} rx={12} fill="#20232c" {...ink(6)} /><rect x={-104} y={-56} width={208} height={118} rx={8} fill="#e2453c" /><path d="M-20 -20 L 30 2 L -20 24 Z" fill="#fff" /></g>} /></g>
        {focusL && (
          <g>
            {[0, 1, 2].map((i) => { const k = ((t * 0.8 + i * 0.33) % 1); return <circle key={i} cx={95 + 20 * Math.sin(k * 6 + i)} cy={1300 - 300 * k} r={24 + 36 * k} fill="#8a8f9a" opacity={0.7 * (1 - k)} {...ink(3)} />; })}
            <g transform={`translate(440 800) scale(${1 + 0.08 * Math.sin(t * 10)})`}><rect x={-60} y={-34} width={120} height={68} rx={14} fill="#1b1420" /><text x={0} y={16} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={44} fill="#fff">2x ▶▶</text></g>
          </g>
        )}
        <rect x={60} y={380} width={420} height={110} rx={24} fill="#fff" {...ink(6)} />
        <text data-qa-label="video" x={270} y={458} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={66} fill={PAL.orange}>VÍDEO</text>
        <text data-qa-label="video-cost" x={270} y={560} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={48} fill="#fff" stroke={INK} strokeWidth={8} paintOrder="stroke">custa 1 dia</text>
        {t >= W(T, 'video', 'ninguém', 2.8) - 0.1 && <g data-qa-label="video-risk">{['mas ninguém', 'corrige ele'].map((l, i) => <text key={i} x={270} y={608 + i * 38} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={34} fill="#1b1420">{l}</text>)}</g>}
      </g>
      <defs><filter id="grey"><feColorMatrix type="saturate" values="0.15" /></filter></defs>
      <g transform={`translate(${lerp(560, 0, easeOutCubic(right))} 0)`} filter={focusL ? 'url(#grey)' : undefined} opacity={focusL ? 0.75 : 1}>
        <rect x={540} y={330} width={540} height={1180} fill="#3a5ba0" {...ink(8)} />
        <g transform={place(810, 1560, 0.56)}><VoDita t={t} mood={focusR ? 'talk' : 'happy'} talk={focusR ? 0.3 + 0.3 * Math.abs(Math.sin(t * 14)) : 0} spoon={t} /></g>
        {/* her never-ending speech bubble */}
        {right > 0 && <g transform={`translate(${720 + 20 * Math.sin(t * 3)} 748)`}><ellipse cx={0} cy={0} rx={180} ry={58} fill="#fff" {...ink(5)} /><text x={0} y={14} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={28} fill="#14171a">…e ele nem frita ovo!</text></g>}
        <rect x={600} y={380} width={420} height={110} rx={24} fill="#fff" {...ink(6)} />
        <text data-qa-label="vo" x={810} y={458} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={66} fill="#3a5ba0">VÓ</text>
        <text data-qa-label="vo-cost" x={810} y={560} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={48} fill="#fff" stroke={INK} strokeWidth={8} paintOrder="stroke">custa 3 dias</text>
        {t >= W(T, 'vo', 'conta', 5.9) - 0.1 && <g data-qa-label="vo-risk">{['mas conta tudo', 'pra sogra'].map((l, i) => <text key={i} x={810} y={608 + i * 38} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={34} fill="#fff4e0">{l}</text>)}</g>}
      </g>
      {/* the empty right half waits with a "?" until the Vó arrives */}
      {focusL && right <= 0 && t > v0 + 0.3 && <text x={810} y={1000} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={300} fill="#3a5ba0" opacity={0.7}>?</text>}
      {/* "MISSÃO 1" before the panels arrive, with Tavinho looking at a recipe book upside down */}
      {t < v0 && (
        <g transform={`${place(540, 1700, 0.55)}`} opacity={1 - clamp01((t - v0 + 0.25) / 0.25)}>
          <Tavinho t={t} mood="worried" sweat={0.8} slip={0.8} armL={[[360, 1150], [300, 1300], [450, 1240]]} armR={[[720, 1150], [780, 1300], [630, 1240]]}
            holdL={<g transform="translate(90 -60) rotate(-6)"><rect x={-130} y={-90} width={260} height={180} rx={10} fill="#c8322a" {...ink(6)} /><rect x={-110} y={-70} width={220} height={140} rx={6} fill="#fff4e0" /><text x={0} y={20} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={44} fill="#c8322a">RECEITAS</text></g>} />
        </g>
      )}
      {t < v0 + 0.3 && (
        <g data-qa-label="missao" transform={`translate(540 560) scale(${pop(t, T.s('mission'))})`}>
          <rect x={-300} y={-90} width={600} height={180} rx={30} fill={PAL.mint} {...ink(8)} />
          <text x={0} y={30} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={96} fill="#14171a">MISSÃO 1</text>
        </g>
      )}
      {/* the final question + his gulp in the middle */}
      {both && (
        <g>
          <rect x={0} y={330} width={1080} height={1180} fill={PAL.navy} opacity={0.22 * clamp01((t - d0) / 0.2)} />
          <g transform={`translate(540 905) scale(${pop(t, d0)})`}>
            <circle cx={0} cy={0} r={195} fill="#fff4e0" {...ink(8)} />
            <g transform={`scale(${0.47 * (1 + 0.06 * Math.sin(Math.max(0, t - d0 - 1.2) * 18) * Math.exp(-Math.max(0, t - d0 - 1.2) * 3))} ${0.47 * (1 - 0.08 * Math.sin(Math.max(0, t - d0 - 1.2) * 18) * Math.exp(-Math.max(0, t - d0 - 1.2) * 3))}) translate(-540 -840)`}><TavinhoHead t={t} mood="gulp" sweat={1} slip={1} /></g>
            {t > d0 + 1.2 && <text x={170} y={-140} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={62} fill="#fff" stroke="#1b1420" strokeWidth={10} paintOrder="stroke" transform={`rotate(14) scale(${pop(t, d0 + 1.2)})`}>GULP!</text>}
          </g>
          <g data-qa-label="pergunta" transform={`translate(540 1180) scale(${pop(t, W(T, 'decide', 'vídeo', 1.6) - 0.1)})`}>
            <rect x={-330} y={-70} width={660} height={140} rx={30} fill="#fff" {...ink(8)} />
            <text x={0} y={26} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={70} fill="#14171a">VÍDEO ou VÓ?</text>
          </g>
        </g>
      )}
    </g>
  );
};
