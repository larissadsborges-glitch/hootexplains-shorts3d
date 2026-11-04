import React, { useMemo } from 'react';
import * as THREE from 'three';
import {
  clamp01, easeInOutSine, easeInQuad, easeOutBack, easeOutCubic, lerp, progress, rng,
} from '../../lib/anim';
import type { Timings } from '../../types';
import { Burst, CameraRig } from '../../world/Props';
import { Clouds, Lights, Sky } from '../../world/World';
import { Backdrop, GroundSection, Rain, useBrick, useSignTexture } from './assets';
import {
  buildHouseTimeline, cameraPose, COL_X, HX, HZ_BACK, HZ_FRONT, PIT_DEPTH, RAISED, SUGAR_AT, WALL_H,
} from './timeline';

type V3 = [number, number, number];
const CONCRETE = '#c9c4ba';
const DEPTH = HZ_FRONT - HZ_BACK; // house depth
const ZC = (HZ_FRONT + HZ_BACK) / 2;

const Arrow: React.FC<{ at: V3; t: number; show: boolean; scale?: number }> = ({ at, t, show, scale = 1 }) =>
  show ? (
    <mesh position={[at[0], at[1] - 0.15 * Math.abs(Math.sin(t * 6)), at[2]]} rotation={[Math.PI, 0, 0]} scale={scale}>
      <coneGeometry args={[0.3, 0.65, 3]} />
      <meshBasicMaterial color="#ff3b2f" />
    </mesh>
  ) : null;

/** Zig-zag crack drawn on a wall face, growing with p (0..1). */
const Crack: React.FC<{ x: number; y0: number; z: number; len: number; p: number; seed: number; facing?: 'z' | 'x' }> = ({ x, y0, z, len, p, seed }) => {
  const segs = useMemo(() => {
    const r = rng(seed);
    const out: { x: number; y: number; a: number; l: number }[] = [];
    let cx = x, cy = y0;
    for (let i = 0; i < 8; i++) {
      const a = (r() - 0.5) * 1.4 + Math.PI / 2;
      const l = len / 8;
      out.push({ x: cx + (Math.cos(a) * l) / 2, y: cy + (Math.sin(a) * l) / 2, a, l });
      cx += Math.cos(a) * l;
      cy += Math.sin(a) * l;
    }
    return out;
  }, [x, y0, len, seed]);
  return (
    <>
      {segs.map((s, i) => (i / segs.length < p ? (
        <mesh key={i} position={[s.x, s.y, z]} rotation={[0, 0, s.a]}>
          <boxGeometry args={[s.l + 0.06, 0.13, 0.02]} />
          <meshBasicMaterial color="#1a110d" />
        </mesh>
      ) : null))}
    </>
  );
};

