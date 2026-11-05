import React, { useMemo } from 'react';
import { clamp01, easeInOutSine, easeOutBack, easeOutCubic, lerp, rng } from '../lib/anim';
import type { MoneyTimeline } from '../scenes/money/timeline';
import { Hoot2D, INK, ink } from './Hook2D';
import { Fish2D, JakeStanding, Merchant, place, Shoes2D } from './parts';

const mix = (a: number[][], b: number[][], k: number) => a.map((p, i) => [lerp(p[0], b[i][0], k), lerp(p[1], b[i][1], k)]);

/* =============================================================== EP1 B2: the barter flash-back */
export const Market2D: React.FC<{ T: MoneyTimeline; t: number; talk: number }> = ({ T, t, talk }) => {
  const b0 = T.s('barter');
  const offer = T.wordTime('barter', 'fish', b0 + 1.7);
  const hate = T.wordTime('barter', 'hate', b0 + 3.4);
  const reach = easeOutCubic(clamp01((t - offer + 0.15) / 0.4));
  const sad = easeOutCubic(clamp01((t - hate + 0.02) / 0.25));
  const disgust = easeOutCubic(clamp01((t - hate + 0.08) / 0.2));
  const shake = Math.max(0, t - hate - 0.05) * (1 - clamp01((t - hate - 1.0) / 0.25));
  const k = reach * (1 - 0.55 * sad);
  const armR = mix([[720, 1110], [815, 1235], [800, 1000]], [[720, 1110], [880, 1150], [1080, 960]], k);
  const armL = [[360, 1110], [315, 1270], [330, 1420]];
  const flop = sad > 0 ? 12 * sad + 6 * Math.sin(t * 14) * (1 - clamp01((t - hate - 0.8) / 0.4)) : 4 * Math.sin(t * 2.2);
  const wiggle = reach > 0.5 && sad < 0.2 ? 6 * Math.sin(t * 9) : 0;
  const sand = useMemo(() => { const r = rng(5); return Array.from({ length: 18 }, () => [r() * 1080, 1420 + r() * 480, 6 + r() * 14]); }, []);
  return (
    <g>
      {/* warm sky, sun, dunes, far tents */}
      <defs>
        <linearGradient id="mkSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffb86b" /><stop offset="1" stopColor="#ffe9c4" /></linearGradient>
      </defs>
      <rect x={0} y={0} width={1080} height={1200} fill="url(#mkSky)" />
      <circle cx={880} cy={300} r={90} fill="#fff1c9" />
      <path d="M0 980 C 200 900 330 930 480 970 C 640 1010 760 900 1080 940 L 1080 1200 L 0 1200 Z" fill="#e3b06e" {...ink(6)} />
      <rect x={0} y={1080} width={1080} height={840} fill="#ecc894" />
      <path d="M0 1080 L 1080 1080" {...ink(6)} />
      {sand.map(([x, y, r], i) => <ellipse key={i} cx={x} cy={y} rx={r} ry={r * 0.45} fill="#d9b178" />)}
      {/* the stall: posts, striped scalloped awning, counter with goods */}
      {[110, 970].map((x, i) => <rect key={i} x={x - 16} y={560} width={32} height={720} fill="#7a4f2c" {...ink(6)} />)}
      <path d="M60 540 L 1020 540 L 1020 640 L 60 640 Z" fill="#ffffff" {...ink(7)} />
      {Array.from({ length: 8 }, (_, i) => <rect key={i} x={60 + i * 120} y={540} width={60} height={100} fill="#e2453c" />)}
      <path d={`M60 640 ${Array.from({ length: 16 }, (_, i) => `Q ${90 + i * 60} 690 ${120 + i * 60} 640`).join(' ')}`} fill="#e2453c" {...ink(6)} />
      <path d="M60 540 L 1020 540 L 1020 640 L 60 640 Z" fill="none" {...ink(7)} />
      <rect x={100} y={1150} width={880} height={270} fill="#a8703f" {...ink(8)} />
      <rect x={85} y={1130} width={910} height={34} rx={8} fill="#8a5a3a" {...ink(7)} />
      {[0, 1, 2, 3].map((i) => <path key={i} d={`M${120 + i * 230} 1200 L ${300 + i * 230} 1200`} stroke="#94602f" strokeWidth={8} />)}
      {/* goods on the counter, at the ends (the middle stays clear for the swap) */}
      <g transform="translate(170 1130)">
        <path d="M-40 0 C -60 -50 -40 -90 0 -95 C 40 -90 60 -50 40 0 Z" fill="#c4693a" {...ink(6)} />
        <path d="M-18 -95 L 18 -95 L 14 -112 L -14 -112 Z" fill="#a8562c" {...ink(5)} />
      </g>
      {/* the merchant with his sneakers */}
      <g transform={place(810, 1620, 0.62)}>
        <Merchant t={t} disgust={disgust} shake={shake} hold={<g transform="translate(0 -40) scale(1.15)"><Shoes2D /></g>} />
      </g>
      {/* Jake in a straw hat, with his fish */}
      <g transform={place(290, 1620, 0.62)}>
        <JakeStanding t={t} hat brows={0.5 * (1 - sad) - 0.8 * sad} smile={0.7 * (1 - sad)} sad={sad} look={[18 - 10 * sad, 12 * sad]}
          armL={armL} armR={armR} holdR={<g transform="translate(0 10)"><Fish2D flop={flop - 0} wiggle={wiggle} /></g>} />
      </g>
      {/* Hoot perched on the left end of the awning, clear of the swap card and the action */}
      <Hoot2D t={t} talk={talk} x={172} y={548} s={0.6} />
      {/* sweat drop on Jake when the deal fails */}
      {sad > 0.2 && (
        <g transform={`translate(${290 + (700 - 540) * 0.62} ${1620 - (2020 - 720) * 0.62 + 30 * sad})`} opacity={sad}>
          <path d="M0 -26 C 14 -6 18 6 0 14 C -18 6 -14 -6 0 -26 Z" fill="#8fd0ff" {...ink(4)} />
        </g>
      )}
      {void INK}
    </g>
  );
};

