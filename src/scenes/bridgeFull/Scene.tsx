import React, { useMemo } from 'react';
import * as THREE from 'three';
import {
  clamp01, easeInOutSine, easeInQuad, easeOutBack, easeOutCubic, lerp, progress, rng, smoothstep,
} from '../../lib/anim';
import type { Timings } from '../../types';
import { CLIP, CrossSection, Cutter } from '../../world/CrossSection';
import { Burst, CameraRig, Car } from '../../world/Props';
import { RIVER_HALF, WATER_Y } from '../../world/terrain';
import { Clouds, Lights, Road, Sky, Terrain, Trees, Water } from '../../world/World';
import {
  BEAM_H, BED_Y, buildFullTimeline, cameraPose, CAR_FALL_TO_WATER, DECK, DECK2, HALF_LEN_WIDE, isCutaway,
  N_SLABS, ROCK_Y, SLAB_GAP, SLAB_H, SPAN, widenFactor,
} from './timeline';

const N_PLANKS = 25;
const NS = 18; // beam segments, so beams can sag
const PLANK_Y = 0.2;
const CAR_H = 0.38;
const CONCRETE = '#d6d1c7';

type V3 = [number, number, number];

/** A beam made of short segments following a sag curve y(x). */
const RED = new THREE.Color('#ff3b2f');
const SegBeam: React.FC<{ half: number; y: number; sag: (x: number) => number; color?: string; depth?: number; glow?: number }> = ({
  half, y, sag, color = CONCRETE, depth = 2.6, glow = 0,
}) => {
  const base = new THREE.Color(color);
  const sl = (2 * half) / NS;
  const segs = [];
  for (let i = 0; i < NS; i++) {
    const x = -half + sl * (i + 0.5);
    const slope = (sag(x + 0.01) - sag(x - 0.01)) / 0.02;
    segs.push(
      <mesh key={i} position={[x, y - sag(x), 0]} rotation={[0, 0, -Math.atan(slope)]} castShadow receiveShadow>
        <boxGeometry args={[sl + 0.03, BEAM_H, depth]} />
        <meshStandardMaterial color={base.clone().lerp(RED, glow * Math.max(0, Math.cos((Math.PI * x) / (2 * half))) ** 2)} flatShading roughness={0.9} />
      </mesh>,
    );
  }
  return <>{segs}</>;
};

/** Rotate a point (rx, ry) around a hinge by angle a. */
const hinge = (hx: number, hy: number, rx: number, ry: number, a: number): [number, number] => [
  hx + rx * Math.cos(a) - ry * Math.sin(a),
  hy + rx * Math.sin(a) + ry * Math.cos(a),
];

