import React from 'react';
import { AbsoluteFill, Img, spring, staticFile, useVideoConfig } from 'remotion';

const FONT = "'Montserrat', 'Arial Black', sans-serif";

/**
 * Hoot, the host: a big "HOOT EXPLAINS" intro tag for the first seconds,
 * then a small round badge in the corner for the rest of the video.
 */
export const HootBadge: React.FC<{ t: number; introUntil?: number }> = ({ t, introUntil = 2.6 }) => {
  const { fps } = useVideoConfig();
  const pop = spring({ frame: Math.round(t * fps), fps, config: { damping: 12, stiffness: 200 } });
  const intro = t < introUntil;
  return (
    <>
      <div style={{ position: 'absolute', left: 48, top: 150, display: 'flex', alignItems: 'center', gap: 12, transform: `scale(${intro ? 1 : 0.85})`, transformOrigin: 'left center' }}>
        <div style={{ width: 104, height: 104, borderRadius: 52, overflow: 'hidden', border: '5px solid #fff', boxShadow: '0 6px 16px rgba(0,0,0,0.35)' }}>
          <Img src={staticFile('brand/hoot.png')} style={{ width: '100%', height: '100%' }} />
        </div>
        <div style={{ background: '#ff8a3d', borderRadius: 24, padding: '8px 18px', fontFamily: FONT, fontWeight: 900, fontSize: 30, color: '#fff', letterSpacing: 1, boxShadow: '0 6px 16px rgba(0,0,0,0.3)', opacity: intro ? 1 : 0.95, transform: `scale(${intro ? pop : 1})`, transformOrigin: 'left center' }}>
          {intro ? 'HOOT EXPLAINS' : 'HOOT'}
        </div>
      </div>
      {void AbsoluteFill}
    </>
  );
};
