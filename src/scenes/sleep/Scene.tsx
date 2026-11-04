import React, { useMemo } from 'react';
import * as THREE from 'three';
import { clamp01, rng } from '../../lib/anim';
import type { Timings } from '../../types';
import { Car, CameraRig } from '../../world/Props';
import { Hoot } from '../../mascot/Mascots';
import { GradSky, Person, PlaceLights } from '../learjet/assets';
import {
  BED_AT, buildSleepTimeline, cameraPose, CLOCK_AT, clockAt, daylightAt, DESK_AT, driveAt, HOOT_AT, microAt, mugsAt, ROAD, ROOM, STORY,
  tiredAt, tripAt, WINDOW_AT, type SleepTimeline,
} from './timeline';

export const lerpC = (a: string, b: string, k: number) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), clamp01(k)).getHexString();

/** Simple text-on-canvas texture (for the science fair board). */
const useTextTexture = (lines: { text: string; size: number; color: string; y: number }[], w = 512, h = 512, bg = '#f4ead2') =>
  useMemo(() => {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const c = cv.getContext('2d')!;
    c.fillStyle = bg; c.fillRect(0, 0, w, h);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    for (const l of lines) { c.fillStyle = l.color; c.font = `900 ${l.size}px 'Montserrat', 'Arial Black', Arial, sans-serif`; c.fillText(l.text, w / 2, l.y); }
    const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace;
    return tx;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

// ---------------------------------------------------------------- the bedroom

export const BackWall: React.FC<{ color: string; breathe: number }> = ({ color, breathe }) => {
  const g = useMemo(() => {
    const s = new THREE.Shape([new THREE.Vector2(-2.2, 0), new THREE.Vector2(2.2, 0), new THREE.Vector2(2.2, 2.8), new THREE.Vector2(-2.2, 2.8)]);
    const hw = 0.55, hh = 0.5;
    s.holes.push(new THREE.Path([new THREE.Vector2(WINDOW_AT[0] - hw, WINDOW_AT[1] - hh), new THREE.Vector2(WINDOW_AT[0] + hw, WINDOW_AT[1] - hh), new THREE.Vector2(WINDOW_AT[0] + hw, WINDOW_AT[1] + hh), new THREE.Vector2(WINDOW_AT[0] - hw, WINDOW_AT[1] + hh)]));
    return new THREE.ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: false });
  }, []);
  return <mesh geometry={g} position={[0, 0, -2.1]} scale={[1 + breathe, 1 + breathe * 0.6, 1]} receiveShadow><meshStandardMaterial color={color} roughness={0.9} /></mesh>;
};

export const Clock: React.FC<{ hour: number; melt: number }> = ({ hour, melt }) => {
  const hA = -((hour % 12) / 12) * Math.PI * 2;
  const mA = -((hour % 1)) * Math.PI * 2;
  return (
    <group position={CLOCK_AT as [number, number, number]} scale={[1 - 0.15 * melt, 1 + 0.6 * melt, 1]}>
      <group position={[0, -0.18 * melt, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.02]}><cylinderGeometry args={[0.26, 0.26, 0.05, 32]} /><meshStandardMaterial color="#26313d" /></mesh>
        <mesh position={[0, 0, 0.046]}><circleGeometry args={[0.23, 32]} /><meshStandardMaterial color="#fbf8f0" /></mesh>
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return <mesh key={i} position={[Math.sin(a) * 0.19, Math.cos(a) * 0.19, 0.05]} rotation={[0, 0, -a]}><boxGeometry args={[0.012, i % 3 ? 0.03 : 0.05, 0.005]} /><meshBasicMaterial color="#26313d" /></mesh>;
        })}
        <group position={[0, 0, 0.055]} rotation={[0, 0, hA]}><mesh position={[0, 0.06, 0]}><boxGeometry args={[0.022, 0.13, 0.006]} /><meshBasicMaterial color="#14181c" /></mesh></group>
        <group position={[0, 0, 0.06]} rotation={[0, 0, mA]}><mesh position={[0, 0.085, 0]}><boxGeometry args={[0.014, 0.18, 0.006]} /><meshBasicMaterial color="#14181c" /></mesh></group>
        <mesh position={[0, 0, 0.065]}><circleGeometry args={[0.015, 12]} /><meshBasicMaterial color="#ff4a3d" /></mesh>
      </group>
    </group>
  );
};

