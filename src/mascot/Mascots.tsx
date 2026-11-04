import React from 'react';
import * as THREE from 'three';

/** Explainland mascot candidates. Each ~2 units tall, standing on y=0, facing +z. All original designs. */

const M: React.FC<{ c: string; e?: string; ei?: number }> = ({ c, e, ei = 0 }) => <meshStandardMaterial color={c} flatShading roughness={0.6} emissive={e ?? '#000'} emissiveIntensity={ei} />;

const HardHat: React.FC<{ y: number; r: number; color?: string }> = ({ y, r, color = '#ff8a1f' }) => (
  <group position={[0, y, 0]}>
    <mesh><sphereGeometry args={[r, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /><M c={color} /></mesh>
    <mesh position={[0, 0.01, r * 0.18]}><cylinderGeometry args={[r * 1.18, r * 1.18, 0.05, 16]} /><M c={color} /></mesh>
    <mesh position={[0, r * 0.55, 0]} rotation={[0, 0, 0]}><boxGeometry args={[r * 0.18, r * 0.5, r * 1.6]} /><M c="#ffb04d" /></mesh>
  </group>
);

/** A: "Bolt", a friendly round robot with a screen face and a hard hat. */
export const Bolt: React.FC<{ t: number }> = ({ t }) => {
  const wave = 0.5 + 0.35 * Math.sin(t * 5);
  return (
    <group>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.28, 0, 0]}>
          <mesh position={[0, 0.22, 0]}><cylinderGeometry args={[0.1, 0.1, 0.4, 8]} /><M c="#3a4552" /></mesh>
          <mesh position={[0, 0.06, 0.06]}><boxGeometry args={[0.26, 0.12, 0.36]} /><M c="#ff8a1f" /></mesh>
        </group>
      ))}
      <mesh position={[0, 1.05, 0]} scale={[0.82, 0.78, 0.72]}><icosahedronGeometry args={[1, 1]} /><M c="#21b3a0" /></mesh>
      {/* screen face */}
      <mesh position={[0, 1.18, 0.62]} rotation={[-0.05, 0, 0]}><boxGeometry args={[0.8, 0.5, 0.12]} /><M c="#16202b" /></mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.18, 1.24, 0.69]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.085, 0.085, 0.03, 16]} /><meshBasicMaterial color="#7ff0ff" /></mesh>
      ))}
      <mesh position={[0, 1.1, 0.69]} rotation={[0, 0, Math.PI]}><torusGeometry args={[0.12, 0.022, 6, 16, Math.PI]} /><meshBasicMaterial color="#7ff0ff" /></mesh>
      {/* chest badge */}
      <mesh position={[0, 0.62, 0.62]} rotation={[Math.PI / 2 - 0.3, 0, 0]}><cylinderGeometry args={[0.11, 0.11, 0.04, 6]} /><M c="#ffd21f" /></mesh>
      {/* arms: left down, right waving */}
      <group position={[-0.78, 1.0, 0]} rotation={[0, 0, -0.35]}>
        <mesh position={[0, -0.25, 0]}><cylinderGeometry args={[0.07, 0.07, 0.5, 8]} /><M c="#3a4552" /></mesh>
        <mesh position={[0, -0.55, 0]}><sphereGeometry args={[0.13, 10, 10]} /><M c="#ff8a1f" /></mesh>
      </group>
      <group position={[0.78, 1.1, 0]} rotation={[0, 0, wave + 1.6]}>
        <mesh position={[0, -0.25, 0]}><cylinderGeometry args={[0.07, 0.07, 0.5, 8]} /><M c="#3a4552" /></mesh>
        <mesh position={[0, -0.55, 0]}><sphereGeometry args={[0.13, 10, 10]} /><M c="#ff8a1f" /></mesh>
      </group>
      <HardHat y={1.62} r={0.48} />
    </group>
  );
};

