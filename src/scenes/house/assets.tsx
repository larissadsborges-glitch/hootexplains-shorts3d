import React, { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { rng } from '../../lib/anim';
import { ROCK_Y, SOIL_Y } from './timeline';

// ---------- procedural textures ----------
let brickCanvas: HTMLCanvasElement | null = null;
const brickBase = () => {
  if (brickCanvas) return brickCanvas;
  const c = document.createElement('canvas');
  c.width = 256; c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = '#d8c4a6';
  g.fillRect(0, 0, 256, 128);
  const r = rng(5);
  const rows = 8, bw = 32, bh = 16;
  for (let y = 0; y < rows; y++) {
    for (let x = -1; x < 9; x++) {
      const off = y % 2 ? bw / 2 : 0;
      const l = 0.42 + r() * 0.08;
      g.fillStyle = `hsl(${12 + r() * 6}, ${48 + r() * 10}%, ${l * 100}%)`;
      g.fillRect(x * bw + off + 1.5, y * bh + 1.5, bw - 3, bh - 3);
    }
  }
  brickCanvas = c;
  return c;
};

/** Brick texture sized for a wall of w × h world units (one brick ≈ 0.25 × 0.125). */
export const useBrick = (w: number, h: number) =>
  useMemo(() => {
    const t = new THREE.CanvasTexture(brickBase());
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(w / 2, h / 1);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [w, h]);

export const useSignTexture = (text: string) =>
  useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 128;
    const g = c.getContext('2d')!;
    g.fillStyle = '#1f2a44';
    g.fillRect(0, 0, 256, 128);
    g.strokeStyle = '#f2c94c';
    g.lineWidth = 6;
    g.strokeRect(6, 6, 244, 116);
    g.fillStyle = '#ffffff';
    g.font = 'bold 44px Montserrat, Arial, sans-serif';
    g.textAlign = 'center';
    const [a, b] = text.split(' ');
    g.fillText(a, 128, 58);
    g.fillStyle = '#f2c94c';
    g.fillText(b ?? '', 128, 104);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [text]);

// ---------- ground in permanent cross-section ----------
const GRASS = '#6cbf45', TOPSOIL = '#8a5a3b', FIRM = '#c58b58', ROCK = '#6f747b';

/** Flat ground cut open at z = 0: grass on top, topsoil / firm ground / rock layers on the cut face. */
export const GroundSection: React.FC<{ wetAt?: { x: number; r: number; a: number } }> = ({ wetAt }) => {
  const geo = useMemo(() => {
    const X0 = -70, X1 = 70, STEP = 0.5;
    const xs: number[] = [];
    for (let x = X0; x <= X1 + 1e-6; x += STEP) xs.push(x);
    const band = (top: (x: number) => number, bot: (x: number) => number) => {
      const s = new THREE.Shape();
      s.moveTo(xs[0], top(xs[0]));
      xs.forEach((x) => s.lineTo(x, top(x)));
      for (let i = xs.length - 1; i >= 0; i--) s.lineTo(xs[i], bot(xs[i]));
      return new THREE.ShapeGeometry(s);
    };
    const g0 = () => -0.25;
    const soil = (x: number) => SOIL_Y + 0.18 * Math.sin(x * 0.6) + 0.1 * Math.sin(x * 1.7);
    const rock = (x: number) => ROCK_Y + 0.3 * Math.sin(x * 0.45) + 0.15 * Math.sin(x * 1.3);
    const r = rng(9);
    const pebbles = Array.from({ length: 140 }, () => {
      const x = X0 + 10 + r() * (X1 - X0 - 20);
      const y = -0.6 - r() * 13;
      return { x, y, s: 0.08 + r() * (y < ROCK_Y ? 0.3 : 0.14), c: y < ROCK_Y ? (r() > 0.5 ? '#8e949b' : '#575b61') : y < SOIL_Y ? '#a87446' : '#6e4630' };
    });
    return {
      grass: band(() => 0, g0),
      topsoil: band(g0, soil),
      firm: band(soil, rock),
      rock: band(rock, () => -18),
      pebbles,
    };
  }, []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -60]} receiveShadow>
        <planeGeometry args={[140, 120]} />
        <meshStandardMaterial color={GRASS} roughness={1} />
      </mesh>
      <mesh geometry={geo.grass}><meshStandardMaterial color="#5aa83e" roughness={1} /></mesh>
      <mesh geometry={geo.topsoil} receiveShadow><meshStandardMaterial color={TOPSOIL} roughness={1} /></mesh>
      <mesh geometry={geo.firm}><meshStandardMaterial color={FIRM} roughness={1} /></mesh>
      <mesh geometry={geo.rock}><meshStandardMaterial color={ROCK} roughness={1} /></mesh>
      {geo.pebbles.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, 0.01]} scale={p.s} rotation={[0, 0, i]}>
          <circleGeometry args={[1, 6]} />
          <meshStandardMaterial color={p.c} roughness={1} />
        </mesh>
      ))}
      {wetAt && wetAt.a > 0 && (
        <mesh position={[wetAt.x, -0.25 - wetAt.r * 0.55, 0.02]} scale={[wetAt.r, wetAt.r * 1.1, 1]}>
          <circleGeometry args={[1, 20]} />
          <meshStandardMaterial color="#3d4f6b" transparent opacity={0.55 * wetAt.a} roughness={1} />
        </mesh>
      )}
    </group>
  );
};

