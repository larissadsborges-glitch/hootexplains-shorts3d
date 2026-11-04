import React, { useMemo } from 'react';
import * as THREE from 'three';
import { clamp01, easeOutCubic, progress, rng } from '../../lib/anim';
import type { Timings } from '../../types';
import { CameraRig } from '../../world/Props';
import { Hoot } from '../../mascot/Mascots';
import { GradSky, PlaceLights } from '../learjet/assets';
import {
  bendMorph, buildSinkTimeline, cameraPose, CEIL_Y, DRAIN_Y, flowing, hasVent, HOOT_AT, RIM_Y, ROOF_TOP, SEWER_Y, STACK_X, STRAP,
  U_CX, U_CY, U_R, VENT_TOP, waterLevel, WEIR_Y, type SinkTimeline,
} from './timeline';

const V = (x: number, y: number, z = 0) => new THREE.Vector3(x, y, z);
const PIPE = '#dfe3e8';

/** Points along a polyline at arc-length fraction u (0..1). */
const along = (pts: THREE.Vector3[], u: number) => {
  const lens = pts.slice(1).map((p, i) => p.distanceTo(pts[i]));
  const total = lens.reduce((a, b) => a + b, 0);
  let d = clamp01(u) * total;
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i]) return pts[i].clone().lerp(pts[i + 1], d / lens[i]);
    d -= lens[i];
  }
  return pts[pts.length - 1].clone();
};

const arc = (cx: number, cy: number, r: number, a0: number, a1: number, n = 12) =>
  Array.from({ length: n + 1 }, (_, i) => { const a = a0 + ((a1 - a0) * i) / n; return V(cx + r * Math.cos(a), cy + r * Math.sin(a)); });

/** U-trap route from the drain to the stack. */
const U_PATH = [V(0, DRAIN_Y), V(0, U_CY), ...arc(U_CX, U_CY, U_R, Math.PI, 2 * Math.PI).slice(1), V(2 * U_CX, WEIR_Y), V(STACK_X, WEIR_Y - 0.02)];
const STRAIGHT_PATH = [V(0, DRAIN_Y), V(0, SEWER_Y)];
const STACK_DOWN = [V(STACK_X, WEIR_Y), V(STACK_X, SEWER_Y)];
const VENT_UP = [V(STACK_X, WEIR_Y), V(STACK_X, VENT_TOP)];

/** A pipe drawn as a see-through tube along a polyline. */
const Pipe: React.FC<{ pts: THREE.Vector3[]; r?: number; opacity?: number; color?: string; glow?: number; offset?: number[] }> = ({ pts, r = 0.055, opacity = 0.45, color = PIPE, glow = 0, offset = [0, 0, 0] }) => {
  const geo = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.01), Math.max(16, pts.length * 8), r, 12, false), [pts, r]);
  if (opacity <= 0.01) return null;
  return (
    <mesh geometry={geo} position={offset as [number, number, number]}>
      <meshStandardMaterial color={color} transparent opacity={opacity} roughness={0.25} metalness={0.1} emissive="#ffd21f" emissiveIntensity={glow} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
};

/** Water inside the U: both sides fill to the same level (a U-tube), capped at the weir. */
const UWater: React.FC<{ level: number; offset?: number[]; sTrap?: boolean }> = ({ level, offset = [0, 0, 0], sTrap }) => {
  const bottom = U_CY - U_R;
  const y = bottom + 0.03 + (WEIR_Y - bottom - 0.03) * level;
  const pts = useMemo(() => {
    if (level < 0.04) return null;
    const out: THREE.Vector3[] = [];
    if (y > U_CY) out.push(V(0, y));
    for (const p of arc(U_CX, U_CY, U_R, Math.PI, 2 * Math.PI, 16)) if (p.y <= y + 1e-6) out.push(p);
    if (y > U_CY) out.push(V(2 * U_CX, Math.min(y, WEIR_Y)));
    // trim the arc ends to the water level when it's below the arc's top
    if (y <= U_CY) {
      const a = Math.acos(Math.max(-1, Math.min(1, (y - U_CY) / -U_R)));
      return arc(U_CX, U_CY, U_R, 1.5 * Math.PI - a, 1.5 * Math.PI + a, 12);
    }
    return out;
  }, [y, level]);
  void sTrap;
  if (!pts || pts.length < 2) return null;
  return <Pipe pts={pts} r={0.046} opacity={0.95} color="#2f8fe0" offset={offset} />;
};

