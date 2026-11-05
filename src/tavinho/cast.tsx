import React, { createContext, useContext } from 'react';
import { INK, ink } from './style';
import { Hand, Limb } from './style';

/**
 * A Vida do Tavinho: the cast, drawn in the house 2D style (ink outlines, flat colours, one shade).
 * Every character uses "body coords": the face is centred near (540, 840), feet at y 2020.
 * Place one with <g transform={place(x, feetY, scale)}> from toon2d/parts.
 * Original designs only (see tavinho/BIBLIA.md: no cap, no broken tooth, no running tee, no stubble).
 */
export const PAL = { navy: '#1c2340', cream: '#fff4e0', orange: '#ff7a2e', mint: '#3ddc97' };
const SKIN = '#f0bb90', SKIN_SH = '#dc9e74', BLUSH = '#ff8f86';

export type Mood = 'neutral' | 'worried' | 'proud' | 'shock' | 'gulp' | 'happy' | 'talk';
/**
 * Acting cues from the episode (per caption phrase): Tavinho's mood for this phrase and a head bob (0..1) on stressed words.
 * Set by Episode.tsx; when no mood is given, each scene's own mood is used.
 */
export const Act = createContext<{ mood?: Mood; bob: number }>({ bob: 0 });

export type Face = {
  t: number;
  /** expression mix */
  mood?: Mood;
  talk?: number;     // 0..1 mouth open for characters who speak
  look?: [number, number];
  slip?: number;     // Tavinho's glasses sliding down the nose, 0..1
  sweat?: number;    // 0..1 number/intensity of sweat drops
  shades?: boolean;  // Tavinho: dark "hacker" lenses over his glasses
  stache?: number;   // Tavinho: a paper mustache on his lip, 0..1 (pops in)
};

/** Each character blinks on its own period (s), so blinks never sync; none in the first 1.4 s (thumbnail). */
const blinkAt = (t: number, period: number, phase: number) => t > 1.4 && (t + phase) % period < 0.13;
/** Idle breathing for the seated/standing extras: a tiny vertical stretch from the waist. */
const breathe = (t: number, phase: number) => `translate(540 1660) scale(1 ${1 + 0.008 * Math.sin(t * 2.1 + phase)}) translate(-540 -1660)`;

/**
 * Shared face (new house style): big outlined eyes with mood eyelids, thick soft brows, a mouth that shows teeth.
 * Drawn around eye centres ex at height ey; `skin` colours the eyelids; `buck` adds two front teeth (Tavinho).
 */
