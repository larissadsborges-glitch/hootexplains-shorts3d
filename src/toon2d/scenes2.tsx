import React, { useMemo } from 'react';
import { clamp01, easeInOutSine, easeOutBack, easeOutCubic, lerp, rng } from '../lib/anim';
import type { MoneyTimeline } from '../scenes/money/timeline';
import { Hoot2D, INK, ink } from './Hook2D';
import { JakeStanding, Merchant, place } from './parts';

const F = 'Montserrat, Arial Black, sans-serif';
const mix = (a: number[][], b: number[][], k: number) => a.map((p, i) => [lerp(p[0], b[i][0], k), lerp(p[1], b[i][1], k)]);

/** Old Chinese paper money (abstract: red seal blocks and lines, no real characters), centred on (0, 0). */
export const OldPaperNote: React.FC<{ s?: number }> = ({ s = 1 }) => (
  <g transform={`scale(${s})`}>
    <rect x={-70} y={-110} width={140} height={220} rx={6} fill="#efe2c0" {...ink(6)} />
    <rect x={-56} y={-96} width={112} height={192} rx={3} fill="none" stroke="#8a6440" strokeWidth={4} />
    <rect x={-40} y={-84} width={80} height={46} fill="#c8322a" {...ink(3)} />
    {[-20, 0, 20].map((x, i) => <path key={i} d={`M${x} -20 L ${x} 50`} stroke="#3a2a1a" strokeWidth={7} strokeLinecap="round" />)}
    <rect x={-26} y={62} width={52} height={26} fill="#c8322a" {...ink(3)} />
  </g>
);

/** A round coin with a square hole (old Chinese cash coin). */
const CashCoin: React.FC<{ r?: number }> = ({ r = 26 }) => (
  <g>
    <circle cx={0} cy={0} r={r} fill="#d9a63a" {...ink(4)} />
    <rect x={-r * 0.3} y={-r * 0.3} width={r * 0.6} height={r * 0.6} fill="#7a5a2a" {...ink(3)} />
  </g>
);

