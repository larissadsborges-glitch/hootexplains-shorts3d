import React, { useMemo } from 'react';
import * as THREE from 'three';
import { clamp01, easeOutBack, progress, rng } from '../../lib/anim';
import type { Timings } from '../../types';
import { Burst, CameraRig } from '../../world/Props';
import { Clouds, Lights, Sky } from '../../world/World';
import { Backdrop, GroundSection } from '../house/assets';
import {
  BUF_TOP, buildElevatorTimeline, cameraPose, CAR_D, CAR_H, CAR_W, CAR_Z, carSpeed, carState, CW_BUF_TOP, CW_X,
  FLOOR_H, FLOORS, GOV, OTIS_AT, PIT_Y, RAIL_X, SHEAVE, TOP_Y, XC,
} from './timeline';

const STEEL = '#7d828a', CONCRETE = '#b9b4aa', SHAFT = '#a39e94', WALL = '#efe7d8';
const SHAFT_L = -1.4, SHAFT_R = 2.1, SHAFT_BACK = -1.25;

/** A simple person; h ≈ 1.75 units. */
const Person: React.FC<{ at: [number, number, number]; shirt: string; lift?: number; hat?: boolean; arm?: number }> = ({ at, shirt, lift = 0, hat, arm = 0 }) => (
  <group position={[at[0], at[1] + lift, at[2]]}>
    <mesh position={[0, 0.42, 0]}><boxGeometry args={[0.32, 0.84, 0.2]} /><meshStandardMaterial color="#2c3e66" /></mesh>
    <mesh position={[0, 1.12, 0]}><boxGeometry args={[0.42, 0.58, 0.24]} /><meshStandardMaterial color={shirt} flatShading /></mesh>
    <mesh position={[0, 1.58, 0]}><sphereGeometry args={[0.17, 12, 12]} /><meshStandardMaterial color="#e0b38f" /></mesh>
    <group position={[0.26, 1.36, 0]} rotation={[0, 0, arm]}>
      <mesh position={[0, -0.24, 0]}><boxGeometry args={[0.1, 0.5, 0.1]} /><meshStandardMaterial color={shirt} /></mesh>
    </group>
    {hat && (
      <mesh position={[0, 1.86, 0]}><cylinderGeometry args={[0.13, 0.13, 0.36, 12]} /><meshStandardMaterial color="#1b1b1b" /></mesh>
    )}
  </group>
);

