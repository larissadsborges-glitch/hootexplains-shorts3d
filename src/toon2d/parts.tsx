import React from 'react';
import { HOODIE, INK, ink, JakeHead, SKIN } from './Hook2D';

/**
 * Shared 2D body parts. "Body coords": the same space as JakeHead (face around 540, 820),
 * full body from the hair top (≈ y 560) to the soles (y 2020). Place a character with
 * <g transform={place(x, feetY, scale)}>.
 */
export const place = (x: number, feetY: number, s: number) => `translate(${x} ${feetY}) scale(${s}) translate(-540 -2020)`;

const HOODIE_SH = '#b9402b', JEANS = '#2f4a78', JEANS_SH = '#243a60';

/** A cartoon limb: a thick rounded stroke through shoulder → elbow → hand, with an ink rim. */
export const Limb: React.FC<{ pts: number[][]; w: number; color: string; shade?: string }> = ({ pts, w, color, shade }) => {
  const d = `M${pts.map((p) => p.join(' ')).join(' L ')}`;
  return (
    <g>
      <path d={d} fill="none" stroke={INK} strokeWidth={w + 16} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
      {shade && <path d={d} fill="none" stroke={shade} strokeWidth={w * 0.28} strokeLinecap="round" strokeLinejoin="round" transform={`translate(${w * 0.22} 0)`} opacity={0.9} />}
    </g>
  );
};

/** A mitten hand with a thumb, rotated to point along `angle` (degrees, 0 = down). */
export const Hand: React.FC<{ x: number; y: number; angle?: number; r?: number; color?: string; flipThumb?: boolean }> = ({ x, y, angle = 0, r = 36, color = SKIN, flipThumb }) => (
  <g transform={`translate(${x} ${y}) rotate(${angle})`}>
    <path d={`M${-r} ${-r * 0.4} C ${-r} ${r * 1.2} ${r} ${r * 1.2} ${r} ${-r * 0.4} C ${r} ${-r} ${-r} ${-r} ${-r} ${-r * 0.4} Z`} fill={color} {...ink(7)} />
    <path d={`M${(flipThumb ? -1 : 1) * r * 0.85} ${-r * 0.3} q ${(flipThumb ? -1 : 1) * r * 0.55} ${r * 0.1} ${(flipThumb ? -1 : 1) * r * 0.35} ${r * 0.75}`} fill={color} {...ink(6)} />
    {[-0.35, 0.05, 0.45].map((k, i) => <path key={i} d={`M${r * k} ${r * 0.55} l 0 ${r * 0.35}`} fill="none" {...ink(4)} />)}
  </g>
);

