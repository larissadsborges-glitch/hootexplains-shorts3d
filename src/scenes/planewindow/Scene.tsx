import React, { useMemo } from 'react';
import * as THREE from 'three';
import { clamp01, easeOutCubic, progress, rng } from '../../lib/anim';
import type { Timings } from '../../types';
import { Burst, CameraRig } from '../../world/Props';
import { Hoot } from '../../mascot/Mascots';
import { CloudStream, GradSky, PlaceLights, Puff } from '../learjet/assets';
import {
  brokenAt, buildPlaneWindowTimeline, cameraPose, crackAt, EXTERIOR, fogAt, HOOT_SEAT, hootMaskAt, masksAt, PANES, STORY, WALL_Z, WIN,
  type PlaneWindowTimeline,
} from './timeline';

export const rrect = (w: number, h: number, r: number, cx = 0, cy = 0) => {
  const s = new THREE.Shape();
  const x = cx - w / 2, y = cy - h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
};

export const WINDOWS_X = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
export const ROWS_X = [-3.4, -2.4, -1.4, -0.4, 0.6, 1.6, 2.6];
export const SEATS_Z = [-0.72, -0.24, 0.24];

/** Sidewall with real window holes (so the sky and clouds show through). */
export const Sidewall: React.FC = () => {
  const g = useMemo(() => {
    const s = new THREE.Shape([new THREE.Vector2(-6, 0), new THREE.Vector2(6, 0), new THREE.Vector2(6, 2.0), new THREE.Vector2(-6, 2.0)]);
    for (const x of WINDOWS_X) s.holes.push(rrect(WIN.w, WIN.h, 0.2, x, WIN.y) as unknown as THREE.Path);
    return new THREE.ExtrudeGeometry(s, { depth: 0.14, bevelEnabled: false });
  }, []);
  return <mesh geometry={g} position={[0, 0, WALL_Z]} receiveShadow><meshStandardMaterial color="#eeeae2" roughness={0.8} /></mesh>;
};

export const Pane: React.FC<{ z: number; x?: number; color?: string; opacity?: number; scale?: number; y?: number }> = ({ z, x = 0, color = '#bfe3ff', opacity = 0.18, scale = 1, y = WIN.y }) => {
  const g = useMemo(() => new THREE.ShapeGeometry(rrect(WIN.w * 1.05, WIN.h * 1.05, 0.2)), []);
  return <mesh geometry={g} position={[x, y, z]} scale={scale}><meshStandardMaterial color={color} transparent opacity={opacity} roughness={0.05} side={THREE.DoubleSide} depthWrite={false} /></mesh>;
};