export const Mug: React.FC<{ at: number[]; color: string }> = ({ at, color }) => (
  <group position={at as [number, number, number]}>
    <mesh position={[0, 0.055, 0]}><cylinderGeometry args={[0.04, 0.036, 0.11, 16]} /><meshStandardMaterial color={color} /></mesh>
    <mesh position={[0, 0.105, 0]} rotation={[Math.PI / 2, 0, 0]}><circleGeometry args={[0.034, 16]} /><meshStandardMaterial color="#4a2c1a" side={THREE.DoubleSide} /></mesh>
    <mesh position={[0.045, 0.055, 0]}><torusGeometry args={[0.025, 0.007, 6, 12]} /><meshStandardMaterial color={color} /></mesh>
  </group>
);

/** Desk-local positions, clear of the laptop (x -0.36..0.06, z -0.09..0.19) and the lamp (0.5, -0.2). */
const MUG_SPOTS = [[0.2, -0.12], [0.3, 0.08], [0.15, 0.24], [0.4, 0.22], [0.3, -0.25], [0.5, 0.05], [-0.5, -0.22], [0.08, -0.25]];
const MUG_COLS = ['#ff8a3d', '#3fb6ff', '#ffffff', '#21b3a0', '#e2453c', '#f0b429', '#8e5bd1', '#ffffff'];

const Fish: React.FC<{ seed: number; t: number; k: number }> = ({ seed, t, k }) => {
  const r = rng(seed); const ph = r() * 6.28; const rad = 0.6 + r() * 1.0; const y = 1.0 + r() * 1.1; const sp = 0.3 + r() * 0.3;
  const col = ['#ff7ad9', '#7af0ff', '#ffe066', '#9dff7a', '#b48cff'][seed % 5];
  const a = ph + t * sp;
  const x = Math.cos(a) * rad * 1.2, z = -0.8 + Math.sin(a) * rad * 0.7;
  return (
    <group position={[x, y + 0.1 * Math.sin(t * 2 + ph), z]} rotation={[0, -a, 0]} scale={0.18 * k}>
      <mesh scale={[0.4, 0.6, 1]}><sphereGeometry args={[1, 14, 10]} /><meshStandardMaterial color={col} emissive={col} emissiveIntensity={0.5} /></mesh>
      <mesh position={[0, 0, -1.1]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.3]}><coneGeometry args={[0.55, 0.7, 4]} /><meshStandardMaterial color={col} emissive={col} emissiveIntensity={0.5} /></mesh>
      {[-1, 1].map((sd) => <mesh key={sd} position={[sd * 0.3, 0.18, 0.62]}><sphereGeometry args={[0.1, 8, 8]} /><meshBasicMaterial color="#14181c" /></mesh>)}
    </group>
  );
};

