import React from 'react';

/**
 * Jake: a stylised young guy (hoodie, jeans, sneakers) with an expressive face.
 * Local frame: feet at y=0 when standing, facing +z. Units ≈ metres (about 1.75 tall).
 *  - pose: 'stand' | 'sit' (sit = hips at y 0.5, thighs forward) | 'lie' (whole body on its back, head toward -z)
 *  - lids 0..1 (0 open, 1 shut), brows -1..1 (-1 worried/tired, +1 surprised), mouth 0..1 (yawn/open), smile -1..1
 *  - armL / armR: [shoulder pitch (forward +), shoulder roll (out +), elbow bend]
 *  - look: [yaw, pitch] of the head
 */
export type JakeProps = {
  t: number;
  pose?: 'stand' | 'sit' | 'lie';
  lids?: number;
  brows?: number;
  mouth?: number;
  smile?: number;
  armL?: [number, number, number];
  armR?: [number, number, number];
  look?: [number, number];
  slump?: number;
  holdR?: React.ReactNode;
};

const SKIN = '#e9b48e', HAIR = '#3b2618', HOODIE = '#e2553c', JEANS = '#2f4a78', SHOE = '#f2f2f2';
const M: React.FC<{ c: string; r?: number }> = ({ c, r = 0.6 }) => <meshStandardMaterial color={c} roughness={r} />;

const Arm: React.FC<{ side: 1 | -1; a: [number, number, number]; hold?: React.ReactNode }> = ({ side, a, hold }) => (
  <group position={[side * 0.165, 1.33, 0]} rotation={[-a[0], 0, side * (0.04 + a[1])]}>
    {/* shoulder joint: keeps the arm attached to the torso in every pose */}
    <mesh><sphereGeometry args={[0.058, 14, 12]} /><M c={HOODIE} /></mesh>
    <mesh position={[0, -0.14, 0]}><capsuleGeometry args={[0.05, 0.2, 6, 12]} /><M c={HOODIE} /></mesh>
    <group position={[0, -0.28, 0]} rotation={[-a[2], 0, 0]}>
      <mesh><sphereGeometry args={[0.047, 12, 10]} /><M c={HOODIE} /></mesh>
      <mesh position={[0, -0.13, 0]}><capsuleGeometry args={[0.043, 0.2, 6, 12]} /><M c={HOODIE} /></mesh>
      <mesh position={[0, -0.28, 0]}><sphereGeometry args={[0.042, 12, 10]} /><M c={SKIN} /></mesh>
      {hold && <group position={[0, -0.31, 0.03]}>{hold}</group>}
    </group>
  </group>
);

const Leg: React.FC<{ side: 1 | -1; sit: boolean }> = ({ side, sit }) => (
  <group position={[side * 0.09, 0.86, 0]} rotation={[sit ? -Math.PI / 2 : 0, 0, 0]}>
    <mesh position={[0, -0.21, 0]}><capsuleGeometry args={[0.068, 0.32, 6, 12]} /><M c={JEANS} /></mesh>
    <group position={[0, -0.43, 0]} rotation={[sit ? Math.PI / 2 : 0, 0, 0]}>
      <mesh position={[0, -0.2, 0]}><capsuleGeometry args={[0.058, 0.32, 6, 12]} /><M c={JEANS} /></mesh>
      <mesh position={[0, -0.42, 0.05]}><boxGeometry args={[0.11, 0.08, 0.24]} /><M c={SHOE} /></mesh>
    </group>
  </group>
);

