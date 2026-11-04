import React, { useMemo } from 'react';
import * as THREE from 'three';
import { clamp01, easeOutCubic, progress, rng } from '../../lib/anim';
import type { Timings } from '../../types';
import { CameraRig } from '../../world/Props';
import { Hoot } from '../../mascot/Mascots';
import { CloudStream, Fields, GradSky, PlaceLights, Puff } from '../learjet/assets';
import { Airliner, Pane, ROWS_X, SEATS_Z, Seat, Seated, Sidewall, WINDOWS_X } from '../planewindow/Scene';
import {
  buildAirplaneModeTimeline, buzzOn, cameraPose, COCKPIT, EXTERIOR, GROUND_Y, HOOT_PHONE, HOOT_SEAT, MAST, PHONEP, reachAt, SAT, SAT_POS,
  TOWERS, towerPositions, type AirplaneModeTimeline,
} from './timeline';

const WALL_Z = -1.25;
const RED = '#ff4a3d', GREEN = '#3ddc84';

// ---------------------------------------------------------------- phone screen (canvas texture)

type ScreenState = { mode: 'settings' | 'search' | 'battery'; t: number; on?: boolean; battery?: number };

const rr = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
};
const FONT = "'Montserrat', 'Arial Black', Arial, sans-serif";

const drawPlaneIcon = (c: CanvasRenderingContext2D, cx: number, cy: number, s: number, color: string) => {
  c.save(); c.translate(cx, cy); c.scale(s, s); c.fillStyle = color;
  c.beginPath();
  c.moveTo(0, -40); c.quadraticCurveTo(6, -40, 6, -30); c.lineTo(6, -8); c.lineTo(40, 12); c.lineTo(40, 20); c.lineTo(6, 10); c.lineTo(6, 28);
  c.lineTo(16, 36); c.lineTo(16, 42); c.lineTo(0, 37); c.lineTo(-16, 42); c.lineTo(-16, 36); c.lineTo(-6, 28); c.lineTo(-6, 10); c.lineTo(-40, 20);
  c.lineTo(-40, 12); c.lineTo(-6, -8); c.lineTo(-6, -30); c.quadraticCurveTo(-6, -40, 0, -40); c.closePath(); c.fill();
  c.restore();
};

