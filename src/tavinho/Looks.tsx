import React from 'react';
import { AbsoluteFill } from 'remotion';
import { INK, ink } from '../toon2d/Hook2D';
import { Hand, Limb, place } from '../toon2d/parts';
import { Features, type Mood } from './cast';

/**
 * Ten candidate new looks for Tavinho (owner asked to pick a new aspect, 5 Nov 2026). Composition "TavinhoLooks", prop `look` 0..9.
 * All original designs (series bible: no cap, no broken tooth, no running tee, no stubble). Plain hands only.
 */
type Hair = 'messy' | 'afro' | 'quiff' | 'bald' | 'bun' | 'sidepart' | 'bowl' | 'spiky' | 'curlytop' | 'waves';
type Top = 'hoodie' | 'polo' | 'tee' | 'shirtbow' | 'vest' | 'stripes' | 'overshirt' | 'jacket';
type Look = {
  name: string; sub: string;
  skin: string; skinSh: string; hair: Hair; hairColor: string;
  glasses: 'round' | 'square' | 'thin' | 'none'; width: number;
  top: Top; topColor: string; topSh: string; pants: string;
  freckles?: boolean; mustache?: boolean; braces?: boolean; bigEars?: boolean; mood: Mood;
};

export const LOOKS: Look[] = [
  { name: 'O Desengonçado', sub: 'magrelo, óculos quadrados, moletom verde', skin: '#f1bf94', skinSh: '#d99d70', hair: 'messy', hairColor: '#2a1a12', glasses: 'square', width: 0.74, top: 'hoodie', topColor: '#3ddc97', topSh: '#22a873', pants: '#2c3550', mood: 'worried' },
  { name: 'O Cacheado', sub: 'black power, camisa polo mostarda', skin: '#a8714a', skinSh: '#8a5a38', hair: 'afro', hairColor: '#1b1210', glasses: 'none', width: 0.95, top: 'polo', topColor: '#f2b33d', topSh: '#c98f1e', pants: '#3a3a44', mood: 'happy' },
  { name: 'O Topetudo', sub: 'topete enorme, camiseta listrada', skin: '#f3c9a3', skinSh: '#dba67f', hair: 'quiff', hairColor: '#4a2c1a', glasses: 'none', width: 0.82, top: 'stripes', topColor: '#ffffff', topSh: '#d7e6ec', pants: '#2f4a78', mood: 'proud' },
  { name: 'O Carequinha', sub: 'careca, sobrancelhas grossas, camiseta laranja', skin: '#d9a27a', skinSh: '#bb8158', hair: 'bald', hairColor: '#3a2416', glasses: 'none', width: 1.0, top: 'tee', topColor: '#ff7a2e', topSh: '#d85a1a', pants: '#2c3550', mood: 'shock' },
  { name: 'O Coque', sub: 'coque no alto, óculos finos, camisa xadrez', skin: '#e8b48d', skinSh: '#c99069', hair: 'bun', hairColor: '#3a2416', glasses: 'thin', width: 0.86, top: 'overshirt', topColor: '#c8322a', topSh: '#9a2420', pants: '#3a3a44', mood: 'neutral' },
  { name: 'O Ruivo', sub: 'ruivo sardento, camisa e gravata-borboleta', skin: '#f7d3b5', skinSh: '#e0b08c', hair: 'sidepart', hairColor: '#d2602a', glasses: 'round', width: 0.92, top: 'shirtbow', topColor: '#bfe0ff', topSh: '#93bde6', pants: '#2c3550', freckles: true, mood: 'gulp' },
  { name: 'O Tigela', sub: 'franja de tigela, orelhudo, camiseta roxa', skin: '#f1bf94', skinSh: '#d99d70', hair: 'bowl', hairColor: '#1b1210', glasses: 'none', width: 0.9, top: 'tee', topColor: '#7b4bb8', topSh: '#5e3794', pants: '#2f4a78', bigEars: true, mood: 'worried' },
  { name: 'O Bigodinho', sub: 'bigode fininho, cabelo ondulado, jaqueta jeans', skin: '#c98b5e', skinSh: '#a86f45', hair: 'waves', hairColor: '#2a1a12', glasses: 'none', width: 0.98, top: 'jacket', topColor: '#4a78b8', topSh: '#355c90', pants: '#2c3550', mustache: true, mood: 'proud' },
  { name: 'O Platinado', sub: 'cabelo espetado platinado, moletom rosa', skin: '#f3c9a3', skinSh: '#dba67f', hair: 'spiky', hairColor: '#f2eac8', glasses: 'none', width: 0.84, top: 'hoodie', topColor: '#ff8ad8', topSh: '#d965b4', pants: '#3a3a44', mood: 'happy' },
  { name: 'O Certinho', sub: 'aparelho nos dentes, risca ao lado, colete', skin: '#e8b48d', skinSh: '#c99069', hair: 'curlytop', hairColor: '#5a3a24', glasses: 'round', width: 1.05, top: 'vest', topColor: '#3a8f7a', topSh: '#2a6b5a', pants: '#5a4636', braces: true, mood: 'happy' },
];