/** Particles travelling along a path: water drops, gas puffs, air bubbles. */
const Stream: React.FC<{ pts: THREE.Vector3[]; t: number; t0: number; t1: number; n: number; speed: number; color: string; size: number; opacity?: number; seed?: number; spread?: number; offset?: number[] }> = ({
  pts, t, t0, t1, n, speed, color, size, opacity = 1, seed = 1, spread = 0.02, offset = [0, 0, 0],
}) => {
  const ph = useMemo(() => { const r = rng(seed); return Array.from({ length: n }, () => [r(), r() - 0.5, r() - 0.5, 0.7 + r() * 0.6]); }, [n, seed]);
  if (t < t0 || t > t1 + 1 / speed) return null;
  return (
    <group position={offset as [number, number, number]}>
      {ph.map(([p, dx, dz, s], i) => {
        const frac = ((t - t0) * speed + p) % 1;
        const spawnT = t - frac / speed;
        if (spawnT < t0 - 1e-3 || spawnT > t1) return null;
        const q = along(pts, frac);
        return (
          <mesh key={i} position={[q.x + dx * spread, q.y, q.z + dz * spread]} scale={size * s}>
            <icosahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color={color} transparent={opacity < 1} opacity={opacity} flatShading emissive={color} emissiveIntensity={0.25} depthWrite={opacity >= 1} />
          </mesh>
        );
      })}
    </group>
  );
};