export const Features: React.FC<Face & { ex: [number, number]; ey: number; mouthY: number; seed: number; period: number; lips?: string; eyeR?: number; skin?: string; brow?: string; buck?: boolean }> = ({ t, mood = 'neutral', talk = 0, look = [0, 0], ex, ey, mouthY, seed, period, lips, eyeR = 34, skin = SKIN_SH, brow = '#3a2416', buck = false }) => {
  const blink = blinkAt(t, period, seed);
  const happy = mood === 'proud' || mood === 'happy';
  const shock = mood === 'shock';
  const lid = mood === 'gulp' ? 0.42 : mood === 'worried' ? 0.22 : mood === 'neutral' || mood === 'talk' ? 0.1 : 0;
  const rx = eyeR * (shock ? 1.12 : 1), ry = (eyeR + 8) * (shock ? 1.14 : 1);
  const mx = (ex[0] + ex[1]) / 2;
  const lipCol = lips ?? INK;
  const uid = `${Math.round(ex[0])}-${Math.round(ey)}-${Math.round(seed * 10)}`;
  return (
    <g>
      {ex.map((x, i) => (
        <g key={i}>
          {happy || blink
            ? <path d={`M${x - rx} ${ey + 2} Q ${x} ${happy ? ey - ry * 0.75 : ey + 8} ${x + rx} ${ey + 2}`} fill="none" {...ink(9)} />
            : (
              <g>
                <clipPath id={`eye-${uid}-${i}`}><ellipse cx={x} cy={ey} rx={rx} ry={ry} /></clipPath>
                <ellipse cx={x} cy={ey} rx={rx} ry={ry} fill="#ffffff" />
                <g clipPath={`url(#eye-${uid}-${i})`}>
                  <circle cx={x + look[0] + (i ? -2 : 2)} cy={ey + 4 + look[1] + lid * 10} r={shock ? eyeR * 0.28 : eyeR * 0.42} fill={INK} />
                  <circle cx={x + look[0] + (i ? 3 : 7)} cy={ey - 3 + look[1] + lid * 10} r={eyeR * 0.13} fill="#ffffff" />
                  {lid > 0 && <rect x={x - rx - 4} y={ey - ry - 4} width={rx * 2 + 8} height={ry * 2 * lid + 4} fill={skin} />}
                </g>
                {lid > 0 && <path d={`M${x - rx} ${ey - ry + ry * 2 * lid} Q ${x} ${ey - ry + ry * 2 * lid - 6} ${x + rx} ${ey - ry + ry * 2 * lid}`} fill="none" {...ink(6)} />}
                <ellipse cx={x} cy={ey} rx={rx} ry={ry} fill="none" {...ink(6)} />
              </g>
            )}
          {/* thick soft brows: shock = high arch, worried = inner ends up, proud = high, gulp = low and flat */}
          {(() => {
            const up = shock ? 30 : mood === 'proud' ? 16 : mood === 'gulp' ? -6 : 0;
            const tilt = mood === 'worried' || mood === 'gulp' ? 12 : mood === 'proud' ? -6 : 0;
            const by = ey - ry - 18 - up;
            const inner = i === 0 ? x + rx * 0.9 : x - rx * 0.9, outer = i === 0 ? x - rx * 0.9 : x + rx * 0.9;
            return <path d={`M${outer} ${by + 6} Q ${x} ${by - (shock ? 14 : 6)} ${inner} ${by - tilt}`} fill="none" stroke={brow} strokeWidth={eyeR * 0.36} strokeLinecap="round" />;
          })()}
        </g>
      ))}
      {/* mouth */}
      {(() => {
        const w = eyeR * 1.4;
        if (talk > 0.05) return <g><ellipse cx={mx} cy={mouthY + 8} rx={w * (0.55 + 0.2 * talk)} ry={10 + 26 * talk} fill="#7a2c2a" stroke={lipCol} strokeWidth={lips ? 9 : 6} /><path d={`M${mx - w * 0.4} ${mouthY - 4 + 14 * (1 - talk)} L ${mx + w * 0.4} ${mouthY - 4 + 14 * (1 - talk)}`} stroke="#ffffff" strokeWidth={8} strokeLinecap="round" /></g>;
        switch (mood) {
          case 'shock': return <g><path d={`M${mx - w * 0.6} ${mouthY} C ${mx - w * 0.6} ${mouthY - 24} ${mx + w * 0.6} ${mouthY - 24} ${mx + w * 0.6} ${mouthY} C ${mx + w * 0.6} ${mouthY + 62} ${mx - w * 0.6} ${mouthY + 62} ${mx - w * 0.6} ${mouthY} Z`} fill="#7a2c2a" stroke={lipCol} strokeWidth={6} /><path d={`M${mx - w * 0.45} ${mouthY - 8} L ${mx + w * 0.45} ${mouthY - 8} L ${mx + w * 0.4} ${mouthY + 6} L ${mx - w * 0.4} ${mouthY + 6} Z`} fill="#ffffff" {...ink(3)} /><ellipse cx={mx} cy={mouthY + 34} rx={w * 0.35} ry={10} fill="#d9605a" /></g>;
          case 'proud': case 'happy': return <g><path d={`M${mx - w} ${mouthY - 8} C ${mx - w * 0.5} ${mouthY + 6} ${mx + w * 0.5} ${mouthY + 6} ${mx + w} ${mouthY - 8} C ${mx + w * 0.8} ${mouthY + 60} ${mx - w * 0.8} ${mouthY + 60} ${mx - w} ${mouthY - 8} Z`} fill="#7a2c2a" stroke={lipCol} strokeWidth={lips ? 9 : 6} strokeLinejoin="round" /><path d={`M${mx - w * 0.85} ${mouthY - 4} C ${mx - w * 0.4} ${mouthY + 10} ${mx + w * 0.4} ${mouthY + 10} ${mx + w * 0.85} ${mouthY - 4} L ${mx + w * 0.75} ${mouthY + 12} C ${mx + w * 0.3} ${mouthY + 24} ${mx - w * 0.3} ${mouthY + 24} ${mx - w * 0.75} ${mouthY + 12} Z`} fill="#ffffff" {...ink(3)} /></g>;
          case 'worried': return <g><path d={`M${mx - w * 0.7} ${mouthY + 10} q ${w * 0.23} -16 ${w * 0.47} 0 q ${w * 0.23} 16 ${w * 0.47} 0 q ${w * 0.23} -16 ${w * 0.47} 0`} fill="none" stroke={lipCol} strokeWidth={8} strokeLinecap="round" />{buck && <path d={`M${mx - 18} ${mouthY + 12} L ${mx - 18} ${mouthY + 30} L ${mx + 16} ${mouthY + 30} L ${mx + 16} ${mouthY + 12} Z M${mx - 1} ${mouthY + 12} L ${mx - 1} ${mouthY + 30}`} fill="#ffffff" {...ink(4)} />}</g>;
          case 'gulp': return <g><path d={`M${mx - w * 0.5} ${mouthY + 6} Q ${mx} ${mouthY + 12} ${mx + w * 0.5} ${mouthY + 6}`} fill="none" stroke={lipCol} strokeWidth={8} strokeLinecap="round" />{buck && <path d={`M${mx - 18} ${mouthY + 9} L ${mx - 18} ${mouthY + 27} L ${mx + 16} ${mouthY + 27} L ${mx + 16} ${mouthY + 9} Z M${mx - 1} ${mouthY + 9} L ${mx - 1} ${mouthY + 27}`} fill="#ffffff" {...ink(4)} />}</g>;
          default: return <g><path d={`M${mx - w * 0.6} ${mouthY} Q ${mx} ${mouthY + 30} ${mx + w * 0.6} ${mouthY}`} fill="none" stroke={lipCol} strokeWidth={lips ? 10 : 8} strokeLinecap="round" />{buck && <path d={`M${mx - 18} ${mouthY + 12} L ${mx - 18} ${mouthY + 32} L ${mx + 16} ${mouthY + 32} L ${mx + 16} ${mouthY + 12} Z M${mx - 1} ${mouthY + 12} L ${mx - 1} ${mouthY + 32}`} fill="#ffffff" {...ink(4)} />}</g>;
        }
      })()}
    </g>
  );
};

/** Sweat drops flying off a head (intensity 0..1). */
export const Sweat: React.FC<{ t: number; n: number; cx: number; cy: number; r: number }> = ({ t, n, cx, cy, r }) => (
  <g>
    {Array.from({ length: Math.round(4 * n) }, (_, i) => {
      const side = i % 2 ? 1 : -1;
      const ph = ((t * 1.4 + i * 0.37) % 1);
      const x = cx + side * (r + 20 + 60 * ph), y = cy - r * 0.6 + 140 * ph * ph - 30 * ph;
      return <path key={i} transform={`translate(${x} ${y}) rotate(${side * 20})`} d="M0 -26 C 14 -6 17 7 0 14 C -17 7 -14 -6 0 -26 Z" fill="#a9d6f5" opacity={1 - ph * 0.6} {...ink(4)} />;
    })}
  </g>
);

/* ------------------------------------------------------------------ Tavinho (new house style: clumsy and funny at a glance) */
const T_SKIN = '#f0bb90', T_SKIN_SH = '#dc9e74', T_HAIR = '#4a2a1c', FRAME = '#6b3f26';