const Building: React.FC = () => {
  const windows = useMemo(() => {
    const out: [number, number][] = [];
    for (let f = 0; f < FLOORS; f++) for (const x of [-5.6, -3.4, 3.6, 5.6]) out.push([x, f * FLOOR_H + 1.6]);
    return out;
  }, []);
  return (
    <group>
      {/* back wall of the rooms */}
      {[[-7, SHAFT_L - 0.05], [SHAFT_R + 0.05, 7]].map(([a, b], i) => (
        <mesh key={i} position={[(a + b) / 2, FLOORS * FLOOR_H / 2, -2.3]} receiveShadow>
          <boxGeometry args={[b - a, FLOORS * FLOOR_H, 0.2]} />
          <meshStandardMaterial color={WALL} roughness={0.95} />
        </mesh>
      ))}
      {windows.map(([x, y], i) => (
        <mesh key={i} position={[x, y, -2.18]}>
          <boxGeometry args={[1.2, 1.2, 0.05]} />
          <meshStandardMaterial color="#8ec5ea" roughness={0.2} />
        </mesh>
      ))}
      {/* floor slabs */}
      {Array.from({ length: FLOORS + 1 }, (_, f) => [[-7, SHAFT_L - 0.05], [SHAFT_R + 0.05, 7]].map(([a, b], i) => (
        <mesh key={`${f}${i}`} position={[(a + b) / 2, f * FLOOR_H - 0.1, -1.0]} castShadow receiveShadow>
          <boxGeometry args={[b - a, 0.22, 2.7]} />
          <meshStandardMaterial color="#d6d1c7" roughness={0.9} />
        </mesh>
      )))}
      {/* side walls of the building */}
      {[-7, 7].map((x) => (
        <mesh key={x} position={[x, FLOORS * FLOOR_H / 2, -1.0]} castShadow>
          <boxGeometry args={[0.25, FLOORS * FLOOR_H, 2.7]} />
          <meshStandardMaterial color="#e6dccb" />
        </mesh>
      ))}
      {/* shaft: back and side walls run from the pit to the machine room */}
      <mesh position={[(SHAFT_L + SHAFT_R) / 2, (PIT_Y + TOP_Y) / 2, SHAFT_BACK]} receiveShadow>
        <boxGeometry args={[SHAFT_R - SHAFT_L, TOP_Y - PIT_Y, 0.12]} />
        <meshStandardMaterial color={SHAFT} roughness={1} />
      </mesh>
      {[SHAFT_L, SHAFT_R].map((x) => (
        <mesh key={x} position={[x, (PIT_Y + TOP_Y) / 2, -0.5]} castShadow>
          <boxGeometry args={[0.1, TOP_Y - PIT_Y, 1.5]} />
          <meshStandardMaterial color={CONCRETE} />
        </mesh>
      ))}
      {/* pit, drawn on the ground's cut face */}
      <mesh position={[(SHAFT_L + SHAFT_R) / 2, PIT_Y / 2, 0.015]}>
        <planeGeometry args={[SHAFT_R - SHAFT_L, -PIT_Y]} />
        <meshStandardMaterial color="#6e6a63" roughness={1} />
      </mesh>
      {/* machine room on the roof */}
      <mesh position={[0.6, TOP_Y - 0.1, -0.6]} receiveShadow castShadow>
        <boxGeometry args={[4.6, 0.2, 1.9]} />
        <meshStandardMaterial color={CONCRETE} />
      </mesh>
      <mesh position={[0.6, TOP_Y + 1.3, -1.5]}>
        <boxGeometry args={[4.6, 2.8, 0.15]} />
        <meshStandardMaterial color="#cfc9bd" />
      </mesh>
      <mesh position={[0.6, TOP_Y + 2.75, -0.6]} castShadow>
        <boxGeometry args={[4.8, 0.2, 2.0]} />
        <meshStandardMaterial color="#8e949b" />
      </mesh>
      {/* building roof */}
      {[[-7.2, -1.7], [2.9, 7.2]].map(([a, b], i) => (
        <mesh key={`r${i}`} position={[(a + b) / 2, FLOORS * FLOOR_H + 0.15, -1.0]} castShadow>
          <boxGeometry args={[b - a, 0.3, 2.9]} />
          <meshStandardMaterial color="#9aa0a6" />
        </mesh>
      ))}
      {/* guide rails */}
      {RAIL_X.map((x) => (
        <mesh key={x} position={[x, (PIT_Y + TOP_Y) / 2, CAR_Z]}>
          <boxGeometry args={[0.08, TOP_Y - PIT_Y, 0.14]} />
          <meshStandardMaterial color={STEEL} metalness={0.5} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
};

const Car: React.FC<{ y: number; lift: number; wedges: number; t: number }> = ({ y, lift, wedges, t }) => (
  <group position={[XC, y, CAR_Z]}>
    <mesh position={[0, 0.06, 0]} receiveShadow><boxGeometry args={[CAR_W, 0.12, CAR_D]} /><meshStandardMaterial color="#9b9488" /></mesh>
    <mesh position={[0, CAR_H / 2, -CAR_D / 2 + 0.03]}><boxGeometry args={[CAR_W, CAR_H, 0.06]} /><meshStandardMaterial color="#e8e4dc" /></mesh>
    {[-1, 1].map((s) => (
      <mesh key={s} position={[s * (CAR_W / 2 - 0.03), CAR_H / 2, 0]}><boxGeometry args={[0.06, CAR_H, CAR_D]} /><meshStandardMaterial color="#dcd7ce" /></mesh>
    ))}
    <mesh position={[0, CAR_H, 0]}><boxGeometry args={[CAR_W, 0.08, CAR_D]} /><meshStandardMaterial color="#cfcac0" /></mesh>
    <mesh position={[0, CAR_H - 0.06, -0.1]}><boxGeometry args={[0.9, 0.03, 0.5]} /><meshBasicMaterial color="#fff7d6" toneMapped={false} /></mesh>
    <mesh position={[0, 1.0, -CAR_D / 2 + 0.1]}><boxGeometry args={[CAR_W - 0.2, 0.04, 0.04]} /><meshStandardMaterial color={STEEL} metalness={0.6} /></mesh>
    {/* steel sling around the car */}
    {[-1, 1].map((s) => (
      <mesh key={`s${s}`} position={[s * (CAR_W / 2 + 0.06), CAR_H / 2 + 0.15, 0]}><boxGeometry args={[0.1, CAR_H + 0.6, 0.16]} /><meshStandardMaterial color={STEEL} /></mesh>
    ))}
    <mesh position={[0, CAR_H + 0.4, 0]} castShadow><boxGeometry args={[CAR_W + 0.3, 0.18, 0.24]} /><meshStandardMaterial color={STEEL} /></mesh>
    <mesh position={[0, -0.16, 0]}><boxGeometry args={[CAR_W + 0.3, 0.16, 0.3]} /><meshStandardMaterial color={STEEL} /></mesh>
    {/* safety wedges next to each rail */}
    {RAIL_X.map((rx, i) => {
      const lx = rx - XC + (i === 0 ? 0.12 : -0.12);
      return (
        <mesh key={rx} position={[lx, -0.42 + wedges * 0.12, 0.05]}>
          <boxGeometry args={[0.14, 0.4, 0.34]} />
          <meshStandardMaterial color={wedges > 0 ? '#ff8a1f' : '#5a5f66'} emissive="#ff6a00" emissiveIntensity={wedges * (0.6 + 0.3 * Math.sin(t * 40))} />
        </mesh>
      );
    })}
    {/* governor lever */}
    <mesh position={[GOV.x + GOV.r - XC, 1.2, 0.3]} rotation={[0, 0, wedges * 0.6]}>
      <boxGeometry args={[0.32, 0.06, 0.06]} />
      <meshStandardMaterial color="#e2453c" />
    </mesh>
    <Person at={[-0.45, 0.12, -0.35]} shirt="#e2453c" lift={lift} arm={lift * 3} />
    <Person at={[0.05, 0.12, -0.5]} shirt="#2f6fd6" lift={lift * 1.2} arm={-lift * 3} />
    <Person at={[0.48, 0.12, -0.3]} shirt="#f2b632" lift={lift * 0.9} arm={lift * 2} />
  </group>
);

/** A cylinder between two points (for ropes). */
const Line: React.FC<{ a: [number, number, number]; b: [number, number, number]; r?: number; color: string; opacity?: number; glow?: number }> = ({ a, b, r = 0.025, color, opacity = 1, glow = 0 }) => {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
  const len = va.distanceTo(vb);
  const mid = va.clone().add(vb).multiplyScalar(0.5);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
  return len < 0.01 ? null : (
    <mesh position={mid} quaternion={q}>
      <cylinderGeometry args={[r, r, len, 6]} />
      <meshStandardMaterial color={color} transparent={opacity < 1} opacity={opacity} emissive={glow > 0 ? '#ffd21f' : '#000'} emissiveIntensity={glow} />
    </mesh>
  );
};

export const ElevatorScene: React.FC<{ timings: Timings; t: number }> = ({ timings, t }) => {
  const T = useMemo(() => buildElevatorTimeline(timings), [timings]);
  const pose = cameraPose(timings, T, t);
  const cs = carState(T, t);
  const v = carSpeed(T, t);
  const lift = cs.snapped && v < -1.5 && t < cs.tImpact ? Math.min(0.22, -v * 0.03) : 0;
  const carTop = cs.y + CAR_H + 0.49;
  const ropeX = [-0.25, -0.15, -0.05, 0.05, 0.15, 0.25].map((d) => XC + d);
  const ropesOn = Math.min(6, Math.floor(progress(t, T.ropes + 0.3, T.eachRope - 0.3) * 6) + 1);
  const eachP = t >= T.eachRope && t < T.cwS + 0.4 ? 1 : 0;
  const sinceSnap = t - cs.snapAt;
  const whip = (k: number) => 0.25 * Math.sin(sinceSnap * 9 + k) * Math.exp(-sinceSnap * 1.5);
  const sheaveRot = cs.snapped ? 0 : -cs.y / SHEAVE.r;
  const brakeClamp = cs.powered ? 0 : clamp01((t - T.cut) / 0.12);
  const govSpin = (t > T.allSnap && t < T.wedgeT + 0.3 ? -(t - T.allSnap) * 14 : -cs.y / GOV.r);
  const fly = t > T.allSnap && t < T.elseS ? clamp01((t - T.allSnap) / 0.6) : clamp01(-v / 6);
  const sparks = useMemo(() => Array.from({ length: 6 }, (_, i) => i), []);
  const r = useMemo(() => rng(3), []);
  void r;

  // Otis demo (flashback, off to the side)
  const otisDrop = 0.3 * clamp01((t - T.otisCut - 0.25) / 0.15);
  const ropeCut = t >= T.otisCut + 0.2;

  return (
    <>
      <CameraRig pose={pose} />
      <Sky />
      <Lights />
      <Clouds t={t} />
      <GroundSection />
      <Backdrop />
      <Building />

      {/* hoist ropes from the car's crosshead to the drive sheave */}
      {ropeX.map((x, i) => {
        const hi = t >= T.ropes && t < T.eachRope ? (i < ropesOn ? 0.8 : 0) : 0;
        const each = eachP ? (i === 2 ? 1 : 0) : 0;
        const op = eachP && i !== 2 ? 0.15 : 1;
        if (!cs.snapped) return <Line key={i} a={[x, carTop, 0]} b={[x, SHEAVE.y, 0]} color="#3a3d42" opacity={op} glow={Math.max(hi, each)} />;
        return (
          <group key={i}>
            <Line a={[x, carTop, 0]} b={[x + whip(i), carTop + 1.4, 0.1 * i]} color="#3a3d42" />
            <Line a={[x, SHEAVE.y, 0]} b={[x - whip(i + 2), SHEAVE.y - 1.8 - 0.2 * i, 0]} color="#3a3d42" />
          </group>
        );
      })}
      {/* counterweight and its ropes */}
      {[-0.1, 0, 0.1].map((d, i) => (
        cs.snapped
          ? <Line key={i} a={[CW_X + d, SHEAVE.y, -0.2]} b={[CW_X + d + whip(i + 4), SHEAVE.y - 1.5, -0.2]} color="#3a3d42" />
          : <Line key={i} a={[CW_X + d, SHEAVE.y, -0.2]} b={[CW_X + d, cs.cwY + 1.7, -0.2]} color="#3a3d42" />
      ))}
      <group position={[CW_X, cs.cwY + 0.8, -0.5]}>
        <mesh castShadow><boxGeometry args={[0.5, 1.6, 0.9]} /><meshStandardMaterial color="#4a4e55" flatShading /></mesh>
        {[-0.5, -0.1, 0.3].map((dy) => (
          <mesh key={dy} position={[0, dy, 0.46]}><boxGeometry args={[0.52, 0.03, 0.02]} /><meshStandardMaterial color="#2a2c30" /></mesh>
        ))}
      </group>

      {/* drive sheave, motor and brake in the machine room */}
      <group position={[SHEAVE.x, SHEAVE.y, -0.1]} rotation={[0, 0, sheaveRot]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[SHEAVE.r, SHEAVE.r, 0.35, 28]} /><meshStandardMaterial color="#6b7078" metalness={0.5} roughness={0.4} /></mesh>
        {[0, 1, 2].map((k) => (
          <mesh key={k} rotation={[0, 0, (k * Math.PI) / 3]} position={[0, 0, 0.19]}><boxGeometry args={[SHEAVE.r * 1.8, 0.1, 0.03]} /><meshStandardMaterial color="#3a3d42" /></mesh>
        ))}
      </group>
      <mesh position={[2.0, SHEAVE.y, -0.4]} castShadow><boxGeometry args={[0.9, 0.9, 0.8]} /><meshStandardMaterial color="#2e7d5b" flatShading /></mesh>
      <group position={[SHEAVE.x, SHEAVE.y, 0.38]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.34, 0.34, 0.16, 20]} /><meshStandardMaterial color="#b9bec4" metalness={0.6} roughness={0.3} /></mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * (0.5 - 0.13 * brakeClamp), 0, 0.02]}><boxGeometry args={[0.13, 0.46, 0.2]} /><meshStandardMaterial color="#e2453c" /></mesh>
        ))}
        <mesh position={[0, 0.55, 0]}><boxGeometry args={[0.6, 0.18, 0.24]} /><meshStandardMaterial color="#5a5f66" emissive="#3fa9ff" emissiveIntensity={cs.powered ? 0.8 + 0.4 * Math.sin(t * 30) : 0} /></mesh>
        {[-1, 1].map((s) => (
          <mesh key={`sp${s}`} position={[s * 0.75, 0, 0.02]} scale={[1 - 0.25 * brakeClamp, 1, 1]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.07, 0.07, 0.3, 8]} />
            <meshStandardMaterial color="#c9a227" />
          </mesh>
        ))}
      </group>
      <Burst t={t} t0={T.cut} at={[SHEAVE.x, SHEAVE.y + 0.6, 0.5]} seed={21} count={12} color="#7fd0ff" speed={2} up={1.5} gravity={4} life={0.5} size={0.06} />

      {/* overspeed governor: wheel at the top, rope loop down to the pit, tied to the car's lever */}
      <group position={[GOV.x, GOV.y, 0.15]} rotation={[0, 0, govSpin]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[GOV.r, GOV.r, 0.08, 20]} /><meshStandardMaterial color="#d8dce0" metalness={0.5} /></mesh>
        {[-1, 1].map((s) => (
          <group key={s} rotation={[0, 0, s * (0.25 + fly * 0.9)]}>
            <mesh position={[0, s * 0.0 + 0.22, 0.08]}><sphereGeometry args={[0.06, 10, 10]} /><meshStandardMaterial color={fly > 0.8 ? '#ff3b2f' : '#5a5f66'} /></mesh>
          </group>
        ))}
      </group>
      <Line a={[GOV.x - GOV.r, GOV.y, 0.15]} b={[GOV.x - GOV.r, PIT_Y + 0.4, 0.15]} r={0.015} color="#2a2c30" />
      <Line a={[GOV.x + GOV.r, GOV.y, 0.15]} b={[GOV.x + GOV.r, PIT_Y + 0.4, 0.15]} r={0.015} color="#2a2c30" />
      <mesh position={[GOV.x, PIT_Y + 0.4, 0.15]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[GOV.r, GOV.r, 0.06, 16]} /><meshStandardMaterial color="#8e949b" /></mesh>

      <Car y={cs.y} lift={lift} wedges={cs.wedges} t={t} />
      {cs.wedges > 0 && t < T.stopS + 0.3 && sparks.map((k) => (
        <Burst key={`sp${k}-${Math.floor(t * 6)}`} t={t} t0={Math.floor(t * 6) / 6} at={[RAIL_X[k % 2], cs.y - 0.35, CAR_Z + 0.3]} seed={Math.floor(t * 6) * 7 + k} count={6} color="#ffb347" speed={2.2} up={1.5} gravity={6} life={0.35} size={0.05} />
      ))}
      {/* sparks where the ropes snap */}
      <Burst t={t} t0={T.snap1} at={[XC, cs.y + CAR_H + 1.9, 0.2]} seed={31} count={16} color="#ffd27a" speed={3} up={2} gravity={6} life={0.6} size={0.07} />
      <Burst t={t} t0={T.allSnap} at={[XC, Math.min(SHEAVE.y - 1, 17), 0.2]} seed={33} count={18} color="#ffd27a" speed={3} up={2} gravity={6} life={0.6} size={0.07} />

      {/* pit buffers: a spring under the car, an oil buffer under the counterweight */}
      {(() => {
        const comp = clamp01((BUF_TOP - cs.y) / 0.8);
        const h = (BUF_TOP - PIT_Y) * (1 - 0.55 * comp);
        return (
          <group position={[XC, PIT_Y, CAR_Z]}>
            <mesh position={[0, 0.05, 0]}><boxGeometry args={[0.7, 0.1, 0.7]} /><meshStandardMaterial color="#5a5f66" /></mesh>
            {Array.from({ length: 7 }, (_, i) => (
              <mesh key={i} position={[0, 0.15 + (i + 0.5) * (h - 0.2) / 7, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.22, 0.04, 6, 16]} />
                <meshStandardMaterial color="#e2453c" />
              </mesh>
            ))}
            <mesh position={[0, h - 0.04, 0]}><boxGeometry args={[0.6, 0.08, 0.6]} /><meshStandardMaterial color="#5a5f66" /></mesh>
          </group>
        );
      })()}
      <group position={[CW_X, PIT_Y, -0.5]}>
        <mesh position={[0, (CW_BUF_TOP - PIT_Y) / 2 - 0.1, 0]}><cylinderGeometry args={[0.16, 0.16, CW_BUF_TOP - PIT_Y - 0.2, 12]} /><meshStandardMaterial color="#c9a227" /></mesh>
        <mesh position={[0, CW_BUF_TOP - PIT_Y - 0.1, 0]}><cylinderGeometry args={[0.08, 0.08, 0.3, 10]} /><meshStandardMaterial color="#d8dce0" metalness={0.6} /></mesh>
      </group>
      <Burst t={t} t0={cs.tImpact} at={[XC, BUF_TOP, 0.4]} seed={41} count={18} color="#d9d4c8" speed={3} up={1.2} gravity={2} life={0.9} size={0.2} />

      {/* the 1850s demonstration */}
      <group position={[OTIS_AT[0], OTIS_AT[1], -3]}>
        {[-1.05, 1.05].map((x) => (
          <group key={x}>
            <mesh position={[x, 2.4, 0]} castShadow><boxGeometry args={[0.22, 4.8, 0.22]} /><meshStandardMaterial color="#8a5a35" flatShading /></mesh>
            {Array.from({ length: 16 }, (_, i) => (
              <mesh key={i} position={[x - Math.sign(x) * 0.14, 0.6 + i * 0.25, 0]} rotation={[0, 0, Math.sign(x) * 0.6]}><boxGeometry args={[0.08, 0.12, 0.18]} /><meshStandardMaterial color="#3a3d42" /></mesh>
            ))}
          </group>
        ))}
        <mesh position={[0, 4.85, 0]} castShadow><boxGeometry args={[2.5, 0.22, 0.3]} /><meshStandardMaterial color="#8a5a35" flatShading /></mesh>
        <group position={[0, 2.5 - otisDrop, 0]}>
          <mesh castShadow><boxGeometry args={[1.85, 0.16, 1.4]} /><meshStandardMaterial color="#a8713f" flatShading /></mesh>
          {[-0.4, 0.5].map((x) => (
            <mesh key={x} position={[x, 0.45, 0.4]}><boxGeometry args={[0.35, 0.6, 0.35]} /><meshStandardMaterial color="#c9a27a" flatShading /></mesh>
          ))}
          <Person at={[0.1, 0.08, -0.2]} shirt="#3a2a20" hat arm={t >= T.otisSafe ? -2.6 : 0} />
        </group>
        {!ropeCut && <Line a={[0, 4.75, 0]} b={[0, 2.6 - otisDrop, 0]} r={0.035} color="#c2a477" />}
        {ropeCut && <Line a={[0, 4.75, 0]} b={[0.2 * Math.sin(t * 8), 4.0, 0]} r={0.035} color="#c2a477" />}
        {ropeCut && <Line a={[0, 2.6 - otisDrop, 0]} b={[-0.25, 3.0 - otisDrop, 0.1]} r={0.035} color="#c2a477" />}
        <Burst t={t} t0={T.otisCut + 0.4} at={[0, 2.3, 0.6]} seed={51} count={12} color="#d9c39a" speed={2} up={0.8} gravity={2} life={0.8} size={0.15} />
        {[-1.8, -1.0, -0.2, 0.7, 1.5, 2.2].map((x, i) => (
          <Person key={i} at={[x, 0, 1.9 + (i % 2) * 0.5]} shirt={['#6b4a3a', '#3a4a6b', '#5a3a4a', '#4a5a3a', '#6b5a3a', '#3a3a3a'][i]} hat={i % 2 === 0} arm={t >= T.otisSafe ? -2.4 - 0.2 * Math.sin(t * 8 + i) : 0} />
        ))}
      </group>

      {/* people stepping out at the end */}
      {t >= T.final && [0, 1].map((i) => (
        <Person key={i} at={[XC + 1.2 + (t - T.final) * 1.1 + i * 0.8, 0.12, CAR_Z + 0.3]} shirt={i ? '#2f6fd6' : '#e2453c'} />
      ))}
      <Burst t={t} t0={T.wedgeT} at={[RAIL_X[0], cs.y - 0.35, CAR_Z + 0.3]} seed={61} count={20} color="#ffd27a" speed={3} up={2} gravity={5} life={0.6} size={0.07} />
      {easeOutBack(0) === 0 && null}
    </>
  );
};