const Room: React.FC<{ T: SleepTimeline; t: number; shot: string }> = ({ T, t, shot }) => {
  const day = daylightAt(T, t);
  const tired = tiredAt(T, t);
  const micro = microAt(T, t);
  const trip = tripAt(T, t);
  const mugs = mugsAt(T, t);
  const sleeping = shot === 'sleep';
  const hungerT = T.s('hunger');
  const snacks = T.day >= 2 || (hungerT > 0 && t >= T.wordTime('hunger', 'snacks', hungerT + 3));
  const wallBase = lerpC('#9fb0c9', '#c9d5e6', day);
  const wall = trip > 0 ? lerpC(wallBase, ['#c9a0e6', '#a0e6c9', '#e6c9a0'][Math.floor(t * 0.8) % 3], 0.45 * trip) : wallBase;
  const stars = useMemo(() => { const r = rng(4); return Array.from({ length: 30 }, () => [r() * 3 - 1.5, 0.9 + r() * 1.4]); }, []);
  const sky = lerpC('#0d1b3a', '#8fc4f0', day);
  return (
    <group position={ROOM as [number, number, number]}>
      {/* outside the window: sky, moon or sun, city */}
      <mesh position={[WINDOW_AT[0], 1.6, -3.2]}><planeGeometry args={[6, 4]} /><meshBasicMaterial color={sky} toneMapped={false} /></mesh>
      {day < 0.5 && stars.map(([x, y], i) => <mesh key={i} position={[WINDOW_AT[0] + x, y, -3.15]}><circleGeometry args={[0.012, 6]} /><meshBasicMaterial color="#ffffff" transparent opacity={1 - 2 * day} toneMapped={false} /></mesh>)}
      <mesh position={[WINDOW_AT[0] + 0.25, 1.85, -3.1]}><circleGeometry args={[0.12, 24]} /><meshBasicMaterial color={day > 0.5 ? '#ffe9a8' : '#f4f1e0'} toneMapped={false} /></mesh>
      {[-1.2, -0.85, -0.5, -0.2, 0.15, 0.45].map((x, i) => <mesh key={i} position={[WINDOW_AT[0] + x, 0.75 + (i % 3) * 0.12, -3.05]}><planeGeometry args={[0.3, 0.6 + (i % 3) * 0.25]} /><meshBasicMaterial color={lerpC('#1a2236', '#7d8ca3', day)} toneMapped={false} /></mesh>)}
      {/* ceiling (so close shots looking up never see past the wall top) */}
      <mesh position={[0, 2.8, -0.1]}><boxGeometry args={[4.6, 0.05, 4.2]} /><meshStandardMaterial color="#eef1f6" /></mesh>
      {/* walls, floor, rug */}
      <BackWall color={wall} breathe={0.02 * trip * Math.sin(t * 2.2)} />
      <mesh position={[-2.25, 1.4, -0.1]} scale={[1, 1 + 0.02 * trip * Math.sin(t * 2.2 + 1), 1]}><boxGeometry args={[0.1, 2.8, 4.0]} /><meshStandardMaterial color={wall} roughness={0.9} /></mesh>
      {Array.from({ length: 11 }, (_, i) => <mesh key={i} position={[-2.0 + i * 0.4, -0.01, -0.1]} receiveShadow><boxGeometry args={[0.39, 0.02, 4.0]} /><meshStandardMaterial color={i % 2 ? '#b98c5f' : '#a97c52'} /></mesh>)}
      <mesh position={[0.1, 0.005, -0.4]} rotation={[-Math.PI / 2, 0, trip * t * 0.4]}><circleGeometry args={[0.9, 40]} /><meshStandardMaterial color="#e8b04a" /></mesh>
      <mesh position={[0.1, 0.007, -0.4]} rotation={[-Math.PI / 2, 0, trip * t * 0.4]}><ringGeometry args={[0.55, 0.65, 40]} /><meshStandardMaterial color="#d2563c" /></mesh>
      {/* window frame */}
      {[[0, 0.52, 1.2, 0.05], [0, -0.52, 1.2, 0.05], [0.57, 0, 0.05, 1.08], [-0.57, 0, 0.05, 1.08], [0, 0, 0.03, 1.0]].map(([x, y, w, h], i) => (
        <mesh key={i} position={[WINDOW_AT[0] + x, WINDOW_AT[1] + y, -1.97]}><boxGeometry args={[w, h, 0.06]} /><meshStandardMaterial color="#f7f5f0" /></mesh>
      ))}
      {/* posters */}
      <mesh position={[-2.18, 1.6, -0.6]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[0.6, 0.8]} /><meshStandardMaterial color="#ff8a3d" /></mesh>
      <mesh position={[-2.17, 1.6, -0.6]} rotation={[0, Math.PI / 2, 0]}><circleGeometry args={[0.18, 24]} /><meshStandardMaterial color="#fff3dd" /></mesh>
      <Clock hour={clockAt(T, t)} melt={trip * (0.6 + 0.4 * Math.sin(t * 1.5))} />
      {/* bed */}
      <group position={BED_AT as [number, number, number]}>
        <mesh position={[0, 0.22, 0]} castShadow><boxGeometry args={[1.0, 0.3, 2.0]} /><meshStandardMaterial color="#8a5a3a" /></mesh>
        <mesh position={[0, 0.42, 0]}><boxGeometry args={[0.95, 0.14, 1.95]} /><meshStandardMaterial color="#f7f5f0" /></mesh>
        <mesh position={[0, 0.6, -0.98]}><boxGeometry args={[1.0, 0.7, 0.08]} /><meshStandardMaterial color="#7a4d31" /></mesh>
        <mesh position={[0, 0.54, -0.7]} scale={[0.4, 0.09, 0.2]}><sphereGeometry args={[1, 16, 10]} /><meshStandardMaterial color="#ffffff" /></mesh>
        <mesh position={[0, 0.52, 0.25]}><boxGeometry args={[0.98, 0.08, 1.35]} /><meshStandardMaterial color="#21b3a0" /></mesh>
        {sleeping && (
          // Hoot asleep, head on the pillow
          <group position={[0, 0.62, -0.55]} rotation={[-Math.PI / 2 + 0.25, 0, 0]} scale={0.32}>
            <Hoot t={t} asleep={1} tired={0} />
          </group>
        )}
        {sleeping && <mesh position={[0, 0.6, 0.1]}><boxGeometry args={[1.0, 0.12, 1.2]} /><meshStandardMaterial color="#21b3a0" /></mesh>}
      </group>
      {/* desk, laptop, lamp, chair, mugs, snacks */}
      <group position={DESK_AT as [number, number, number]}>
        <mesh position={[0, 0.75, 0]} castShadow><boxGeometry args={[1.3, 0.05, 0.62]} /><meshStandardMaterial color="#f2efe8" /></mesh>
        {[[-0.6, -0.26], [0.6, -0.26], [-0.6, 0.26], [0.6, 0.26]].map(([x, z], i) => <mesh key={i} position={[x, 0.37, z]}><boxGeometry args={[0.04, 0.74, 0.04]} /><meshStandardMaterial color="#c9ccd1" /></mesh>)}
        <group position={[-0.15, 0.78, -0.05]}>
          <mesh position={[0, 0.01, 0.05]}><boxGeometry args={[0.42, 0.02, 0.28]} /><meshStandardMaterial color="#c9ccd1" metalness={0.5} roughness={0.3} /></mesh>
          <group position={[0, 0.01, -0.09]} rotation={[-0.3, 0, 0]}>
            <mesh position={[0, 0.14, 0]}><boxGeometry args={[0.42, 0.28, 0.015]} /><meshStandardMaterial color="#c9ccd1" metalness={0.5} roughness={0.3} /></mesh>
            <mesh position={[0, 0.14, 0.009]}><planeGeometry args={[0.38, 0.24]} /><meshBasicMaterial color={lerpC('#4f7dff', '#9fc0ff', 0.3 + 0.2 * Math.sin(t * 3))} toneMapped={false} /></mesh>
          </group>
        </group>
        <group position={[0.5, 0.78, -0.2]}>
          <mesh position={[0, 0.01, 0]}><cylinderGeometry args={[0.07, 0.08, 0.02, 16]} /><meshStandardMaterial color="#26313d" /></mesh>
          <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.01, 0.01, 0.4, 6]} /><meshStandardMaterial color="#26313d" /></mesh>
          <mesh position={[-0.05, 0.4, 0]} rotation={[0, 0, 0.5]}><coneGeometry args={[0.1, 0.14, 16, 1, true]} /><meshStandardMaterial color="#ffd21f" side={THREE.DoubleSide} emissive="#ffd21f" emissiveIntensity={0.3} /></mesh>
          <pointLight position={[-0.1, 0.3, 0.1]} intensity={3.5 * (1 - 0.7 * day)} distance={3.5} color="#ffd9a0" />
        </group>
        {MUG_SPOTS.slice(0, mugs).map(([x, z], i) => <Mug key={i} at={[x, 0.775, z]} color={MUG_COLS[i]} />)}
        {snacks && (
          <>
            {/* a bag of chips (yellow, red band) standing up, and a pink donut */}
            {/* an open bag of chips lying on its side with chips spilling out, and a small donut */}
            <group position={[-0.48, 0.8, 0.08]} rotation={[0, 0.4, 0]}>
              <mesh scale={[0.13, 0.04, 0.09]}><sphereGeometry args={[1, 16, 10]} /><meshStandardMaterial color="#e2453c" /></mesh>
              <mesh position={[0, 0.005, 0.0]} scale={[0.07, 0.042, 0.05]}><sphereGeometry args={[1, 12, 8]} /><meshStandardMaterial color="#ffd21f" /></mesh>
              <mesh position={[0.13, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.035, 0.05, 0.04, 12, 1, true]} /><meshStandardMaterial color="#c9ccd1" side={THREE.DoubleSide} /></mesh>
              {[[0.2, 0.02], [0.24, -0.04], [0.19, -0.07], [0.27, 0.05]].map(([cx, cz], k) => <mesh key={k} position={[cx, -0.02, cz]} rotation={[0.3 * k, k, 0.2]} scale={[0.025, 0.006, 0.02]}><sphereGeometry args={[1, 8, 6]} /><meshStandardMaterial color="#f0c040" /></mesh>)}
            </group>
            <mesh position={[-0.3, 0.79, 0.24]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.04, 0.02, 12, 24]} /><meshStandardMaterial color="#ff7ab8" /></mesh>
          </>
        )}
        <group position={[-0.95, 0, 0.55]} rotation={[0, 1.3, 0]}>
          <mesh position={[0, 0.45, 0]}><boxGeometry args={[0.45, 0.06, 0.45]} /><meshStandardMaterial color="#3b4a63" /></mesh>
          <mesh position={[0, 0.75, 0.21]}><boxGeometry args={[0.45, 0.55, 0.05]} /><meshStandardMaterial color="#3b4a63" /></mesh>
          <mesh position={[0, 0.22, 0]}><cylinderGeometry args={[0.03, 0.03, 0.44, 8]} /><meshStandardMaterial color="#8a9099" /></mesh>
        </group>
      </group>
      {/* Hoot, standing, more slumped each day; nods off during microsleeps */}
      {!sleeping && (
        <group position={HOOT_AT as [number, number, number]} rotation={[0.08 * tired + 0.28 * micro, 0.35 + 0.05 * Math.sin(t * 0.7) * tired, 0.04 * tired * Math.sin(t * 0.9)]} scale={0.5}>
          <Hoot t={t} tired={tired} asleep={micro} wave={t >= T.s('final') + 2.2 && T.s('final') > 0 ? 1 : 0} />
        </group>
      )}
      {/* hallucinations: floating fish, a shadow in the corner */}
      {trip > 0.01 && Array.from({ length: 9 }, (_, i) => <Fish key={i} seed={i + 3} t={t} k={trip} />)}
      {trip > 0.01 && (
        <group position={[-1.75, 0, -1.7]}>
          <mesh position={[0, 0.9, 0]} scale={[0.32, 0.9, 0.18]}><sphereGeometry args={[1, 16, 12]} /><meshBasicMaterial color="#0b0d14" transparent opacity={0.55 * trip * (0.6 + 0.4 * Math.sin(t * 1.7))} /></mesh>
          <mesh position={[0, 1.95, 0]}><sphereGeometry args={[0.2, 16, 12]} /><meshBasicMaterial color="#0b0d14" transparent opacity={0.55 * trip * (0.6 + 0.4 * Math.sin(t * 1.7))} /></mesh>
        </group>
      )}
    </group>
  );
};

