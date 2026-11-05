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

/* ------------------------------------------------------------------ Camila */
export const Camila: React.FC<Face> = (f) => {
  const SK = '#c98b5e', SK_SH = '#a86f45';
  return (
    <g transform={breathe(f.t, 0.7)}>
      {/* big curly hair behind */}
      {Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2;
        return <circle key={i} cx={540 + 210 * Math.cos(a)} cy={850 + 200 * Math.sin(a) - 20} r={88} fill="#2a1a12" {...ink(6)} />;
      })}
      <circle cx={540} cy={830} r={230} fill="#2a1a12" />
      {/* body: mustard top */}
      <path d="M330 1660 C 320 1400 350 1140 430 1100 L 650 1100 C 730 1140 760 1400 750 1660 Z" fill="#f2b33d" {...ink(8)} />
      <path d="M470 1100 Q 540 1170 610 1100" fill="none" {...ink(6)} />
      <Limb pts={[[380, 1160], [330, 1350], [400, 1500]]} w={74} color="#f2b33d" />
      <Limb pts={[[700, 1160], [750, 1350], [680, 1500]]} w={74} color="#f2b33d" />
      <Hand x={400} y={1500} angle={-30} color={SK} flipThumb />
      <Hand x={680} y={1500} angle={30} color={SK} />
      <path d="M500 1020 L 500 1100 C 520 1112 560 1112 580 1100 L 580 1020 Z" fill={SK_SH} {...ink(6)} />
      {[372, 708].map((x, i) => <ellipse key={i} cx={x} cy={858} rx={26} ry={36} fill={SK} {...ink(7)} />)}
      <path data-qa="face" d="M380 830 C 380 700 450 650 540 650 C 630 650 700 700 700 830 C 700 940 640 1020 540 1020 C 440 1020 380 940 380 830 Z" fill={SK} {...ink(8)} />
      {/* fringe curls */}
      {[430, 490, 560, 630].map((x, i) => <circle key={i} cx={x} cy={680 + (i % 2) * 14} r={52} fill="#2a1a12" />)}
      {[708, 372].map((x, i) => <circle key={i} cx={x} cy={900} r={10} fill="#f2b33d" {...ink(4)} />)}
      {[430, 650].map((x, i) => <ellipse key={i} cx={x} cy={925} rx={36} ry={20} fill={BLUSH} opacity={0.5} />)}
      <Features {...f} ex={[480, 600]} ey={840} mouthY={958} seed={1.7} period={3.7} lips="#c2364a" />
      {/* lashes */}
      {[480, 600].map((x, i) => <path key={i} d={`M${x + (i ? 30 : -30)} 812 l ${i ? 14 : -14} -12`} {...ink(5)} />)}
      <ellipse cx={540} cy={902} rx={14} ry={11} fill={SK_SH} />
    </g>
  );
};

/* ------------------------------------------------------------------ Dona Celeste (the mother-in-law) */
export const Celeste: React.FC<Face> = (f) => {
  const SK = '#f0c3a0', SK_SH = '#d79f7a';
  return (
    <g transform={breathe(f.t, 1.9)}>
      {/* violet blouse with a pearl necklace */}
      <path d="M320 1660 C 310 1400 340 1140 430 1100 L 650 1100 C 740 1140 770 1400 760 1660 Z" fill="#7b4bb8" {...ink(8)} />
      <Limb pts={[[380, 1160], [325, 1350], [390, 1500]]} w={78} color="#7b4bb8" />
      <Limb pts={[[700, 1160], [755, 1350], [690, 1500]]} w={78} color="#7b4bb8" />
      <Hand x={390} y={1500} angle={-30} color={SK} flipThumb />
      <Hand x={690} y={1500} angle={30} color={SK} />
      <path d="M455 1105 Q 540 1190 625 1105" fill="none" stroke="#f7f3ea" strokeWidth={12} strokeDasharray="2 18" strokeLinecap="round" />
      <path d="M500 1020 L 500 1100 C 520 1112 560 1112 580 1100 L 580 1020 Z" fill={SK_SH} {...ink(6)} />
      {/* big voluminous blond-grey hair */}
      {Array.from({ length: 11 }, (_, i) => { const a = Math.PI + (i / 10) * Math.PI; return <circle key={i} cx={540 + 200 * Math.cos(a)} cy={790 + 190 * Math.sin(a)} r={70} fill="#e8d3a0" {...ink(6)} />; })}
      <ellipse cx={540} cy={720} rx={205} ry={150} fill="#e8d3a0" />
      {[372, 708].map((x, i) => <g key={i}><ellipse cx={x} cy={858} rx={26} ry={36} fill={SK} {...ink(7)} /><circle cx={x} cy={900} r={12} fill="#f7f3ea" {...ink(4)} /></g>)}
      <path data-qa="face" d="M380 830 C 380 700 450 660 540 660 C 630 660 700 700 700 830 C 700 940 640 1020 540 1020 C 440 1020 380 940 380 830 Z" fill={SK} {...ink(8)} />
      <path d="M392 790 C 430 690 650 690 690 790 C 640 730 440 730 392 790 Z" fill="#e8d3a0" {...ink(6)} />
      {[430, 650].map((x, i) => <ellipse key={i} cx={x} cy={925} rx={36} ry={20} fill={BLUSH} opacity={0.45} />)}
      <Features {...f} ex={[480, 600]} ey={846} mouthY={962} seed={2.9} period={4.3} lips="#d81f3a" eyeR={26} />
      {/* cat-eye glasses on a chain */}
      {[480, 600].map((x, i) => <path key={i} d={`M${x - 52} 830 Q ${x} 800 ${x + 52} 826 Q ${x + 50} 880 ${x} 884 Q ${x - 50} 880 ${x - 52} 830 Z`} fill="rgba(255,255,255,0.12)" stroke="#d81f3a" strokeWidth={8} />)}
      <path d="M428 840 C 380 930 400 1060 470 1110 M652 840 C 700 930 680 1060 610 1110" fill="none" stroke="#c99a1e" strokeWidth={4} strokeDasharray="6 6" />
      <ellipse cx={540} cy={904} rx={14} ry={11} fill={SK_SH} />
    </g>
  );
};

