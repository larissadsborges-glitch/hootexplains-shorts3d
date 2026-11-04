import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { rng } from '../lib/anim';
import { buildTerrainGeometry, heightAt, RIVER_HALF, riverCenter, WATER_Y } from './terrain';

export const Sky: React.FC = () => {
  const geo = useMemo(() => {
    const g = new THREE.SphereGeometry(500, 32, 16);
    const top = new THREE.Color('#2a7fe0'), hor = new THREE.Color('#9fd2ff');
    const p = g.attributes.position;
    const cols = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      const k = Math.pow(Math.max(0, p.getY(i) / 500), 0.6);
      hor.clone().lerp(top, k).toArray(cols, i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    return g;
  }, []);
  return (
    <mesh geometry={geo}>
      <meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} />
    </mesh>
  );
};

export const Lights: React.FC = () => (
  <>
    <hemisphereLight args={['#e6f4ff', '#6f9a4f', 1.4]} />
    <ambientLight intensity={0.25} />
    <directionalLight
      position={[25, 40, 18]}
      intensity={2.6}
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-camera-left={-26}
      shadow-camera-right={26}
      shadow-camera-top={26}
      shadow-camera-bottom={-26}
      shadow-camera-near={1}
      shadow-camera-far={120}
      shadow-bias={-0.0006}
    />
    <fog attach="fog" args={['#b4dcff', 80, 260]} />
  </>
);

export const Terrain: React.FC<{ hw?: number; clip?: THREE.Plane[] }> = ({ hw = RIVER_HALF, clip }) => {
  const key = Math.round(hw * 50) / 50;
  const geo = useMemo(() => buildTerrainGeometry(key), [key]);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial vertexColors flatShading roughness={0.95} clippingPlanes={clip} />
    </mesh>
  );
};

/** Faceted low-poly water that ripples over time. */
export const Water: React.FC<{ t: number; clip?: THREE.Plane[] }> = ({ t, clip }) => {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(170, 250, 70, 100);
    g.rotateX(-Math.PI / 2);
    g.translate(0, 0, -80);
    const f = g.toNonIndexed();
    f.userData.base = (f.attributes.position.array as Float32Array).slice();
    const p = f.attributes.position;
    const cols = new Float32Array(p.count * 3);
    const deep = new THREE.Color('#2b88e4'), mid = new THREE.Color('#3391e9'), light = new THREE.Color('#6ab6f4');
    const r = rng(17);
    for (let i = 0; i < p.count; i += 3) {
      const x = p.getX(i), z = p.getZ(i);
      const n = Math.sin(x * 0.55 + Math.sin(z * 0.35) * 2) * Math.sin(z * 0.45 + x * 0.15);
      const v = r();
      const c = n > 0.78 && v > 0.45 ? light : v > 0.55 ? mid : deep;
      for (let k = 0; k < 3; k++) c.toArray(cols, (i + k) * 3);
    }
    f.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    return f;
  }, []);
  useLayoutEffect(() => {
    const p = geo.attributes.position as THREE.BufferAttribute;
    const base = geo.userData.base as Float32Array;
    for (let i = 0; i < p.count; i++) {
      const x = base[i * 3], z = base[i * 3 + 2];
      const y =
        WATER_Y +
        0.07 * Math.sin(x * 0.9 + z * 0.3 + t * 1.7) +
        0.05 * Math.sin(z * 0.7 - t * 1.3 + x * 0.2);
      p.setY(i, y);
    }
    p.needsUpdate = true;
    geo.computeVertexNormals();
  }, [geo, t]);
  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial vertexColors flatShading roughness={0.3} metalness={0.05} clippingPlanes={clip} />
    </mesh>
  );
};