/**
 * Tavinho's head. Drawn in the style-test coordinates (eyes at 505/632, y 540) and moved onto the cast's body coords.
 * Clumsy touches: crooked glasses sliding down the nose, a cowlick sticking up next to the curl, two buck teeth,
 * ears a bit big, round chubby face with blush.
 */
export const TavinhoHead: React.FC<Face> = (props) => {
  const act = useContext(Act);
  const f = { ...props, mood: act.mood ?? props.mood };
  const slip = f.slip ?? 0;
  const nod = 22 * act.bob, tilt = 3 * act.bob + 1.2 * Math.sin(f.t * 1.3);
  return (
    <g transform={`translate(0 ${nod + 3 * Math.sin(f.t * 2.2 + 1)}) rotate(${tilt} 540 1000)`}>
      <g transform="translate(540 1050) scale(1.15) translate(-540 -1050) translate(-28 300)">
        {/* ears, a bit too big */}
        {[[398, -1], [722, 1]].map(([x, s], i) => <g key={i}><ellipse cx={x} cy={560} rx={34} ry={46} fill={T_SKIN} {...ink(8)} /><path d={`M${x + s * -4} 540 q ${s * 14} 18 ${s * -2} 36`} fill="none" stroke={T_SKIN_SH} strokeWidth={6} strokeLinecap="round" /></g>)}
        {/* round, chubby face; a soft shadow along the jaw; blush */}
        <path data-qa="face" d="M402 540 C 400 410 470 340 560 340 C 652 340 720 410 718 540 C 716 610 740 690 690 750 C 650 795 600 806 560 806 C 520 806 470 796 430 750 C 380 690 404 610 402 540 Z" fill={T_SKIN} {...ink(9)} />
        <path d="M420 690 C 460 770 520 790 560 790 C 610 790 668 768 702 700 C 650 740 560 752 420 690 Z" fill={T_SKIN_SH} opacity={0.8} />
        {[440, 684].map((x, i) => <ellipse key={i} cx={x} cy={650} rx={40} ry={22} fill="#ff8f86" opacity={0.42} />)}
        {/* neat hair, the curl, and a cowlick that won't lie down */}
        <path d="M418 540 C 400 400 470 318 560 316 C 660 314 716 392 704 520 C 690 460 650 430 600 428 C 560 426 520 440 480 440 C 450 440 428 480 418 540 Z" fill={T_HAIR} {...ink(9)} />
        <path d="M470 330 L 452 270 L 492 316 L 498 252 L 520 318" fill={T_HAIR} {...ink(7)} />
        <path d="M590 430 C 560 404 566 360 600 360 C 630 360 634 396 610 404 C 596 408 590 394 600 388" fill="none" stroke="#8a5a3a" strokeWidth={18} strokeLinecap="round" />
        <path d="M590 430 C 560 404 566 360 600 360 C 630 360 634 396 610 404 C 596 408 590 394 600 388" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
        <Features {...f} ex={[505, 634]} ey={540 + 6 * slip} mouthY={698} seed={0.3} period={3.1} eyeR={50} skin={T_SKIN_SH} brow={T_HAIR} buck />
        {/* small round button nose */}
        <ellipse cx={568} cy={636} rx={30} ry={24} fill={T_SKIN_SH} {...ink(7)} />
        <ellipse cx={558} cy={628} rx={9} ry={6} fill="#ffffff" opacity={0.55} />
        {/* crooked round glasses (left lens higher), sliding down the nose */}
        <g transform={`translate(0 ${34 * slip}) rotate(-4 570 540)`}>
          <path d="M443 532 L 404 548 M 692 536 L 722 546" fill="none" stroke={FRAME} strokeWidth={7} strokeLinecap="round" />
          {[[505, 64, 64], [634, 60, 60]].map(([x, rx, ry], i) => (
            <g key={i}>
              <rect x={x - rx} y={540 - ry} width={rx * 2} height={ry * 2} rx={ry * 0.85} fill={f.shades ? 'rgba(20,23,26,0.92)' : 'rgba(214,236,250,0.22)'} stroke={INK} strokeWidth={12} />
              <rect x={x - rx} y={540 - ry} width={rx * 2} height={ry * 2} rx={ry * 0.85} fill="none" stroke={FRAME} strokeWidth={7} />
              <path d={`M${x - rx * 0.62} ${540 - ry * 0.35} L ${x - rx * 0.2} ${540 - ry * 0.72}`} stroke="#ffffff" strokeWidth={9} strokeLinecap="round" opacity={0.75} />
            </g>
          ))}
          <path d="M576 534 Q 571 514 567 534" fill="none" stroke={FRAME} strokeWidth={7} strokeLinecap="round" />
        </g>
        {/* paper mustache (he imitates the boss) */}
        {(f.stache ?? 0) > 0 && (
          <g transform={`translate(568 672) scale(${f.stache}) rotate(${4 * Math.sin(f.t * 6)})`}>
            <path d="M0 -6 C -30 -24 -70 -20 -96 6 C -70 0 -40 6 0 10 C 40 6 70 0 96 6 C 70 -20 30 -24 0 -6 Z" fill="#9a9aa6" {...ink(6)} />
          </g>
        )}
        <Sweat t={f.t} n={f.sweat ?? 0} cx={560} cy={460} r={190} />
      </g>
    </g>
  );
};

export type Outfit = 'work' | 'pajama' | 'hoodie' | 'tee';
const OUTFIT: Record<Outfit, [string, string]> = { work: ['#a9cdec', '#86afd6'], pajama: ['#bfe3cf', '#93c4ab'], hoodie: ['#3a3a44', '#2a2a32'], tee: ['#f2c94c', '#d9a82a'] };

/**
 * Tavinho standing (body coords; feet at 2020). Clumsy at a glance: a round belly in a shirt that's too small
 * (a button gap, one tail untucked), a tie that's too short and crooked, skinny knock-kneed legs, trousers too short
 * showing odd socks (stripes / dots), big shoes.
 */