/** Jagged crack lines spreading from a point on the pane. */
const Cracks: React.FC<{ amount: number; at: number[] }> = ({ amount, at }) => {
  const segs = useMemo(() => {
    const r = rng(17);
    const out: number[][] = [];
    for (let k = 0; k < 9; k++) {
      let a = (k / 9) * Math.PI * 2 + r() * 0.4, px = 0, py = 0;
      for (let i = 0; i < 5; i++) {
        const len = 0.05 + r() * 0.05;
        const nx = px + Math.cos(a) * len, ny = py + Math.sin(a) * len;
        out.push([px, py, nx, ny, (i + 1) / 5]);
        px = nx; py = ny; a += (r() - 0.5) * 0.9;
      }
    }
    return out;
  }, []);
  if (amount <= 0) return null;
  return (
    <group position={at as [number, number, number]}>
      {segs.map(([x0, y0, x1, y1, d], i) => {
        if (d > amount) return null;
        const len = Math.hypot(x1 - x0, y1 - y0);
        return (
          <mesh key={i} position={[(x0 + x1) / 2, (y0 + y1) / 2, 0]} rotation={[0, 0, Math.atan2(y1 - y0, x1 - x0)]}>
            <boxGeometry args={[len, 0.006, 0.002]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        );
      })}
    </group>
  );
};

export const Seat: React.FC<{ at: number[] }> = ({ at }) => (
  <group position={at as [number, number, number]}>
    <mesh position={[0, 0.42, 0]} castShadow><boxGeometry args={[0.46, 0.12, 0.44]} /><meshStandardMaterial color="#2e4a7a" flatShading /></mesh>
    <mesh position={[-0.22, 0.8, 0]} rotation={[0, 0, 0.12]} castShadow><boxGeometry args={[0.1, 0.75, 0.44]} /><meshStandardMaterial color="#2e4a7a" flatShading /></mesh>
    <mesh position={[-0.27, 1.1, 0]}><boxGeometry args={[0.04, 0.16, 0.32]} /><meshStandardMaterial color="#e8e4dc" /></mesh>
    <mesh position={[0, 0.2, 0]}><boxGeometry args={[0.08, 0.4, 0.08]} /><meshStandardMaterial color="#8a9099" /></mesh>
  </group>
);

export const Seated: React.FC<{ at: number[]; shirt: string; mask: number; lean?: number }> = ({ at, shirt, mask, lean = 0 }) => (
  <group position={at as [number, number, number]} rotation={[lean, 0, 0]}>
    <mesh position={[-0.05, 0.75, 0]}><boxGeometry args={[0.24, 0.52, 0.38]} /><meshStandardMaterial color={shirt} flatShading /></mesh>
    <mesh position={[-0.02, 1.14, 0]}><sphereGeometry args={[0.15, 10, 10]} /><meshStandardMaterial color="#c99a78" /></mesh>
    <mesh position={[0.2, 0.5, 0]}><boxGeometry args={[0.42, 0.14, 0.34]} /><meshStandardMaterial color="#2c3e66" /></mesh>
    {mask > 0.5 && <mesh position={[0.12, 1.1, 0]} rotation={[0, 0, Math.PI / 2]}><coneGeometry args={[0.07, 0.1, 10, 1, true]} /><meshStandardMaterial color="#ffd21f" side={THREE.DoubleSide} /></mesh>}
  </group>
);

/** Yellow mask on a tube, dropped from the panel above a seat. */
const Mask: React.FC<{ at: number[]; drop: number; t: number; seed: number }> = ({ at, drop, t, seed }) => {
  if (drop <= 0) return null;
  const len = 0.55 * drop;
  const sway = 0.04 * Math.sin(t * 3 + seed);
  return (
    <group position={at as [number, number, number]}>
      <mesh position={[sway / 2, -len / 2, 0]}><cylinderGeometry args={[0.006, 0.006, len, 4]} /><meshBasicMaterial color="#e8f4ff" /></mesh>
      <mesh position={[sway, -len - 0.05, 0]}><coneGeometry args={[0.07, 0.1, 10, 1, true]} /><meshStandardMaterial color="#ffd21f" side={THREE.DoubleSide} /></mesh>
    </group>
  );
};

/** The cabin: sidewall, windows (hero window with 3 panes), bins, seats, people, Hoot. */
const Cabin: React.FC<{ T: PlaneWindowTimeline; t: number }> = ({ T, t }) => {
  const broken = brokenAt(T, t);
  const crack = crackAt(T, t);
  const fog = fogAt(T, t);
  const masks = masksAt(T, t);
  const hMask = hootMaskAt(T, t);
  const people = useMemo(() => {
    const r = rng(5);
    const shirts = ['#e2453c', '#3b6fb6', '#f0b429', '#2f9e6e', '#8e5bd1', '#e57a2e', '#ffffff'];
    const out: { at: number[]; c: string }[] = [];
    for (const x of ROWS_X) for (const z of SEATS_Z) {
      if (Math.abs(x - 0.6) < 0.1 && z < -0.5) continue; // Hoot's seat
      if ((Math.abs(x - 0.6) < 0.1 || Math.abs(x - 1.6) < 0.1) && z > -0.5) continue; // keep the camera's view to Hoot clear
      if (r() < 0.62) out.push({ at: [x + 0.05, 0, z], c: shirts[Math.floor(r() * shirts.length)] });
    }
    return out;
  }, []);
  const debris = useMemo(() => { const r = rng(9); return Array.from({ length: 14 }, () => [r() * 2.4 - 0.8, 0.6 + r() * 1.0, r() * 1.6 - 0.2, r() * 6]); }, []);
  const dt = t - T.decomp;
  const outdoor = useMemo(() => { const r = rng(12); return Array.from({ length: 40 }, () => [r() * 160 - 80, -22 - r() * 6, -30 - r() * 120, 4 + r() * 5, Math.floor(r() * 99)]); }, []);
  return (
    <group>
      {/* view out of the windows: the cloud deck far below, drifting back */}
      {outdoor.map(([x, y, z, s, sd], i) => (
        <Puff key={i} at={[((x - t * 6 + 80) % 160 + 160) % 160 - 80, y, z]} s={s} seed={sd} />
      ))}
      <Sidewall />
      {/* floor, ceiling, overhead bins */}
      <mesh position={[0, -0.02, 0]} receiveShadow><boxGeometry args={[12, 0.04, 2.6]} /><meshStandardMaterial color="#56607a" /></mesh>
      <mesh position={[0, 0.0, 0.75]}><boxGeometry args={[12, 0.01, 0.5]} /><meshStandardMaterial color="#6b7590" /></mesh>
      <mesh position={[0, 2.55, -0.1]}><boxGeometry args={[12, 0.06, 2.8]} /><meshStandardMaterial color="#f2efe8" /></mesh>
      <mesh position={[0, 2.18, -0.95]} castShadow><boxGeometry args={[12, 0.42, 0.6]} /><meshStandardMaterial color="#f4f1ea" flatShading /></mesh>
      {WINDOWS_X.map((x) => <mesh key={x} position={[x + 0.5, 2.18, -0.645]}><boxGeometry args={[0.01, 0.4, 0.01]} /><meshBasicMaterial color="#c9c4ba" /></mesh>)}
      <mesh position={[0, 1.95, -0.66]}><boxGeometry args={[12, 0.04, 0.02]} /><meshStandardMaterial color="#d7d2c8" /></mesh>
      {/* ordinary windows: one tinted pane each */}
      {WINDOWS_X.filter((x) => x !== WIN.x).map((x) => <Pane key={x} x={x} z={WALL_Z + 0.07} opacity={0.15} />)}
      {/* the hero window: outer, middle (with its bleed hole), inner */}
      {!broken && (
        <>
          <Pane z={WALL_Z + 0.01} opacity={0.14} />
          <Pane z={WALL_Z + 0.06} opacity={0.12} />
          <mesh position={[WIN.x, WIN.y - 0.24, WALL_Z + 0.061]}><circleGeometry args={[0.012, 12]} /><meshBasicMaterial color="#1b2430" /></mesh>
          <Pane z={WALL_Z + 0.135} opacity={0.1} color="#ffffff" />
          <Cracks amount={crack} at={[WIN.x + 0.06, WIN.y + 0.08, WALL_Z + 0.065]} />
        </>
      )}
      {broken && <mesh position={[WIN.x, WIN.y, WALL_Z + 0.002]}><shapeGeometry args={[rrect(WIN.w, WIN.h, 0.2)]} /><meshBasicMaterial color="#5d9fe0" transparent opacity={0.08} /></mesh>}
      {/* shatter: fragments blown out */}
      <Burst t={t} t0={T.decomp} at={[WIN.x, WIN.y, WALL_Z]} seed={4} count={26} color="#d8f0ff" speed={2.4} up={1.2} gravity={2} life={0.7} size={0.04} />
      {/* seats + passengers */}
      {ROWS_X.map((x) => SEATS_Z.map((z) => <Seat key={`${x}${z}`} at={[x, 0, z]} />))}
      {people.map((p, i) => <Seated key={i} at={p.at} shirt={p.c} mask={masks * (t > T.masks ? 1 : 0)} lean={broken && dt < 1.5 ? -0.05 : 0} />)}
      {ROWS_X.map((x) => SEATS_Z.map((z, k) => <Mask key={`m${x}${k}`} at={[x + 0.12, 1.95, z]} drop={masks * (broken || t < T.story ? 1 : 0)} t={t} seed={x * 3 + k} />))}
      {/* Hoot in his window seat */}
      <group position={HOOT_SEAT as [number, number, number]} rotation={[0, 0.5, 0]} scale={0.42}>
        <Hoot t={t} wave={t >= T.final ? 1 : 0} nose={0} />
        {hMask > 0 && (
          <mesh position={[0, 1.16, 0.9 + 0.15 * (1 - hMask)]} rotation={[-Math.PI / 2, 0, 0]} scale={1 + 0.2 * (1 - hMask)}>
            <coneGeometry args={[0.22, 0.3, 16, 1, false]} />
            <meshStandardMaterial color="#ffd21f" side={THREE.DoubleSide} />
          </mesh>
        )}
        {hMask > 0 && <mesh position={[0.45, 2.4, 0.95]} rotation={[0, 0, 0.25]}><cylinderGeometry args={[0.018, 0.018, 2.5, 6]} /><meshBasicMaterial color="#e8f4ff" /></mesh>}
      </group>
      {/* decompression: fog, debris and air streaks rushing to the hole */}
      {fog > 0.01 && Array.from({ length: 18 }, (_, i) => {
        const r = rng(i + 30);
        const p = [r() * 4 - 1.5, 0.6 + r() * 1.6, r() * 2.2 - 0.9];
        return (
          <mesh key={`f${i}`} position={p as [number, number, number]} scale={0.5 + r() * 0.6}>
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.22 * fog} depthWrite={false} />
          </mesh>
        );
      })}
      {broken && dt < 1.6 && debris.map(([x, y, z, sd], i) => {
        const k = easeOutCubic(clamp01(dt / (0.7 + (sd % 1) * 0.5)));
        if (k >= 0.98) return null;
        return (
          <mesh key={`d${i}`} position={[x + (WIN.x - x) * k, y + (WIN.y - y) * k, z + (WALL_Z - z) * k]} rotation={[sd + t * 9, sd * 2 + t * 7, 0]}>
            <boxGeometry args={i % 3 === 0 ? [0.08, 0.1, 0.08] : [0.2, 0.004, 0.28]} />
            <meshStandardMaterial color={i % 3 === 0 ? '#e9e9e9' : '#ffffff'} />
          </mesh>
        );
      })}
      {broken && dt < 2.2 && Array.from({ length: 12 }, (_, i) => {
        const r = rng(i + 70);
        const sx = r() * 2 - 0.6, sy = 0.9 + r() * 0.9, sz = r() * 1.4 - 0.2;
        const u = ((dt * 2.2 + r()) % 1);
        const px = sx + (WIN.x - sx) * u, py = sy + (WIN.y - sy) * u, pz = sz + (WALL_Z - sz) * u;
        const dir = new THREE.Vector3(WIN.x - sx, WIN.y - sy, WALL_Z - sz).normalize();
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        return <mesh key={`w${i}`} position={[px, py, pz]} quaternion={q}><cylinderGeometry args={[0.004, 0.004, 0.25, 4]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.7 * (1 - dt / 2.2)} /></mesh>;
      })}
      {/* cabin lights */}
      <pointLight position={[0, 2.3, 0.2]} intensity={6} distance={6} color="#fff3dd" />
    </group>
  );
};