/** B: "Hoot", a low-poly owl engineer with big round glasses and a pencil. */
/** tired: 0..1 droops the eyelids and darkens the eye bags; asleep: 0..1 closes the eyes fully. */
/** talk: 0..1 beak openness (drive it from timings.mouth for lip sync). */
export const Hoot: React.FC<{ t: number; nose?: number; wave?: number; tired?: number; asleep?: number; talk?: number; wink?: boolean }> = ({ t, nose = 0, wave = 0, tired = 0, asleep = 0, talk = 0, wink = false }) => {
  const blink = Math.sin(t * 1.3) > 0.97 ? 0.15 : 1;
  // eyelid cap angle from the top of the eye: 0 = open, PI = shut
  const lid = Math.min(Math.PI, Math.max(tired * 0.5 * Math.PI, asleep * Math.PI));
  return (
    <group>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.22, 0.05, 0.25]}><boxGeometry args={[0.24, 0.08, 0.3]} /><M c="#ff9a2e" /></mesh>
      ))}
      <mesh position={[0, 0.95, 0]} scale={[0.78, 0.95, 0.7]}><icosahedronGeometry args={[1, 1]} /><M c="#7a5236" /></mesh>
      <mesh position={[0, 0.78, 0.36]} scale={[0.55, 0.62, 0.4]}><icosahedronGeometry args={[1, 1]} /><M c="#e9d3b0" /></mesh>
      {/* ear tufts */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.45, 1.85, 0]} rotation={[0, 0, -s * 0.35]}><coneGeometry args={[0.14, 0.38, 5]} /><M c="#5d3d27" /></mesh>
      ))}
      {/* eyes + round glasses */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.26, 1.36, 0.55]}>
          {wink && s === 1
            ? <mesh position={[0, -0.03, 0.2]}><torusGeometry args={[0.11, 0.028, 8, 24, Math.PI]} /><M c="#14181c" /></mesh>
            : <><mesh scale={[1, blink, 1]}><sphereGeometry args={[0.2, 14, 14]} /><M c="#ffffff" /></mesh>
              <mesh position={[0, 0, 0.15]} scale={[1, blink, 1]}><sphereGeometry args={[0.09, 12, 12]} /><M c="#14181c" /></mesh></>}
          {!(wink && s === 1) && lid < 1.2 && <mesh position={[0.03, 0.04, 0.22]}><sphereGeometry args={[0.025, 8, 8]} /><meshBasicMaterial color="#ffffff" /></mesh>}
          {!(wink && s === 1) && lid > 0.05 && <mesh rotation={[0.35, 0, 0]}><sphereGeometry args={[0.25, 16, 12, 0, Math.PI * 2, 0, lid]} /><M c="#6b4630" /></mesh>}
          {tired > 0.05 && <mesh position={[0, -0.2, 0.08]} scale={[1, 0.35, 0.5]}><sphereGeometry args={[0.17, 12, 8]} /><meshStandardMaterial color="#5a3a52" transparent opacity={0.25 + 0.5 * tired} /></mesh>}
          <mesh position={[0, 0, 0.12]}><torusGeometry args={[0.25, 0.035, 8, 20]} /><M c="#1f2a44" /></mesh>
        </group>
      ))}
      <mesh position={[0, 1.36, 0.69]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.02, 0.02, 0.06, 6]} /><M c="#1f2a44" /></mesh>
      {/* the beak: ONE cone split into a top and a bottom half, hinged at the face; talking parts the halves */}
      <group position={[0, 1.18, 0.66]} rotation={[0.55, 0, 0]}>
        <group rotation={[-0.22 * talk, 0, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.12]} scale={[1.1, 1, 1]}><coneGeometry args={[0.1, 0.24, 16, 1, true, Math.PI / 2, Math.PI]} /><M c="#ff9a2e" /></mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.12]} scale={[1.09, 0.99, 0.99]}><coneGeometry args={[0.1, 0.24, 16, 1, true, Math.PI / 2, Math.PI]} /><meshStandardMaterial color="#7a2418" side={THREE.BackSide} /></mesh>
        </group>
        <group rotation={[0.5 * talk, 0, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.1]} scale={[1.05, 0.85, 0.85]}><coneGeometry args={[0.1, 0.24, 16, 1, true, -Math.PI / 2, Math.PI]} /><M c="#e8851f" /></mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.1]} scale={[1.04, 0.84, 0.84]}><coneGeometry args={[0.1, 0.24, 16, 1, true, -Math.PI / 2, Math.PI]} /><meshStandardMaterial color="#7a2418" side={THREE.BackSide} /></mesh>
        </group>
        <mesh position={[0, 0, 0.005]}><circleGeometry args={[0.1, 20]} /><meshStandardMaterial color="#5a1a12" /></mesh>
      </group>
      {/* wings: one holding a pencil up like a pointer */}
      {/* left wing: rests by the body, or pinches the beak ("it stinks!") */}
      <mesh position={[-0.72 + 0.5 * nose, 0.95 + 0.2 * nose, 0.6 * nose]} rotation={[0.3 * nose, 0.4 * nose, 0.25 - 1.6 * nose]} scale={[0.18, 0.5, 0.4]}><icosahedronGeometry args={[1, 0]} /><M c="#5d3d27" /></mesh>
      <group position={[0.7, 1.05, 0.1]} rotation={[0, 0, -0.9 - 0.15 * Math.sin(t * 4) - wave * (0.5 + 0.4 * Math.sin(t * 9))]}>
        <mesh scale={[0.18, 0.5, 0.4]}><icosahedronGeometry args={[1, 0]} /><M c="#5d3d27" /></mesh>
        <group position={[0, 0.45, 0.1]}>
          <mesh><cylinderGeometry args={[0.04, 0.04, 0.6, 6]} /><M c="#ffd21f" /></mesh>
          <mesh position={[0, 0.34, 0]}><coneGeometry args={[0.04, 0.1, 6]} /><M c="#e9d3b0" /></mesh>
        </group>
      </group>
      {/* little bow tie in the brand colour */}
      <group position={[0, 0.9, 0.76]} rotation={[-0.45, 0, 0]} scale={1.25}>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.1, 0, 0]} rotation={[0, 0, s * Math.PI / 2]}><coneGeometry args={[0.09, 0.2, 3]} /><M c="#21b3a0" /></mesh>
        ))}
        <mesh><boxGeometry args={[0.07, 0.07, 0.07]} /><M c="#178a7a" /></mesh>
      </group>
    </group>
  );
};