const HairBack: React.FC<{ l: Look }> = ({ l }) => {
  const c = l.hairColor;
  if (l.hair === 'afro') return <g>{Array.from({ length: 13 }, (_, i) => { const a = Math.PI * (0.95 + (i / 12) * 1.1); return <circle key={i} cx={540 + 230 * Math.cos(a)} cy={790 + 200 * Math.sin(a)} r={86} fill={c} {...ink(6)} />; })}<ellipse cx={540} cy={700} rx={230} ry={170} fill={c} /></g>;
  if (l.hair === 'bun') return <circle cx={540} cy={560} r={64} fill={c} {...ink(7)} />;
  return null;
};

const HairFront: React.FC<{ l: Look }> = ({ l }) => {
  const c = l.hairColor;
  switch (l.hair) {
    case 'messy': return <path d="M365 800 C 340 700 380 620 430 640 L 440 590 L 480 630 L 510 570 L 550 625 L 590 575 L 615 630 L 660 600 L 665 650 C 720 650 735 730 715 800 C 690 730 640 700 540 705 C 440 700 390 730 365 800 Z" fill={c} {...ink(8)} />;
    case 'afro': return <path d="M380 790 C 380 700 450 660 540 660 C 630 660 700 700 700 790 C 650 735 430 735 380 790 Z" fill={c} />;
    case 'quiff': return <g><path d="M370 800 C 350 690 420 640 520 640 C 600 640 690 670 710 800 C 690 730 640 710 540 712 C 450 712 400 730 370 800 Z" fill={c} {...ink(8)} /><path d="M410 700 C 390 580 520 520 650 545 C 720 560 740 625 712 670 C 680 630 610 630 570 690 C 530 650 460 660 410 700 Z" fill={c} {...ink(8)} /></g>;
    case 'bald': return <ellipse cx={600} cy={690} rx={50} ry={20} fill="#ffffff" opacity={0.35} transform="rotate(-18 600 690)" />;
    case 'bun': return <path d="M372 790 C 372 690 450 640 540 640 C 630 640 708 690 708 790 C 660 720 600 708 540 708 C 480 708 420 720 372 790 Z" fill={c} {...ink(7)} />;
    case 'sidepart': return <g><path d="M368 800 C 352 680 430 615 540 612 C 650 609 726 670 712 800 C 690 730 610 700 470 712 C 430 716 390 740 368 800 Z" fill={c} {...ink(8)} /><path d="M470 712 C 470 680 480 650 500 630" fill="none" stroke="#a94818" strokeWidth={6} /></g>;
    case 'bowl': return <path d="M360 830 C 340 690 430 610 540 610 C 650 610 740 690 720 830 L 700 770 L 380 770 Z" fill={c} {...ink(8)} />;
    case 'spiky': return <path d="M368 800 L 380 680 L 420 700 L 430 600 L 480 660 L 520 560 L 560 650 L 610 570 L 630 660 L 690 610 L 680 700 L 712 800 C 690 740 620 712 540 712 C 460 712 395 740 368 800 Z" fill={c} {...ink(8)} />;
    case 'curlytop': return <g><path d="M368 800 C 352 690 430 630 540 628 C 650 626 726 690 712 800 C 690 740 620 716 540 716 C 460 716 395 740 368 800 Z" fill={c} {...ink(8)} />{[440, 500, 560, 620].map((x, i) => <circle key={i} cx={x} cy={650 - (i % 2) * 14} r={34} fill={c} {...ink(5)} />)}</g>;
    case 'waves': return <path d="M368 800 C 345 690 420 620 540 618 C 660 616 735 690 712 800 C 700 760 680 740 650 735 C 620 760 590 720 560 740 C 530 760 500 720 470 742 C 440 760 410 730 368 800 Z" fill={c} {...ink(8)} />;
  }
};

