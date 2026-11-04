import React, { useLayoutEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/**
 * Visual style switch applied to whatever a scene renders, so every scene gets the same look
 * without rewriting it:
 *  - blocky: as authored (flat-shaded low-poly)
 *  - soft:   rounded boxes, smooth round shapes, smooth shading ("toy" look)
 *  - real:   soft + image-based lighting, glossier materials, filmic tone mapping (stylised realistic)
 */
export type VisualStyle = 'blocky' | 'soft' | 'real';

const cache = new WeakMap<THREE.BufferGeometry, THREE.BufferGeometry>();

const upgrade = (g: THREE.BufferGeometry): THREE.BufferGeometry => {
  const hit = cache.get(g);
  if (hit) return hit;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = (g as any).parameters ?? {};
  let out: THREE.BufferGeometry = g;
  switch (g.type) {
    case 'BoxGeometry': {
      const m = Math.min(p.width, p.height, p.depth);
      // round the corners, but never more than a quarter of the thinnest side
      const r = Math.min(m * 0.3, Math.max(p.width, p.height, p.depth) * 0.08);
      if (r > 0.004) out = new RoundedBoxGeometry(p.width, p.height, p.depth, 3, r);
      break;
    }
    case 'IcosahedronGeometry':
      if ((p.detail ?? 0) < 2) out = new THREE.IcosahedronGeometry(p.radius, 2);
      break;
    case 'OctahedronGeometry':
      out = new THREE.SphereGeometry(p.radius, 16, 12);
      break;
    case 'SphereGeometry':
      if (p.widthSegments < 24) out = new THREE.SphereGeometry(p.radius, 28, 18, p.phiStart, p.phiLength, p.thetaStart, p.thetaLength);
      break;
    case 'CylinderGeometry':
      if (p.radialSegments < 20) out = new THREE.CylinderGeometry(p.radiusTop, p.radiusBottom, p.height, 24, p.heightSegments, p.openEnded, p.thetaStart, p.thetaLength);
      break;
    case 'ConeGeometry':
      if (p.radialSegments > 4 && p.radialSegments < 20) out = new THREE.ConeGeometry(p.radius, p.height, 24, p.heightSegments, p.openEnded, p.thetaStart, p.thetaLength);
      break;
    case 'TorusGeometry':
      if (p.radialSegments < 12) out = new THREE.TorusGeometry(p.radius, p.tube, 12, Math.max(24, p.tubularSegments), p.arc);
      break;
    default:
      break;
  }
  cache.set(g, out);
  // never upgrade an upgraded shape again (RoundedBoxGeometry reports itself as a 1x1x1 BoxGeometry)
  cache.set(out, out);
  return out;
};

export const StylePass: React.FC<{ style: VisualStyle }> = ({ style }) => {
  const { scene, gl } = useThree();
  const env = useMemo(() => {
    if (style !== 'real') return null;
    const pm = new THREE.PMREMGenerator(gl);
    return pm.fromScene(new RoomEnvironment(), 0.04).texture;
  }, [style, gl]);
  useLayoutEffect(() => {
    if (style === 'blocky') return;
    if (style === 'real') {
      gl.toneMapping = THREE.NeutralToneMapping;
      gl.toneMappingExposure = 0.95;
      gl.shadowMap.type = THREE.PCFSoftShadowMap;
      scene.environment = env;
    }
    scene.traverse((o) => {
      // with image-based light, tone down the flat fill lights so shapes keep contrast
      const l = o as THREE.Light;
      if (style === 'real' && l.isLight && !l.userData.styled) {
        if ((l as THREE.HemisphereLight).isHemisphereLight) l.intensity *= 0.55;
        else if ((l as THREE.AmbientLight).isAmbientLight) l.intensity *= 0.4;
        else if ((l as THREE.DirectionalLight).isDirectionalLight) l.intensity *= 1.15;
        l.userData.styled = true;
      }
      const m = o as THREE.Mesh;
      if (!m.isMesh || !m.geometry) return;
      const ng = upgrade(m.geometry);
      if (ng !== m.geometry) m.geometry = ng;
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      for (const mat of mats) {
        const s = mat as THREE.MeshStandardMaterial;
        if (!s || !('flatShading' in s)) continue;
        if (s.userData.styled === style) continue;
        if (s.flatShading) { s.flatShading = false; s.needsUpdate = true; }
        if (style === 'real' && s.isMeshStandardMaterial) {
          // a touch of gloss so the environment light shows up, without looking like plastic
          const c = s.color ?? new THREE.Color(1, 1, 1);
          const lum = 0.3 * c.r + 0.59 * c.g + 0.11 * c.b;
          // light paint (fuselages, walls) gets a satin sheen; everything else stays matte-ish
          s.roughness = lum > 0.75 ? 0.35 : Math.min(s.roughness ?? 1, 0.65);
          if (lum > 0.75 && !s.transparent) s.metalness = Math.max(s.metalness ?? 0, 0.12);
          s.envMapIntensity = 0.55;
          s.needsUpdate = true;
        }
        s.userData.styled = style;
      }
    });
  });
  return null;
};