/* =============================================================== B3: shells, then gold and silver coins */
const W = 1400;
const Cowrie: React.FC<{ back?: boolean }> = () => (
  <g>
    {/* a pale, glossy, egg-shaped cowrie seen from below: long narrow slit with teeth on both lips */}
    <ellipse cx={0} cy={0} rx={42} ry={25} fill="#f4ead8" {...ink(5)} />
    <path d="M-40 6 C -30 26 30 26 40 6 C 30 18 -30 18 -40 6 Z" fill="#d9c3a0" />
    <ellipse cx={0} cy={-8} rx={32} ry={12} fill="#fbf6ec" />
    <ellipse cx={-12} cy={-11} rx={13} ry={4} fill="#ffffff" />
    <path d="M-30 3 Q 0 -2 30 3 Q 0 7 -30 3 Z" fill="#6b4a2e" />
    {[-22, -15, -8, -1, 6, 13, 20].map((x, j) => <g key={j}><path d={`M${x} -1 l 0 -6`} stroke="#b38b62" strokeWidth={3} strokeLinecap="round" /><path d={`M${x} 7 l 0 6`} stroke="#b38b62" strokeWidth={3} strokeLinecap="round" /></g>)}
  </g>
);
export const Table2D: React.FC<{ T: MoneyTimeline; t: number; talk: number }> = ({ T, t, talk }) => {
  const c0 = T.s('coins');
  const tS = T.wordTime('coins', 'shells', c0 + 1.9);
  const tC = T.wordTime('coins', 'coins', c0 + 2.6);
  const tG = T.wordTime('coins', 'gold', c0 + 3.0);
  const tSi = T.wordTime('coins', 'silver', c0 + 3.4);
  const tW = T.wordTime('coins', 'worth', c0 + 3.9);
  // close-up camera (Ã—1.75 on the table top): drift to the shells, then settle between shells and coins
  const cx = 645;
  const zm = lerp(2.12, 2.3, easeInOutSine(clamp01((t - c0) / Math.max(0.5, tC + 0.3 - c0))));
  const shells = useMemo(() => { const r = rng(21); return Array.from({ length: 12 }, (_, i) => ({ x: 588 + r() * 52, y: 952 - (i % 4) * 4 - Math.floor(i / 4) * 17, d: i * 0.03, rot: r() * 60 - 30 })); }, []);
  const coinsAt = (n: number, seed: number, x0: number) => { const r = rng(seed); return Array.from({ length: n }, (_, i) => ({ x: x0 + r() * 45, y: 960 - Math.floor(i / 3) * 20, d: i * 0.05 })); };
  const gold = useMemo(() => coinsAt(6, 22, 690), []);
  const silver = useMemo(() => coinsAt(5, 23, 742), []);
  const fall = (t0: number, d: number, dur = 0.35) => clamp01((t - t0 - d) / dur);
  const lampOn = (i: number) => t >= c0 + 0.4 + 0.5 * i;
  const shine = t >= tW ? 0.5 + 0.5 * Math.sin((t - tW) * 9) : 0;
  const coin = (c: { x: number; y: number; d: number }, i: number, t0: number, face: string, rim: string) => {
    const k = fall(t0, c.d, 0.4); if (k <= 0) return null;
    const sx = k < 1 ? Math.abs(Math.cos((1 - k) * 14)) : 1;
    return (
      <g key={i} transform={`translate(${c.x} ${c.y - 170 * (1 - easeOutCubic(k))})`}>
        <g transform={`scale(${Math.max(0.4, sx)} ${k < 1 ? 1 : 0.42})`}>
          <circle cx={0} cy={0} r={34} fill={face} {...ink(5)} />
          <circle cx={0} cy={0} r={22} fill="none" stroke={rim} strokeWidth={5} />
        </g>
      </g>
    );
  };
  return (
    <g>
      <g transform={`translate(540 1000) scale(${zm}) translate(${-cx} -960)`}>
        {/* museum-ish wall + wainscot + floor */}
        <rect x={0} y={0} width={W} height={1500} fill="#6a5a86" />
        {Array.from({ length: 12 }, (_, i) => <rect key={i} x={i * 120 + 40} y={0} width={44} height={1150} fill="#5f507a" />)}
        <rect x={0} y={1150} width={W} height={350} fill="#4e4168" {...ink(6)} />
        <rect x={0} y={1440} width={W} height={480} fill="#6b4f3a" {...ink(6)} />
        {/* two hanging lamps that click on while the counter races forward */}
        {[580, 780].map((x, i) => (
          <g key={i}>
            <path d={`M${x} 0 L ${x} 300`} {...ink(6)} />
            {lampOn(i) && <path d={`M${x - 60} 360 L ${x - 190} 1000 L ${x + 190} 1000 L ${x + 60} 360 Z`} fill="#ffe6a8" opacity={0.22} />}
            <path d={`M${x - 60} 360 C ${x - 60} 300 ${x + 60} 300 ${x + 60} 360 Z`} fill="#f0b429" {...ink(6)} />
            <ellipse cx={x} cy={362} rx={30} ry={10} fill={lampOn(i) ? '#fff6d0' : '#8a7a5a'} />
          </g>
        ))}
        {/* the long table */}
        <rect x={60} y={960} width={W - 120} height={46} rx={10} fill="#b98250" {...ink(8)} />
        <rect x={80} y={1004} width={W - 160} height={80} fill="#9a6a3c" {...ink(7)} />
        {[110, W - 110].map((x, i) => <rect key={i} x={x - 22} y={1080} width={44} height={380} fill="#8a5a3a" {...ink(7)} />)}
        {/* museum rope barrier in the foreground */}
        {[200, 620, 1040, 1460].map((x, i) => (
          <g key={i}>
            <rect x={x - 10} y={1170} width={20} height={190} fill="#c99a1e" {...ink(5)} />
            <ellipse cx={x} cy={1362} rx={46} ry={14} fill="#c99a1e" {...ink(5)} />
            <circle cx={x} cy={1166} r={16} fill="#f0c040" {...ink(5)} />
          </g>
        ))}
        {[200, 620, 1040].map((x, i) => <path key={i} d={`M${x + 12} 1180 Q ${x + 210} 1260 ${x + 408} 1180`} fill="none" stroke={INK} strokeWidth={22} strokeLinecap="round" />)}
        {[200, 620, 1040].map((x, i) => <path key={i} d={`M${x + 12} 1180 Q ${x + 210} 1260 ${x + 408} 1180`} fill="none" stroke="#b3263a" strokeWidth={12} strokeLinecap="round" />)}
        {/* empty spotlight pools with a "?" where the money will land (they make the wait feel like a reveal) */}
        {[[614, tS], [740, tG - 0.2]].map(([x, t1], i) => {
          if (!lampOn(i) || t >= (t1 as number)) return null;
          const p = easeOutBack(clamp01((t - (c0 + 0.4 + 0.5 * i)) / 0.25));
          return (
            <g key={i} transform={`translate(${x} 958) scale(${p})`}>
              <ellipse cx={0} cy={0} rx={56} ry={12} fill="#fff1c2" opacity={0.75} />
              <text x={0} y={-12} textAnchor="middle" fontFamily="Montserrat, Arial Black, sans-serif" fontWeight={900} fontSize={60} fill="#ffd21f" stroke={INK} strokeWidth={6} paintOrder="stroke">?</text>
            </g>
          );
        })}
        {/* shells pour in */}
        {t >= tS && shells.map((s, i) => { const k = fall(tS, s.d); if (k <= 0) return null; return (
          <g key={i} transform={`translate(${s.x} ${s.y - 170 * (1 - easeOutCubic(k))}) rotate(${s.rot * k})`}><Cowrie back={i % 2 === 0} /></g>); })}
        {/* gold coins, then silver coins, drop and spin */}
        {t >= tG - 0.2 && gold.map((c, i) => coin(c, i, Math.min(tC, tG - 0.2), '#f0c040', '#c99a1e'))}
        {t >= tSi - 0.1 && silver.map((c, i) => coin(c, i, tSi - 0.1, '#d9dee6', '#9aa3ad'))}
        {/* sparkles on "worth something on their own" */}
        {shine > 0 && [[700, 905], [775, 918], [738, 878]].map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y}) scale(${0.6 + 0.6 * Math.abs(Math.sin((t - tW) * 6 + i))})`}>
            <path d="M0 -22 L 5 -5 L 22 0 L 5 5 L 0 22 L -5 5 L -22 0 L -5 -5 Z" fill="#fff6c8" {...ink(3)} />
          </g>
        ))}
        {/* Hoot stands on the table between the old barter goods and the shells */}
        <Hoot2D t={t} talk={talk} x={500} y={962} s={0.36} />
      </g>
    </g>
  );
};
