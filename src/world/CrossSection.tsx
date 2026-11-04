import React, { useLayoutEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { rng } from '../lib/anim';
import { heightAt, WATER_Y } from './terrain';

/** Shared clip plane: keeps everything with z <= constant. Park it far away when not cutting. */
export const CUT_PLANE = new THREE.Plane(new THREE.Vector3(0, 0, -1), 1e6);
export const CLIP = [CUT_PLANE];

/** Turns local clipping on and moves the cut plane to z = at (or far away). */
export const Cutter: React.FC<{ active: boolean; at?: number }> = ({ active, at = 0 }) => {
  const gl = useThree((s) => s.gl);
  useLayoutEffect(() => {
    gl.localClippingEnabled = true;
    CUT_PLANE.constant = active ? at : 1e6;
  }, [gl, active, at]);
  return null;
};

const SOIL = '#c49662', SOIL_DARK = '#9c7448', ROCK = '#62676e', ROCK_LIGHT = '#8e949b', WATER = '#56aaf2';

/**
 * The cut face: soil and rock layers under the terrain profile at z = 0, and the water
 * body over the riverbed. Rendered only while the cutaway view is on.
 */
export const CrossSection: React.FC<{ hw: number; rockY: number }> = ({ hw, rockY }) => {
  const geo = useMemo(() => {
    const X0 = -40, X1 = 40, STEP = 0.4;
    const xs: number[] = [];
    for (let x = X0; x <= X1 + 1e-6; x += STEP) xs.push(x);
    const prof = xs.map((x) => heightAt(x, 0, hw) - 0.02);
    const rockTop = (x: number) => rockY + 0.25 * Math.sin(x * 0.7) + 0.15 * Math.sin(x * 1.9);

    const soil = new THREE.Shape();
    soil.moveTo(xs[0], prof[0]);
    xs.forEach((x, i) => soil.lineTo(x, prof[i]));
    for (let i = xs.length - 1; i >= 0; i--) soil.lineTo(xs[i], rockTop(xs[i]));

    const rock = new THREE.Shape();
    rock.moveTo(xs[0], rockTop(xs[0]));
    xs.forEach((x) => rock.lineTo(x, rockTop(x)));
    rock.lineTo(X1, -18);
    rock.lineTo(X0, -18);

    const water = new THREE.Shape();
    const wet = xs.map((x, i) => [x, prof[i]] as const).filter(([, y]) => y < WATER_Y);
    if (wet.length) {
      water.moveTo(wet[0][0] - STEP, WATER_Y);
      wet.forEach(([x, y]) => water.lineTo(x, y));
      water.lineTo(wet[wet.length - 1][0] + STEP, WATER_Y);
    }

    const r = rng(31);
    const pebbles: { x: number; y: number; s: number; c: string }[] = [];
    for (let i = 0; i < 160; i++) {
      const x = X0 + 5 + r() * (X1 - X0 - 10);
      const top = heightAt(x, 0, hw) - 0.3;
      const y = top - r() * (top + 16);
      const inRock = y < rockTop(x);
      pebbles.push({ x, y, s: 0.12 + r() * (inRock ? 0.35 : 0.18), c: inRock ? (r() > 0.5 ? ROCK_LIGHT : '#5f646a') : SOIL_DARK });
    }
    return {
      soil: new THREE.ShapeGeometry(soil),
      rock: new THREE.ShapeGeometry(rock),
      water: wet.length ? new THREE.ShapeGeometry(water) : null,
      pebbles,
    };
  }, [hw, rockY]);

  return (
    <group position={[0, 0, 0]}>
      <mesh geometry={geo.soil} receiveShadow>
        <meshStandardMaterial color={SOIL} roughness={1} flatShading />
      </mesh>
      <mesh geometry={geo.rock}>
        <meshStandardMaterial color={ROCK} roughness={1} flatShading />
      </mesh>
      {geo.water && (
        <mesh geometry={geo.water} position={[0, 0, 0.005]}>
          <meshStandardMaterial color={WATER} roughness={0.4} transparent opacity={0.92} />
        </mesh>
      )}
      {geo.pebbles.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, 0.01]} scale={p.s} rotation={[0, 0, i]}>
          <circleGeometry args={[1, 6]} />
          <meshStandardMaterial color={p.c} roughness={1} />
        </mesh>
      ))}
    </group>
  );
};