const House: React.FC<{
  walls: number; roof: number; sag: number; crack1: number; crack2: number; t: number;
}> = ({ walls, roof, sag, crack1, crack2, t }) => {
  const segTex = useBrick(1, WALL_H);
  const sideTex = useBrick(DEPTH + 0.3, WALL_H);
  const sign = useSignTexture('EXPLAIN LAND');
  const h = WALL_H * Math.max(0.001, walls);
  const sagAt = (x: number) => sag * Math.max(0, Math.cos((Math.PI * x) / (2 * HX)));
  const R = 2.1, half = HX + 0.5;
  const L = Math.hypot(half, R), a = Math.atan2(R, half);
  const gable = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-HX, 0); s.lineTo(HX, 0); s.lineTo(0, R - 0.1);
    return new THREE.ShapeGeometry(s);
  }, []);
  void t;
  return (
    <group>
      {/* floor, in 8 segments so it can sag */}
      {Array.from({ length: 8 }, (_, i) => {
        const x = -HX + 0.5 + i;
        return (
          <mesh key={`f${i}`} position={[x, 0.06 - sagAt(x), ZC]} receiveShadow castShadow>
            <boxGeometry args={[1.01, 0.12, DEPTH]} />
            <meshStandardMaterial color="#c99a63" roughness={0.9} />
          </mesh>
        );
      })}
      {/* back wall segments */}
      {Array.from({ length: 8 }, (_, i) => {
        const x = -HX + 0.5 + i;
        return (
          <mesh key={`b${i}`} position={[x, 0.12 + h / 2 - sagAt(x), HZ_BACK]} castShadow receiveShadow>
            <boxGeometry args={[1.01, h, 0.3]} />
            <meshStandardMaterial map={segTex} roughness={0.95} />
          </mesh>
        );
      })}
      {/* side walls */}
      {[-1, 1].map((s) => (
        <mesh key={`s${s}`} position={[s * (HX - 0.15), 0.12 + h / 2, ZC - 0.15]} castShadow receiveShadow>
          <boxGeometry args={[0.3, h, DEPTH + 0.3]} />
          <meshStandardMaterial map={sideTex} roughness={0.95} />
        </mesh>
      ))}
      {walls > 0.75 && (
        <group position={[0, -sagAt(-1.9) * 0.9, 0]} scale={[1, clamp01((walls - 0.75) / 0.25), 1]}>
          <mesh position={[-1.9, 1.75, HZ_BACK + 0.17]}>
            <boxGeometry args={[1.5, 1.15, 0.06]} />
            <meshStandardMaterial color="#f4f4f0" />
          </mesh>
          <mesh position={[-1.9, 1.75, HZ_BACK + 0.21]}>
            <boxGeometry args={[1.3, 0.95, 0.04]} />
            <meshStandardMaterial color="#9fd3f4" roughness={0.2} />
          </mesh>
          <mesh position={[1.7, 1.85, HZ_BACK + 0.17]}>
            <planeGeometry args={[1.5, 0.75]} />
            <meshBasicMaterial map={sign} toneMapped={false} />
          </mesh>
          <mesh position={[2.9, 0.4, -4.6]} castShadow>
            <cylinderGeometry args={[0.22, 0.16, 0.4, 8]} />
            <meshStandardMaterial color="#b5643c" flatShading />
          </mesh>
          <mesh position={[2.9, 0.85, -4.6]} castShadow>
            <icosahedronGeometry args={[0.38, 0]} />
            <meshStandardMaterial color="#4fae3e" flatShading />
          </mesh>
        </group>
      )}
      {/* cracks */}
      {crack1 > 0 && <Crack x={2.4} y0={0.2} z={HZ_BACK + 0.16} len={2.9} p={crack1} seed={4} />}
      {crack2 > 0 && <Crack x={0} y0={0.2 - sagAt(0)} z={HZ_BACK + 0.16} len={2.6} p={crack2} seed={8} />}
      {/* roof */}
      {roof > 0 && (
        <group position={[0, (1 - roof) * 6, 0]}>
          <mesh position={[0, 0.12 + WALL_H + 0.05, ZC]} castShadow>
            <boxGeometry args={[2 * HX, 0.1, DEPTH]} />
            <meshStandardMaterial color="#f2f2ef" />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={`r${s}`} position={[s * half / 2, 0.12 + WALL_H + R / 2 + 0.08, ZC - 0.2]} rotation={[0, 0, -s * a]} castShadow>
              <boxGeometry args={[L + 0.25, 0.16, DEPTH + 0.9]} />
              <meshStandardMaterial color="#34476b" flatShading roughness={0.8} />
            </mesh>
          ))}
          <mesh geometry={gable} position={[0, 0.12 + WALL_H, HZ_BACK]}>
            <meshStandardMaterial color="#a9543a" side={THREE.DoubleSide} />
          </mesh>
          {/* cut-open truss at the front */}
          <mesh position={[0, 0.12 + WALL_H + 0.06, HZ_FRONT - 0.05]}>
            <boxGeometry args={[2 * HX, 0.12, 0.12]} />
            <meshStandardMaterial color="#8a5a35" />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={`t${s}`} position={[s * HX / 2, 0.12 + WALL_H + R / 2, HZ_FRONT - 0.05]} rotation={[0, 0, -s * Math.atan2(R, HX)]}>
              <boxGeometry args={[Math.hypot(HX, R), 0.12, 0.12]} />
              <meshStandardMaterial color="#8a5a35" />
            </mesh>
          ))}
          <mesh position={[0, 0.12 + WALL_H + R / 2, HZ_FRONT - 0.05]}>
            <boxGeometry args={[0.12, R, 0.12]} />
            <meshStandardMaterial color="#8a5a35" />
          </mesh>
          {/* gutter + downpipe */}
          <mesh position={[HX + 0.55, 0.12 + WALL_H - 0.05, ZC - 0.2]}>
            <boxGeometry args={[0.16, 0.14, DEPTH + 0.8]} />
            <meshStandardMaterial color="#9aa0a6" />
          </mesh>
          <mesh position={[HX + 0.55, (0.12 + WALL_H) / 2, 0.05]}>
            <cylinderGeometry args={[0.07, 0.07, WALL_H + 0.1, 8]} />
            <meshStandardMaterial color="#9aa0a6" />
          </mesh>
        </group>
      )}
    </group>
  );
};