/* ------------------------------------------------------------------ Vó Dita (grandma) */
export const VoDita: React.FC<Face & { spoon?: number }> = (f) => {
  const SK = '#e8b48d', SK_SH = '#c99069', HAIR = '#cfcfd4', HAIR_SH = '#a9a9b2';
  return (
    <g transform={breathe(f.t, 3.1)}>
      {/* legs + shoes, so she stands in the panel instead of floating */}
      {[470, 610].map((x, i) => <path key={i} d={`M${x - 45} 1640 L ${x + 45} 1640 L ${x + 40} 1965 L ${x - 40} 1965 Z`} fill={SK} {...ink(7)} />)}
      {[470, 610].map((x, i) => <path key={`s${i}`} d={`M${x - 62} 2016 C ${x - 64} 1978 ${x - 36} 1958 ${x} 1958 C ${x + 36} 1958 ${x + 64} 1978 ${x + 62} 2016 Z`} fill="#4a3a5a" {...ink(7)} />)}
      <ellipse cx={540} cy={2016} rx={200} ry={24} fill="#000" opacity={0.22} />
      {/* flowered dress + apron */}
      <path d="M310 1660 C 300 1400 340 1140 430 1100 L 650 1100 C 740 1140 780 1400 770 1660 Z" fill="#3a8f7a" {...ink(8)} />
      {[[400, 1250], [690, 1300], [380, 1500], [700, 1540]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={14} fill="#ffd21f" {...ink(3)} />)}
      <path d="M420 1180 L 660 1180 L 690 1660 L 390 1660 Z" fill="#fff4e0" {...ink(7)} />
      <path d="M470 1300 L 610 1300 L 600 1400 L 480 1400 Z" fill="none" {...ink(5)} />
      <path d="M500 1020 L 500 1100 C 520 1112 560 1112 580 1100 L 580 1020 Z" fill={SK_SH} {...ink(6)} />
      {[372, 708].map((x, i) => <ellipse key={i} cx={x} cy={858} rx={26} ry={36} fill={SK} {...ink(7)} />)}
      <path data-qa="face" d="M380 830 C 380 700 450 660 540 660 C 630 660 700 700 700 830 C 700 940 640 1020 540 1020 C 440 1020 380 940 380 830 Z" fill={SK} {...ink(8)} />
      {/* grey hair with a bun and a few strands */}
      <circle cx={540} cy={600} r={70} fill={HAIR} {...ink(7)} />
      <path d="M500 590 q 40 -30 80 0" fill="none" stroke={HAIR_SH} strokeWidth={6} strokeLinecap="round" />
      <path d="M380 800 C 380 690 450 650 540 650 C 630 650 700 690 700 800 C 660 730 600 720 540 728 C 480 720 420 730 380 800 Z" fill={HAIR} {...ink(7)} />
      {[[430, 700, 500, 690], [560, 688, 640, 704]].map(([x1, y1, x2, y2], i) => <path key={i} d={`M${x1} ${y1} Q ${(x1 + x2) / 2} ${y1 - 14} ${x2} ${y2}`} fill="none" stroke={HAIR_SH} strokeWidth={6} strokeLinecap="round" />)}
      {/* age lines: forehead and under the eyes */}
      {[0, 1].map((i) => <path key={`f${i}`} d={`M${470 + i * 10} ${752 + i * 16} q 70 ${-10} ${140 - i * 20} 0`} fill="none" stroke={SK_SH} strokeWidth={5} strokeLinecap="round" />)}
      {[480, 600].map((x, i) => <path key={`e${i}`} d={`M${x - 24} 896 q 24 10 48 0`} fill="none" stroke={SK_SH} strokeWidth={4} strokeLinecap="round" />)}
      {/* smile wrinkles */}
      {[410, 670].map((x, i) => <path key={i} d={`M${x} 820 q ${i ? 16 : -16} 10 0 24`} fill="none" stroke={SK_SH} strokeWidth={5} strokeLinecap="round" />)}
      {[430, 650].map((x, i) => <ellipse key={i} cx={x} cy={925} rx={36} ry={20} fill={BLUSH} opacity={0.55} />)}
      <Features {...f} ex={[480, 600]} ey={846} mouthY={962} seed={4.1} period={3.4} eyeR={22} />
      {/* small round glasses */}
      {[480, 600].map((x, i) => <circle key={i} cx={x} cy={846} r={44} fill="none" stroke="#8a6440" strokeWidth={7} />)}
      <path d="M524 846 L 556 846" stroke="#8a6440" strokeWidth={6} />
      <ellipse cx={540} cy={904} rx={16} ry={13} fill={SK_SH} />
      {/* wooden spoon raised in her right hand */}
      <g transform={`rotate(${12 + 8 * Math.sin((f.spoon ?? 0) * 8)} 760 1240)`}>
        <Limb pts={[[720, 1150], [800, 1300], [800, 1140]]} w={78} color="#3a8f7a" />
        <rect x={792} y={880} width={22} height={260} rx={10} fill="#b98250" {...ink(5)} />
        <ellipse cx={803} cy={860} rx={40} ry={56} fill="#b98250" {...ink(6)} />
        <Hand x={800} y={1140} angle={180} color={SK} />
      </g>
    </g>
  );
};

