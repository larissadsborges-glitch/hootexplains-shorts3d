import React, { createContext, useContext } from 'react';
import { clamp01, easeOutBack, easeOutCubic, lerp } from '../lib/anim';

/**
 * 2D flat-cartoon test of the money EP1 hook shot (1080×1920 canvas units).
 * Style: thick dark ink outlines, flat colours with one cel-shadow tone per part, exaggerated
 * proportions (big head, expressive face), story details in the room.
 * Characters are the page's own: Jake (red hoodie) and Hoot (brown owl, navy round glasses, teal bow tie, pencil).
 */
export const INK = '#1b1420';
export const ink = (w = 7) => ({ stroke: INK, strokeWidth: w, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const });

export const SKIN = '#f3c29b', SKIN_SH = '#dc9f78', HAIR = '#4a2c1a', HAIR_HI = '#6b4127';
export const HOODIE = '#e2553c', HOODIE_SH = '#b9402b', HOODIE_HI = '#f07a5f';

/* ---------------------------------------------------------------- room */
export const Room: React.FC<{ t: number }> = ({ t }) => (
  <g>
    {/* wall with soft vertical stripes */}
    <rect x={0} y={0} width={1080} height={1400} fill="#c7d3ea" />
    {Array.from({ length: 14 }, (_, i) => <rect key={i} x={i * 80 + 20} y={0} width={34} height={1400} fill="#bcc9e3" />)}
    {/* window with day sky, clouds and a little skyline */}
    <g>
      <rect x={60} y={300} width={330} height={420} rx={10} fill="#8fd0ff" {...ink(8)} />
      {[[150, 380, 1], [300, 450, 0.8]].map(([x, y, s], i) => (
        <g key={i} transform={`translate(${x + 10 * Math.sin(t * 0.3 + i)} ${y}) scale(${s})`}>
          <ellipse cx={0} cy={0} rx={55} ry={24} fill="#ffffff" />
          <ellipse cx={-30} cy={-14} rx={30} ry={22} fill="#ffffff" />
          <ellipse cx={22} cy={-18} rx={34} ry={26} fill="#ffffff" />
        </g>
      ))}
      <path d="M64 716 L64 600 L110 600 L110 560 L160 560 L160 620 L210 620 L210 540 L265 540 L265 610 L310 610 L310 580 L386 580 L386 716 Z" fill="#6f86b8" />
      <path d="M64 716 L64 650 L130 650 L130 630 L190 630 L190 670 L250 670 L250 640 L330 640 L330 660 L386 660 L386 716 Z" fill="#5a6fa0" />
      <rect x={60} y={300} width={330} height={420} rx={10} fill="none" {...ink(8)} />
      <path d="M225 300 L225 720 M60 510 L390 510" {...ink(14)} stroke="#f7f3ea" />
      <path d="M225 300 L225 720 M60 510 L390 510" fill="none" {...ink(4)} />
      <rect x={40} y={705} width={370} height={34} rx={8} fill="#f7f3ea" {...ink(6)} />
      {/* curtain */}
      <path d="M20 270 C 70 400 30 560 60 760 L 0 760 L 0 270 Z" fill="#21b3a0" {...ink(6)} />
      <rect x={0} y={256} width={430} height={22} rx={10} fill="#8a5a3a" {...ink(6)} />
    </g>
    {/* shelf with a plant and books */}
    <rect x={720} y={760} width={320} height={22} rx={6} fill="#8a5a3a" {...ink(6)} />
    {[['#e2453c', 760, 70], ['#f0b429', 795, 85], ['#2f6fd6', 832, 62]].map(([c, x, h], i) => <rect key={i} x={x as number} y={760 - (h as number)} width={32} height={h as number} rx={4} fill={c as string} {...ink(5)} />)}
    <path d="M960 760 L 945 700 L 1015 700 L 1000 760 Z" fill="#c4693a" {...ink(5)} />
    {[[-28, -60], [0, -80], [26, -58]].map(([dx, dy], i) => <path key={i} d={`M980 700 Q ${980 + dx * 0.4} ${700 + dy * 0.5} ${980 + dx} ${700 + dy}`} fill="none" stroke="#2fa84f" strokeWidth={14} strokeLinecap="round" />)}
  </g>
);

