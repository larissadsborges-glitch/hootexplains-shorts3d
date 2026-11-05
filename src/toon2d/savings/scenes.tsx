import React from 'react';
import { clamp01, easeOutBack, easeOutCubic, lerp } from '../../lib/anim';
import { Hoot2D, INK, ink, Jake2D, SKIN } from '../Hook2D';
import { JakeStanding, place } from '../parts';

/**
 * money4 (low savings interest) scenes, 1080×1920 scene units. New places and a new outfit for Jake
 * (owner: vary sets and looks between videos, keep the characters recognisable).
 */
const F = 'Montserrat, Arial Black, sans-serif';
export const JACKET = { main: '#e9a23b', shade: '#c4832a' };

type Face = { brows?: number; smile?: number; sad?: number; wide?: number; gasp?: number; grit?: number };

/* ------------------------------------------------------------------ bank lobby */
/** The receipt Jake holds up: rate and interest paid. up = the new account's numbers. */
const Receipt: React.FC<{ t: number; good: number; pulse: number }> = ({ t, good, pulse }) => {
  const g = good > 0.5;
  return (
    <g transform={`translate(715 815) rotate(${4 + 1.5 * Math.sin(t * 1.4)}) scale(${1 + 0.08 * pulse})`}>
      <path d="M-115 -175 L 115 -175 L 115 165 L 100 178 L 85 165 L 70 178 L 55 165 L 40 178 L 25 165 L 10 178 L -5 165 L -20 178 L -35 165 L -50 178 L -65 165 L -80 178 L -95 165 L -115 178 Z" fill="#fffdf6" {...ink(7)} />
      <text x={0} y={-132} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={30} fill="#2f4a78">{g ? 'NEW SAVINGS' : 'BIG BANK'}</text>
      <path d="M-95 -112 L 95 -112" stroke="#c9ccd3" strokeWidth={4} strokeDasharray="10 8" />
      <text x={-95} y={-74} fontFamily={F} fontWeight={800} fontSize={22} fill="#5b6270">SAVED</text>
      <text x={95} y={-72} textAnchor="end" fontFamily={F} fontWeight={900} fontSize={26} fill="#14171a">$10,000</text>
      <text x={-95} y={-32} fontFamily={F} fontWeight={800} fontSize={22} fill="#5b6270">RATE</text>
      <text x={95} y={-30} textAnchor="end" fontFamily={F} fontWeight={900} fontSize={26} fill="#14171a">{g ? '~4%' : '0.38%'}</text>
      <path d="M-95 -8 L 95 -8" stroke="#c9ccd3" strokeWidth={4} strokeDasharray="10 8" />
      <text x={0} y={30} textAnchor="middle" fontFamily={F} fontWeight={800} fontSize={22} fill="#5b6270">INTEREST, 1 YEAR</text>
      <text x={0} y={112} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={84} fill={g ? '#1f8a45' : '#d6281c'}>{g ? '$400' : '$38'}</text>
    </g>
  );
};

export type LobbyProps = { t: number; talk: number; face: Face; tag: number; receipt: number; good: number; pulse: number };