/** Jake standing, front view. arms: points in body coords; hold: drawn at the right hand (screen right). */
export const JakeStanding: React.FC<{
  t: number; brows?: number; smile?: number; sad?: number; look?: [number, number]; wide?: number; gasp?: number; grit?: number;
  armL: number[][]; armR: number[][]; holdR?: React.ReactNode; hat?: boolean; front?: React.ReactNode;
  /** an open jacket over a white tee instead of the red hoodie (outfit variety between videos) */
  jacket?: { main: string; shade: string };
}> = ({ t, brows = 0, smile = 0.4, sad = 0, look = [0, 0], wide = 0, gasp = 0, grit = 0, armL, armR, holdR, hat, front, jacket }) => {
  const TOP = jacket?.main ?? HOODIE, TOP_SH = jacket?.shade ?? HOODIE_SH;
  const breathe = 4 * Math.sin(t * 2.1);
  const hR = armR[armR.length - 1], hL = armL[armL.length - 1];
  const aR = (Math.atan2(hR[0] - armR[1][0], hR[1] - armR[1][1]) * -180) / Math.PI;
  const aL = (Math.atan2(hL[0] - armL[1][0], hL[1] - armL[1][1]) * -180) / Math.PI;
  return (
    <g>
      {/* legs: tapered jeans with a knee crease */}
      <path d="M392 1400 L 535 1400 L 528 1950 L 418 1950 Z" fill={JEANS} {...ink(8)} />
      <path d="M545 1400 L 688 1400 L 662 1950 L 552 1950 Z" fill={JEANS} {...ink(8)} />
      <path d="M640 1420 L 682 1420 L 660 1945 L 630 1945 Z" fill={JEANS_SH} />
      <path d="M440 1690 q 30 12 60 0 M 578 1690 q 30 12 60 0" fill="none" stroke={JEANS_SH} strokeWidth={6} strokeLinecap="round" />
      <path d="M540 1400 L 540 1520" fill="none" {...ink(6)} />
      {/* sneakers: white with a red stripe, toes turned out */}
      {[[473, -1], [607, 1]].map(([x, s], i) => (
        <g key={i} transform={`translate(${x} 1965)`}>
          <path d={`M${-62 + s * 8} 40 C ${-70 + s * 8} -10 ${-40 + s * 6} -30 ${s * 10} -30 C ${50 + s * 18} -30 ${82 + s * 30} 0 ${82 + s * 34} 40 Z`} fill="#f7f5f0" {...ink(7)} transform={s < 0 ? 'scale(-1 1)' : undefined} />
          <path d="M-40 14 L 70 14" fill="none" stroke="#e2453c" strokeWidth={12} strokeLinecap="round" transform={s < 0 ? 'scale(-1 1) translate(-30 0)' : 'translate(-10 0)'} />
        </g>
      ))}
      <g transform={`translate(0 ${breathe})`}>
        {/* hood + torso (hoodie hem with ribbing) */}
        {!jacket && <path d="M410 1075 C 420 1010 660 1010 670 1075 Z" fill={HOODIE_SH} {...ink(7)} />}
        <path d="M335 1420 C 325 1240 340 1110 420 1075 L 660 1075 C 740 1110 755 1240 745 1420 Z" fill={TOP} {...ink(8)} />
        <path d="M690 1100 C 735 1140 750 1260 744 1420 L 690 1420 C 698 1280 700 1170 690 1100 Z" fill={TOP_SH} />
        <rect x={330} y={1395} width={420} height={50} rx={18} fill={TOP_SH} {...ink(7)} />
        {jacket ? (
          <g>
            {/* white tee in the open front, zip edges, collar flaps */}
            <path d="M488 1080 L 592 1080 L 600 1398 L 480 1398 Z" fill="#f7f5f0" {...ink(6)} />
            <path d="M486 1086 L 478 1398 M 594 1086 L 602 1398" fill="none" stroke={TOP_SH} strokeWidth={8} />
            <path d="M420 1075 L 488 1078 L 470 1160 Z M 660 1075 L 592 1078 L 610 1160 Z" fill={TOP_SH} {...ink(6)} />
          </g>
        ) : (
          <path d="M425 1300 C 470 1275 610 1275 655 1300 L 640 1380 L 440 1380 Z" fill="none" {...ink(6)} stroke={HOODIE_SH} />
        )}
        <path d="M500 1000 L 500 1080 C 520 1095 560 1095 580 1080 L 580 1000 Z" fill="#dc9f78" {...ink(6)} />
        <path d="M455 1078 C 490 1118 590 1118 625 1078" fill="none" {...ink(7)} />
        {!jacket && [510, 570].map((x, i) => <g key={i}><path d={`M${x} 1105 L ${x + (i ? 4 : -4)} 1185`} fill="none" stroke="#f4f1e6" strokeWidth={8} strokeLinecap="round" /><circle cx={x + (i ? 4 : -4)} cy={1190} r={8} fill="#f4f1e6" {...ink(4)} /></g>)}
        {/* arms */}
        <Limb pts={armL} w={74} color={TOP} />
        <Limb pts={armR} w={74} color={TOP} />
        {holdR && <g transform={`translate(${hR[0]} ${hR[1]})`}>{holdR}</g>}
        {/* something carried in front (a sack): over the sleeves, under the hands that grip it */}
        {front}
        <Hand x={hL[0]} y={hL[1]} angle={aL} flipThumb />
        <Hand x={hR[0]} y={hR[1]} angle={aR} />
        <JakeHead t={t} brows={brows} smile={smile} sad={sad} look={look} wide={wide} gasp={gasp} grit={grit} />
        {hat && (
          <g>
            <ellipse cx={540} cy={640} rx={250} ry={46} fill="#e9c46a" {...ink(8)} />
            <path d="M410 640 C 410 520 670 520 670 640 Z" fill="#e9c46a" {...ink(8)} />
            <path d="M414 610 C 470 625 610 625 666 610 L 668 640 C 610 655 470 655 412 640 Z" fill="#e2453c" {...ink(5)} />
            {[-160, -90, 90, 160].map((dx, i) => <path key={i} d={`M${540 + dx} ${650} l ${dx > 0 ? 18 : -18} 6`} fill="none" stroke="#c9a14a" strokeWidth={5} />)}
          </g>
        )}
      </g>
    </g>
  );
};

