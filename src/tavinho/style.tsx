import React from 'react';

/**
 * The Tavinho house style (owner approved, 5 Nov 2026): flat vector with an even, thinner WARM-BROWN outline
 * (not near-black), muted colours. Every Tavinho file takes INK / ink / Limb / Hand from here, so the whole
 * series changes look in one place. (Hoot keeps toon2d/Hook2D's own ink.)
 */
export const INK = '#3b2622';
export const ink = (w = 7) => ({ stroke: INK, strokeWidth: Math.max(2, w * 0.8), strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const });

const SKIN = '#f0bb90';

/** A cartoon limb: a rounded stroke through shoulder → elbow → hand, with a thin brown rim. */
export const Limb: React.FC<{ pts: number[][]; w: number; color: string; shade?: string }> = ({ pts, w, color, shade }) => {
  const d = `M${pts.map((p) => p.join(' ')).join(' L ')}`;
  return (
    <g>
      <path d={d} fill="none" stroke={INK} strokeWidth={w + 12} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
      {shade && <path d={d} fill="none" stroke={shade} strokeWidth={w * 0.28} strokeLinecap="round" strokeLinejoin="round" transform={`translate(${w * 0.22} 0)`} opacity={0.9} />}
    </g>
  );
};

/** A plain mitten hand with a thumb (owner rule: never a gesture), rotated along `angle` (degrees, 0 = down). */
export const Hand: React.FC<{ x: number; y: number; angle?: number; r?: number; color?: string; flipThumb?: boolean }> = ({ x, y, angle = 0, r = 36, color = SKIN, flipThumb }) => (
  <g transform={`translate(${x} ${y}) rotate(${angle})`}>
    <path d={`M${-r} ${-r * 0.4} C ${-r} ${r * 1.2} ${r} ${r * 1.2} ${r} ${-r * 0.4} C ${r} ${-r} ${-r} ${-r} ${-r} ${-r * 0.4} Z`} fill={color} {...ink(7)} />
    <path d={`M${(flipThumb ? -1 : 1) * r * 0.85} ${-r * 0.3} q ${(flipThumb ? -1 : 1) * r * 0.55} ${r * 0.1} ${(flipThumb ? -1 : 1) * r * 0.35} ${r * 0.75}`} fill={color} {...ink(6)} />
    {[-0.35, 0.05, 0.45].map((k, i) => <path key={i} d={`M${r * k} ${r * 0.55} l 0 ${r * 0.35}`} fill="none" {...ink(4)} />)}
  </g>
);