// ---------------------------------------------------------------- day 2: the road next to a football field

const RoadPlace: React.FC<{ T: SleepTimeline; t: number }> = ({ T, t }) => {
  const d = driveAt(T, t);
  const x = 26.8 * d; // 60 mph = 26.8 m/s
  const closed = d >= 0 && d < 5;
  const drift = d < 0 ? 0 : d < 5 ? 3.2 * Math.pow(d / 5, 1.6) : 3.2 * Math.max(0, 1 - (d - 5) / 1.2);
  const trees = useMemo(() => { const r = rng(21); return Array.from({ length: 30 }, () => [r() * 300 - 60, (r() < 0.5 ? 1 : -1) * (14 + r() * 30)]); }, []);
  return (
    <group position={ROAD as [number, number, number]}>
      <mesh position={[60, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[800, 400]} /><meshStandardMaterial color="#86b061" /></mesh>
      <mesh position={[60, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[700, 8]} /><meshStandardMaterial color="#4a4e54" /></mesh>
      {Array.from({ length: 70 }, (_, i) => <mesh key={i} position={[-150 + i * 8, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[4, 0.18]} /><meshBasicMaterial color="#ffd21f" /></mesh>)}
      {[-3.9, 3.9].map((z) => <mesh key={z} position={[60, 0.01, z]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[700, 0.15]} /><meshBasicMaterial color="#f2f2f2" /></mesh>)}
      {/* a US football field (110 m incl. end zones) right next to the road, starting where the eyes close */}
      <group position={[55, 0.01, -32]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[110, 49]} /><meshStandardMaterial color="#3f8f3a" /></mesh>
        {[-50.4, 50.4].map((x, i) => <mesh key={x} position={[x, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[9.1, 49]} /><meshStandardMaterial color={i ? '#ff8a3d' : '#3fb6ff'} /></mesh>)}
        {Array.from({ length: 11 }, (_, i) => <mesh key={i} position={[-45.7 + i * 9.14, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.35, 49]} /><meshBasicMaterial color="#ffffff" /></mesh>)}
        {[-55, 55].map((x) => (
          <group key={x} position={[x, 0, 0]}>
            <mesh position={[0, 1.6, 0]}><cylinderGeometry args={[0.15, 0.15, 3.2, 8]} /><meshStandardMaterial color="#ffd21f" /></mesh>
            <mesh position={[0, 3.2, 0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.12, 0.12, 5.6, 8]} /><meshStandardMaterial color="#ffd21f" /></mesh>
            {[-2.8, 2.8].map((z) => <mesh key={z} position={[0, 5.2, z]}><cylinderGeometry args={[0.1, 0.1, 4, 8]} /><meshStandardMaterial color="#ffd21f" /></mesh>)}
          </group>
        ))}
      </group>
      {trees.map(([tx, tz], i) => (
        <group key={i} position={[tx, 0, tz]}>
          <mesh position={[0, 1.2, 0]}><cylinderGeometry args={[0.3, 0.4, 2.4, 6]} /><meshStandardMaterial color="#7a5a3a" /></mesh>
          <mesh position={[0, 3.6, 0]}><icosahedronGeometry args={[2.2, 1]} /><meshStandardMaterial color={i % 2 ? '#4f8a3c' : '#5f9a46'} /></mesh>
        </group>
      ))}
      {/* the car: eyes close at x=0 (start of the field); drifts over the centre line */}
      <group position={[x, 1.4, 2 - drift]} rotation={[0, closed ? -0.06 * Math.sin(d * 1.3) : 0, 0]} scale={3.6}>
        <Car position={[0, 0, 0]} color="#ff8a3d" wheelSpin={t * 30} />
      </group>
      {/* the 5-second path, drawn as it happens */}
      {d > 0 && <mesh position={[Math.min(x, 134) / 2, 0.05, 2 - drift / 2]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[Math.min(x, 134), 0.5]} /><meshBasicMaterial color="#ff4a3d" transparent opacity={0.7} /></mesh>}
    </group>
  );
};

// ---------------------------------------------------------------- day 3: 1964 science fair

const StoryPlace: React.FC<{ T: SleepTimeline; t: number }> = ({ T, t }) => {
  const board = useTextTexture([
    { text: 'HOW LONG CAN', size: 46, color: '#2a1d10', y: 150 },
    { text: 'YOU STAY', size: 46, color: '#2a1d10', y: 205 },
    { text: 'AWAKE?', size: 64, color: '#b8432f', y: 275 },
    { text: 'SCIENCE FAIR 1964', size: 30, color: '#5a4630', y: 380 },
  ]);
  const days = Math.min(11, Math.max(0, Math.floor(1 + (t - T.s('randy')) * 2.4)));
  return (
    <group position={STORY as [number, number, number]}>
      <mesh position={[0, -0.01, 0]}><boxGeometry args={[8, 0.02, 8]} /><meshStandardMaterial color="#b59a72" /></mesh>
      <mesh position={[0, 1.5, -1.6]}><boxGeometry args={[8, 3, 0.1]} /><meshStandardMaterial color="#d8c8a4" /></mesh>
      {/* table + tri-fold board */}
      <mesh position={[0, 0.72, -0.9]}><boxGeometry args={[1.8, 0.05, 0.7]} /><meshStandardMaterial color="#8a5a3a" /></mesh>
      {[[-0.85, -0.3], [0.85, -0.3], [-0.85, 0.3], [0.85, 0.3]].map(([x, z], i) => <mesh key={i} position={[x, 0.36, -0.9 + z]}><boxGeometry args={[0.05, 0.72, 0.05]} /><meshStandardMaterial color="#6b4a2e" /></mesh>)}
      <mesh position={[0, 1.15, -1.1]}><planeGeometry args={[0.8, 0.8]} /><meshBasicMaterial map={board} /></mesh>
      {[-1, 1].map((s) => <mesh key={s} position={[s * 0.62, 1.1, -0.98]} rotation={[0, -s * 0.5, 0]}><planeGeometry args={[0.46, 0.7]} /><meshStandardMaterial color="#f4ead2" /></mesh>)}
      {/* calendar on the wall: 11 days crossed off */}
      <group position={[-0.45, 2.0, -1.54]} scale={0.7}>
        <mesh><planeGeometry args={[0.9, 0.75]} /><meshStandardMaterial color="#fbf8f0" /></mesh>
        <mesh position={[0, 0.3, 0.005]}><planeGeometry args={[0.9, 0.15]} /><meshStandardMaterial color="#b8432f" /></mesh>
        {Array.from({ length: 14 }, (_, i) => {
          const cx = -0.36 + (i % 7) * 0.12, cy = 0.1 - Math.floor(i / 7) * 0.22;
          return (
            <group key={i} position={[cx, cy, 0.006]}>
              <mesh><planeGeometry args={[0.1, 0.18]} /><meshStandardMaterial color="#efe6d2" /></mesh>
              {i < days && [-1, 1].map((s) => <mesh key={s} position={[0, 0, 0.002]} rotation={[0, 0, s * 0.95]}><planeGeometry args={[0.16, 0.018]} /><meshBasicMaterial color="#b8432f" /></mesh>)}
            </group>
          );
        })}
      </group>
      <Person at={[-1.1, 0, -0.5]} shirt="#3b6fb6" rotY={0.6} />
      <pointLight position={[0, 2.4, 1]} intensity={4} distance={8} color="#ffe2b0" />
    </group>
  );
};

// ---------------------------------------------------------------- scene

export const SleepScene: React.FC<{ timings: Timings; t: number }> = ({ timings, t }) => {
  const T = useMemo(() => buildSleepTimeline(timings), [timings]);
  const pose = cameraPose(timings, T, t);
  const shot = timings.beats.reduce((s, b) => (t >= b.start ? b.shot : s), timings.beats[0].shot);
  const inRoom = shot !== 'road' && shot !== 'story';
  const day = inRoom ? daylightAt(T, t) : 1;
  return (
    <>
      <CameraRig pose={pose} />
      <GradSky at={pose.pos} top="#2a6fd0" hor="#bfe0ff" bottom="#e6eef5" />
      <PlaceLights target={pose.target} fog="#cfe3f7" near={inRoom ? 60 : 120} far={inRoom ? 300 : 600} sun={inRoom ? 0.5 + 1.2 * day : 2.2} hemi={['#ffffff', '#9fb0c0', inRoom ? 0.8 + 0.6 * day : 1.4]} />
      {inRoom && <Room T={T} t={t} shot={shot} />}
      {shot === 'road' && <RoadPlace T={T} t={t} />}
      {shot === 'story' && <StoryPlace T={T} t={t} />}
    </>
  );
};