/** The green "smell" haze spreading into the room. */
const StinkCloud: React.FC<{ a: number; t: number; at: number[] }> = ({ a, t, at }) => {
  const blobs = useMemo(() => { const r = rng(7); return Array.from({ length: 14 }, () => [(r() - 0.5) * 2.2, r() * 1.6, (r() - 0.3) * 1.2, 0.25 + r() * 0.35, r() * 6]); }, []);
  if (a <= 0.01) return null;
  return (
    <group position={at as [number, number, number]}>
      {blobs.map(([x, y, z, s, ph], i) => (
        <mesh key={i} position={[x * a, 0.1 + y * a + 0.05 * Math.sin(t * 2 + ph), z * a]} scale={s * (0.4 + 0.6 * a)}>
          <icosahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color="#9bd34a" transparent opacity={0.28 * a} flatShading depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
};

/** Sink, vanity, tap. */
const Vanity: React.FC<{ at?: number[]; tapOn?: number }> = ({ at = [0, 0, 0], tapOn = 0 }) => (
  <group position={at as [number, number, number]}>
    {/* cabinet: back + sides only (cutaway front) */}
    <mesh position={[0, 0.42, -0.33]}><boxGeometry args={[1.0, 0.84, 0.03]} /><meshStandardMaterial color="#d9c7a7" /></mesh>
    {[-1, 1].map((s) => <mesh key={s} position={[s * 0.5, 0.42, -0.05]}><boxGeometry args={[0.03, 0.84, 0.6]} /><meshStandardMaterial color="#c9b493" /></mesh>)}
    {/* counter with the basin cut open */}
    {[-1, 1].map((s) => <mesh key={s} position={[s * 0.36, RIM_Y - 0.02, -0.05]}><boxGeometry args={[0.32, 0.05, 0.62]} /><meshStandardMaterial color="#f4f2ee" /></mesh>)}
    <mesh position={[0, RIM_Y - 0.02, -0.29]}><boxGeometry args={[0.42, 0.05, 0.14]} /><meshStandardMaterial color="#f4f2ee" /></mesh>
    <mesh position={[0, (RIM_Y + DRAIN_Y) / 2, -0.05]}>
      <cylinderGeometry args={[0.2, 0.06, RIM_Y - DRAIN_Y, 20, 1, true]} />
      <meshStandardMaterial color="#ffffff" side={THREE.DoubleSide} roughness={0.2} />
    </mesh>
    {/* tap */}
    <mesh position={[0, RIM_Y + 0.12, -0.27]}><cylinderGeometry args={[0.025, 0.03, 0.24, 10]} /><meshStandardMaterial color="#c9ced4" metalness={0.8} roughness={0.25} /></mesh>
    <mesh position={[0, RIM_Y + 0.23, -0.2]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.02, 0.02, 0.15, 10]} /><meshStandardMaterial color="#c9ced4" metalness={0.8} roughness={0.25} /></mesh>
    {tapOn > 0 && (
      <mesh position={[0, RIM_Y + 0.07, -0.13]}><cylinderGeometry args={[0.012, 0.016, 0.3, 8]} /><meshStandardMaterial color="#7cc4ff" transparent opacity={0.85 * tapOn} emissive="#7cc4ff" emissiveIntensity={0.3} /></mesh>
    )}
  </group>
);

/** Bathroom + house cross-section. */
const House: React.FC = () => (
  <group>
    {/* floor slab, ceiling slab */}
    <mesh position={[0, -0.12, -0.3]} receiveShadow><boxGeometry args={[5.2, 0.25, 1.4]} /><meshStandardMaterial color="#c9c3b8" /></mesh>
    <mesh position={[0, CEIL_Y + 0.1, -0.3]}><boxGeometry args={[5.2, 0.2, 1.4]} /><meshStandardMaterial color="#e6e1d8" /></mesh>
    {/* back wall with tiles */}
    <mesh position={[0, CEIL_Y / 2, -0.38]} receiveShadow><boxGeometry args={[5.2, CEIL_Y, 0.06]} /><meshStandardMaterial color="#cfe6ee" /></mesh>
    {Array.from({ length: 9 }, (_, i) => <mesh key={i} position={[-2.4 + i * 0.6, 1.2, -0.345]}><boxGeometry args={[0.01, 2.4, 0.005]} /><meshBasicMaterial color="#b4d2dc" /></mesh>)}
    {Array.from({ length: 4 }, (_, i) => <mesh key={`h${i}`} position={[0, 0.3 + i * 0.6, -0.345]}><boxGeometry args={[5.2, 0.01, 0.005]} /><meshBasicMaterial color="#b4d2dc" /></mesh>)}
    {/* side walls */}
    {[-2.6, 2.6].map((x) => <mesh key={x} position={[x, CEIL_Y / 2, -0.3]}><boxGeometry args={[0.15, CEIL_Y + 0.2, 1.4]} /><meshStandardMaterial color="#efe7d8" /></mesh>)}
    {/* back half of a pitched roof (front half cut away) + gable ends */}
    <RoofSlope />
    {/* ground under the house: cut face of the soil, behind the pipes */}
    <mesh position={[0, -1.25, -0.6]}><boxGeometry args={[8, 2.0, 1.0]} /><meshStandardMaterial color="#8a6b4c" flatShading /></mesh>
    <mesh position={[0, -2.6, -0.4]}><boxGeometry args={[8, 0.8, 1.4]} /><meshStandardMaterial color="#6e553c" /></mesh>
    {/* the sewer pipe */}
    <mesh position={[0, SEWER_Y, -0.02]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.2, 0.2, 8, 16]} /><meshStandardMaterial color="#8c5a3a" transparent opacity={0.85} /></mesh>
  </group>
);

const RoofSlope: React.FC = () => {
  const g = useMemo(() => {
    const shape = new THREE.Shape([new THREE.Vector2(-1.6, CEIL_Y + 0.2), new THREE.Vector2(0, ROOF_TOP), new THREE.Vector2(0.15, ROOF_TOP), new THREE.Vector2(-1.45, CEIL_Y + 0.2)]);
    return new THREE.ExtrudeGeometry(shape, { depth: 5.6, bevelEnabled: false });
  }, []);
  return (
    <group>
      {/* the back slope: in the z-y plane, extruded along x */}
      <mesh geometry={g} rotation={[0, Math.PI / 2, 0]} position={[-2.8, 0, -0.35]} castShadow>
        <meshStandardMaterial color="#c0684a" flatShading />
      </mesh>
      {/* gable end walls */}
      {[-2.6, 2.6].map((x) => (
        <mesh key={x} position={[x, 0, -0.35]} rotation={[0, Math.PI / 2, 0]}>
          <shapeGeometry args={[new THREE.Shape([new THREE.Vector2(-1.6, CEIL_Y + 0.2), new THREE.Vector2(0, ROOF_TOP), new THREE.Vector2(0, CEIL_Y + 0.2)])]} />
          <meshStandardMaterial color="#efe7d8" side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
};

/** S-trap comparison: same sink, S-shaped pipe straight down into the floor. */
const STrap: React.FC<{ T: SinkTimeline; t: number }> = ({ T, t }) => {
  const P = STRAP;
  const path = useMemo(() => [V(0, DRAIN_Y), V(0, U_CY), ...arc(U_CX, U_CY, U_R, Math.PI, 2 * Math.PI).slice(1), V(2 * U_CX, WEIR_Y), ...arc(3 * U_CX, WEIR_Y, U_R, Math.PI, 0, 10).slice(1), V(4 * U_CX, -0.25)], []);
  const lvl = 1 - 0.9 * easeOutCubic(progress(t, T.strapBan - 0.2, T.strapBan + 0.9));
  const draining = t > T.strapBan - 0.3 && t < T.strapBan + 0.9;
  return (
    <group>
      <group position={P as [number, number, number]}>
        <mesh position={[0.3, -0.12, -0.3]}><boxGeometry args={[2.4, 0.25, 1.4]} /><meshStandardMaterial color="#c9c3b8" /></mesh>
        <mesh position={[0.3, 1.0, -0.38]}><boxGeometry args={[2.4, 2.2, 0.06]} /><meshStandardMaterial color="#e9dcc6" /></mesh>
        <Vanity />
        <Pipe pts={path} glow={0.15} />
        <UWater level={lvl} sTrap />
        {draining && <Stream pts={path} t={t} t0={T.strapBan - 0.3} t1={T.strapBan + 0.6} n={14} speed={1.6} color="#2f8fe0" size={0.03} seed={41} />}
      </group>
    </group>
  );
};

/** Gold ring that falls into the drain and settles in the bottom of the U. */
const Ring: React.FC<{ T: SinkTimeline; t: number; drop: number }> = ({ T, t, drop }) => {
  if (t < T.ring + 0.3) return null;
  const p = progress(t, T.ring + 0.3, T.ring + 1.8);
  const path = [V(0.05, RIM_Y + 0.25, 0.05), V(0, DRAIN_Y), V(0, U_CY), V(U_CX - 0.02, U_CY - U_R + 0.03)];
  const q = along(path, easeOutCubic(p));
  return (
    <mesh position={[q.x, q.y - drop, q.z]} rotation={[Math.PI / 2 - p * 2, p * 4, 0]}>
      <torusGeometry args={[0.03, 0.009, 8, 20]} />
      <meshStandardMaterial color="#ffcf3a" metalness={0.9} roughness={0.2} emissive="#ffb000" emissiveIntensity={0.4} />
    </mesh>
  );
};

/** Slip nuts at the joints of the U (where you unscrew it). */
const SlipNuts: React.FC<{ glow: number; drop: number }> = ({ glow, drop }) => (
  <>
    {[[0, U_CY + 0.1, 0], [2 * U_CX, WEIR_Y - 0.02, 0]].map(([x, y], i) => (
      <mesh key={i} position={[x, y - (i === 0 ? 0 : 0) - drop * 0, 0]} rotation={[i === 0 ? 0 : 0, 0, 0]}>
        <cylinderGeometry args={[0.075, 0.075, 0.05, 6]} />
        <meshStandardMaterial color={glow > 0 ? '#ffd21f' : '#bfc5cc'} emissive="#ffd21f" emissiveIntensity={glow} flatShading />
      </mesh>
    ))}
  </>
);

export const SinkScene: React.FC<{ timings: Timings; t: number }> = ({ timings, t }) => {
  const T = useMemo(() => buildSinkTimeline(timings), [timings]);
  const pose = cameraPose(timings, T, t);
  const m = bendMorph(T, t);
  const lvl = waterLevel(T, t);
  const vent = hasVent(T, t);
  const outside = t >= T.roof && t < T.strap;
  const inS = t >= T.strap && t < T.evap;
  const flow = flowing(T, t);
  const straightPhase = t >= T.straight && t < T.bend + 1.2;
  // gas reaches the room when nothing blocks it: straight pipe, or a dried-out U
  const gasStraight = t >= T.sewerGas + 0.6 && t < T.bend + 0.6;
  const stinkA = Math.max(
    easeOutCubic(progress(t, T.stink - 0.3, T.stink + 1.4)) * (1 - progress(t, T.bend, T.bend + 0.9)),
    easeOutCubic(progress(t, T.evaporates + 0.4, T.evaporates + 1.6)) * (1 - progress(t, T.tap, T.tap + 0.9)),
  );
  const nose = Math.max(clamp01((stinkA - 0.3) / 0.4), 0);
  const ringDrop = 0.18 * easeOutCubic(progress(t, T.unscrew + 0.3, T.unscrew + 1.0));
  const nutGlow = t >= T.unscrew - 0.2 && t < T.final ? 0.6 + 0.3 * Math.sin(t * 8) : 0;
  const glowU = t < T.straight ? 0.25 + 0.15 * Math.sin(t * 4) : 0;
  const tapOn = t >= T.tap && t < T.tap + 1.0 ? 1 : (t >= T.seal + 0.05 && t < T.seal + 1.2) || (t >= T.suck - 0.4 && t < T.suck + 0.8) || (t >= T.air && t < T.air + 0.8) || (t >= T.straight + 0.3 && t < T.sewerGas + 0.4) ? 1 : 0;
  const uPathDrop = useMemo(() => U_PATH.map((p) => p.clone()), []);
  const look = outside ? { top: '#3f8fe0', hor: '#cfe6ff', fog: '#d8ecff' } : { top: '#e9eef3', hor: '#f4f6f8', fog: '#f4f6f8' };
  return (
    <>
      <CameraRig pose={pose} />
      <GradSky at={pose.pos} top={look.top} hor={look.hor} bottom={outside ? '#9cc06a' : look.hor} />
      <PlaceLights target={pose.target} fog={look.fog} near={30} far={200} sun={2.0} hemi={['#ffffff', '#b9c4cc', 1.5]} />
      {!inS && (
        <group>
          <House />
          {outside && (
            <mesh position={[0, -0.01, 2]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[40, 30]} /><meshStandardMaterial color="#8fbf5a" /></mesh>
          )}
          <Vanity tapOn={tapOn} />
          {/* straight pipe (the bad idea) and the U (the fix) cross-fade */}
          <Pipe pts={STRAIGHT_PATH} opacity={0.45 * (1 - m) * (straightPhase || t < T.straight ? 1 : 0)} />
          <group position={[0, -ringDrop, 0]}>
            <Pipe pts={uPathDrop} opacity={0.45 * m} glow={glowU} />
            {m > 0.5 && <UWater level={lvl} />}
            {m > 0.5 && <SlipNuts glow={nutGlow} drop={ringDrop} />}
            <Ring T={T} t={t} drop={0} />
          </group>
          {/* the stack in the wall, down to the sewer and (once added) up to the roof */}
          <Pipe pts={STACK_DOWN} opacity={0.45 * m} />
          <Pipe pts={VENT_UP} opacity={vent ? 0.85 : 0} color="#aab3bd" glow={t >= T.vent && t < T.roof + 1 ? 0.5 + 0.2 * Math.sin(t * 6) : 0} r={0.07} />
          {vent && <mesh position={[STACK_X, VENT_TOP + 0.05, 0]}><cylinderGeometry args={[0.075, 0.075, 0.1, 12]} /><meshStandardMaterial color="#9aa3ad" /></mesh>}

          {/* water running through */}
          {flow && straightPhase && t < T.bend && <Stream pts={STRAIGHT_PATH} t={t} t0={T.straight + 0.3} t1={T.sewerGas + 0.4} n={14} speed={1.8} color="#2f8fe0" size={0.03} seed={3} />}
          {flow && pipeFlowOn(T, t) && <Stream pts={[...U_PATH, V(STACK_X, SEWER_Y)]} t={t} t0={flowStart(T, t)} t1={flowStart(T, t) + 0.9} n={t >= T.suck - 0.2 && t < T.suck + 1 ? 30 : 14} speed={1.5} color="#2f8fe0" size={t >= T.suck - 0.2 && t < T.suck + 1 ? 0.045 : 0.03} seed={5} />}
          {/* sewer gas */}
          {t >= T.sewerGas && t < T.bend + 0.6 && (
            <Stream pts={[V(-2.6, SEWER_Y), V(0, SEWER_Y), V(0, DRAIN_Y), V(0, DRAIN_Y + 0.5)]} t={t} t0={T.sewerGas + 0.2} t1={T.bend} n={22} speed={0.45} color="#8fd13a" size={0.05} opacity={0.75} seed={11} spread={0.15} />
          )}
          {/* with the U: gas comes up the stack and stops at the water; once there's a vent it goes out the roof */}
          {t >= T.plug && t < T.vent && (
            <Stream pts={[V(-2.6, SEWER_Y), V(STACK_X, SEWER_Y), V(STACK_X, WEIR_Y), V(2 * U_CX + 0.04, WEIR_Y)]} t={t} t0={T.plug} t1={T.vent} n={18} speed={0.5} color="#8fd13a" size={0.045} opacity={0.75} seed={13} spread={0.12} />
          )}
          {t >= T.vent && t < T.strap && (
            <Stream pts={[V(-2.6, SEWER_Y), V(STACK_X, SEWER_Y), V(STACK_X, VENT_TOP + 0.6)]} t={t} t0={T.vent + 0.5} t1={T.strap} n={22} speed={0.35} color="#8fd13a" size={0.045} opacity={0.7} seed={17} spread={0.08} />
          )}
          {t >= T.evaporates + 0.2 && t < T.tap && lvl < 0.3 && (
            <Stream pts={[V(STACK_X, SEWER_Y), V(STACK_X, WEIR_Y), V(2 * U_CX, WEIR_Y), ...arc(U_CX, U_CY, U_R, 2 * Math.PI, Math.PI).slice(1), V(0, DRAIN_Y + 0.4)]} t={t} t0={T.evaporates + 0.2} t1={T.tap} n={16} speed={0.5} color="#8fd13a" size={0.045} opacity={0.75} seed={19} spread={0.05} />
          )}
          {/* evaporation: little vapour specks leaving the water */}
          {t >= T.evap + 1.4 && t < T.evaporates + 0.8 && (
            <Stream pts={[V(0, U_CY - 0.05), V(0, DRAIN_Y + 0.3)]} t={t} t0={T.evap + 1.4} t1={T.evaporates + 0.6} n={10} speed={0.6} color="#ffffff" size={0.018} opacity={0.7} seed={23} spread={0.06} />
          )}
          {/* air coming down the vent to protect the plug */}
          {t >= T.air && t < T.air + 2.2 && (
            <Stream pts={[V(STACK_X, VENT_TOP), V(STACK_X, WEIR_Y + 0.05), V(2 * U_CX + 0.08, WEIR_Y + 0.03)]} t={t} t0={T.air} t1={T.air + 1.6} n={16} speed={0.9} color="#ffffff" size={0.03} opacity={0.9} seed={29} spread={0.04} />
          )}
          <StinkCloud a={stinkA} t={t} at={[0, RIM_Y + 0.1, 0.2]} />
          {/* Hoot reacts */}
          <group position={HOOT_AT as [number, number, number]} rotation={[0, 0.45, 0]} scale={0.55}>
            <Hoot t={t} nose={nose} wave={t >= T.final ? 1 : 0} />
          </group>
        </group>
      )}
      {inS && <STrap T={T} t={t} />}
    </>
  );
};

const pipeFlowOn = (T: SinkTimeline, t: number) => t >= T.bend + 0.5 && flowing(T, t);
const flowStart = (T: SinkTimeline, t: number) =>
  t >= T.tap ? T.tap : t >= T.air ? T.air + 0.05 : t >= T.suck - 0.2 ? T.suck - 0.2 : T.seal + 0.1;
