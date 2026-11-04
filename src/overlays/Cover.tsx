import React, { useMemo } from 'react';
import { AbsoluteFill, Img, staticFile, useVideoConfig } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { SCENES } from '../Short';
import type { Timings } from '../types';
import { StylePass, type VisualStyle } from '../style/StylePass';

const FONT = "'Montserrat', 'Arial Black', sans-serif";
const outline = (px: number) =>
  Array.from({ length: 16 }, (_, a) => {
    const r = (a / 16) * Math.PI * 2;
    return `${(Math.cos(r) * px).toFixed(1)}px ${(Math.sin(r) * px).toFixed(1)}px 0 #000`;
  }).join(',');

export type CoverProps = { videoId: string; timings: Timings | null; at: number; small: string; line1: string; line2: string; style?: VisualStyle };

/** Fixed Hoot Explains cover: the scene at a chosen moment + small tag + big 2-line question. */
export const Cover: React.FC<CoverProps> = ({ timings, at, small, line1, line2, style = 'real' }) => {
  const { width, height } = useVideoConfig();
  const S = SCENES[timings?.scene ?? 'river-bridge'];
  void useMemo;
  if (!timings) return null;
  return (
    <AbsoluteFill style={{ background: '#9fd3fb' }}>
      <AbsoluteFill style={{ filter: style === 'real' ? 'saturate(1.18) contrast(1.06)' : undefined }}>
      <ThreeCanvas width={width} height={height} shadows gl={{ antialias: true }} camera={{ fov: 45, position: [0, 10, 20] }}>
        <S.Scene timings={timings} t={at} />
        <StylePass style={style} />
      </ThreeCanvas>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 38%, rgba(0,0,0,0) 55%)' }} />
      <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', top: '11%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
          <div style={{ width: 70, height: 70, borderRadius: 35, overflow: 'hidden', border: '4px solid #fff' }}>
            <Img src={staticFile('brand/hoot.png')} style={{ width: '100%', height: '100%' }} />
          </div>
          <div style={{ background: '#ff8a3d', borderRadius: 22, padding: '6px 18px', fontFamily: FONT, fontWeight: 900, fontSize: 34, color: '#fff', letterSpacing: 2 }}>{small}</div>
        </div>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 104, color: '#fff', lineHeight: 1.0, textAlign: 'center', textShadow: `${outline(8)}, 0 12px 0 rgba(0,0,0,0.3)` }}>{line1}</div>
        <div style={{ marginTop: 14, background: '#ffd21f', padding: '6px 26px', borderRadius: 10, transform: 'rotate(-2deg)', boxShadow: '0 10px 0 rgba(0,0,0,0.3)' }}>
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 104, color: '#14171a', lineHeight: 1.0, textAlign: 'center' }}>{line2}</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
