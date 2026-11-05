import React, { useMemo } from 'react';
import { useVideoConfig } from 'remotion';
import * as THREE from 'three';
import { clamp01, easeOutBack, easeOutCubic, rng } from '../../lib/anim';
import type { Timings } from '../../types';
import { CameraRig } from '../../world/Props';
import { Hoot } from '../../mascot/Mascots';
import { Jake, type JakeProps } from '../../mascot/Jake';
import { GradSky, PlaceLights } from '../learjet/assets';
import { BackWall, Mug } from '../sleep/Scene';
import { buildMoneyTimeline, cameraPose, DESK, JAKE_DESK, MARKET, TABLE, type MoneyTimeline } from './timeline';

const WINDOW_X = -0.75;
type V3 = [number, number, number];

/** Hoot perched somewhere, always turned to face the camera, beak synced to the narration. */
const TalkingHoot: React.FC<{ at: number[]; cam: number[]; t: number; talk: number; scale?: number; wave?: number }> = ({ at, cam, t, talk, scale = 0.2, wave = 0 }) => {
  const yaw = Math.atan2(cam[0] - at[0], cam[2] - at[2]);
  return (
    <group position={at as V3} rotation={[0, yaw, 0]} scale={scale}>
      <Hoot t={t} talk={talk} wave={wave} />
    </group>
  );
};