/**
 * Jake's head, drawn around (540, 820) in canvas units (face ≈ 340 wide). Reuse it anywhere with a transform.
 *  brows -1..1 (worried..surprised), smile -1..1 (frown..grin), sway = small head tilt, look = pupils shift [x, y].
 */
export const JakeHead: React.FC<{ t: number; brows?: number; smile?: number; sway?: number; look?: [number, number]; sad?: number; wide?: number; gasp?: number; grit?: number }> = ({ t, brows = 0, smile = 0.4, sway = 0, look = [0, 0], sad = 0, wide = 0, gasp = 0, grit = 0 }) => {
  const blink = t > 1.5 && Math.sin(t * 1.7 + 0.4) > 0.995 ? 1 : 0;
  return (
    <>
        <g transform={`rotate(${-2 + sway * 0.3} 540 990)`}>
          {/* ears */}
          {[372, 708].map((x, i) => <g key={i}><ellipse cx={x} cy={845} rx={30} ry={40} fill={SKIN} {...ink(7)} /><path d={`M${x + (i ? -6 : 6)} 828 Q ${x + (i ? 8 : -8)} 845 ${x + (i ? -4 : 4)} 865`} fill="none" {...ink(5)} stroke={SKIN_SH} /></g>)}
          {/* face: a soft, slightly square cartoon shape */}
          <path d="M378 820 C 372 680 450 625 540 625 C 640 625 712 680 704 820 C 700 930 650 1015 540 1015 C 432 1015 384 930 378 820 Z" fill={SKIN} {...ink(8)} />
          <path d="M640 660 C 690 700 708 780 700 840 C 692 930 650 990 590 1008 C 640 960 668 900 672 830 C 676 760 664 700 640 660 Z" fill={SKIN_SH} opacity={0.85} />
          {/* hair: messy, spiky top with a fringe */}
          <path d="M366 820 C 350 700 390 610 470 588 C 540 568 640 580 690 630 C 730 670 728 760 712 815 L 690 760 L 672 712 L 640 745 L 612 690 L 575 735 L 540 680 L 500 735 L 468 690 L 440 750 L 410 712 L 392 780 Z" fill={HAIR} {...ink(8)} />
          <path d="M450 600 L 430 548 L 490 585 L 500 540 L 545 580 L 575 535 L 590 585 L 640 560 L 625 605" fill={HAIR} {...ink(7)} />
          <path d="M470 610 C 520 596 590 598 640 625" fill="none" stroke={HAIR_HI} strokeWidth={10} strokeLinecap="round" />
          {/* eyebrows */}
          {[[470, -1], [612, 1]].map(([x, s], i) => (
            <path key={i} d={`M${x - 42} ${778 - 16 * Math.max(0, brows) + s * 4 - (s as number) * 18 * Math.max(0, -brows)} Q ${x} ${758 - 24 * Math.max(0, brows) - 4 * Math.max(0, -brows)} ${x + 42} ${778 - 16 * Math.max(0, brows) - s * 4 + (s as number) * 18 * Math.max(0, -brows)}`} fill="none" stroke={HAIR} strokeWidth={15} strokeLinecap="round" />
          ))}
          {/* eyes */}
          {[470, 612].map((x, i) => (
            <g key={i}>
              <ellipse cx={x} cy={838} rx={40 + 6 * wide} ry={47 + 10 * wide} fill="#ffffff" {...ink(6)} />
              <circle cx={x + 6 + look[0]} cy={846 + look[1]} r={20} fill="#5a3a22" />
              <circle cx={x + 6 + look[0]} cy={846 + look[1]} r={11} fill={INK} />
              <circle cx={x + 13 + look[0]} cy={837 + look[1]} r={6} fill="#ffffff" />
              {blink > 0 && <path d={`M${x - 42} 838 Q ${x} 870 ${x + 42} 838 L ${x + 42} 790 L ${x - 42} 790 Z`} fill={SKIN} {...ink(6)} />}
            </g>
          ))}
          {/* nose */}
          <path d="M548 870 C 570 890 566 912 540 914" fill="none" {...ink(6)} />
          {/* mouth: a half-smile that can turn into a frown (sad) */}
          {grit > 0.3 && [470, 612].map((x, i) => <path key={i} d={`M${x - 44} 836 Q ${x} ${818} ${x + 44} 836 L ${x + 44} 790 L ${x - 44} 790 Z`} fill={SKIN} {...ink(6)} />)}
          {grit > 0.3
            ? <g><rect x={492} y={938} width={106} height={42} rx={14} fill="#ffffff" {...ink(7)} /><path d="M494 959 L 596 959 M 518 940 L 518 978 M 545 940 L 545 978 M 572 940 L 572 978" fill="none" {...ink(4)} /></g>
            : gasp > 0.3
            ? <ellipse cx={545} cy={962} rx={22 + 6 * gasp} ry={14 + 22 * gasp} fill="#5a1f1a" {...ink(7)} />
            : sad > 0.3
            ? <path d={`M492 ${968} Q 545 ${930 - 10 * sad} 598 ${968}`} fill="none" {...ink(8)} />
            : <><path d={`M488 ${952 - 6 * smile} Q 545 ${975 + 10 * smile} 602 ${940 - 14 * smile}`} fill="none" {...ink(8)} />
              <path d={`M602 ${940 - 14 * smile} l 12 -8`} fill="none" {...ink(6)} /></>}
          {/* cheeks */}
          {[440, 640].map((x, i) => <ellipse key={i} cx={x} cy={918} rx={30} ry={16} fill="#f08f86" opacity={0.45} />)}
        </g>

    </>
  );
};