/** Nose: a smooth ellipsoid on the fuselage end, with a wraparound windscreen of four panes split by thin white frames. */
const NOSE_X = 6, NOSE_L = 1.9, FR = 0.85;
/** Point on the nose surface: s = how far forward (0 = joint, 1 = tip), a = angle around from the top (+ = right side, +z). */
const nosePt = (s: number, a: number, lift = 1) => {
  const r = FR * Math.sqrt(Math.max(0, 1 - s * s)) * lift;
  return new THREE.Vector3(NOSE_X + NOSE_L * s * lift, r * Math.cos(a), r * Math.sin(a));
};
const panelGeo = (a0: number, a1: number, lift: number) => {
  const g = new THREE.BufferGeometry();
  const pos: number[] = []; const idx: number[] = [];
  const NA = 10, NS = 6;
  for (let i = 0; i <= NS; i++) for (let j = 0; j <= NA; j++) {
    const a = a0 + (a1 - a0) * (j / NA);
    // the top edge dips towards the sides, like a real windscreen
    const s = 0.5 + (0.74 - 0.5) * (i / NS) + 0.05 * (Math.abs(a) / 1.2) * (i / NS);
    const p = nosePt(s, a, lift);
    pos.push(p.x, p.y, p.z);
  }
  for (let i = 0; i < NS; i++) for (let j = 0; j < NA; j++) {
    const k = i * (NA + 1) + j;
    idx.push(k, k + NA + 1, k + 1, k + 1, k + NA + 1, k + NA + 2);
  }
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
};
export const WS_PANES: [number, number][] = [[-1.25, -0.64], [-0.58, -0.03], [0.03, 0.58], [0.64, 1.25]];
const AirlinerNose: React.FC<{ blown?: boolean }> = ({ blown = false }) => {
  const panes = useMemo(() => WS_PANES.map(([a0, a1]) => panelGeo(a0, a1, 1.012)), []);
  return (
    <group>
      <mesh position={[NOSE_X, 0, 0]} scale={[NOSE_L, FR, FR]} castShadow><sphereGeometry args={[1, 28, 20]} /><meshStandardMaterial color="#f4f4f1" /></mesh>
      {panes.map((g, i) => (
        <mesh key={i} geometry={g}>
          {blown && i === 1
            ? <meshBasicMaterial color="#0b0f14" side={THREE.DoubleSide} />
            : <meshStandardMaterial color="#1d2b3c" roughness={0.12} metalness={0.3} side={THREE.DoubleSide} />}
        </mesh>
      ))}
    </group>
  );
};