/** Jake in front of the bank counter holding his receipt; Hoot on the counter. */
export const Lobby2D: React.FC<LobbyProps> = ({ t, talk, face, tag, receipt, good, pulse }) => (
  <g>
    <rect x={-600} y={-400} width={2280} height={2000} fill="#e9e1cf" />
    {Array.from({ length: 12 }, (_, i) => <rect key={i} x={-560 + i * 200} y={-400} width={90} height={2000} fill="#e2d8c2" />)}
    {/* columns */}
    {[30, 1050].map((x, i) => (
      <g key={i}>
        <rect x={x - 70} y={200} width={140} height={1100} fill="#f6f1e4" {...ink(7)} />
        {[-35, 0, 35].map((d) => <path key={d} d={`M${x + d} 240 L ${x + d} 1260`} stroke="#ddd3bd" strokeWidth={8} />)}
        <rect x={x - 90} y={180} width={180} height={40} rx={6} fill="#f6f1e4" {...ink(7)} />
      </g>
    ))}
    {/* bank sign */}
    <g transform="translate(540 540)">
      <rect x={-250} y={-60} width={500} height={120} rx={20} fill="#2f4a78" {...ink(8)} />
      <circle cx={-180} cy={0} r={36} fill="#f0c040" {...ink(5)} />
      <text x={-180} y={14} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={40} fill="#8a5a10">$</text>
      <text x={30} y={22} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={64} fill="#ffffff" letterSpacing={3}>BIG BANK</text>
    </g>
    {/* counter behind Jake */}
    <rect x={-600} y={1180} width={2280} height={40} fill="#a86f45" {...ink(7)} />
    <rect x={-600} y={1218} width={2280} height={380} fill="#8a5a3a" {...ink(7)} />
    {Array.from({ length: 8 }, (_, i) => <rect key={i} x={-520 + i * 300} y={1260} width={220} height={280} rx={10} fill="#7a4e32" />)}
    <rect x={-600} y={1560} width={2280} height={800} fill="#c9b79a" />
    <path d="M-600 1560 L 1680 1560" {...ink(8)} />
    {/* coin rolls on the counter, Hoot on top */}
    {[0, 1, 2].map((i) => <rect key={i} x={40 + i * 50} y={1110} width={44} height={72} rx={10} fill="#f0c040" {...ink(5)} />)}
    <Hoot2D t={t} talk={talk} x={112} y={1112} s={0.62} />
    {/* the receipt sits behind Jake so his raised hand grips its edge */}
    {receipt > 0 && <g opacity={clamp01(receipt * 3)}><Receipt t={t} good={good} pulse={pulse} /></g>}
    {/* Jake (new outfit) */}
    <g transform={place(330, 1560, 0.66)}>
      <ellipse cx={540} cy={2025} rx={260} ry={30} fill="rgba(0,0,0,0.18)" />
      <JakeStanding t={t} {...face} jacket={JACKET} armL={[[410, 1110], [345, 1300], [355, 1450]]} armR={[[670, 1110], [820, 1200], [945, 1060]]} />
      {/* "HELLO, I'M JAKE" name sticker on "This is Jake" */}
      {tag > 0 && (
        <g transform={`translate(430 1160) rotate(-6) scale(${1.4 * easeOutBack(clamp01(tag))})`}>
          <rect x={-95} y={-62} width={190} height={124} rx={14} fill="#ffffff" stroke="#d6281c" strokeWidth={8} />
          <rect x={-95} y={-62} width={190} height={46} rx={10} fill="#d6281c" />
          <text x={0} y={-30} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={24} fill="#ffffff">HELLO, I'M</text>
          <text x={0} y={42} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={52} fill="#14171a">JAKE</text>
        </g>
      )}
    </g>
  </g>
);

/* ------------------------------------------------------------------ supermarket */
const ITEMS = [
  { name: 'MILK', price: 4.0, c: '#ffffff', w: 90, h: 150 },
  { name: 'BREAD', price: 3.0, c: '#e0a95a', w: 130, h: 90 },
  { name: 'CEREAL', price: 5.0, c: '#e2453c', w: 110, h: 170 },
  { name: 'EGGS', price: 4.5, c: '#f6efe0', w: 140, h: 70 },
];

export type ShopProps = { t: number; talk: number; face: Face; flip: number };

