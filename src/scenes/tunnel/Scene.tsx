import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import {
  clamp01, easeInOutSine, easeInQuad, easeOutBack, easeOutCubic, lerp, progress, rng,
} from '../../lib/anim';
import type { Timings } from '../../types';
import { CLIP, Cutter } from '../../world/CrossSection';
import { Burst, CameraRig } from '../../world/Props';
import { heightAt, WATER_Y } from '../../world/terrain';
import { Clouds, Lights, Sky, Terrain, Trees, Water } from '../../world/World';
import {
  buildTunnelTimeline, cameraPose, CRANE_X, HW, RING_W, ROCK_Y, SHAFT_BOTTOM, SHAFT_W, SHAFT_X, TBM_LEN, tbmFront,
  TUN_R, TUN_Y, X_END, X_START,
} from './timeline';

const SOIL = '#c49662', SOIL_DARK = '#9c7448', ROCK = '#62676e', WATERC = '#56aaf2';
const BORE_L = -SHAFT_X + SHAFT_W / 2; // inner edge of the launch shaft
const BORE_R = SHAFT_X - SHAFT_W / 2;

/** Cut face at z = 0 (soil, rock, river water) with a rectangular opening where the tunnel has been dug. */
const TunnelSection: React.FC<{ holeTo: number | null; sag?: { x: number; amt: number } }> = ({ holeTo, sag }) => {
  const key = holeTo === null ? null : Math.round(holeTo * 20) / 20;
  const sagAmt = sag ? Math.round(sag.amt * 50) / 50 : 0;
  const sagX = sag?.x ?? 0;
  const geo = useMemo(() => {
    const X0 = -40, X1 = 40, STEP = 0.4;
    const xs: number[] = [];
    for (let x = X0; x <= X1 + 1e-6; x += STEP) xs.push(x);
    // optional dip in the riverbed (shown when the gap behind the rings isn't grouted)
    const prof = xs.map((x) => {
      const h = heightAt(x, 0, HW) - 0.02;
      return h < WATER_Y - 0.3 ? h - sagAmt * Math.exp(-(((x - sagX) / 2.2) ** 2)) : h;
    });
    const rockTop = (x: number) => ROCK_Y + 0.25 * Math.sin(x * 0.7) + 0.15 * Math.sin(x * 1.9);
    const soil = new THREE.Shape();
    soil.moveTo(xs[0], prof[0]);
    xs.forEach((x, i) => soil.lineTo(x, prof[i]));
    for (let i = xs.length - 1; i >= 0; i--) soil.lineTo(xs[i], rockTop(xs[i]));
    if (key !== null && key > BORE_L + 0.05) {
      const h = new THREE.Path();
      h.moveTo(BORE_L, TUN_Y - TUN_R);
      h.lineTo(key, TUN_Y - TUN_R);
      h.lineTo(key, TUN_Y + TUN_R);
      h.lineTo(BORE_L, TUN_Y + TUN_R);
      h.lineTo(BORE_L, TUN_Y - TUN_R);
      soil.holes.push(h);
    }
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
    return { soil: new THREE.ShapeGeometry(soil), rock: new THREE.ShapeGeometry(rock), water: new THREE.ShapeGeometry(water) };
  }, [key, sagAmt, sagX]);
  useEffect(() => () => { geo.soil.dispose(); }, [geo]);
  const pebbles = useMemo(() => {
    const r = rng(31);
    return Array.from({ length: 150 }, () => {
      const x = -36 + r() * 72;
      const top = heightAt(x, 0, HW) - 0.3;
      const y = top - r() * (top + 15);
      const inRock = y < ROCK_Y;
      const inBore = x > BORE_L - 0.3 && x < BORE_R + 0.3 && Math.abs(y - TUN_Y) < TUN_R + 0.3;
      const inShaft = Math.abs(Math.abs(x) - SHAFT_X) < SHAFT_W / 2 + 0.3 && y > TUN_Y - TUN_R - 0.3;
      return { x, y, s: 0.12 + r() * (inRock ? 0.35 : 0.18), c: inRock ? '#8e949b' : SOIL_DARK, skip: inBore || inShaft };
    }).filter((p) => !p.skip);
  }, []);
  return (
    <group>
      <mesh geometry={geo.soil} receiveShadow><meshStandardMaterial color={SOIL} roughness={1} /></mesh>
      <mesh geometry={geo.rock}><meshStandardMaterial color={ROCK} roughness={1} /></mesh>
      <mesh geometry={geo.water} position={[0, 0, 0.005]}><meshStandardMaterial color={WATERC} roughness={0.4} transparent opacity={0.92} /></mesh>
      {pebbles.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, 0.01]} scale={p.s} rotation={[0, 0, i]}>
          <circleGeometry args={[1, 6]} />
          <meshStandardMaterial color={p.c} roughness={1} />
        </mesh>
      ))}
    </group>
  );
};

