import React from 'react';
import { AbsoluteFill } from 'remotion';
import { place } from '../toon2d/parts';
import { PAL, Tavinho, TavinhoHead } from './cast';

const FONT = "'Montserrat', 'Arial Black', sans-serif";
const outline = (px: number) => Array.from({ length: 16 }, (_, a) => { const r = (a / 16) * Math.PI * 2; return `${(Math.cos(r) * px).toFixed(1)}px ${(Math.sin(r) * px).toFixed(1)}px 0 #1b1420`; }).join(',');

/** Profile picture (new house style): Tavinho's face filling the Instagram circle. variant 0/1/2 = worried / happy / shock. */
export const TavinhoAvatar: React.FC<{ variant?: number }> = ({ variant = 0 }) => {
  const bg = [['#f3a86c', '#e07e46'], ['#9cc0ae', '#6f9a86'], ['#8fa8cc', '#5c739c']][variant] ?? ['#f3a86c', '#e07e46'];
  const mood = (['worried', 'happy', 'shock'] as const)[variant] ?? 'worried';
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 42%, ${bg[0]} 0%, ${bg[1]} 100%)` }}>
      <svg viewBox="0 0 1080 1080" width="100%" height="100%">
        {/* a soft halo behind the head so it pops at thumbnail size */}
        <circle cx={540} cy={560} r={420} fill="#ffffff" opacity={0.12} />
        <g transform="translate(540 585) scale(1.3) translate(-540 -790)"><TavinhoHead t={0.3} mood={mood} sweat={variant === 1 ? 0 : 1} slip={variant === 2 ? 0.9 : 0.4} /></g>
      </svg>
    </AbsoluteFill>
  );
};

/** EP cover: Tavinho in bed lit by the phone, title in the series template. */
export const TavinhoCover: React.FC<{ line1: string; line2: string; tag: string }> = ({ line1, line2, tag }) => (
  <AbsoluteFill style={{ background: PAL.navy }}>
    <svg viewBox="0 0 1080 1920" width="100%" height="100%">
      <ellipse cx={540} cy={1180} rx={520} ry={600} fill="#9fdcff" opacity={0.16} />
      <g transform={place(540, 2350, 1.25)}><Tavinho t={0.3} mood="shock" sweat={1} slip={0.8} armL={[[360, 1150], [290, 1330], [440, 1250]]} armR={[[720, 1150], [790, 1330], [640, 1250]]}
        holdL={<g transform="translate(40 -60) rotate(-8)"><rect x={-60} y={-110} width={150} height={240} rx={22} fill="#20232c" /><rect x={-46} y={-96} width={122} height={212} rx={14} fill="#bfe6ff" /></g>} /></g>
    </svg>
    <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', top: '8%' }}>
      <div style={{ background: PAL.mint, border: '5px solid #1b1420', borderRadius: 20, padding: '6px 22px', fontFamily: FONT, fontWeight: 900, fontSize: 36, color: '#1b1420', marginBottom: 20 }}>{tag}</div>
      <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 112, color: '#fff4e0', lineHeight: 1, textAlign: 'center', textShadow: `${outline(9)}, 0 12px 0 rgba(0,0,0,0.35)` }}>{line1}</div>
      <div style={{ marginTop: 16, background: PAL.orange, border: '6px solid #1b1420', padding: '6px 26px', borderRadius: 12, transform: 'rotate(-2deg)', boxShadow: '0 10px 0 rgba(0,0,0,0.35)' }}>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 104, color: '#fff', lineHeight: 1 }}>{line2}</div>
      </div>
    </AbsoluteFill>
  </AbsoluteFill>
);