export const BridgeFull: React.FC<{ timings: Timings; t: number }> = ({ timings, t }) => {
  const T = useMemo(() => buildFullTimeline(timings), [timings]);
  const scatter = useMemo(() => {
    const r = rng(99);
    return Array.from({ length: 40 }, () => [r() * 2 - 1, r() * 2 - 1, r() * 2 - 1]);
  }, []);

  const pose = cameraPose(timings, T, t);
  const W = widenFactor(T, t);
  const span = SPAN * W;
  const hw = RIVER_HALF * W;
  const cut = isCutaway(T, t);
  const clip = CLIP;
  const halfW = HALF_LEN_WIDE;

  // ============ ACT 1: planks + red car ============
  const broken = t >= T.tBreak;
  const dtB = t - T.tBreak;
  const carX = lerp(-17, -0.7, 1 - Math.pow(1 - progress(t, T.drive, T.tBreak), 2)) + (broken ? 0.5 * Math.min(dtB, 0.8) : 0);
  const onBridge = smoothstep(-7.5, -3, carX);
  const creak = smoothstep(T.tBreak - 0.7, T.tBreak, t);
  const plankSag = (x: number) => {
    const shape = Math.max(0, Math.cos((Math.PI * x) / (2 * SPAN)));
    const local = 0.6 + 0.4 * Math.exp(-((x - carX) ** 2) / 8);
    return (0.1 * onBridge + 0.22 * creak) * shape * local + (creak > 0 ? Math.sin(t * 40) * 0.01 * creak : 0);
  };
  const woodY = (x: number) => (Math.abs(x) <= SPAN + 0.4 ? DECK - plankSag(x) : lerp(DECK, 0.03, clamp01(Math.abs(x) - SPAN - 0.4)));
  let car1Y = woodY(carX) + CAR_H;
  let car1Rot: V3 = [0, 0, 0];
  if (broken) {
    car1Y = dtB < CAR_FALL_TO_WATER ? car1Y - 4.9 * dtB * dtB : WATER_Y + 0.15 - 1.4 * (dtB - CAR_FALL_TO_WATER) ** 1.3;
    car1Rot = [0.25 * clamp01(dtB / 0.8), 0, -0.55 * clamp01(dtB / 0.6)];
  }
  const planks = [];
  if (t < T.tBreak + 3) {
    for (let i = 0; i < N_PLANKS; i++) {
      const x = -SPAN + 0.25 + i * ((2 * SPAN - 0.5) / (N_PLANKS - 1));
      const tIn = T.buildS + 0.1 + (T.buildE - T.buildS - 0.35) * (i / (N_PLANKS - 1));
      if (t < tIn) continue;
      let pos: V3;
      let rot: V3 = [0, 0, 0];
      if (!broken) {
        const drop = 1 - easeOutCubic(progress(t, tIn, tIn + 0.25));
        pos = [x, PLANK_Y - plankSag(x) + drop, 0];
        rot = [drop * 0.4 * scatter[i][0], 0, drop * 0.3 * scatter[i][1]];
      } else {
        const left = x < 0;
        const hx = left ? -SPAN : SPAN;
        const a = (left ? -1 : 1) * 1.1 * easeInQuad(clamp01(dtB / 0.55));
        const k = clamp01(dtB / 0.4);
        const fall = dtB > 0.45 ? 4.9 * (dtB - 0.45) ** 2 : 0;
        const [px, py] = hinge(hx, DECK, x - hx, PLANK_Y - DECK, a);
        pos = [px, py - fall + scatter[i][1] * 0.15 * k, scatter[i][2] * 0.25 * k];
        rot = [scatter[i][0] * 0.5 * k, scatter[i][2] * 0.3 * k, a + scatter[i][1] * 0.25 * k];
        if (pos[1] < -3) continue;
      }
      planks.push(
        <group key={i} position={pos} rotation={rot}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.44, 0.1, 2.3]} />
            <meshStandardMaterial color={i % 2 ? '#a8713f' : '#9a6436'} flatShading roughness={0.9} />
          </mesh>
          {[-0.8, 0.8].map((z) => (
            <mesh key={z} position={[0, -0.13, z]} castShadow>
              <boxGeometry args={[0.52, 0.16, 0.18]} />
              <meshStandardMaterial color="#7a4e2a" flatShading />
            </mesh>
          ))}
        </group>,
      );
    }
  }

  // ============ ACT 2: beam 1 drops, river widens, beam sags and snaps ============
  const beamRest = DECK - BEAM_H / 2;
  const beam1Y = t < T.tBeamLand
    ? lerp(5, beamRest, easeInQuad(progress(t, T.tBeamDrop, T.tBeamLand)))
    : beamRest + 0.07 * Math.sin((t - T.tBeamLand) * 22) * Math.exp(-(t - T.tBeamLand) * 7);
  const half1 = span + 0.7;
  const sag1Amp = 0.4 * easeInQuad(clamp01((W - 1) / 0.8)) + 0.38 * easeInQuad(progress(t, T.tSagS, T.tSnap2)); // keep the beam above the water so the sag reads
  const sag1 = (x: number) => sag1Amp * Math.cos((Math.PI * x) / (2 * half1)) + (t > T.tSagS && t < T.tSnap2 ? Math.sin(t * 38) * 0.015 : 0);
  const beam1Top = (x: number) => (Math.abs(x) <= half1 ? beam1Y + BEAM_H / 2 - sag1(x) : lerp(DECK, 0.03, clamp01(Math.abs(x) - half1)));
  const snapped = t >= T.tSnap2;
  const dtS = t - T.tSnap2;
  const beam1Halves = [];
  if (snapped && dtS < 2.5) {
    for (const side of [-1, 1]) {
      // each half swings down around its abutment, then drops into the river
      const a = side * (0.15 + 0.9 * easeInQuad(clamp01(dtS / 0.6)));
      const fall = dtS > 0.5 ? 4.9 * (dtS - 0.5) ** 2 : 0;
      const len = half1;
      const [cx, cy] = hinge(side * half1, beam1Y, -side * len / 2, 0, a);
      if (cy - fall < -4) continue;
      beam1Halves.push(
        <mesh key={side} position={[cx, cy - fall, 0]} rotation={[0, 0, a]} castShadow>
          <boxGeometry args={[len, BEAM_H, 2.6]} />
          <meshStandardMaterial color={CONCRETE} flatShading roughness={0.9} />
        </mesh>,
      );
    }
  }
  const p2 = progress(t, T.car2S, T.car2E);
  const car2X = lerp(-16, 16, p2);

  // ============ ACT 3: beam 2 + pier, pier sinks into the mud ============
  const beam2Rest = DECK2 - BEAM_H / 2;
  const beam2Y = t < T.tBeam2Land
    ? lerp(8, beam2Rest, easeInQuad(progress(t, T.tBeam2Drop, T.tBeam2Land)))
    : beam2Rest + 0.06 * Math.sin((t - T.tBeam2Land) * 22) * Math.exp(-(t - T.tBeam2Land) * 7);
  const rewind = easeInOutSine(progress(t, T.tResetS, T.tResetS + 0.5));
  const sinkRaw = 0.9 * easeInOutSine(progress(t, T.tSinkS, T.tSinkE)) + 1.3 * easeInQuad(progress(t, T.tDropS, T.tDropE));
  const sink = sinkRaw * (1 - rewind);
  const tilt = 0.12 * progress(t, T.tDropS, T.tDropE) * (1 - rewind);
  const pierTop = DECK2 - BEAM_H; // underside of the raised beam
  const pierH = pierTop - BED_Y;
  const pierLand = T.tPierLand;
  const pierFall = 1 - easeInQuad(clamp01(1 - progress(t, pierLand - 0.6, pierLand)));
  const lift = easeInQuad(progress(t, T.tResetS + 0.6, T.tResetS + 1.3)) * 10;
  const pierY = BED_Y + pierH / 2 + (t < pierLand ? 8 * (1 - easeInQuad(progress(t, pierLand - 0.6, pierLand))) : 0) - sink + lift;
  void pierFall;
  const showPier1 = t >= pierLand - 0.6 && t < T.tResetS + 1.3;
  const sag2 = (x: number) => sink * 0.95 * Math.cos((Math.PI * x) / (2 * halfW)) + (sink > 0.05 && sink < 2 ? Math.sin(t * 30) * 0.01 : 0);

  // ============ ACT 4: piles hammered to rock, pile cap + new pier ============
  const PILE_X = [-1.1, 0, 1.1];
  const PILE_LEN = 4.7;
  const pileTopFinal = BED_Y + 0.1;
  const pileTop0 = BED_Y + PILE_LEN; // bottom resting on the riverbed
  const piles = PILE_X.map((x, i) => {
    const t0 = T.tPilesS + i * 0.25;
    if (t < t0 - 0.35) return null;
    const enter = easeOutCubic(progress(t, t0 - 0.35, t0));
    const H = 7;
    const u = progress(t, t0, T.tRock) * H;
    const k = Math.min(H, Math.floor(u));
    const frac = u - k;
    const s = Math.min(1, (k + easeOutCubic(Math.min(1, frac / 0.3))) / H);
    const top = lerp(pileTop0 + 6, pileTop0, enter) - (pileTop0 - pileTopFinal) * s;
    return (
      <mesh key={i} position={[x, top - PILE_LEN / 2, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.24, PILE_LEN, 8]} />
        <meshStandardMaterial color="#a9a49a" flatShading roughness={0.9} />
      </mesh>
    );
  });
  const capY = BED_Y + 0.4 + 8 * (1 - easeInQuad(progress(t, T.tCapS, T.tCapS + 0.45)));
  const pier2H = pierTop - (BED_Y + 0.7);
  const pier2Land = T.tCapS + 0.9;
  const pier2Y = BED_Y + 0.7 + pier2H / 2 + 8 * (1 - easeInQuad(progress(t, pier2Land - 0.45, pier2Land)));

  // ============ ACT 5: deck slabs, heat, one slab cracks, expansion joints ============
  const slabL = (2 * halfW - (N_SLABS - 1) * SLAB_GAP) / N_SLABS;
  const slabCx = (i: number) => -halfW + slabL / 2 + i * (slabL + SLAB_GAP);
  const heatScale =
    1 + 0.024 * easeInOutSine(progress(t, T.tGrow, T.tGrow + 0.45)) * (1 - easeInOutSine(progress(t, T.tShrink, T.tShrink + 0.45)))
    - 0.03 * easeInOutSine(progress(t, T.tShrink, T.tShrink + 0.45)) * (1 - easeInOutSine(progress(t, T.tOneSlab - 0.3, T.tOneSlab)));
  const oneSlab = t >= T.tOneSlab && t < T.tJoints;
  const dtC = t - T.tSlabCrack;
  const slabTopY = DECK2 + SLAB_H;
  const slabs = [];
  if (t >= T.tSlabsS && !oneSlab) {
    for (let i = 0; i < N_SLABS; i++) {
      const tIn = T.tSlabsS + 0.15 + i * ((T.tSlabsE - T.tSlabsS - 0.3) / N_SLABS);
      if (t < tIn) continue;
      const drop = 1 - easeOutCubic(progress(t, tIn, tIn + 0.35));
      slabs.push(
        <mesh key={i} position={[slabCx(i), DECK2 + SLAB_H / 2 + drop * 4, 0]} scale={[heatScale, 1, 1]} castShadow receiveShadow>
          <boxGeometry args={[slabL, SLAB_H, 2.6]} />
          <meshStandardMaterial color="#c9c4ba" flatShading roughness={0.9} />
        </mesh>,
      );
    }
  }
  if (oneSlab) {
    const grow = 1 + 0.045 * easeInOutSine(progress(t, T.tOneSlab + 0.2, T.tSlabCrack));
    if (dtC < 0) {
      slabs.push(
        <mesh key="one" position={[0, DECK2 + SLAB_H / 2, 0]} scale={[grow, 1, 1]} castShadow receiveShadow>
          <boxGeometry args={[2 * halfW, SLAB_H, 2.6]} />
          <meshStandardMaterial color="#c9c4ba" flatShading roughness={0.9} emissive="#ff3b1f" emissiveIntensity={0.6 * progress(t, T.tOneSlab, T.tSlabCrack) * (0.75 + 0.25 * Math.sin(t * 25))} />
        </mesh>,
      );
    } else {
      const k = easeOutBack(clamp01(dtC / 0.35));
      [-1, 0, 1].forEach((j, n) => {
        const L = (2 * halfW) / 3;
        slabs.push(
          <mesh key={`c${n}`} position={[j * (L + 0.25 * k), DECK2 + SLAB_H / 2 + Math.abs(j) * 0.08 * k, scatter[n][0] * 0.15 * k]}
            rotation={[scatter[n][1] * 0.06 * k, scatter[n][2] * 0.05 * k, -j * 0.04 * k]} castShadow receiveShadow>
            <boxGeometry args={[L - 0.1, SLAB_H, 2.6]} />
            <meshStandardMaterial color="#c9c4ba" flatShading roughness={0.9} />
          </mesh>,
        );
      });
    }
  }
  // zig-zag cracks running across the slab just before it tears
  if (oneSlab && t >= T.tSlabCrack - 0.3 && dtC < 0) {
    const L = (2 * halfW) / 3;
    const grow2 = progress(t, T.tSlabCrack - 0.3, T.tSlabCrack);
    for (const cx of [-L / 2, L / 2]) {
      for (let k = 0; k < 6; k++) {
        if (k / 6 > grow2) continue;
        const z = -1.3 + (k + 0.5) * (2.6 / 6);
        slabs.push(
          <mesh key={`zz${cx}${k}`} position={[cx + (k % 2 ? 0.12 : -0.12), slabTopY + 0.012, z]} rotation={[0, (k % 2 ? 1 : -1) * 0.9, 0]}>
            <boxGeometry args={[0.6, 0.02, 0.07]} />
            <meshBasicMaterial color="#2a1f1a" />
          </mesh>,
        );
      }
    }
  }
  // finger joints in each gap
  const joints = [];
  if (t >= T.tJoints) {
    const pop = easeOutBack(progress(t, T.tJoints + 0.1, T.tJoints + 0.45));
    for (let g = 0; g < N_SLABS - 1; g++) {
      const gx = slabCx(g) + slabL / 2 + SLAB_GAP / 2;
      for (let f = 0; f < 9; f++) {
        const z = -1.1 + f * (2.2 / 8);
        const dir = f % 2 ? 1 : -1;
        joints.push(
          <mesh key={`${g}-${f}`} position={[gx + dir * 0.05, slabTopY + 0.045, z]} scale={[1, pop, 1]} castShadow>
            <boxGeometry args={[0.26, 0.05, 0.13]} />
            <meshStandardMaterial color="#9aa3ad" metalness={0.6} roughness={0.35} flatShading />
          </mesh>,
        );
      }
    }
  }

  // ============ ACT 6: asphalt + guard rails ============
  const roadTop = slabTopY + 0.04;
  const asphaltP = progress(t, T.tAsphaltS, T.tAsphaltE - 0.1);
  const front = -halfW - 4 + (2 * halfW + 8) * easeInOutSine(asphaltP);
  const asphalt = [];
  if (t >= T.tAsphaltS) {
    for (let i = 0; i < N_SLABS; i++) {
      const a = slabCx(i) - slabL / 2, b = Math.min(slabCx(i) + slabL / 2, front);
      if (b <= a) continue;
      asphalt.push(
        <mesh key={`a${i}`} position={[(a + b) / 2, slabTopY + 0.02, 0]} receiveShadow>
          <boxGeometry args={[b - a, 0.04, 2.3]} />
          <meshStandardMaterial color="#3b3f45" roughness={0.95} />
        </mesh>,
      );
      for (let d = a + 0.4; d + 0.6 < b; d += 1.3) {
        asphalt.push(
          <mesh key={`d${i}-${d.toFixed(1)}`} position={[d + 0.3, slabTopY + 0.045, 0]}>
            <boxGeometry args={[0.6, 0.01, 0.09]} />
            <meshStandardMaterial color="#ffcc33" roughness={0.6} />
          </mesh>,
        );
      }
    }
  }
  const RAMP = 6;
  const ramps = [];
  if (t >= T.tBeam2Land) {
    const top = t >= T.tSlabsS ? roadTop : DECK2;
    for (const sd of [-1, 1]) {
      const paved = t >= T.tAsphaltS && (sd === -1 || front >= halfW);
      const rise = top - 0.03;
      ramps.push(
        <mesh key={`r${sd}`} position={[sd * (halfW + RAMP / 2), 0.03 + rise / 2 - 0.05, 0]} rotation={[0, 0, -sd * Math.atan(rise / RAMP)]} castShadow receiveShadow>
          <boxGeometry args={[Math.hypot(RAMP, rise) + 0.1, 0.12, 2.4]} />
          <meshStandardMaterial color={paved ? '#3b3f45' : '#bdb7ab'} roughness={0.95} clippingPlanes={clip} />
        </mesh>,
      );
    }
  }
  const rails = [];
  if (t >= T.tRailsS) {
    const n = 8;
    for (let i = 0; i < n; i++) {
      const L = (2 * halfW) / n;
      const x = -halfW + L * (i + 0.5);
      const tIn = T.tRailsS + 0.1 + i * ((T.tRailsE - T.tRailsS - 0.3) / n);
      const up = easeOutBack(progress(t, tIn, tIn + 0.3));
      if (up <= 0) continue;
      for (const z of [-1.22, 1.22]) {
        rails.push(
          <group key={`${i}${z}`} position={[x, slabTopY, z]} scale={[1, Math.max(0.001, up), 1]}>
            <mesh position={[0, 0.2, 0]} castShadow>
              <boxGeometry args={[L - 0.04, 0.4, 0.24]} />
              <meshStandardMaterial color="#e3dfd6" flatShading roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.43, 0]} castShadow>
              <boxGeometry args={[L - 0.04, 0.07, 0.14]} />
              <meshStandardMaterial color="#c8c3b8" flatShading />
            </mesh>
          </group>,
        );
      }
    }
  }

  // ============ cars after the bridge is finished ============
  const finalDeckY = (x: number) =>
    Math.abs(x) <= halfW ? roadTop : lerp(roadTop, 0.03, clamp01((Math.abs(x) - halfW) / RAMP));
  const traffic: React.ReactNode[] = [];
  if (t >= T.tHit + 1.2) {
    const tt = t - (T.tHit + 1.2) + 2.5;
    const lanes = [
      { z: 0.55, dir: 1, off: 0, c: '#e2453c' }, { z: 0.55, dir: 1, off: 11, c: '#2f6fd6' },
      { z: -0.55, dir: -1, off: 5, c: '#f2b632' }, { z: -0.55, dir: -1, off: 16, c: '#ffffff' },
    ];
    lanes.forEach((l, i) => {
      const x = l.dir * (((tt * 5.5 + l.off) % 44) - 22);
      traffic.push(
        <Car key={i} position={[x, finalDeckY(x) + CAR_H, l.z]} rotation={[0, l.dir > 0 ? 0 : Math.PI, 0]} wheelSpin={-tt * 25} color={l.c} />,
      );
    });
  }

  // the "one last danger" car: drifts toward the edge, bounces off the new guard rail
  let swerveCar: React.ReactNode = null;
  if (t >= T.tSwerveS && t < T.tHit + 1.6) {
    const x = lerp(-halfW - 3, halfW + 1, progress(t, T.tSwerveS, T.tHit + 1.6));
    const drift = easeInQuad(progress(t, T.tSwerveS + 0.4, T.tHit));
    const back = easeOutCubic(progress(t, T.tHit, T.tHit + 0.6));
    const z = t < T.tHit ? lerp(0.55, 0.68, drift) : lerp(0.68, 0.3, back);
    const yaw = t < T.tHit ? -0.28 * drift : 0.35 * Math.sin((t - T.tHit) * 9) * Math.exp(-(t - T.tHit) * 4);
    swerveCar = <Car position={[x, finalDeckY(x) + CAR_H, z]} rotation={[0, yaw, 0]} wheelSpin={-x / 0.2} color="#8e44ad" />;
  }
  const swerveHitX = lerp(-halfW - 3, halfW + 1, progress(T.tHit, T.tSwerveS, T.tHit + 1.6));

  // car 3 tests the pier bridge
  const p3 = progress(t, T.car3S, T.car3E);
  const car3X = lerp(-halfW - 6, halfW + 6, p3);
  const beam2TopAt = (x: number) => (Math.abs(x) <= halfW ? beam2Y + BEAM_H / 2 - sag2(x) : lerp(DECK2, 0.03, clamp01((Math.abs(x) - halfW) / RAMP)));

  const abutTop = lerp(DECK, DECK2 - BEAM_H, easeOutBack(progress(t, T.tBeam2Drop - 0.5, T.tBeam2Drop)));
  const showBeam1 = t >= T.tBeamDrop && !snapped;
  const showBeam2 = t >= T.tBeam2Drop;

  return (
    <>
      <CameraRig pose={pose} />
      <Cutter active={cut} />
      <Sky />
      <Lights />
      <Terrain hw={hw} clip={clip} />
      <Water t={t} clip={clip} />
      <Road from={span + 1.5} clip={clip} />
      <Trees hw={hw} clip={clip} />
      <Clouds t={t} />
      {cut && <CrossSection hw={hw} rockY={ROCK_Y} />}

      {/* abutments */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (span + 0.75), (abutTop - 1.55) / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.5, abutTop + 1.55, 3.0]} />
          <meshStandardMaterial color="#bfb9ad" flatShading roughness={0.95} />
        </mesh>
      ))}

      {/* act 1 */}
      {planks}
      {t > T.drive - 0.05 && car1Y > -2.6 && <Car position={[carX, car1Y, 0]} rotation={car1Rot} wheelSpin={-carX / 0.2} />}
      <Burst t={t} t0={T.tBreak + 0.18} at={[0, WATER_Y, 0]} seed={3} count={20} speed={3.2} up={4.5} size={0.2} ring />
      <Burst t={t} t0={T.tBreak + CAR_FALL_TO_WATER} at={[carX, WATER_Y, 0]} seed={8} count={26} speed={3} up={6} size={0.24} ring />

      {/* act 2 */}
      {showBeam1 && <SegBeam half={half1} y={beam1Y} sag={sag1} glow={progress(t, T.tSagS, T.tSnap2)} />}
      {beam1Halves}
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => (
        <Burst key={`d${sx}${sz}`} t={t} t0={T.tBeamLand} at={[sx * (SPAN + 0.3), DECK, sz * 1.4]}
          seed={20 + sx * 3 + sz} count={8} color="#ece6da" speed={2.2} up={1.2} gravity={0.6} life={1.1} size={0.32} />
      )))}
      {t >= T.car2S && p2 < 1 && <Car position={[car2X, beam1Top(car2X) + CAR_H, 0]} wheelSpin={-car2X / 0.2} color="#2f6fd6" />}
      <Burst t={t} t0={T.tSnap2 + 0.5} at={[0, WATER_Y, 0]} seed={12} count={28} speed={4} up={5} size={0.26} ring />

      {/* act 3 */}
      {showBeam2 && <SegBeam half={halfW} y={beam2Y} sag={sag2} />}
      {showPier1 && (
        <mesh position={[0, pierY, 0]} rotation={[0, 0, tilt]} castShadow receiveShadow>
          <boxGeometry args={[1.2, pierH, 2.0]} />
          <meshStandardMaterial color="#cbc6bb" flatShading roughness={0.9} />
        </mesh>
      )}
      <Burst t={t} t0={pierLand} at={[0, WATER_Y, 0]} seed={14} count={22} speed={3} up={4.5} size={0.22} ring />
      {t >= T.car3S && p3 < 1 && <Car position={[car3X, beam2TopAt(car3X) + CAR_H, 0]} wheelSpin={-car3X / 0.2} color="#f2b632" />}

      {cut && t >= T.tSinkS && t < T.tDropE && [-1, 1].map((sx) => (
        <mesh key={`ar${sx}`} position={[sx * 1.2, pierY - 0.2 - 0.15 * Math.abs(Math.sin(t * 6)), 1.15]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.28, 0.6, 3]} />
          <meshBasicMaterial color="#ff3b2f" />
        </mesh>
      ))}

      {/* act 4 */}
      {piles}
      {PILE_X.map((x, i) => (
        <Burst key={`rk${i}`} t={t} t0={T.tRock + i * 0.04} at={[x, ROCK_Y - 0.9, 0.4]} seed={40 + i} count={10}
          color="#ffd27a" speed={1.6} up={1.6} gravity={3} life={0.6} size={0.12} />
      ))}
      {t >= T.tCapS && (
        <mesh position={[0, capY, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.4, 0.6, 2.2]} />
          <meshStandardMaterial color="#c4bfb4" flatShading roughness={0.9} />
        </mesh>
      )}
      {t >= pier2Land - 0.45 && (
        <mesh position={[0, pier2Y, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.2, pier2H, 2.0]} />
          <meshStandardMaterial color="#cbc6bb" flatShading roughness={0.9} />
        </mesh>
      )}

      {/* act 5-6 */}
      {slabs}
      {[-1, 0, 1].map((j, n) => (
        <Burst key={`sc${n}`} t={t} t0={T.tSlabCrack} at={[j * (2 * halfW) / 6, slabTopY, 0]} seed={60 + n} count={10}
          color="#ece6da" speed={2} up={1.6} gravity={1} life={0.9} size={0.28} />
      ))}
      {joints}
      {asphalt}
      {ramps}
      {rails}
      {traffic}
      {swerveCar}
      <Burst t={t} t0={T.tHit} at={[swerveHitX, slabTopY + 0.5, 1.05]} seed={77} count={14} color="#ffd27a" speed={2.2} up={2} gravity={5} life={0.5} size={0.1} />
    </>
  );
};