/** Generic airliner (no logos): ~16 long, two under-wing engines. Nose +x. */
export const Airliner: React.FC<{ arrows?: number; t: number; blown?: boolean }> = ({ arrows = 0, t, blown = false }) => {
  const wing = useMemo(() => {
    const s = new THREE.Shape([new THREE.Vector2(1.2, 0.5), new THREE.Vector2(-1.6, 7.5), new THREE.Vector2(-2.4, 7.5), new THREE.Vector2(-1.4, 0.5)]);
    return new THREE.ExtrudeGeometry(s, { depth: 0.15, bevelEnabled: false });
  }, []);
  const stab = useMemo(() => new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-6.2, 0), new THREE.Vector2(-7.4, 2.6), new THREE.Vector2(-8.0, 2.6), new THREE.Vector2(-7.6, 0)]), { depth: 0.08, bevelEnabled: false }), []);
  const fin = useMemo(() => new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-5.8, 0.6), new THREE.Vector2(-7.6, 3.4), new THREE.Vector2(-8.4, 3.4), new THREE.Vector2(-7.9, 0.6)]), { depth: 0.12, bevelEnabled: false }), []);
  return (
    <group>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.85, 0.85, 12, 20]} /><meshStandardMaterial color="#f4f4f1" flatShading /></mesh>
      <AirlinerNose blown={blown} />
      {/* tail cone tapers to a small rounded tip (no nozzle look) */}
      {/* NB: rotating a cylinder +90° about z sends its TOP (first radius) to -x, so the thin end (0.12) goes first */}
      <mesh rotation={[0, 0, Math.PI / 2]} position={[-7.2, 0.04, 0]}><cylinderGeometry args={[0.12, 0.85, 2.4, 20]} /><meshStandardMaterial color="#f4f4f1" flatShading /></mesh>
      <mesh position={[-8.4, 0.04, 0]}><sphereGeometry args={[0.12, 12, 8]} /><meshStandardMaterial color="#f4f4f1" /></mesh>
      {Array.from({ length: 26 }, (_, i) => [-1, 1].map((s) => (
        <mesh key={`${i}${s}`} position={[-5 + i * 0.42, 0.2, s * 0.84]}><boxGeometry args={[0.16, 0.22, 0.03]} /><meshStandardMaterial color="#26313d" /></mesh>
      )))}
      {[1, -1].map((s) => (
        <group key={s} scale={[1, 1, s]}>
          <mesh geometry={wing} rotation={[Math.PI / 2 + 0.06, 0, 0]} position={[0.5, -0.45, 0]} castShadow><meshStandardMaterial color="#e9e9e5" flatShading side={THREE.DoubleSide} /></mesh>
          {/* turbofan: wide intake at the FRONT (+x) with fan + spinner, narrow exhaust cone at the back */}
          <group position={[1.1, -1.05, 3.0]}>
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.36, 0.55, 2.0, 20, 1, true]} /><meshStandardMaterial color="#d9dbde" flatShading side={THREE.DoubleSide} /></mesh>
            <mesh position={[1.0, 0, 0]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.5, 0.06, 8, 24]} /><meshStandardMaterial color="#c9ccd1" metalness={0.4} roughness={0.35} /></mesh>
            <mesh position={[0.96, 0, 0]} rotation={[0, Math.PI / 2, 0]}><circleGeometry args={[0.48, 24]} /><meshStandardMaterial color="#22272e" roughness={0.6} side={THREE.DoubleSide} /></mesh>
            {Array.from({ length: 8 }, (_, k) => (
              <mesh key={k} position={[0.97, 0, 0]} rotation={[(k / 8) * Math.PI, 0, 0]}><boxGeometry args={[0.01, 0.9, 0.06]} /><meshStandardMaterial color="#5c646e" roughness={0.5} /></mesh>
            ))}
            <mesh position={[1.08, 0, 0]} rotation={[0, 0, -Math.PI / 2]}><coneGeometry args={[0.14, 0.3, 16]} /><meshStandardMaterial color="#e2e5e9" metalness={0.5} roughness={0.25} /></mesh>
            <mesh position={[-1.18, 0, 0]} rotation={[0, 0, Math.PI / 2]}><coneGeometry args={[0.22, 0.4, 16]} /><meshStandardMaterial color="#8a9099" metalness={0.4} roughness={0.4} /></mesh>
            <mesh position={[-0.2, 0.55, 0]}><boxGeometry args={[1.2, 0.35, 0.12]} /><meshStandardMaterial color="#d9dbde" flatShading /></mesh>
          </group>
          <mesh geometry={stab} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.35, 0]}><meshStandardMaterial color="#e9e9e5" flatShading side={THREE.DoubleSide} /></mesh>
        </group>
      ))}
      <mesh geometry={fin} position={[0, 0, -0.06]}><meshStandardMaterial color="#21b3a0" flatShading side={THREE.DoubleSide} /></mesh>
      {/* cabin pressure pushing out on the skin */}
      {arrows > 0 && Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2;
        const x = -3 + (i % 5) * 1.6;
        const r0 = 0.95, len = (0.6 + 0.15 * Math.sin(t * 6 + i)) * arrows;
        const dir = new THREE.Vector3(0, Math.sin(a), Math.cos(a));
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        const p = dir.clone().multiplyScalar(r0 + len / 2);
        const tip = dir.clone().multiplyScalar(r0 + len + 0.12);
        return (
          <group key={i}>
            <mesh position={[x, p.y, p.z]} quaternion={q}><cylinderGeometry args={[0.05, 0.05, len, 6]} /><meshStandardMaterial color="#ff4a3d" emissive="#ff4a3d" emissiveIntensity={0.5} /></mesh>
            <mesh position={[x, tip.y, tip.z]} quaternion={q}><coneGeometry args={[0.12, 0.25, 8]} /><meshStandardMaterial color="#ff4a3d" emissive="#ff4a3d" emissiveIntensity={0.5} /></mesh>
          </group>
        );
      })}
    </group>
  );
};

