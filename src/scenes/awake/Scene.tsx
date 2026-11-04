import React, { useMemo } from 'react';
import { useVideoConfig } from 'remotion';
import * as THREE from 'three';
import { clamp01, easeOutCubic, progress, rng } from '../../lib/anim';
import type { Timings } from '../../types';
import { CameraRig } from '../../world/Props';
import { Hoot } from '../../mascot/Mascots';
import { Jake, type JakeProps } from '../../mascot/Jake';
import { GradSky, PlaceLights } from '../learjet/assets';
import { BackWall, Clock, lerpC, Mug } from '../sleep/Scene';
import {
  BED, buildAwakeTimeline, cameraPose, clockAt, daylightAt, DESK, FRIDGE, hoursAt, JAKE_BED, JAKE_DESK, JAKE_FRIDGE, JAKE_WINDOW, lidsAt, NIGHTSTAND,
  type AwakeTimeline,
} from './timeline';

const WINDOW_X = -0.75;

/** Hoot perched somewhere, always turned to face the camera, beak synced to the narration. */
const TalkingHoot: React.FC<{ at: number[]; cam: number[]; t: number; talk: number; scale?: number; wave?: number }> = ({ at, cam, t, talk, scale = 0.26, wave = 0 }) => {
  const yaw = Math.atan2(cam[0] - at[0], cam[2] - at[2]);
  return (
    <group position={at as [number, number, number]} rotation={[0, yaw, 0]} scale={scale}>
      <Hoot t={t} talk={talk} wave={wave} />
    </group>
  );
};

/** A big sandwich gripped by its edge: thick stacked layers read clearly from any angle. */
const Sandwich: React.FC = () => (
  <group position={[0, -0.06, 0.02]} rotation={[0, 0, 0]}>
    {([[-0.045, 0.03, '#e8b56a'], [-0.017, 0.012, '#4caf50'], [0.0, 0.016, '#d8433a'], [0.018, 0.012, '#ffd34d'], [0.045, 0.03, '#e8b56a']] as [number, number, string][]).map(([z, h, c], k) => (
      <mesh key={k} position={[0, 0, z]}><boxGeometry args={[k === 1 ? 0.2 : 0.18, 0.15, h]} /><meshStandardMaterial color={c} roughness={0.7} /></mesh>
    ))}
  </group>
);

const ChipsBag: React.FC = () => (
  <group rotation={[-1.35, 0, 0]} position={[0, 0, 0.06]}>
    <mesh scale={[0.1, 0.13, 0.04]}><sphereGeometry args={[1, 16, 12]} /><meshStandardMaterial color="#ffd21f" /></mesh>
    <mesh position={[0, 0.0, 0.032]} scale={[0.09, 0.035, 0.012]}><sphereGeometry args={[1, 12, 8]} /><meshStandardMaterial color="#2f6fd6" /></mesh>
    {[-0.05, -0.017, 0.017, 0.05].map((x, i) => <mesh key={i} position={[x, 0.135, 0]} rotation={[0, 0, i % 2 ? 0.3 : -0.3]}><boxGeometry args={[0.035, 0.03, 0.03]} /><meshStandardMaterial color="#ffd21f" /></mesh>)}
  </group>
);