const Glasses: React.FC<{ l: Look; ey: number }> = ({ l, ey }) => {
  if (l.glasses === 'none') return null;
  const xs = [470, 612];
  if (l.glasses === 'square') return <g>{xs.map((x, i) => <rect key={i} x={x - 62} y={ey - 48} width={124} height={96} rx={14} fill="rgba(200,230,255,0.18)" stroke={INK} strokeWidth={11} />)}<path d="M532 846 L 550 846" stroke={INK} strokeWidth={10} /></g>;
  if (l.glasses === 'thin') return <g>{xs.map((x, i) => <ellipse key={i} cx={x} cy={ey} rx={56} ry={44} fill="none" stroke="#8a6440" strokeWidth={6} />)}<path d="M526 846 L 556 846" stroke="#8a6440" strokeWidth={6} /></g>;
  return <g>{xs.map((x, i) => <circle key={i} cx={x} cy={ey} r={60} fill="rgba(200,230,255,0.18)" stroke={INK} strokeWidth={10} />)}<path d="M534 848 Q 541 836 548 848" fill="none" stroke={INK} strokeWidth={9} /></g>;
};

/** One candidate look, standing, in the same body coordinates as the cast (face ~ (540, 840), feet at y 2020). */
export const LookFigure: React.FC<{ l: Look; t: number }> = ({ l, t }) => {
  const w = l.width;
  const X = (x: number) => 540 + (x - 540) * w;
  const ey = 852;
  const armL = [[X(380), 1150], [X(260), 1340], [X(280), 1500]];
  const armR = [[X(700), 1150], [X(820), 1340], [X(800), 1500]];
  const sleeve = l.top === 'tee' || l.top === 'polo' || l.top === 'stripes' || l.top === 'vest' ? l.skin : l.topColor;
  return (
    <g>
      <ellipse cx={540} cy={2016} rx={230 * w} ry={26} fill="#000" opacity={0.22} />
      <path d={`M${X(410)} 1760 L ${X(530)} 1760 L ${X(526)} 1965 L ${X(414)} 1965 Z`} fill={l.pants} {...ink(8)} />
      <path d={`M${X(550)} 1760 L ${X(670)} 1760 L ${X(666)} 1965 L ${X(554)} 1965 Z`} fill={l.pants} {...ink(8)} />
      {[X(462), X(618)].map((x, i) => <path key={i} d={`M${x - 66} 2016 C ${x - 70} 1975 ${x - 40} 1955 ${x} 1955 C ${x + 40} 1955 ${x + 70} 1975 ${x + 66} 2016 Z`} fill={i ? '#ffffff' : '#ffffff'} {...ink(7)} />)}
      {/* torso */}
      <path d={`M${X(340)} 1780 C ${X(220)} 1640 ${X(230)} 1200 ${X(410)} 1100 L ${X(670)} 1100 C ${X(850)} 1200 ${X(860)} 1640 ${X(740)} 1780 Z`} fill={l.topColor} {...ink(8)} />
      <path d={`M${X(690)} 1130 C ${X(810)} 1220 ${X(830)} 1600 ${X(730)} 1770 L ${X(690)} 1770 C ${X(750)} 1600 ${X(750)} 1260 ${X(690)} 1130 Z`} fill={l.topSh} />
      {l.top === 'stripes' && [1200, 1300, 1400, 1500, 1600, 1700].map((y, i) => <path key={i} d={`M${X(250)} ${y} L ${X(830)} ${y}`} stroke="#3a5ba0" strokeWidth={22} opacity={0.85} />)}
      {l.top === 'overshirt' && [X(400), X(500), X(600), X(700)].map((x, i) => <path key={i} d={`M${x} 1120 L ${x} 1770`} stroke="#1b1420" strokeWidth={6} opacity={0.35} />)}
      {l.top === 'overshirt' && [1250, 1400, 1550, 1700].map((y, i) => <path key={i} d={`M${X(260)} ${y} L ${X(820)} ${y}`} stroke="#1b1420" strokeWidth={6} opacity={0.35} />)}
      {l.top === 'hoodie' && <g><path d="M440 1110 C 440 1040 640 1040 640 1110 C 610 1150 470 1150 440 1110 Z" fill={l.topSh} {...ink(7)} />{[510, 570].map((x, i) => <path key={i} d={`M${x} 1130 L ${x + (i ? 6 : -6)} 1260`} stroke="#ffffff" strokeWidth={7} strokeLinecap="round" />)}<path d={`M${X(400)} 1560 L ${X(680)} 1560 L ${X(710)} 1700 L ${X(370)} 1700 Z`} fill="none" stroke={l.topSh} strokeWidth={8} /></g>}
      {l.top === 'polo' && <g><path d="M470 1100 L 540 1170 L 610 1100" fill="#ffffff" {...ink(5)} />{[1190, 1240].map((y) => <circle key={y} cx={540} cy={y} r={9} fill="#ffffff" {...ink(3)} />)}</g>}
      {(l.top === 'tee' || l.top === 'stripes') && <path d="M470 1100 Q 540 1150 610 1100" fill="none" {...ink(7)} />}
      {l.top === 'shirtbow' && <g><path d="M455 1095 L 520 1160 L 540 1100 Z M625 1095 L 560 1160 L 540 1100 Z" fill="#ffffff" {...ink(6)} /><path d="M540 1130 L 490 1105 L 490 1155 Z M540 1130 L 590 1105 L 590 1155 Z" fill="#e2453c" {...ink(5)} /><circle cx={540} cy={1130} r={12} fill="#b5302a" {...ink(4)} />{[1250, 1380, 1510].map((y) => <circle key={y} cx={540} cy={y} r={10} fill="#ffffff" {...ink(4)} />)}</g>}
      {l.top === 'vest' && <g><path d="M470 1100 L 540 1220 L 610 1100" fill="#ffffff" {...ink(5)} /><path d="M520 1110 L 560 1110 L 556 1140 L 524 1140 Z M524 1140 L 556 1140 L 570 1300 L 540 1330 L 510 1300 Z" fill="#c8322a" {...ink(5)} /></g>}
      {l.top === 'jacket' && <g><path d="M540 1110 L 540 1770" stroke={l.topSh} strokeWidth={10} />{[X(420), X(660)].map((x, i) => <rect key={i} x={x - 50} y={1300} width={100} height={70} rx={8} fill="none" stroke={l.topSh} strokeWidth={7} />)}<path d="M470 1100 L 540 1180 L 610 1100" fill="#ffffff" {...ink(5)} /></g>}
      {/* neck, arms (short sleeves show the forearms), plain hands */}
      <path d="M500 1020 L 500 1100 C 520 1112 560 1112 580 1100 L 580 1020 Z" fill={l.skinSh} {...ink(6)} />
      <Limb pts={armL} w={84} color={sleeve} />
      <Limb pts={armR} w={84} color={sleeve} />
      {sleeve === l.skin && [armL, armR].map((a, i) => <Limb key={i} pts={[a[0], [a[0][0] + (a[1][0] - a[0][0]) * 0.5, a[0][1] + (a[1][1] - a[0][1]) * 0.5]]} w={96} color={l.top === 'stripes' ? '#ffffff' : l.topColor} />)}
      <Hand x={armL[2][0]} y={1500} angle={8} color={l.skin} flipThumb r={40} />
      <Hand x={armR[2][0]} y={1500} angle={-8} color={l.skin} r={40} />
      {/* head */}
      <g transform={`translate(0 ${3 * Math.sin(t * 2.2)})`}>
        <HairBack l={l} />
        {[352, 728].map((x, i) => <ellipse key={i} cx={x} cy={858} rx={l.bigEars ? 52 : 30} ry={l.bigEars ? 62 : 40} fill={l.skin} {...ink(7)} />)}
        <path d="M362 820 C 362 690 450 640 540 640 C 630 640 718 690 718 820 C 718 930 670 1030 540 1030 C 410 1030 362 930 362 820 Z" fill={l.skin} {...ink(8)} />
        <path d="M650 680 C 700 720 716 790 712 850 C 706 940 664 1000 600 1022 C 650 970 676 905 680 840 C 684 770 672 715 650 680 Z" fill={l.skinSh} opacity={0.7} />
        <HairFront l={l} />
        {l.freckles && [[430, 900], [455, 920], [410, 925], [650, 900], [625, 920], [670, 925]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={6} fill="#b5602a" opacity={0.8} />)}
        {[420, 660].map((x, i) => <ellipse key={i} cx={x} cy={930} rx={40} ry={22} fill="#ff8f86" opacity={0.45} />)}
        <Features t={t} mood={l.mood} ex={[470, 612]} ey={ey} mouthY={965} seed={0.3} period={3.1} eyeR={30} />
        {l.hair === 'bald' && [[470, -1], [612, 1]].map(([x, s], i) => <path key={i} d={`M${x - 40} ${ey - 62 + s * 4} L ${x + 40} ${ey - 62 - s * 4}`} stroke="#3a2416" strokeWidth={22} strokeLinecap="round" />)}
        <ellipse cx={541} cy={905} rx={20} ry={16} fill={l.skinSh} {...ink(5)} />
        {l.mustache && <path d="M541 930 C 510 920 480 926 470 944 C 500 938 520 942 541 944 C 562 942 582 938 612 944 C 602 926 572 920 541 930 Z" fill="#2a1a12" {...ink(3)} />}
        {l.braces && <path d={`M${495} 978 L 587 978`} stroke="#c9ced6" strokeWidth={8} strokeDasharray="10 6" />}
        <Glasses l={l} ey={ey} />
      </g>
    </g>
  );
};