export const Tavinho: React.FC<Face & { armL?: number[][]; armR?: number[][]; holdR?: React.ReactNode; holdL?: React.ReactNode; puff?: number; outfit?: Outfit }> = (f) => {
  const outfit = f.outfit ?? 'work';
  const [SHIRT, SHIRT_SH] = OUTFIT[outfit];
  const breathe = 5 * Math.sin(f.t * 2.2) + 14 * (f.puff ?? 0);
  const armL = f.armL ?? [[380, 1150], [270, 1340], [290, 1500]];
  const armR = f.armR ?? [[700, 1150], [810, 1340], [790, 1500]];
  const hL = armL[armL.length - 1], hR = armR[armR.length - 1];
  const PANTS = '#2f3b5c';
  return (
    <g>
      <ellipse cx={540} cy={2016} rx={230} ry={26} fill="#000" opacity={0.2} />
      {/* skinny knock-kneed legs, trousers a bit short */}
      {[[[470, 1590], [508, 1780], [458, 1930]], [[610, 1590], [572, 1780], [622, 1930]]].map((pts, i) => <Limb key={i} pts={pts} w={62} color={PANTS} />)}
      {/* odd socks: stripes on the left, dots on the right */}
      <rect x={440} y={1925} width={46} height={42} fill="#e2453c" {...ink(4)} />
      {[1935, 1952].map((y) => <path key={y} d={`M440 ${y} L 486 ${y}`} stroke="#fff4e0" strokeWidth={6} />)}
      <rect x={596} y={1925} width={46} height={42} fill="#3e6a8a" {...ink(4)} />
      {[[608, 1936], [628, 1950], [612, 1958]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={4} fill="#f2c94c" />)}
      {/* big brown shoes */}
      {[[452, -1], [628, 1]].map(([x, s], i) => <path key={i} d={`M${x - 74 + (s as number) * 14} 2016 C ${x - 80} 1972 ${x - 44} 1956 ${x} 1956 C ${x + 52} 1956 ${x + 90} 1978 ${x + 84 + (s as number) * 14} 2016 Z`} fill="#7a4a2c" {...ink(7)} />)}
      <g transform={`translate(0 ${-breathe * 0.3})`}>
        {/* round belly in a shirt that's too small */}
        <path d={`M352 1610 C 240 1500 262 1210 410 1100 L 670 1100 C 818 1210 ${840 + breathe} 1500 728 1610 Z`} fill={SHIRT} {...ink(8)} />
        <path d={`M690 1130 C 800 1220 ${818 + breathe} 1480 720 1600 L 676 1600 C 744 1480 744 1260 690 1130 Z`} fill={SHIRT_SH} />
        {outfit === 'pajama' && [330, 400, 470, 610, 680, 750].map((x, i) => <path key={i} d={`M${x} ${1160 + Math.abs(x - 540) * 0.25} L ${x + (x - 540) * 0.1} 1595`} stroke="#6fae92" strokeWidth={10} opacity={0.7} />)}
        {outfit === 'hoodie' && <path d="M420 1420 L 660 1420 L 690 1560 L 390 1560 Z" fill="none" stroke="#55555f" strokeWidth={8} strokeLinejoin="round" />}
        {/* buttons straining; a gap above the belt shows a bit of tummy */}
        {(outfit === 'work' || outfit === 'pajama') && (
          <g>
            {[1220, 1320, 1420].map((y, i) => <g key={i}><circle cx={548} cy={y} r={11} fill="#ffffff" {...ink(4)} />{i > 0 && [-1, 1].map((s) => <path key={s} d={`M${548 + s * 18} ${y} q ${s * 24} -10 ${s * 46} -4`} fill="none" stroke={SHIRT_SH} strokeWidth={5} strokeLinecap="round" />)}</g>)}
            <path d="M524 1500 C 536 1480 566 1480 576 1502 C 566 1530 534 1530 524 1500 Z" fill={T_SKIN} {...ink(5)} />
          </g>
        )}
        {/* belt, with one shirt tail hanging out */}
        <path d="M356 1596 C 450 1624 630 1624 724 1596" fill="none" stroke="#3a2a22" strokeWidth={20} />
        {outfit !== 'hoodie' && <path d="M636 1604 L 714 1594 L 702 1664 L 646 1656 Z" fill={SHIRT} {...ink(6)} />}
        {/* collar + a short, crooked red tie (work); pyjama collar; hood; tee neckline */}
        {outfit === 'work' && (
          <g>
            <path d="M455 1095 L 520 1160 L 540 1100 Z M625 1095 L 560 1160 L 540 1100 Z" fill="#ffffff" {...ink(6)} />
            <g transform="rotate(18 540 1120)">
              <path d="M522 1110 L 558 1110 L 552 1140 L 528 1140 Z" fill="#c0453c" {...ink(5)} />
              <path d="M528 1140 L 552 1140 L 566 1260 L 540 1290 L 514 1260 Z" fill="#c0453c" {...ink(6)} />
              <path d="M532 1180 L 554 1200" stroke="#94302a" strokeWidth={6} />
            </g>
          </g>
        )}
        {outfit === 'pajama' && <path d="M455 1095 L 520 1170 L 540 1105 Z M625 1095 L 560 1170 L 540 1105 Z" fill="#e9f6ef" {...ink(6)} />}
        {outfit === 'hoodie' && <g><path d="M420 1110 C 420 1040 660 1040 660 1110 C 620 1150 460 1150 420 1110 Z" fill="#4a4a54" {...ink(7)} />{[505, 575].map((x, i) => <path key={i} d={`M${x} 1130 L ${x + (i ? 6 : -6)} 1260`} stroke="#d9d9e0" strokeWidth={7} strokeLinecap="round" />)}</g>}
        {outfit === 'tee' && <path d="M470 1100 Q 540 1150 610 1100" fill="none" {...ink(7)} />}
        {/* arms: long sleeves, or a tee's short sleeves over bare forearms */}
        <Limb pts={armL} w={78} color={outfit === 'tee' ? T_SKIN : SHIRT} />
        <Limb pts={armR} w={78} color={outfit === 'tee' ? T_SKIN : SHIRT} />
        {outfit === 'tee' && [armL, armR].map((a, i) => <Limb key={i} pts={[a[0], [a[0][0] + (a[1][0] - a[0][0]) * 0.55, a[0][1] + (a[1][1] - a[0][1]) * 0.55]]} w={90} color={SHIRT} />)}
        {f.holdL && <g transform={`translate(${hL[0]} ${hL[1]})`}>{f.holdL}</g>}
        {f.holdR && <g transform={`translate(${hR[0]} ${hR[1]})`}>{f.holdR}</g>}
        <Hand x={hL[0]} y={hL[1]} angle={(Math.atan2(hL[0] - armL[1][0], hL[1] - armL[1][1]) * -180) / Math.PI} color={T_SKIN} flipThumb r={40} />
        <Hand x={hR[0]} y={hR[1]} angle={(Math.atan2(hR[0] - armR[1][0], hR[1] - armR[1][1]) * -180) / Math.PI} color={T_SKIN} r={40} />
        <TavinhoHead {...f} />
      </g>
    </g>
  );
};