/** A texture drawn once on a 2D canvas. */
const useCanvasTexture = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, deps: unknown[] = []) =>
  useMemo(() => {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d')!);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

/**
 * Cartoon "20" note (NOT the real $20 design: 18 U.S.C. §504). Flat green, big 20s, an owl in the oval.
 * Real-note size 0.156 × 0.066 m; drawn a little larger (×1.25) so it reads on a phone.
 */
const NOTE_W = 0.195, NOTE_H = 0.0825;
const drawNote = (g: CanvasRenderingContext2D, back: boolean) => {
  const W = 1024, H = 434;
  g.fillStyle = back ? '#8fc79a' : '#a8d8a8';
  g.fillRect(0, 0, W, H);
  g.strokeStyle = '#2f6b45'; g.lineWidth = 18; g.strokeRect(14, 14, W - 28, H - 28);
  g.lineWidth = 4; g.strokeRect(40, 40, W - 80, H - 80);
  // guilloche-ish waves
  g.strokeStyle = 'rgba(47,107,69,0.25)'; g.lineWidth = 3;
  for (let k = 0; k < 9; k++) { g.beginPath(); for (let x = 40; x <= W - 40; x += 8) g.lineTo(x, 80 + k * 34 + 10 * Math.sin(x / 40 + k)); g.stroke(); }
  g.fillStyle = '#1f5236';
  g.font = '900 120px Montserrat, Arial Black, sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('20', 140, 120); g.fillText('20', W - 140, H - 110);
  g.font = '900 64px Montserrat, Arial Black, sans-serif';
  g.fillText('20', W - 120, 100); g.fillText('20', 120, H - 100);
  // central oval with an owl silhouette
  g.fillStyle = '#e7f4e4'; g.beginPath(); g.ellipse(W / 2, H / 2, 150, 150, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#2f6b45'; g.lineWidth = 10; g.stroke();
  g.fillStyle = '#2f6b45';
  g.beginPath(); g.ellipse(W / 2, H / 2 + 30, 70, 85, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(W / 2, H / 2 - 50, 62, 52, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.moveTo(W / 2 - 55, H / 2 - 80); g.lineTo(W / 2 - 40, H / 2 - 120); g.lineTo(W / 2 - 20, H / 2 - 92); g.fill();
  g.beginPath(); g.moveTo(W / 2 + 55, H / 2 - 80); g.lineTo(W / 2 + 40, H / 2 - 120); g.lineTo(W / 2 + 20, H / 2 - 92); g.fill();
  g.fillStyle = '#e7f4e4';
  for (const s of [-1, 1]) { g.beginPath(); g.arc(W / 2 + s * 26, H / 2 - 52, 18, 0, Math.PI * 2); g.fill(); }
  g.font = '800 34px Montserrat, Arial Black, sans-serif'; g.fillStyle = '#1f5236';
  g.fillText(back ? 'IN TRUST WE TRADE' : 'TWENTY', W / 2, H - 52);
};

const Banknote: React.FC<{ flip?: number }> = ({ flip = 0 }) => {
  const front = useCanvasTexture(1024, 434, (g) => drawNote(g, false));
  const back = useCanvasTexture(1024, 434, (g) => drawNote(g, true));
  return (
    <group rotation={[0, Math.PI * flip, 0]}>
      <mesh><planeGeometry args={[NOTE_W, NOTE_H]} /><meshStandardMaterial map={front} roughness={0.85} side={THREE.FrontSide} /></mesh>
      <mesh rotation={[0, Math.PI, 0]}><planeGeometry args={[NOTE_W, NOTE_H]} /><meshStandardMaterial map={back} roughness={0.85} side={THREE.FrontSide} /></mesh>
    </group>
  );
};

/** Red "COST: 7¢" price tag on a string, swinging under the note. */
const PriceTag: React.FC<{ t: number }> = ({ t }) => {
  const tex = useCanvasTexture(512, 300, (g) => {
    g.fillStyle = '#e2453c'; g.fillRect(0, 0, 512, 300);
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(60, 150, 22, 0, Math.PI * 2); g.fill();
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ffffff';
    g.font = '800 70px Montserrat, Arial Black, sans-serif'; g.fillText('COST', 290, 90);
    g.font = '900 150px Montserrat, Arial Black, sans-serif'; g.fillText('7¢', 290, 205);
  });
  const swing = 0.18 * Math.sin(t * 3.1) * Math.exp(-0.15 * t) + 0.05 * Math.sin(t * 1.7);
  return (
    <group position={[-NOTE_W * 0.32, -NOTE_H / 2, 0.012]} rotation={[0, 0, swing]}>
      <mesh position={[0, -0.025, 0]}><cylinderGeometry args={[0.0012, 0.0012, 0.05, 4]} /><meshBasicMaterial color="#f4f1e6" /></mesh>
      <mesh position={[0, -0.075, 0]}><planeGeometry args={[0.085, 0.05]} /><meshStandardMaterial map={tex} roughness={0.6} side={THREE.DoubleSide} /></mesh>
    </group>
  );
};

/** Jake's room, daytime (money series). Same layout as the awake scene. */
const Room: React.FC = () => {
  const wall = '#cdd8e8';
  return (
    <group>
      <mesh position={[WINDOW_X, 1.6, -3.2]}><planeGeometry args={[6, 4]} /><meshBasicMaterial color="#8fc4f0" toneMapped={false} /></mesh>
      {[-1.2, -0.85, -0.5, -0.2, 0.15, 0.45].map((x, i) => <mesh key={i} position={[WINDOW_X + x, 0.75 + (i % 3) * 0.12, -3.05]}><planeGeometry args={[0.3, 0.6 + (i % 3) * 0.25]} /><meshBasicMaterial color="#7d8ca3" toneMapped={false} /></mesh>)}
      <mesh position={[0, 2.8, -0.1]}><boxGeometry args={[4.6, 0.05, 4.2]} /><meshStandardMaterial color="#eef1f6" /></mesh>
      <BackWall color={wall} breathe={0} />
      <mesh position={[-2.25, 1.4, -0.1]}><boxGeometry args={[0.1, 2.8, 4.0]} /><meshStandardMaterial color={wall} roughness={0.9} /></mesh>
      <mesh position={[2.25, 1.4, -0.1]}><boxGeometry args={[0.1, 2.8, 4.0]} /><meshStandardMaterial color={wall} roughness={0.9} /></mesh>
      {Array.from({ length: 11 }, (_, i) => <mesh key={i} position={[-2.0 + i * 0.4, -0.01, -0.1]} receiveShadow><boxGeometry args={[0.39, 0.02, 4.0]} /><meshStandardMaterial color={i % 2 ? '#b98c5f' : '#a97c52'} /></mesh>)}
      {[[0, 0.52, 1.2, 0.05], [0, -0.52, 1.2, 0.05], [0.57, 0, 0.05, 1.08], [-0.57, 0, 0.05, 1.08], [0, 0, 0.03, 1.0]].map(([x, y, w, h], i) => (
        <mesh key={i} position={[WINDOW_X + x, 1.45 + y, -1.97]}><boxGeometry args={[w, h, 0.06]} /><meshStandardMaterial color="#f7f5f0" /></mesh>
      ))}
      {/* poster: a big green "$" on the wall behind Jake (series motif) */}
      <mesh position={[0.95, 1.55, -1.96]}><planeGeometry args={[0.5, 0.66]} /><meshStandardMaterial color="#21b3a0" /></mesh>
      <mesh position={[0.95, 1.55, -1.95]}><circleGeometry args={[0.17, 28]} /><meshStandardMaterial color="#fff3dd" /></mesh>
      {/* desk, laptop, lamp, mug */}
      <group position={DESK as V3}>
        <mesh position={[0, 0.75, 0]}><boxGeometry args={[1.3, 0.05, 0.6]} /><meshStandardMaterial color="#f2efe8" /></mesh>
        <mesh position={[0, 0.42, 0.29]}><boxGeometry args={[1.26, 0.62, 0.02]} /><meshStandardMaterial color="#e2ded6" /></mesh>
        {[[-0.62, -0.27], [0.62, -0.27], [-0.62, 0.27], [0.62, 0.27]].map(([x, z], i) => <mesh key={i} position={[x, 0.37, z]}><boxGeometry args={[0.04, 0.74, 0.04]} /><meshStandardMaterial color="#c9ccd1" /></mesh>)}
        <group position={[0.36, 0.78, -0.02]} rotation={[0, -0.5, 0]}>
          <mesh position={[0, 0.01, -0.07]}><boxGeometry args={[0.36, 0.02, 0.24]} /><meshStandardMaterial color="#c9ccd1" metalness={0.5} roughness={0.3} /></mesh>
          <group position={[0, 0.01, 0.05]} rotation={[0.25, 0, 0]}>
            <mesh position={[0, 0.12, 0]}><boxGeometry args={[0.36, 0.24, 0.012]} /><meshStandardMaterial color="#b9bdc4" metalness={0.5} roughness={0.3} /></mesh>
          </group>
        </group>
        <group position={[0.55, 0.78, -0.2]}>
          <mesh position={[0, 0.01, 0]}><cylinderGeometry args={[0.07, 0.08, 0.02, 16]} /><meshStandardMaterial color="#26313d" /></mesh>
          <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.01, 0.01, 0.4, 6]} /><meshStandardMaterial color="#26313d" /></mesh>
          <mesh position={[-0.05, 0.4, 0]} rotation={[0, 0, 0.5]}><coneGeometry args={[0.1, 0.14, 16, 1, true]} /><meshStandardMaterial color="#ffd21f" side={THREE.DoubleSide} emissive="#ffd21f" emissiveIntensity={0.3} /></mesh>
        </group>
        <Mug at={[-0.42, 0.775, 0.05]} color="#ff8a3d" />
      </group>
      {/* desk chair behind Jake */}
      <group position={[JAKE_DESK[0], 0, JAKE_DESK[2] - 0.12]}>
        <mesh position={[0, 0.42, 0.05]}><boxGeometry args={[0.46, 0.07, 0.44]} /><meshStandardMaterial color="#3b4a63" /></mesh>
        <mesh position={[0, 0.75, -0.17]}><boxGeometry args={[0.46, 0.6, 0.05]} /><meshStandardMaterial color="#3b4a63" /></mesh>
        <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.03, 0.03, 0.42, 8]} /><meshStandardMaterial color="#8a9099" /></mesh>
      </group>
      <pointLight position={[0, 2.4, 0.5]} intensity={5} distance={6} color="#fff3dd" />
      <pointLight position={[0.1, 1.5, 0.6]} intensity={1.6} distance={3} color="#ffffff" />
    </group>
  );
};

/** A cartoon fish, ~0.45 m, held by the tail (local origin = tail grip, body hangs along -y, flat sides face ±z). */
const Fish: React.FC<{ flop: number }> = ({ flop }) => (
  <group rotation={[0, 0, flop]}>
    {/* forked tail fin */}
    {[-1, 1].map((s) => <mesh key={s} position={[s * 0.035, -0.035, 0]} rotation={[0, 0, s * 0.5]} scale={[0.035, 0.07, 0.008]}><sphereGeometry args={[1, 12, 8]} /><meshStandardMaterial color="#3f7fa8" /></mesh>)}
    <mesh position={[0, -0.09, 0]} scale={[0.03, 0.05, 0.025]}><sphereGeometry args={[1, 12, 10]} /><meshStandardMaterial color="#5a9cc4" /></mesh>
    {/* body */}
    <mesh position={[0, -0.25, 0]} scale={[0.085, 0.17, 0.04]}><sphereGeometry args={[1, 24, 16]} /><meshStandardMaterial color="#6fa9cc" roughness={0.35} metalness={0.15} /></mesh>
    <mesh position={[0.025, -0.26, 0]} scale={[0.06, 0.14, 0.042]}><sphereGeometry args={[1, 20, 14]} /><meshStandardMaterial color="#dcecf4" roughness={0.4} /></mesh>
    {/* dorsal fin */}
    <mesh position={[-0.085, -0.25, 0]} rotation={[0, 0, 0]} scale={[0.03, 0.08, 0.006]}><sphereGeometry args={[1, 12, 8]} /><meshStandardMaterial color="#3f7fa8" /></mesh>
    {/* eyes on both flat sides, near the head end */}
    {[-1, 1].map((s) => <group key={s} position={[0.01, -0.36, s * 0.03]}>
      <mesh scale={[1, 1, 0.5]}><sphereGeometry args={[0.02, 12, 10]} /><meshStandardMaterial color="#ffffff" /></mesh>
      <mesh position={[0, 0, s * 0.008]} scale={[1, 1, 0.5]}><sphereGeometry args={[0.01, 10, 8]} /><meshBasicMaterial color="#111" /></mesh>
    </group>)}
    {/* mouth */}
    <mesh position={[0.0, -0.415, 0]} scale={[0.02, 0.01, 0.02]}><sphereGeometry args={[1, 8, 6]} /><meshBasicMaterial color="#2a1a1a" /></mesh>
  </group>
);

const Shoes: React.FC = () => (
  <group>
    {[-1, 1].map((s) => (
      <group key={s} position={[s * 0.065, 0, 0]}>
        {/* sole */}
        <mesh position={[0, 0.012, 0.01]} scale={[0.05, 0.012, 0.13]}><sphereGeometry args={[1, 16, 8]} /><meshStandardMaterial color="#f4f1e6" /></mesh>
        {/* upper: rounded toe box + heel */}
        <mesh position={[0, 0.04, 0.05]} scale={[0.048, 0.035, 0.085]}><sphereGeometry args={[1, 18, 12]} /><meshStandardMaterial color="#c0392b" /></mesh>
        <mesh position={[0, 0.055, -0.06]} scale={[0.047, 0.05, 0.06]}><sphereGeometry args={[1, 18, 12]} /><meshStandardMaterial color="#c0392b" /></mesh>
        {/* ankle opening */}
        <mesh position={[0, 0.1, -0.06]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.03, 16]} /><meshBasicMaterial color="#3a1a14" /></mesh>
        {/* laces */}
        {[0.0, 0.03, 0.06].map((z, i) => <mesh key={i} position={[0, 0.073 - i * 0.008, z - 0.015]}><boxGeometry args={[0.05, 0.006, 0.008]} /><meshBasicMaterial color="#ffffff" /></mesh>)}
        {/* side stripe */}
        {[-1, 1].map((k) => <mesh key={k} position={[k * 0.047, 0.04, -0.01]} rotation={[0.4, k * Math.PI / 2, 0]}><planeGeometry args={[0.09, 0.012]} /><meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} /></mesh>)}
      </group>
    ))}
  </group>
);