const drawScreen = (c: CanvasRenderingContext2D, s: ScreenState) => {
  const W = 512, H = 1024;
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#1d2b52'); g.addColorStop(1, '#3a2466');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  // status bar: time, signal bars (searching = one bar cycling), battery
  c.fillStyle = '#fff'; c.font = `800 34px ${FONT}`; c.textBaseline = 'middle'; c.fillText('10:42', 34, 52);
  const on = s.on;
  if (on) drawPlaneIcon(c, 330, 52, 0.42, '#fff');
  else {
    const k = Math.floor(s.t * 4) % 4;
    for (let i = 0; i < 4; i++) { c.fillStyle = i === k ? '#ffffff' : 'rgba(255,255,255,0.25)'; c.fillRect(300 + i * 14, 62 - (i + 1) * 8, 10, (i + 1) * 8); }
  }
  const bat = s.battery ?? 82;
  c.strokeStyle = '#fff'; c.lineWidth = 3; rr(c, 390, 38, 70, 30, 7); c.stroke(); c.fillRect(462, 47, 5, 12);
  c.fillStyle = bat > 50 ? '#fff' : bat > 20 ? '#ffd21f' : RED; c.fillRect(395, 43, 60 * bat / 100, 20);
  if (s.mode === 'settings') {
    // the airplane mode switch: the hero of the video
    c.fillStyle = 'rgba(255,255,255,0.12)'; rr(c, 30, 330, W - 60, 150, 30); c.fill();
    c.fillStyle = '#ff9f0a'; rr(c, 56, 360, 90, 90, 22); c.fill();
    drawPlaneIcon(c, 101, 405, 0.85, '#fff');
    c.fillStyle = '#fff'; c.font = `800 38px ${FONT}`; c.fillText('Airplane', 166, 388); c.fillText('Mode', 166, 428);
    c.fillStyle = on ? '#34c759' : 'rgba(255,255,255,0.3)'; rr(c, 360, 375, 110, 60, 30); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(on ? 440 : 390, 405, 25, 0, Math.PI * 2); c.fill();
    if (!on) {
      c.fillStyle = 'rgba(255,255,255,0.12)'; rr(c, 30, 520, W - 60, 110, 30); c.fill();
      c.fillStyle = '#ff8a80'; c.font = `800 36px ${FONT}`; c.fillText('Searching…', 60, 575);
    }
  } else if (s.mode === 'search') {
    // radar rings and "No Service"
    for (let i = 0; i < 3; i++) {
      const u = ((s.t * 0.9 + i / 3) % 1);
      c.strokeStyle = `rgba(255,120,110,${(1 - u) * 0.9})`; c.lineWidth = 8;
      c.beginPath(); c.arc(W / 2, 320, 40 + u * 170, 0, Math.PI * 2); c.stroke();
    }
    c.fillStyle = '#ff6b5e'; c.beginPath(); c.arc(W / 2, 320, 34, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = `900 56px ${FONT}`; c.fillText('NO SERVICE', W / 2, 570);
    c.font = `800 38px ${FONT}`; c.fillStyle = '#ffb3ab'; c.fillText(`Searching${'.'.repeat(1 + (Math.floor(s.t * 3) % 3))}`, W / 2, 635);
    c.textAlign = 'left';
  } else {
    // big draining battery
    const col = bat > 50 ? GREEN : bat > 20 ? '#ffd21f' : RED;
    c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = `900 96px ${FONT}`; c.fillText(`${Math.round(bat)}%`, W / 2, 190);
    c.strokeStyle = '#fff'; c.lineWidth = 14; rr(c, 156, 300, 200, 360, 32); c.stroke();
    c.fillStyle = '#fff'; rr(c, 216, 268, 80, 32, 10); c.fill();
    const h = 324 * bat / 100;
    c.fillStyle = col; rr(c, 174, 318 + 324 - h, 164, h, 20); c.fill();
    c.textAlign = 'left';
  }
};

const useScreen = (s: ScreenState) => {
  const { canvas, tex } = useMemo(() => {
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 1024;
    const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4;
    return { canvas: cv, tex: tx };
  }, []);
  const ctx = canvas.getContext('2d')!;
  drawScreen(ctx, s);
  tex.needsUpdate = true;
  return tex;
};

/** A phone, screen facing +z. w x h in metres. */
const Phone: React.FC<{ w: number; screen: ScreenState }> = ({ w, screen }) => {
  const tex = useScreen(screen);
  const h = w * 2;
  return (
    <group>
      <mesh castShadow><boxGeometry args={[w, h, w * 0.09]} /><meshStandardMaterial color="#15171c" roughness={0.3} metalness={0.4} /></mesh>
      <mesh position={[0, 0, w * 0.046]}><planeGeometry args={[w * 0.92, h * 0.95]} /><meshBasicMaterial map={tex} toneMapped={false} /></mesh>
    </group>
  );
};

/** Expanding signal rings around a point, in the local x-y plane. */
const Rings: React.FC<{ t: number; color: string; maxR: number; period?: number; n?: number; tube?: number; opacity?: number; minR?: number }> = ({ t, color, maxR, period = 1.2, n = 3, tube = 0.02, opacity = 0.7, minR = 0 }) => (
  <>
    {Array.from({ length: n }, (_, i) => {
      const u = ((t / period + i / n) % 1 + 1) % 1;
      const r = minR + (maxR - minR) * u;
      return (
        <mesh key={i} scale={r}>
          <torusGeometry args={[1, tube / Math.max(r, 0.01), 6, 48]} />
          <meshBasicMaterial color={color} transparent opacity={opacity * (1 - u)} depthWrite={false} toneMapped={false} />
        </mesh>
      );
    })}
  </>
);

// ---------------------------------------------------------------- cabin

const PEOPLE = (() => {
  const r = rng(5);
  const shirts = ['#e2453c', '#3b6fb6', '#f0b429', '#2f9e6e', '#8e5bd1', '#e57a2e', '#ffffff'];
  const out: { at: number[]; c: string }[] = [];
  for (const x of ROWS_X) for (const z of SEATS_Z) {
    if (Math.abs(x - 0.6) < 0.1 && z < -0.5) continue; // Hoot's seat
    if ((Math.abs(x - 0.6) < 0.1 || Math.abs(x - 1.6) < 0.1) && z > -0.5) continue; // clear view to Hoot
    if (r() < 0.7) out.push({ at: [x + 0.05, 0, z], c: shirts[Math.floor(r() * shirts.length)] });
  }
  return out;
})();
/** For the wide cabin shot: every seat but Hoot's can be taken. */
const PEOPLE_ALL = (() => {
  const r = rng(8);
  const shirts = ['#e2453c', '#3b6fb6', '#f0b429', '#2f9e6e', '#8e5bd1', '#e57a2e', '#ffffff'];
  const out: { at: number[]; c: string }[] = [];
  for (const x of ROWS_X) for (const z of SEATS_Z) {
    if (Math.abs(x - 0.6) < 0.1 && z < -0.5) continue;
    if (r() < 0.85) out.push({ at: [x + 0.05, 0, z], c: shirts[Math.floor(r() * shirts.length)] });
  }
  return out;
})();

const Cabin: React.FC<{ T: AirplaneModeTimeline; t: number; shot: string }> = ({ T, t, shot }) => {
  const outdoor = useMemo(() => { const r = rng(12); return Array.from({ length: 40 }, () => [r() * 160 - 80, -22 - r() * 6, -30 - r() * 120, 4 + r() * 5, Math.floor(r() * 99)]); }, []);
  const landing = t >= T.landing && t < T.verdict;
  const eu = t >= T.twist && t < T.battery;
  const toggleT = T.wordTime('final', 'turn', T.final + 1.6);
  const hootOn = t >= T.final && t >= toggleT;
  const hootSearching = !hootOn;
  return (
    <group>
      {outdoor.map(([x, y, z, s, sd], i) => <Puff key={i} at={[((x - t * 6 + 80) % 160 + 160) % 160 - 80, y, z]} s={s} seed={sd} />)}
      <Sidewall />
      <mesh position={[0, -0.02, 0]} receiveShadow><boxGeometry args={[12, 0.04, 2.6]} /><meshStandardMaterial color="#56607a" /></mesh>
      <mesh position={[0, 0.0, 0.75]}><boxGeometry args={[12, 0.01, 0.5]} /><meshStandardMaterial color="#6b7590" /></mesh>
      <mesh position={[0, 2.55, -0.1]}><boxGeometry args={[12, 0.06, 2.8]} /><meshStandardMaterial color="#f2efe8" /></mesh>
      <mesh position={[0, 2.18, -0.95]} castShadow><boxGeometry args={[12, 0.42, 0.6]} /><meshStandardMaterial color="#f4f1ea" flatShading /></mesh>
      {WINDOWS_X.map((x) => <mesh key={x} position={[x + 0.5, 2.18, -0.645]}><boxGeometry args={[0.01, 0.4, 0.01]} /><meshBasicMaterial color="#c9c4ba" /></mesh>)}
      <mesh position={[0, 1.95, -0.66]}><boxGeometry args={[12, 0.04, 0.02]} /><meshStandardMaterial color="#d7d2c8" /></mesh>
      {WINDOWS_X.map((x) => <Pane key={x} x={x} z={WALL_Z + 0.07} opacity={0.15} />)}
      {ROWS_X.map((x) => SEATS_Z.map((z) => <Seat key={`${x}${z}`} at={[x, 0, z]} />))}
      {(shot === 'cabinWide' ? PEOPLE_ALL : PEOPLE).map((p, i) => {
        const lit = landing ? t >= T.landing + 0.12 * i : eu;
        const col = eu ? GREEN : RED;
        return (
          <group key={i}>
            <Seated at={p.at} shirt={p.c} mask={0} />
            {/* phone in hand, screen tilted up to the face */}
            <group position={[p.at[0] + 0.17, 0.86, p.at[2]]} rotation={[0, Math.PI / 2, 0]}>
              <group rotation={[-0.9, 0, 0]}>
                <mesh><boxGeometry args={[0.065, 0.13, 0.012]} /><meshStandardMaterial color="#15171c" /></mesh>
                <mesh position={[0, 0, 0.007]}><planeGeometry args={[0.058, 0.118]} /><meshBasicMaterial color={lit ? (eu ? '#9ff5c6' : '#ffb3ab') : '#2a3550'} toneMapped={false} /></mesh>
              </group>
            </group>
            {/* a glowing signal marker above each head with an active phone */}
            {lit && (
              <group position={[p.at[0], 1.45, p.at[2]]} rotation={[0, Math.PI / 2, 0]}>
                <mesh><sphereGeometry args={[0.035, 10, 10]} /><meshBasicMaterial color={col} toneMapped={false} /></mesh>
                <Rings t={t + i * 0.37} color={col} maxR={eu ? 0.16 : 0.3} minR={0.05} period={eu ? 1.6 : 0.9} n={2} tube={0.01} opacity={eu ? 0.6 : 0.9} />
              </group>
            )}
            {/* EU: a dotted link from each phone to the mini mast */}
            {eu && shot === 'mast' && Math.abs(p.at[0] - MAST[0]) < 2.2 && <Link from={[p.at[0], 1.45, p.at[2]]} to={MAST} t={t + i * 0.2} color={GREEN} />}
          </group>
        );
      })}
      {/* the mini mobile mast (pico-cell) under the ceiling */}
      <group position={MAST as [number, number, number]}>
        <mesh><boxGeometry args={[0.34, 0.1, 0.24]} /><meshStandardMaterial color="#d9d6cf" /></mesh>
        <mesh position={[0, -0.051, 0]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[0.26, 0.16]} /><meshStandardMaterial color="#3a3f47" side={THREE.DoubleSide} /></mesh>
        {[-0.1, 0.1].map((x) => <mesh key={x} position={[x, -0.07, 0]}><cylinderGeometry args={[0.012, 0.012, 0.09, 6]} /><meshStandardMaterial color="#c9c4ba" /></mesh>)}
        <mesh position={[0.12, -0.05, 0.1]}><sphereGeometry args={[0.022, 8, 8]} /><meshBasicMaterial color={eu ? GREEN : '#4a5a4f'} toneMapped={false} /></mesh>
        {eu && <group rotation={[Math.PI / 2, 0, 0]}><Rings t={t} color={GREEN} maxR={0.5} period={1.4} n={2} tube={0.01} opacity={0.6} /></group>}
      </group>
      {/* Hoot in his window seat, phone in hand */}
      {shot !== 'cabinWide' && shot !== 'mast' && <group position={HOOT_SEAT as [number, number, number]} rotation={[0, 0.5, 0]} scale={0.42}>
        <Hoot t={t} wave={t >= T.final + 2.6 ? 1 : 0} nose={0.45} />
        <group position={HOOT_PHONE as [number, number, number]} rotation={[-0.3, 0.35, 0.15]}>
          <Phone w={0.28} screen={{ mode: 'settings', t, on: hootOn, battery: 82 }} />
          {hootSearching && (t < T.myth || t >= T.final) && <group position={[0, 0.2, 0.05]}><Rings t={t} color={RED} maxR={0.9} minR={0.3} period={1.1} n={3} tube={0.022} /></group>}
        </group>
      </group>}
      <pointLight position={[0, 2.3, 0.2]} intensity={6} distance={6} color="#fff3dd" />
    </group>
  );
};

/** A dotted line between two points with dots flowing from `from` to `to`. */
const Link: React.FC<{ from: number[]; to: number[]; t: number; color: string; n?: number; size?: number; speed?: number; upTo?: number }> = ({ from, to, t, color, n = 8, size = 0.012, speed = 0.6, upTo = 1 }) => (
  <>
    {Array.from({ length: n }, (_, i) => {
      const u = ((i / n + t * speed) % 1 + 1) % 1;
      if (u > upTo) return null;
      return (
        <mesh key={i} position={[from[0] + (to[0] - from[0]) * u, from[1] + (to[1] - from[1]) * u, from[2] + (to[2] - from[2]) * u]}>
          <sphereGeometry args={[size, 6, 6]} />
          <meshBasicMaterial color={color} toneMapped={false} transparent opacity={0.9} />
        </mesh>
      );
    })}
  </>
);

// ---------------------------------------------------------------- big phone close-up

const PhonePlace: React.FC<{ T: AirplaneModeTimeline; t: number }> = ({ T, t }) => {
  const battery = t >= T.battery;
  const bat = battery ? 78 - 64 * clamp01((t - T.wordTime('battery', 'drains', T.battery + 3.5) + 0.6) / 1.4) : 82;
  return (
    <group position={PHONEP as [number, number, number]}>
      <CloudStream center={[0, -6, -30]} size={[90, 10, 30]} v={[-5, 0, 0]} t={t} n={22} clear={0} scale={3} seed={31} />
      <group position={[0, 0.45, 0]} rotation={[0.05 * Math.sin(t * 0.9), -0.12 + 0.06 * Math.sin(t * 0.6), 0.03 * Math.sin(t * 0.7)]}>
        <Phone w={1.0} screen={{ mode: battery ? 'battery' : 'search', t, battery: bat }} />
        <group position={[0, 0.2, -0.05]}>
          <Rings t={t} color={battery ? '#ffb340' : RED} maxR={2.6} minR={1.15} period={1.3} n={3} tube={0.035} opacity={battery ? 0.45 : 0.8} />
        </group>
      </group>
    </group>
  );
};

// ---------------------------------------------------------------- low plane over the cell towers

const Tower: React.FC<{ at: number[]; lit: boolean; t: number }> = ({ at, lit, t }) => (
  <group position={at as [number, number, number]} scale={0.7}>
    <mesh position={[0, 4, 0]}><cylinderGeometry args={[0.22, 0.7, 8, 4, 1]} /><meshStandardMaterial color="#8d96a0" flatShading /></mesh>
    {[0, 1, 2].map((k) => {
      const a = (k / 3) * Math.PI * 2;
      return <mesh key={k} position={[Math.cos(a) * 0.35, 7.7, Math.sin(a) * 0.35]} rotation={[0, -a, 0]}><boxGeometry args={[0.2, 1.5, 0.6]} /><meshStandardMaterial color="#f2f2f2" /></mesh>;
    })}
    <mesh position={[0, 8.5, 0]}><sphereGeometry args={[0.55, 12, 12]} /><meshBasicMaterial color={lit ? RED : '#7a2a24'} toneMapped={false} /></mesh>
    {lit && <group position={[0, 8.5, 0]} rotation={[Math.PI / 2, 0, 0]}><Rings t={t} color={RED} maxR={3} period={0.9} n={2} tube={0.12} opacity={0.75} /></group>}
  </group>
);

const TowersPlace: React.FC<{ T: AirplaneModeTimeline; t: number }> = ({ T, t }) => {
  const towers = towerPositions(T, t);
  const reach = reachAt(T, t);
  const shift = (t - T.towers) * 9;
  const belly = [1, -1.0, 0];
  return (
    <group position={TOWERS as [number, number, number]}>
      <Fields at={[-shift, GROUND_Y, 0]} size={500} n={40} />
      {towers.map((p, i) => {
        const lit = Math.hypot(p[0], p[2]) < reach;
        return (
          <group key={i}>
            <Tower at={p} lit={lit} t={t + i * 0.3} />
            {lit && <Link from={belly} to={[p[0], p[1] + 6, p[2]]} t={t} color={RED} n={14} size={0.22} speed={0.9} />}
          </group>
        );
      })}
      {/* the reach circle on the ground */}
      {reach > 0.5 && (
        <mesh position={[0, GROUND_Y + 0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[reach - 0.5, reach, 64]} />
          <meshBasicMaterial color={RED} transparent opacity={0.7} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      )}
      <group rotation={[0, 0, 0.02 * Math.sin(t)]}>
        <Airliner t={t} />
        <group position={belly as [number, number, number]} rotation={[Math.PI / 2, 0, 0]}><Rings t={t} color={RED} maxR={5} minR={1} period={1.0} n={3} tube={0.08} /></group>
      </group>
    </group>
  );
};

// ---------------------------------------------------------------- cockpit

/** A thin cylinder between two points. */
const Rod: React.FC<{ from: number[]; to: number[]; r: number; color: string }> = ({ from, to, r, color }) => {
  const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
  const d = b.clone().sub(a);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
  const m = a.clone().add(b).multiplyScalar(0.5);
  return <mesh position={[m.x, m.y, m.z]} quaternion={q}><cylinderGeometry args={[r, r, d.length(), 6]} /><meshStandardMaterial color={color} /></mesh>;
};

/** A seated pilot facing +x, with a headset. Origin at the seat cushion. */
const CockpitPilot: React.FC<{ t: number; seed: number; buzz: boolean; captain?: boolean }> = ({ t, seed, buzz, captain }) => {
  const bob = 0.01 * Math.sin(t * 1.3 + seed);
  return (
    <group>
      <mesh position={[0.18, 0.08, 0]}><boxGeometry args={[0.45, 0.14, 0.34]} /><meshStandardMaterial color="#1a2a4a" /></mesh>
      <mesh position={[0, 0.38 + bob, 0]}><boxGeometry args={[0.22, 0.5, 0.38]} /><meshStandardMaterial color={captain ? '#1f3a6b' : '#22406f'} /></mesh>
      <mesh position={[0.06, 0.6 + bob, 0]}><boxGeometry args={[0.14, 0.05, 0.16]} /><meshStandardMaterial color="#ffffff" /></mesh>
      {/* gold epaulettes */}
      {[-1, 1].map((s) => <mesh key={s} position={[0, 0.62 + bob, s * 0.17]}><boxGeometry args={[0.12, 0.02, 0.06]} /><meshStandardMaterial color="#d4b062" metalness={0.5} /></mesh>)}
      {/* arms reaching forward to the controls */}
      {[-1, 1].map((s) => (
        <group key={s} position={[0.02, 0.55 + bob, s * 0.21]} rotation={[0, 0, -1.0]}>
          <mesh position={[0, -0.18, 0]}><boxGeometry args={[0.08, 0.36, 0.08]} /><meshStandardMaterial color={captain ? '#1f3a6b' : '#22406f'} /></mesh>
          <mesh position={[0, -0.38, 0]}><sphereGeometry args={[0.045, 8, 8]} /><meshStandardMaterial color="#e0ac86" /></mesh>
        </group>
      ))}
      <group position={[0.02, 0.76 + bob, 0]}>
        <mesh><sphereGeometry args={[0.12, 16, 16]} /><meshStandardMaterial color="#e0ac86" /></mesh>
        <mesh position={[-0.02, 0.06, 0]} scale={[1, 0.6, 1]}><sphereGeometry args={[0.122, 16, 12]} /><meshStandardMaterial color={captain ? '#3b2a1e' : '#6b4a2e'} /></mesh>
        {/* headset: band over the head, two ear cups, mic boom */}
        <mesh rotation={[0, Math.PI / 2, 0]} position={[0, 0.0, 0]}><torusGeometry args={[0.14, 0.016, 8, 24, Math.PI]} /><meshStandardMaterial color="#2a2d33" /></mesh>
        {[-1, 1].map((s) => (
          <group key={s} position={[0, -0.01, s * 0.135]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.058, 0.058, 0.045, 20]} /><meshStandardMaterial color="#25282e" roughness={0.5} /></mesh>
            <mesh position={[0, 0, s * 0.027]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.038, 0.038, 0.006, 20]} /><meshStandardMaterial color={buzz && s < 0 ? RED : '#4a4f57'} emissive={buzz && s < 0 ? RED : '#000'} emissiveIntensity={buzz && s < 0 ? 0.6 : 0} /></mesh>
          </group>
        ))}
        <Rod from={[0.02, -0.03, -0.15]} to={[0.12, -0.08, -0.045]} r={0.008} color="#2a2d33" />
        <mesh position={[0.12, -0.08, -0.045]}><sphereGeometry args={[0.018, 8, 8]} /><meshStandardMaterial color="#111" /></mesh>
      </group>
    </group>
  );
};