/* ------------------------------------------------------------------ the rest of the cast, in Tavinho's style (each with their OWN face) */

type HeadLook = {
  skin: string; skinSh: string; brow: string; eyeR: number; lips?: string; seed: number; period: number;
  /** the face outline (style coords), eye centres, eye height, mouth height, ears [x, y, rx, ry] */
  face: string; ex: [number, number]; ey: number; mouthY: number; ears: [number, number, number, number][];
  nose: React.ReactNode;
  /** drawn behind the face / over the face before the eyes / over everything (style coords) */
  back?: React.ReactNode; front?: React.ReactNode; top?: React.ReactNode; lashes?: boolean; earrings?: string;
};

/** A cast head in the house style; mapped onto body coords like Tavinho's (eyes near 820, chin near 1080). */
const PersonHead: React.FC<Face & { h: HeadLook }> = ({ h, ...f }) => (
  <g transform={`translate(0 ${3 * Math.sin(f.t * 2.2 + h.seed)})`}>
    <g transform="translate(540 1050) scale(1.12) translate(-540 -1050) translate(-28 300)">
      {h.back}
      {h.ears.map(([x, y, rx, ry], i) => { const s = i ? 1 : -1; return <g key={i}><ellipse cx={x} cy={y} rx={rx} ry={ry} fill={h.skin} {...ink(8)} /><path d={`M${x - s * 4} ${y - ry * 0.4} q ${s * rx * 0.4} ${ry * 0.4} ${s * -2} ${ry * 0.75}`} fill="none" stroke={h.skinSh} strokeWidth={6} strokeLinecap="round" />{h.earrings && <circle cx={x} cy={y + ry + 14} r={20} fill="none" stroke={h.earrings} strokeWidth={9} />}</g>; })}
      <path data-qa="face" d={h.face} fill={h.skin} {...ink(9)} />
      {h.front}
      <Features {...f} ex={h.ex} ey={h.ey} mouthY={h.mouthY} seed={h.seed} period={h.period} eyeR={h.eyeR} skin={h.skinSh} brow={h.brow} lips={h.lips} />
      {h.lashes && h.ex.map((x, i) => { const s = i ? 1 : -1; return <path key={i} d={`M${x + s * h.eyeR * 0.85} ${h.ey - h.eyeR * 0.6} l ${s * 18} -14 M${x + s * h.eyeR * 0.5} ${h.ey - h.eyeR * 0.95} l ${s * 10} -18`} {...ink(5)} />; })}
      {h.nose}
      {h.top}
    </g>
  </g>
);

type BodyLook = {
  skin: string; top: string; topSh: string; bottom: 'pants' | 'skirt'; bottomColor: string; shoe: string; width?: number;
  /** collar, necklace, jacket details over the torso (body coords) */
  detail?: React.ReactNode; legSkin?: boolean;
};

/** A standing cast body in the house style (same proportions as Tavinho: torso to the belt at 1600, legs, big shoes). */
const PersonBody: React.FC<{ t: number; b: BodyLook; phase: number; armL?: number[][]; armR?: number[][]; holdR?: React.ReactNode; children?: React.ReactNode }> = ({ t, b, phase, armL, armR, holdR, children }) => {
  const w = b.width ?? 1;
  const X = (x: number) => 540 + (x - 540) * w;
  const aL = armL ?? [[X(390), 1150], [X(300), 1340], [X(330), 1500]];
  const aR = armR ?? [[X(690), 1150], [X(780), 1340], [X(750), 1500]];
  const hR = aR[aR.length - 1];
  return (
    <g transform={breathe(t, phase)}>
      <ellipse cx={540} cy={2016} rx={210 * w} ry={24} fill="#000" opacity={0.2} />
      {[[[480, 1590], [490, 1780], [474, 1930]], [[600, 1590], [590, 1780], [606, 1930]]].map((pts, i) => <Limb key={i} pts={pts} w={58} color={b.bottom === 'skirt' || b.legSkin ? b.skin : b.bottomColor} />)}
      {b.bottom === 'skirt' && <path d={`M${X(360)} 1590 L ${X(720)} 1590 L ${X(760)} 1780 L ${X(320)} 1780 Z`} fill={b.bottomColor} {...ink(8)} />}
      {[[470, -1], [610, 1]].map(([x, s], i) => <path key={i} d={`M${x - 66 + s * 10} 2016 C ${x - 70} 1974 ${x - 40} 1958 ${x} 1958 C ${x + 44} 1958 ${x + 78} 1978 ${x + 72 + s * 10} 2016 Z`} fill={b.shoe} {...ink(7)} />)}
      <path d={`M${X(360)} 1610 C ${X(270)} 1500 ${X(290)} 1210 ${X(420)} 1100 L ${X(660)} 1100 C ${X(790)} 1210 ${X(810)} 1500 ${X(720)} 1610 Z`} fill={b.top} {...ink(8)} />
      <path d={`M${X(680)} 1130 C ${X(780)} 1220 ${X(796)} 1480 ${X(712)} 1600 L ${X(670)} 1600 C ${X(732)} 1480 ${X(732)} 1260 ${X(680)} 1130 Z`} fill={b.topSh} />
      <path d="M500 1030 L 500 1100 C 520 1112 560 1112 580 1100 L 580 1030 Z" fill={b.skin} {...ink(6)} />
      {b.detail}
      <Limb pts={aL} w={72} color={b.top} />
      <Limb pts={aR} w={72} color={b.top} />
      {holdR && <g transform={`translate(${hR[0]} ${hR[1]})`}>{holdR}</g>}
      <Hand x={aL[2][0]} y={aL[2][1]} angle={(Math.atan2(aL[2][0] - aL[1][0], aL[2][1] - aL[1][1]) * -180) / Math.PI} color={b.skin} flipThumb r={38} />
      <Hand x={hR[0]} y={hR[1]} angle={(Math.atan2(hR[0] - aR[1][0], hR[1] - aR[1][1]) * -180) / Math.PI} color={b.skin} r={38} />
      {children}
    </g>
  );
};