/** A simple trader: body, head, arms forward holding something, with a head shake. */
const Trader: React.FC<{ at: number[]; rotY: number; shake: number; disgust: number; hold?: React.ReactNode }> = ({ at, rotY, shake, disgust, hold }) => (
  <group position={at as V3} rotation={[0, rotY, 0]}>
    {[-1, 1].map((s) => <mesh key={s} position={[s * 0.09, 0.42, 0]}><capsuleGeometry args={[0.065, 0.7, 6, 10]} /><meshStandardMaterial color="#5b4a3a" /></mesh>)}
    <mesh position={[0, 1.13, 0]}><capsuleGeometry args={[0.17, 0.32, 8, 14]} /><meshStandardMaterial color="#f0b429" /></mesh>
    <mesh position={[0, 0.95, 0.02]}><cylinderGeometry args={[0.2, 0.22, 0.08, 16]} /><meshStandardMaterial color="#8e5bd1" /></mesh>
    {[-1, 1].map((s) => (
      <group key={s} position={[s * 0.2, 1.3, 0]} rotation={[-1.1, 0, 0]}>
        <mesh position={[0, -0.18, 0]}><capsuleGeometry args={[0.05, 0.3, 6, 10]} /><meshStandardMaterial color="#f0b429" /></mesh>
        <mesh position={[0, -0.38, 0]}><sphereGeometry args={[0.045, 10, 8]} /><meshStandardMaterial color="#b98256" /></mesh>
      </group>
    ))}
    {hold && <group position={[0, 1.08, 0.36]}>{hold}</group>}
    <group position={[0, 1.58, 0]} rotation={[0, 0.35 * Math.sin(shake * 18) * Math.min(1, shake * 4), 0]}>
      <mesh><sphereGeometry args={[0.15, 20, 16]} /><meshStandardMaterial color="#b98256" /></mesh>
      {/* turban-style head wrap */}
      <mesh position={[0, 0.08, -0.01]} scale={[1.08, 0.6, 1.08]}><sphereGeometry args={[0.15, 16, 10]} /><meshStandardMaterial color="#ffffff" /></mesh>
      {[-1, 1].map((s) => <mesh key={s} position={[s * 0.05, 0.01 - 0.01 * disgust, 0.135]} scale={[1, 1 - 0.7 * disgust, 0.5]}><sphereGeometry args={[0.018, 10, 8]} /><meshBasicMaterial color="#1a1010" /></mesh>)}
      {/* eyebrows angle down in disgust */}
      {[-1, 1].map((s) => <mesh key={s} position={[s * 0.05, 0.045, 0.14]} rotation={[0, 0, s * 0.5 * disgust]}><boxGeometry args={[0.045, 0.01, 0.01]} /><meshBasicMaterial color="#2a1a10" /></mesh>)}
      <mesh position={[0, -0.02, 0.15]}><sphereGeometry args={[0.022, 10, 8]} /><meshStandardMaterial color="#a8724a" /></mesh>
      {/* frown */}
      <mesh position={[0, -0.075, 0.138]} rotation={[0, 0, Math.PI]} scale={[1, 0.3 + 0.7 * disgust, 1]}><torusGeometry args={[0.03, 0.006, 6, 12, Math.PI]} /><meshBasicMaterial color="#4a1a14" /></mesh>
    </group>
  </group>
);