/** Jagged red lines fizzing out of the captain's left ear cup while the buzz plays. */
const BuzzZap: React.FC<{ t: number; on: boolean }> = ({ t, on }) => {
  if (!on) return null;
  const r = rng(Math.floor(t * 30));
  return (
    <>
      {Array.from({ length: 5 }, (_, k) => {
        const a = -0.9 + (k / 4) * 1.8 + (r() - 0.5) * 0.2;
        const segs: React.ReactNode[] = [];
        let y = 0, z = 0;
        for (let i = 0; i < 4; i++) {
          const len = 0.025 + r() * 0.015;
          const ang = a + (i % 2 ? 0.7 : -0.7);
          const ny = y + Math.sin(ang) * len, nz = z - Math.cos(ang) * len;
          segs.push(<mesh key={`${k}-${i}`} position={[0, (y + ny) / 2, (z + nz) / 2]} rotation={[-Math.atan2(ny - y, -(nz - z)), 0, 0]}><boxGeometry args={[0.003, 0.003, len]} /><meshBasicMaterial color={RED} toneMapped={false} /></mesh>);
          y = ny; z = nz;
        }
        return <group key={k} position={[0, 0, -0.05]}>{segs}</group>;
      })}
    </>
  );
};

const ScreenPanel: React.FC<{ at: number[]; kind: 'pfd' | 'nd' }> = ({ at, kind }) => (
  <group position={at as [number, number, number]} rotation={[0, -Math.PI / 2, 0]}>
    <mesh><planeGeometry args={[0.3, 0.26]} /><meshBasicMaterial color="#0b0d10" toneMapped={false} /></mesh>
    {kind === 'pfd' ? (
      <>
        <mesh position={[0, 0.035, 0.001]}><planeGeometry args={[0.26, 0.11]} /><meshBasicMaterial color="#3b7bd6" toneMapped={false} /></mesh>
        <mesh position={[0, -0.075, 0.001]}><planeGeometry args={[0.26, 0.11]} /><meshBasicMaterial color="#8a5a2e" toneMapped={false} /></mesh>
        <mesh position={[0, -0.02, 0.002]}><planeGeometry args={[0.12, 0.012]} /><meshBasicMaterial color="#ffd21f" toneMapped={false} /></mesh>
      </>
    ) : (
      <>
        <mesh position={[0, -0.06, 0.001]}><ringGeometry args={[0.09, 0.098, 32, 1, 0.3, Math.PI - 0.6]} /><meshBasicMaterial color="#3ddc84" toneMapped={false} /></mesh>
        <mesh position={[0.03, 0.03, 0.001]}><circleGeometry args={[0.01, 8]} /><meshBasicMaterial color="#ff4fd8" toneMapped={false} /></mesh>
        <mesh position={[0, -0.07, 0.001]}><circleGeometry args={[0.012, 3]} /><meshBasicMaterial color="#ffffff" toneMapped={false} /></mesh>
      </>
    )}
  </group>
);

