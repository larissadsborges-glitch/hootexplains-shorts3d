import React, { useMemo } from 'react';
import * as THREE from 'three';
import { rng } from '../../lib/anim';

export const WHITE = '#f2f1ec', GREY = '#9aa3ad', DARK = '#1e2329';

/** Gradient sky dome that travels with the camera (so it works in every "place"). */
export const GradSky: React.FC<{ at: number[]; top: string; hor: string; bottom?: string }> = ({ at, top, hor, bottom }) => {
  const geo = useMemo(() => new THREE.SphereGeometry(450, 32, 16), []);
  const cols = useMemo(() => {
    const p = geo.attributes.position;
    const c = new Float32Array(p.count * 3);
    const T = new THREE.Color(top), H = new THREE.Color(hor), B = new THREE.Color(bottom ?? hor);
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i) / 450;
      (y >= 0 ? H.clone().lerp(T, Math.pow(y, 0.6)) : H.clone().lerp(B, Math.min(1, -y * 3))).toArray(c, i * 3);
    }
    return c;
  }, [geo, top, hor, bottom]);
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  return (
    <mesh geometry={geo} position={at as [number, number, number]}>
      <meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} />
    </mesh>
  );
};

/** Sun + sky light that follow the camera target, so shadows work anywhere. */
export const PlaceLights: React.FC<{ target: number[]; fog: string; near: number; far: number; sun?: number; hemi?: [string, string, number]; sunColor?: string }> = ({
  target, fog, near, far, sun = 2.4, hemi = ['#e6f4ff', '#6f8a5f', 1.3], sunColor = '#ffffff',
}) => {
  const tgt = useMemo(() => new THREE.Object3D(), []);
  tgt.position.set(target[0], target[1], target[2]);
  tgt.updateMatrixWorld();
  return (
    <>
      <primitive object={tgt} />
      <hemisphereLight args={[hemi[0], hemi[1], hemi[2]]} />
      <ambientLight intensity={0.25} />
      <directionalLight
        position={[target[0] + 25, target[1] + 40, target[2] + 18]}
        target={tgt}
        intensity={sun}
        color={sunColor}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
        shadow-camera-near={1}
        shadow-camera-far={150}
        shadow-bias={-0.0006}
      />
      <fog attach="fog" args={[fog, near, far]} />
    </>
  );
};

/** One low-poly cloud: a few squashed icosahedrons. */
export const Puff: React.FC<{ at: number[]; s: number; color?: string; opacity?: number; seed?: number }> = ({ at, s, color = '#ffffff', opacity = 1, seed = 1 }) => {
  const blobs = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: 4 }, (_, i) => ({ p: [(r() - 0.5) * 1.8, (r() - 0.3) * 0.5, (r() - 0.5) * 1.2], k: 0.6 + r() * 0.6 + (i === 0 ? 0.3 : 0) }));
  }, [seed]);
  return (
    <group position={at as [number, number, number]} scale={s}>
      {blobs.map((b, i) => (
        <mesh key={i} position={b.p as [number, number, number]} scale={[b.k * 1.2, b.k * 0.75, b.k]}>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={color} flatShading roughness={1} transparent={opacity < 1} opacity={opacity} />
        </mesh>
      ))}
    </group>
  );
};

/**
 * Clouds streaming past a point that is held still (the "camera rides with the jet" trick).
 * Puffs wrap around inside a box; a clear tube around `clearAxis` keeps the view open.
 */