/** Jake in a supermarket aisle with a basket; the price tags flip up 3.7% on "3.7". */
export const Shop2D: React.FC<ShopProps> = ({ t, talk, face, flip }) => {
  const shelf = (y: number, row: number) => (
    <g key={y}>
      {ITEMS.concat(ITEMS).map((it, i) => {
        const x = -420 + i * 230 + (row % 2) * 90;
        const k = it.price * (1 + 0.037 * flip);
        return (
          <g key={i}>
            <rect x={x - it.w / 2} y={y - it.h} width={it.w} height={it.h} rx={10} fill={it.c} {...ink(6)} />
            <text x={x} y={y - it.h / 2 + 8} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={20} fill="#14171a">{it.name}</text>
            <g transform={`translate(${x} ${y + 36}) scale(1 ${Math.abs(Math.cos(Math.PI * clamp01((flip - (i % 4) * 0.08) * 2) / 1))})`}>
              <rect x={-52} y={-22} width={104} height={44} rx={6} fill={flip > 0.5 ? '#ffd21f' : '#ffffff'} {...ink(4)} />
              <text x={0} y={10} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={26} fill={flip > 0.5 ? '#d6281c' : '#14171a'}>${k.toFixed(2)}</text>
            </g>
          </g>
        );
      })}
      <rect x={-600} y={y} width={2280} height={14} fill="#9aa6b8" {...ink(5)} />
    </g>
  );
  return (
    <g>
      <rect x={-600} y={-400} width={2280} height={2000} fill="#dfe8f0" />
      <rect x={-600} y={200} width={2280} height={1050} fill="#c3ccd8" {...ink(6)} />
      {shelf(470, 0)}
      {shelf(740, 1)}
      {shelf(1010, 0)}
      <rect x={-600} y={1250} width={2280} height={1200} fill="#e7e2d6" />
      {Array.from({ length: 12 }, (_, i) => <path key={i} d={`M${-600 + i * 200} 1250 L ${-900 + i * 260} 2400`} stroke="#d8d2c4" strokeWidth={6} />)}
      <path d="M-600 1250 L 1680 1250" {...ink(7)} />
      <Hoot2D t={t} talk={talk} x={200} y={740} s={0.58} />
      <g transform={place(520, 1640, 0.68)}>
        <ellipse cx={540} cy={2025} rx={260} ry={30} fill="rgba(0,0,0,0.18)" />
        <JakeStanding
          t={t} {...face} jacket={JACKET}
          armL={[[410, 1110], [370, 1280], [440, 1380]]} armR={[[670, 1110], [710, 1280], [640, 1380]]}
          front={(
            <g>
              {/* shopping basket held at the waist */}
              <path d="M340 1390 L 740 1390 L 700 1600 L 380 1600 Z" fill="#2fa84f" {...ink(8)} />
              {[0, 1, 2, 3].map((k) => <path key={k} d={`M${400 + k * 90} 1420 L ${410 + k * 80} 1580`} stroke="#1f7a38" strokeWidth={10} />)}
              <rect x={400} y={1300} width={80} height={100} rx={8} fill="#ffffff" {...ink(5)} />
              <rect x={500} y={1330} width={120} height={70} rx={10} fill="#e0a95a" {...ink(5)} />
            </g>
          )}
        />
      </g>
    </g>
  );
};

/* ------------------------------------------------------------------ the Fed */
export type FedProps = { t: number; talk: number; face: Face; drive: number; plate: number };

/** Street: the bank's armoured truck drives cash to THE FED, which pays the bank 3.9%. */
export const Fed2D: React.FC<FedProps> = ({ t, talk, face, drive, plate }) => {
  const tx = lerp(150, 640, easeOutCubic(clamp01(drive)));
  return (
    <g>
      <rect x={-600} y={-400} width={2280} height={1600} fill="#8fd0ff" />
      {[[120, 380, 1], [760, 300, 0.8]].map(([x, y, s], i) => (
        <g key={i} transform={`translate(${x + 12 * Math.sin(t * 0.3 + i)} ${y}) scale(${s})`}>
          <ellipse cx={0} cy={0} rx={70} ry={30} fill="#ffffff" /><ellipse cx={-36} cy={-18} rx={40} ry={28} fill="#ffffff" /><ellipse cx={30} cy={-22} rx={44} ry={32} fill="#ffffff" />
        </g>
      ))}
      {/* small bank */}
      <g>
        <rect x={40} y={700} width={360} height={450} fill="#f6f1e4" {...ink(8)} />
        <rect x={20} y={660} width={400} height={60} rx={8} fill="#2f4a78" {...ink(7)} />
        <text x={220} y={702} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={34} fill="#ffffff">BIG BANK</text>
        <rect x={170} y={960} width={100} height={190} rx={10} fill="#8a5a3a" {...ink(6)} />
        {[80, 300].map((x) => <rect key={x} x={x} y={790} width={70} height={90} rx={6} fill="#bfe3ff" {...ink(5)} />)}
      </g>
      {/* THE FED: a big columned building */}
      <g>
        <path d="M480 560 L 740 430 L 1000 560 Z" fill="#f6f1e4" {...ink(8)} />
        <rect x={480} y={560} width={520} height={60} fill="#ece4d2" {...ink(7)} />
        <text x={740} y={604} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={40} fill="#2f4a78" letterSpacing={4}>THE FED</text>
        {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={510 + i * 98} y={620} width={52} height={460} fill="#f6f1e4" {...ink(6)} />)}
        <rect x={470} y={1080} width={540} height={70} fill="#ece4d2" {...ink(7)} />
        {/* rate plate on the pediment */}
        <g transform={`translate(740 515) scale(${plate > 0 ? lerp(1.4, 1, easeOutBack(clamp01(plate))) : 1})`}>
          <rect x={-95} y={-30} width={190} height={58} rx={10} fill={plate > 0 ? '#ffd21f' : '#d8cfba'} {...ink(5)} />
          {plate > 0 && <text x={0} y={12} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={34} fill="#1f8a45">+3.9%</text>}
        </g>
      </g>
      {/* road */}
      <rect x={-600} y={1150} width={2280} height={160} fill="#55606e" {...ink(7)} />
      {Array.from({ length: 12 }, (_, i) => <rect key={i} x={-560 + i * 200} y={1222} width={100} height={14} rx={7} fill="#f0e6a0" />)}
      <rect x={-600} y={1310} width={2280} height={1200} fill="#b9c4b0" />
      {/* armoured truck with the cash */}
      <g transform={`translate(${tx} 1150)`}>
        <rect x={-120} y={-130} width={180} height={110} rx={12} fill="#5f7a8a" {...ink(7)} />
        <rect x={60} y={-100} width={70} height={80} rx={10} fill="#4b6372" {...ink(7)} />
        <rect x={74} y={-90} width={42} height={34} rx={6} fill="#bfe3ff" {...ink(4)} />
        <text x={-30} y={-62} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={44} fill="#f0c040" stroke={INK} strokeWidth={3}>$</text>
        {[-70, 90].map((x) => <circle key={x} cx={x} cy={-18} r={26} fill="#2a2f38" {...ink(6)} />)}
      </g>
      <Hoot2D t={t} talk={talk} x={300} y={662} s={0.6} />
      {/* Jake watches from the sidewalk */}
      <g transform={place(170, 1560, 0.46)}>
        <JakeStanding t={t} {...face} jacket={JACKET} armL={[[410, 1110], [345, 1300], [355, 1450]]} armR={[[670, 1110], [735, 1300], [725, 1450]]} />
      </g>
    </g>
  );
};