/** C: "Max", a human engineer: round head, round glasses, teal jacket, hard hat, tablet. */
export const Max: React.FC<{ t: number }> = ({ t }) => (
  <group scale={1.05}>
    {[-1, 1].map((s) => (
      <group key={s} position={[s * 0.15, 0, 0]}>
        <mesh position={[0, 0.42, 0]}><boxGeometry args={[0.2, 0.84, 0.24]} /><M c="#2c3e66" /></mesh>
        <mesh position={[0, 0.05, 0.06]}><boxGeometry args={[0.24, 0.1, 0.36]} /><M c="#ffffff" /></mesh>
      </group>
    ))}
    <mesh position={[0, 1.2, 0]}><boxGeometry args={[0.66, 0.78, 0.34]} /><M c="#21b3a0" /></mesh>
    <mesh position={[0, 1.2, 0.175]}><boxGeometry args={[0.06, 0.74, 0.01]} /><M c="#178a7a" /></mesh>
    <mesh position={[0, 1.66, 0]}><cylinderGeometry args={[0.1, 0.12, 0.14, 8]} /><M c="#c99a78" /></mesh>
    <mesh position={[0, 1.95, 0]}><sphereGeometry args={[0.3, 14, 12]} /><M c="#c99a78" /></mesh>
    {[-1, 1].map((s) => (
      <group key={s} position={[s * 0.12, 1.97, 0.27]}>
        <mesh><torusGeometry args={[0.085, 0.018, 6, 16]} /><M c="#1f2a44" /></mesh>
        <mesh position={[0, 0, -0.01]}><sphereGeometry args={[0.035, 8, 8]} /><M c="#14181c" /></mesh>
      </group>
    ))}
    <mesh position={[0, 1.83, 0.28]} rotation={[0, 0, Math.PI]}><torusGeometry args={[0.07, 0.015, 6, 12, Math.PI]} /><M c="#6b3a2a" /></mesh>
    <HardHat y={2.12} r={0.31} color="#ffd21f" />
    {/* arms: one pointing up, one holding a tablet */}
    <group position={[0.4, 1.5, 0]} rotation={[0, 0, 2.6 + 0.1 * Math.sin(t * 4)]}>
      <mesh position={[0, -0.3, 0]}><boxGeometry args={[0.15, 0.6, 0.15]} /><M c="#21b3a0" /></mesh>
      <mesh position={[0, -0.64, 0]}><sphereGeometry args={[0.08, 8, 8]} /><M c="#c99a78" /></mesh>
    </group>
    <group position={[-0.42, 1.5, 0.05]} rotation={[0, 0, -0.25]}>
      <mesh position={[0, -0.3, 0]}><boxGeometry args={[0.15, 0.6, 0.15]} /><M c="#21b3a0" /></mesh>
      <mesh position={[0.12, -0.6, 0.2]} rotation={[-0.3, 0, 0.25]}><boxGeometry args={[0.45, 0.32, 0.04]} /><M c="#1f2a44" /></mesh>
      <mesh position={[0.125, -0.595, 0.225]} rotation={[-0.3, 0, 0.25]}><boxGeometry args={[0.38, 0.25, 0.01]} /><meshBasicMaterial color="#7ff0ff" /></mesh>
    </group>
  </group>
);

export const Podium: React.FC = () => (
  <>
    <mesh position={[0, -0.15, 0]} receiveShadow><cylinderGeometry args={[1.3, 1.4, 0.3, 24]} /><meshStandardMaterial color="#f2f1ec" flatShading /></mesh>
    <mesh position={[0, -0.32, 0]}><cylinderGeometry args={[1.42, 1.42, 0.06, 24]} /><meshStandardMaterial color="#21b3a0" /></mesh>
  </>
);

export const MascotStage: React.FC<{ which: string; t: number }> = ({ which, t }) => {
  const C = which === 'bolt' ? Bolt : which === 'hoot' ? Hoot : Max;
  return (
    <>
      <color attach="background" args={['#cfe8ff']} />
      <hemisphereLight args={['#ffffff', '#9ab0c4', 1.4]} />
      <directionalLight position={[3, 6, 5]} intensity={2.4} castShadow />
      <ambientLight intensity={0.3} />
      <group rotation={[0, -0.35, 0]}><Podium /><C t={t} /></group>
      <mesh position={[0, -0.36, -3]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[40, 40]} /><meshStandardMaterial color="#b8d6ef" side={THREE.DoubleSide} /></mesh>
    </>
  );
};