const Room: React.FC<{ T: AwakeTimeline; t: number; shot: string; cam: number[]; talk: number }> = ({ T, t, shot, cam, talk }) => {
  const day = daylightAt(T, t);
  const hours = hoursAt(T, t);
  const lids = lidsAt(T, t);
  const stars = useMemo(() => { const r = rng(4); return Array.from({ length: 30 }, () => [r() * 3 - 1.5, 0.9 + r() * 1.4]); }, []);
  const morn = clamp01(1 - Math.abs(clockAt(T, t) - 7) / 1.3);
  const sky = lerpC(lerpC('#0d1b3a', '#8fc4f0', day), '#ffb98a', 0.55 * morn);
  const sunrise = shot === 'window' ? easeOutCubic(progress(t, T.s('second') + 0.5, T.wordTime('second', 'awake', T.s('second') + 3))) : day;
  const wall = lerpC('#7f8fae', '#cdd8e8', day);
  const mugs = Math.min(7, Math.floor(1 + hours / 4));
  const final = T.s('final');

  // ---------------- Jake: where he is and what he's doing in each beat
  const beat = (e: string) => t >= T.s(e);
  let jake: JakeProps & { at: number[]; rotY?: number } = { t, at: JAKE_DESK, pose: 'sit', lids, armL: [0.55, -0.15, 1.05], armR: [0.6, -0.05, 1.0], smile: 0.1 };
  if (shot === 'desk' && !beat('wake')) {
    // cold open (hour 24): exhausted, head nodding toward the desk
    const nod = 0.5 + 0.5 * Math.sin(t * 2.4);
    const drop = easeOutCubic(clamp01((t - T.wordTime('cold', 'drunk', T.s('cold') + 5) + 0.2) / 0.35));
    jake = { ...jake, lids: Math.min(1, 0.65 + 0.3 * nod + drop), slump: 0.6 + 0.5 * drop, look: [0, 0.25 * nod * (1 - drop) + 0.5 * drop], brows: -0.8, smile: -0.4 };
  } else if (shot === 'bed') {
    // hour 0, 7 am: sitting up in bed, a big morning stretch, then a smile
    const st = clamp01((t - T.s('wake') - 0.2) / 1.0) * (1 - clamp01((t - T.s('wake') - 3.2) / 0.8));
    jake = { t, at: JAKE_BED, rotY: Math.PI / 2 - 0.35, pose: 'sit', lids: 0, mouth: 0.15 * st, armL: [0.12 + 0.5 * st, 0.06 + 2.15 * st, 0.4 - 0.25 * st], armR: [0.12 + 0.5 * st, 0.06 + 2.15 * st, 0.4 - 0.25 * st], smile: 1, brows: 0.6 };
  } else if (shot === 'room' && !beat('h16')) {
    // fast-forward through a normal day: typing, sipping coffee
    const sip = Math.max(0, Math.sin(t * 2.2)) ;
    jake = { ...jake, lids: 0.05, smile: 0.5, armR: [0.6 + 0.4 * sip, -0.05 - 0.25 * sip, 1.0 + 0.75 * sip], holdR: <group rotation={[0, 0, 0]}><Mug at={[0, -0.05, 0]} color="#ff8a3d" /></group>, look: [0.1 * Math.sin(t * 3), 0] };
  } else if (shot === 'room') {
    // hour 16, bedtime: at the desk, a huge yawn on "Bedtime"
    const y0 = T.wordTime('h16', 'Bedtime', T.s('h16') + 0.6);
    const yawn = clamp01((t - y0) / 0.4) * (1 - clamp01((t - y0 - 1.6) / 0.5));
    jake = { ...jake, mouth: yawn, lids: lids + 0.4 * yawn, armL: [0.55 + 2.3 * yawn, -0.15 + 0.5 * yawn, 1.05 - 0.75 * yawn], armR: [0.6 + 2.3 * yawn, -0.05 + 0.4 * yawn, 1.0 - 0.7 * yawn], look: [0, -0.15 * yawn] };
  } else if (shot === 'test') {
    // hour 17: reaction test; the ball drops, his hand snaps shut far too late
    const d0 = T.wordTime('h17', 'reactions', T.s('h17') + 1.0);
    const grab = clamp01((t - d0 - 0.75) / 0.15);
    jake = { ...jake, armR: [1.2 - 0.4 * grab, -0.12, 0.9 + 0.6 * grab], brows: 0.6 * grab, mouth: 0.35 * grab, lids: grab > 0 ? 0.1 : Math.max(lids, 0.5) };
  } else if (shot === 'desk' && beat('h20') && !beat('h22')) {
    // 3 am: chin propped on his hand, eyes fighting to stay open
    jake = { ...jake, armR: [0.55, -0.3, 2.75], look: [0.12, 0.05], lids: lids + 0.15 * (0.5 + 0.5 * Math.sin(t * 2.3)), brows: -0.6, slump: 0.3 };
  } else if (shot === 'fridge') {
    // hour 22: standing at the open fridge, a sandwich in hand
    const bite = Math.max(0, Math.sin(t * 5)) * clamp01((t - T.s('h22') - 1.2) / 0.3);
    jake = { t, at: JAKE_FRIDGE, pose: 'stand', lids, armR: [0.55 + 0.25 * bite, -0.1, 1.2 + 0.2 * bite], armL: [0.2, 0.1, 0.3], mouth: 0.25 * bite, smile: 0.4, holdR: <Sandwich /> };
  } else if (shot === 'window') {
    // sunrise: the "second wind": eyes snap open, arms up
    const up = clamp01((t - T.wordTime('second', 'awake', T.s('second') + 3) + 0.2) / 0.5);
    jake = { t, at: JAKE_WINDOW, pose: 'stand', lids: lidsAt(T, t), armL: [0.1 + 2.6 * up, 0.04 + 0.25 * up, 0.25], armR: [0.1 + 2.6 * up, 0.04 + 0.25 * up, 0.25], brows: 0.8 * up, smile: 0.8 * up, mouth: 0.25 * up };
  } else if (shot === 'desk' && beat('h24')) {
    // hour 24: slumped again; in the end he looks straight at you
    const look = t >= final ? clamp01((t - final) / 0.5) : 0;
    jake = { ...jake, slump: 0.45 * (1 - look), lids: 0.55, brows: -0.7, smile: -0.2, look: [0, 0.18 * (1 - look)] };
  }

  // Hoot's perch for each shot, always facing the camera
  const perch = shot === 'bed' ? [NIGHTSTAND[0] + 0.1, 0.56, NIGHTSTAND[2] - 0.06] : shot === 'fridge' ? [FRIDGE[0] - 0.12, 1.7, FRIDGE[2] + 0.12] : shot === 'window' ? [DESK[0] - 0.36, 0.775, DESK[2] - 0.05] : [DESK[0] - 0.49, 0.775, DESK[2] - 0.04];

  // reaction-test ball
  const d0 = T.wordTime('h17', 'reactions', T.s('h17') + 1.0);
  const fall = shot === 'test' ? Math.max(0, t - d0) : -1;
  const ballY = fall < 0 ? 1.5 : Math.max(0.81, 1.5 - 0.5 * 9.8 * fall * fall * 0.35);

  return (
    <group>
      {/* outside the window */}
      <mesh position={[WINDOW_X, 1.6, -3.2]}><planeGeometry args={[6, 4]} /><meshBasicMaterial color={shot === 'window' ? lerpC('#1f2a55', '#ffb27a', sunrise) : sky} toneMapped={false} /></mesh>
      {day < 0.5 && shot !== 'window' && stars.map(([x, y], i) => <mesh key={i} position={[WINDOW_X + x, y, -3.15]}><circleGeometry args={[0.012, 6]} /><meshBasicMaterial color="#ffffff" transparent opacity={1 - 2 * day} toneMapped={false} /></mesh>)}
      {shot === 'window'
        ? <mesh position={[WINDOW_X + 0.2, 0.8 + 0.7 * sunrise, -3.1]}><circleGeometry args={[0.2, 32]} /><meshBasicMaterial color="#ffe08a" toneMapped={false} /></mesh>
        : <mesh position={[WINDOW_X + 0.25, 1.85 - 0.75 * morn, -3.1]}><circleGeometry args={[0.12, 24]} /><meshBasicMaterial color={day > 0.5 ? '#ffe9a8' : '#f4f1e0'} toneMapped={false} /></mesh>}
      {[-1.2, -0.85, -0.5, -0.2, 0.15, 0.45].map((x, i) => <mesh key={i} position={[WINDOW_X + x, 0.75 + (i % 3) * 0.12, -3.05]}><planeGeometry args={[0.3, 0.6 + (i % 3) * 0.25]} /><meshBasicMaterial color={lerpC('#1a2236', '#7d8ca3', shot === 'window' ? sunrise : day)} toneMapped={false} /></mesh>)}
      {/* room shell */}
      <mesh position={[0, 2.8, -0.1]}><boxGeometry args={[4.6, 0.05, 4.2]} /><meshStandardMaterial color="#eef1f6" /></mesh>
      <BackWall color={wall} breathe={0} />
      <mesh position={[-2.25, 1.4, -0.1]}><boxGeometry args={[0.1, 2.8, 4.0]} /><meshStandardMaterial color={wall} roughness={0.9} /></mesh>
      <mesh position={[2.25, 1.4, -0.1]}><boxGeometry args={[0.1, 2.8, 4.0]} /><meshStandardMaterial color={wall} roughness={0.9} /></mesh>
      {Array.from({ length: 11 }, (_, i) => <mesh key={i} position={[-2.0 + i * 0.4, -0.01, -0.1]} receiveShadow><boxGeometry args={[0.39, 0.02, 4.0]} /><meshStandardMaterial color={i % 2 ? '#b98c5f' : '#a97c52'} /></mesh>)}
      <mesh position={[0.1, 0.005, -0.3]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.9, 40]} /><meshStandardMaterial color="#e8b04a" /></mesh>
      {[[0, 0.52, 1.2, 0.05], [0, -0.52, 1.2, 0.05], [0.57, 0, 0.05, 1.08], [-0.57, 0, 0.05, 1.08], [0, 0, 0.03, 1.0]].map(([x, y, w, h], i) => (
        <mesh key={i} position={[WINDOW_X + x, 1.45 + y, -1.97]}><boxGeometry args={[w, h, 0.06]} /><meshStandardMaterial color="#f7f5f0" /></mesh>
      ))}
      <mesh position={[1.6, 1.65, -1.96]}><planeGeometry args={[0.5, 0.7]} /><meshStandardMaterial color="#ff8a3d" /></mesh>
      <mesh position={[1.6, 1.65, -1.95]}><circleGeometry args={[0.15, 24]} /><meshStandardMaterial color="#fff3dd" /></mesh>
      <Clock hour={clockAt(T, t)} melt={0} />
      {/* bed (head against the back wall) */}
      <group position={BED as [number, number, number]}>
        <mesh position={[0, 0.2, 0]}><boxGeometry args={[1.0, 0.3, 2.0]} /><meshStandardMaterial color="#8a5a3a" /></mesh>
        <mesh position={[0, 0.41, 0]}><boxGeometry args={[0.96, 0.14, 1.96]} /><meshStandardMaterial color="#f7f5f0" /></mesh>
        <mesh position={[0, 0.6, -1.0]}><boxGeometry args={[1.0, 0.8, 0.08]} /><meshStandardMaterial color="#7a4d31" /></mesh>
        <mesh position={[0, 0.54, -0.82]} scale={[0.38, 0.09, 0.16]}><sphereGeometry args={[1, 16, 10]} /><meshStandardMaterial color="#ffffff" /></mesh>
        {/* blanket over the legs */}
        <mesh position={[0, 0.53, 0.25]}><boxGeometry args={[0.98, 0.1, 1.4]} /><meshStandardMaterial color="#21b3a0" /></mesh>
      </group>
      {/* nightstand + lamp */}
      <group position={NIGHTSTAND as [number, number, number]}>
        <mesh position={[0, 0.27, 0]}><boxGeometry args={[0.4, 0.54, 0.36]} /><meshStandardMaterial color="#c99a68" /></mesh>
      </group>
      {/* desk, laptop, lamp, mugs (kept out of the fridge shot) */}
      <group position={DESK as [number, number, number]} visible={shot !== 'fridge'}>
        <mesh position={[0, 0.75, 0]}><boxGeometry args={[1.3, 0.05, 0.6]} /><meshStandardMaterial color="#f2efe8" /></mesh>
        <mesh position={[0, 0.42, 0.29]}><boxGeometry args={[1.26, 0.62, 0.02]} /><meshStandardMaterial color="#e2ded6" /></mesh>
        {[[-0.62, -0.27], [0.62, -0.27], [-0.62, 0.27], [0.62, 0.27]].map(([x, z], i) => <mesh key={i} position={[x, 0.37, z]}><boxGeometry args={[0.04, 0.74, 0.04]} /><meshStandardMaterial color="#c9ccd1" /></mesh>)}
        {/* laptop: screen faces Jake (-z), its glow lights his face */}
        <group position={[0.05, 0.78, -0.08]}>
          <mesh position={[0, 0.01, -0.07]}><boxGeometry args={[0.36, 0.02, 0.24]} /><meshStandardMaterial color="#c9ccd1" metalness={0.5} roughness={0.3} /></mesh>
          <group position={[0, 0.01, 0.05]} rotation={[0.25, 0, 0]}>
            <mesh position={[0, 0.12, 0]}><boxGeometry args={[0.36, 0.24, 0.012]} /><meshStandardMaterial color="#b9bdc4" metalness={0.5} roughness={0.3} /></mesh>
            <mesh position={[0, 0.12, -0.007]} rotation={[0, Math.PI, 0]}><planeGeometry args={[0.33, 0.21]} /><meshBasicMaterial color="#9fc0ff" toneMapped={false} /></mesh>
          </group>
          <pointLight position={[0, 0.25, -0.25]} intensity={0.45 * (1 - 0.6 * day)} distance={1.0} color="#bcd4ff" />
        </group>
        <group position={[0.5, 0.78, -0.15]}>
          <mesh position={[0, 0.01, 0]}><cylinderGeometry args={[0.07, 0.08, 0.02, 16]} /><meshStandardMaterial color="#26313d" /></mesh>
          <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.01, 0.01, 0.4, 6]} /><meshStandardMaterial color="#26313d" /></mesh>
          <mesh position={[-0.05, 0.4, 0]} rotation={[0, 0, 0.5]}><coneGeometry args={[0.1, 0.14, 16, 1, true]} /><meshStandardMaterial color="#ffd21f" side={THREE.DoubleSide} emissive="#ffd21f" emissiveIntensity={0.3} /></mesh>
          <pointLight position={[-0.1, 0.3, 0.1]} intensity={3.5 * (1 - 0.7 * day)} distance={3.5} color="#ffd9a0" />
        </group>
        {[[0.32, 0.12], [0.42, 0.2], [0.25, 0.22], [0.55, 0.08], [-0.33, 0.18], [-0.25, 0.05], [0.38, -0.02]].slice(0, mugs).map(([x, z], i) => <Mug key={i} at={[x, 0.775, z]} color={['#ff8a3d', '#3fb6ff', '#ffffff', '#21b3a0', '#e2453c', '#f0b429', '#8e5bd1'][i]} />)}
        {/* reaction-test ball */}
        {shot === 'test' && <mesh position={[0.12, ballY, 0.18]}><sphereGeometry args={[0.05, 16, 12]} /><meshStandardMaterial color="#9be22d" emissive="#5a9a10" emissiveIntensity={0.3} /></mesh>}
      </group>
      {/* desk chair behind Jake */}
      <group position={[JAKE_DESK[0], 0, JAKE_DESK[2] - 0.12]}>
        <mesh position={[0, 0.42, 0.05]}><boxGeometry args={[0.46, 0.07, 0.44]} /><meshStandardMaterial color="#3b4a63" /></mesh>
        <mesh position={[0, 0.75, -0.17]}><boxGeometry args={[0.46, 0.6, 0.05]} /><meshStandardMaterial color="#3b4a63" /></mesh>
        <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.03, 0.03, 0.42, 8]} /><meshStandardMaterial color="#8a9099" /></mesh>
      </group>
      {/* tall fridge, hollow, door hinged on the right; open (lit, full of food) in the fridge shot */}
      <group position={FRIDGE as [number, number, number]}>
        {(() => {
          const W = 0.7, H = 1.7, D = 0.62, th = 0.04, open = shot === 'fridge';
          const body = '#e9edf2';
          return (
            <>
              <mesh position={[0, H / 2, -D / 2 + th / 2]}><boxGeometry args={[W, H, th]} /><meshStandardMaterial color={open ? '#f4f1e6' : body} /></mesh>
              {[-1, 1].map((sd) => <mesh key={sd} position={[sd * (W / 2 - th / 2), H / 2, 0]}><boxGeometry args={[th, H, D]} /><meshStandardMaterial color={body} /></mesh>)}
              <mesh position={[0, H - th / 2, 0]}><boxGeometry args={[W, th, D]} /><meshStandardMaterial color={body} /></mesh>
              <mesh position={[0, th / 2, 0]}><boxGeometry args={[W, th, D]} /><meshStandardMaterial color={body} /></mesh>
              {open ? (
                <>
                  {/* inside: glowing back, glass shelves, food */}
                  <mesh position={[0, H / 2, -D / 2 + th + 0.002]}><planeGeometry args={[W - 2 * th, H - 2 * th]} /><meshBasicMaterial color="#fffaf0" toneMapped={false} /></mesh>
                  {[0.42, 0.82, 1.22].map((y) => <mesh key={y} position={[0, y, 0]}><boxGeometry args={[W - 2 * th, 0.015, D - 0.04]} /><meshStandardMaterial color="#cfe8ff" transparent opacity={0.8} /></mesh>)}
                  {/* milk carton */}
                  <group position={[-0.18, 0.43, 0.05]}><mesh position={[0, 0.12, 0]}><boxGeometry args={[0.1, 0.24, 0.1]} /><meshStandardMaterial color="#ffffff" /></mesh><mesh position={[0, 0.17, 0.051]}><planeGeometry args={[0.1, 0.06]} /><meshStandardMaterial color="#3f7fe0" /></mesh></group>
                  {/* soda bottles */}
                  {[0.0, 0.1].map((x) => <group key={x} position={[x, 0.43, 0.05]}><mesh position={[0, 0.11, 0]}><cylinderGeometry args={[0.035, 0.035, 0.22, 12]} /><meshStandardMaterial color="#2fa84f" /></mesh><mesh position={[0, 0.25, 0]}><cylinderGeometry args={[0.015, 0.03, 0.06, 10]} /><meshStandardMaterial color="#2fa84f" /></mesh></group>)}
                  {/* cheese wedge, apples */}
                  <mesh position={[-0.13, 0.88, 0.05]} rotation={[0, 0.4, 0]}><cylinderGeometry args={[0.1, 0.1, 0.08, 3]} /><meshStandardMaterial color="#ffcc33" /></mesh>
                  {[[0.08, 0.05], [0.17, 0.0], [0.13, 0.12]].map(([x, z], k) => <mesh key={k} position={[x, 0.88, z]}><sphereGeometry args={[0.045, 12, 10]} /><meshStandardMaterial color="#e23b2e" /></mesh>)}
                  {/* leftover pizza box + juice */}
                  <mesh position={[-0.05, 1.27, 0.0]}><boxGeometry args={[0.36, 0.06, 0.36]} /><meshStandardMaterial color="#d9a066" /></mesh>
                  <mesh position={[0.2, 1.36, 0.05]}><boxGeometry args={[0.09, 0.2, 0.09]} /><meshStandardMaterial color="#ff8a1f" /></mesh>
                  {/* door swung open toward the camera, its inside shelves facing us */}
                  <group position={[W / 2, 0, D / 2]} rotation={[0, 1.35, 0]}>
                    <mesh position={[-W / 2, H / 2, -0.03]}><boxGeometry args={[W, H, 0.06]} /><meshStandardMaterial color={body} /></mesh>
                    <mesh position={[-W / 2, H / 2, -0.061]} rotation={[0, Math.PI, 0]}><planeGeometry args={[W - 0.08, H - 0.1]} /><meshStandardMaterial color="#f4f1e6" /></mesh>
                    {[0.5, 0.95].map((y) => <mesh key={y} position={[-W / 2, y, -0.1]}><boxGeometry args={[W - 0.12, 0.1, 0.06]} /><meshStandardMaterial color="#d6e6f5" transparent opacity={0.85} /></mesh>)}
                  </group>
                  <pointLight position={[0, 0.9, 0.35]} intensity={3} distance={2.2} color="#fff6dc" />
                </>
              ) : (
                <>
                  <mesh position={[0, H / 2, D / 2 - th / 2]}><boxGeometry args={[W, H, th]} /><meshStandardMaterial color={body} /></mesh>
                  <mesh position={[W / 2 - 0.07, H * 0.62, D / 2 + 0.02]}><boxGeometry args={[0.03, 0.3, 0.03]} /><meshStandardMaterial color="#8a9099" /></mesh>
                </>
              )}
            </>
          );
        })()}
      </group>
      {/* Jake */}
      <group position={jake.at as [number, number, number]} rotation={[0, jake.rotY ?? 0, 0]}>
        <Jake {...jake} />
      </group>
      {/* Hoot, the narrator */}
      <TalkingHoot at={perch} cam={cam} t={t} talk={talk} scale={0.2} wave={t >= final + 3.2 ? 1 : 0} />
      <pointLight position={[0, 2.4, 0.5]} intensity={2 + 3 * day} distance={6} color="#fff3dd" />
    </group>
  );
};

export const AwakeScene: React.FC<{ timings: Timings; t: number }> = ({ timings, t }) => {
  const T = useMemo(() => buildAwakeTimeline(timings), [timings]);
  const { fps } = useVideoConfig();
  const pose = cameraPose(timings, T, t);
  const shot = timings.beats.reduce((s, b) => (t >= b.start ? b.shot : s), timings.beats[0].shot);
  const talk = timings.mouth?.[Math.round(t * fps)] ?? 0;
  const day = shot === 'window' ? 0.6 : daylightAt(T, t);
  return (
    <>
      <CameraRig pose={pose} />
      <GradSky at={pose.pos} top="#2a6fd0" hor="#bfe0ff" bottom="#e6eef5" />
      <PlaceLights target={pose.target} fog="#cfe3f7" near={60} far={300} sun={0.4 + 1.3 * day} hemi={['#ffffff', '#9fb0c0', 0.7 + 0.7 * day]} />
      <Room T={T} t={t} shot={shot} cam={pose.pos} talk={talk} />
    </>
  );
};