/* ------------------------------------------------------------------ the couch, 17 years */
export type CouchProps = { t: number; talk: number; face: Face; year: number; web: number };

/** Jake comfy on the couch with popcorn while the calendar flips 17 years and cobwebs grow. */
export const Couch2D: React.FC<CouchProps> = ({ t, talk, face, year, web }) => (
  <g>
    <rect x={-600} y={-400} width={2280} height={2000} fill="#f3d9c9" />
    {Array.from({ length: 30 }, (_, i) => <circle key={i} cx={-560 + (i % 10) * 240} cy={-200 + Math.floor(i / 10) * 300 + (i % 2) * 120} r={14} fill="#ecc9b6" />)}
    {/* calendar */}
    <g transform="translate(200 560)">
      <rect x={-115} y={-120} width={230} height={250} rx={12} fill="#ffffff" {...ink(7)} />
      <rect x={-115} y={-120} width={230} height={64} rx={12} fill="#2f4a78" {...ink(7)} />
      <text x={0} y={-76} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={34} fill="#ffffff">YEAR</text>
      <text x={0} y={70} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={120} fill="#14171a">{year}</text>
    </g>
    {/* framed "BIG BANK · SINCE YEAR 1" certificate */}
    <g transform="translate(850 520) rotate(3)">
      <rect x={-110} y={-80} width={220} height={160} rx={8} fill="#fff4e0" {...ink(7)} />
      <text x={0} y={-20} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={26} fill="#2f4a78">BIG BANK</text>
      <text x={0} y={22} textAnchor="middle" fontFamily={F} fontWeight={800} fontSize={20} fill="#5b6270">LOYAL</text>
      <text x={0} y={50} textAnchor="middle" fontFamily={F} fontWeight={800} fontSize={20} fill="#5b6270">CUSTOMER</text>
    </g>
    <rect x={-600} y={1440} width={2280} height={1000} fill="#a87a5a" />
    <path d="M-600 1440 L 1680 1440" {...ink(8)} />
    {/* couch back */}
    <rect x={90} y={880} width={900} height={440} rx={70} fill="#6c5bc0" {...ink(9)} />
    <g transform="translate(0 -60)"><Jake2D t={t} brows={face.brows ?? 0} flip={0} smile={face.smile ?? 0.4} sad={face.sad} wide={face.wide} jacket={JACKET} noChair /></g>
    {/* popcorn bowl in both hands */}
    <g transform="translate(540 1085)">
      {Array.from({ length: 9 }, (_, i) => <circle key={i} cx={-110 + i * 27} cy={-30 - 18 * Math.sin(i * 1.7)} r={26} fill="#fff6d8" {...ink(4)} />)}
      <path d="M-160 -20 L 160 -20 L 120 90 L -120 90 Z" fill="#e2453c" {...ink(7)} />
      {[-90, -30, 30, 90].map((x) => <rect key={x} x={x - 12} y={-14} width={24} height={98} fill="#ffffff" opacity={0.9} />)}
    </g>
    {[[372, 1055, 1], [708, 1055, -1]].map(([x, y, s], i) => (
      <g key={i} transform={`translate(${x} ${y - 60 + 70})`}>
        <ellipse cx={0} cy={6} rx={40} ry={44} fill={SKIN} {...ink(7)} />
        {[-20, 0, 20].map((dy, k) => <path key={k} d={`M${-s * 6} ${dy - 8} q ${s * 34} 2 ${s * 36} 14`} fill="none" {...ink(5)} />)}
      </g>
    ))}
    {/* seat + armrests */}
    <rect x={60} y={1260} width={960} height={200} rx={40} fill="#5a4aa8" {...ink(9)} />
    {[60, 870].map((x) => <rect key={x} x={x} y={1080} width={150} height={300} rx={60} fill="#7a6bd0" {...ink(8)} />)}
    {/* cobwebs grow in the corners while the years pass */}
    {web > 0 && [[90, 880, 1], [990, 880, -1]].map(([x, y, s], i) => (
      <g key={i} transform={`translate(${x} ${y}) scale(${s * web} ${web})`} opacity={0.85}>
        {[0, 30, 60, 90].map((a) => <path key={a} d={`M0 0 L ${160 * Math.cos((a * Math.PI) / 180)} ${160 * Math.sin((a * Math.PI) / 180)}`} stroke="#ffffff" strokeWidth={4} />)}
        {[50, 100, 150].map((r) => <path key={r} d={`M${r} 0 Q ${r * 0.8} ${r * 0.8} 0 ${r}`} fill="none" stroke="#ffffff" strokeWidth={4} />)}
      </g>
    ))}
    <Hoot2D t={t} talk={talk} x={945} y={1085} s={0.6} />
  </g>
);

