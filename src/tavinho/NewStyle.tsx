import React from 'react';
import { AbsoluteFill } from 'remotion';

/**
 * Style test for a new house look (owner, 5 Nov 2026, with reference stills of the genre they like).
 * We take the STYLE traits only: clean flat vector, an even medium-thin dark outline, a muted palette,
 * a taller head with big outlined eyes + heavy lids, a big rounded nose, a wide mouth with teeth, slim bendy limbs,
 * a busy room, and a blurred background in close-ups. The character stays ours: round glasses, the forehead curl,
 * the light-blue shirt and crooked red tie (no cap, no broken tooth, no stubble, no running tee).
 * Composition "TavinhoNewStyle", prop shot: 0 = full body in his room, 1 = face close-up.
 */
const F = 'Montserrat, Arial Black, sans-serif';
const OL = '#1f1d2b';
const o = (w = 7) => ({ stroke: OL, strokeWidth: w, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const });
const SKIN = '#e9b48c', SKIN_SH = '#d39a72', HAIR = '#5a3a26', SHIRT = '#a9cdec', SHIRT_SH = '#86afd6', TIE = '#c0453c', PANTS = '#5a5f4a';

/** The room (muted dusty blue, wood floor, bed, desk, shelf, window with curtains, a little clutter). */
const Room: React.FC = () => (
  <g>
    <rect x={0} y={0} width={1080} height={1920} fill="#5c739c" />
    {Array.from({ length: 22 }, (_, i) => <rect key={i} x={i * 52} y={0} width={18} height={1380} fill="#566d95" />)}
    {/* window + curtains + night city */}
    <rect x={620} y={420} width={300} height={380} fill="#1d2440" {...o()} />
    <circle cx={820} cy={520} r={44} fill="#efe6c8" />
    {[[640, 640, 60, 160], [710, 600, 50, 200], [770, 660, 70, 140], [850, 620, 50, 180]].map(([x, y, w, h], i) => <rect key={i} x={x} y={y} width={w} height={h} fill="#141a30" />)}
    {[[660, 680], [730, 640], [790, 700], [870, 660], [730, 720]].map(([x, y], i) => <rect key={i} x={x} y={y} width={10} height={12} fill="#e8c860" />)}
    <path d="M770 420 L 770 800 M 620 610 L 920 610" stroke="#c7cfe0" strokeWidth={10} />
    <rect x={600} y={404} width={340} height={14} rx={7} fill="#3a2a22" {...o(5)} />
    <path d="M600 410 C 640 520 610 700 640 830 L 590 830 C 600 700 580 520 600 410 Z" fill="#a33b37" {...o(6)} />
    <path d="M940 410 C 900 520 930 700 900 830 L 950 830 C 940 700 960 520 940 410 Z" fill="#a33b37" {...o(6)} />
    {/* shelf with boxes and a little plant; a poster */}
    <rect x={60} y={560} width={360} height={14} fill="#7a5a42" {...o(5)} />
    <rect x={80} y={490} width={90} height={70} fill="#b99266" {...o(5)} /><rect x={92} y={505} width={66} height={18} fill="#f2ead8" {...o(3)} />
    <rect x={190} y={510} width={60} height={50} fill="#9b7a58" {...o(5)} />
    <rect x={280} y={500} width={50} height={60} rx={8} fill="#c0453c" {...o(5)} /><ellipse cx={305} cy={492} rx={34} ry={22} fill="#6a9a5a" {...o(4)} />
    <rect x={360} y={480} width={40} height={80} rx={8} fill="#2c2a36" {...o(5)} />
    <g transform="rotate(-3 210 820)"><rect x={90} y={640} width={250} height={330} fill="#e2b545" {...o()} /><text x={215} y={700} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={34} fill="#2c2a36">CHEF?</text><circle cx={215} cy={800} r={58} fill="#c9573e" /><path d="M150 930 L 215 840 L 280 930 Z" fill="#3e4f78" /><rect x={196} y={628} width={40} height={20} fill="#f2ead8" opacity={0.8} /></g>
    {/* floor, rug, bed on the left, desk on the right */}
    <rect x={0} y={1380} width={1080} height={540} fill="#8a6446" {...o(5)} />
    {Array.from({ length: 6 }, (_, i) => <path key={i} d={`M0 ${1440 + i * 80} L 1080 ${1440 + i * 80}`} stroke="#6f4f36" strokeWidth={5} />)}
    {Array.from({ length: 6 }, (_, r) => <path key={`v${r}`} d={`M${(r * 230 + (r % 2) * 110) % 1080} ${1380 + (r % 3) * 80} l 0 80`} stroke="#6f4f36" strokeWidth={5} />)}
    <ellipse cx={540} cy={1700} rx={360} ry={100} fill="#8a3a3a" {...o(6)} />
    <ellipse cx={540} cy={1700} rx={320} ry={78} fill="none" stroke="#c46a5a" strokeWidth={5} strokeDasharray="22 16" />
    <rect x={-40} y={1100} width={300} height={320} rx={16} fill="#b5413a" {...o()} />
    <path d="M-40 1420 L 0 1380 L 40 1420 L 80 1380 L 120 1420 L 160 1380 L 200 1420 L 240 1380 L 260 1420" fill="none" {...o(5)} />
    <ellipse cx={60} cy={1080} rx={110} ry={50} fill="#eceae4" {...o()} />
    <rect x={760} y={1150} width={320} height={34} fill="#8a5a3a" {...o()} />
    <rect x={800} y={1184} width={240} height={150} fill="#7a4e32" {...o()} /><circle cx={920} cy={1260} r={9} fill="#e2b545" {...o(3)} />
    <path d="M820 1150 L 820 1380 M 1040 1150 L 1040 1380" {...o(10)} />
    <path d="M880 1150 L 900 1060 L 960 1040" fill="none" {...o(8)} /><path d="M940 1010 L 1000 1030 L 980 1080 Z" fill="#c9573e" {...o(5)} />
    {/* clutter: a pizza box and a sock */}
    <g transform="rotate(8 860 1560)"><rect x={760} y={1520} width={200} height={70} fill="#d9b88a" {...o(6)} /><circle cx={830} cy={1555} r={16} fill="#c0453c" /></g>
    <path d="M120 1600 q 40 -20 70 10 q 10 30 -30 34 q -40 0 -40 -44 Z" fill="#e8e4dc" {...o(5)} />
  </g>
);

