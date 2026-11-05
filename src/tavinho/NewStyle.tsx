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
const OL = '#3b2622';
const o = (w = 7) => ({ stroke: OL, strokeWidth: w, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const });
const SKIN = '#f0bb90', SKIN_SH = '#dc9e74', HAIR = '#4a2a1c', SHIRT = '#a9cdec', SHIRT_SH = '#86afd6', TIE = '#c0453c', PANTS = '#2f3b5c';

/** His small living room (our own set): sage wall with wood panelling, a balcony door at sunset with plants,
 * a mustard sofa, a bookcase, a clothes-drying rack, a standing fan, a framed family photo, a patterned-tile floor. */
const Room: React.FC = () => (
  <g>
    <rect x={0} y={0} width={1080} height={1920} fill="#6f8f86" />
    {/* wood panelling on the lower wall */}
    <rect x={0} y={1000} width={1080} height={400} fill="#a9805c" {...o(5)} />
    {Array.from({ length: 12 }, (_, i) => <path key={i} d={`M${i * 96 + 40} 1000 L ${i * 96 + 40} 1400`} stroke="#8f6a4a" strokeWidth={5} />)}
    <rect x={0} y={990} width={1080} height={20} fill="#c49a70" {...o(5)} />
    {/* balcony door: sunset outside, potted plants, a little railing */}
    <rect x={640} y={300} width={360} height={700} fill="#e9a46a" {...o()} />
    <rect x={640} y={300} width={360} height={360} fill="#f0b97a" />
    <circle cx={900} cy={560} r={60} fill="#f7dc9a" />
    {[[660, 640, 140, 120], [760, 600, 110, 160], [880, 630, 120, 130]].map(([x, y, w, h], i) => <rect key={i} x={x} y={y} width={w} height={h} fill="#b8705a" opacity={0.6} />)}
    {Array.from({ length: 8 }, (_, i) => <path key={`r${i}`} d={`M${660 + i * 44} 820 L ${660 + i * 44} 990`} stroke="#3e4a48" strokeWidth={7} />)}
    <path d="M640 820 L 1000 820" stroke="#3e4a48" strokeWidth={10} />
    <path d="M820 300 L 820 1000" {...o(9)} />
    <g transform="translate(700 960)"><rect x={-40} y={-10} width={80} height={60} rx={8} fill="#c0573e" {...o(5)} /><path d="M0 -10 C -40 -60 -60 -120 -20 -150 M0 -10 C 20 -80 60 -110 40 -160 M0 -10 C -10 -70 10 -100 0 -130" fill="none" stroke="#4f7d4a" strokeWidth={16} strokeLinecap="round" /></g>
    {/* string lights along the top */}
    <path d="M0 230 Q 270 300 540 240 T 1080 250" fill="none" {...o(4)} />
    {Array.from({ length: 12 }, (_, i) => { const x = i * 92 + 30; const y = 240 + 30 * Math.sin(i * 1.1); return <circle key={`l${i}`} cx={x} cy={y + 18} r={12} fill={['#f2d27a', '#f0a16a', '#e8e0c0'][i % 3]} {...o(3)} />; })}
    {/* framed family photo + a calendar */}
    <rect x={90} y={360} width={230} height={180} fill="#f2ead8" {...o()} />
    {[150, 210, 260].map((x, i) => <circle key={i} cx={x} cy={450} r={26} fill={['#e9b48c', '#c98b5e', '#f0c3a0'][i]} {...o(4)} />)}
    <rect x={360} y={380} width={140} height={160} fill="#ffffff" {...o(6)} /><rect x={360} y={380} width={140} height={40} fill="#c0453c" />
    <text x={430} y={500} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={60} fill="#2c2a36">5</text>
    {/* bookcase on the right */}
    <rect x={930} y={1040} width={170} height={420} fill="#7a5a42" {...o()} />
    {[1150, 1260, 1370].map((y, k) => <g key={k}><rect x={930} y={y} width={170} height={10} fill="#5f4532" />{Array.from({ length: 5 }, (_, i) => <rect key={i} x={944 + i * 26} y={y - 90 + (i % 2) * 10} width={22} height={90 - (i % 2) * 10} fill={['#c0453c', '#e2b545', '#3e6a8a', '#5f8f6a', '#e8e0c0'][(i + k) % 5]} {...o(3)} />)}</g>)}
    {/* mustard sofa on the left with a cushion */}
    <rect x={-60} y={1130} width={360} height={260} rx={40} fill="#d6a43c" {...o()} />
    <rect x={-60} y={1260} width={380} height={150} rx={30} fill="#e2b545" {...o()} />
    <rect x={40} y={1170} width={120} height={100} rx={24} fill="#c0453c" {...o(6)} transform="rotate(-10 100 1220)" />
    {/* clothes-drying rack (Brazilian varal) with a few clothes */}
    <path d="M330 1430 L 400 1150 L 470 1430 M 330 1430 L 470 1150 M 400 1150 L 400 1150" fill="none" stroke="#c9ccd4" strokeWidth={8} />
    <path d="M350 1200 L 460 1200" stroke="#c9ccd4" strokeWidth={8} />
    <path d="M360 1200 L 360 1280 L 400 1280 L 400 1200" fill="#7fb2df" {...o(4)} />
    <path d="M410 1200 L 412 1250 L 452 1250 L 450 1200" fill="#f2ead8" {...o(4)} />
    {/* standing fan */}
    <g transform="translate(860 1180)"><circle r={70} fill="#e8e0c0" {...o(6)} />{[0, 120, 240].map((a) => <ellipse key={a} cx={0} cy={-34} rx={18} ry={34} fill="#bfc6cf" {...o(3)} transform={`rotate(${a})`} />)}<circle r={12} fill="#6f8f86" {...o(3)} /><path d="M0 70 L 0 230 M -50 240 L 50 240" {...o(10)} /></g>
    {/* patterned-tile floor (ladrilho hidráulico) */}
    <rect x={0} y={1400} width={1080} height={520} fill="#e8dcc4" {...o(5)} />
    {Array.from({ length: 4 }, (_, r) => Array.from({ length: 7 }, (_, c) => {
      const x = c * 160 - 20, y = 1420 + r * 130;
      return <g key={`${r}-${c}`}><rect x={x} y={y} width={156} height={126} fill={(r + c) % 2 ? '#e8dcc4' : '#efe4ce'} /><path d={`M${x + 78} ${y + 14} L ${x + 140} ${y + 63} L ${x + 78} ${y + 112} L ${x + 16} ${y + 63} Z`} fill="none" stroke="#b8705a" strokeWidth={6} /><circle cx={x + 78} cy={y + 63} r={12} fill="#5f8f86" /></g>;
    }))}
    {/* a slipper on the floor */}
    <path d="M150 1700 q 50 -24 90 0 q 10 24 -40 30 q -50 4 -50 -30 Z" fill="#3e6a8a" {...o(5)} />
  </g>
);