/* ---------------------------------------------------------------- Jake (sitting, waist up) */
export const Jake2D: React.FC<{ t: number; brows: number; flip: number; smile: number; wide?: number; gasp?: number; sad?: number; look?: [number, number]; jacket?: { main: string; shade: string }; noChair?: boolean }> = ({ t, brows, flip, smile, wide = 0, gasp = 0, sad = 0, look = [0, 0], jacket, noChair }) => {
  const TOP = jacket?.main ?? HOODIE, TOP_SH = jacket?.shade ?? HOODIE_SH;
  const breathe = 3 * Math.sin(t * 2.1);
  const sway = 3 * Math.sin(t * 1.3);
  return (
    <g>
      {/* chair back */}
      {!noChair && <rect x={300} y={930} width={480} height={460} rx={60} fill="#3b4a63" {...ink(8)} />}
      {!noChair && <rect x={330} y={960} width={420} height={60} rx={30} fill="#4b5d7c" />}
      <g transform={`translate(0 ${breathe})`}>
        {/* hood behind the neck */}
        {!jacket && <path d="M410 1075 C 420 1010 660 1010 670 1075 Z" fill={HOODIE_SH} {...ink(7)} />}
        {/* torso */}
        <path d="M300 1400 C 295 1230 330 1110 420 1075 L 660 1075 C 750 1110 785 1230 780 1400 Z" fill={TOP} {...ink(8)} />
        <path d="M690 1100 C 750 1140 775 1250 772 1400 L 700 1400 C 712 1260 705 1170 690 1100 Z" fill={TOP_SH} />
        {!jacket && <path d="M340 1170 C 350 1130 380 1100 410 1090" fill="none" stroke={HOODIE_HI} strokeWidth={10} strokeLinecap="round" />}
        {jacket && <g>
          <path d="M488 1080 L 592 1080 L 600 1400 L 480 1400 Z" fill="#f7f5f0" {...ink(6)} />
          <path d="M486 1086 L 478 1400 M 594 1086 L 602 1400" fill="none" stroke={TOP_SH} strokeWidth={8} />
          <path d="M420 1075 L 488 1078 L 470 1160 Z M 660 1075 L 592 1078 L 610 1160 Z" fill={TOP_SH} {...ink(6)} />
        </g>}
        {/* neck */}
        <path d="M500 1000 L 500 1080 C 520 1095 560 1095 580 1080 L 580 1000 Z" fill={SKIN_SH} {...ink(6)} />
        {/* collar + drawstrings */}
        <path d="M455 1078 C 490 1118 590 1118 625 1078" fill="none" {...ink(7)} />
        {!jacket && [510, 570].map((x, i) => <g key={i}><path d={`M${x} 1105 L ${x + (i ? 4 : -4)} 1185`} fill="none" stroke="#f4f1e6" strokeWidth={8} strokeLinecap="round" /><circle cx={x + (i ? 4 : -4)} cy={1190} r={8} fill="#f4f1e6" {...ink(4)} /></g>)}
        {/* pocket seam */}
        {!jacket && <path d="M420 1330 C 470 1300 610 1300 660 1330" fill="none" {...ink(6)} stroke={HOODIE_SH} />}

        <JakeHead t={t} brows={brows} smile={smile} sway={sway} wide={wide} gasp={gasp} sad={sad} look={look} />

        {/* ---- both arms come up to present the note at chest height (hands are drawn with the note) */}
        {[[[410, 1110], [312, 1270], [400, 1135]], [[670, 1110], [768, 1270], [680, 1135]]].map((pts, i) => {
          const d = `M${pts.map((p) => p.join(' ')).join(' L ')}`;
          return (
            <g key={i}>
              <path d={d} fill="none" stroke={INK} strokeWidth={92} strokeLinecap="round" strokeLinejoin="round" />
              <path d={d} fill="none" stroke={TOP} strokeWidth={76} strokeLinecap="round" strokeLinejoin="round" />
              <path d={`M${pts[1][0] + (i ? 16 : -16)} ${pts[1][1] - 10} L ${pts[2][0] + (i ? 14 : -14)} ${pts[2][1] + 40}`} fill="none" stroke={TOP_SH} strokeWidth={16} strokeLinecap="round" />
            </g>
          );
        })}
      </g>
    </g>
  );
};