const CockpitPlace: React.FC<{ T: AirplaneModeTimeline; t: number; approach: boolean }> = ({ T, t, approach }) => {
  const buzz = buzzOn(T, t);
  const posts = [-1.0, -0.36, 0.36, 1.0];
  const glassY0 = 1.14, glassY1 = 1.92;
  return (
    <group position={COCKPIT as [number, number, number]}>
      {/* outside */}
      {!approach && <CloudStream center={[0, -14, 0]} size={[260, 10, 160]} v={[-40, 0, 0]} t={t} n={40} clear={0} scale={3} seed={91} />}
      {approach && (
        <group>
          <Fields at={[200 - (t - T.verdict) * 25, -12, 0]} size={1600} n={60} />
          <mesh position={[260 - (t - T.verdict) * 25, -11.9, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[420, 26]} /><meshStandardMaterial color="#4a4e54" /></mesh>
          {Array.from({ length: 22 }, (_, i) => <mesh key={i} position={[60 + i * 18 - (t - T.verdict) * 25, -11.85, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[8, 0.7]} /><meshStandardMaterial color="#f2f2f2" /></mesh>)}
          {Array.from({ length: 10 }, (_, i) => <mesh key={`l${i}`} position={[46 - i * 3 - (t - T.verdict) * 25 + 0, -11.6, 0]}><sphereGeometry args={[0.35, 8, 8]} /><meshBasicMaterial color="#ffffff" toneMapped={false} /></mesh>)}
        </group>
      )}
      {/* shell */}
      <mesh position={[-0.3, -0.02, 0]}><boxGeometry args={[3.9, 0.04, 2.4]} /><meshStandardMaterial color="#3a3e46" /></mesh>
      <mesh position={[1.3, 0.3, 0]}><boxGeometry args={[0.3, 0.64, 2.3]} /><meshStandardMaterial color="#2a2e35" /></mesh>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[-0.5, 1.0, s * 1.18]}><boxGeometry args={[3.4, 2.1, 0.06]} /><meshStandardMaterial color="#d9d6cf" /></mesh>
          {/* side window */}
          <mesh position={[0.95, 1.5, s * 1.14]}><boxGeometry args={[0.6, 0.32, 0.02]} /><meshStandardMaterial color="#1d2b3c" roughness={0.1} /></mesh>
        </group>
      ))}
      <mesh position={[-0.6, 2.12, 0]}><boxGeometry args={[2.8, 0.1, 2.36]} /><meshStandardMaterial color="#c9c6be" /></mesh>
      <mesh position={[0.75, 2.04, 0]} rotation={[0, 0, -0.3]}><boxGeometry args={[0.8, 0.14, 1.1]} /><meshStandardMaterial color="#2c3038" /></mesh>
      {/* instrument panel + glare shield */}
      <mesh position={[1.2, 0.8, 0]}><boxGeometry args={[0.16, 0.56, 2.3]} /><meshStandardMaterial color="#2a2e35" /></mesh>
      <mesh position={[1.12, 1.1, 0]}><boxGeometry args={[0.42, 0.08, 2.3]} /><meshStandardMaterial color="#1b1e23" /></mesh>
      {[[-0.82, 'pfd'], [-0.46, 'nd'], [0.0, 'nd'], [0.46, 'nd'], [0.82, 'pfd']].map(([z, k], i) => (
        <ScreenPanel key={i} at={[1.115, 0.84, z as number]} kind={k as 'pfd' | 'nd'} />
      ))}
      {/* centre pedestal with thrust levers */}
      <mesh position={[0.55, 0.42, 0]}><boxGeometry args={[0.9, 0.5, 0.36]} /><meshStandardMaterial color="#2a2e35" /></mesh>
      {[-0.06, 0.06].map((z) => <mesh key={z} position={[0.6, 0.75, z]} rotation={[0, 0, -0.3]}><boxGeometry args={[0.03, 0.18, 0.03]} /><meshStandardMaterial color="#c9ccd1" /></mesh>)}
      {/* windscreen: frames + tinted glass */}
      {posts.map((z) => <mesh key={z} position={[1.42, (glassY0 + glassY1) / 2, z]} rotation={[0, 0, 0.35]}><boxGeometry args={[0.06, glassY1 - glassY0 + 0.1, 0.06]} /><meshStandardMaterial color="#d9d6cf" /></mesh>)}
      <mesh position={[1.3, glassY1 + 0.03, 0]}><boxGeometry args={[0.2, 0.08, 2.3]} /><meshStandardMaterial color="#d9d6cf" /></mesh>
      <mesh position={[1.52, (glassY0 + glassY1) / 2, 0]} rotation={[0, Math.PI / 2, 0.0]}><planeGeometry args={[2.3, glassY1 - glassY0]} /><meshStandardMaterial color="#bfe3ff" transparent opacity={0.08} side={THREE.DoubleSide} depthWrite={false} /></mesh>
      {/* seats + pilots: captain on the left (-z), first officer on the right */}
      {[-0.55, 0.55].map((z, i) => (
        <group key={z} position={[0, 0.52, z]}>
          <mesh position={[-0.28, 0.3, 0]} rotation={[0, 0, 0.1]}><boxGeometry args={[0.14, 0.65, 0.5]} /><meshStandardMaterial color="#3a3f47" /></mesh>
          <mesh position={[-0.05, -0.05, 0]}><boxGeometry args={[0.5, 0.12, 0.5]} /><meshStandardMaterial color="#3a3f47" /></mesh>
          <CockpitPilot t={t} seed={i * 2} buzz={buzz && i === 0} captain={i === 0} />
          {void BuzzZap}
        </group>
      ))}
      <pointLight position={[0.2, 1.8, 0]} intensity={3} distance={4} color="#fff3dd" />
    </group>
  );
};