export const CloudStream: React.FC<{
  center: number[]; size: number[]; v: number[]; t: number; n?: number; seed?: number; color?: string; clear?: number; scale?: number; opacity?: number;
}> = ({ center, size, v, t, n = 40, seed = 5, color = '#ffffff', clear = 4, scale = 1, opacity = 1 }) => {
  const base = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: n }, () => ({ p: [r() - 0.5, r() - 0.5, r() - 0.5], s: 0.6 + r() * 1.2, sd: Math.floor(r() * 1000) }));
  }, [n, seed]);
  const len = Math.hypot(v[0], v[1], v[2]) || 1;
  const dir = [v[0] / len, v[1] / len, v[2] / len];
  return (
    <>
      {base.map((b, i) => {
        const p = [0, 1, 2].map((k) => {
          const raw = b.p[k] * size[k] + v[k] * t;
          return ((((raw + size[k] / 2) % size[k]) + size[k]) % size[k]) - size[k] / 2;
        });
        // distance from the axis through the centre along the stream direction
        const d = p[0] * dir[0] + p[1] * dir[1] + p[2] * dir[2];
        const perp = Math.hypot(p[0] - d * dir[0], p[1] - d * dir[1], p[2] - d * dir[2]);
        if (perp < clear) return null;
        return <Puff key={i} at={[center[0] + p[0], center[1] + p[1], center[2] + p[2]]} s={b.s * scale} color={color} opacity={opacity} seed={b.sd} />;
      })}
    </>
  );
};