/** Tavinho's head in the new style: taller egg head, big outlined eyes with heavy lids, round glasses, a big nose, wide mouth. */
const Head: React.FC<{ shock?: boolean }> = ({ shock = false }) => (
  <g>
    <path d="M404 590 C 360 590 352 660 396 670" fill={SKIN} {...o()} />
    {/* egg-shaped face, a soft shadow patch along the jaw */}
    <path d="M420 520 C 420 400 480 330 560 330 C 650 330 700 410 700 540 C 700 680 650 790 556 790 C 470 790 420 700 420 520 Z" fill={SKIN} {...o(8)} />
    <path d="M440 650 C 470 740 520 770 556 772 C 620 772 670 720 690 640 C 640 700 560 720 440 650 Z" fill={SKIN_SH} opacity={0.85} />
    {/* neat hair with the curl */}
    <path d="M418 540 C 400 400 470 318 560 316 C 660 314 716 392 704 520 C 690 460 650 430 600 428 C 560 426 520 440 480 440 C 450 440 428 480 418 540 Z" fill={HAIR} {...o(8)} />
    <path d="M590 430 C 560 404 566 360 600 360 C 630 360 634 396 610 404 C 596 408 590 394 600 388" fill="none" stroke={HAIR} strokeWidth={18} strokeLinecap="round" />
    <path d="M590 430 C 560 404 566 360 600 360 C 630 360 634 396 610 404 C 596 408 590 394 600 388" fill="none" stroke={OL} strokeWidth={5} strokeLinecap="round" />
    {/* big eyes, heavy upper lids (looking sideways, sly) or wide open (shock) */}
    {/* lenses first (light tint, thick frame), the eyes sit inside them */}
    {[[505, 80], [632, 72]].map(([x, r], i) => <circle key={`l${i}`} cx={x} cy={540} r={r} fill="#dceefa" stroke={OL} strokeWidth={9} />)}
    <path d="M585 532 Q 568 516 556 534" fill="none" {...o(7)} />
    {[[505, 52], [632, 46]].map(([x, r], i) => (
      <g key={i}>
        <ellipse cx={x} cy={540} rx={r} ry={r + 8} fill="#ffffff" {...o(5)} />
        <circle cx={x + (shock ? 0 : 16)} cy={shock ? 548 : 554} r={shock ? 12 : 17} fill={OL} />
        <circle cx={x + (shock ? 4 : 22)} cy={shock ? 542 : 547} r={5} fill="#ffffff" />
        {!shock && (
          <g>
            <clipPath id={`lid${i}`}><ellipse cx={x} cy={540} rx={r} ry={r + 8} /></clipPath>
            <g clipPath={`url(#lid${i})`}><path d={`M${x - r - 4} ${530} C ${x - r * 0.4} ${512} ${x + r * 0.4} ${512} ${x + r + 4} ${530} L ${x + r + 4} ${470} L ${x - r - 4} ${470} Z`} fill={SKIN_SH} /></g>
            <path d={`M${x - r + 2} ${528} C ${x - r * 0.4} ${512} ${x + r * 0.4} ${512} ${x + r - 2} ${528}`} fill="none" {...o(7)} />
            <ellipse cx={x} cy={540} rx={r} ry={r + 8} fill="none" {...o(5)} />
          </g>
        )}
      </g>
    ))}
    {/* eyebrows */}
    {shock ? [[505, -1], [632, 1]].map(([x, s], i) => <path key={i} d={`M${x - 46} ${440 + s * 2} Q ${x} ${420} ${x + 46} ${440 - s * 2}`} fill="none" stroke={HAIR} strokeWidth={14} strokeLinecap="round" />) : null}
    {/* big rounded nose */}
    <path d="M560 560 C 600 580 630 640 610 666 C 596 690 540 690 530 664 C 524 646 540 630 556 630" fill={SKIN} {...o(8)} />
    {/* wide mouth with a full row of teeth */}
    {shock ? (
      <g>
        <path d="M470 690 C 480 660 640 650 660 690 C 660 760 600 790 560 790 C 510 790 470 760 470 690 Z" fill="#7a2c2a" {...o(8)} />
        <path d="M486 686 C 520 672 620 668 646 686 L 640 708 L 492 708 Z" fill="#ffffff" {...o(4)} />
        <ellipse cx={565} cy={760} rx={44} ry={18} fill="#d9605a" />
      </g>
    ) : (
      <g>
        <path d="M470 690 C 520 712 610 708 660 676 C 650 740 600 770 560 770 C 510 770 476 740 470 690 Z" fill="#7a2c2a" {...o(8)} />
        <path d="M480 694 C 530 712 610 708 652 684 L 646 708 C 600 726 530 726 486 712 Z" fill="#ffffff" {...o(4)} />
      </g>
    )}
    {/* sweat drop */}
    <path d="M690 450 C 704 470 708 482 694 492 C 680 500 670 484 690 450 Z" fill="#a9d6f5" {...o(4)} />
  </g>
);