/** The cartoon "20" note (not the real design), held by both hands, with a big red "COST 7¢" sticker. flip 0..1 turns it over. */
const Note2D: React.FC<{ t: number; flip: number; breathe: number; q: number; stamp?: number; pulse?: number }> = ({ t, flip, breathe, q, stamp = 0, pulse = 0 }) => {
  const sx = Math.cos(Math.PI * flip);
  const back = sx < 0;
  const F = 'Montserrat, Arial Black, sans-serif';
  const wob = 1.2 * Math.sin(t * 1.3);
  return (
    <g transform={`translate(0 ${breathe})`}>
      <g transform={`translate(540 1030) rotate(${-3 + wob}) scale(${Math.max(0.04, Math.abs(sx))} 1)`}>
        <rect x={-190} y={-80} width={380} height={160} rx={8} fill={back ? '#8fc79a' : '#a8d8a8'} {...ink(8)} />
        <rect x={-172} y={-62} width={344} height={124} rx={5} fill="none" stroke="#2f6b45" strokeWidth={5} />
        {!back && <>
          <text x={-128} y={-14} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={50} fill="#1f5236">20</text>
          <text x={96} y={50} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={50} fill="#1f5236">20</text>
          <ellipse cx={0} cy={0} rx={54} ry={56} fill="#e7f4e4" stroke="#2f6b45" strokeWidth={6} />
          <ellipse cx={0} cy={12} rx={24} ry={29} fill="#2f6b45" />
          <ellipse cx={0} cy={-17} rx={22} ry={18} fill="#2f6b45" />
          <path d="M-19 -27 L -14 -44 L -7 -31 M19 -27 L 14 -44 L 7 -31" fill="#2f6b45" stroke="#2f6b45" strokeWidth={5} />
          {[-1, 1].map((k) => <circle key={k} cx={k * 9} cy={-18} r={5} fill="#e7f4e4" />)}
        </>}
        {back && <>
          <text x={0} y={-6} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={34} fill="#1f5236">IN TRUST</text>
          <text x={0} y={38} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={34} fill="#1f5236">WE TRADE</text>
        </>}
      </g>
      {stamp > 0 && (
        <g transform={`translate(540 1030) rotate(-12) scale(${lerp(1.8, 1, easeOutBack(clamp01(stamp)))})`} opacity={clamp01(stamp * 3)}>
          <rect x={-150} y={-46} width={300} height={92} rx={10} fill="rgba(255,255,255,0.35)" stroke="#d6281c" strokeWidth={10} />
          <text x={0} y={-6} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={42} fill="#d6281c">LEGAL</text>
          <text x={0} y={34} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={42} fill="#d6281c">TENDER</text>
        </g>
      )}
      {/* hands: fingers wrap over the front of the note at both ends */}
      {[[372, 1055, 1], [708, 1055, -1]].map(([x, y, s], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <ellipse cx={0} cy={6} rx={40} ry={44} fill={SKIN} {...ink(7)} />
          {[-20, 0, 20].map((dy, k) => <path key={k} d={`M${-(s as number) * 6} ${dy - 8} q ${(s as number) * 34} 2 ${(s as number) * 36} 14`} fill="none" {...ink(5)} />)}
          <path d={`M${-(s as number) * 30} -24 q ${(s as number) * 20} -24 ${(s as number) * 40} -10`} fill={SKIN} {...ink(5)} />
        </g>
      ))}
      {/* price sticker on the top-right corner, big enough to read in the thumbnail */}
      <g transform={`rotate(${10 + 2 * Math.sin(t * 2.3)} 690 950) translate(690 950) scale(${1 + 0.25 * pulse}) translate(-690 -950)`}>
        <path d="M620 900 L 760 900 L 780 950 L 760 1000 L 620 1000 Z" fill="#e2453c" {...ink(7)} />
        <circle cx={760} cy={950} r={8} fill="#ffffff" {...ink(3)} />
        <text x={685} y={937} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={30} fill="#ffffff">COST</text>
        <text x={685} y={989} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={50} fill="#ffffff">7¢</text>
      </g>
      {/* "?" pops on "worth" */}
      {q > 0 && (
        <g transform={`translate(738 812) scale(${q}) rotate(12)`}>
          <text x={0} y={0} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={170} fill="#ffd21f" stroke={INK} strokeWidth={10} paintOrder="stroke">?</text>
        </g>
      )}
    </g>
  );
};

