import React from 'react';
import { clamp01, easeOutBack, easeOutCubic, lerp } from '../../lib/anim';
import { Hoot2D, INK, ink } from '../Hook2D';
import { JakeStanding, place } from '../parts';

/** money2 (banks create money) scenes, 1080×1920 scene units. New sets and a green jacket for Jake. */
const F = 'Montserrat, Arial Black, sans-serif';
export const GREEN_JACKET = { main: '#3f8f5a', shade: '#2f6e45' };
type Face = { brows?: number; smile?: number; sad?: number; wide?: number; gasp?: number; grit?: number };

const Puff: React.FC<{ x: number; y: number; p: number; s?: number }> = ({ x, y, p, s = 1 }) => {
  if (p <= 0 || p >= 1) return null;
  const r = 40 + 90 * easeOutCubic(p);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={1 - p}>
      {[0, 60, 120, 180, 240, 300].map((a) => <circle key={a} cx={Math.cos((a * Math.PI) / 180) * r * 0.6} cy={Math.sin((a * Math.PI) / 180) * r * 0.5} r={r * 0.45} fill="#ffffff" {...ink(5)} />)}
    </g>
  );
};

/* ------------------------------------------------------------------ car lot */
export type LotProps = { t: number; talk: number; face: Face; made: number };

/** Jake at a car lot with the keys to his new car; the $20,000 appears out of thin air on "created". */
export const Lot2D: React.FC<LotProps> = ({ t, talk, face, made }) => {
  const m = easeOutBack(clamp01(made * 1.5));
  return (
    <g>
      <rect x={-600} y={-400} width={2280} height={1850} fill="#9bd7ff" />
      <circle cx={180} cy={360} r={80} fill="#ffe27a" />
      {/* bunting */}
      <path d="M-600 560 Q 540 660 1680 560" fill="none" {...ink(5)} />
      {Array.from({ length: 16 }, (_, i) => {
        const x = -540 + i * 150, y = 560 + 100 * Math.sin((Math.PI * (x + 600)) / 2280) * 0.9;
        return <path key={i} d={`M${x - 30} ${y} L ${x + 30} ${y} L ${x} ${y + 60} Z`} fill={['#e2453c', '#f0c040', '#2f6fd6', '#2fa84f'][i % 4]} {...ink(4)} />;
      })}
      {/* lot */}
      <rect x={-600} y={1150} width={2280} height={1300} fill="#6c7480" />
      <path d="M-600 1150 L 1680 1150" {...ink(8)} />
      {Array.from({ length: 6 }, (_, i) => <path key={i} d={`M${-300 + i * 300} 1250 L ${-380 + i * 300} 1500`} stroke="#f7f5f0" strokeWidth={12} />)}
      {/* the new car (side view) */}
      <g transform="translate(720 1150)">
        <ellipse cx={0} cy={20} rx={300} ry={24} fill="rgba(0,0,0,0.25)" />
        <path d="M-280 -40 L -280 -130 Q -270 -160 -230 -165 L -150 -170 L -90 -260 Q -70 -280 -40 -280 L 120 -280 Q 150 -280 170 -255 L 230 -170 L 270 -160 Q 290 -150 290 -120 L 290 -40 Z" fill="#e2553c" {...ink(8)} />
        <path d="M-70 -255 L 110 -255 L 160 -180 L -120 -180 Z" fill="#bfe3ff" {...ink(6)} />
        <path d="M30 -255 L 30 -180" {...ink(6)} />
        <path d="M-270 -110 L 280 -110" stroke="#ff8a6a" strokeWidth={10} />
        {[-170, 180].map((x) => <g key={x}><circle cx={x} cy={-40} r={58} fill="#2a2f38" {...ink(7)} /><circle cx={x} cy={-40} r={24} fill="#c9ccd3" {...ink(4)} /></g>)}
        {/* price sticker on the window */}
        <g transform="translate(-10 -218) rotate(-4)">
          <rect x={-78} y={-30} width={156} height={60} rx={8} fill="#ffd21f" {...ink(5)} />
          <text x={0} y={13} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={36} fill="#14171a">$20,000</text>
        </g>
      </g>
      <Hoot2D t={t} talk={talk} x={760} y={872} s={0.55} />
      {/* Jake holds the car keys out */}
      <g transform={place(260, 1450, 0.62)}>
        <ellipse cx={540} cy={2025} rx={260} ry={30} fill="rgba(0,0,0,0.2)" />
        <JakeStanding
          t={t} {...face} jacket={GREEN_JACKET}
          armL={[[410, 1110], [345, 1300], [355, 1450]]} armR={[[670, 1110], [800, 1230], [880, 1170]]}
          holdR={(
            <g transform="translate(30 40) scale(1.8)">
              <circle cx={0} cy={0} r={30} fill="none" stroke="#c9ccd3" strokeWidth={12} />
              <rect x={-10} y={20} width={22} height={90} rx={6} fill="#c9ccd3" {...ink(5)} />
              <rect x={22} y={10} width={60} height={44} rx={12} fill="#14171a" {...ink(4)} />
            </g>
          )}
        />
      </g>
      {/* Jake's bank app: the balance is typed in, not printed ($0 until "created") */}
      <g transform={`translate(520 760) scale(${1 + 0.15 * Math.sin(Math.PI * clamp01(made))})`}>
        {made > 0 && [0, 1, 2, 3, 4, 5, 6, 7].map((i) => <path key={i} d="M0 -150 L 0 -122" transform={`rotate(${i * 45}) scale(${m})`} stroke="#ffd21f" strokeWidth={12} strokeLinecap="round" />)}
        <rect x={-160} y={-95} width={320} height={190} rx={26} fill="#ffffff" {...ink(7)} />
        <rect x={-160} y={-95} width={320} height={52} rx={22} fill="#2f4a78" />
        <rect x={-160} y={-62} width={320} height={20} fill="#2f4a78" />
        <text x={0} y={-58} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={24} fill="#ffffff" letterSpacing={2}>BIG BANK APP</text>
        <text x={0} y={-12} textAnchor="middle" fontFamily={F} fontWeight={800} fontSize={20} fill="#5b6270">JAKE'S BALANCE</text>
        <text x={made > 0 ? -8 : -6} y={58} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={60} fill={made > 0 ? '#1f8a45' : '#14171a'}>{made > 0 ? '$20,000' : '$0'}</text>
        {Math.floor(t * 2.5) % 2 === 0 && <rect x={made > 0 ? 122 : 40} y={10} width={8} height={56} fill="#2f4a78" />}
      </g>
      <Puff x={520} y={760} p={clamp01(made * 1.6)} s={1.1} />
    </g>
  );
};