/** Exploded view of a window's three panes. */
const PanesPlace: React.FC<{ T: PlaneWindowTimeline; t: number }> = ({ T, t }) => {
  const P = PANES;
  const g = useMemo(() => new THREE.ShapeGeometry(rrect(0.9, 1.2, 0.36)), []);
  const edges = useMemo(() => new THREE.EdgesGeometry(g, 1), [g]);
  const spread = easeOutCubic(progress(t, T.panes + 0.2, T.panes + 1.2));
  const holeGlow = t >= T.holeWord - 0.1 ? 0.6 + 0.4 * Math.sin(t * 8) : 0;
  const zs = [-0.35 * spread, 0, 0.35 * spread];
  const cols = ['#9fd3ff', '#cfe9ff', '#ffffff'];
  return (
    <group position={P as [number, number, number]}>
      {zs.map((z, i) => (
        <group key={i} position={[0, 0, z]}>
          <mesh geometry={g}><meshStandardMaterial color={cols[i]} transparent opacity={0.45} roughness={0.05} side={THREE.DoubleSide} depthWrite={false} emissive={i === 0 && t < T.hole ? '#ff4a3d' : '#000'} emissiveIntensity={i === 0 && t < T.hole ? 0.25 : 0} /></mesh>
          <lineSegments geometry={edges}><lineBasicMaterial color="#e8f4ff" /></lineSegments>
        </group>
      ))}
      {/* the bleed hole in the middle pane */}
      <mesh position={[0, -0.24, 0.002]}><circleGeometry args={[0.03, 16]} /><meshBasicMaterial color="#14181c" /></mesh>
      {holeGlow > 0 && <mesh position={[0, -0.24, 0.004]}><ringGeometry args={[0.045, 0.06, 20]} /><meshBasicMaterial color="#ffd21f" transparent opacity={holeGlow} /></mesh>}
      {/* the load on the outer pane */}
      {t < T.hole + 1.5 && [-0.25, 0, 0.25].map((x) => [-0.3, 0.1, 0.4].map((y) => (
        <group key={`${x}${y}`} position={[x, y, -0.35 * spread + 0.45]} rotation={[-Math.PI / 2, 0, 0]}>
          <mesh position={[0, 0.12, 0]}><cylinderGeometry args={[0.012, 0.012, 0.22, 6]} /><meshStandardMaterial color="#ff4a3d" emissive="#ff4a3d" emissiveIntensity={0.4} /></mesh>
          <mesh position={[0, 0.0, 0]} rotation={[Math.PI, 0, 0]}><coneGeometry args={[0.03, 0.06, 8]} /><meshStandardMaterial color="#ff4a3d" /></mesh>
        </group>
      )))}
      {/* air passing through the bleed hole */}
      {t >= T.holeWord && Array.from({ length: 8 }, (_, i) => {
        const u = ((t - T.holeWord) * 0.8 + i / 8) % 1;
        return <mesh key={i} position={[0, -0.24, 0.32 - u * 0.62]}><sphereGeometry args={[0.012, 6, 6]} /><meshBasicMaterial color="#ffffff" /></mesh>;
      })}
    </group>
  );
};