/** Dirt road leading onto the bridge from both banks. */
export const Road: React.FC<{ from?: number; clip?: THREE.Plane[] }> = ({ from = 6, clip }) => (
  <>
    {[-1, 1].map((s) => (
      <mesh key={s} position={[s * (from + 46) / 2, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[46 - from, 2.3]} />
        <meshStandardMaterial color="#c9a26a" roughness={1} polygonOffset polygonOffsetFactor={-2} clippingPlanes={clip} />
      </mesh>
    ))}
  </>
);

type TreeSpot = { x: number; y: number; z: number; s: number; rot: number; pine: boolean; shade: number };

const useTreeSpots = () =>
  useMemo(() => {
    const r = rng(42);
    const out: TreeSpot[] = [];
    let tries = 0;
    while (out.length < 340 && tries++ < 6000) {
      const x = (r() - 0.5) * 150, z = 38 - r() * 190;
      const d = Math.abs(x - riverCenter(z));
      if (d < RIVER_HALF + 1.8) continue;
      if (Math.abs(z) < 3.4 && Math.abs(x) < 45) continue; // road
      if (Math.hypot(x + 10, z - 10) < 5) continue; // keep camera view clear
      const y = heightAt(x, z);
      if (y > 7) continue;
      out.push({ x, y, z, s: 0.8 + r() * 0.8, rot: r() * Math.PI * 2, pine: r() < 0.55, shade: r() });
    }
    return out;
  }, []);

const Instanced: React.FC<{
  geo: THREE.BufferGeometry;
  color: string;
  items: { m: THREE.Matrix4; c: number }[];
  clip?: THREE.Plane[];
}> = ({ geo, color, items, clip }) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current!;
    const base = new THREE.Color(color);
    items.forEach((it, i) => {
      mesh.setMatrixAt(i, it.m);
      mesh.setColorAt(i, base.clone().offsetHSL(0, 0, (it.c - 0.5) * 0.08));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [items, color]);
  return (
    <instancedMesh ref={ref} args={[geo, undefined, items.length]} castShadow receiveShadow>
      <meshStandardMaterial flatShading roughness={0.9} clippingPlanes={clip} />
    </instancedMesh>
  );
};

export const Trees: React.FC<{ hw?: number; clip?: THREE.Plane[] }> = ({ hw = RIVER_HALF, clip }) => {
  const all = useTreeSpots();
  const key = Math.round(hw * 10) / 10;
  const spots = useMemo(
    () => all.filter((s) => Math.abs(s.x - riverCenter(s.z)) > key + 1.8 && !(Math.abs(s.z) < 3.4 && Math.abs(s.x) < 45)),
    [all, key],
  );
  const parts = useMemo(() => {
    const mk = (s: TreeSpot, y: number, sc = 1) =>
      new THREE.Matrix4().compose(
        new THREE.Vector3(s.x, s.y + y * s.s, s.z),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0, s.rot, 0)),
        new THREE.Vector3(s.s * sc, s.s * sc, s.s * sc),
      );
    const pines = spots.filter((s) => s.pine), rounds = spots.filter((s) => !s.pine);
    return {
      trunks: spots.map((s) => ({ m: mk(s, 0.45), c: s.shade })),
      pineLow: pines.map((s) => ({ m: mk(s, 1.5), c: s.shade })),
      pineHigh: pines.map((s) => ({ m: mk(s, 2.45), c: s.shade })),
      crowns: rounds.map((s) => ({ m: mk(s, 2.0), c: s.shade })),
    };
  }, [spots]);
  const geos = useMemo(
    () => ({
      trunk: new THREE.CylinderGeometry(0.13, 0.18, 0.9, 6),
      coneLow: new THREE.ConeGeometry(1.05, 1.9, 7),
      coneHigh: new THREE.ConeGeometry(0.75, 1.5, 7),
      crown: new THREE.IcosahedronGeometry(1.15, 0),
    }),
    [],
  );
  return (
    <>
      <Instanced geo={geos.trunk} color="#8a5a35" items={parts.trunks} clip={clip} />
      <Instanced geo={geos.coneLow} color="#2f8a3e" items={parts.pineLow} clip={clip} />
      <Instanced geo={geos.coneHigh} color="#38994a" items={parts.pineHigh} clip={clip} />
      <Instanced geo={geos.crown} color="#5fb544" items={parts.crowns} clip={clip} />
    </>
  );
};

const CLOUDS: [number, number, number, number][] = [
  [-32, 24, -70, 1.3], [18, 28, -90, 1.6], [6, 21, -40, 1.0], [-14, 19, -28, 0.8],
  [38, 22, -45, 1.1], [-50, 30, -110, 1.8], [55, 32, -120, 1.7], [0, 34, -150, 2.0],
  [-22, 26, 5, 1.0], [26, 25, 12, 0.9],
];

export const Clouds: React.FC<{ t: number }> = ({ t }) => {
  const puffs = useMemo(() => {
    const r = rng(5);
    return CLOUDS.map(() =>
      Array.from({ length: 5 }, (_, i) => ({
        p: [(i - 2) * 1.7 + (r() - 0.5), (r() - 0.3) * 0.9, (r() - 0.5) * 1.6] as [number, number, number],
        s: (i === 2 ? 2.4 : 1.3 + r()) * 1.0,
      })),
    );
  }, []);
  return (
    <>
      {CLOUDS.map(([x, y, z, s], ci) => (
        <group key={ci} position={[x + t * 0.35, y, z]} scale={s * 2}>
          {puffs[ci].map((pf, i) => (
            <mesh key={i} position={pf.p} scale={pf.s}>
              <icosahedronGeometry args={[1, 0]} />
              <meshStandardMaterial color="#ffffff" flatShading emissive="#ffffff" emissiveIntensity={0.35} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
};