/* ------------------------------------------------------------------ Camila: heart-shaped face, almond eyes with long lashes, tiny nose, dimples; huge curly hair, hoops */
export const Camila: React.FC<Face> = (f) => {
  const SK = '#c98b5e', SK_SH = '#a86f45', HAIR = '#2a1a12';
  const curls = (n: number, r: number, cx: number, cy: number, rad: number, from = 0, to = Math.PI * 2) => Array.from({ length: n }, (_, i) => { const a = from + ((to - from) * i) / (n - 1); return <circle key={i} cx={cx + rad * Math.cos(a)} cy={cy + rad * 0.92 * Math.sin(a)} r={r} fill={HAIR} {...ink(6)} />; });
  return (
    <PersonBody t={f.t} phase={0.7} b={{ skin: SK, top: '#e0a63a', topSh: '#c48a24', bottom: 'pants', bottomColor: '#3e5f8a', shoe: '#f2ead8', width: 0.92, detail: <path d="M470 1100 Q 540 1160 610 1100" fill="none" {...ink(7)} /> }}>
      <PersonHead {...f} h={{
        skin: SK, skinSh: SK_SH, brow: HAIR, eyeR: 38, lips: '#b8354a', seed: 1.7, period: 3.7, lashes: true, earrings: '#e2b545',
        face: 'M420 500 C 420 390 480 330 560 330 C 640 330 700 390 700 500 C 700 610 660 700 604 770 C 584 796 536 796 516 770 C 460 700 420 610 420 500 Z',
        ex: [508, 612], ey: 520, mouthY: 650, ears: [[420, 540, 26, 38], [700, 540, 26, 38]],
        nose: <g><path d="M562 560 q 14 32 -6 40" fill="none" {...ink(6)} /><path d="M542 662 q -6 8 0 16 M 582 662 q 6 8 0 16" fill="none" stroke={SK_SH} strokeWidth={5} strokeLinecap="round" /></g>,
        back: <g>{curls(16, 90, 560, 510, 250)}<ellipse cx={560} cy={510} rx={250} ry={230} fill={HAIR} /></g>,
        front: <g>{[452, 668].map((x, i) => <ellipse key={i} cx={x} cy={610} rx={34} ry={18} fill="#ff8f86" opacity={0.42} />)}{curls(6, 48, 560, 456, 128, Math.PI * 1.05, Math.PI * 1.95)}</g>,
      }} />
    </PersonBody>
  );
};

/* ------------------------------------------------------------------ Dona Celeste: long face and long chin, little beady eyes behind red cat-eye glasses, long pointy nose, thin red lips, a beauty mark, painted-on high brows */
export const Celeste: React.FC<Face> = (f) => {
  const SK = '#f0c3a0', SK_SH = '#d79f7a', HAIR = '#e8d3a0', HAIR_SH = '#c9b27a';
  return (
    <PersonBody t={f.t} phase={1.9} b={{ skin: SK, top: '#7b4bb8', topSh: '#5e3794', bottom: 'skirt', bottomColor: '#3a3550', shoe: '#c0303e', width: 0.95,
      detail: <path d="M455 1112 Q 540 1196 625 1112" fill="none" stroke="#f7f3ea" strokeWidth={14} strokeDasharray="2 20" strokeLinecap="round" /> }}>
      <PersonHead {...f} h={{
        skin: SK, skinSh: SK_SH, brow: '#6a4a2a', eyeR: 26, lips: '#c0303e', seed: 2.9, period: 4.3, earrings: '#f7f3ea',
        face: 'M444 470 C 444 360 500 312 560 312 C 624 312 678 360 678 470 C 680 600 668 720 622 800 C 600 842 522 842 500 800 C 452 720 442 600 444 470 Z',
        ex: [514, 608], ey: 496, mouthY: 712, ears: [[444, 520, 24, 36], [678, 520, 24, 36]],
        nose: <path d="M560 520 C 574 568 604 612 594 634 C 584 650 558 646 548 628" fill={SK} {...ink(7)} />,
        back: <g>{Array.from({ length: 12 }, (_, i) => { const a = Math.PI * (0.9 + (i / 11) * 1.2); return <circle key={i} cx={560 + 220 * Math.cos(a)} cy={470 + 200 * Math.sin(a)} r={82} fill={HAIR} {...ink(6)} />; })}<ellipse cx={560} cy={440} rx={230} ry={180} fill={HAIR} /></g>,
        front: <g>
          <path d="M444 470 C 450 340 672 340 678 470 C 630 400 494 400 444 470 Z" fill={HAIR} {...ink(7)} />
          <path d="M480 390 C 530 366 600 366 650 390" fill="none" stroke={HAIR_SH} strokeWidth={8} strokeLinecap="round" />
          {/* painted-on brows, way too high */}
          {[[514, -1], [608, 1]].map(([x, s], i) => <path key={i} d={`M${x - 34} 446 Q ${x} ${410} ${x + 34} ${446 + s * -4}`} fill="none" stroke="#6a4a2a" strokeWidth={6} strokeLinecap="round" />)}
          <circle cx={640} cy={680} r={6} fill="#5a3a26" />
        </g>,
        top: <g>
          {[[514, -1], [608, 1]].map(([x, s], i) => <path key={i} d={`M${x - 50} ${490} Q ${x} ${458} ${x + 50} ${486} Q ${x + 52} ${540} ${x} ${544} Q ${x - 50} ${540} ${x - 50} ${490} Z M${x + s * 50} ${488} l ${s * 20} -18`} fill="rgba(255,255,255,0.14)" stroke="#c0303e" strokeWidth={8} strokeLinejoin="round" />)}
          <path d="M566 492 Q 561 478 556 492" fill="none" stroke="#c0303e" strokeWidth={7} />
          <path d="M466 520 C 440 620 450 740 500 790 M656 520 C 684 620 672 740 622 790" fill="none" stroke="#c99a1e" strokeWidth={4} strokeDasharray="7 6" />
        </g>,
      }} />
    </PersonBody>
  );
};

