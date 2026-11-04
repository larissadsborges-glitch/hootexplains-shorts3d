import React, { useMemo } from 'react';
import {
  clamp01, easeInQuad, easeOutCubic, lerp, progress, rng, smoothstep,
} from '../lib/anim';
import type { Timings } from '../types';
import { Burst, CameraRig, Car } from '../world/Props';
import { RIVER_HALF, WATER_Y } from '../world/terrain';
import { Clouds, Lights, Road, Sky, Terrain, Trees, Water } from '../world/World';
import {
  buildTimeline, CAR_FALL_TO_WATER, cameraPose, DECK, SPAN, widenFactor,
} from './riverBridgeTimeline';

const N = 25; // wooden planks
const NS = 16; // concrete beam segments (so it can sag)
const PLANK_Y = 0.2;
const BEAM_H = 0.6;

export const RiverBridge: React.FC<{ timings: Timings; t: number }> = ({ timings, t }) => {
  const T = useMemo(() => buildTimeline(timings), [timings]);
  const scatter = useMemo(() => {
    const r = rng(99);
    return Array.from({ length: N }, () => [r() * 2 - 1, r() * 2 - 1, r() * 2 - 1]);
  }, []);

  const pose = cameraPose(timings, T, t);
  const W = widenFactor(T, t);
  const span = SPAN * W;

  // ---- wooden bridge + first car ----
  const broken = t >= T.tBreak;
  const dtB = t - T.tBreak;
  const pDrive = progress(t, T.drive, T.tBreak);
  const carX = lerp(-17, -0.7, 1 - Math.pow(1 - pDrive, 2)) + (broken ? 0.5 * Math.min(dtB, 0.8) : 0);
  const onBridge = smoothstep(-7.5, -3, carX);
  const creak = smoothstep(T.tBreak - 0.7, T.tBreak, t);
  const sag = (x: number) => {
    const shape = Math.max(0, Math.cos((Math.PI * x) / (2 * SPAN)));
    const local = 0.6 + 0.4 * Math.exp(-((x - carX) ** 2) / 8);
    return (0.1 * onBridge + 0.22 * creak) * shape * local + (creak > 0 ? Math.sin(t * 40) * 0.01 * creak : 0);
  };
  const woodRoadY = (x: number) =>
    Math.abs(x) <= SPAN + 0.4 ? DECK - sag(x) : lerp(DECK, 0.03, clamp01(Math.abs(x) - SPAN - 0.4));

  const carH = 0.38;
  let carY = woodRoadY(carX) + carH;
  let carRot: [number, number, number] = [0, 0, 0];
  if (broken) {
    const tImpact = CAR_FALL_TO_WATER;
    carY = dtB < tImpact ? carY - 4.9 * dtB * dtB : WATER_Y + 0.15 - 1.4 * (dtB - tImpact) ** 1.3;
    carRot = [0.25 * clamp01(dtB / 0.8), 0, -0.55 * clamp01(dtB / 0.6)];
  }
  const showCar = t > T.drive - 0.05 && carY > -2.6;

  const units = [];
  for (let i = 0; i < N; i++) {
    const x = -SPAN + 0.25 + i * ((2 * SPAN - 0.5) / (N - 1));
    const tIn = T.buildS + 0.1 + (T.buildE - T.buildS - 0.35) * (i / (N - 1));
    if (t < tIn) continue;
    let pos: [number, number, number];
    let rot: [number, number, number] = [0, 0, 0];
    if (!broken) {
      const drop = 1 - easeOutCubic(progress(t, tIn, tIn + 0.25));
      pos = [x, PLANK_Y - sag(x) + drop * 1.0, 0];
      rot = [drop * 0.4 * scatter[i][0], 0, drop * 0.3 * scatter[i][1]];
    } else {
      const left = x < 0;
      const hx = left ? -SPAN : SPAN;
      const a = (left ? -1 : 1) * 1.1 * easeInQuad(clamp01(dtB / 0.55));
      const rx = x - hx, ry = PLANK_Y - DECK;
      const k = clamp01(dtB / 0.4);
      const fall = dtB > 0.45 ? 4.9 * (dtB - 0.45) ** 2 : 0;
      pos = [
        hx + rx * Math.cos(a) - ry * Math.sin(a),
        DECK + rx * Math.sin(a) + ry * Math.cos(a) - fall + scatter[i][1] * 0.15 * k,
        scatter[i][2] * 0.25 * k,
      ];
      rot = [scatter[i][0] * 0.5 * k, scatter[i][2] * 0.3 * k, a + scatter[i][1] * 0.25 * k];
      if (pos[1] < -3) continue;
    }
    units.push(
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

  // ---- concrete beam: drops, rests on the abutments, then sags as the river widens ----
  const pBeam = progress(t, T.tBeamDrop, T.tBeamLand);
  const dtL = t - T.tBeamLand;
  const beamRest = DECK - BEAM_H / 2; // top flush with the road
  const beamY = t < T.tBeamLand
    ? lerp(7, beamRest, easeInQuad(pBeam))
    : beamRest + 0.07 * Math.sin(dtL * 22) * Math.exp(-dtL * 7);
  const halfLen = span + 0.7;
  const sagAmp = 0.75 * easeInQuad(clamp01((W - 1) / 0.8));
  const beamSag = (x: number) => sagAmp * Math.cos((Math.PI * x) / (2 * halfLen));
  const beamTopY = (x: number) =>
    Math.abs(x) <= halfLen ? beamY + BEAM_H / 2 - beamSag(x) : lerp(DECK, 0.03, clamp01(Math.abs(x) - halfLen));
  const segs = [];
  if (t >= T.tBeamDrop) {
    const sl = (2 * halfLen) / NS;
    for (let i = 0; i < NS; i++) {
      const x = -halfLen + sl * (i + 0.5);
      const slope = (beamSag(x + 0.01) - beamSag(x - 0.01)) / 0.02;
      segs.push(
        <mesh key={i} position={[x, beamY - beamSag(x), 0]} rotation={[0, 0, -Math.atan(slope)]} castShadow receiveShadow>
          <boxGeometry args={[sl + 0.02, BEAM_H, 2.6]} />
          <meshStandardMaterial color="#d6d1c7" flatShading roughness={0.9} />
        </mesh>,
      );
    }
  }

  // ---- second car proves the beam is stronger ----
  const p2 = progress(t, T.car2S, T.car2E);
  const car2X = lerp(-16, 16, p2);
  const showCar2 = t >= T.car2S && p2 < 1;

  return (
    <>
      <CameraRig pose={pose} />
      <Sky />
      <Lights />
      <Terrain hw={RIVER_HALF * W} />
      <Water t={t} />
      <Road from={span + 1.5} />
      <Trees hw={RIVER_HALF * W} />
      <Clouds t={t} />

      {/* abutments on both banks */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (span + 0.75), DECK - 0.9, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 1.8, 3.0]} />
          <meshStandardMaterial color="#bfb9ad" flatShading roughness={0.95} />
        </mesh>
      ))}

      {units}
      {showCar && <Car position={[carX, carY, 0]} rotation={carRot} wheelSpin={-carX / 0.2} />}
      <Burst t={t} t0={T.tBreak + 0.18} at={[0, WATER_Y, 0]} seed={3} count={20} speed={3.2} up={4.5} size={0.2} ring />
      <Burst t={t} t0={T.tBreak + CAR_FALL_TO_WATER} at={[carX, WATER_Y, 0]} seed={8} count={26} speed={3} up={6} size={0.24} ring />

      {segs}
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <Burst key={`${sx}${sz}`} t={t} t0={T.tBeamLand} at={[sx * (SPAN + 0.3), DECK, sz * 1.4]}
            seed={20 + sx * 3 + sz} count={8} color="#ece6da" speed={2.2} up={1.2} gravity={0.6} life={1.1} size={0.32} />
        )),
      )}
      {showCar2 && (
        <Car position={[car2X, beamTopY(car2X) + carH, 0]} wheelSpin={-car2X / 0.2} color="#2f6fd6" />
      )}
    </>
  );
};
