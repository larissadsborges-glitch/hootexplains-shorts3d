import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Hoot2D } from './Hook2D';

/** Profile picture in the 2D style: Hoot close-up, winking, both wings up, on the page's orange. Safe for a round crop. */
export const Avatar2D: React.FC = () => (
  <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 42%, #ffcc4d 0%, #ffa62b 45%, #ff7d1a 100%)' }}>
    <svg viewBox="0 0 1080 1080" width="100%" height="100%">
      {/* soft sunburst behind Hoot */}
      {Array.from({ length: 16 }, (_, i) => {
        const a0 = (i * Math.PI * 2) / 16, a1 = a0 + Math.PI / 16;
        return <path key={i} d={`M540 470 L ${540 + 900 * Math.cos(a0)} ${470 + 900 * Math.sin(a0)} L ${540 + 900 * Math.cos(a1)} ${470 + 900 * Math.sin(a1)} Z`} fill="#ffffff" opacity={0.08} />;
      })}
      {/* Hoot, big: head and body fill the centre circle; the beak sits at the centre */}
      <Hoot2D t={0.2} talk={0} x={540} y={1190} s={2.85} wink wingsUp />
    </svg>
  </AbsoluteFill>
);