/* =============================================================== B4: "But metal is heavy. So China printed paper promises…" */
export const China2D: React.FC<{ T: MoneyTimeline; t: number; talk: number }> = ({ T, t, talk }) => {
  const b0 = T.s('china');
  const heavy = T.wordTime('china', 'heavy', b0 + 0.6);
  const printed = T.wordTime('china', 'printed', b0 + 1.5);
  const paper = T.wordTime('china', 'paper', b0 + 1.85);
  // carrying the sack until "printed": strain + sink on "heavy"; then the clerk hands over a note and the sack drops
  const strain = clamp01((t - b0) / 0.3) * (1 - clamp01((t - printed - 0.2) / 0.3));
  const sink = (t > heavy - 0.05 && t < printed) ? 14 * Math.abs(Math.sin((t - heavy) * 7)) * Math.exp(-(t - heavy) * 2.5) : 0;
  const give = easeInOutSine(clamp01((t - printed + 0.1) / 0.3));
  const take = easeOutCubic(clamp01((t - printed - 0.35) / 0.3));
  const drop = easeOutCubic(clamp01((t - printed - 0.15) / 0.3));
  const relief = clamp01((t - paper) / 0.3);
  const carryL = [[360, 1110], [325, 1270], [430, 1420]], carryR = [[720, 1110], [755, 1270], [650, 1420]];
  const relaxL = [[360, 1110], [315, 1270], [330, 1420]];
  const reachR = [[720, 1110], [880, 1150], [1080, 960]];
  const armL = mix(carryL, relaxL, drop);
  const armR = mix(carryR, reachR, take);
  const coins = useMemo(() => { const r = rng(31); return Array.from({ length: 7 }, () => [r() * 160 - 80, r() * 40]); }, []);
  // the note: in the clerk's reaching hand, then in Jake's raised hand
  const reachC = give * (1 - take);
  const clerkHand = [810 + (470 - 330 * reachC - 540) * 0.62, 1620 - (2020 - (1335 - 300 * reachC)) * 0.62];
  const jakeHand = [290 + (1080 - 540) * 0.62, 1620 - (2020 - 960) * 0.62];
  const noteAt = [lerp(clerkHand[0], jakeHand[0], take), lerp(clerkHand[1] - 50, jakeHand[1] - 70, take)];
  return (
    <g>
      {/* evening sky and a Chinese-style shopfront: red pillars, a curved tiled roof, paper lanterns */}
      <defs><linearGradient id="cnSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f6a46b" /><stop offset="1" stopColor="#ffe0b8" /></linearGradient></defs>
      <rect x={0} y={0} width={1080} height={1200} fill="url(#cnSky)" />
      <rect x={0} y={1080} width={1080} height={840} fill="#d9b98a" />
      {Array.from({ length: 9 }, (_, i) => <path key={i} d={`M0 ${1180 + i * 80} L 1080 ${1180 + i * 80}`} stroke="#c9a676" strokeWidth={4} />)}
      <path d="M0 1080 L 1080 1080" {...ink(6)} />
      <rect x={70} y={640} width={940} height={500} fill="#7a4a2c" {...ink(7)} />
      <rect x={120} y={700} width={840} height={360} fill="#5a3420" />
      {[95, 985].map((x, i) => <rect key={i} x={x - 26} y={600} width={52} height={700} fill="#c8322a" {...ink(7)} />)}
      <path d="M-20 650 C 120 640 200 560 300 560 L 780 560 C 880 560 960 640 1100 650 L 1100 600 C 980 590 900 500 780 500 L 300 500 C 180 500 100 590 -20 600 Z" fill="#2f4a5a" {...ink(8)} />
      {Array.from({ length: 12 }, (_, i) => <path key={i} d={`M${120 + i * 70} 510 L ${110 + i * 70} 560`} stroke="#1f3340" strokeWidth={6} />)}
      {/* blank sign board with a red seal */}
      <rect x={400} y={590} width={280} height={70} rx={8} fill="#f0b429" {...ink(6)} />
      <rect x={515} y={600} width={50} height={50} fill="#c8322a" {...ink(3)} />
      {/* lanterns sway */}
      {[230, 850].map((x, i) => (
        <g key={i} transform={`rotate(${4 * Math.sin(t * 2 + i)} ${x} 660)`}>
          <path d={`M${x} 660 L ${x} 700`} {...ink(4)} />
          <ellipse cx={x} cy={760} rx={46} ry={60} fill="#e2453c" {...ink(6)} />
          <ellipse cx={x} cy={760} rx={22} ry={60} fill="none" stroke="#b5302a" strokeWidth={5} />
          <rect x={x - 22} y={694} width={44} height={14} fill="#f0b429" {...ink(4)} />
          <rect x={x - 22} y={812} width={44} height={14} fill="#f0b429" {...ink(4)} />
        </g>
      ))}
      {/* Hoot on the roof's left end (same spot as in the market) */}
      <Hoot2D t={t} talk={talk} x={172} y={562} s={0.6} />
      {/* the clerk, reaching out with a paper note */}
      <g transform={place(810, 1620, 0.62)}>
        <Merchant t={t} disgust={0} shake={0} clerk reach={reachC} />
      </g>
      {take < 1 && <g transform={`translate(${noteAt[0]} ${noteAt[1]}) rotate(${-10 + 20 * take})`}><OldPaperNote s={0.6} /></g>}
      {/* the coin sack: carried, then dropped on the ground where it spills a few coins */}
      {drop > 0 && (
        <g transform={`translate(${170} ${1645})`}>
          {coins.map(([x, y], i) => <g key={i} transform={`translate(${x * drop} ${-6 + y * 0.3 * drop}) scale(0.62)`}><CashCoin /></g>)}
        </g>
      )}
      {/* Jake: hat on (still back in time), straining under the sack, then relieved with a paper note */}
      <g transform={`${place(290, 1620, 0.62)} translate(0 ${sink})`}>
        <JakeStanding t={t} hat brows={-0.7 * strain + 0.5 * relief} smile={-0.4 * strain + 0.8 * relief} sad={0} grit={strain} look={[18, 6 * strain]}
          armL={armL} armR={armR}
          holdR={take >= 1 ? <g transform="translate(0 -70) rotate(10)"><OldPaperNote s={0.95} /></g> : undefined}
          front={(
            <g transform={`translate(${540 - 215 * drop} ${1590 + 300 * drop}) rotate(${-14 * drop})`}>
              <path d="M-170 -150 C -230 -40 -210 170 -110 220 L 110 220 C 210 170 230 -40 170 -150 Z" fill="#b98a55" {...ink(8)} />
              <path d="M-170 -150 C -100 -190 100 -190 170 -150 L 150 -120 C 90 -150 -90 -150 -150 -120 Z" fill="#9a6e3e" {...ink(6)} />
              <g transform="translate(0 40)"><CashCoin r={64} /></g>
            </g>
          )} />
      </g>
      {/* sweat drops while straining */}
      {strain > 0.3 && [[150, 760], [430, 740]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y + 20 * ((t * 1.5 + i * 0.5) % 1)})`} opacity={strain}>
          <path d="M0 -24 C 13 -6 16 6 0 13 C -16 6 -13 -6 0 -24 Z" fill="#8fd0ff" {...ink(4)} />
        </g>
      ))}
    </g>
  );
};

/** A cartoon gold bar, ≈ 150 wide, sitting on y = 0. */
const GoldBar: React.FC = () => (
  <g>
    <path d="M-75 0 L -55 -46 L 55 -46 L 75 0 Z" fill="#f0c040" {...ink(5)} />
    <path d="M-55 -46 L 55 -46 L 48 -36 L -48 -36 Z" fill="#ffe08a" />
    <path d="M40 0 L 52 -40" stroke="#c99a1e" strokeWidth={5} />
  </g>
);

/* =============================================================== B5: "Dollars worked the same way, backed by gold. Until 1971…" */
export const Vault2D: React.FC<{ T: MoneyTimeline; t: number; talk: number }> = ({ T, t, talk }) => {
  const b0 = T.s('gold');
  const backed = T.wordTime('gold', 'backed', b0 + 1.8);
  const y1971 = T.wordTime('gold', '1971', b0 + 3.2);
  const cut = T.wordTime('gold', 'cut', b0 + 4.4);
  const link = T.wordTime('gold', 'link', b0 + 4.9);
  const chain = clamp01((t - backed + 0.05) / 0.45);
  const snip = clamp01((t - cut + 0.25) / 0.25);
  const broken = t >= cut;
  const fallT = Math.max(0, t - cut);
  const door = easeOutCubic(clamp01((t - link - 0.05) / 0.3));
  const shake = t > link + 0.3 && t < link + 0.7 ? 10 * Math.sin((t - link) * 60) * (1 - (t - link - 0.3) / 0.4) : 0;
  const shock = clamp01((t - y1971 + 0.1) / 0.2);
  // chain from the bill (left) to the gold stack (right)
  const A = [420, 755], B = [610, 930];
  const links = 9;
  const bars: [number, number][] = [[640, 1170], [800, 1170], [720, 1120], [640, 1074], [800, 1074], [720, 1028]];
  return (
    <g transform={`translate(${shake} 0) translate(540 1000) scale(1.15) translate(-560 -1000)`}>
      {/* steel vault: riveted wall, floor */}
      <rect x={0} y={0} width={1080} height={1250} fill="#56647a" />
      {Array.from({ length: 6 }, (_, i) => <rect key={i} x={0} y={i * 210 + 40} width={1080} height={8} fill="#4a566a" />)}
      {Array.from({ length: 40 }, (_, i) => <circle key={i} cx={30 + (i % 10) * 115} cy={60 + Math.floor(i / 10) * 210} r={7} fill="#7a889e" {...ink(2)} />)}
      <rect x={0} y={1240} width={1080} height={680} fill="#3c4556" {...ink(6)} />
      {/* the gold stack on a pallet */}
      <rect x={550} y={1190} width={340} height={40} rx={6} fill="#8a5a3a" {...ink(6)} />
      {bars.map(([x, y], i) => <g key={i} transform={`translate(${x} ${y})`}><GoldBar /></g>)}
      <ellipse cx={720} cy={1080} rx={240} ry={140} fill="#ffe08a" opacity={0.12 + 0.05 * Math.sin(t * 3)} />
      {/* the dollar bill pinned to the wall (cartoon, not the real design) */}
      <g transform="translate(300 750) rotate(-6)">
        <rect x={-150} y={-66} width={300} height={132} rx={6} fill="#a8d8a8" {...ink(7)} />
        <rect x={-136} y={-52} width={272} height={104} rx={4} fill="none" stroke="#2f6b45" strokeWidth={4} />
        <text x={0} y={22} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={70} fill="#1f5236">$</text>
        <text x={-100} y={-14} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={34} fill="#1f5236">1</text>
        <text x={100} y={44} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={34} fill="#1f5236">1</text>
      </g>
      {/* the chain links appear one by one on "backed by gold"; on "cut" they snap and the halves drop */}
      {Array.from({ length: links }, (_, i) => {
        const k = i / (links - 1);
        if (k > chain) return null;
        const half = k < 0.5 ? -1 : 1;
        const dy = broken ? 900 * fallT * fallT * (0.4 + Math.abs(k - 0.5) * 1.2) : 0;
        const x = lerp(A[0], B[0], k), y = lerp(A[1], B[1], k) + dy + (broken ? 0 : 10 * Math.sin(k * Math.PI));
        if (broken && Math.abs(k - 0.5) < 0.07) return null;
        return <ellipse key={i} cx={x + (broken ? half * 10 : 0)} cy={y} rx={22} ry={13} transform={`rotate(${i % 2 ? 30 : -30} ${x} ${y})`} fill="none" stroke={INK} strokeWidth={14} />;
      })}
      {Array.from({ length: links }, (_, i) => {
        const k = i / (links - 1);
        if (k > chain) return null;
        const half = k < 0.5 ? -1 : 1;
        const dy = broken ? 900 * fallT * fallT * (0.4 + Math.abs(k - 0.5) * 1.2) : 0;
        const x = lerp(A[0], B[0], k), y = lerp(A[1], B[1], k) + dy + (broken ? 0 : 10 * Math.sin(k * Math.PI));
        if (broken && Math.abs(k - 0.5) < 0.07) return null;
        return <ellipse key={`c${i}`} cx={x + (broken ? half * 10 : 0)} cy={y} rx={22} ry={13} transform={`rotate(${i % 2 ? 30 : -30} ${x} ${y})`} fill="none" stroke="#c9ced6" strokeWidth={7} />;
      })}
      {/* giant scissors close on the middle of the chain */}
      {snip > 0 && t < cut + 0.6 && (
        <g transform={`translate(${lerp(A[0], B[0], 0.5)} ${lerp(A[1], B[1], 0.5)}) rotate(-58) scale(1.1)`} opacity={1 - clamp01((t - cut - 0.35) / 0.25)}>
          {[1, -1].map((s) => (
            <g key={s} transform={`rotate(${s * 26 * (1 - snip)})`}>
              <path d={`M0 0 L 150 ${s * 10} L 150 ${s * -6} Z`} fill="#dfe4ea" {...ink(5)} />
              <ellipse cx={-50} cy={s * 30} rx={36} ry={24} fill="none" stroke="#e2453c" strokeWidth={16} />
              <ellipse cx={-50} cy={s * 30} rx={36} ry={24} fill="none" stroke={INK} strokeWidth={4} />
            </g>
          ))}
          <circle cx={0} cy={0} r={8} fill="#8a9099" {...ink(3)} />
        </g>
      )}
      {/* snap flash */}
      {t >= cut && t < cut + 0.25 && <circle cx={lerp(A[0], B[0], 0.5)} cy={lerp(A[1], B[1], 0.5)} r={60 + 200 * (t - cut)} fill="#fff6c8" opacity={1 - (t - cut) / 0.25} />}
      {/* Jake watches, shocked on "1971" */}
      <g transform={place(250, 1700, 0.5)}>
        <JakeStanding t={t} brows={0.9 * shock} smile={0.3 - 0.6 * shock} wide={shock} gasp={shock * (1 - clamp01((t - link - 0.6) / 0.4))} look={[16, -6]}
          armL={[[360, 1110], [315, 1270], [330, 1420]]} armR={[[720, 1110], [765, 1270], [750, 1420]]} />
      </g>
      {/* the vault door swings shut over the gold on "link" (drawn last, so it covers the gold and Hoot) */}
      {door > 0 && (
        <g transform={`translate(${lerp(960, 640, door)} 1060) scale(${0.9 * lerp(0.12, 1, door)} 0.9)`}>
          <circle cx={0} cy={0} r={275} fill="#8a96a8" {...ink(10)} />
          <circle cx={0} cy={0} r={225} fill="#9aa6b8" {...ink(6)} />
          {Array.from({ length: 12 }, (_, i) => <circle key={i} cx={250 * Math.cos((i * Math.PI) / 6)} cy={250 * Math.sin((i * Math.PI) / 6)} r={11} fill="#6c7890" {...ink(3)} />)}
          <circle cx={0} cy={0} r={70} fill="#6c7890" {...ink(6)} />
          {[0, 1, 2].map((i) => <rect key={i} x={-10} y={-125} width={20} height={250} rx={8} fill="#c9ced6" {...ink(4)} transform={`rotate(${i * 60 + 200 * door})`} />)}
        </g>
      )}
      {/* Hoot on top of the gold stack (in front of the door, so he never disappears) */}
      <Hoot2D t={t} talk={talk} x={lerp(720, 640, door)} y={lerp(1004, 1060 - 0.9 * 275 + 4, door) - 60 * Math.sin(Math.PI * door)} s={0.55} />
      {/* "1971" stamp on the cut */}
      {t >= cut + 0.05 && (
        <g transform={`translate(640 1390) rotate(-8) scale(${lerp(1.5, 1, easeOutBack(clamp01((t - cut - 0.05) / 0.2)))})`} opacity={clamp01((t - cut - 0.05) / 0.1)}>
          <rect x={-250} y={-58} width={500} height={116} rx={14} fill="none" stroke="#e2453c" strokeWidth={12} />
          <text x={0} y={20} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={60} fill="#e2453c">GOLD LINK CUT</text>
        </g>
      )}
    </g>
  );
};
