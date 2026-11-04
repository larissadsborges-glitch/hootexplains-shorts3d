import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { MascotStage } from './Mascots';

const NAMES: Record<string, [string, string]> = {
  bolt: ['A · BOLT', 'friendly robot engineer'],
  hoot: ['B · HOOT', 'owl professor'],
  max: ['C · MAX', 'human engineer'],
};

export const MascotStill: React.FC<{ which: string }> = ({ which }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const [name, sub] = NAMES[which];
  return (
    <AbsoluteFill style={{ background: '#cfe8ff' }}>
      <ThreeCanvas width={width} height={height} shadows camera={{ fov: 32, position: [0, 1.6, 7.2] }} onCreated={({ camera }) => camera.lookAt(0, 1.05, 0)}>
        <MascotStage which={which} t={frame / fps} />
      </ThreeCanvas>
      <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 170 }}>
        <div style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 96, color: '#1f2a44' }}>{name}</div>
        <div style={{ fontFamily: 'Montserrat', fontWeight: 800, fontSize: 44, color: '#3d5a73' }}>{sub}</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