/* ------------------------------------------------------------------ giant bank screen */
export type ScreenProps = { t: number; talk: number; face: Face; balance: string; approved: number; loanLeft: number | null; poof: number; glow: number };

/** A giant bank app on a monitor: the balance is typed in from nothing, then paid back to zero. */
export const Screen2D: React.FC<ScreenProps> = ({ t, talk, face, balance, approved, loanLeft, poof, glow }) => (
  <g>
    <rect x={-600} y={-400} width={2280} height={1900} fill="#2e3a59" />
    {Array.from({ length: 8 }, (_, i) => <rect key={i} x={-600} y={-300 + i * 220} width={2280} height={6} fill="#35436a" />)}
    <rect x={-600} y={1180} width={2280} height={1300} fill="#4a3a30" />
    <path d="M-600 1180 L 1680 1180" {...ink(8)} />
    {/* monitor */}
    <rect x={600} y={1020} width={80} height={90} fill="#9aa6b8" {...ink(6)} />
    <rect x={520} y={1100} width={240} height={30} rx={10} fill="#9aa6b8" {...ink(6)} />
    <rect x={330} y={500} width={620} height={530} rx={30} fill="#1f2a3a" {...ink(9)} />
    <rect x={355} y={525} width={570} height={480} rx={14} fill="#f7f5f0" />
    <rect x={355} y={525} width={570} height={70} rx={14} fill="#2f4a78" />
    <text x={640} y={573} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={34} fill="#ffffff" letterSpacing={2}>BIG BANK · JAKE</text>
    <text x={640} y={650} textAnchor="middle" fontFamily={F} fontWeight={800} fontSize={28} fill={loanLeft !== null ? '#d6281c' : '#5b6270'}>{loanLeft !== null ? 'LOAN LEFT TO PAY' : 'ACCOUNT BALANCE'}</text>
    <text x={640} y={760} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={110} fill={loanLeft !== null ? '#d6281c' : glow > 0 ? '#1f8a45' : '#14171a'}>{loanLeft !== null ? `$${Math.round(loanLeft).toLocaleString('en-US')}` : balance}</text>
    {glow > 0 && [0, 1, 2, 3, 4, 5].map((i) => <path key={i} d="M0 -26 L 6 -6 L 26 0 L 6 6 L 0 26 L -6 6 L -26 0 L -6 -6 Z" fill="#ffd21f" {...ink(3)} transform={`translate(${420 + i * 90} ${690 + 70 * Math.sin(i * 2.1)}) scale(${0.6 + 0.4 * Math.sin(t * 8 + i)})`} />)}
    {approved > 0 && loanLeft === null && (
      <g transform={`translate(640 850) rotate(-6) scale(${0.85 * lerp(1.8, 1, easeOutBack(clamp01(approved)))})`} opacity={clamp01(approved * 3)}>
        <rect x={-200} y={-46} width={400} height={92} rx={12} fill="rgba(255,255,255,0.6)" stroke="#1f8a45" strokeWidth={10} />
        <text x={0} y={16} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={46} fill="#1f8a45">LOAN APPROVED</text>
      </g>
    )}
    <Puff x={640} y={740} p={poof} s={1.6} />
    {/* keyboard with keys tapping by themselves */}
    <rect x={360} y={1120} width={560} height={70} rx={14} fill="#c9ccd3" {...ink(6)} />
    {Array.from({ length: 10 }, (_, i) => <rect key={i} x={378 + i * 54} y={1134 + (Math.floor(t * 12 + i * 3) % 5 === 0 && glow > 0 ? 6 : 0)} width={44} height={36} rx={6} fill="#f7f5f0" {...ink(3)} />)}
    <Hoot2D t={t} talk={talk} x={850} y={503} s={0.5} />
    <g transform={place(230, 1520, 0.5)}>
      <JakeStanding t={t} {...face} jacket={GREEN_JACKET} armL={[[410, 1110], [345, 1300], [355, 1450]]} armR={[[670, 1110], [735, 1300], [725, 1450]]} />
    </g>
  </g>
);

