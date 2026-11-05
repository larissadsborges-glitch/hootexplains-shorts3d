import React from 'react';
import { clamp01, easeOutBack, easeOutCubic, lerp } from '../../lib/anim';
import { Hoot2D, INK, ink, Jake2D, Room, SKIN } from '../Hook2D';
import { JakeStanding, place } from '../parts';

/**
 * money5 (credit card minimum payment) scenes, drawn in 1080×1920 scene units.
 * The camera (CardVideo) frames each scene; every scene draws backgrounds past the frame edges.
 */
const F = 'Montserrat, Arial Black, sans-serif';

/** A rubber stamp that slams down (p 0..1). */
const Stamp: React.FC<{ p: number; x: number; y: number; rot: number; lines: string[]; color: string; w?: number }> = ({ p, x, y, rot, lines, color, w = 300 }) => {
  if (p <= 0) return null;
  const h = 54 + 40 * lines.length;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${lerp(1.8, 1, easeOutBack(clamp01(p)))})`} opacity={clamp01(p * 3)}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={10} fill="rgba(255,255,255,0.55)" stroke={color} strokeWidth={10} />
      {lines.map((l, i) => <text key={i} x={0} y={-h / 2 + 62 + i * 44} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={44} fill={color}>{l}</text>)}
    </g>
  );
};

/** The credit card bill held at Jake's chest. hl = row highlight 0..1 (minimum row), peel = sticky note off 0..1. */
const Bill: React.FC<{ t: number; hl: number; peel: number; stamp12: number; stamp3: number }> = ({ t, hl, peel, stamp12, stamp3 }) => {
  const wob = 1.2 * Math.sin(t * 1.3);
  const breathe = 3 * Math.sin(t * 2.1);
  return (
    <g transform={`translate(0 ${breathe})`}>
      <g transform={`translate(540 1030) rotate(${-2 + wob})`}>
        <rect x={-245} y={-95} width={490} height={196} rx={8} fill="#fffdf6" {...ink(8)} />
        <path d="M-245 -55 L 245 -55 L 245 -87 Q 245 -95 237 -95 L -237 -95 Q -245 -95 -245 -87 Z" fill="#e2453c" />
        <path d="M-245 -55 L 245 -55" {...ink(5)} />
        <text x={0} y={-66} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={27} fill="#ffffff" letterSpacing={2}>CREDIT CARD BILL</text>
        {/* row 1: balance */}
        <text x={-158} y={-20} fontFamily={F} fontWeight={800} fontSize={26} fill="#5b6270">BALANCE</text>
        <text x={158} y={-18} textAnchor="end" fontFamily={F} fontWeight={900} fontSize={32} fill="#14171a">$3,000</text>
        {/* row 2: minimum due, highlighted on "minimum" */}
        <rect x={-205} y={-8} width={410} height={44} rx={8} fill="#ffd21f" opacity={0.85 * hl} />
        <text x={-158} y={23} fontFamily={F} fontWeight={800} fontSize={22} fill="#14171a">MINIMUM DUE</text>
        <text x={158} y={26} textAnchor="end" fontFamily={F} fontWeight={900} fontSize={30} fill="#d6281c">$85/MO</text>
        {/* row 3: the 3-year box, hidden under a sticky "?" until the payoff */}
        <rect x={-235} y={44} width={470} height={46} rx={8} fill="#e6f6e6" stroke="#2fa84f" strokeWidth={4} strokeDasharray="10 6" />
        <text x={-158} y={77} fontFamily={F} fontWeight={800} fontSize={22} fill="#1f6b3a">3-YEAR PLAN</text>
        <text x={158} y={79} textAnchor="end" fontFamily={F} fontWeight={900} fontSize={28} fill="#1f8a45">$115/MO</text>
        {peel < 1 && (
          <g transform={`translate(${95 + 60 * peel} ${66 + 260 * peel * peel}) rotate(${6 + 70 * peel})`} opacity={1 - clamp01((peel - 0.7) / 0.3)}>
            <rect x={-82} y={-34} width={164} height={70} rx={4} fill="#ffe14d" {...ink(5)} />
            <text x={0} y={22} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={60} fill="#14171a">?</text>
          </g>
        )}
      </g>
      <Stamp p={stamp12} x={560} y={978} rot={-10} lines={['12+ YEARS']} color="#d6281c" w={330} />
      <Stamp p={stamp3} x={445} y={990} rot={-8} lines={['3 YEARS']} color="#1f8a45" w={280} />
      {/* hands: fingers wrap over the front of the bill at both ends */}
      {[[330, 1055, 1], [750, 1055, -1]].map(([x, y, s], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <ellipse cx={0} cy={6} rx={40} ry={44} fill={SKIN} {...ink(7)} />
          {[-20, 0, 20].map((dy, k) => <path key={k} d={`M${-s * 6} ${dy - 8} q ${s * 34} 2 ${s * 36} 14`} fill="none" {...ink(5)} />)}
          <path d={`M${-s * 30} -24 q ${s * 20} -24 ${s * 40} -10`} fill={SKIN} {...ink(5)} />
        </g>
      ))}
    </g>
  );
};

export type DeskProps = {
  t: number; talk: number;
  brows: number; smile: number; wide: number; gasp: number; sad: number; nod: number;
  hl: number; peel: number; stamp12: number; stamp3: number; q: number; hop?: number;
};

/** Jake at his desk holding the bill, Hoot on the books (same room as the $20 video). */
export const Desk2D: React.FC<DeskProps> = (p) => (
  <g>
    <rect x={-600} y={-400} width={2280} height={2800} fill="#c7d3ea" />
    <Room t={p.t} />
    <g transform={`translate(0 ${-80 + 10 * p.nod})`}><Jake2D t={p.t} brows={p.brows} flip={0} smile={p.smile} wide={p.wide} gasp={p.gasp} sad={p.sad} /></g>
    {/* desk */}
    <rect x={-20} y={1360} width={1120} height={60} rx={12} fill="#d9a066" {...ink(8)} />
    <rect x={0} y={1416} width={1080} height={600} fill="#b7834f" {...ink(8)} />
    <path d="M0 1500 L 1080 1500" stroke="#a5733f" strokeWidth={10} />
    {/* phone face down + mug */}
    <g transform="translate(820 1290)">
      <path d="M-40 0 L 40 0 L 34 76 L -34 76 Z" fill="#ff8a3d" {...ink(7)} />
      <path d="M40 18 C 70 18 70 58 36 58" fill="none" {...ink(8)} />
      <ellipse cx={0} cy={0} rx={40} ry={10} fill="#4a2c1a" {...ink(5)} />
    </g>
    {/* books + Hoot */}
    <rect x={90} y={1318} width={270} height={44} rx={6} fill="#2f6fd6" {...ink(7)} />
    <rect x={105} y={1278} width={245} height={42} rx={6} fill="#e2453c" {...ink(7)} transform="rotate(-2 227 1300)" />
    <rect x={98} y={1240} width={255} height={40} rx={6} fill="#f0b429" {...ink(7)} transform="rotate(1.5 225 1260)" />
    <Bill t={p.t} hl={p.hl} peel={p.peel} stamp12={p.stamp12} stamp3={p.stamp3} />
    {/* Hoot sits in front of the bill's left end so his wink and pencil stay visible */}
    <Hoot2D t={p.t} talk={p.talk} x={225} y={1240 - 28 * (p.hop ?? 0)} s={0.95} />
    {p.q > 0 && (
      <g transform={`translate(800 800) scale(${p.q}) rotate(12)`}>
        <text x={0} y={0} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={170} fill="#ffd21f" stroke={INK} strokeWidth={10} paintOrder="stroke">?</text>
      </g>
    )}
  </g>
);

/** A bundle of cartoon cash with a big value tag, centred on (0, 0). */
const Cash: React.FC<{ label: string; w: number; tag: string }> = ({ label, w, tag }) => (
  <g>
    {[10, 0].map((d, i) => <rect key={i} x={-w / 2 + d} y={-46 - d} width={w} height={92} rx={6} fill={i ? '#a8d8a8' : '#8fc79a'} {...ink(6)} />)}
    <rect x={-w / 2 + 14} y={-34} width={w - 28} height={68} rx={4} fill="none" stroke="#2f6b45" strokeWidth={4} />
    <text x={0} y={16} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={46} fill="#1f5236">{label}</text>
    <g transform={`translate(0 -78)`}>
      <rect x={-62} y={-26} width={124} height={44} rx={22} fill={tag} {...ink(5)} />
      <text x={0} y={7} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={30} fill="#ffffff">{label}</text>
    </g>
  </g>
);

export type PayProps = {
  t: number; talk: number;
  cashIn: number; eat: number; give: number; rateOn: number; debt: number; chomp: number;
  jake: { brows: number; smile: number; sad: number; wide: number; gasp: number };
};

/**
 * Jake pays the "CARD CO." machine: $85 in his hand; on "55" the big part flies into the INTEREST mouth,
 * on "30" the small part goes to the DEBT screen, which barely moves.
 */
export const Pay2D: React.FC<PayProps> = ({ t, talk, cashIn, eat, give, rateOn, debt, chomp, jake }) => {
  const jaw = 26 + 70 * chomp;
  const hand: [number, number] = [520, 960];
  const mouth: [number, number] = [770, 1050];
  const screen: [number, number] = [770, 820];
  const fly = (from: [number, number], to: [number, number], k: number, lift: number): [number, number] => {
    const e = easeOutCubic(k);
    return [lerp(from[0], to[0], e), lerp(from[1], to[1], e) - lift * Math.sin(Math.PI * k)];
  };
  const p55 = fly([hand[0] - 30, hand[1]], [mouth[0], mouth[1] + 20], eat, 30);
  const p30 = fly([hand[0] + 50, hand[1] + 10], screen, give, 120);
  return (
    <g>
      <rect x={-600} y={-400} width={2280} height={1900} fill="#f1d9a8" />
      {Array.from({ length: 22 }, (_, i) => <rect key={i} x={i * 100 - 560} y={-400} width={46} height={1900} fill="#ead0a0" />)}
      <rect x={-600} y={1500} width={2280} height={1000} fill="#9b6b4a" />
      <path d="M-600 1500 L 1680 1500" {...ink(8)} />
      {/* framed poster on the wall: a card with a smiley, "EASY CREDIT!" */}
      <g transform="translate(150 520) rotate(-3)">
        <rect x={-110} y={-90} width={220} height={180} rx={8} fill="#fff4e0" {...ink(7)} />
        <rect x={-80} y={-60} width={160} height={92} rx={12} fill="#5b3fa0" {...ink(5)} />
        <rect x={-62} y={-36} width={34} height={24} rx={4} fill="#f0c040" />
        <text x={0} y={70} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={24} fill="#d6281c">EASY CREDIT!</text>
      </g>
      {/* the CARD CO. machine */}
      <g>
        <ellipse cx={770} cy={1505} rx={200} ry={18} fill="rgba(0,0,0,0.18)" />
        <rect x={595} y={640} width={350} height={862} rx={34} fill="#5b3fa0" {...ink(9)} />
        <rect x={895} y={660} width={36} height={830} rx={16} fill="#47308a" />
        <rect x={620} y={660} width={300} height={78} rx={14} fill="#f0c040" {...ink(6)} />
        <text x={770} y={714} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={46} fill="#14171a">CARD CO.</text>
        {/* DEBT screen */}
        <rect x={635} y={760} width={270} height={108} rx={12} fill="#10241a" {...ink(6)} />
        <text x={770} y={798} textAnchor="middle" fontFamily={F} fontWeight={800} fontSize={24} fill="#7fd36a" letterSpacing={3}>DEBT</text>
        <text x={770} y={850} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={46} fill="#7fd36a">${Math.round(debt).toLocaleString('en-US')}</text>
        {/* rate plate lights up on "22" */}
        <rect x={635} y={880} width={270} height={52} rx={10} fill={rateOn > 0 ? '#ffd21f' : '#3a2a6a'} {...ink(5)} />
        {rateOn > 0 && <text x={770} y={920} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={34} fill="#d6281c" transform={`translate(770 907) scale(${lerp(1.4, 1, easeOutBack(clamp01(rateOn)))}) translate(-770 -907)`}>22% A YEAR</text>}
        {/* INTEREST mouth with teeth */}
        <g>
          <rect x={645} y={1000} width={250} height={jaw + 50} rx={26} fill="#4a1414" {...ink(7)} />
          {[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M${660 + i * 46} 1002 l 20 28 l 20 -28 Z`} fill="#ffffff" {...ink(4)} />)}
          {[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M${660 + i * 46} ${1048 + jaw} l 20 -26 l 20 26 Z`} fill="#ffffff" {...ink(4)} />)}
        </g>
        <rect x={670} y={940} width={200} height={50} rx={25} fill="#e2453c" {...ink(5)} />
        <text x={770} y={975} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={30} fill="#ffffff">INTEREST</text>
        {/* lower panels */}
        {[0, 1].map((i) => <rect key={i} x={625} y={1250 + i * 110} width={290} height={86} rx={12} fill="#47308a" {...ink(5)} />)}
      </g>
      <Hoot2D t={t} talk={talk} x={665} y={642} s={0.66} />
      {/* Jake: right hand holds the cash out towards the machine */}
      <g transform={place(300, 1500, 0.62)}>
        <ellipse cx={540} cy={2025} rx={260} ry={30} fill="rgba(0,0,0,0.18)" />
        <JakeStanding t={t} {...jake} armL={[[410, 1110], [345, 1300], [355, 1450]]} armR={[[670, 1110], [790, 1230], [895, 1190]]} />
      </g>
      {/* cash: one $85 bundle that splits into $55 (to the mouth) and $30 (to the debt screen) */}
      {cashIn > 0 && eat <= 0 && <g transform={`translate(${hand[0]} ${hand[1]}) scale(${easeOutBack(clamp01(cashIn))})`}><Cash label="$85" w={200} tag="#14171a" /></g>}
      {eat > 0 && eat < 1 && <g transform={`translate(${p55[0]} ${p55[1]}) scale(${1 - 0.5 * eat})`}><Cash label="$55" w={170} tag="#e2453c" /></g>}
      {eat > 0 && give < 1 && <g transform={`translate(${p30[0]} ${p30[1]}) scale(${1 - 0.5 * give})`}><Cash label="$30" w={120} tag="#2fa84f" /></g>}
    </g>
  );
};

export type MillProps = { t: number; talk: number; year: number; run: number; jake: { brows: number; smile: number; sad: number; grit: number } };

/** Jake on a treadmill that never ends: the calendar flips years, the clock spins. */
export const Treadmill2D: React.FC<MillProps> = ({ t, talk, year, run, jake }) => {
  const ph = t * 9;
  const s = Math.sin(ph);
  const bob = -14 * Math.abs(Math.sin(ph));
  return (
    <g>
      <rect x={-600} y={-400} width={2280} height={1960} fill="#cfe3d6" />
      {Array.from({ length: 16 }, (_, i) => <rect key={i} x={-600} y={i * 110 - 380} width={2280} height={8} fill="#bdd6c6" />)}
      <rect x={-600} y={1560} width={2280} height={1000} fill="#6c7a89" />
      <path d="M-600 1560 L 1680 1560" {...ink(8)} />
      {/* wall calendar: the years fly by */}
      <g transform="translate(210 660)">
        <rect x={-115} y={-120} width={230} height={250} rx={12} fill="#ffffff" {...ink(7)} />
        <rect x={-115} y={-120} width={230} height={64} rx={12} fill="#e2453c" {...ink(7)} />
        {[-60, 60].map((x, i) => <rect key={i} x={x - 8} y={-138} width={16} height={36} rx={6} fill="#5b6270" {...ink(4)} />)}
        <text x={0} y={-76} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={34} fill="#ffffff">YEAR</text>
        <text x={0} y={70} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={120} fill="#14171a">{year}</text>
      </g>
      {/* wall clock spinning fast */}
      <g transform="translate(840 650)">
        <circle cx={0} cy={0} r={92} fill="#ffffff" {...ink(8)} />
        {Array.from({ length: 12 }, (_, i) => <path key={i} d={`M0 -78 L 0 -66`} transform={`rotate(${i * 30})`} {...ink(5)} />)}
        <path d="M0 0 L 0 -52" transform={`rotate(${t * 140 * run})`} {...ink(9)} />
        <path d="M0 0 L 0 -72" transform={`rotate(${t * 1600 * run})`} {...ink(6)} />
        <circle cx={0} cy={0} r={8} fill={INK} />
      </g>
      {/* treadmill: deck with a moving belt, side posts and handles */}
      <ellipse cx={540} cy={1590} rx={360} ry={24} fill="rgba(0,0,0,0.22)" />
      <path d="M215 1500 L 865 1500 L 905 1585 L 175 1585 Z" fill="#3b4a63" {...ink(8)} />
      <clipPath id="belt"><path d="M245 1508 L 835 1508 L 862 1560 L 218 1560 Z" /></clipPath>
      <g clipPath="url(#belt)">
        <rect x={200} y={1500} width={700} height={70} fill="#1f2a3a" />
        {Array.from({ length: 14 }, (_, i) => <rect key={i} x={140 + ((i * 60 + t * 260) % 840)} y={1508} width={14} height={60} fill="#3a4a62" />)}
      </g>
      {[230, 850].map((x, i) => (
        <g key={i}>
          <path d={`M${x} 1505 L ${x + (i ? -20 : 20)} 1110`} fill="none" stroke={INK} strokeWidth={34} strokeLinecap="round" />
          <path d={`M${x} 1505 L ${x + (i ? -20 : 20)} 1110`} fill="none" stroke="#9aa6b8" strokeWidth={20} strokeLinecap="round" />
        </g>
      ))}
      <Hoot2D t={t} talk={talk} x={130} y={1118} s={0.6} />
      <g transform={`translate(0 ${bob})`}>
        <g transform={place(540, 1530, 0.66)}>
          <JakeStanding t={t} {...jake} armL={[[410, 1110], [318, 1270 + 30 * s], [372, 1150 - 70 * s]]} armR={[[670, 1110], [762, 1270 - 30 * s], [708, 1150 + 70 * s]]} />
        </g>
        {/* sweat drops */}
        {[0, 1, 2].map((i) => {
          const k = ((t * 1.6 + i / 3) % 1);
          return <path key={i} d="M0 -18 C 10 -2 12 8 0 12 C -12 8 -10 -2 0 -18 Z" fill="#8fd0ff" {...ink(4)} transform={`translate(${(i % 2 ? 690 : 390) + (i % 2 ? 40 : -40) * k} ${640 + 70 * k}) scale(${1 - 0.4 * k})`} opacity={1 - k} />;
        })}
      </g>
    </g>
  );
};

export type TowerProps = { t: number; talk: number; grow: number; jake: { brows: number; smile: number; wide: number; gasp: number; sad: number } };

/** Two cash towers: $3,000 owed (small) vs over $7,000 paid (grows), Hoot riding the big one. */
export const Towers2D: React.FC<TowerProps> = ({ t, talk, grow, jake }) => {
  const H = 860 * easeOutCubic(clamp01(grow));
  const small = 860 * (3000 / 7039);
  const stack = (x: number, w: number, h: number, key: string) => (
    <g key={key}>
      {Array.from({ length: Math.max(1, Math.floor(h / 34)) }, (_, i) => (
        <g key={i}>
          <rect x={x - w / 2 + (i % 2 ? 6 : -6)} y={1480 - (i + 1) * 34} width={w} height={34} rx={4} fill={i % 2 ? '#8fc79a' : '#a8d8a8'} {...ink(5)} />
          <rect x={x - 22 + (i % 2 ? 6 : -6)} y={1480 - (i + 1) * 34 + 6} width={44} height={22} rx={3} fill="#e7f4e4" stroke="#2f6b45" strokeWidth={3} />
        </g>
      ))}
    </g>
  );
  const top = 1480 - Math.max(34, Math.floor(H / 34) * 34);
  return (
    <g>
      <rect x={-600} y={-400} width={2280} height={1880} fill="#2e3a59" />
      <ellipse cx={700} cy={760} rx={520} ry={700} fill="#3b4a70" />
      <rect x={-600} y={1480} width={2280} height={1000} fill="#1f2840" />
      <path d="M-600 1480 L 1680 1480" {...ink(8)} />
      <ellipse cx={640} cy={1488} rx={330} ry={18} fill="rgba(0,0,0,0.3)" />
      {stack(550, 170, small, 'owed')}
      {H > 10 && stack(770, 190, H, 'paid')}
      {/* OWED tag above the small stack */}
      <g transform={`translate(550 ${1480 - small - 64})`}>
        <rect x={-95} y={-40} width={190} height={74} rx={14} fill="#ffffff" {...ink(6)} />
        <text x={0} y={-12} textAnchor="middle" fontFamily={F} fontWeight={800} fontSize={22} fill="#5b6270">OWED</text>
        <text x={0} y={24} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={34} fill="#14171a">$3,000</text>
      </g>
      <Hoot2D t={t} talk={talk} x={770} y={top} s={0.55} />
      <g transform={place(230, 1480, 0.58)}>
        <ellipse cx={540} cy={2025} rx={260} ry={30} fill="rgba(0,0,0,0.25)" />
        <JakeStanding t={t} {...jake} armL={[[410, 1110], [345, 1300], [355, 1450]]} armR={[[670, 1110], [735, 1300], [725, 1450]]} />
      </g>
    </g>
  );
};