/** Half of a tube (the z ≤ 0 half), axis along x: we look into it through the cut. */
const HalfTube: React.FC<{ x: number; len: number; r: number; color: string; scale?: number }> = ({ x, len, r, color, scale = 1 }) => (
  <mesh position={[x, TUN_Y, 0]} rotation={[0, 0, -Math.PI / 2]} scale={[scale, 1, scale]} receiveShadow>
    <cylinderGeometry args={[r, r, len, 24, 1, true, Math.PI / 2, Math.PI]} />
    <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.95} />
  </mesh>
);

const Arrow: React.FC<{ at: [number, number, number]; dir: 1 | -1; color: string; s: number; t: number }> = ({ at, dir, color, s, t }) =>
  s > 0.01 ? (
    <mesh position={[at[0] + dir * 0.12 * Math.sin(t * 7), at[1], at[2]]} rotation={[0, 0, -dir * Math.PI / 2]} scale={s}>
      <coneGeometry args={[0.28, 0.7, 3]} />
      <meshBasicMaterial color={color} />
    </mesh>
  ) : null;

const Train: React.FC<{ x: number }> = ({ x }) => (
  <group position={[x, TUN_Y - TUN_R + 0.75, -0.45]}>
    {[0, -2.25, -4.5].map((dx, i) => (
      <group key={i} position={[dx, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[2.1, 0.95, 0.8]} />
          <meshStandardMaterial color="#f4f4f2" flatShading />
        </mesh>
        <mesh position={[0, 0.12, 0.41]}>
          <boxGeometry args={[1.8, 0.28, 0.02]} />
          <meshStandardMaterial color="#26313f" />
        </mesh>
        <mesh position={[0, -0.25, 0.41]}>
          <boxGeometry args={[2.1, 0.12, 0.02]} />
          <meshStandardMaterial color="#e2453c" />
        </mesh>
        {i === 0 && (
          <mesh position={[1.12, 0.05, 0]}>
            <boxGeometry args={[0.16, 0.7, 0.78]} />
            <meshStandardMaterial color="#e2453c" />
          </mesh>
        )}
      </group>
    ))}
  </group>
);

const Boat: React.FC<{ x: number; t: number }> = ({ x, t }) => (
  <group position={[x, WATER_Y + 0.25 + 0.04 * Math.sin(t * 3), -2.6]} rotation={[0.03 * Math.sin(t * 2), Math.PI, 0]}>
    <mesh castShadow>
      <boxGeometry args={[2.4, 0.45, 1.0]} />
      <meshStandardMaterial color="#e2453c" flatShading />
    </mesh>
    <mesh position={[0, 0.25, 0]}>
      <boxGeometry args={[2.45, 0.08, 1.05]} />
      <meshStandardMaterial color="#ffffff" />
    </mesh>
    <mesh position={[-0.3, 0.6, 0]} castShadow>
      <boxGeometry args={[0.9, 0.6, 0.75]} />
      <meshStandardMaterial color="#f4f4f2" flatShading />
    </mesh>
  </group>
);

/** Tunnel boring machine, built from three parts the crane lowers separately. */
const TBM: React.FC<{ x: number; bodyY: number; headY: number; gantryY: number; spin: number }> = ({ x, bodyY, headY, gantryY, spin }) => {
  const cx = x - TBM_LEN / 2;
  return (
    <group>
      <group position={[cx, bodyY, 0]}>
        <mesh rotation={[0, 0, -Math.PI / 2]} castShadow>
          <cylinderGeometry args={[1.15, 1.15, TBM_LEN - 0.3, 20]} />
          <meshStandardMaterial color="#f2b632" flatShading roughness={0.6} />
        </mesh>
        {[-0.9, 0.3].map((dx) => (
          <mesh key={dx} position={[dx, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <cylinderGeometry args={[1.17, 1.17, 0.18, 20]} />
            <meshStandardMaterial color="#2c2f35" />
          </mesh>
        ))}
      </group>
      <group position={[x - 0.02, headY, 0]} rotation={[spin, 0, 0]}>
        <mesh rotation={[0, 0, -Math.PI / 2]}>
          <cylinderGeometry args={[1.2, 1.2, 0.22, 20]} />
          <meshStandardMaterial color="#5a5f66" flatShading metalness={0.4} roughness={0.5} />
        </mesh>
        {Array.from({ length: 6 }, (_, k) => (
          <group key={k} rotation={[(k * Math.PI) / 3, 0, 0]}>
            <mesh position={[0.15, 0.6, 0]}>
              <boxGeometry args={[0.12, 1.15, 0.2]} />
              <meshStandardMaterial color="#d8dce0" metalness={0.5} roughness={0.4} />
            </mesh>
            {[0.35, 0.75, 1.05].map((r) => (
              <mesh key={r} position={[0.24, r, 0]} rotation={[0, 0, -Math.PI / 2]}>
                <coneGeometry args={[0.06, 0.16, 4]} />
                <meshStandardMaterial color="#9aa0a6" metalness={0.6} />
              </mesh>
            ))}
          </group>
        ))}
      </group>
      <mesh position={[cx - TBM_LEN / 2 - 1.0, gantryY - 0.3, -0.45]} castShadow>
        <boxGeometry args={[1.6, 0.6, 0.5]} />
        <meshStandardMaterial color="#6b7078" flatShading />
      </mesh>
    </group>
  );
};

/** One lining ring, seen from inside: three precast segments placed one after another (p: 0..1). */
const Ring: React.FC<{ x: number; p: number; shade: string }> = ({ x, p, shade }) => (
  <>
    {[0, 1, 2].map((k) => {
      const pk = clamp01(p * 3 - k);
      if (pk <= 0) return null;
      return (
        <mesh key={k} position={[x, TUN_Y, 0]} rotation={[0, 0, -Math.PI / 2]} scale={[0.6 + 0.4 * easeOutBack(pk), 1, 0.6 + 0.4 * easeOutBack(pk)]} receiveShadow>
          <cylinderGeometry args={[TUN_R - 0.07, TUN_R - 0.07, RING_W - 0.06, 8, 1, true, Math.PI / 2 + (k * Math.PI) / 3 + 0.015, Math.PI / 3 - 0.03]} />
          <meshStandardMaterial color={shade} side={THREE.DoubleSide} roughness={0.95} />
        </mesh>
      );
    })}
  </>
);

/** A person for scale (~1.8 m when the machine is ~13 m across). */
const Worker: React.FC<{ at: [number, number, number]; facing?: number }> = ({ at, facing = 0 }) => (
  <group position={at} rotation={[0, facing, 0]}>
    <mesh position={[0, 0.06, 0]}><boxGeometry args={[0.07, 0.12, 0.05]} /><meshStandardMaterial color="#2c3e66" /></mesh>
    <mesh position={[0, 0.18, 0]}><boxGeometry args={[0.09, 0.13, 0.06]} /><meshStandardMaterial color="#ff7a1a" emissive="#ff7a1a" emissiveIntensity={0.2} /></mesh>
    <mesh position={[0, 0.28, 0]}><sphereGeometry args={[0.035, 10, 10]} /><meshStandardMaterial color="#e0b38f" /></mesh>
    <mesh position={[0, 0.31, 0]}><sphereGeometry args={[0.04, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#ffd21f" /></mesh>
  </group>
);

const Crane: React.FC<{ hookX: number; hookY: number; show: boolean }> = ({ hookX, hookY, show }) =>
  show ? (
    <group>
      <mesh position={[CRANE_X, 5.2, -1.2]} castShadow>
        <boxGeometry args={[0.45, 10.4, 0.45]} />
        <meshStandardMaterial color="#f29c1f" flatShading />
      </mesh>
      <mesh position={[(CRANE_X + hookX) / 2 - 0.5, 10.3, -1.2]} castShadow>
        <boxGeometry args={[hookX - CRANE_X + 2.2, 0.35, 0.35]} />
        <meshStandardMaterial color="#f29c1f" flatShading />
      </mesh>
      <mesh position={[hookX, (10.3 + hookY) / 2, -0.3]}>
        <boxGeometry args={[0.04, Math.max(0.01, 10.3 - hookY), 0.04]} />
        <meshBasicMaterial color="#222" />
      </mesh>
    </group>
  ) : null;

export const TunnelScene: React.FC<{ timings: Timings; t: number }> = ({ timings, t }) => {
  const T = useMemo(() => buildTunnelTimeline(timings), [timings]);
  const pose = cameraPose(timings, T, t);
  const boring = t >= T.boreS;
  const xF = boring ? tbmFront(T, t) : X_START;

  // ---- act 1: a hand-dug hole floods, then everything rewinds ----
  const F = T.flood;
  const floodHole = lerp(-1.5, BORE_L, easeInOutSine(progress(t, T.reset, T.reset + 0.6)));
  const flooding = t < T.reset + 0.6;
  const waterH = 2 * TUN_R * easeOutCubic(progress(t, F + 0.25, F + 2.3)) * (1 - easeInOutSine(progress(t, T.reset, T.reset + 0.6)));
  // ---- shafts: full in the flood shot, rewound, then dug properly ----
  const shaftDepth = t < T.reset + 0.6
    ? 1 - easeInOutSine(progress(t, T.reset, T.reset + 0.6))
    : easeInOutSine(progress(t, T.shaftsS + 0.2, T.shaftsE - 0.3));
  const shaftH = shaftDepth * (0.1 - SHAFT_BOTTOM);
  // ---- crane lowers body, cutter head, gantry ----
  const L = T.lower;
  const partY = (a: number, b: number) => lerp(8, TUN_Y, easeInOutSine(progress(t, a, b)));
  const bodyY = partY(L, L + 1.1), headY = partY(L + 0.9, L + 2.0), gantryY = partY(L + 1.8, L + 2.8);
  const showTBM = t >= L && t < T.boreE + 1.2;
  const exitY = 7 * easeInQuad(progress(t, T.boreE + 0.3, T.boreE + 1.2));
  const hanging = t < L + 1.1 ? bodyY : t < L + 2.0 ? headY : gantryY;
  const hookX = t < L + 0.9 ? X_START - TBM_LEN / 2 : t < L + 1.8 ? X_START : X_START - TBM_LEN - 0.8;
  const spin = boring && t < T.boreE ? (t - T.boreS) * 3.2 : 0;
  const holeTo = flooding ? floodHole : boring ? Math.min(BORE_R, Math.max(BORE_L, xF - 0.1)) : null;

  // ---- rings are built right behind the machine, segment by segment ----
  const speed = (X_END - X_START) / (T.boreE - T.boreS);
  const nR = Math.floor((BORE_R - BORE_L) / RING_W);
  const rings = [];
  let placed = 0;
  for (let i = 0; i < nR; i++) {
    const x = BORE_L + RING_W * (i + 0.5);
    const tp = T.boreS + (x + RING_W / 2 + TBM_LEN + 0.3 - X_START) / speed;
    if (t < tp) continue;
    placed = i + 1;
    rings.push(<Ring key={i} x={x} p={progress(t, tp, tp + 0.45)} shade={i % 2 ? '#d3cec4' : '#c9c4ba'} />);
  }
  const lastRingFront = BORE_L + RING_W * placed;
  const shieldBack = xF - TBM_LEN + 0.15;
  const groutFront = lerp(BORE_L, Math.max(BORE_L, lastRingFront - 0.9), easeInOutSine(progress(t, T.grout + 0.2, T.grout + 1.6)));
  const tailAtGap = tbmFront(T, T.gap + 1) - TBM_LEN - 0.3;
  const sagAmt = 0.7 * easeInOutSine(progress(t, T.gap + 0.6, T.gap + 1.8)) * (1 - easeInOutSine(progress(t, T.grout + 0.6, T.grout + 1.6)));

  // ---- fit-out, in the order the narrator says them ----
  const wt = (w: string, d: number) => T.wordTime('fitout', w, d);
  const tRails = wt('rails', T.fitS), tLights = wt('lights', T.fitS + 0.6), tFans = wt('fans', T.fitS + 1.0), tPumps = wt('pumps', T.fitS + 1.6);
  const railsP = easeInOutSine(progress(t, tRails - 0.1, tRails + 0.6));
  const lightsP = progress(t, tLights - 0.1, tLights + 0.5);
  const fansP = easeOutBack(progress(t, tFans, tFans + 0.35));
  const pumpsP = easeOutBack(progress(t, tPumps, tPumps + 0.35));
  const trainX = lerp(-12, 16, progress(t, T.train - 0.6, T.train + 2.6)); // centred in the close-up mid-line

  // ---- pressure at the face ----
  const pushIn = clamp01((t - T.leak) / 0.3) * (1 - 0.7 * clamp01((t - T.counter - 0.2) / 0.5)) * (t < T.muck ? 1 : 0);
  const pushBack = easeOutBack(progress(t, T.counter, T.counter + 0.4)) * (t < T.muck ? 1 : 0);
  const slurry = t >= T.counter && t < T.boreE ? clamp01((t - T.counter) / 0.4) : 0;
  const drops = useMemo(() => {
    const r = rng(8);
    return Array.from({ length: 14 }, () => [r(), r()]);
  }, []);
  const holes = [-8, -2.5, 3];

  return (
    <>
      <CameraRig pose={pose} />
      <Cutter active />
      <Sky />
      <Lights />
      <Terrain hw={HW} clip={CLIP} />
      <Water t={t} clip={CLIP} />
      <Trees hw={HW} clip={CLIP} />
      <Clouds t={t} />
      <TunnelSection holeTo={holeTo} sag={{ x: tailAtGap - 3, amt: sagAmt }} />
      {sagAmt > 0.05 && [-1, 0, 1].map((k) => (
        <Arrow key={k} at={[tailAtGap - 3 + k * 1.2, -2.6 - 0.2 * Math.abs(k), 0.6]} dir={1} color="#ff3b2f" s={0} t={t} />
      ))}
      {sagAmt > 0.05 && [-1, 0, 1].map((k) => (
        <mesh key={`sa${k}`} position={[tailAtGap - 3 + k * 1.2, -2.4 - 0.15 * Math.abs(Math.sin(t * 6)), 0.6]} rotation={[Math.PI, 0, 0]} scale={Math.min(1, sagAmt * 2)}>
          <coneGeometry args={[0.26, 0.6, 3]} />
          <meshBasicMaterial color="#ff3b2f" />
        </mesh>
      ))}
      <HalfTube x={0} len={BORE_R - BORE_L} r={TUN_R} color="#3d2b1f" />

      {/* boreholes: drilled from the bank and from barges on the river */}
      {t >= T.surveyS && t < T.shaftsS + 0.4 && holes.map((hx, i) => {
        const top = Math.max(heightAt(hx, 0, HW), WATER_Y);
        const p = easeOutCubic(progress(t, T.surveyS + 0.2 + i * 0.35, T.surveyS + 1.6 + i * 0.35));
        const len = (top - (ROCK_Y - 0.6)) * p;
        const fade = 1 - progress(t, T.shaftsS, T.shaftsS + 0.4);
        return (
          <group key={i}>
            <mesh position={[hx, top - len / 2, 0.02]}>
              <boxGeometry args={[0.1, Math.max(0.01, len), 0.02]} />
              <meshBasicMaterial color="#1e140e" transparent opacity={fade} />
            </mesh>
            {top <= WATER_Y + 0.01 && (
              <mesh position={[hx, WATER_Y + 0.15, -0.6]}>
                <boxGeometry args={[1.6, 0.3, 1.0]} />
                <meshStandardMaterial color="#6b7078" flatShading />
              </mesh>
            )}
            <mesh position={[hx, top + 1.0, -0.6]} castShadow>
              <boxGeometry args={[0.18, 2.0, 0.18]} />
              <meshStandardMaterial color="#e2453c" flatShading />
            </mesh>
            {p > 0 && p < 1 && (
              <mesh position={[hx, top - len, 0.05]} rotation={[0, t * 12, Math.PI]}>
                <coneGeometry args={[0.16, 0.4, 5]} />
                <meshStandardMaterial color="#d8dce0" metalness={0.6} />
              </mesh>
            )}
            {p >= 1 && [['#9c7448', 0], ['#c49662', 1], ['#62676e', 2]].map(([c, k]) => (
              <mesh key={k as number} position={[hx + 0.55, top + 0.25 + (k as number) * 0.24 + 0.6 * (1 - Math.min(1, (t - (T.surveyS + 1.6 + i * 0.35)) * 2)), -0.2]}>
                <cylinderGeometry args={[0.1, 0.1, 0.24, 8]} />
                <meshStandardMaterial color={c as string} />
              </mesh>
            ))}
          </group>
        );
      })}

      {/* launch and reception shafts with concrete walls */}
      {shaftH > 0.02 && [-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * SHAFT_X, 0.1 - shaftH / 2, 0.012]}>
            <planeGeometry args={[SHAFT_W, shaftH]} />
            <meshStandardMaterial color="#2e2219" roughness={1} />
          </mesh>
          {[-1, 1].map((w) => (
            <mesh key={w} position={[s * SHAFT_X + w * (SHAFT_W / 2 + 0.12), 0.1 - shaftH / 2, 0.05]}>
              <boxGeometry args={[0.24, shaftH, 0.1]} />
              <meshStandardMaterial color="#bdb7ab" />
            </mesh>
          ))}
        </group>
      ))}

      {/* flood */}
      {flooding && waterH > 0.02 && (
        <>
          <mesh position={[(BORE_L + floodHole) / 2, TUN_Y - TUN_R + waterH / 2, -0.55]}>
            <boxGeometry args={[Math.max(0.01, floodHole - BORE_L), waterH, 1.25]} />
            <meshStandardMaterial color="#3f8ee0" transparent opacity={0.85} roughness={0.2} />
          </mesh>
          {t < T.reset && [0, 1, 2].map((k) => (
            <mesh key={k} position={[-2.5 + 0.12 * k, -2.4, 0.03]} scale={[1, 1 + 0.15 * Math.sin(t * 30 + k), 1]}>
              <boxGeometry args={[0.1, 0.9, 0.05]} />
              <meshBasicMaterial color="#8cc8ff" />
            </mesh>
          ))}
          {t < T.reset && [0.15, 0.7, 1.25, 1.8].map((t0, k) => (
            <Burst key={k} t={t} t0={F + t0} at={[-2.4, TUN_Y + TUN_R - 0.1, 0.3]} seed={50 + k} count={14} color="#9fd3ff" speed={2.2} up={1.5} gravity={6} life={0.7} size={0.12} />
          ))}
        </>
      )}

      {/* grout bands around the lining, seen on the cut face */}
      {t >= T.grout && groutFront > BORE_L + 0.05 && [TUN_Y + TUN_R + 0.14, TUN_Y - TUN_R - 0.14].map((y) => (
        <mesh key={y} position={[(BORE_L + groutFront) / 2, y, 0.016]}>
          <planeGeometry args={[Math.max(0.01, groutFront - BORE_L), 0.28]} />
          <meshStandardMaterial color="#e4dfd2" emissive="#fff6d8" emissiveIntensity={t < T.grout + 3 ? 0.5 : 0.1} roughness={1} />
        </mesh>
      ))}
      {rings}

      {/* slurry pipes carrying the mud back to the launch shaft */}
      {boring && [0.72, 0.5].map((dy, k) => (
        <group key={k}>
          <mesh position={[(BORE_L + shieldBack) / 2, TUN_Y + dy, -0.85 + k * 0.1]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.07, 0.07, Math.max(0.01, shieldBack - BORE_L), 8]} />
            <meshStandardMaterial color={k ? '#4f6d8a' : '#7a5a3a'} />
          </mesh>
          {k === 0 && t >= T.counter && Array.from({ length: 10 }, (_, i) => {
            const u = ((t * 0.5 + i / 10) % 1);
            const x = shieldBack - u * (shieldBack - BORE_L);
            return (
              <mesh key={i} position={[x, TUN_Y + dy, -0.75]} scale={0.1}>
                <sphereGeometry args={[1, 6, 6]} />
                <meshStandardMaterial color="#8a6a48" />
              </mesh>
            );
          })}
        </group>
      ))}

      {/* thrust jacks between the shield and the last ring */}
      {boring && t < T.boreE && placed > 0 && shieldBack > lastRingFront && [0.7, -0.7].map((dy) => (
        <group key={dy}>
          <mesh position={[shieldBack - 0.2, TUN_Y + dy, 0.95]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.13, 0.13, 0.4, 10]} />
            <meshStandardMaterial color="#3a3d42" />
          </mesh>
          <mesh position={[(shieldBack - 0.4 + lastRingFront) / 2, TUN_Y + dy, 0.95]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.07, 0.07, Math.max(0.01, shieldBack - 0.4 - lastRingFront), 10]} />
            <meshStandardMaterial color="#d8dce0" metalness={0.6} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* erector arm placing segments */}
      {boring && t < T.boreE && (
        <group position={[lastRingFront + 0.2, TUN_Y, -0.2]} rotation={[t * 2.5, 0, 0]}>
          <mesh position={[0, 0.5, 0]}>
            <boxGeometry args={[0.18, 1.0, 0.18]} />
            <meshStandardMaterial color="#e2453c" />
          </mesh>
          <mesh position={[0, 1.0, 0]}>
            <boxGeometry args={[0.6, 0.15, 0.4]} />
            <meshStandardMaterial color="#c9c4ba" />
          </mesh>
        </group>
      )}

      {/* laser guidance from the launch shaft to the machine */}
      {t >= T.laser && t < T.boreE && (
        <>
          <mesh position={[(BORE_L + 0.3 + shieldBack) / 2, TUN_Y + 0.45, -0.5]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.05, 0.05, Math.max(0.01, shieldBack - BORE_L - 0.3), 6]} />
            <meshBasicMaterial color="#ff2a2a" toneMapped={false} />
          </mesh>
          <mesh position={[shieldBack, TUN_Y + 0.45, -0.45]} scale={0.09 + 0.03 * Math.sin(t * 12)}>
            <sphereGeometry args={[1, 10, 10]} />
            <meshBasicMaterial color="#ff5a5a" toneMapped={false} />
          </mesh>
        </>
      )}

      {/* fit-out */}
      {railsP > 0 && (
        <mesh position={[BORE_L + (BORE_R - BORE_L) * railsP / 2, TUN_Y - TUN_R + 0.2, -0.45]}>
          <boxGeometry args={[(BORE_R - BORE_L) * railsP, 0.08, 0.6]} />
          <meshStandardMaterial color="#3a3a3a" />
        </mesh>
      )}
      {lightsP > 0 && Array.from({ length: 12 }, (_, i) => {
        const x = BORE_L + 0.8 + i * 1.75;
        return i / 12 < lightsP ? (
          <mesh key={i} position={[x, TUN_Y + TUN_R * 0.75, -0.6]}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshBasicMaterial color="#fff3b0" toneMapped={false} />
          </mesh>
        ) : null;
      })}
      {fansP > 0 && [-1.6, 2.6].map((x) => (
        <mesh key={x} position={[x, TUN_Y + 0.75, -0.45]} rotation={[0, 0, Math.PI / 2]} scale={fansP}>
          <cylinderGeometry args={[0.22, 0.22, 1.0, 12]} />
          <meshStandardMaterial color="#8e949b" metalness={0.4} />
        </mesh>
      ))}
      {pumpsP > 0 && (
        <mesh position={[0.6, TUN_Y - TUN_R + 0.42, -0.75]} scale={pumpsP}>
          <boxGeometry args={[0.5, 0.35, 0.35]} />
          <meshStandardMaterial color="#2f6fd6" />
        </mesh>
      )}
      {t >= T.train - 0.6 && <Train x={trainX} />}
      {t >= T.train - 0.5 && <Boat x={lerp(5, -6, progress(t, T.train - 0.5, timings.duration))} t={t} />}

      {/* people for scale */}
      {t >= T.shaftsE - 0.2 && t < T.boreS + 2 && <Worker at={[X_START - 0.5, SHAFT_BOTTOM, 1.35]} facing={-0.6} />}
      {t >= T.shaftsE - 0.2 && t < T.boreS + 2 && <Worker at={[X_START - 0.15, SHAFT_BOTTOM, 1.5]} facing={0.4} />}
      {t >= T.seals && t < T.grout && <Worker at={[lastRingFront - 2.2, TUN_Y - TUN_R + 0.12, -0.35]} facing={Math.PI / 2} />}

      {/* the machine */}
      <Crane hookX={hookX} hookY={hanging + 1.2} show={t >= L - 0.6 && t < T.boreS} />
      {showTBM && <TBM x={xF} bodyY={(boring ? TUN_Y : bodyY) + exitY} headY={(boring ? TUN_Y : headY) + exitY} gantryY={(boring ? TUN_Y : gantryY) + exitY} spin={spin} />}
      {slurry > 0 && (
        <mesh position={[xF + 0.22, TUN_Y, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <cylinderGeometry args={[1.24, 1.24, 0.3, 20]} />
          <meshStandardMaterial color="#d8c08a" transparent opacity={0.7 * slurry} />
        </mesh>
      )}
      {boring && t < T.boreE && [0, 1, 2].map((k) => (
        <Burst key={`d${k}-${Math.floor(t * 2)}`} t={t} t0={Math.floor(t * 2) / 2 + k * 0.15} at={[xF + 0.2, TUN_Y - 0.6 + k * 0.5, 0.9]} seed={Math.floor(t * 2) * 3 + k} count={5} color="#8a6a48" speed={1.2} up={1.2} gravity={4} life={0.45} size={0.08} />
      ))}
      <Burst t={t} t0={T.boreS + (BORE_R - X_START) / speed} at={[BORE_R, TUN_Y, 1]} seed={9} count={22} color="#c9a27a" speed={3} up={2} gravity={4} life={1} size={0.22} />

      {/* water pushing in vs the slurry pushing back */}
      {pushIn > 0 && (
        <>
          <Arrow at={[xF + 2.0, TUN_Y + 0.6, 1.4]} dir={-1} color="#ff3b2f" s={pushIn} t={t} />
          <Arrow at={[xF + 2.0, TUN_Y - 0.6, 1.4]} dir={-1} color="#ff3b2f" s={pushIn} t={t} />
          {drops.map(([a, b], i) => {
            const k = (t * 0.9 + a) % 1;
            return (
              <mesh key={i} position={[xF + 2.8 - k * 2.4, TUN_Y + 1.6 - k * (0.6 + b), 1.25]} scale={0.07 * pushIn}>
                <sphereGeometry args={[1, 6, 6]} />
                <meshBasicMaterial color="#3fa9ff" />
              </mesh>
            );
          })}
        </>
      )}
      {pushBack > 0 && (
        <>
          <Arrow at={[xF + 0.9, TUN_Y + 0.6, 1.4]} dir={1} color="#2f8bff" s={pushBack * 1.1} t={t} />
          <Arrow at={[xF + 0.9, TUN_Y - 0.6, 1.4]} dir={1} color="#2f8bff" s={pushBack * 1.1} t={t} />
        </>
      )}
      <Burst t={t} t0={L + 1.1} at={[-SHAFT_X, TUN_Y - TUN_R, 1]} seed={4} count={12} color="#c9a27a" speed={2.5} up={1.5} gravity={3} life={0.8} size={0.25} />
    </>
  );
};