/* ------------------------------------------------------------------ the report */
export type ReportProps = { t: number; talk: number; face: Face; hl: number };

/** The Bank of England's 2014 bulletin pinned to a board, the key line highlighted. */
export const Report2D: React.FC<ReportProps> = ({ t, talk, face, hl }) => (
  <g>
    <rect x={-600} y={-400} width={2280} height={2000} fill="#c99c6e" />
    {Array.from({ length: 40 }, (_, i) => <circle key={i} cx={-560 + (i % 10) * 240 + (Math.floor(i / 10) % 2) * 120} cy={-300 + Math.floor(i / 10) * 260} r={8} fill="#b88a5e" />)}
    <rect x={-600} y={1300} width={2280} height={1200} fill="#7a5238" />
    <g transform="translate(0 -200) rotate(-2 490 790)">
      <rect x={180} y={420} width={620} height={760} rx={8} fill="#ffffff" {...ink(8)} />
      <circle cx={490} cy={440} r={16} fill="#e2453c" {...ink(4)} />
      <text x={490} y={520} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={42} fill="#7a1f3a">BANK OF ENGLAND</text>
      <text x={490} y={562} textAnchor="middle" fontFamily={F} fontWeight={700} fontSize={24} fill="#5b6270">QUARTERLY BULLETIN · 2014 Q1</text>
      <path d="M220 590 L 760 590" stroke="#c9ccd3" strokeWidth={4} />
      <text x={490} y={640} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={30} fill="#14171a">Money creation in the</text>
      <text x={490} y={678} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={30} fill="#14171a">modern economy</text>
      {[720, 750, 780].map((y) => <rect key={y} x={220} y={y} width={540 - (y % 3) * 40} height={12} rx={6} fill="#e3e5ea" />)}
      <rect x={212} y={812} width={556 * clamp01(hl)} height={190} rx={8} fill="#ffe14d" opacity={0.85} />
      {['"Whenever a bank makes', 'a loan, it simultaneously', 'creates a matching', 'deposit…"'].map((l, i) => <text key={i} x={230} y={856 + i * 44} fontFamily={F} fontWeight={800} fontSize={32} fill="#14171a">{l}</text>)}
      {[1040, 1070, 1100, 1130].map((y) => <rect key={y} x={220} y={y} width={500 - (y % 7) * 20} height={12} rx={6} fill="#e3e5ea" />)}
    </g>
    {/* Hoot on the LEFT, opposite Jake (owner), standing on a stack of books on the floor */}
    <ellipse cx={165} cy={1302} rx={120} ry={12} fill="rgba(0,0,0,0.22)" />
    {[['#2f6fb0', 0, 200], ['#e2453c', -10, 180], ['#f0b23a', 6, 160]].map(([c, dx, w], i) => (
      <rect key={i} x={165 - (w as number) / 2 + (dx as number)} y={1258 - i * 40} width={w as number} height={40} rx={6} fill={c as string} {...ink(6)} />
    ))}
    <Hoot2D t={t} talk={talk} x={165} y={1178} s={0.55} />
    <g transform={place(800, 1640, 0.52)}>
      <JakeStanding t={t} {...face} jacket={GREEN_JACKET} armL={[[410, 1110], [345, 1300], [355, 1450]]} armR={[[670, 1110], [735, 1300], [725, 1450]]} />
    </g>
  </g>
);