/** EP1 flash-back: an old market stall in warm light. */
const Market: React.FC<{ T: MoneyTimeline; t: number; cam: number[]; talk: number }> = ({ T, t, cam, talk }) => {
  const hate = T.wordTime('barter', 'hate', T.s('barter') + 3);
  const nope = clamp01((t - hate - 0.1) / 0.3);
  const sad = clamp01((t - hate - 0.25) / 0.35);
  const offer = T.wordTime('barter', 'fish', T.s('barter') + 2);
  const reach = easeOutCubic(clamp01((t - offer + 0.1) / 0.4)) * (1 - 0.6 * sad);
  const flop = -0.15 * reach + sad * (0.6 + 0.12 * Math.sin(t * 16) * (1 - clamp01((t - hate - 0.9) / 0.4)));
  const jake: JakeProps = {
    t, pose: 'stand', lids: 0.05 + 0.25 * sad, brows: 0.6 * (1 - sad) - 0.7 * sad, smile: 0.7 - 1.2 * sad, mouth: 0.1 * sad,
    armR: [0.55 + 0.75 * reach, -0.1, 0.35 + 0.25 * reach], armL: [0.15, 0.08, 0.3],
    holdR: <group rotation={[0.55 + 0.75 * reach + 0.35 + 0.25 * reach, 0, 0]}><group position={[0, 0.0, 0.02]} rotation={[0, -0.95, 0]}><Fish flop={flop} /></group></group>,
    look: [0.45, 0.05 * sad],
  };
  const sand = useMemo(() => { const r = rng(7); return Array.from({ length: 22 }, () => [r() * 8 - 4, r() * 6 - 4, 0.15 + r() * 0.3]); }, []);
  return (
    <group position={MARKET as V3}>
      {/* sky band + dunes + sand */}
      <mesh position={[0, 3, -6]}><planeGeometry args={[30, 10]} /><meshBasicMaterial color="#ffd9a0" toneMapped={false} /></mesh>
      {[[-4, -5, 3.5], [1.5, -5.5, 4.5], [6, -5, 3]].map(([x, z, r], i) => <mesh key={i} position={[x, -r * 0.6, z]} scale={[1.6, 1, 1]}><sphereGeometry args={[r, 24, 12]} /><meshStandardMaterial color="#e3b878" roughness={1} /></mesh>)}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[30, 20]} /><meshStandardMaterial color="#e8c48e" roughness={1} /></mesh>
      {sand.map(([x, z, s], i) => <mesh key={i} position={[x, 0.01, z]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[s, 10]} /><meshStandardMaterial color="#dcb27a" roughness={1} /></mesh>)}
      {/* the stall: counter, posts, striped awning */}
      <group position={[0, 0, -1.1]}>
        <mesh position={[0, 0.45, 0]}><boxGeometry args={[2.0, 0.9, 0.6]} /><meshStandardMaterial color="#9a6a3e" roughness={0.9} /></mesh>
        <mesh position={[0, 0.92, 0]}><boxGeometry args={[2.1, 0.05, 0.7]} /><meshStandardMaterial color="#7a4f2c" /></mesh>
        {[-1, 1].map((s) => <mesh key={s} position={[s * 1.0, 1.25, 0.3]}><cylinderGeometry args={[0.035, 0.035, 2.5, 8]} /><meshStandardMaterial color="#6a4426" /></mesh>)}
        {[-1, 1].map((s) => <mesh key={s} position={[s * 1.0, 1.25, -0.6]}><cylinderGeometry args={[0.035, 0.035, 2.5, 8]} /><meshStandardMaterial color="#6a4426" /></mesh>)}
        {Array.from({ length: 8 }, (_, i) => <mesh key={i} position={[-0.92 + i * 0.263, 2.42, -0.15]} rotation={[0.25, 0, 0]}><boxGeometry args={[0.263, 0.04, 1.1]} /><meshStandardMaterial color={i % 2 ? '#ffffff' : '#e2453c'} /></mesh>)}
        {/* goods: pots, baskets of fruit */}
        {[[-0.7, '#c4693a'], [-0.45, '#b45a2e']].map(([x, c], i) => <mesh key={i} position={[x as number, 1.05, 0]}><sphereGeometry args={[0.1, 14, 10]} /><meshStandardMaterial color={c as string} /></mesh>)}
        <mesh position={[0.6, 0.99, 0]}><cylinderGeometry args={[0.16, 0.12, 0.09, 14]} /><meshStandardMaterial color="#c9a46a" /></mesh>
        {[[0.55, 0.03], [0.64, -0.04], [0.62, 0.06], [0.52, -0.05]].map(([x, z], i) => <mesh key={i} position={[x, 1.07, z]}><sphereGeometry args={[0.045, 10, 8]} /><meshStandardMaterial color={i % 2 ? '#f0b429' : '#e2453c'} /></mesh>)}
      </group>
      {/* the trader behind... no: in front of the stall, facing Jake, holding the shoes */}
      <Trader at={[0.45, 0, -0.35]} rotY={-1.0} shake={Math.max(0, t - hate - 0.05) * (1 - clamp01((t - hate - 1.0) / 0.3))} disgust={nope} hold={<group position={[0, 0.12, 0]} rotation={[0.25, 1.0 + Math.PI / 2, 0]} scale={1.25}><Shoes /></group>} />
      {/* Jake with his fish, in a straw hat */}
      <group position={[-0.5, 0, -0.1]} rotation={[0, 0.95, 0]}>
        <Jake {...jake} />
        <group position={[0, 1.74, 0.01]} rotation={[jake.look ? jake.look[1] : 0, jake.look ? jake.look[0] : 0, 0]}>
          <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.28, 0.28, 0.015, 24]} /><meshStandardMaterial color="#e9c46a" roughness={1} /></mesh>
          <mesh position={[0, 0.07, 0]}><cylinderGeometry args={[0.12, 0.14, 0.1, 18]} /><meshStandardMaterial color="#e9c46a" roughness={1} /></mesh>
          <mesh position={[0, 0.035, 0]}><cylinderGeometry args={[0.142, 0.142, 0.03, 18]} /><meshStandardMaterial color="#e2453c" /></mesh>
        </group>
      </group>
      {/* Hoot perched on the stall's counter corner */}
      <mesh position={[0, 1.3, -1.35]}><boxGeometry args={[0.7, 0.04, 0.3]} /><meshStandardMaterial color="#7a4f2c" /></mesh>
      <TalkingHoot at={[0, 1.32, -1.35]} cam={cam.map((v, i) => v - MARKET[i])} t={t} talk={talk} scale={0.22} />
      <pointLight position={[0.5, 2.2, 1.5]} intensity={5} distance={7} color="#ffe2b0" />
    </group>
  );
};