// ---------------------------------------------------------------- satellite

const Satellite: React.FC<{ t: number }> = ({ t }) => (
  <group rotation={[0.3, t * 0.1, 0.2]}>
    <mesh><boxGeometry args={[1.6, 1.6, 2.2]} /><meshStandardMaterial color="#d4a52c" metalness={0.6} roughness={0.35} /></mesh>
    {[-1, 1].map((s) => (
      <group key={s} position={[s * 3.4, 0, 0]}>
        <mesh><boxGeometry args={[4.6, 0.06, 1.8]} /><meshStandardMaterial color="#1f3f8f" metalness={0.3} roughness={0.3} /></mesh>
        {[-1.15, 0, 1.15].map((x) => <mesh key={x} position={[x, 0.04, 0]}><boxGeometry args={[0.04, 0.02, 1.8]} /><meshStandardMaterial color="#c9ccd1" /></mesh>)}
      </group>
    ))}
    <mesh position={[0, -1.2, 0]} rotation={[Math.PI, 0, 0]}><coneGeometry args={[0.9, 0.5, 20, 1, true]} /><meshStandardMaterial color="#f2f2f2" side={THREE.DoubleSide} /></mesh>
  </group>
);

const SatPlace: React.FC<{ T: AirplaneModeTimeline; t: number }> = ({ T, t }) => {
  const dome = [1.2, 0.8, 0];
  const beam = clamp01((t - T.wordTime('satellite', 'satellite', T.satellite + 2.6) + 1.2) / 0.6);
  const top = [SAT_POS[0], SAT_POS[1] - 1.4, SAT_POS[2]];
  return (
    <group position={SAT as [number, number, number]}>
      <CloudStream center={[0, -10, 0]} size={[140, 8, 90]} v={[-22, 0, 0]} t={t} n={46} clear={0} scale={2.2} seed={55} />
      <group rotation={[0.04 * Math.sin(t * 0.8), 0, 0.02 * Math.sin(t)]}>
        <Airliner t={t} />
        {/* satcom radome on the roof */}
        <mesh position={dome as [number, number, number]} scale={[0.9, 0.22, 0.45]}><sphereGeometry args={[1, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#e9e9e5" /></mesh>
      </group>
      <group position={SAT_POS as [number, number, number]}><Satellite t={t} /></group>
      {beam > 0 && <Link from={dome} to={top} upTo={beam} t={t} color={GREEN} n={22} size={0.18} speed={0.7} />}
      {beam > 0.95 && <group position={top as [number, number, number]} rotation={[Math.PI / 2, 0, 0]}><Rings t={t} color={GREEN} maxR={3} period={1.2} n={2} tube={0.1} /></group>}
    </group>
  );
};

// ---------------------------------------------------------------- scene

export const AirplaneModeScene: React.FC<{ timings: Timings; t: number }> = ({ timings, t }) => {
  const T = useMemo(() => buildAirplaneModeTimeline(timings), [timings]);
  const pose = cameraPose(timings, T, t);
  const shot = timings.beats.reduce((s, b) => (t >= b.start ? b.shot : s), timings.beats[0].shot);
  const inCabin = shot.startsWith('cabin') || shot === 'mast' || shot === 'cta';
  const cockpit = shot === 'cockpit' || shot === 'headset' || shot === 'approach';
  return (
    <>
      <CameraRig pose={pose} />
      <GradSky at={pose.pos} top="#2a6fd0" hor="#bfe0ff" bottom={shot === 'towers' || shot === 'approach' ? '#cfe3c0' : '#e6eef5'} />
      <PlaceLights target={pose.target} fog="#cfe3f7" near={inCabin || cockpit ? 60 : 90} far={shot === 'approach' ? 700 : shot === 'towers' ? 260 : 400} sun={2.2} hemi={['#ffffff', '#9fb0c0', 1.4]} />
      {inCabin && <Cabin T={T} t={t} shot={shot} />}
      {shot === 'exterior' && (
        <group position={EXTERIOR as [number, number, number]}>
          <group rotation={[0.05 * Math.sin(t * 0.8), 0, 0.02 * Math.sin(t)]}><Airliner t={t} /></group>
          <CloudStream center={[0, -9, 0]} size={[120, 8, 80]} v={[-22, 0, 0]} t={t} n={50} clear={0} scale={2.2} seed={55} />
        </group>
      )}
      {shot === 'phone' && <PhonePlace T={T} t={t} />}
      {shot === 'towers' && <TowersPlace T={T} t={t} />}
      {cockpit && <CockpitPlace T={T} t={t} approach={shot === 'approach'} />}
      {shot === 'satellite' && <SatPlace T={T} t={t} />}
    </>
  );
};

void progress; void easeOutCubic;