/* ------------------------------------------------------------------ the Fed dial */
export type DialProps = { t: number; talk: number; needle: number; repay: number };

/** A big "borrowing cost" dial in front of THE FED; the needle moves on "Fed". repay = a ✓ for borrowers who repay. */
export const Dial2D: React.FC<DialProps> = ({ t, talk, needle, repay }) => {
  const a = lerp(-80, 10, easeOutBack(clamp01(needle)));
  return (
    <g>
      <rect x={-600} y={-400} width={2280} height={1700} fill="#bfe3ff" />
      {/* the Fed behind */}
      <g transform="translate(540 320) scale(0.9)">
        <path d="M-300 120 L 0 0 L 300 120 Z" fill="#f6f1e4" {...ink(7)} />
        <rect x={-300} y={120} width={600} height={56} fill="#ece4d2" {...ink(6)} />
        <text x={0} y={162} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={40} fill="#2f4a78" letterSpacing={4}>THE FED</text>
        {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={-270 + i * 100} y={176} width={50} height={330} fill="#f6f1e4" {...ink(5)} />)}
      </g>
      <rect x={-600} y={1250} width={2280} height={1300} fill="#9aa6b8" />
      <path d="M-600 1250 L 1680 1250" {...ink(8)} />
      {/* dial */}
      <rect x={500} y={1060} width={80} height={192} fill="#5b6270" {...ink(7)} />
      <g transform="translate(540 960)">
        <rect x={-330} y={-20} width={660} height={140} rx={20} fill="#2f4a78" {...ink(8)} />
        <path d="M-300 0 A 300 300 0 0 1 300 0 Z" fill="#ffffff" {...ink(9)} />
        {[['#2fa84f', 180, 240], ['#f0c040', 240, 300], ['#e2453c', 300, 360]].map(([c, a0, a1], i) => {
          const r = 260, p = (d: number) => `${r * Math.cos((d * Math.PI) / 180)} ${r * Math.sin((d * Math.PI) / 180)}`;
          return <path key={i} d={`M${p(a0 as number)} A ${r} ${r} 0 0 1 ${p(a1 as number)}`} fill="none" stroke={c as string} strokeWidth={34} />;
        })}
        <text x={-230} y={-30} fontFamily={F} fontWeight={900} fontSize={30} fill="#1f8a45">CHEAP</text>
        <text x={230} y={-30} textAnchor="end" fontFamily={F} fontWeight={900} fontSize={30} fill="#d6281c">PRICEY</text>
        <g transform={`rotate(${a})`}>
          <path d="M-14 0 L 0 -230 L 14 0 Z" fill={INK} />
        </g>
        <circle cx={0} cy={0} r={30} fill="#14171a" />
        <text x={0} y={80} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={40} fill="#ffffff" letterSpacing={2}>BORROWING COST</text>
      </g>
      {/* "borrowers who repay" sign at the side */}
      {repay > 0 && (
        <g transform={`translate(230 560) scale(${easeOutBack(clamp01(repay))})`}>
          <rect x={-130} y={-70} width={260} height={140} rx={18} fill="#ffffff" {...ink(7)} />
          <circle cx={-70} cy={0} r={34} fill="#2fa84f" />
          <path d="M-86 0 L -74 14 L -52 -12" fill="none" stroke="#ffffff" strokeWidth={9} strokeLinecap="round" />
          <text x={30} y={-6} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={30} fill="#14171a">PAYS</text>
          <text x={30} y={30} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={30} fill="#14171a">BACK</text>
        </g>
      )}
      {/* Hoot on a post beside the dial */}
      <rect x={120} y={1000} width={110} height={252} rx={10} fill="#8a5a3a" {...ink(7)} />
      <Hoot2D t={t} talk={talk} x={175} y={1002} s={0.55} />
    </g>
  );
};