/* ------------------------------------------------------------------ two jars */
export type JarsProps = { t: number; talk: number; face: Face; fill: number };

/** Two savings jars on a table: 0.38% (a few coins) vs ~4% (fills up to $400). */
export const Jars2D: React.FC<JarsProps> = ({ t, talk, face, fill }) => {
  const jar = (cx: number, label: string, rate: string, level: number, amount: string, color: string) => (
    <g>
      <rect x={cx - 115} y={1150 - 20 - 300 * level} width={230} height={300 * level + 2} fill="#f0c040" />
      {Array.from({ length: Math.floor(level * 9) }, (_, i) => <path key={i} d={`M${cx - 110} ${1128 - i * 33} L ${cx + 110} ${1128 - i * 33}`} stroke="#c9961f" strokeWidth={5} />)}
      <rect x={cx - 125} y={780} width={250} height={370} rx={36} fill="rgba(200,235,255,0.35)" {...ink(8)} />
      <rect x={cx - 105} y={745} width={210} height={50} rx={10} fill={color} {...ink(7)} />
      <text x={cx} y={780} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={30} fill="#ffffff">{rate}</text>
      <rect x={cx - 108} y={830} width={216} height={56} rx={10} fill="#ffffff" {...ink(5)} />
      <text x={cx} y={866} textAnchor="middle" fontFamily={F} fontWeight={800} fontSize={label.length > 10 ? 18 : 22} fill="#14171a">{label}</text>
      <text x={cx} y={970} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={60} fill={color} stroke="#ffffff" strokeWidth={8} paintOrder="stroke">{amount}</text>
    </g>
  );
  const k = easeOutCubic(clamp01(fill));
  return (
    <g>
      <rect x={-600} y={-400} width={2280} height={2000} fill="#cfe3d6" />
      <rect x={-600} y={300} width={2280} height={10} fill="#bdd6c6" />
      <g transform={place(540, 1464, 0.62)}>
        <JakeStanding t={t} {...face} jacket={JACKET} armL={[[410, 1110], [360, 1300], [420, 1430]]} armR={[[670, 1110], [720, 1300], [660, 1430]]} />
      </g>
      {/* table */}
      <rect x={-600} y={1150} width={2280} height={44} fill="#a86f45" {...ink(7)} />
      <rect x={-600} y={1192} width={2280} height={1300} fill="#8a5a3a" />
      {jar(235, 'BIG BANK', '0.38%', 0.05 + 0.03 * k, '$38', '#d6281c')}
      {jar(830, 'INSURED SAVINGS', '~4%', 0.05 + 0.75 * k, `$${Math.round(400 * k)}`, '#1f8a45')}
      <Hoot2D t={t} talk={talk} x={830} y={748} s={0.52} />
    </g>
  );
};
