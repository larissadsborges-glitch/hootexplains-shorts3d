import React from 'react';
import { AbsoluteFill } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { Hoot } from './Mascots';
import { StylePass } from '../style/StylePass';

/**
 * Store artwork: Hoot on a TRANSPARENT background, for print-on-demand merch
 * (t-shirts, mugs, stickers, posters). Render as PNG:
 *   npx remotion still build_x Merch out/store/hoot_full.png --image-format=png --props='{"pose":"full"}'
 * Use --scale=2 (or more) for print resolution.
 * pose: "full" = whole owl with the pencil up; "bust" = winking close-up.
 */
export type MerchProps = { pose?: 'full' | 'bust'; talk?: number; wave?: number };

export const Merch: React.FC<MerchProps> = ({ pose = 'full', talk = 0.35, wave = 0 }) => {
  const bust = pose === 'bust';
  return (
    <AbsoluteFill style={{ backgroundColor: 'transparent' }}>
      <AbsoluteFill style={{ filter: 'saturate(1.15) contrast(1.05)' }}>
        <ThreeCanvas
          width={1080}
          height={1080}
          camera={bust ? { fov: 30, position: [0.05, 1.5, 3.9] } : { fov: 30, position: [0.12, 1.15, 6.4] }}
          onCreated={({ camera }) => (bust ? camera.lookAt(0.05, 1.32, 0) : camera.lookAt(0.12, 1.0, 0))}
          gl={{ alpha: true, antialias: true, premultipliedAlpha: false, preserveDrawingBuffer: true }}
        >
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
};
