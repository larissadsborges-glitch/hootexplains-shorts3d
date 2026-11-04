import React from 'react';
import { AbsoluteFill } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { Hoot } from './Mascots';
import { StylePass } from '../style/StylePass';

/** Square profile picture: Hoot facing the camera, smooth "real" style, soft background (works as a circle crop). */
const BG: Record<string, string> = {
  teal: 'radial-gradient(circle at 50% 38%, #7fe6d6 0%, #3cc4b0 50%, #1e9c8b 100%)',
  yellow: 'radial-gradient(circle at 50% 38%, #fff3b0 0%, #ffd94a 55%, #f2b705 100%)',
  burst: 'radial-gradient(circle at 50% 45%, #ffe07a 0%, #ffb627 45%, #ff7a1a 100%)',
  navy: 'radial-gradient(circle at 50% 38%, #4a64a8 0%, #2a3a6a 55%, #161f3c 100%)',
  sky: 'radial-gradient(circle at 50% 38%, #ffffff 0%, #cfeaff 40%, #7cc4f5 100%)',
  cream: 'radial-gradient(circle at 50% 38%, #fffaf0 0%, #fbe9cf 55%, #f2d3a6 100%)',
  orange: 'radial-gradient(circle at 50% 40%, #ffb36b 0%, #ff8a3d 55%, #e8662a 100%)',
};

export const Avatar: React.FC<{ bg?: string; talk?: number; wave?: number; bust?: boolean }> = ({ bg = 'sky', talk = 0.35, wave = 0, bust = false }) => (
  <AbsoluteFill style={{ background: BG[bg] ?? BG.sky }}>
    <AbsoluteFill style={{ filter: 'saturate(1.15) contrast(1.05)' }}>
      <ThreeCanvas width={1080} height={1080} camera={bust ? { fov: 30, position: [0.05, 1.5, 3.9] } : { fov: 30, position: [0.12, 1.25, 6.1] }} onCreated={({ camera }) => (bust ? camera.lookAt(0.05, 1.32, 0) : camera.lookAt(0.12, 1.02, 0))} gl={{ alpha: true, antialias: true }}>
        <hemisphereLight args={['#ffffff', '#b8c8d8', 1.3]} />
        <directionalLight position={[2.5, 4, 5]} intensity={2.2} />
        <directionalLight position={[-3, 2, 2]} intensity={0.8} color="#cfe6ff" />
        <ambientLight intensity={0.3} />
        <group position={[0, 0.05, 0]}><Hoot t={0.8} talk={talk} wave={wave} wink={bust} /></group>
        <StylePass style="real" />
      </ThreeCanvas>
    </AbsoluteFill>
  </AbsoluteFill>
);
