import React, { createContext, useContext } from 'react';
import { INK, ink } from '../toon2d/Hook2D';
import { Hand, Limb } from '../toon2d/parts';

/**
 * A Vida do Tavinho: the cast, drawn in the house 2D style (ink outlines, flat colours, one shade).
 * Every character uses "body coords": the face is centred near (540, 840), feet at y 2020.
 * Place one with <g transform={place(x, feetY, scale)}> from toon2d/parts.
 * Original designs only (see tavinho/BIBLIA.md: no cap, no broken tooth, no running tee, no stubble).
 */
export const PAL = { navy: '#1c2340', cream: '#fff4e0', orange: '#ff7a2e', mint: '#3ddc97' };
const SKIN = '#f1bf94', SKIN_SH = '#d99d70', BLUSH = '#ff8f86';

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
};

/** Each character blinks on its own period (s), so blinks never sync; none in the first 1.4 s (thumbnail). */
const blinkAt = (t: number, period: number, phase: number) => t > 1.4 && (t + phase) % period < 0.13;
/** Idle breathing for the seated/standing extras: a tiny vertical stretch from the waist. */
const breathe = (t: number, phase: number) => `translate(540 1660) scale(1 ${1 + 0.008 * Math.sin(t * 2.1 + phase)}) translate(-540 -1660)`;

