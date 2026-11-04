import React, { useLayoutEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { rng } from '../lib/anim';

export const Car: React.FC<{
  position: [number, number, number];
  rotation?: [number, number, number];
  wheelSpin?: number;
  color?: string;
}> = ({ position, rotation = [0, 0, 0], wheelSpin = 0, color = '#e2453c' }) => (
  <group position={position} rotation={rotation}>
    <mesh castShadow position={[0, 0.05, 0]}>
      <boxGeometry args={[1.7, 0.4, 0.9]} />
      <meshStandardMaterial color={color} flatShading roughness={0.5} />
    </mesh>
    <mesh castShadow position={[-0.12, 0.4, 0]}>
      <boxGeometry args={[0.9, 0.3, 0.8]} />
      <meshStandardMaterial color="#a9d8f5" flatShading roughness={0.2} />
    </mesh>
    <mesh castShadow position={[-0.12, 0.58, 0]}>
      <boxGeometry args={[0.96, 0.07, 0.86]} />
      <meshStandardMaterial color={color} flatShading />
    </mesh>
    {[
      [0.55, 0.45], [0.55, -0.45], [-0.55, 0.45], [-0.55, -0.45],
    ].map(([x, z], i) => (
      <mesh key={i} position={[x, -0.18, z]} rotation={[Math.PI / 2, wheelSpin, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 0.18, 10]} />
        <meshStandardMaterial color="#26282c" flatShading />
      </mesh>
    ))}
  </group>
);

/**
 * A burst of particles (water splash, dust puff…). Fully deterministic:
 * particle positions are a function of time since `t0`.
 */
export const Burst: React.FC<{
  t: number;
  t0: number;
  at: [number, number, number];
  count?: number;
  seed?: number;
  color?: string;
  speed?: number;
  up?: number;
  gravity?: number;
  life?: number;
  size?: number;
  floorY?: number;
  ring?: boolean;
}> = ({ t, t0, at, count = 16, seed = 1, color = '#ffffff', speed = 2.5, up = 5, gravity = 9.8, life = 1, size = 0.25, floorY = -10, ring = false }) => {
  const parts = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: count }, () => {
      const a = r() * Math.PI * 2, s = speed * (0.4 + r() * 0.6);
      return { v: [Math.cos(a) * s, up * (0.5 + r() * 0.5), Math.sin(a) * s], s: 0.6 + r() * 0.8, l: life * (0.6 + r() * 0.4) };
    });
  }, [count, seed, speed, up, life]);
  const dt = t - t0;
  if (dt < 0 || dt > life * 1.1) return null;
  return (
    <group position={at}>
      {parts.map((p, i) => {
        if (dt > p.l) return null;
        const y = p.v[1] * dt - 0.5 * gravity * dt * dt;
        if (at[1] + y < floorY) return null;
        const k = 1 - dt / p.l;
        return (
          <mesh key={i} position={[p.v[0] * dt, y, p.v[2] * dt]} scale={size * p.s * (0.4 + 0.6 * k)}>
            <icosahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color={color} flatShading emissive={color} emissiveIntensity={0.25} />
          </mesh>
        );
      })}
      {ring && dt < 0.9 && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]} scale={0.4 + dt * 3.2}>
          <ringGeometry args={[0.8, 1, 24]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.85 * (1 - dt / 0.9)} />
        </mesh>
      )}
    </group>
  );
};

export type Shot = {
  from: { pos: number[]; target: number[]; fov?: number };
  to: { pos: number[]; target: number[]; fov?: number };
  ease?: (x: number) => number;
};

export type CameraPose = { pos: [number, number, number]; target: [number, number, number]; fov: number };

/** Applies a precomputed pose to the R3F camera (the same pose is used to anchor 2D labels). */
export const CameraRig: React.FC<{ pose: CameraPose }> = ({ pose }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    camera.position.set(...pose.pos);
    camera.fov = pose.fov;
    camera.near = 0.1;
    camera.far = 1200;
    camera.updateProjectionMatrix();
    camera.lookAt(...pose.target);
  }, [camera, pose]);
  return null;
};

/** Project a 3D point to pixel coordinates for a given camera pose. */
export const projectToScreen = (pose: CameraPose, point: number[], width: number, height: number) => {
  const cam = new THREE.PerspectiveCamera(pose.fov, width / height, 0.1, 1200);
  cam.position.set(...pose.pos);
  cam.lookAt(...pose.target);
  cam.updateMatrixWorld();
  const v = new THREE.Vector3(point[0], point[1], point[2]).project(cam);
  return { x: ((v.x + 1) / 2) * width, y: ((1 - v.y) / 2) * height, visible: v.z < 1 };
};