/* ------------------------------------------------------------------ Vó Dita: small round apple-cheeked face, squinty smiling eyes, tiny nose, laugh lines; white bun, little round glasses, apron */
export const VoDita: React.FC<Face & { spoon?: number }> = (f) => {
  const SK = '#e8b48d', SK_SH = '#c99069', HAIR = '#e6e6ea', HAIR_SH = '#b9b9c2';
  return (
    <PersonBody t={f.t} phase={3.1} b={{ skin: SK, top: '#3a8f7a', topSh: '#2a6b5a', bottom: 'skirt', bottomColor: '#3a8f7a', shoe: '#4a3a5a', width: 1.0,
      detail: <path d="M430 1180 L 650 1180 L 680 1600 L 400 1600 Z" fill="#fff4e0" {...ink(7)} /> }}
      armR={[[690, 1150], [790, 1290], [780, 1140]]}
      holdR={<g transform={`rotate(${8 * Math.sin((f.spoon ?? 0) * 8)})`}><rect x={-11} y={-280} width={22} height={260} rx={10} fill="#b98250" {...ink(5)} /><ellipse cx={0} cy={-300} rx={40} ry={56} fill="#b98250" {...ink(6)} /></g>}>
      <PersonHead {...f} mood={f.mood === 'neutral' ? 'happy' : f.mood} h={{
        skin: SK, skinSh: SK_SH, brow: HAIR_SH, eyeR: 24, seed: 4.1, period: 3.4,
        face: 'M410 580 C 410 450 470 392 560 392 C 650 392 710 450 710 580 C 710 700 650 790 560 790 C 470 790 410 700 410 580 Z',
        ex: [506, 614], ey: 570, mouthY: 690, ears: [[412, 600, 24, 34], [708, 600, 24, 34]],
        nose: <ellipse cx={560} cy={630} rx={18} ry={14} fill={SK_SH} {...ink(6)} />,
        back: <circle cx={560} cy={360} r={70} fill={HAIR} {...ink(7)} />,
        front: <g>
          <path d="M414 560 C 408 440 470 400 560 400 C 650 400 712 440 706 560 C 676 486 620 470 560 478 C 500 470 444 486 414 560 Z" fill={HAIR} {...ink(8)} />
          {[[446, 650], [674, 650]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx={46} ry={28} fill="#ff8f86" opacity={0.5} />)}
          {[[462, -1], [658, 1]].map(([x, s], i) => <path key={i} d={`M${x + s * 4} 560 l ${s * 18} -6 M${x + s * 4} 574 l ${s * 20} 2`} stroke={SK_SH} strokeWidth={5} strokeLinecap="round" />)}
          <path d="M520 500 Q 560 490 600 500" fill="none" stroke={SK_SH} strokeWidth={5} strokeLinecap="round" />
        </g>,
        top: <g>{[506, 614].map((x, i) => <circle key={i} cx={x} cy={570} r={42} fill="none" stroke="#8a6440" strokeWidth={7} />)}<path d="M548 570 L 572 570" stroke="#8a6440" strokeWidth={6} /></g>,
      }} />
    </PersonBody>
  );
};