/** EP1: shells, then coins, then paper, landing along one long table. */
const MoneyTable: React.FC<{ T: MoneyTimeline; t: number; cam: number[]; talk: number }> = ({ T, t, cam, talk }) => {
  const tShell = T.wordTime('coins', 'shells', T.s('coins') + 1.8);
  const tCoin = T.wordTime('coins', 'coins', T.s('coins') + 2.5);
  const tPaper = T.wordTime('coins', 'paper', T.s('coins') + 3.1);
  const shells = useMemo(() => { const r = rng(11); return Array.from({ length: 16 }, (_, i) => ({ x: -0.42 + r() * 0.2, z: -0.15 + r() * 0.3, d: i * 0.025, ry: r() * 6 })); }, []);
  const coins = useMemo(() => { const r = rng(12); return Array.from({ length: 9 }, (_, i) => ({ x: -0.09 + r() * 0.18, z: -0.15 + r() * 0.3, d: i * 0.04, ry: r() * 6 })); }, []);
  const drop = (t0: number, d: number) => { const k = clamp01((t - t0 - d) / 0.35); return { k, y: 0.9 * (1 - k * k) }; };
  const paperK = clamp01((t - tPaper) / 0.8);
  return (
    <group position={TABLE as V3}>
      <mesh position={[0, 2.5, -2.5]}><planeGeometry args={[14, 6]} /><meshStandardMaterial color="#5a4a6e" roughness={1} /></mesh>
      {Array.from({ length: 7 }, (_, i) => <mesh key={i} position={[-3 + i, 1.6, -2.48]}><planeGeometry args={[0.06, 3.2]} /><meshStandardMaterial color="#4a3c5c" /></mesh>)}
      <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[14, 8]} /><meshStandardMaterial color="#6b4f3a" roughness={1} /></mesh>
      {/* long table */}
      <mesh position={[0, 0.72, 0]}><boxGeometry args={[4.0, 0.06, 0.8]} /><meshStandardMaterial color="#8a5a3a" roughness={0.7} /></mesh>
      {[[-1.9, -0.35], [1.9, -0.35], [-1.9, 0.35], [1.9, 0.35]].map(([x, z], i) => <mesh key={i} position={[x, 0.35, z]}><boxGeometry args={[0.07, 0.7, 0.07]} /><meshStandardMaterial color="#6a4426" /></mesh>)}
      {/* three warm spotlights over the three eras */}
      {[-0.33, 0, 0.33].map((x, i) => <pointLight key={i} position={[x, 1.6, 0.5]} intensity={2.2} distance={2.6} color="#ffe6bf" />)}
      {/* shells */}
      {t >= tShell && shells.map((s, i) => { const d = drop(tShell, s.d); return (
        <group key={i} position={[s.x, 0.77 + d.y, s.z]} rotation={[0, s.ry, 0]} visible={d.k > 0}>
          <mesh scale={[0.075, 0.035, 0.05]}><sphereGeometry args={[1, 14, 10]} /><meshStandardMaterial color="#f6efe0" roughness={0.3} /></mesh>
          <mesh position={[0, 0.033, 0]} scale={[0.06, 0.006, 0.006]}><boxGeometry args={[1, 1, 1]} /><meshBasicMaterial color="#9a8a70" /></mesh>
        </group>); })}
      {/* coins */}
      {t >= tCoin && coins.map((c, i) => { const d = drop(tCoin, c.d); const spin = (1 - d.k) * 12; return (
        <mesh key={i} position={[c.x, 0.758 + d.y + (d.k < 1 ? 0.02 : 0), c.z]} rotation={[d.k < 1 ? spin : 0, c.ry, 0]} visible={d.k > 0}>
          <cylinderGeometry args={[0.065, 0.065, 0.016, 28]} /><meshStandardMaterial color="#f0c040" metalness={0.8} roughness={0.25} />
        </mesh>); })}
      {/* paper money: a note flutters down */}
      {t >= tPaper && (
        <group position={[0.3 + 0.1 * Math.sin(paperK * 6) * (1 - paperK), 0.76 + 0.9 * (1 - easeOutCubic(paperK)), 0]} rotation={[-Math.PI / 2 + 0.6 * Math.sin(paperK * 9) * (1 - paperK), 0, 0.3 * (1 - paperK)]}>
          <mesh><planeGeometry args={[0.24, 0.13]} /><meshStandardMaterial color="#efe2c0" side={THREE.DoubleSide} roughness={0.9} /></mesh>
          {[[-0.09, 0.03], [0.1, -0.04]].map(([x, y], i) => <mesh key={i} position={[x, y, 0.001]}><planeGeometry args={[0.06, 0.06]} /><meshBasicMaterial color="#c8322a" side={THREE.DoubleSide} /></mesh>)}
          {[-0.02, 0.0, 0.02, 0.04].map((y, i) => <mesh key={i} position={[0.0, y, 0.001]}><planeGeometry args={[0.08, 0.008]} /><meshBasicMaterial color="#3a2a1a" side={THREE.DoubleSide} /></mesh>)}
        </group>
      )}
      {/* Hoot rides along at the back edge of the table, facing the camera */}
      <TalkingHoot at={[cam[0] - TABLE[0] - 0.22, 0.75, -0.3]} cam={cam.map((v, i) => v - TABLE[i])} t={t} talk={talk} scale={0.1} />
      {/* "things everyone accepted": the fish and shoes from the market wait at the left end */}
      <group position={[-0.62, 0.77, 0.12]} rotation={[-Math.PI / 2, 0, 1.4]} scale={0.6}><Fish flop={0} /></group>
      <group position={[-0.7, 0.75, -0.18]} rotation={[0, 0.6, 0]} scale={0.7}><Shoes /></group>
    </group>
  );
};