// ---------- background: trees + picket fence ----------
export const Backdrop: React.FC = () => {
  const trees = useMemo(() => {
    const r = rng(21);
    const out: { x: number; z: number; s: number; c: string }[] = [];
    while (out.length < 46) {
      const x = (r() - 0.5) * 110, z = -12 - r() * 60;
      if (Math.abs(x - 40) < 4 && z > -16) continue;
      out.push({ x, z, s: 0.9 + r() * 0.9, c: ['#4fae3e', '#5fbd47', '#46a039'][Math.floor(r() * 3)] });
    }
    return out;
  }, []);
  const fence = useMemo(() => Array.from({ length: 81 }, (_, i) => -40 + i), []);
  return (
    <>
      {trees.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]} scale={t.s}>
          <mesh position={[0, 0.7, 0]} castShadow>
            <cylinderGeometry args={[0.13, 0.18, 1.4, 6]} />
            <meshStandardMaterial color="#7a4e2a" flatShading />
          </mesh>
          <mesh position={[0, 2.1, 0]} castShadow>
            <icosahedronGeometry args={[1.2, 0]} />
            <meshStandardMaterial color={t.c} flatShading />
          </mesh>
        </group>
      ))}
      {fence.map((x) => (
        <mesh key={x} position={[x, 0.45, -11]} castShadow>
          <boxGeometry args={[0.12, 0.9, 0.06]} />
          <meshStandardMaterial color="#f4f1ea" />
        </mesh>
      ))}
      {[0.3, 0.65].map((y) => (
        <mesh key={y} position={[0, y, -11.05]}>
          <boxGeometry args={[80, 0.08, 0.04]} />
          <meshStandardMaterial color="#f4f1ea" />
        </mesh>
      ))}
    </>
  );
};

// ---------- rain ----------
export const Rain: React.FC<{ t: number; amount: number; center: [number, number, number] }> = ({ t, amount, center }) => {
  const N = 1000;
  const ref = useRef<THREE.InstancedMesh>(null);
  const seeds = useMemo(() => {
    const r = rng(3);
    return Array.from({ length: N }, () => [r(), r(), r()]);
  }, []);
  useLayoutEffect(() => {
    const m = ref.current!;
    const M = new THREE.Matrix4();
    const H = 14;
    seeds.forEach(([a, b, c], i) => {
      const show = i / N < amount;
      const x = center[0] + (a - 0.5) * 22, z = center[2] + (b - 0.5) * 12 - 1;
      const y = H - ((t * 16 + c * H) % H) - 1;
      M.makeTranslation(x, y, z);
      if (!show) M.makeScale(0, 0, 0);
      m.setMatrixAt(i, M);
    });
    m.instanceMatrix.needsUpdate = true;
  }, [t, amount, center, seeds]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, N]}>
      <boxGeometry args={[0.035, 0.7, 0.035]} />
      <meshBasicMaterial color="#d8ecff" transparent opacity={0.85} />
    </instancedMesh>
  );
};