/* ---------------------------------------------------------------- Hoot (on a stack of books) */
/**
 * Hoot's gesture for the current frame, set once per video (Look2D):
 *  raise 0 = wings resting, 1 = pencil raised to point (used only on key words); cheer = both wings up.
 * Without a provider (profile picture, tests) Hoot keeps the pencil raised.
 */
export const HootGesture = createContext<{ raise: number; cheer: boolean; wink?: boolean } | null>(null);

export const Hoot2D: React.FC<{ t: number; talk: number; x: number; y: number; s?: number; wink?: boolean; wingsUp?: boolean }> = ({ t, talk, x, y, s = 1, wink = false, wingsUp = false }) => {
  const blink = t > 1.5 && Math.sin(t * 1.3 + 1.1) > 0.995 ? 1 : 0;
  const bob = 3 * Math.sin(t * 2.4);
  // ease the beak so small voice wobbles don't make it flicker, and big syllables open it fully
  // owner's pick: never wider than half open (the lower beak stays tucked under the upper one)
  const open = 0.5 * clamp01((talk - 0.08) / 0.8) ** 0.8;
  const g = useContext(HootGesture);
  const raise = g ? g.raise : 1;
  const cheer = wingsUp || (g?.cheer ?? false);
  const winkNow = wink || (g?.wink ?? false);
  const pencil = 8 * Math.sin(t * 2) * raise;
  return (
    <g transform={`translate(${x} ${y + bob}) scale(${s})`}>
      {/* feet (owner: make them visible): two orange three-toed feet in front of the body, toes gripping the perch edge */}
      {[-36, 36].map((dx, i) => (
        <g key={`f${i}`}>
          {[-15, 0, 15].map((k) => <ellipse key={k} cx={dx + k} cy={2 - (k === 0 ? 2 : 0)} rx={10} ry={15} fill="#f0a020" {...ink(5)} />)}
          <path d={`M${dx - 20} -6 Q ${dx} -16 ${dx + 20} -6`} fill="none" stroke="#c77d10" strokeWidth={4} strokeLinecap="round" />
        </g>
      ))}
      {/* body */}
      <path d="M0 -300 C 95 -300 120 -210 118 -130 C 116 -40 70 0 0 0 C -70 0 -116 -40 -118 -130 C -120 -210 -95 -300 0 -300 Z" fill="#8a5a3a" {...ink(8)} />
      <path d="M60 -270 C 110 -230 120 -150 110 -90 C 100 -40 70 -10 30 -2 C 80 -40 98 -120 60 -270 Z" fill="#6f4529" />
      {/* belly with feather marks */}
      <path d="M0 -175 C 62 -175 78 -110 74 -70 C 70 -25 40 -10 0 -10 C -40 -10 -70 -25 -74 -70 C -78 -110 -62 -175 0 -175 Z" fill="#f4e6c8" {...ink(6)} />
      {[[-28, -120], [10, -128], [-12, -90], [26, -94], [-30, -60], [8, -58]].map(([fx, fy], i) => <path key={i} d={`M${fx - 9} ${fy} q 9 10 18 0`} fill="none" stroke="#c9b28a" strokeWidth={5} strokeLinecap="round" />)}
      {/* ear tufts */}
      <path d="M-78 -268 L -100 -340 L -42 -292 Z" fill="#8a5a3a" {...ink(7)} />
      <path d="M78 -268 L 100 -340 L 42 -292 Z" fill="#8a5a3a" {...ink(7)} />
      {/* face disc */}
      <path d="M0 -262 C 70 -262 104 -232 104 -196 C 104 -158 70 -140 0 -150 C -70 -140 -104 -158 -104 -196 C -104 -232 -70 -262 0 -262 Z" fill="#c8915e" />
      {/* eyes behind navy round glasses */}
      {[-46, 46].map((ex, i) => (
        <g key={i}>
          <circle cx={ex} cy={-202} r={40} fill="#ffffff" {...ink(5)} />
          <circle cx={ex + 4} cy={-198} r={18} fill={INK} />
          <circle cx={ex + 10} cy={-206} r={6} fill="#ffffff" />
          {blink > 0 && <path d={`M${ex - 40} -202 a 40 40 0 0 1 80 0 Z`} fill="#c8915e" {...ink(5)} />}
          {winkNow && i === 1 && <><circle cx={ex} cy={-202} r={41} fill="#c8915e" /><path d={`M${ex - 26} -196 Q ${ex} -226 ${ex + 26} -196`} fill="none" {...ink(9)} /></>}
          <circle cx={ex} cy={-202} r={44} fill="none" stroke="#1f2f5a" strokeWidth={10} />
        </g>
      ))}
      <path d="M-4 -206 Q 0 -216 4 -206" fill="none" stroke="#1f2f5a" strokeWidth={9} />
      {/* ONE beak. The lower half hinges down with the voice and shows a dark mouth with a tongue;
          the rounded, glossy upper half sits on top and never moves. */}
      {open > 0.04 && (
        <g>
          <path d={`M-19 -158 C -19 ${-150 + 10 * open} 19 ${-150 + 10 * open} 19 -158 L 17 ${-146 + 24 * open} C 10 ${-140 + 28 * open} -10 ${-140 + 28 * open} -17 ${-146 + 24 * open} Z`} fill="#4a1414" {...ink(4)} />
          <ellipse cx={0} cy={-145 + 24 * open} rx={10} ry={4 + 3 * open} fill="#e2788a" />
        </g>
      )}
      <g transform={`translate(0 ${24 * open}) rotate(${0}) scale(1 ${1 - 0.12 * open})`}>
        <path d="M-17 -156 C -17 -146 -8 -132 0 -130 C 8 -132 17 -146 17 -156 C 8 -150 -8 -150 -17 -156 Z" fill="#d9861a" {...ink(5)} />
      </g>
      <path d="M-30 -178 C -30 -190 30 -190 30 -178 C 30 -162 14 -146 0 -138 C -14 -146 -30 -162 -30 -178 Z" fill="#f5a623" {...ink(5)} />
      <path d="M-18 -178 C -14 -184 -2 -185 6 -182" fill="none" stroke="#ffd98a" strokeWidth={6} strokeLinecap="round" />
      <path d="M-2 -150 C 0 -146 2 -146 3 -150" fill="none" stroke="#c46f10" strokeWidth={3} strokeLinecap="round" />
      {/* teal bow tie */}
      <path d="M0 -88 L -40 -106 L -40 -70 Z M0 -88 L 40 -106 L 40 -70 Z" fill="#21b3a0" {...ink(5)} />
      <circle cx={0} cy={-88} r={10} fill="#1a8f80" {...ink(4)} />
      {/* wings: left resting (or both raised in a cheer), right raised with the pencil */}
      {cheer
        ? <path d="M-108 -170 C -160 -200 -190 -250 -175 -280 C -150 -270 -120 -230 -104 -190 Z" fill="#6f4529" {...ink(7)} />
        : <path d="M-110 -170 C -150 -120 -140 -60 -100 -40 C -96 -90 -96 -130 -110 -170 Z" fill="#6f4529" {...ink(7)} />}
      <g transform={`rotate(${(cheer ? -20 : 28 + 90 * (1 - raise)) + pencil} 110 -170)`}>
        <path d="M110 -170 C 160 -200 190 -250 175 -280 C 150 -270 120 -230 104 -190 Z" fill="#6f4529" {...ink(7)} />
        <g transform="translate(175 -285) rotate(-35)">
          <rect x={-10} y={-80} width={20} height={80} fill="#ffd21f" {...ink(4)} />
          <rect x={-10} y={-92} width={20} height={14} fill="#f08f86" {...ink(4)} />
          <path d="M-10 0 L 10 0 L 0 22 Z" fill="#f3d2a8" {...ink(4)} />
          <path d="M-3 15 L 3 15 L 0 22 Z" fill={INK} />
        </g>
      </g>
    </g>
  );
};