/* ------------------------------------------------------------------ Seu Valdir (Tavinho's boss) */
export const Valdir: React.FC<Face> = (f) => {
  const SK = '#e7b48e', SK_SH = '#c98f68', SUIT = '#7a5434', SUIT_SH = '#5e3f25';
  return (
    <g transform={breathe(f.t, 2.4)}>
      {/* brown suit, white shirt, dark green tie */}
      <path d="M300 1660 C 290 1380 330 1140 430 1100 L 650 1100 C 750 1140 790 1380 780 1660 Z" fill={SUIT} {...ink(8)} />
      <path d="M690 1140 C 760 1200 780 1420 770 1660 L 720 1660 C 730 1420 720 1240 690 1140 Z" fill={SUIT_SH} />
      <path d="M470 1100 L 540 1260 L 610 1100 Z" fill="#ffffff" {...ink(6)} />
      <path d="M526 1120 L 554 1120 L 566 1250 L 540 1290 L 514 1250 Z" fill="#2f6b4f" {...ink(5)} />
      <path d="M430 1100 L 500 1300 L 470 1110 Z M650 1100 L 580 1300 L 610 1110 Z" fill={SUIT_SH} {...ink(5)} />
      <Limb pts={[[370, 1170], [320, 1360], [420, 1480]]} w={84} color={SUIT} />
      <Limb pts={[[710, 1170], [760, 1360], [660, 1480]]} w={84} color={SUIT} />
      <Hand x={420} y={1480} angle={-60} color={SK} flipThumb />
      <Hand x={660} y={1480} angle={60} color={SK} />
      <path d="M500 1020 L 500 1100 C 520 1112 560 1112 580 1100 L 580 1020 Z" fill={SK_SH} {...ink(6)} />
      {[366, 714].map((x, i) => <ellipse key={i} cx={x} cy={858} rx={28} ry={38} fill={SK} {...ink(7)} />)}
      {/* big bald head, a little shine, grey tufts over the ears */}
      <path data-qa="face" d="M372 830 C 372 680 450 630 540 630 C 630 630 708 680 708 830 C 708 950 650 1030 540 1030 C 430 1030 372 950 372 830 Z" fill={SK} {...ink(8)} />
      <ellipse cx={600} cy={690} rx={50} ry={22} fill="#ffffff" opacity={0.35} transform="rotate(-18 600 690)" />
      {[[380, -1], [700, 1]].map(([x, s], i) => <path key={i} d={`M${x} 760 q ${s * 30} 20 ${s * 4} 60 q ${s * 30} 10 ${s * 8} 50`} fill="#c9c9cf" stroke="#c9c9cf" strokeWidth={26} strokeLinecap="round" />)}
      {[430, 650].map((x, i) => <ellipse key={i} cx={x} cy={930} rx={34} ry={18} fill={BLUSH} opacity={0.35} />)}
      <Features {...f} ex={[480, 600]} ey={846} mouthY={985} seed={0.9} period={3.9} eyeR={24} />
      {/* bushy grey brows (on top of the thin ones) and a thick grey mustache */}
      {[[480, -1], [600, 1]].map(([x, s], i) => <path key={`b${i}`} d={`M${x - 42} ${f.mood === 'shock' ? 776 : 790} Q ${x} ${f.mood === 'shock' ? 750 : 770 + s * 0} ${x + 42} ${f.mood === 'shock' ? 776 : 792 - s * 8}`} fill="none" stroke="#bdbdc6" strokeWidth={22} strokeLinecap="round" />)}
      <ellipse cx={540} cy={910} rx={22} ry={18} fill={SK_SH} {...ink(5)} />
      <path d="M540 936 C 500 920 450 930 436 966 C 470 952 510 958 540 964 C 570 958 610 952 644 966 C 630 930 580 920 540 936 Z" fill="#bdbdc6" {...ink(6)} />
    </g>
  );
};