/** Full body, panicking with the phone: slim bendy limbs, knees bent. */
const Body: React.FC = () => (
  <g>
    {/* legs: bent knees, sneakers (outline stroke under the fill) */}
    {['M470 1240 C 440 1330 420 1400 440 1480 C 450 1530 470 1580 470 1620', 'M610 1240 C 650 1330 670 1400 650 1480 C 640 1530 620 1580 620 1620'].map((d, i) => (
      <g key={i}><path d={d} fill="none" stroke={OL} strokeWidth={84} strokeLinecap="round" /><path d={d} fill="none" stroke={PANTS} strokeWidth={70} strokeLinecap="round" /></g>
    ))}
    {[[470, -1], [620, 1]].map(([x, s], i) => <g key={i}><path d={`M${x} 1240 C ${x + s * -30} 1330 ${x + s * -50} 1400 ${x + s * -30} 1480`} fill="none" stroke="#4a4e3c" strokeWidth={6} opacity={0.6} /><path d={`M${x - 60} 1650 C ${x - 60} 1610 ${x - 30} 1596 ${x + 10} 1598 C ${x + 60} 1600 ${x + 76} 1626 ${x + 70} 1650 Z`} fill="#f2ead8" {...o(7)} /><path d={`M${x - 60} 1650 L ${x + 70} 1650`} stroke="#c0453c" strokeWidth={10} /></g>)}
    {/* shirt: tucked, slightly too small; crooked red tie */}
    <path d="M430 860 C 400 900 390 1060 420 1250 L 670 1250 C 700 1060 690 900 650 860 Z" fill={SHIRT} {...o(8)} />
    <path d="M610 870 C 660 930 670 1080 650 1250 L 670 1250 C 700 1060 690 900 650 860 Z" fill={SHIRT_SH} />
    <path d="M420 1250 L 670 1250" stroke="#3a3a2c" strokeWidth={22} />
    <path d="M500 850 L 540 910 L 580 850 Z" fill="#ffffff" {...o(6)} />
    <g transform="rotate(12 540 880)"><path d="M528 880 L 552 880 L 566 1040 L 540 1070 L 514 1040 Z" fill={TIE} {...o(6)} /></g>
    {[960, 1040, 1120].map((y) => <circle key={y} cx={545} cy={y} r={8} fill="#ffffff" {...o(3)} />)}
    {/* neck */}
    <rect x={512} y={780} width={58} height={86} rx={10} fill={SKIN_SH} {...o(6)} />
    {/* arms: thin, bendy; plain mitten hands holding the phone up */}
    <path d="M440 900 C 380 960 380 1040 450 1060" fill="none" stroke={OL} strokeWidth={62} strokeLinecap="round" />
    <path d="M440 900 C 380 960 380 1040 450 1060" fill="none" stroke={SHIRT} strokeWidth={48} strokeLinecap="round" />
    <path d="M640 900 C 700 960 700 1040 630 1060" fill="none" stroke={OL} strokeWidth={62} strokeLinecap="round" />
    <path d="M640 900 C 700 960 700 1040 630 1060" fill="none" stroke={SHIRT_SH} strokeWidth={48} strokeLinecap="round" />
    <rect x={480} y={940} width={120} height={200} rx={18} fill="#2a2a36" {...o(6)} />
    <rect x={492} y={952} width={96} height={170} rx={10} fill="#bfe6ff" />
    <rect x={500} y={1020} width={80} height={36} rx={12} fill="#3ddc97" /><text x={540} y={1045} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={18} fill="#14171a">🎤 3:12</text>
    {[[466, 1062], [614, 1062]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx={30} ry={28} fill={SKIN} {...o(6)} />)}
  </g>
);