/** Tavinho's head in the new style: taller egg head, big outlined eyes with heavy lids, round glasses, a big nose, wide mouth. */
const Head: React.FC<{ shock?: boolean }> = ({ shock = false }) => (
  <g>
    <path d="M404 590 C 360 590 352 660 396 670" fill={SKIN} {...o()} />
    {/* egg-shaped face, a soft shadow patch along the jaw */}
    <path d="M402 540 C 400 410 470 340 560 340 C 652 340 720 410 718 540 C 716 610 740 690 690 750 C 650 795 600 806 560 806 C 520 806 470 796 430 750 C 380 690 404 610 402 540 Z" fill={SKIN} {...o(8)} />
    <path d="M420 690 C 460 770 520 790 560 790 C 610 790 668 768 702 700 C 650 740 560 752 420 690 Z" fill={SKIN_SH} opacity={0.8} />
    {[440, 680].map((x, i) => <ellipse key={i} cx={x} cy={660} rx={40} ry={22} fill="#ff8f86" opacity={0.4} />)}
    {/* neat hair with the curl */}
    <path d="M418 540 C 400 400 470 318 560 316 C 660 314 716 392 704 520 C 690 460 650 430 600 428 C 560 426 520 440 480 440 C 450 440 428 480 418 540 Z" fill={HAIR} {...o(8)} />
    <path d="M590 430 C 560 404 566 360 600 360 C 630 360 634 396 610 404 C 596 408 590 394 600 388" fill="none" stroke="#8a5a3a" strokeWidth={18} strokeLinecap="round" />
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
    <ellipse cx={566} cy={640} rx={30} ry={24} fill={SKIN_SH} {...o(6)} />
    <ellipse cx={556} cy={632} rx={9} ry={6} fill="#ffffff" opacity={0.55} />
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
    {[[470, -1], [620, 1]].map(([x, s], i) => <g key={i}><path d={`M${x} 1240 C ${x + s * -30} 1330 ${x + s * -50} 1400 ${x + s * -30} 1480`} fill="none" stroke="#4a4e3c" strokeWidth={6} opacity={0.6} /><path d={`M${x - 60} 1650 C ${x - 60} 1610 ${x - 30} 1596 ${x + 10} 1598 C ${x + 60} 1600 ${x + 76} 1626 ${x + 70} 1650 Z`} fill="#7a4a2c" {...o(7)} /></g>)}
    {/* shirt: tucked, slightly too small; crooked red tie */}
    <path d="M440 860 C 360 920 340 1120 420 1250 L 670 1250 C 750 1120 730 920 650 860 Z" fill={SHIRT} {...o(8)} />
    <path d="M630 880 C 710 950 720 1120 660 1250 L 670 1250 C 750 1120 730 920 650 860 Z" fill={SHIRT_SH} />
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
