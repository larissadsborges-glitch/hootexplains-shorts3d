import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { buildMoneyTimeline } from '../scenes/money/timeline';
import type { Timings } from '../types';
import { Hook2D, HootGesture } from './Hook2D';
import { Desk2D } from './card/scenes';
import { Lobby2D } from './savings/scenes';

const FONT = "'Montserrat', 'Arial Black', sans-serif";
const outline = (px: number) =>
  Array.from({ length: 16 }, (_, a) => {
    const r = (a / 16) * Math.PI * 2;
    return `${(Math.cos(r) * px).toFixed(1)}px ${(Math.sin(r) * px).toFixed(1)}px 0 #000`;
  }).join(',');

export type Cover2DProps = { videoId: string; timings: Timings | null; at: number; small: string; line1: string; line2: string };

/** 2D cover: the hook room at a chosen moment (Jake's gasp) + tag + big two-line title, same template as the 3D covers. */
export const Cover2D: React.FC<Cover2DProps> = ({ timings, at, small, line1, line2 }) => {
  if (!timings) return null;
  const T = buildMoneyTimeline(timings);
  return (
    <AbsoluteFill style={{ background: '#c7d3ea' }}>
      <HootGesture.Provider value={{ raise: 0, cheer: false }}>
      {timings.id === 'money4' && (
        <svg viewBox="0 0 1080 1920" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
          <g transform="translate(540 1080) scale(1.4) translate(-560 -900)">
            <Lobby2D t={at} talk={0} face={{ brows: 1, smile: 0, wide: 1, gasp: 1 }} tag={0} receipt={1} good={0} pulse={0} />
          </g>
        </svg>
      )}
      {timings.id === 'money4' ? null : timings.id === 'money5'
        ? (
          <svg viewBox="0 0 1080 1920" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
            <g transform="translate(540 1060) scale(1.3) translate(-540 -960)">
              <Desk2D t={at} talk={0} brows={1} smile={0} wide={1} gasp={1} sad={0} nod={0} hl={1} peel={0} stamp12={1} stamp3={0} q={0} />
            </g>
          </svg>
        )
        : <Hook2D t={at} talk={0} worth={T.wordTime('hook', 'worth', T.s('hook') + 3.4)} cents={T.wordTime('hook', 'cents', T.s('hook') + 1.7)} />}
      </HootGesture.Provider>
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.12) 30%, rgba(0,0,0,0) 42%)' }} />
      <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', top: '7%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <div style={{ width: 70, height: 70, borderRadius: 35, overflow: 'hidden', border: '4px solid #fff' }}>
            <Img src={staticFile('brand/hoot.png')} style={{ width: '100%', height: '100%' }} />
          </div>
          <div style={{ background: '#ff8a3d', borderRadius: 22, padding: '6px 18px', fontFamily: FONT, fontWeight: 900, fontSize: 34, color: '#fff', letterSpacing: 2 }}>{small}</div>
        </div>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 100, color: '#fff', lineHeight: 1.0, textAlign: 'center', textShadow: `${outline(8)}, 0 12px 0 rgba(0,0,0,0.3)` }}>{line1}</div>
        <div style={{ marginTop: 14, background: '#ffd21f', padding: '6px 26px', borderRadius: 10, transform: 'rotate(-2deg)', boxShadow: '0 10px 0 rgba(0,0,0,0.3)', border: '5px solid #14171a' }}>
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 100, color: '#14171a', lineHeight: 1.0, textAlign: 'center' }}>{line2}</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