export const TavinhoNewStyle: React.FC<{ shot: number }> = ({ shot }) => (
  <AbsoluteFill style={{ background: '#5c739c' }}>
    <svg viewBox="0 0 1080 1920" width="100%" height="100%">
      <defs><filter id="ns-blur"><feGaussianBlur stdDeviation="16" /></filter></defs>
      {shot === 0 && (
        <g>
          <Room />
          <ellipse cx={545} cy={1655} rx={170} ry={22} fill="#000" opacity={0.22} />
          <g><Body /><g transform="translate(-14 40) rotate(-6 560 560)"><Head shock /></g></g>
        </g>
      )}
      {shot === 1 && (
        <g>
          <g filter="url(#ns-blur)"><g transform="translate(-200 -300) scale(1.4)"><Room /></g></g>
          <rect x={0} y={0} width={1080} height={1920} fill="#1d2440" opacity={0.15} />
          <g transform="translate(540 980) scale(2.0) translate(-560 -560) rotate(-4 560 560)"><Head /></g>
        </g>
      )}
      <rect x={40} y={60} width={1000} height={110} rx={26} fill="#1b1420" opacity={0.9} />
      <text x={80} y={136} fontFamily={F} fontWeight={900} fontSize={44} fill="#fff4e0">{shot === 0 ? 'ESTILO NOVO · corpo inteiro' : 'ESTILO NOVO · close no rosto'}</text>
    </svg>
  </AbsoluteFill>
);
