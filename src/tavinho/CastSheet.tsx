import React from 'react';
import { AbsoluteFill } from 'remotion';
import { place } from '../toon2d/parts';
import { Camila, Celeste, PAL, Tavinho, TavinhoHead, VoDita } from './cast';

/** Design check: the cast side by side, plus Tavinho's expressions. */
export const CastSheet: React.FC = () => (
  <AbsoluteFill style={{ background: PAL.cream }}>
    <svg viewBox="0 0 2160 1920" width="100%" height="100%">
      <g transform={place(330, 1880, 0.62)}><Tavinho t={2} mood="worried" sweat={1} slip={0.6} /></g>
      <g transform={place(860, 1880, 0.62)}><Camila t={2} mood="happy" /></g>
      <g transform={place(1380, 1880, 0.62)}><Celeste t={2} mood="talk" talk={0.5} /></g>
      <g transform={place(1880, 1880, 0.62)}><VoDita t={2} mood="happy" /></g>
      {(['neutral', 'proud', 'shock', 'gulp', 'worried'] as const).map((m, i) => (
        <g key={m} transform={`translate(${60 + i * 420} 60) scale(0.62) translate(-300 -560)`}><TavinhoHead t={2} mood={m} slip={m === 'worried' ? 1 : 0} sweat={m === 'worried' || m === 'gulp' ? 1 : 0} /></g>
      ))}
    </svg>
  </AbsoluteFill>
);