const Desk: React.FC<{ T: MoneyTimeline; t: number; cam: number[]; talk: number }> = ({ T, t, cam, talk }) => {
  const worth = T.wordTime('hook', 'worth', T.s('hook') + 2.4);
  const flip = easeOutBack(clamp01((t - worth - 0.1) / 0.45)) * (1 - easeOutCubic(clamp01((t - worth - 1.2) / 0.45)));
  const brows = 0.6 * clamp01((t - worth + 0.1) / 0.25);
  // arm up, note held at chest height toward the camera
  const a0 = 1.15 + 0.03 * Math.sin(t * 1.3), a2 = 1.05;
  const jake: JakeProps = {
    t, pose: 'sit', lids: 0.05, smile: 0.45, brows, look: [-0.08, -0.04],
    armR: [a0, -0.75, a2], armL: [0.25, 0.05, 0.3],
    holdR: (
      <group rotation={[a0 + a2, 0, 0.32]}>
        <group position={[-0.01, 0.055, 0.015]} scale={1.3}>
          <Banknote flip={flip} />
          <PriceTag t={t} />
        </group>
      </group>
    ),
  };
  return (
    <group>
      <Room />
      <group position={JAKE_DESK as V3}>
        <Jake {...jake} />
      </group>
      {/* a stack of books for Hoot to perch on */}
      {[['#2f6fd6', 0.0], ['#e2453c', 0.25], ['#f0b429', -0.15]].map(([c, r], i) => <mesh key={i} position={[-0.2, 0.8 + i * 0.045, -0.78]} rotation={[0, r as number, 0]}><boxGeometry args={[0.24, 0.045, 0.17]} /><meshStandardMaterial color={c as string} /></mesh>)}
      <TalkingHoot at={[-0.2, 0.912, -0.78]} cam={cam} t={t} talk={talk} scale={0.09} />
    </group>
  );
};