const Head: React.FC<{ lids: number; brows: number; mouth: number; smile: number; t: number }> = ({ lids, brows, mouth, smile, t }) => {
  const blink = Math.sin(t * 1.7 + 0.4) > 0.985 ? 1 : 0;
  const lid = Math.max(lids, blink);
  return (
    <group>
      {/* skull + face */}
      <mesh scale={[1, 1.1, 1]}><sphereGeometry args={[0.15, 32, 24]} /><M c={SKIN} r={0.55} /></mesh>
      {/* hair: a cap over the top and back, with a fringe */}
      <mesh position={[0, 0.03, -0.012]} scale={[1.06, 1.06, 1.06]}><sphereGeometry args={[0.15, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.42]} /><M c={HAIR} r={0.8} /></mesh>
      <mesh position={[0, 0.0, -0.03]} scale={[1.05, 1.12, 1.0]}><sphereGeometry args={[0.15, 24, 16, Math.PI * 0.6, Math.PI * 0.8, 0.2, Math.PI * 0.55]} /><M c={HAIR} r={0.8} /></mesh>
      <mesh position={[0.03, 0.115, 0.1]} rotation={[0.9, 0, -0.3]} scale={[0.09, 0.03, 0.05]}><sphereGeometry args={[1, 12, 8]} /><M c={HAIR} r={0.8} /></mesh>
      {/* ears */}
      {[-1, 1].map((s) => <mesh key={s} position={[s * 0.148, 0.0, 0]} scale={[0.4, 1, 0.7]}><sphereGeometry args={[0.04, 12, 10]} /><M c={SKIN} /></mesh>)}
      {/* eyes: white, iris, pupil, highlight, eyelid that closes from the top */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.052, 0.02, 0.128]}>
          <mesh scale={[1, 1, 0.6]}><sphereGeometry args={[0.03, 16, 12]} /><meshStandardMaterial color="#ffffff" roughness={0.3} /></mesh>
          <mesh position={[0, -0.002, 0.016]} scale={[1, 1, 0.4]}><sphereGeometry args={[0.018, 16, 12]} /><meshStandardMaterial color="#5a3a22" roughness={0.3} /></mesh>
          <mesh position={[0, -0.002, 0.022]} scale={[1, 1, 0.3]}><sphereGeometry args={[0.009, 12, 8]} /><meshBasicMaterial color="#0d0d0f" /></mesh>
          <mesh position={[0.006, 0.006, 0.025]}><sphereGeometry args={[0.004, 8, 6]} /><meshBasicMaterial color="#ffffff" /></mesh>
          {lid > 0.03 && <mesh rotation={[0.25, 0, 0]} scale={[1.08, 1.08, 0.68]}><sphereGeometry args={[0.031, 16, 12, 0, Math.PI * 2, 0, Math.PI * Math.min(1, lid)]} /><M c={'#dca27e'} /></mesh>}
          {/* tired bags */}
          {lids > 0.2 && <mesh position={[0, -0.03, 0.006]} scale={[1, 0.3, 0.4]}><sphereGeometry args={[0.03, 12, 8]} /><meshStandardMaterial color="#8a5a6a" transparent opacity={0.15 + 0.4 * lids} /></mesh>}
          {/* eyebrow */}
          <mesh position={[0, 0.045 + 0.012 * brows, 0.01]} rotation={[0, 0, Math.PI / 2 + s * (0.15 * Math.min(0, brows) * -1 - 0.08 * Math.max(0, brows))]}><capsuleGeometry args={[0.007, 0.04, 4, 8]} /><M c={HAIR} /></mesh>
        </group>
      ))}
      {/* brows lie flat (capsules are vertical by default) */}
      {/* nose */}
      <mesh position={[0, -0.02, 0.15]} scale={[0.8, 1, 1]}><sphereGeometry args={[0.018, 12, 10]} /><M c={'#e0a27f'} /></mesh>
      {/* mouth: a dark oval that opens (yawn), with a smile/frown tilt */}
      <group position={[0, -0.075, 0.133]} rotation={[0.25, 0, 0]}>
        <mesh scale={[0.028 + 0.008 * mouth, 0.006 + 0.04 * mouth, 0.01]}><sphereGeometry args={[1, 16, 10]} /><meshBasicMaterial color="#5a1f1a" /></mesh>
        {mouth < 0.3 && [-1, 1].map((s) => <mesh key={s} position={[s * 0.026, 0.004 * smile, 0.002]}><sphereGeometry args={[0.004, 8, 6]} /><meshBasicMaterial color="#5a1f1a" /></mesh>)}
      </group>
    </group>
  );
};

export const Jake: React.FC<JakeProps> = ({ t, pose = 'stand', lids = 0, brows = 0, mouth = 0, smile = 0.3, armL = [0, 0, 0.2], armR = [0, 0, 0.2], look = [0, 0], slump = 0, holdR }) => {
  const sit = pose === 'sit';
  const breathe = 0.006 * Math.sin(t * 2.1);
  const body = (
    <group position={[0, sit ? -0.36 : 0, 0]}>
      <Leg side={1} sit={sit} />
      <Leg side={-1} sit={sit} />
      <group position={[0, 0.86, 0]} rotation={[slump * 0.35, 0, 0]}>
        <group position={[0, -0.86, 0]}>
          {/* hoodie torso + hood + pocket + strings */}
          <mesh position={[0, 1.13 + breathe, 0]}><capsuleGeometry args={[0.155, 0.3, 8, 16]} /><M c={HOODIE} /></mesh>
          <mesh position={[0, 1.36, -0.09]} scale={[1.1, 0.55, 0.7]}><sphereGeometry args={[0.15, 16, 12]} /><M c={'#c9452f'} /></mesh>
          <mesh position={[0, 1.02, 0.16]} scale={[1, 0.5, 0.25]}><sphereGeometry args={[0.11, 12, 8]} /><M c={'#c9452f'} /></mesh>
          {[-1, 1].map((s) => <mesh key={s} position={[s * 0.04, 1.3, 0.155]}><capsuleGeometry args={[0.006, 0.09, 4, 6]} /><M c="#f2f2f2" /></mesh>)}
          {/* neck + head */}
          <mesh position={[0, 1.44, 0]}><cylinderGeometry args={[0.05, 0.055, 0.08, 12]} /><M c={SKIN} /></mesh>
          <group position={[0, 1.6 + breathe, 0.01]} rotation={[look[1] + slump * 0.25, look[0], 0]}>
            <Head lids={lids} brows={brows} mouth={mouth} smile={smile} t={t} />
          </group>
          <Arm side={-1} a={armL} />
          <Arm side={1} a={armR} hold={holdR} />
        </group>
      </group>
    </group>
  );
  if (pose === 'lie') return <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.12, 0]}>{body}</group>;
  return body;
};