/** A simple pilot: navy jacket, white collar, cap. Local frame: waist at origin, body along +y. */
export const Pilot: React.FC<{ flail: number; t: number }> = ({ flail, t }) => (
  <group>
    <mesh position={[0, 0.22, 0]}><boxGeometry args={[0.3, 0.44, 0.18]} /><meshStandardMaterial color="#1f3a6b" /></mesh>
    <mesh position={[0, 0.45, 0.0]}><boxGeometry args={[0.16, 0.05, 0.14]} /><meshStandardMaterial color="#ffffff" /></mesh>
    <mesh position={[0, 0.56, 0]}><sphereGeometry args={[0.11, 16, 16]} /><meshStandardMaterial color="#e0ac86" /></mesh>
    <mesh position={[0, 0.65, 0]}><cylinderGeometry args={[0.115, 0.115, 0.06, 16]} /><meshStandardMaterial color="#14223d" /></mesh>
    <mesh position={[0, 0.63, 0.08]} rotation={[0.3, 0, 0]}><boxGeometry args={[0.2, 0.015, 0.08]} /><meshStandardMaterial color="#14223d" /></mesh>
    {[-1, 1].map((sd) => (
      <group key={sd} position={[sd * 0.17, 0.4, 0]} rotation={[0, 0, sd * (0.5 + 0.5 * flail + 0.35 * Math.sin(t * 11 + sd))]}>
        <mesh position={[0, 0.17, 0]}><boxGeometry args={[0.08, 0.34, 0.08]} /><meshStandardMaterial color="#1f3a6b" /></mesh>
        <mesh position={[0, 0.36, 0]}><sphereGeometry args={[0.045, 8, 8]} /><meshStandardMaterial color="#e0ac86" /></mesh>
      </group>
    ))}
  </group>
);