/** Shared eyes + brows + mouth, drawn around eye centres ex1/ex2 at y ey. */
const Features: React.FC<Face & { ex: [number, number]; ey: number; mouthY: number; seed: number; period: number; lips?: string; eyeR?: number }> = ({ t, mood = 'neutral', talk = 0, look = [0, 0], ex, ey, mouthY, seed, period, lips, eyeR = 34 }) => {
  const blink = blinkAt(t, period, seed);
  const wide = mood === 'shock' ? 1 : 0;
  const happyEyes = mood === 'proud' || mood === 'happy';
  const browUp = mood === 'shock' ? 22 : mood === 'proud' ? 10 : 0;
  const worried = mood === 'worried' || mood === 'gulp' ? 1 : 0;
  return (
    <g>
      {ex.map((x, i) => (
        <g key={i}>
          {happyEyes || blink
            ? <path d={`M${x - 26} ${ey + 4} Q ${x} ${happyEyes ? ey - 22 : ey + 6} ${x + 26} ${ey + 4}`} fill="none" {...ink(9)} />
            : (
              <g>
                <ellipse cx={x} cy={ey} rx={eyeR * (1 + 0.2 * wide)} ry={(eyeR + 6) * (1 + 0.2 * wide)} fill="#ffffff" {...ink(6)} />
                <circle cx={x + 4 + look[0]} cy={ey + 4 + look[1]} r={mood === 'shock' ? 11 : 15} fill={INK} />
                <circle cx={x + 10 + look[0]} cy={ey - 4 + look[1]} r={5} fill="#ffffff" />
              </g>
            )}
          {/* brows: worried = inner ends up */}
          <path d={i === 0
            ? `M${x - 34} ${ey - 52 - browUp + 10 * worried} L ${x + 30} ${ey - 56 - browUp - 12 * worried}`
            : `M${x - 30} ${ey - 56 - browUp - 12 * worried} L ${x + 34} ${ey - 52 - browUp + 10 * worried}`} fill="none" stroke="#3a2416" strokeWidth={13} strokeLinecap="round" />
        </g>
      ))}
      {/* mouth */}
      {(() => {
        const mx = (ex[0] + ex[1]) / 2;
        if (talk > 0.05) return <ellipse cx={mx} cy={mouthY + 6} rx={26 + 8 * talk} ry={8 + 22 * talk} fill="#5a1f1a" stroke={lips ?? INK} strokeWidth={lips ? 9 : 7} />;
        switch (mood) {
          case 'shock': return <ellipse cx={mx} cy={mouthY + 8} rx={24} ry={30} fill="#5a1f1a" {...ink(7)} />;
          case 'proud': case 'happy': return <path d={`M${mx - 54} ${mouthY - 6} Q ${mx} ${mouthY + 54} ${mx + 54} ${mouthY - 6} Z`} fill="#5a1f1a" stroke={lips ?? INK} strokeWidth={lips ? 9 : 7} strokeLinejoin="round" />;
          case 'worried': return <path d={`M${mx - 40} ${mouthY + 8} q 13 -14 27 0 q 13 14 27 0 q 13 -14 27 0`} fill="none" stroke={lips ?? INK} strokeWidth={8} strokeLinecap="round" />;
          case 'gulp': return <path d={`M${mx - 26} ${mouthY + 4} L ${mx + 26} ${mouthY + 4}`} fill="none" stroke={lips ?? INK} strokeWidth={9} strokeLinecap="round" />;
          default: return <path d={`M${mx - 36} ${mouthY} Q ${mx} ${mouthY + 24} ${mx + 36} ${mouthY}`} fill="none" stroke={lips ?? INK} strokeWidth={lips ? 10 : 8} strokeLinecap="round" />;
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
      return <path key={i} transform={`translate(${x} ${y}) rotate(${side * 20})`} d="M0 -26 C 14 -6 17 7 0 14 C -17 7 -14 -6 0 -26 Z" fill="#8fd0ff" opacity={1 - ph * 0.6} {...ink(4)} />;
    })}
  </g>
);

/* ------------------------------------------------------------------ Tavinho */
export const TavinhoHead: React.FC<Face> = (props) => {
  const act = useContext(Act);
  const f = { ...props, mood: act.mood ?? props.mood };
  const slip = f.slip ?? 0;
  const ey = 852;
  // head bob on stressed words (a quick nod down + tilt), plus a slow idle sway
  const nod = 22 * act.bob, tilt = 3 * act.bob + 1.2 * Math.sin(f.t * 1.3);
  return (
    <g transform={`translate(0 ${nod + 3 * Math.sin(f.t * 2.2 + 1)}) rotate(${tilt} 540 1000)`}>
      {/* ears */}
      {[352, 728].map((x, i) => <ellipse key={i} cx={x} cy={858} rx={30} ry={40} fill={SKIN} {...ink(7)} />)}
      {/* round, chubby face with soft jowls */}
      <path data-qa="face" d="M362 820 C 362 690 450 640 540 640 C 630 640 718 690 718 820 C 718 930 670 1030 540 1030 C 410 1030 362 930 362 820 Z" fill={SKIN} {...ink(8)} />
      <path d="M650 680 C 700 720 716 790 712 850 C 706 940 664 1000 600 1022 C 650 970 676 905 680 840 C 684 770 672 715 650 680 Z" fill={SKIN_SH} opacity={0.8} />
      {/* neat short brown hair + the rebel curl on the forehead */}
      <path d="M362 800 C 350 680 430 610 540 606 C 650 602 728 668 718 800 C 700 740 650 712 600 712 C 560 712 520 720 480 712 C 430 704 380 730 362 800 Z" fill="#5a3a24" {...ink(8)} />
      <path d="M548 712 C 520 690 520 650 552 646 C 584 642 590 680 566 690 C 548 698 540 680 552 672" fill="none" stroke="#5a3a24" strokeWidth={16} strokeLinecap="round" />
      <path d="M548 712 C 520 690 520 650 552 646 C 584 642 590 680 566 690 C 548 698 540 680 552 672" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
      {/* rosy cheeks */}
      {[420, 660].map((x, i) => <ellipse key={i} cx={x} cy={930} rx={42} ry={24} fill={BLUSH} opacity={0.55} />)}
      <Features {...f} ex={[470, 612]} ey={ey + 4 * slip} mouthY={965} seed={0.3} period={3.1} eyeR={30} />
      {/* small round nose */}
      <ellipse cx={541} cy={905} rx={20} ry={16} fill={SKIN_SH} {...ink(5)} />
      {/* huge round glasses, sliding down the nose */}
      <g transform={`translate(0 ${50 * slip})`}>
        {[470, 612].map((x, i) => <circle key={i} cx={x} cy={ey} r={64} fill="rgba(200,230,255,0.18)" stroke={INK} strokeWidth={11} />)}
        <path d="M534 848 Q 541 836 548 848" fill="none" stroke={INK} strokeWidth={10} />
        {[470, 612].map((x, i) => <path key={i} d={`M${x - 30} ${ey - 34} l 18 -8`} stroke="#ffffff" strokeWidth={7} strokeLinecap="round" opacity={0.85} />)}
      </g>
      <Sweat t={f.t} n={f.sweat ?? 0} cx={540} cy={760} r={190} />
    </g>
  );
};

/** Tavinho standing: short, round, tight light-blue shirt, crooked red tie. */
export const Tavinho: React.FC<Face & { armL?: number[][]; armR?: number[][]; holdR?: React.ReactNode; holdL?: React.ReactNode; puff?: number }> = (f) => {
  const SHIRT = '#a9d2f5', SHIRT_SH = '#7fb2df';
  const breathe = 5 * Math.sin(f.t * 2.2) + 14 * (f.puff ?? 0);
  const armL = f.armL ?? [[360, 1150], [250, 1340], [270, 1500]];
  const armR = f.armR ?? [[720, 1150], [830, 1340], [810, 1500]];
  const hL = armL[armL.length - 1], hR = armR[armR.length - 1];
  return (
    <g>
      {/* soft contact shadow so he stands on the floor */}
      <ellipse cx={540} cy={2016} rx={230} ry={26} fill="#000" opacity={0.22} />
      {/* short legs + brown shoes */}
      <path d="M405 1760 L 530 1760 L 526 1965 L 412 1965 Z" fill="#2c3550" {...ink(8)} />
      <path d="M550 1760 L 675 1760 L 668 1965 L 554 1965 Z" fill="#2c3550" {...ink(8)} />
      {[[458, -1], [622, 1]].map(([x, s], i) => <path key={i} d={`M${x - 66 + (s as number) * 6} 2016 C ${x - 70} 1975 ${x - 40} 1955 ${x} 1955 C ${x + 40} 1955 ${x + 70} 1975 ${x + 66 + (s as number) * 6} 2016 Z`} fill="#6b3f22" {...ink(7)} />)}
      <g transform={`translate(0 ${-breathe * 0.3}) scale(1 1)`}>
        {/* round belly in a shirt that's too tight */}
        <path d={`M330 1780 C 200 1640 210 1200 400 1100 L 680 1100 C 870 1200 ${880 + breathe} 1640 750 1780 Z`} fill={SHIRT} {...ink(8)} />
        <path d={`M700 1130 C 830 1220 ${850 + breathe} 1600 740 1770 L 690 1770 C 760 1600 760 1260 700 1130 Z`} fill={SHIRT_SH} />
        {/* strained buttons: little pull lines */}
        {[1250, 1380, 1510, 1640].map((y, i) => (
          <g key={i}>
            <circle cx={548} cy={y} r={11} fill="#ffffff" {...ink(4)} />
            {i > 0 && i < 3 && [[-1], [1]].map(([s]) => <path key={s} d={`M${548 + s * 18} ${y} q ${s * 24} -10 ${s * 46} -4`} fill="none" stroke={SHIRT_SH} strokeWidth={5} strokeLinecap="round" />)}
          </g>
        ))}
        <path d="M340 1770 C 450 1800 630 1800 740 1770" fill="none" {...ink(6)} />
        {/* collar + crooked red tie */}
        <path d="M455 1095 L 520 1160 L 540 1100 Z M625 1095 L 560 1160 L 540 1100 Z" fill="#ffffff" {...ink(6)} />
        <g transform="rotate(14 540 1120)">
          <path d="M522 1110 L 558 1110 L 552 1140 L 528 1140 Z" fill="#e2453c" {...ink(5)} />
          <path d="M528 1140 L 552 1140 L 572 1330 L 540 1370 L 508 1330 Z" fill="#e2453c" {...ink(6)} />
          <path d="M534 1180 L 556 1200 M 530 1240 L 560 1262" stroke="#b5302a" strokeWidth={6} />
        </g>
        {/* neck */}
        <path d="M500 1020 L 500 1100 C 520 1112 560 1112 580 1100 L 580 1020 Z" fill={SKIN_SH} {...ink(6)} />
        {/* arms (short sleeves rolled? no: long shirt sleeves) */}
        <Limb pts={armL} w={84} color={SHIRT} />
        <Limb pts={armR} w={84} color={SHIRT} />
        {f.holdL && <g transform={`translate(${hL[0]} ${hL[1]})`}>{f.holdL}</g>}
        {f.holdR && <g transform={`translate(${hR[0]} ${hR[1]})`}>{f.holdR}</g>}
        <Hand x={hL[0]} y={hL[1]} angle={(Math.atan2(hL[0] - armL[1][0], hL[1] - armL[1][1]) * -180) / Math.PI} color={SKIN} flipThumb r={40} />
        <Hand x={hR[0]} y={hR[1]} angle={(Math.atan2(hR[0] - armR[1][0], hR[1] - armR[1][1]) * -180) / Math.PI} color={SKIN} r={40} />
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