/** Flat-shaded patchwork of fields (seen from high above). */
export const Fields: React.FC<{ at: number[]; size?: number; n?: number }> = ({ at, size = 400, n = 36 }) => {
  const geo = useMemo(() => {
    const r = rng(11);
    const pal = ['#5f8f45', '#7aa356', '#4d7a3a', '#9bb56a', '#b8a46a', '#6f9a4f', '#86a85e'].map((c) => new THREE.Color(c));
    const pos: number[] = [], col: number[] = [];
    const cell = size / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const x0 = -size / 2 + i * cell, z0 = -size / 2 + j * cell;
      const c = pal[Math.floor(r() * pal.length)];
      const q = [[x0, z0], [x0 + cell, z0], [x0 + cell, z0 + cell], [x0, z0 + cell]];
      for (const k of [0, 1, 2, 0, 2, 3]) { pos.push(q[k][0], 0, q[k][1]); col.push(c.r, c.g, c.b); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.computeVertexNormals();
    return g;
  }, [size, n]);
  return (
    <mesh geometry={geo} position={at as [number, number, number]} rotation={[0, 0, 0]}>
      <meshStandardMaterial vertexColors flatShading roughness={1} side={THREE.DoubleSide} />
    </mesh>
  );
};

const extrudeShape = (pts: number[][], depth: number) => {
  const s = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
};

/**
 * Generic low-poly business jet (T-tail, two rear engines). No livery or logos.
 * Local frame: nose +x, up +y, right wing +z. ~5.3 units long.
 */
export const Jet: React.FC<{ ice?: number; stress?: number; vapour?: number; t?: number; iceLeft?: boolean }> = ({ ice = 0, stress = 0, vapour = 0, t = 0 }) => {
  const wing = useMemo(() => extrudeShape([[0.55, 0.25], [-0.35, 2.35], [-0.85, 2.35], [-0.75, 0.25]], 0.07), []);
  const stab = useMemo(() => extrudeShape([[-1.95, 0], [-2.35, 0.95], [-2.62, 0.95], [-2.5, 0]], 0.05), []);
  const fin = useMemo(() => extrudeShape([[-1.6, 0.2], [-2.25, 1.5], [-2.66, 1.5], [-2.55, 0.2]], 0.06), []);
  const glow = stress * (0.25 + 0.15 * Math.sin(t * 22));
  const wingMat = <meshStandardMaterial color={WHITE} flatShading roughness={0.5} side={THREE.DoubleSide} emissive="#ff4a1a" emissiveIntensity={glow} />;
  // leading edge of the right wing, for the ice strip
  const le = new THREE.Vector3(-0.35 - 0.55, 0, 2.35 - 0.25);
  const leLen = le.length();
  const leYaw = Math.atan2(-le.z, le.x);
  const iceW = 0.025 + 0.09 * ice;
  return (
    <group>
      {/* fuselage */}
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0.05, 0, 0]} castShadow>
        <cylinderGeometry args={[0.33, 0.33, 3.3, 14]} />
        <meshStandardMaterial color={WHITE} flatShading roughness={0.45} />
      </mesh>
      <mesh rotation={[0, 0, -Math.PI / 2]} position={[2.12, -0.02, 0]} castShadow>
        <coneGeometry args={[0.33, 0.85, 14]} />
        <meshStandardMaterial color={WHITE} flatShading roughness={0.45} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[-2.15, 0.08, 0]} castShadow>
        <cylinderGeometry args={[0.33, 0.1, 1.1, 14]} />
        <meshStandardMaterial color={WHITE} flatShading roughness={0.45} />
      </mesh>
      {/* windscreen + windows + a plain grey stripe */}
      <mesh position={[1.82, 0.19, 0]} rotation={[0, 0, -0.45]}>
        <boxGeometry args={[0.36, 0.1, 0.5]} />
        <meshStandardMaterial color="#1c2733" roughness={0.2} />
      </mesh>
      {[-1, 1].map((sd) => (
        <group key={sd}>
          {[-0.9, -0.5, -0.1, 0.3, 0.7].map((x) => (
            <mesh key={x} position={[x, 0.09, sd * 0.325]}>
              <boxGeometry args={[0.16, 0.13, 0.02]} />
              <meshStandardMaterial color="#26313d" />
            </mesh>
          ))}
          <mesh position={[0.05, -0.1, sd * 0.33]}>
            <boxGeometry args={[3.6, 0.05, 0.01]} />
            <meshStandardMaterial color={GREY} />
          </mesh>
        </group>
      ))}
      {/* wings (low-mounted), right then mirrored left */}
      {[1, -1].map((sd) => (
        <group key={sd} scale={[1, 1, sd]} position={[0, -0.16, 0]}>
          <mesh geometry={wing} rotation={[Math.PI / 2 + 0.05, 0, 0]} castShadow>{wingMat}</mesh>
          <mesh position={[-0.62, 0.17, 2.36]} rotation={[0, 0, 0.35]}>
            <boxGeometry args={[0.36, 0.38, 0.04]} />
            <meshStandardMaterial color={WHITE} flatShading emissive="#ff4a1a" emissiveIntensity={glow} />
          </mesh>
          {/* clear ice on the leading edge */}
          {ice > 0 && (
            <mesh position={[0.55 + le.x / 2 + 0.03, 0.0, 0.25 + le.z / 2]} rotation={[0, leYaw, 0]}>
              <boxGeometry args={[leLen, 0.07 + ice * 0.06, iceW]} />
              <meshStandardMaterial color="#cdeeff" transparent opacity={0.55 + 0.3 * ice} roughness={0.05} metalness={0.1} emissive="#9fdcff" emissiveIntensity={0.35} />
            </mesh>
          )}
          {/* vapour trail from the wingtip */}
          {vapour > 0 && (
            <mesh position={[-0.85 - 2.2, 0, 2.3]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.05, 0.02, 4.4, 6]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={vapour * (0.45 + 0.2 * Math.sin(t * 30 + sd))} />
            </mesh>
          )}
        </group>
      ))}
      {/* engines on the rear fuselage */}
      {[-1, 1].map((sd) => (
        <group key={sd} position={[-1.5, 0.18, sd * 0.6]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.19, 0.17, 0.95, 12]} />
            <meshStandardMaterial color="#dcdcd6" flatShading />
          </mesh>
          <mesh position={[0.48, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.15, 0.15, 0.02, 12]} />
            <meshStandardMaterial color="#202428" />
          </mesh>
          <mesh position={[0, 0, -sd * 0.2]}>
            <boxGeometry args={[0.45, 0.07, 0.25]} />
            <meshStandardMaterial color={GREY} />
          </mesh>
        </group>
      ))}
      {/* T-tail */}
      <mesh geometry={fin} position={[0, 0.05, -0.03]} castShadow>
        <meshStandardMaterial color={WHITE} flatShading side={THREE.DoubleSide} />
      </mesh>
      {[1, -1].map((sd) => (
        <group key={sd} scale={[1, 1, sd]} position={[-0.05, 1.53, 0]}>
          <mesh geometry={stab} rotation={[Math.PI / 2, 0, 0]}>
            <meshStandardMaterial color={WHITE} flatShading side={THREE.DoubleSide} emissive="#ff4a1a" emissiveIntensity={glow * 0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

/** A simple person; h ≈ 1.75 units. */
export const Person: React.FC<{ at: number[]; shirt: string; rotY?: number; walk?: number; scale?: number }> = ({ at, shirt, rotY = 0, walk = 0, scale = 1 }) => (
  <group position={at as [number, number, number]} rotation={[0, rotY, 0]} scale={scale}>
    {[-1, 1].map((s) => (
      <mesh key={s} position={[s * 0.09, 0.42, 0]} rotation={[Math.sin(walk) * 0.5 * s, 0, 0]}>
        <boxGeometry args={[0.13, 0.84, 0.18]} />
        <meshStandardMaterial color="#2c3e66" />
      </mesh>
    ))}
    <mesh position={[0, 1.12, 0]}><boxGeometry args={[0.42, 0.58, 0.24]} /><meshStandardMaterial color={shirt} flatShading /></mesh>
    <mesh position={[0, 1.58, 0]}><sphereGeometry args={[0.17, 10, 10]} /><meshStandardMaterial color="#c99a78" /></mesh>
  </group>
);

/** Low-poly palm tree. */
export const Palm: React.FC<{ at: number[]; h?: number; seed?: number; dark?: boolean }> = ({ at, h = 6, seed = 1, dark }) => {
  const r = useMemo(() => rng(seed), [seed]);
  const lean = useMemo(() => (r() - 0.5) * 0.25, [r]);
  const trunk = dark ? '#2a1d22' : '#8a6a48', leaf = dark ? '#1b1a2a' : '#3f8a3a';
  return (
    <group position={at as [number, number, number]} rotation={[0, seed, lean]}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[i * 0.12, (i + 0.5) * (h / 4), 0]} rotation={[0, 0, -0.05 * i]}>
          <cylinderGeometry args={[0.16 - i * 0.02, 0.2 - i * 0.02, h / 4 + 0.05, 6]} />
          <meshStandardMaterial color={trunk} flatShading />
        </mesh>
      ))}
      {Array.from({ length: 7 }, (_, i) => (
        <group key={i} position={[0.45, h, 0]} rotation={[0, (i / 7) * Math.PI * 2, 0]}>
          <mesh position={[1.1, -0.35, 0]} rotation={[0, 0, -0.45]} scale={[1.3, 0.08, 0.35]}>
            <octahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color={leaf} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  );
};

/** Low-poly house with a hip roof. */
export const House: React.FC<{ at: number[]; w?: number; d?: number; color: string; roof?: string; rotY?: number }> = ({ at, w = 4, d = 3.5, color, roof = '#b8735a', rotY = 0 }) => (
  <group position={at as [number, number, number]} rotation={[0, rotY, 0]}>
    <mesh position={[0, 1.2, 0]} castShadow receiveShadow><boxGeometry args={[w, 2.4, d]} /><meshStandardMaterial color={color} flatShading /></mesh>
    <mesh position={[0, 3.0, 0]} rotation={[0, Math.PI / 4, 0]} scale={[w * 0.74, 1, d * 0.74]} castShadow>
      <coneGeometry args={[1, 1.2, 4]} />
      <meshStandardMaterial color={roof} flatShading />
    </mesh>
    <mesh position={[0, 0.9, d / 2 + 0.01]}><planeGeometry args={[0.7, 1.6]} /><meshStandardMaterial color="#6b4a33" /></mesh>
    {[-1, 1].map((s) => (
      <mesh key={s} position={[s * w * 0.3, 1.4, d / 2 + 0.01]}><planeGeometry args={[0.8, 0.7]} /><meshStandardMaterial color="#8ec5ea" /></mesh>
    ))}
  </group>
);
