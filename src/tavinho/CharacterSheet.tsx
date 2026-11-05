import React from 'react';
import { AbsoluteFill } from 'remotion';
import { place } from '../toon2d/parts';
import { Tavinho, TavinhoHead, type Mood, type Outfit } from './cast';
import { ink } from './style';

/**
 * Character sheet for the new Tavinho (owner: "focus on the character first"). Composition "TavinhoSheet", prop page:
 * 0 = the four outfits, full body; 1 = seven expressions, head only. 1080x1920 each, for the phone.
 */
const F = 'Montserrat, Arial Black, sans-serif';

const Tag: React.FC<{ x: number; y: number; text: string }> = ({ x, y, text }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-150} y={-30} width={300} height={60} rx={20} fill="#3b2622" />
    <text x={0} y={12} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={30} fill="#fff4e0">{text}</text>
  </g>
);

export const TavinhoSheet: React.FC<{ page: number }> = ({ page }) => {
  const outfits: [Outfit, string, Mood][] = [['work', 'CAMISA E GRAVATA', 'neutral'], ['pajama', 'PIJAMA', 'gulp'], ['hoodie', 'MOLETOM', 'worried'], ['tee', 'T-SHIRT', 'happy']];
  const moods: [Mood, string][] = [['neutral', 'NORMAL'], ['worried', 'PREOCUPADO'], ['shock', 'CHOCADO'], ['gulp', 'ENGOLIR EM SECO'], ['happy', 'FELIZ'], ['proud', 'ORGULHOSO'], ['talk', 'A FALAR']];
  return (
    <AbsoluteFill style={{ background: '#e9dcc6' }}>
      <svg viewBox="0 0 1080 1920" width="100%" height="100%">
        <rect x={0} y={0} width={1080} height={1920} fill="#e9dcc6" />
        {Array.from({ length: 16 }, (_, i) => <path key={i} d={`M0 ${i * 130 + 60} L 1080 ${i * 130 + 60}`} stroke="#ddcfb6" strokeWidth={3} />)}
        <rect x={40} y={50} width={1000} height={110} rx={26} fill="#3b2622" />
        <text x={540} y={125} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={50} fill="#fff4e0">{page === 0 ? 'TAVINHO · ROUPAS' : 'TAVINHO · EXPRESSÕES'}</text>
        {page === 0 && outfits.map(([o, label, mood], i) => {
          const x = i % 2 ? 790 : 290, y = i < 2 ? 1000 : 1800;
          return (
            <g key={o}>
              <ellipse cx={x} cy={y + 2} rx={150} ry={18} fill="#000" opacity={0.12} />
              <g transform={place(x, y, 0.37)}><Tavinho t={2} mood={mood} outfit={o} sweat={mood === 'gulp' ? 0.6 : 0} slip={0.3} /></g>
              <Tag x={x} y={y + 60} text={label} />
            </g>
          );
        })}
        {page === 1 && moods.map(([m, label], i) => {
          const col = i % 2, row = Math.floor(i / 2);
          const x = i === 6 ? 540 : col ? 790 : 290, y = 360 + row * 420;
          return (
            <g key={m}>
              <circle cx={x} cy={y} r={170} fill="#f6eedf" {...ink(5)} />
              <g transform={`translate(${x} ${y + 40}) scale(0.5) translate(-540 -840)`}><TavinhoHead t={2} mood={m} talk={m === 'talk' ? 0.6 : 0} sweat={m === 'gulp' || m === 'worried' ? 0.6 : 0} slip={m === 'gulp' ? 0.6 : 0.2} /></g>
              <Tag x={x} y={y + 205} text={label} />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