/* ------------------------------------------------------------------ Seu Valdir: square blocky head and wide jaw, small eyes, a big bulbous red nose, jowls, big ears; one combed-over strand, huge grey mustache */
export const Valdir: React.FC<Face & { beach?: boolean; holdR?: React.ReactNode; armR?: number[][] }> = (f) => {
  const SK = '#e7b48e', SK_SH = '#c98f68', GREY = '#bdbdc6';
  // on holiday: a loud flowered shirt, khaki shorts (bare shins), flip-flops, sunglasses pushed up on his head
  const beach = f.beach ? { top: '#2f9c95', topSh: '#237a74', bottom: 'pants' as const, bottomColor: '#cdb27a', shoe: '#e2453c', legSkin: true,
    detail: <g>
      <path d="M470 1100 L 540 1190 L 610 1100" fill="none" {...ink(7)} />
      {[[430, 1220], [640, 1260], [500, 1400], [690, 1450], [400, 1480], [580, 1530]].map(([x, y], i) => <g key={i} transform={`translate(${x} ${y})`}>{[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx={0} cy={-18} rx={11} ry={18} fill={i % 2 ? '#ffd166' : '#ff8fb1'} transform={`rotate(${a})`} />)}<circle r={9} fill="#fff4e0" /></g>)}
      <path d="M380 1600 L 700 1600 L 704 1700 L 376 1700 Z" fill="#cdb27a" {...ink(7)} />
    </g> } : null;
  return (
    <PersonBody t={f.t} phase={2.4} armR={f.armR} holdR={f.holdR} b={beach ? { skin: SK, width: 1.08, ...beach } : { skin: SK, top: '#7a5434', topSh: '#5e3f25', bottom: 'pants', bottomColor: '#5e3f25', shoe: '#2a2a32', width: 1.08,
      detail: <g>
        <path d="M480 1100 L 540 1240 L 600 1100 Z" fill="#ffffff" {...ink(6)} />
        <path d="M528 1120 L 552 1120 L 560 1220 L 540 1246 L 520 1220 Z" fill="#2f6b4f" {...ink(5)} />
        <path d="M430 1100 L 500 1290 L 470 1110 Z M650 1100 L 580 1290 L 610 1110 Z" fill="#5e3f25" {...ink(5)} />
        {[1330, 1450].map((y) => <circle key={y} cx={540} cy={y} r={11} fill="#d4b26a" {...ink(4)} />)}
      </g> }}>
      <PersonHead {...f} h={{
        skin: SK, skinSh: SK_SH, brow: GREY, eyeR: 26, seed: 0.9, period: 3.9,
        face: 'M398 470 C 398 380 440 340 560 340 C 680 340 722 380 722 470 L 724 660 C 724 760 664 806 560 806 C 456 806 396 760 396 660 Z',
        ex: [500, 620], ey: 520, mouthY: 728, ears: [[396, 560, 36, 52], [724, 560, 36, 52]],
        nose: <g><ellipse cx={562} cy={612} rx={54} ry={44} fill="#e08f74" {...ink(7)} /><ellipse cx={546} cy={598} rx={14} ry={9} fill="#ffffff" opacity={0.45} /></g>,
        front: <g>
          <ellipse cx={610} cy={390} rx={50} ry={20} fill="#ffffff" opacity={0.4} transform="rotate(-18 610 390)" />
          {[[402, -1], [718, 1]].map(([x, s], i) => <path key={i} d={`M${x} 460 q ${s * 30} 20 ${s * 4} 60 q ${s * 30} 10 ${s * 8} 50`} fill={GREY} stroke={GREY} strokeWidth={24} strokeLinecap="round" />)}
          <path d="M430 440 C 480 350 600 330 690 390" fill="none" stroke="#6a6a74" strokeWidth={7} strokeLinecap="round" />
          {/* jowls */}
          {[[430, -1], [690, 1]].map(([x, s], i) => <path key={i} d={`M${x} 700 q ${s * -10} 50 ${s * 30} 80`} fill="none" stroke={SK_SH} strokeWidth={6} strokeLinecap="round" />)}
        </g>,
        top: <g>
          <path d="M562 670 C 514 652 446 660 428 706 C 472 690 520 696 562 702 C 604 696 652 690 696 706 C 678 660 610 652 562 670 Z" fill={GREY} {...ink(6)} />
          {f.beach && <g transform="rotate(-4 560 380)">{[500, 620].map((x) => <ellipse key={x} cx={x} cy={380} rx={52} ry={34} fill="#1b1420" opacity={0.92} />)}<path d="M548 376 L 572 376 M 448 372 L 400 400 M 672 372 L 720 400" {...ink(7)} /></g>}
        </g>,
      }} />
    </PersonBody>
  );
};

/**
 * Tavinho sitting on the front edge of a seat, facing us (body coords, like Tavinho: draw it at the same place()).
 * His standing legs are cut off at the belt; the thighs come towards us as two knees, the shins hang in front of the
 * seat down to the floor (feet at 2016). Draw the seat (back, cushion, front) BEFORE this, so the legs sit over its edge.
 */
export const SeatedTavinho: React.FC<React.ComponentProps<typeof Tavinho>> = (f) => {
  const id = `seat${React.useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const PANTS = '#2f3b5c';
  return (
    <g>
      <clipPath id={id}><rect x={-400} y={-400} width={1900} height={2030} /></clipPath>
      <g clipPath={`url(#${id})`}><Tavinho {...f} /></g>
      {/* shins first (behind the knees), then odd socks and big shoes on the floor */}
      {[[[448, 1700], [440, 1850], [446, 1930]], [[632, 1700], [640, 1850], [634, 1930]]].map((pts, i) => <Limb key={i} pts={pts} w={62} color={PANTS} />)}
      <rect x={423} y={1925} width={46} height={42} fill="#e2453c" {...ink(4)} />
      {[1935, 1952].map((y) => <path key={y} d={`M423 ${y} L 469 ${y}`} stroke="#fff4e0" strokeWidth={6} />)}
      <rect x={611} y={1925} width={46} height={42} fill="#3e6a8a" {...ink(4)} />
      {[[623, 1936], [643, 1950], [627, 1958]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={4} fill="#f2c94c" />)}
      {[[440, -1], [640, 1]].map(([x, s], i) => <path key={i} d={`M${x - 74 + s * 14} 2016 C ${x - 80} 1972 ${x - 44} 1956 ${x} 1956 C ${x + 52} 1956 ${x + 90} 1978 ${x + 84 + s * 14} 2016 Z`} fill="#7a4a2c" {...ink(7)} />)}
      {/* the thighs coming towards us: a lap and two knees */}
      <path d="M360 1600 C 420 1630 660 1630 720 1600 L 730 1660 C 660 1690 420 1690 350 1660 Z" fill={PANTS} {...ink(7)} />
      {[445, 635].map((x) => <ellipse key={x} cx={x} cy={1676} rx={92} ry={62} fill={PANTS} {...ink(8)} />)}
      {[445, 635].map((x) => <path key={`h${x}`} d={`M${x - 46} 1660 Q ${x} 1640 ${x + 46} 1660`} fill="none" stroke="#45527a" strokeWidth={8} strokeLinecap="round" />)}
    </g>
  );
};
