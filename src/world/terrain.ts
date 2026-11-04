import * as THREE from 'three';
import { rng, smoothstep } from '../lib/anim';

/** River valley: the river runs along Z, the bridge crossing sits at z = 0. */
export const RIVER_HALF = 4.5;
export const WATER_Y = -0.55;

export const riverCenter = (z: number) => {
  const k = Math.min(1, Math.max(0, (Math.abs(z) - 10) / 25));
  return 4 * Math.sin(z * 0.03) * k;
};

const noise = (x: number, z: number) =>
  Math.sin(x * 0.21 + Math.cos(z * 0.17) * 1.7) * 0.5 +
  Math.sin(z * 0.23 + x * 0.07) * 0.35 +
  Math.sin((x + z) * 0.5) * 0.15;

export const heightAt = (x: number, z: number, hw = RIVER_HALF) => {
  const d = Math.abs(x - riverCenter(z));
  const bed = -2.0 + noise(x * 2, z * 2) * 0.15;
  let land = noise(x, z) * 0.35 + Math.max(0, d - 14) * 0.1 * (0.6 + 0.4 * noise(x * 0.5, z * 0.5));
  if (z < -95) {
    land += Math.pow((-z - 95) / 55, 1.5) * 13 * (0.65 + 0.35 * noise(x * 0.3, z * 0.3)) * smoothstep(8, 28, d);
  }
  // flat corridor for the road leading onto the bridge
  const road = 1 - smoothstep(1.6, 4.5, Math.abs(z));
  land *= 1 - road;
  const bank = smoothstep(hw - 1.2, hw + 1.0, d);
  return bed * (1 - bank) + land * bank;
};

const C = (hex: string) => new THREE.Color(hex);
const GRASS = [C('#6cbf45'), C('#5cae3b'), C('#79c94e'), C('#66b843')];
const SAND = C('#e0bd7a');
const BED = C('#c9a066');
const ROCK = C('#d9b58c');
const ROCK2 = C('#c9a27a');

export function buildTerrainGeometry(hw = RIVER_HALF) {
  const W = 170, D = 250;
  const g = new THREE.PlaneGeometry(W, D, 85, 125);
  g.rotateX(-Math.PI / 2);
  g.translate(0, 0, -D / 2 + 45);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const r = rng(7);
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i), z = pos.getZ(i);
    if (Math.abs(x) < W / 2 - 1 && z < 44 && z > -D + 46) {
      x += (r() - 0.5) * 1.2;
      z += (r() - 0.5) * 1.2;
    }
    pos.setXYZ(i, x, heightAt(x, z, hw), z);
  }
  const flat = g.toNonIndexed();
  flat.computeVertexNormals();
  const p = flat.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(p.count * 3);
  const cr = rng(11);
  for (let i = 0; i < p.count; i += 3) {
    const cx = (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3;
    const cy = (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3;
    const cz = (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3;
    const d = Math.abs(cx - riverCenter(cz));
    // draw one random number per face no matter the branch, so colours
    // stay stable when the river width animates
    const rv = cr();
    let col: THREE.Color;
    if (cy < -0.9) col = BED;
    else if (cy < 0.12 && d < hw + 1.4) col = SAND;
    else if (cy > 5) col = rv > 0.5 ? ROCK : ROCK2;
    else col = GRASS[Math.floor(rv * GRASS.length)];
    for (let k = 0; k < 3; k++) col.toArray(colors, (i + k) * 3);
  }
  flat.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return flat;
}