export const MoneyScene: React.FC<{ timings: Timings; t: number }> = ({ timings, t }) => {
  const T = useMemo(() => buildMoneyTimeline(timings), [timings]);
  const { fps } = useVideoConfig();
  const pose = cameraPose(timings, T, t);
  const shot = timings.beats.reduce((s, b) => (t >= b.start ? b.shot : s), timings.beats[0].shot);
  const talk = timings.mouth?.[Math.round(t * fps)] ?? 0;
  const place = shot === 'barter' ? 'market' : shot === 'timeline' ? 'table' : 'room';
  return (
    <>
      <CameraRig pose={pose} />
      <GradSky at={pose.pos} top="#2a6fd0" hor="#bfe0ff" bottom="#e6eef5" />
      <PlaceLights target={pose.target} fog="#cfe3f7" near={60} far={300} sun={place === 'table' ? 0.5 : 1.6} hemi={['#ffffff', '#9fb0c0', place === 'table' ? 0.5 : 1.3]} />
      {place === 'room' && <Desk T={T} t={t} cam={pose.pos} talk={talk} />}
      {place === 'market' && <Market T={T} t={t} cam={pose.pos} talk={talk} />}
      {place === 'table' && <MoneyTable T={T} t={t} cam={pose.pos} talk={talk} />}
    </>
  );
};