/** 1990: the cockpit windscreen blows out; the captain is pulled halfway out; the crew hold on; then the landing. */
const StoryPlace: React.FC<{ T: PlaneWindowTimeline; t: number }> = ({ T, t }) => {
  const P = STORY;
  const landed = t >= T.landed;
  const blewT = T.wordTime('story', 'blew', T.story + 3.8);
  const pulledT = T.wordTime('captain', 'pulled', T.captain + 0.5);
  const blown = t >= blewT;
  const out = easeOutCubic(progress(t, pulledT, pulledT + 0.7));
  // the blown pane tumbles away backwards
  const dt = t - blewT;
  const paneGeo = useMemo(() => panelGeo(WS_PANES[1][0], WS_PANES[1][1], 1.012), []);
  // hole centre and the direction the captain is dragged (back along the roof)
  const hole = nosePt(0.63, -0.3, 1.0);
  return (
    <group position={P as [number, number, number]}>
      {!landed && <CloudStream center={[0, -10, 0]} size={[120, 8, 80]} v={[-30, 0, 0]} t={t} n={46} clear={0} scale={2.2} seed={77} />}
      {landed && (
        <>
          <mesh position={[0, -1.95, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[3000, 3000]} /><meshStandardMaterial color="#9bbb72" /></mesh>
          <mesh position={[0, -1.94, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[600, 9]} /><meshStandardMaterial color="#5a5e63" /></mesh>
          {/* mowed stripes and a few trees so the ground reads as ground */}
          {Array.from({ length: 24 }, (_, i) => <mesh key={`g${i}`} position={[-120 + i * 10 - ((t - T.landed) * 10) % 20, -1.945, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[5, 400]} /><meshStandardMaterial color="#8fb066" /></mesh>)}
          {Array.from({ length: 26 }, (_, i) => { const x = ((-60 + i * 9 - (t - T.landed) * 10) % 240 + 240) % 240 - 120; const z = (i % 2 ? 1 : -1) * (14 + (i * 7) % 20); return (
            <group key={`tr${i}`} position={[x, -1.95, z]}>
              <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[0.15, 0.2, 1, 6]} /><meshStandardMaterial color="#7a5a3a" /></mesh>
              <mesh position={[0, 1.6, 0]}><icosahedronGeometry args={[1.0, 1]} /><meshStandardMaterial color={i % 3 ? '#4f8a3c' : '#5f9a46'} /></mesh>
            </group>); })}
          {Array.from({ length: 40 }, (_, i) => <mesh key={i} position={[-80 + i * 5 - ((t - T.landed) * 10) % 5, -1.93, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[2.2, 0.25]} /><meshStandardMaterial color="#f2f2f2" /></mesh>)}
        </>
      )}
      <group rotation={[0, 0, landed ? 0 : 0.03 * Math.sin(t * 1.5)]} position={[0, landed ? -0.55 : 0, 0]}>
        <Airliner t={t} blown={blown} />
        {landed && [[-0.5, 2.6], [-0.5, -2.6], [5.6, 0]].map(([x, z], i) => (
          <group key={i} position={[x, -1.0, z]}>
            <mesh position={[0, 0.25, 0]}><cylinderGeometry args={[0.05, 0.05, 0.6, 6]} /><meshStandardMaterial color="#9aa0a6" /></mesh>
            <mesh position={[0, -0.12, 0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.28, 0.28, 0.22, 16]} /><meshStandardMaterial color="#22262b" /></mesh>
          </group>
        ))}
        {blown && dt < 2 && (
          <group position={[-dt * 9, dt * 2.5 - dt * dt * 0.8, -dt * 1.5]} rotation={[dt * 5, dt * 3, dt * 4]}>
            <group position={[-hole.x, -hole.y, -hole.z]}>
              <mesh geometry={paneGeo} position={[hole.x, hole.y, hole.z]} scale={1} >
                <meshStandardMaterial color="#1d2b3c" roughness={0.12} side={THREE.DoubleSide} />
              </mesh>
            </group>
          </group>
        )}
        {blown && <Burst t={t} t0={blewT} at={[hole.x, hole.y, hole.z]} seed={21} count={22} color="#d8f0ff" speed={3} up={1.5} gravity={1} life={0.8} size={0.05} />}
        {out > 0 && !landed && (
          // the captain: waist in the hole, upper body dragged back along the roof
          <group position={[hole.x, hole.y + 0.02, hole.z]} rotation={[-0.3, 0, 0.5 + 0.75 * out]}>
            <group position={[0, -0.1 + 0.1 * out, 0]} rotation={[0, Math.PI, 0]} scale={1.2}>
              <Pilot flail={out} t={t} />
            </group>
            {/* the crew's hands, gripping his belt from inside */}
            {[-1, 1].map((sd) => (
              <group key={sd} position={[0.0, -0.02, sd * 0.1]} rotation={[0, 0, -0.2]}>
                <mesh position={[0.03, -0.05, 0]}><boxGeometry args={[0.07, 0.14, 0.07]} /><meshStandardMaterial color="#3fb6ff" /></mesh>
                <mesh position={[0.03, 0.03, 0]}><sphereGeometry args={[0.045, 8, 8]} /><meshStandardMaterial color="#c58f6b" /></mesh>
              </group>
            ))}
          </group>
        )}
      </group>
    </group>
  );
};

export const PlaneWindowScene: React.FC<{ timings: Timings; t: number }> = ({ timings, t }) => {
  const T = useMemo(() => buildPlaneWindowTimeline(timings), [timings]);
  const pose = cameraPose(timings, T, t);
  const shot = timings.beats.reduce((s, b) => (t >= b.start ? b.shot : s), timings.beats[0].shot);
  const inCabin = shot.startsWith('cabin') || shot === 'windowFront' || shot === 'cta';
  const exterior = shot === 'exterior' || shot === 'descent';
  const panes = shot.startsWith('panes');
  const story = shot === 'story';
  const descending = shot === 'descent';
  return (
    <>
      <CameraRig pose={pose} />
      <GradSky at={pose.pos} top={panes ? '#0e2236' : '#2a6fd0'} hor={panes ? '#1d3b5e' : '#bfe0ff'} bottom="#e6eef5" />
      <PlaceLights target={pose.target} fog={panes ? '#1d3b5e' : '#cfe3f7'} near={inCabin ? 60 : 80} far={inCabin ? 400 : 320} sun={2.2} hemi={['#ffffff', '#9fb0c0', 1.4]} />
      {inCabin && <Cabin T={T} t={t} />}
      {exterior && (
        <group position={EXTERIOR as [number, number, number]}>
          <group rotation={[0.05 * Math.sin(t * 0.8), 0, descending ? -0.22 : 0.02 * Math.sin(t)]}>
            <Airliner arrows={shot === 'exterior' ? easeOutCubic(progress(t, T.wordTime('pressure', 'pumped', T.pressure + 3.5), T.wordTime('pressure', 'pumped', T.pressure + 3.5) + 0.6)) : 0} t={t} />
          </group>
          <CloudStream center={[0, -9, 0]} size={[120, 8, 80]} v={descending ? [-30, 14, 0] : [-22, 0, 0]} t={t} n={50} clear={0} scale={2.2} seed={55} />
        </group>
      )}
      {panes && <PanesPlace T={T} t={t} />}
      {story && <StoryPlace T={T} t={t} />}
    </>
  );
};