/** A cartoon fish hanging by its tail from (0, 0): body down along +y, ≈ 330 long. flop rotates it. */
export const Fish2D: React.FC<{ flop?: number; wiggle?: number }> = ({ flop = 0, wiggle = 0 }) => (
  <g transform={`rotate(${flop})`}>
    {/* tail fin (held) */}
    <path d="M0 0 L -48 -38 Q -10 -10 0 -6 Q 10 -10 48 -38 Z" fill="#3f7fa8" {...ink(6)} />
    <g transform={`rotate(${wiggle} 0 20)`}>
      <path d="M0 10 C -30 40 -78 120 -76 200 C -74 280 -40 330 0 336 C 40 330 74 280 76 200 C 78 120 30 40 0 10 Z" fill="#6fa9cc" {...ink(7)} />
      <path d="M0 40 C 30 70 60 140 58 210 C 56 280 30 320 0 330 C 20 300 34 250 34 200 C 34 130 18 80 0 40 Z" fill="#dcecf4" />
      {/* fins + scales */}
      <path d="M-74 170 L -118 140 L -110 205 Z" fill="#3f7fa8" {...ink(5)} />
      <path d="M74 230 L 112 215 L 104 268 Z" fill="#3f7fa8" {...ink(5)} />
      {[[-30, 120], [0, 150], [-36, 180], [-6, 210], [-30, 240]].map(([x, y], i) => <path key={i} d={`M${x - 14} ${y} q 14 14 28 0`} fill="none" stroke="#4f8db3" strokeWidth={5} strokeLinecap="round" />)}
      {/* face at the bottom (head end) */}
      <path d="M-58 270 Q 0 250 58 270" fill="none" stroke="#3f7fa8" strokeWidth={5} />
      <circle cx={-26} cy={292} r={17} fill="#ffffff" {...ink(5)} />
      <circle cx={-24} cy={296} r={8} fill={INK} />
      <path d="M-10 326 q 10 8 22 0" fill="none" {...ink(5)} />
    </g>
  </g>
);

/** A pair of sneakers, side view, ≈ 300 wide, sitting on y = 0. */
export const Shoes2D: React.FC = () => (
  <g>
    {[[-75, 0], [80, -18]].map(([x, y], i) => (
      <g key={i} transform={`translate(${x} ${y})`}>
        <path d="M-80 0 C -86 -40 -70 -78 -40 -84 L -10 -86 C 10 -60 40 -48 70 -42 C 92 -38 98 -14 94 0 Z" fill="#d6413a" {...ink(7)} />
        <path d="M-86 0 L 98 0 L 96 14 L -84 14 Z" fill="#f7f5f0" {...ink(6)} />
        <path d="M-40 -84 C -30 -98 -14 -98 -10 -86" fill="#3a1a14" {...ink(5)} />
        {[0, 1, 2].map((k) => <path key={k} d={`M${-2 + k * 18} ${-66 + k * 8} l 14 -10`} fill="none" stroke="#ffffff" strokeWidth={6} strokeLinecap="round" />)}
        <path d="M-60 -24 C -20 -10 30 -16 70 -30" fill="none" stroke="#ffffff" strokeWidth={9} strokeLinecap="round" />
      </g>
    ))}
  </g>
);