/** The full hook shot. worth = time of the word "worth" (the note flips). */
export const Hook2D: React.FC<{ t: number; talk: number; worth: number; cents: number; stamp?: number; pulse?: number; nod?: number }> = ({ t, talk, worth, cents, stamp = 0, pulse = 0, nod = 0 }) => {
  const flip = easeOutBack(clamp01((t - worth - 0.1) / 0.45)) * (1 - easeOutCubic(clamp01((t - worth - 1.2) / 0.45)));
  // shock on "7 cents": wide eyes, brows up, a little gasp; it settles back into the smirk before "worth"
  const shock = clamp01((t - cents + 0.12) / 0.15) * (1 - clamp01((t - cents - 0.9) / 0.3));
  const raise = clamp01((t - worth + 0.1) / 0.25);
  const brows = Math.max(shock, raise);
  // slow push-in over the hook (the first 3 s are one unbroken shot)
  const z = 1.15 * (1 + 0.05 * easeOutCubic(clamp01(t / 4)));
  const q = easeOutBack(clamp01((t - worth + 0.05) / 0.25)) * (1 - clamp01((t - worth - 1.1) / 0.2));
  return (
    <svg viewBox="0 0 1080 1920" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
      <g transform={`translate(540 1000) scale(${z}) translate(-540 -950)`}>
        <Room t={t} />
        <g transform={`translate(0 ${-80 + 10 * nod})`}><Jake2D t={t} brows={brows} flip={flip} smile={0.6 - 0.3 * shock + 0.3 * raise} wide={shock} gasp={shock} /></g>
        {/* desk */}
        <rect x={-20} y={1360} width={1120} height={60} rx={12} fill="#d9a066" {...ink(8)} />
        <rect x={0} y={1416} width={1080} height={560} fill="#b7834f" {...ink(8)} />
        <path d="M0 1500 L 1080 1500" stroke="#a5733f" strokeWidth={10} />
        {/* mug */}
        <g transform="translate(820 1290)">
          <path d="M-40 0 L 40 0 L 34 76 L -34 76 Z" fill="#ff8a3d" {...ink(7)} />
          <path d="M40 18 C 70 18 70 58 36 58" fill="none" {...ink(8)} />
          <ellipse cx={0} cy={0} rx={40} ry={10} fill="#4a2c1a" {...ink(5)} />
          {[[-12, 0], [12, 0.6]].map(([dx, ph], i) => <path key={i} d={`M${dx} -16 q 10 -20 0 -40`} fill="none" stroke="#ffffff" strokeWidth={6} strokeLinecap="round" opacity={0.6 + 0.3 * Math.sin(t * 3 + ph)} />)}
        </g>
        {/* books + Hoot */}
        <g>
          <rect x={120} y={1318} width={270} height={44} rx={6} fill="#2f6fd6" {...ink(7)} />
          <rect x={135} y={1278} width={245} height={42} rx={6} fill="#e2453c" {...ink(7)} transform="rotate(-2 257 1300)" />
          <rect x={128} y={1240} width={255} height={40} rx={6} fill="#f0b429" {...ink(7)} transform="rotate(1.5 255 1260)" />
          {[1340, 1298, 1260].map((y, i) => <path key={i} d={`M${155 + i * 10} ${y} L ${350 - i * 6} ${y}`} stroke="#ffffff" strokeWidth={4} opacity={0.6} />)}
        </g>
        <Hoot2D t={t} talk={talk} x={255} y={1240} s={0.95} />
        <Note2D t={t} flip={flip} breathe={3 * Math.sin(t * 2.1)} q={q} stamp={stamp} pulse={pulse} />
      </g>
    </svg>
  );
};