/** One look on a simple room "set", with its number and name, for the owner to pick from. */
export const TavinhoLooks: React.FC<{ look: number }> = ({ look }) => {
  const l = LOOKS[look] ?? LOOKS[0];
  return (
    <AbsoluteFill style={{ background: '#f3dfb8' }}>
      <svg viewBox="0 0 1080 1350" width="100%" height="100%">
        {Array.from({ length: 5 }, (_, r) => Array.from({ length: 9 }, (_, c) => <rect key={`${r}-${c}`} x={c * 124 - 20} y={620 + r * 110} width={118} height={104} fill={(r + c) % 2 ? '#e9f1f4' : '#d7e6ec'} />))}
        <rect x={0} y={1180} width={1080} height={170} fill="#b07a48" />
        <rect x={70} y={170} width={300} height={330} rx={12} fill="#9fdcff" {...ink(8)} />
        <circle cx={300} cy={280} r={50} fill="#ffe08a" />
        <g transform={place(560, 1330, 0.78)}><LookFigure l={l} t={0.6} /></g>
        <rect x={40} y={36} width={1000} height={110} rx={26} fill="#1b1420" />
        <text x={80} y={112} fontFamily="Montserrat, Arial Black, sans-serif" fontWeight={900} fontSize={62} fill="#ff7a2e">{`${look + 1}`}</text>
        <text x={170} y={84} fontFamily="Montserrat, Arial Black, sans-serif" fontWeight={900} fontSize={44} fill="#fff4e0">{l.name}</text>
        <text x={170} y={126} fontFamily="Montserrat, Arial Black, sans-serif" fontWeight={700} fontSize={28} fill="#fff4e0" opacity={0.85}>{l.sub}</text>
      </svg>
    </AbsoluteFill>
  );
};