/** An old merchant (original character): head wrap, grey beard, long robe; holds things at his chest. */
export const Merchant: React.FC<{ t: number; disgust: number; shake: number; hold?: React.ReactNode; clerk?: boolean; reach?: number }> = ({ t, disgust, shake, hold, clerk = false, reach = 0 }) => {
  const SK = clerk ? '#e6b88e' : '#c68a5a', SK_SH = clerk ? '#c99872' : '#a86f45', ROBE = clerk ? '#3a5ba0' : '#5f8f6a', ROBE_SH = clerk ? '#2c4680' : '#4a7354';
  const SASH = clerk ? '#e2453c' : '#8e5bd1', BEARD = clerk ? '#2a2420' : '#d8d4cc';
  const nod = shake > 0 ? 9 * Math.sin(shake * 20) * Math.min(1, shake * 5) : 0;
  const breathe = 4 * Math.sin(t * 1.9 + 1);
  return (
    <g>
      {/* robe to the floor + sandals */}
      {[470, 610].map((x, i) => <ellipse key={i} cx={x} cy={2005} rx={70} ry={20} fill="#8a5a3a" {...ink(6)} />)}
      <g transform={`translate(0 ${breathe})`}>
        <path d="M410 1075 C 330 1150 310 1500 300 1990 L 780 1990 C 770 1500 750 1150 670 1075 Z" fill={ROBE} {...ink(8)} />
        <path d="M680 1100 C 740 1200 760 1500 770 1985 L 700 1985 C 700 1500 690 1250 660 1110 Z" fill={ROBE_SH} />
        <path d="M540 1100 L 540 1980" fill="none" stroke={ROBE_SH} strokeWidth={8} />
        <rect x={330} y={1430} width={420} height={60} rx={20} fill={SASH} {...ink(7)} />
        <path d="M640 1470 L 680 1600 L 630 1590 Z" fill={SASH} {...ink(6)} />
        <path d="M500 1000 L 500 1080 C 520 1095 560 1095 580 1080 L 580 1000 Z" fill={SK_SH} {...ink(6)} />
        {/* arms bent, hands forward at the chest */}
        <Limb pts={[[380, 1130], [330 - 120 * reach, 1300 - 140 * reach], [470 - 330 * reach, 1330 - 300 * reach]]} w={80} color={ROBE} />
        <Limb pts={[[700, 1130], [750, 1300], [610, 1330]]} w={80} color={ROBE} />
        {hold && <g transform={`translate(${540 - 400 * reach} ${1300 - 300 * reach})`}>{hold}</g>}
        <Hand x={470 - 330 * reach} y={1335 - 300 * reach} angle={-70 + 40 * reach} color={SK} flipThumb />
        <Hand x={610} y={1335} angle={70} color={SK} />
        {/* head */}
        <g transform={`rotate(${nod} 540 1000)`}>
          {[372, 708].map((x, i) => <ellipse key={i} cx={x} cy={850} rx={28} ry={38} fill={SK} {...ink(7)} />)}
          <path d="M380 820 C 374 690 450 640 540 640 C 632 640 706 690 700 820 C 696 930 650 1010 540 1010 C 432 1010 386 930 380 820 Z" fill={SK} {...ink(8)} />
          <path d="M630 670 C 690 720 704 800 696 850 C 688 930 650 985 600 1002 C 640 950 664 890 668 830 C 672 760 660 710 630 670 Z" fill={SK_SH} />
          {/* grey beard + moustache */}
          {clerk
            ? <path d="M490 960 C 500 1040 520 1080 540 1085 C 560 1080 580 1040 590 960 C 570 975 510 975 490 960 Z" fill={BEARD} {...ink(6)} />
            : <path d="M392 880 C 400 1000 470 1080 540 1085 C 610 1080 682 1000 690 880 C 650 930 610 940 540 935 C 470 940 430 930 392 880 Z" fill={BEARD} {...ink(7)} />}
          <path d={`M470 ${935 - 4 * disgust} C 500 ${915 - 6 * disgust} 580 ${915 - 6 * disgust} 610 ${935 - 4 * disgust}`} fill={BEARD} {...ink(6)} />
          {/* mouth: neutral → "bleh" with a tongue */}
          {disgust > 0.3
            ? <g><path d="M505 965 Q 525 950 545 965 Q 565 980 585 962" fill="none" {...ink(7)} /><path d="M530 966 q 12 34 28 0" fill="#e2788a" {...ink(5)} /></g>
            : <path d={clerk ? "M505 950 Q 540 978 575 950" : "M510 962 Q 540 972 572 962"} fill="none" {...ink(7)} />}
          {/* big nose, wrinkles when disgusted */}
          <path d="M540 830 C 520 880 515 900 540 905 C 575 908 580 885 560 870" fill={SK_SH} {...ink(6)} />
          {disgust > 0.2 && [[-1, 0], [1, 0]].map(([s], i) => <path key={i} d={`M${540 + (s as number) * 28} 840 l ${(s as number) * 14} -8 M${540 + (s as number) * 30} 852 l ${(s as number) * 14} -6`} fill="none" {...ink(4)} opacity={disgust} />)}
          {/* eyes: squint with disgust */}
          {[478, 604].map((x, i) => (
            <g key={i}>
              <ellipse cx={x} cy={815} rx={28} ry={30 * (1 - 0.65 * disgust)} fill="#ffffff" {...ink(6)} />
              <circle cx={x + (i ? -6 : -6)} cy={818} r={12 * (1 - 0.3 * disgust)} fill={INK} />
            </g>
          ))}
          {/* bushy grey brows, angled down to the middle when disgusted */}
          {[478, 604].map((x, i) => {
            // the inner end (toward the nose) drops with disgust; the outer end lifts a little
            const inner = 770 + 26 * disgust, outer = 768 - 8 * disgust;
            return <path key={i} d={i === 0 ? `M${x - 40} ${outer} L ${x + 40} ${inner}` : `M${x - 40} ${inner} L ${x + 40} ${outer}`} fill="none" stroke="#bdb7ad" strokeWidth={20} strokeLinecap="round" />;
          })}
          {clerk ? (
            <g>
              {/* black scholar cap with side flaps */}
              <path d="M372 730 C 372 600 450 560 540 560 C 630 560 708 600 708 730 C 640 700 440 700 372 730 Z" fill="#1f1b24" {...ink(8)} />
              <rect x={300} y={690} width={120} height={36} rx={14} fill="#1f1b24" {...ink(6)} transform="rotate(-12 360 708)" />
              <rect x={660} y={690} width={120} height={36} rx={14} fill="#1f1b24" {...ink(6)} transform="rotate(12 720 708)" />
              <path d="M430 640 C 480 615 600 615 650 640" fill="none" stroke="#3a3440" strokeWidth={8} strokeLinecap="round" />
            </g>
          ) : (
            <g>
              {/* white head wrap */}
              <path d="M370 760 C 360 600 450 548 540 548 C 640 548 720 600 712 760 C 650 720 430 720 370 760 Z" fill="#f7f3ea" {...ink(8)} />
              <path d="M400 700 C 470 660 610 660 690 700 M 420 650 C 490 615 600 615 670 650" fill="none" stroke="#d9d2c3" strokeWidth={8} strokeLinecap="round" />
              <circle cx={600} cy={700} r={20} fill="#21b3a0" {...ink(5)} />
            </g>
          )}
        </g>
      </g>
    </g>
  );
};

export { HOODIE };