/** Steel reinforcement cage. */
const Rebar: React.FC<{ y: number }> = ({ y }) => (
  <group position={[0, y, 0]}>
    {[[-0.45, -0.3], [0.45, -0.3], [-0.45, 0.3], [0.45, 0.3]].map(([x, z], i) => (
      <mesh key={i} position={[x, 1.8, z]}>
        <cylinderGeometry args={[0.035, 0.035, 3.6, 5]} />
        <meshStandardMaterial color="#4f535a" metalness={0.5} roughness={0.5} />
      </mesh>
    ))}
    {[0.2, 0.9, 1.6, 2.3, 3.0].map((h) => (
      <mesh key={h} position={[0, h, 0]}>
        <boxGeometry args={[0.95, 0.05, 0.65]} />
        <meshStandardMaterial color="#4f535a" wireframe />
      </mesh>
    ))}
  </group>
);

export const HouseScene: React.FC<{ timings: Timings; t: number }> = ({ timings, t }) => {
  const T = useMemo(() => buildHouseTimeline(timings), [timings]);
  const pose = cameraPose(timings, T, t);

  // ---- act 1: build, sink, crack ----
  const walls = easeOutCubic(progress(t, T.wallsS, T.wallsE - 0.1));
  const roof = t >= T.roofS ? easeInQuad(progress(t, T.roofS, T.roofLand)) : 0;
  const tilt1 = -0.1 * easeInOutSine(progress(t, T.sinkS, T.crack + 0.3)) * (1 - easeInOutSine(progress(t, T.clear, T.clear + 0.6)));
  const crack1 = progress(t, T.crack - 0.1, T.crack + 0.35) * (t < T.clear + 0.9 ? 1 : 0);
  // ---- act 2: lot cleared, pits, rebar, concrete, house returns, sags ----
  const lift = 16 * easeInQuad(progress(t, T.clear, T.clear + 0.9));
  const back = t >= T.houseBack;
  const drop = back ? 12 * (1 - easeInQuad(progress(t, T.houseBack, T.houseLand))) : 0;
  const bounce = t > T.houseLand ? 0.05 * Math.sin((t - T.houseLand) * 20) * Math.exp(-(t - T.houseLand) * 7) : 0;
  const sag = 0.38 * easeInOutSine(progress(t, T.sagS + 0.2, T.sagE)) * (1 - easeInOutSine(progress(t, T.level, T.level + 0.6)));
  const crack2 = progress(t, T.sagS + 0.6, T.sagS + 1.1) * (1 - progress(t, T.level + 0.2, T.level + 0.6));
  // soggy ground: right footing sinks a little until the apron drains the water
  const soggy = 0.1 * easeInOutSine(progress(t, T.soggy, T.soggy + 0.8)) * (1 - easeInOutSine(progress(t, T.drain, T.drain + 0.8)));
  const tilt2 = -soggy / 8;
  const houseVisible = t < T.clear + 0.9 || back;
  const hb = back ? RAISED + drop + bounce : lift;
  const tilt = back ? tilt2 : tilt1;

  const digP = easeOutCubic(progress(t, T.digS + 0.1, T.digE - 0.1));
  const pitVisible = t >= T.digS && t < T.pourE + 0.4;
  const rebarY = lerp(5, -PIT_DEPTH + 0.1, easeOutCubic(progress(t, T.rebarS, T.rebarE - 0.1)));
  const fill = lerp(-PIT_DEPTH, RAISED, easeInOutSine(progress(t, T.pourS, T.pourE - 0.1)));

  // ---- act 3: grade beam ----
  const beamP = easeInOutSine(progress(t, T.beamS + 0.1, T.beamE - 0.1));
  // ---- act 4: damp, sugar cube, tar ----
  const tarP = easeInOutSine(progress(t, T.tarS + 0.1, T.tarE - 0.1));
  const dampH = 1.5 * easeOutCubic(progress(t, T.dampS, T.dampS + 2.6));
  const dampA = t >= T.dampS ? 1 - progress(t, T.dampStop + 0.3, T.dampStop + 1.3) : 0;
  const dots = useMemo(() => {
    const r = rng(12);
    return Array.from({ length: 26 }, () => [r(), r()]);
  }, []);
  const wet = t >= T.dampS && t < T.tarE ? 1 : 0;
  // ---- act 5: rain, soak, apron ----
  const rainAmt = clamp01((t - T.rain) / 0.8) * (1 - clamp01((t - T.rainStop) / 0.8));
  const soakR = 1.8 * easeOutCubic(progress(t, T.soak, T.soak + 1.4)) * (1 - progress(t, T.drain + 0.2, T.drain + 1.2));
  const puddle = 1.3 * easeOutCubic(progress(t, T.soak, T.soak + 1.0));
  const apronP = easeInOutSine(progress(t, T.apronS + 0.1, T.apronE - 0.1));
  const farPuddle = 1.1 * easeOutCubic(progress(t, T.drain, T.drain + 1.2)) * (1 - clamp01((t - T.rainStop - 1.5) / 1.5));

  // ---- sugar cube analogy ----
  const cubeDip = easeOutCubic(progress(t, T.sugar + 0.1, T.sugar + 0.7));
  const brown = lerp(0.12, 1, easeInOutSine(progress(t, T.sugar + 0.6, T.sugarRiseE - 0.4)));
  const CUBE = 0.3;
  const cubeY = lerp(1.9, 1.36 + CUBE / 2 - 0.07, cubeDip);

  const beamColor = new THREE.Color(CONCRETE).lerp(new THREE.Color('#857b70'), wet * clamp01((t - T.dampS) / 1.5));
  const beams = beamP > 0 && (
    <group>
      {/* front + back beams (x), side beams (z) */}
      {[HZ_FRONT - 0.2, HZ_BACK].map((z) => (
        <mesh key={`bx${z}`} position={[-HX - 0.3 + (2 * HX + 0.6) * beamP / 2, -0.15 + (RAISED + 0.15) / 2, z]} castShadow receiveShadow>
          <boxGeometry args={[(2 * HX + 0.6) * beamP, RAISED + 0.3, 0.55]} />
          <meshStandardMaterial color={beamColor} roughness={0.9} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={`bz${s}`} position={[s * (HX - 0.15), -0.15 + (RAISED + 0.15) / 2, HZ_FRONT - (DEPTH + 0.3) * beamP / 2]} castShadow receiveShadow>
          <boxGeometry args={[0.55, RAISED + 0.3, (DEPTH + 0.3) * beamP]} />
          <meshStandardMaterial color={beamColor} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );

  return (
    <>
      <CameraRig pose={pose} />
      <Sky />
      <Lights />
      <Clouds t={t} />
      <GroundSection wetAt={{ x: 5.2, r: soakR, a: soakR > 0.05 ? 1 : 0 }} />
      <Backdrop />

      {/* outline of the walls on the grass */}
      {t >= T.outline && walls < 0.2 && t < T.clear && [[0, HZ_BACK, 2 * HX, 0.3], [0, HZ_FRONT, 2 * HX, 0.3], [-HX, ZC, 0.3, DEPTH], [HX, ZC, 0.3, DEPTH]].map(([x, z, w, d], i) => (
        <mesh key={`o${i}`} position={[x, 0.04, z]} scale={[easeOutBack(progress(t, T.outline + i * 0.08, T.outline + i * 0.08 + 0.35)) || 0.001, 1, 1]}>
          <boxGeometry args={[w, 0.08, d]} />
          <meshStandardMaterial color="#b5573b" />
        </mesh>
      ))}

      {houseVisible && (
        <group position={[-HX, hb, 0]} rotation={[0, 0, tilt]}>
          <group position={[HX, 0, 0]}>
            <House walls={walls} roof={roof} sag={sag} crack1={crack1} crack2={crack2} t={t} />
          </group>
        </group>
      )}
      <Arrow at={[HX - 0.2, -0.3, 0.6]} t={t} show={t >= T.sinkS + 0.3 && t < T.clear} />
      <Arrow at={[0, RAISED - 0.4, 0.6]} t={t} show={t >= T.sagS + 0.3 && t < T.level} />
      <Arrow at={[-1.5, RAISED - 0.4, 0.6]} t={t} show={t >= T.sagS + 0.5 && t < T.level} scale={0.8} />
      <Arrow at={[1.5, RAISED - 0.4, 0.6]} t={t} show={t >= T.sagS + 0.5 && t < T.level} scale={0.8} />
      <Arrow at={[COL_X, -1.2, 0.8]} t={t} show={t >= T.soggy + 0.3 && t < T.apronS} />

      {/* pits, dirt piles, rebar, concrete footings */}
      {[-1, 1].map((s) => (
        <group key={`p${s}`}>
          {pitVisible && digP > 0 && (
            <mesh position={[s * COL_X, -PIT_DEPTH * digP / 2, -0.5]}>
              <boxGeometry args={[1.6, PIT_DEPTH * digP, 1.2]} />
              <meshStandardMaterial color="#3f281b" roughness={1} />
            </mesh>
          )}
          {pitVisible && digP > 0 && (
            <mesh position={[s * (COL_X + 2.0), 0.3 * digP, -0.6]} scale={[digP, digP, digP]}>
              <coneGeometry args={[0.9, 0.7, 7]} />
              <meshStandardMaterial color="#7a4f33" flatShading />
            </mesh>
          )}
          {t >= T.rebarS && t < T.pourE + 0.4 && (
            <group position={[s * COL_X, 0, 0.0]}><Rebar y={rebarY} /></group>
          )}
          {t >= T.pourS && (
            <group position={[0, s === 1 ? -soggy : 0, 0]}>
              <mesh position={[s * COL_X, (-PIT_DEPTH + Math.min(fill, -PIT_DEPTH + 0.6)) / 2, -0.45]} castShadow>
                <boxGeometry args={[1.6, Math.max(0.001, Math.min(fill, -PIT_DEPTH + 0.6) + PIT_DEPTH), 1.2]} />
                <meshStandardMaterial color={CONCRETE} roughness={0.9} />
              </mesh>
              {fill > -PIT_DEPTH + 0.6 && (
                <mesh position={[s * COL_X, (fill + (-PIT_DEPTH + 0.6)) / 2, -0.45]} castShadow>
                  <boxGeometry args={[0.6, fill - (-PIT_DEPTH + 0.6), 1.2]} />
                  <meshStandardMaterial color={CONCRETE} roughness={0.9} />
                </mesh>
              )}
            </group>
          )}
        </group>
      ))}

      {beams}

      {/* waterproofing: tar on the side beam face and a black layer under the wall */}
      {tarP > 0 && (
        <>
          <mesh position={[HX - 0.15 + 0.281, -0.15 + (RAISED + 0.15) / 2, HZ_BACK - 0.15 + (DEPTH + 0.3) * tarP / 2]}>
            <boxGeometry args={[0.01, RAISED + 0.3, (DEPTH + 0.3) * tarP]} />
            <meshStandardMaterial color="#141414" roughness={0.3} />
          </mesh>
          <mesh position={[HX - 0.15, RAISED + 0.01, HZ_BACK - 0.15 + (DEPTH + 0.3) * tarP / 2]}>
            <boxGeometry args={[0.6, 0.05, (DEPTH + 0.3) * tarP]} />
            <meshStandardMaterial color="#141414" roughness={0.3} />
          </mesh>
        </>
      )}

      {/* rising damp on the outside of the right wall */}
      {dampA > 0 && (
        <group position={[HX + 0.012, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <mesh position={[2.7, RAISED + 0.12 + dampH / 2, 0]}>
            <planeGeometry args={[4.0, Math.max(0.01, dampH)]} />
            <meshBasicMaterial color="#3a2a24" transparent opacity={0.45 * dampA} />
          </mesh>
          {Array.from({ length: 9 }, (_, i) => (
            <mesh key={i} position={[0.9 + i * 0.45, RAISED + 0.12 + dampH, 0.001]} scale={[0.32, 0.18 + 0.1 * Math.sin(i * 2.3), 1]}>
              <circleGeometry args={[1, 12]} />
              <meshBasicMaterial color="#3a2a24" transparent opacity={0.45 * dampA} />
            </mesh>
          ))}
          {dots.map(([a, b], i) => {
            const top = tarP >= 1 ? RAISED - 0.02 : RAISED + 0.12 + dampH;
            const y = -0.25 + ((t * 0.55 + b) % 1) * (top + 0.25);
            return (
              <mesh key={`d${i}`} position={[0.9 + a * 3.6, y, 0.02]}>
                <circleGeometry args={[0.045, 8]} />
                <meshBasicMaterial color="#3fa9ff" transparent opacity={dampA} />
              </mesh>
            );
          })}
        </group>
      )}

      {/* water pouring off both eaves */}
      {rainAmt > 0.3 && [-1, 1].flatMap((sx) => Array.from({ length: 6 }, (_, i) => {
        const z = HZ_BACK + 0.4 + i * (DEPTH - 0.8) / 5;
        return (
          <mesh key={`eave${sx}${i}`} position={[sx * (HX + 0.62), RAISED + (0.12 + WALL_H) / 2, z]}>
            <boxGeometry args={[0.05, 0.12 + WALL_H + RAISED - 0.1 + 0.08 * Math.sin(t * 25 + i), 0.05]} />
            <meshBasicMaterial color="#8cc8ff" transparent opacity={0.65 * rainAmt} />
          </mesh>
        );
      }))}
      {soakR > 0.05 && [-1, 1].map((sx) => (
        <mesh key={`wet${sx}`} position={[sx * (HX + 1.0), 0.02, ZC]} rotation={[-Math.PI / 2, 0, 0]} scale={[soakR * 0.7, (DEPTH / 2 + 0.6) * Math.min(1, soakR), 1]}>
          <circleGeometry args={[1, 20]} />
          <meshStandardMaterial color="#3e5a3a" transparent opacity={0.6} roughness={0.2} />
        </mesh>
      ))}
      {/* rain, downpipe stream, puddles, apron */}
      {rainAmt > 0 && <Rain t={t} amount={rainAmt} center={[0, 0, 0]} />}
      {rainAmt > 0.2 && (
        <mesh position={[HX + 0.7, RAISED * 0.5 + 0.1, 0.05]} rotation={[0, 0, -0.5]}>
          <boxGeometry args={[0.08, 0.6 + 0.05 * Math.sin(t * 30), 0.08]} />
          <meshStandardMaterial color="#6fb8ff" transparent opacity={0.8} />
        </mesh>
      )}
      {puddle > 0.02 && apronP < 0.99 && (
        <mesh position={[5.2, 0.03, -0.9]} rotation={[-Math.PI / 2, 0, 0]} scale={[puddle * 1.3, puddle, 1]}>
          <circleGeometry args={[1, 20]} />
          <meshStandardMaterial color="#3f7fc4" roughness={0.1} transparent opacity={0.85} />
        </mesh>
      )}
      {farPuddle > 0.02 && (
        <mesh position={[8.4, 0.03, -1.5]} rotation={[-Math.PI / 2, 0, 0]} scale={[farPuddle * 1.3, farPuddle, 1]}>
          <circleGeometry args={[1, 20]} />
          <meshStandardMaterial color="#3f7fc4" roughness={0.1} transparent opacity={0.85} />
        </mesh>
      )}
      {apronP > 0 && (
        <group>
          {[-1, 1].map((s) => (
            <mesh key={`ap${s}`} position={[s * (HX + 0.1 + 1.9 * apronP / 2), 0.08, ZC - 0.9]} rotation={[0, 0, s * -0.04]} receiveShadow castShadow>
              <boxGeometry args={[1.9 * apronP, 0.16, DEPTH + 2.1]} />
              <meshStandardMaterial color="#d3cfc6" roughness={0.9} />
            </mesh>
          ))}
          <mesh position={[0, 0.08, HZ_BACK - 0.15 - 1.9 * apronP / 2]} receiveShadow>
            <boxGeometry args={[2 * HX + 4, 0.16, 1.9 * apronP]} />
            <meshStandardMaterial color="#d3cfc6" roughness={0.9} />
          </mesh>
        </group>
      )}
      {rainAmt > 0.2 && apronP >= 1 && (
        <mesh position={[HX + 1.9, 0.18, -0.9]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.0, 0.25]} />
          <meshBasicMaterial color="#6fb8ff" transparent opacity={0.5 + 0.2 * Math.sin(t * 12)} />
        </mesh>
      )}

      {/* the sugar cube analogy, off to the side of the lot */}
      <group position={SUGAR_AT}>
        <mesh position={[0, 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.14, 1.0, 8]} />
          <meshStandardMaterial color="#7a4e2a" flatShading />
        </mesh>
        <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.0, 1.0, 0.08, 20]} />
          <meshStandardMaterial color="#c08a52" flatShading />
        </mesh>
        <mesh position={[0, 1.055, 0]} receiveShadow>
          <cylinderGeometry args={[0.48, 0.5, 0.03, 20]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, 1.27, 0]} castShadow>
          <cylinderGeometry args={[0.32, 0.26, 0.42, 20, 1, true]} />
          <meshStandardMaterial color="#ffffff" side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 1.36, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.3, 20]} />
          <meshStandardMaterial color="#4a2a15" roughness={0.2} />
        </mesh>
        <mesh position={[0.36, 1.28, 0]}>
          <torusGeometry args={[0.11, 0.03, 8, 16]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        {/* sugar cube: brown climbs from the bottom */}
        <group position={[0, cubeY, 0.02]} rotation={[0, 0.5, 0]}>
          <mesh position={[0, -CUBE / 2 + (CUBE * brown) / 2, 0]}>
            <boxGeometry args={[CUBE, CUBE * brown, CUBE]} />
            <meshStandardMaterial color="#7a4a22" roughness={0.9} />
          </mesh>
          {brown < 0.99 && (
            <mesh position={[0, CUBE / 2 - (CUBE * (1 - brown)) / 2, 0]}>
              <boxGeometry args={[CUBE, CUBE * (1 - brown), CUBE]} />
              <meshStandardMaterial color="#f6f1e4" roughness={0.9} emissive="#ffffff" emissiveIntensity={0.15} />
            </mesh>
          )}
        </group>
        {[0, 1, 2].map((i) => {
          const k = ((t * 0.6 + i / 3) % 1);
          return (
            <mesh key={`st${i}`} position={[0.08 * Math.sin(k * 6 + i), 1.5 + k * 0.7, -0.05]} scale={0.06 + k * 0.08}>
              <icosahedronGeometry args={[1, 0]} />
              <meshStandardMaterial color="#ffffff" transparent opacity={0.6 * (1 - k)} />
            </mesh>
          );
        })}
      </group>

      {/* impact dust */}
      <Burst t={t} t0={T.roofLand} at={[0, WALL_H + 0.2, -2.5]} seed={2} count={10} color="#ece6da" speed={2.5} up={1} gravity={1} life={0.8} size={0.3} />
      <Burst t={t} t0={T.houseLand} at={[0, RAISED, 0.2]} seed={6} count={12} color="#ece6da" speed={3} up={1} gravity={1} life={0.9} size={0.3} />
    </>
  );
};
