import React, { useMemo } from 'react';
import * as THREE from 'three';
import { clamp01, easeInOutSine, easeOutCubic, progress, rng } from '../../lib/anim';
import type { Timings } from '../../types';
import { Car, CameraRig } from '../../world/Props';
import {
  CloudStream, Fields, GradSky, House, Jet, Palm, Person, PlaceLights, Puff,
} from './assets';
import {
  AUSTIN, buildLearjetTimeline, cameraPose, COCKPIT, CRASH, CRUISE, cruiseJet, DIVE, ELEUTHERA, EVEREST, geo, iceAt,
  MAP, placeAt, realAltitude, SECTION, TOWN, vsAt, type LearjetTimeline,
} from './timeline';

const add = (a: number[], b: number[]): [number, number, number] => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

/** A thin rod between two points. */
const Rod: React.FC<{ a: number[]; b: number[]; r?: number; color: string; emissive?: number; opacity?: number }> = ({ a, b, r = 0.05, color, emissive = 0, opacity = 1 }) => {
  const va = new THREE.Vector3(...(a as [number, number, number])), vb = new THREE.Vector3(...(b as [number, number, number]));
  const len = va.distanceTo(vb);
  if (len < 0.001) return null;
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
  return (
    <mesh position={va.clone().add(vb).multiplyScalar(0.5)} quaternion={q}>
      <cylinderGeometry args={[r, r, len, 6]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissive} transparent={opacity < 1} opacity={opacity} />
    </mesh>
  );
};

/* ------------------------------------------------------------------ sky places */

/** Hook: the jet held nose-down while clouds rush up past it and the ground slowly gets closer. */
const DiveHook: React.FC<{ T: LearjetTimeline; t: number }> = ({ T, t }) => {
  const deckY = DIVE[1] + 9 - (T.route - 0.3 - t) * 9; // the cloud deck rises to meet the camera at the end
  const roll = 0.18 * Math.sin(t * 1.3);
  return (
    <>
      <group position={DIVE as [number, number, number]} rotation={[0, 0, -Math.PI / 2 + 0.08 * Math.sin(t * 2.1)]}>
        <group rotation={[roll, 0, 0]}><Jet t={t} vapour={0.4} /></group>
      </group>
      <CloudStream center={DIVE} size={[80, 70, 80]} v={[0, 32, 0]} t={t} n={26} clear={14} scale={1.6} seed={21} />
      <CloudStream center={DIVE} size={[40, 50, 40]} v={[0, 60, 0]} t={t} n={18} clear={9} scale={0.45} seed={22} opacity={0.75} />
      {/* cloud deck with gaps, then the fields far below */}
      {useMemo(() => {
        const r = rng(31);
        return Array.from({ length: 70 }, () => [(r() - 0.5) * 140, (r() - 0.5) * 3, (r() - 0.5) * 140, 2.5 + r() * 3, Math.floor(r() * 99)]);
      }, []).map(([x, y, z, s, sd], i) => (
        <Puff key={i} at={[DIVE[0] + x, deckY + y, DIVE[2] + z]} s={s} seed={sd} color="#f4f6f8" />
      ))}
      <Fields at={[DIVE[0], deckY - 55, DIVE[2]]} size={500} n={40} />
    </>
  );
};

/** Level flight above a sea of clouds; storm towers ahead; then into the cloud tops. */
const Cruise: React.FC<{ T: LearjetTimeline; t: number }> = ({ T, t }) => {
  const j = cruiseJet(T, t);
  const deck = useMemo(() => {
    const r = rng(41);
    return Array.from({ length: 170 }, () => [r() * 340 - 40, -r() * 2 - 1, (r() - 0.5) * 140, 3 + r() * 4, Math.floor(r() * 999)]);
  }, []);
  const storms = useMemo(() => {
    const r = rng(43);
    return Array.from({ length: 5 }, (_, i) => ({ x: 40 + i * 32 + r() * 10, z: -22 - r() * 30, h: 10 + r() * 8, sd: i }));
  }, []);
  const inCloud = t >= T.ice;
  const flash = (x: number) => {
    const k = Math.floor(t * 3 + x);
    return k % 5 === 0 && (t * 3 + x) % 1 < 0.25 ? 1 : 0;
  };
  return (
    <>
      <group position={j.pos} rotation={[j.roll, 0, j.pitch]}>
        <Jet t={t} ice={iceAt(T, t)} />
      </group>
      {deck.map(([x, y, z, s, sd], i) => (
        <Puff key={i} at={[CRUISE[0] + x, y, CRUISE[2] + z]} s={s} seed={sd} color={t > T.storms ? '#e4e8ec' : '#ffffff'} />
      ))}
      {storms.map((s) => (
        <group key={s.sd} position={[CRUISE[0] + s.x, 0, CRUISE[2] + s.z]}>
          {[0, 1, 2, 3, 4].map((k) => (
            <Puff key={k} at={[Math.sin(k * 1.7) * 2, k * (s.h / 5) - 2, Math.cos(k * 2.3) * 1.5]} s={4.5 - k * 0.45} seed={s.sd * 10 + k} color="#848d97" />
          ))}
          {/* anvil top */}
          <Puff at={[2, s.h, 0]} s={6} seed={s.sd + 77} color="#8a939c" />
          {/* lightning flicker inside the cloud */}
          <pointLight position={[0, s.h * 0.4, 3]} intensity={flash(s.sd) * 400} distance={40} color="#cfe0ff" />
          {flash(s.sd) > 0 && (
            <mesh position={[0, s.h * 0.4, 4]}><icosahedronGeometry args={[2.5, 0]} /><meshBasicMaterial color="#e8f0ff" transparent opacity={0.5} /></mesh>
          )}
        </group>
      ))}
      {/* inside the cloud tops: grey wisps rushing past the wing */}
      {inCloud && (
        <CloudStream center={j.pos} size={[50, 10, 30]} v={[-40, 0, 0]} t={t} n={34} clear={3.2} scale={0.6} seed={45} color="#c4ccd3" opacity={0.85} />
      )}
      {inCloud && <IceSpecks center={j.pos} t={t} />}
    </>
  );
};

/** Tiny droplets streaking toward the wing (supercooled rain). */
const IceSpecks: React.FC<{ center: number[]; t: number }> = ({ center, t }) => {
  const pts = useMemo(() => {
    const r = rng(51);
    return Array.from({ length: 50 }, () => [r() * 12, (r() - 0.5) * 2.5, r() * 4]);
  }, []);
  return (
    <>
      {pts.map(([x, y, z], i) => {
        const px = 6 - ((x + t * 18) % 12);
        return (
          <mesh key={i} position={[center[0] + px, center[1] + y, center[2] + z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.008, 0.008, 0.35, 4]} />
            <meshBasicMaterial color="#e8f6ff" transparent opacity={0.7} />
          </mesh>
        );
      })}
    </>
  );
};

/** Steep dive: stress glow, vapour, clouds streaking past at an angle. Also used frozen for the open question. */
const DiveSide: React.FC<{ t: number; frozen: boolean }> = ({ t, frozen }) => {
  const pitch = -0.95;
  const d = [Math.cos(pitch), Math.sin(pitch), 0];
  const speed = frozen ? 1.2 : 45;
  return (
    <>
      <group position={DIVE as [number, number, number]} rotation={[0, 0, pitch]}>
        <group rotation={[frozen ? 0.1 : 0.12 * Math.sin(t * 6), 0, 0]}>
          <Jet t={t} stress={frozen ? 0 : 1} vapour={frozen ? 0 : 1} />
        </group>
      </group>
      <CloudStream center={DIVE} size={[70, 70, 50]} v={[-d[0] * speed, -d[1] * speed, 0]} t={t} n={60} clear={5} scale={1.4} seed={61} color="#b9c2ca" />
    </>
  );
};

/* ------------------------------------------------------------------ map */

const LAND: number[][] = [
  [-101, 37], [-74, 37], [-75.5, 35.2], [-76.5, 34.7], [-78, 33.9], [-79.2, 33.2], [-80.4, 32.4], [-81.2, 31.5], [-81.4, 30.4], [-81.2, 29.6],
  [-80.6, 28.5], [-80.6, 28.0], [-80.1, 27.0], [-80.05, 26.0], [-80.4, 25.2], [-81.1, 25.1], [-81.7, 25.9], [-82.2, 26.7], [-82.7, 27.7],
  [-82.8, 28.6], [-83.6, 29.9], [-84.4, 30.0], [-85.4, 29.7], [-86.5, 30.4], [-88.0, 30.4], [-89.4, 30.2], [-89.4, 29.2], [-90.5, 29.1],
  [-91.5, 29.5], [-93.5, 29.7], [-94.8, 29.3], [-96.5, 28.3], [-97.3, 27.5], [-97.4, 26.0], [-97.6, 24.5], [-97.7, 21.0], [-101, 21.0],
];
const CUBA: number[][] = [[-85, 21.9], [-84, 22.7], [-82, 23.1], [-80, 23.1], [-77.5, 21.8], [-75.6, 21.1], [-74.2, 20.2], [-77.0, 19.9], [-78.5, 21.0], [-81, 21.9], [-83, 21.7]];
const ISLANDS: number[][] = [[-76.3, 25.2, 0.25, 0.9, 0.5], [-77.9, 24.3, 0.55, 0.9, 0.2], [-78.4, 26.6, 0.9, 0.22, 0.15], [-77.2, 26.4, 0.3, 0.6, -0.4], [-75.8, 24.2, 0.2, 0.7, 0.4]];

const landGeo = (pts: number[][]) => {
  const s = new THREE.Shape(pts.map(([lon, lat]) => new THREE.Vector2(lon + 87, lat - 27)));
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.25, bevelEnabled: false });
  g.rotateX(-Math.PI / 2);
  return g;
};

const MapPlace: React.FC<{ T: LearjetTimeline; t: number }> = ({ T, t }) => {
  const land = useMemo(() => landGeo(LAND), []);
  const cuba = useMemo(() => landGeo(CUBA), []);
  const a = geo(AUSTIN[0], AUSTIN[1], 0.4), b = geo(ELEUTHERA[0], ELEUTHERA[1], 0.4);
  const p = easeInOutSine(progress(t, T.route + 1.2, T.routeE - 0.2)) * 0.62; // jet icon moves along the planned route
  const j = [a[0] + (b[0] - a[0]) * p, 0.9, a[2] + (b[2] - a[2]) * p];
  const heading = Math.atan2(-(b[2] - a[2]), b[0] - a[0]);
  const dashes = 40;
  const pin = (at: number[], color: string, k: number) => (
    <group position={at as [number, number, number]} scale={easeOutCubic(clamp01(k))}>
      <mesh position={[0, 0.6, 0]}><sphereGeometry args={[0.32, 12, 12]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} /></mesh>
      <mesh position={[0, 0.2, 0]}><coneGeometry args={[0.18, 0.5, 10]} /><meshStandardMaterial color={color} /></mesh>
    </group>
  );
  return (
    <group>
      <mesh position={[MAP[0], -0.02, MAP[2]]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 60]} />
        <meshStandardMaterial color="#1b4a76" roughness={0.9} />
      </mesh>
      <group position={[MAP[0], 0, MAP[2]]}>
        <mesh geometry={land} receiveShadow castShadow><meshStandardMaterial color="#6f9e55" flatShading /></mesh>
        <mesh geometry={cuba}><meshStandardMaterial color="#7aa35e" flatShading /></mesh>
      </group>
      {ISLANDS.map(([lon, lat, sx, sz, r], i) => (
        <mesh key={i} position={geo(lon, lat, 0.08)} rotation={[0, r, 0]} scale={[sx, 0.16, sz]}>
          <cylinderGeometry args={[1, 1, 1, 8]} />
          <meshStandardMaterial color="#d9c98c" flatShading />
        </mesh>
      ))}
      {/* planned route, dashed */}
      {Array.from({ length: dashes }, (_, i) => {
        const u0 = i / dashes, u1 = (i + 0.5) / dashes;
        return <Rod key={i} a={[a[0] + (b[0] - a[0]) * u0, 0.4, a[2] + (b[2] - a[2]) * u0]} b={[a[0] + (b[0] - a[0]) * u1, 0.4, a[2] + (b[2] - a[2]) * u1]} r={0.06} color="#ffffff" opacity={0.75} />;
      })}
      {/* flown part, solid */}
      <Rod a={a} b={[j[0], 0.42, j[2]]} r={0.11} color="#ffd21f" emissive={0.5} />
      {pin(a, '#ffffff', (t - T.route - 0.3) / 0.4)}
      {pin(b, '#3fb6ff', (t - T.wordTime('route', 'bahamas', T.route + 4)) / 0.4)}
      <group position={j as [number, number, number]} rotation={[0, heading, 0]} scale={0.42}>
        <Jet t={t} />
      </group>
    </group>
  );
};

/* ------------------------------------------------------------------ wing cross-section */

const AIRFOIL = (() => {
  const c = 7, m = 0.04, pp = 0.4, th = 0.13;
  const up: number[][] = [], lo: number[][] = [];
  for (let i = 0; i <= 40; i++) {
    const u = (1 - Math.cos((i / 40) * Math.PI)) / 2;
    const yt = 5 * th * (0.2969 * Math.sqrt(u) - 0.126 * u - 0.3516 * u * u + 0.2843 * u ** 3 - 0.1036 * u ** 4);
    const yc = u < pp ? (m / pp ** 2) * (2 * pp * u - u * u) : (m / (1 - pp) ** 2) * (1 - 2 * pp + 2 * pp * u - u * u);
    up.push([(u - 0.5) * c, (yc + yt) * c]);
    lo.push([(u - 0.5) * c, (yc - yt) * c]);
  }
  return [...up, ...lo.reverse().slice(1)];
})();

const SectionPlace: React.FC<{ T: LearjetTimeline; t: number }> = ({ T, t }) => {
  const g = useMemo(() => {
    const s = new THREE.Shape(AIRFOIL.map(([x, y]) => new THREE.Vector2(x, y)));
    const e = new THREE.ExtrudeGeometry(s, { depth: 1.6, bevelEnabled: false });
    e.translate(0, 0, -0.8);
    return e;
  }, []);
  const ice = easeOutCubic(progress(t, T.sectionShape - 0.6, T.sectionShape + 0.6));
  const lines = [-2.4, -1.6, -0.9, -0.45, 0.45, 0.9, 1.6, 2.4];
  const up = (x: number) => 1.05 * Math.exp(-(((x + 1.0) / 1.9) ** 2));
  const lo = (x: number) => -0.32 * Math.exp(-(((x + 1.4) / 1.6) ** 2));
  const yAt = (y0: number, x: number) => {
    let y = y0 + (y0 > 0 ? up(x) * Math.exp(-y0 / 2.2) * 1.15 : lo(x) * Math.exp(y0 / 2.2) * 1.2);
    // downwash behind the wing = lift; it fades as the ice spoils the flow
    y -= 0.35 * (1 - 0.7 * ice) * clamp01((x - 2) / 4) * Math.exp(-Math.abs(y0) / 3);
    if (y0 > 0 && y0 < 2) {
      const k = ice * clamp01((x + 2.2) / 2.5) * (1 - y0 / 2);
      y += k * (0.35 + 0.22 * Math.sin(4.5 * x - 9 * t + y0 * 3));
    }
    return y;
  };
  const curves = lines.map((y0) => {
    const pts = Array.from({ length: 64 }, (_, i) => {
      const x = -9 + (18 * i) / 63;
      return new THREE.Vector3(x, yAt(y0, x), 0.9);
    });
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 96, 0.035, 5, false);
  });
  const liftL = 2.6 * (1 - 0.55 * ice), dragL = 0.7 + 1.9 * ice;
  return (
    <group position={SECTION as [number, number, number]} scale={0.62}>
      <mesh geometry={g}><meshStandardMaterial color="#e9ecef" flatShading /></mesh>
      <mesh position={[0, 0, 0.81]}>
        <shapeGeometry args={[new THREE.Shape(AIRFOIL.map(([x, y]) => new THREE.Vector2(x, y)))]} />
        <meshStandardMaterial color="#b9c0c8" />
      </mesh>
      {/* ice horn on the leading edge */}
      {ice > 0 && (
        <mesh position={[-3.45, 0.32, 0.4]} rotation={[0, 0, 0.6]} scale={[0.55 * ice, 0.3 * ice, 1.0]}>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#cdeeff" transparent opacity={0.85} emissive="#9fdcff" emissiveIntensity={0.4} flatShading />
        </mesh>
      )}
      {curves.map((cg, i) => (
        <mesh key={i} geometry={cg}><meshBasicMaterial color={lines[i] > 0 && lines[i] < 2 && ice > 0.3 ? '#ff8a6a' : '#8fd3ff'} /></mesh>
      ))}
      {/* flow dots */}
      {lines.flatMap((y0, li) => Array.from({ length: 6 }, (_, k) => {
        const u = ((k / 6 + t * 0.22 + li * 0.07) % 1);
        const x = -9 + 18 * u;
        return (
          <mesh key={`${li}-${k}`} position={[x, yAt(y0, x), 0.95]}>
            <sphereGeometry args={[0.09, 8, 8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        );
      }))}
      {/* lift (up) and drag (back) arrows */}
      <group position={[-0.6, 1.2, 1.0]}>
        <Rod a={[0, 0, 0]} b={[0, liftL, 0]} r={0.12} color="#ffd21f" emissive={0.4} />
        <mesh position={[0, liftL + 0.25, 0]}><coneGeometry args={[0.3, 0.55, 10]} /><meshStandardMaterial color="#ffd21f" emissive="#ffd21f" emissiveIntensity={0.4} /></mesh>
      </group>
      <group position={[3.0, 0.15, 1.0]}>
        <Rod a={[0, 0, 0]} b={[dragL, 0, 0]} r={0.12} color="#ff5a4a" emissive={0.4} />
        <mesh position={[dragL + 0.25, 0, 0]} rotation={[0, 0, -Math.PI / 2]}><coneGeometry args={[0.3, 0.55, 10]} /><meshStandardMaterial color="#ff5a4a" emissive="#ff5a4a" emissiveIntensity={0.4} /></mesh>
      </group>
    </group>
  );
};

/* ------------------------------------------------------------------ cockpit */

const Dial: React.FC<{ at: number[]; r: number; ticks: number; from?: number; span?: number }> = ({ at, r, ticks, from = 0, span = Math.PI * 2 }) => (
  <group position={at as [number, number, number]}>
    <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[r + 0.03, r + 0.03, 0.04, 32]} /><meshStandardMaterial color="#555b63" metalness={0.4} /></mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.01]}><cylinderGeometry args={[r, r, 0.04, 32]} /><meshStandardMaterial color="#0d0f12" /></mesh>
    {Array.from({ length: ticks }, (_, i) => {
      const a = from + (span * i) / (span >= Math.PI * 2 ? ticks : ticks - 1);
      return (
        <mesh key={i} position={[Math.cos(a) * r * 0.85, Math.sin(a) * r * 0.85, 0.035]} rotation={[0, 0, a]}>
          <boxGeometry args={[r * 0.18, 0.012, 0.005]} />
          <meshBasicMaterial color="#e8e8e8" />
        </mesh>
      );
    })}
  </group>
);

const Needle: React.FC<{ at: number[]; len: number; angle: number; w?: number; color?: string }> = ({ at, len, angle, w = 0.02, color = '#ffffff' }) => (
  <group position={[at[0], at[1], at[2] + 0.045]} rotation={[0, 0, angle]}>
    <mesh position={[len / 2, 0, 0]}><boxGeometry args={[len, w, 0.01]} /><meshBasicMaterial color={color} /></mesh>
  </group>
);

const CockpitPlace: React.FC<{ T: LearjetTimeline; t: number }> = ({ T, t }) => {
  const vs = vsAt(T, t);
  const alt = realAltitude(T, t);
  const warn = t > T.radio + 0.9 && Math.floor(t * 4) % 2 === 0;
  // vertical speed: zero points left (9 o'clock), the needle swings down as the jet descends; pinned past 6,000
  const vsK = Math.min(1, -vs / 6000);
  const vsAng = Math.PI + vsK * 0.92 * Math.PI * 0.95 + (vsK >= 1 ? 0.03 * Math.sin(t * 60) : 0);
  // airspeed tape: scrolls as the dive gets faster; the red-and-white "barber pole" (max speed) slides down to the pointer
  const spd = clamp01(-vs / 20000);
  const scroll = t * 0.04 + spd * 1.6;
  const bp = 0.62 - 0.62 * easeOutCubic(progress(t, T.overspeedWord - 1.0, T.overspeedWord + 0.15));
  const P = COCKPIT;
  const tapeX = P[0] - 0.62;
  const outsideV = -vs / 1500;
  return (
    <group>
      {/* panel, glareshield, window posts */}
      <mesh position={add(P, [0, -0.15, -0.05])}><boxGeometry args={[2.6, 1.3, 0.1]} /><meshStandardMaterial color="#2b3036" flatShading /></mesh>
      <mesh position={add(P, [0, 0.55, 0.12])}><boxGeometry args={[2.8, 0.1, 0.45]} /><meshStandardMaterial color="#1c1f23" /></mesh>
      {[-1.15, 0, 1.15].map((x) => (
        <mesh key={x} position={add(P, [x, 1.15, -0.3])} rotation={[0, 0, x * 0.12]}><boxGeometry args={[0.12, 1.2, 0.1]} /><meshStandardMaterial color="#22262b" /></mesh>
      ))}
      <mesh position={add(P, [0, 1.72, -0.3])}><boxGeometry args={[2.8, 0.12, 0.1]} /><meshStandardMaterial color="#22262b" /></mesh>
      {/* outside: grey cloud, wisps streaming (up once the jet dives) */}
      <mesh position={add(P, [0, 1.1, -3])}><planeGeometry args={[8, 3]} /><meshBasicMaterial color="#9aa4ad" /></mesh>
      {Array.from({ length: 14 }, (_, i) => {
        const r = rng(i + 3);
        const x = (r() - 0.5) * 2.4;
        const yy = 0.6 + ((r() * 1.1 + t * (0.15 + outsideV)) % 1.1);
        return <mesh key={i} position={add(P, [x, yy, -1.2])}><boxGeometry args={[0.02, 0.18 + outsideV * 0.1, 0.01]} /><meshBasicMaterial color="#e6ebef" transparent opacity={0.6} /></mesh>;
      })}
      {/* master warning */}
      <mesh position={add(P, [0, 0.38, 0.02])}><boxGeometry args={[0.32, 0.09, 0.03]} /><meshStandardMaterial color={warn ? '#ff2d22' : '#4a1512'} emissive="#ff2d22" emissiveIntensity={warn ? 2.2 : 0} /></mesh>
      {warn && <pointLight position={add(P, [0, 0.4, 0.4])} intensity={1.2} distance={2.5} color="#ff3322" />}
      {/* vertical speed indicator */}
      <Dial at={add(P, [0, -0.05, 0.01])} r={0.28} ticks={11} from={Math.PI * 0.08} span={Math.PI * 1.84} />
      <Needle at={add(P, [0, -0.05, 0.01])} len={0.24} angle={vsAng} w={0.025} />
      {/* altimeter: the long needle turns once per 1,000 ft */}
      <Dial at={add(P, [0.62, -0.05, 0.01])} r={0.25} ticks={10} />
      <Needle at={add(P, [0.62, -0.05, 0.01])} len={0.21} angle={Math.PI / 2 - (alt / 1000) * Math.PI * 2} w={0.018} />
      <Needle at={add(P, [0.62, -0.05, 0.012])} len={0.13} angle={Math.PI / 2 - (alt / 10000) * Math.PI * 2} w={0.03} color="#cfd4da" />
      {/* airspeed tape */}
      <mesh position={[tapeX, P[1] - 0.05, P[2] + 0.02]}><boxGeometry args={[0.3, 0.95, 0.03]} /><meshStandardMaterial color="#0d0f12" /></mesh>
      {Array.from({ length: 14 }, (_, i) => {
        const y = ((i * 0.12 - scroll) % 1.68 + 1.68) % 1.68 - 0.84;
        if (Math.abs(y) > 0.44) return null;
        return <mesh key={i} position={[tapeX + 0.07, P[1] - 0.05 + y, P[2] + 0.04]}><boxGeometry args={[0.1, 0.012, 0.005]} /><meshBasicMaterial color="#e8e8e8" /></mesh>;
      })}
      {Array.from({ length: 12 }, (_, i) => {
        const y = bp + i * 0.07;
        if (y > 0.44) return null;
        return <mesh key={`b${i}`} position={[tapeX + 0.11, P[1] - 0.05 + y, P[2] + 0.045]}><boxGeometry args={[0.06, 0.07, 0.005]} /><meshBasicMaterial color={i % 2 ? '#ffffff' : '#ff2d22'} /></mesh>;
      })}
      <mesh position={[tapeX - 0.01, P[1] - 0.05, P[2] + 0.05]}><boxGeometry args={[0.26, 0.08, 0.01]} /><meshBasicMaterial color={bp < 0.06 ? '#ff2d22' : '#ffd21f'} /></mesh>
    </group>
  );
};

/* ------------------------------------------------------------------ Everest comparison */

const Mountain: React.FC<{ at: number[]; h: number; r: number; seed: number; snow?: number }> = ({ at, h, r, seed, snow = 0.62 }) => {
  const geo = useMemo(() => {
    const g = new THREE.ConeGeometry(r, h, 9, 5).toNonIndexed();
    const rr = rng(seed);
    const p = g.attributes.position;
    const jit = new Map<string, number[]>();
    for (let i = 0; i < p.count; i++) {
      const key = `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`;
      if (!jit.has(key)) jit.set(key, [(rr() - 0.5) * r * 0.07, (rr() - 0.5) * h * 0.03, (rr() - 0.5) * r * 0.07]);
      const j = jit.get(key)!;
      const top = p.getY(i) > h / 2 - 0.01;
      if (!top) p.setXYZ(i, p.getX(i) + j[0], p.getY(i) + j[1], p.getZ(i) + j[2]);
    }
    const col = new Float32Array(p.count * 3);
    const rock = new THREE.Color('#8f8577'), snowC = new THREE.Color('#f4f6f8');
    for (let f = 0; f < p.count; f += 3) {
      const cy = (p.getY(f) + p.getY(f + 1) + p.getY(f + 2)) / 3 / h + 0.5;
      const c = cy > snow ? snowC : rock;
      for (let k = 0; k < 3; k++) c.toArray(col, (f + k) * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    return g;
  }, [h, r, seed, snow]);
  return <mesh geometry={geo} position={[at[0], at[1] + h / 2, at[2]]} castShadow receiveShadow><meshStandardMaterial vertexColors flatShading /></mesh>;
};

const Skydiver: React.FC<{ at: number[]; t: number }> = ({ at, t }) => (
  <group position={at as [number, number, number]} rotation={[Math.PI / 2 - 0.2, 0, 0.1 * Math.sin(t * 3)]} scale={1.3}>
    <mesh position={[0, 0.35, 0]}><boxGeometry args={[0.45, 0.7, 0.25]} /><meshStandardMaterial color="#ff7a1f" /></mesh>
    <mesh position={[0, 0.85, 0]}><sphereGeometry args={[0.17, 10, 10]} /><meshStandardMaterial color="#ffd21f" /></mesh>
    {[-1, 1].map((s) => (
      <group key={s}>
        <mesh position={[s * 0.42, 0.6, 0]} rotation={[0, 0, s * 1.0]}><boxGeometry args={[0.12, 0.5, 0.12]} /><meshStandardMaterial color="#ff7a1f" /></mesh>
        <mesh position={[s * 0.2, -0.3, 0]} rotation={[0, 0, s * 0.35]}><boxGeometry args={[0.15, 0.7, 0.15]} /><meshStandardMaterial color="#2c3e66" /></mesh>
      </group>
    ))}
    <mesh position={[0, 0.35, -0.2]}><boxGeometry args={[0.35, 0.45, 0.15]} /><meshStandardMaterial color="#333" /></mesh>
  </group>
);

const EverestPlace: React.FC<{ T: LearjetTimeline; t: number }> = ({ T, t }) => {
  const E = EVEREST;
  const sky = t >= T.skydiver;
  // first beat: the jet's path draws from 35,250 ft down to 8,750 ft; second beat: a race with a skydiver
  const pJet = sky ? progress(t, T.skydiver + 0.2, T.skydiver + 2.6) : easeInOutSine(progress(t, T.everest + 0.4, T.everest + 3.6));
  const yJet = 35.25 - 26.5 * (sky ? pJet ** 1.2 : pJet);
  const ySky = 35.25 - 26.5 * (sky ? pJet ** 1.2 : 0) / 2.4;
  const jx = E[0] + 7.5, sx = E[0] + 4.5;
  return (
    <group>
      <mesh position={[E[0], 0, E[2]]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[600, 600]} /><meshStandardMaterial color="#7a9a5c" /></mesh>
      <Mountain at={[E[0] - 4, 0, E[2] - 8]} h={29.03} r={15} seed={7} />
      <Mountain at={[E[0] - 26, 0, E[2] - 18]} h={22} r={13} seed={9} snow={0.7} />
      <Mountain at={[E[0] + 18, 0, E[2] - 30]} h={18} r={12} seed={13} snow={0.72} />
      {/* altitude ruler (1 unit = 1,000 ft) */}
      <mesh position={[E[0] + 11, 18, E[2]]}><boxGeometry args={[0.18, 36, 0.18]} /><meshStandardMaterial color="#ffffff" /></mesh>
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} position={[E[0] + 11, i * 5, E[2]]}><boxGeometry args={[0.9, 0.12, 0.12]} /><meshStandardMaterial color="#ffffff" /></mesh>
      ))}
      {/* reference lines at the start and end altitudes, and the summit */}
      <Rod a={[E[0] - 2, 35.25, E[2] + 0.2]} b={[E[0] + 11, 35.25, E[2] + 0.2]} r={0.06} color="#ffffff" opacity={0.7} />
      <Rod a={[E[0] - 2, 8.75, E[2] + 0.2]} b={[E[0] + 11, 8.75, E[2] + 0.2]} r={0.06} color="#ff5a4a" opacity={0.8} />
      <Rod a={[E[0] - 4, 29.03, E[2] - 8]} b={[E[0] + 11, 29.03, E[2]]} r={0.05} color="#ffd21f" opacity={0.7} />
      {/* the jet's path */}
      <Rod a={[jx, 35.25, E[2] + 0.5]} b={[jx, yJet, E[2] + 0.5]} r={0.22} color="#ff3b2f" emissive={0.5} />
      <group position={[jx, yJet - 1.2, E[2] + 0.5]} rotation={[0, 0, -Math.PI / 2]} scale={0.55}><Jet t={t} /></group>
      {sky && (
        <>
          <Rod a={[sx, 35.25, E[2] + 0.5]} b={[sx, ySky, E[2] + 0.5]} r={0.16} color="#ff9a3c" emissive={0.4} />
          <Skydiver at={[sx, ySky - 0.6, E[2] + 0.5]} t={t} />
        </>
      )}
      {[[-30, 30, -40], [20, 33, -50], [-10, 31, -70]].map(([x, y, z], i) => (
        <Puff key={i} at={[E[0] + x, y, E[2] + z]} s={4} seed={i + 90} />
      ))}
    </group>
  );
};

/* ------------------------------------------------------------------ town (seen from a distance) */

const PASTEL = ['#f3e3c3', '#e9d5d1', '#d7e6e4', '#efe9d8', '#e3d9ef', '#f6efe1'];

const Town: React.FC<{ T: LearjetTimeline; t: number; dusk: boolean }> = ({ T, t, dusk }) => {
  const W = TOWN;
  const layout = useMemo(() => {
    const r = rng(71);
    const houses: { at: number[]; c: string; rot: number }[] = [];
    for (let i = 0; i < 6; i++) for (let j = 0; j < 9; j++) {
      houses.push({ at: [W[0] - 7 - i * 6.5 - r() * 0.8, 0, W[2] - 40 + j * 8.5 + r()], c: PASTEL[Math.floor(r() * PASTEL.length)], rot: (Math.floor(r() * 2) * Math.PI) / 2 });
    }
    const palms: number[][] = [];
    for (let k = 0; k < 40; k++) palms.push([W[0] - 4 - r() * 44, 0, W[2] - 45 + r() * 90, 5 + r() * 3]);
    for (let k = 0; k < 14; k++) palms.push([W[0] + (k % 2 ? -3.4 : 3.6), 0, W[2] - 50 + k * 7.5, 6 + r() * 2]);
    const mobiles: number[][] = [];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 7; j++) mobiles.push([W[0] + 8 + i * 4.2, 0, W[2] - 6 + j * 3.1, Math.floor(r() * PASTEL.length)]);
    return { houses, palms, mobiles };
  }, [W]);
  const smoke0 = T.wordTime('impact', 'hits', T.impact + 2);
  const smokeOn = !dusk && t > smoke0;
  const flash = (k: number) => (Math.floor(t * 4 + k) % 2 === 0 ? 1 : 0);
  return (
    <group>
      <mesh position={[W[0], 0, W[2]]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[700, 700]} /><meshStandardMaterial color={dusk ? '#3b4a3a' : '#7fa860'} /></mesh>
      {/* Military Trail: a wide road running north-south */}
      <mesh position={[W[0] + 0.5, 0.02, W[2]]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[6, 200]} /><meshStandardMaterial color="#5a5e63" /></mesh>
      {Array.from({ length: 30 }, (_, i) => (
        <mesh key={i} position={[W[0] + 0.5, 0.03, W[2] - 90 + i * 6.5]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.15, 2.4]} /><meshStandardMaterial color="#e8c84a" /></mesh>
      ))}
      {layout.houses.map((h, i) => <House key={i} at={h.at} color={h.c} rotY={h.rot} />)}
      {layout.palms.map(([x, y, z, h], i) => <Palm key={i} at={[x, y, z]} h={h} seed={i + 1} dark={dusk} />)}
      {/* shopping centre + parking */}
      <mesh position={[W[0] + 14, 2, W[2] - 26]} castShadow receiveShadow><boxGeometry args={[18, 4, 7]} /><meshStandardMaterial color="#e6d6bb" flatShading /></mesh>
      <mesh position={[W[0] + 14, 2.2, W[2] - 22.45]}><boxGeometry args={[17, 1.2, 0.1]} /><meshStandardMaterial color="#3d5a73" /></mesh>
      <mesh position={[W[0] + 14, 0.03, W[2] - 17]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[18, 9]} /><meshStandardMaterial color="#6b6f74" /></mesh>
      {[0, 1, 2, 3, 4].map((k) => <Car key={k} position={[W[0] + 7.5 + k * 3.2, 0.25, W[2] - 16.5]} rotation={[0, Math.PI / 2, 0]} color={['#d9d9d9', '#3b6fb6', '#c23b32', '#2d2d2d', '#e0c040'][k]} />)}
      {/* mobile-home community */}
      {layout.mobiles.map(([x, y, z, c], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh position={[0, 0.75, 0]} castShadow><boxGeometry args={[3.4, 1.4, 1.7]} /><meshStandardMaterial color={PASTEL[c]} flatShading /></mesh>
          <mesh position={[0, 1.55, 0]}><boxGeometry args={[3.6, 0.15, 1.9]} /><meshStandardMaterial color="#b9bcc0" /></mesh>
        </group>
      ))}
      {/* the smoke column (always seen from a distance) */}
      {smokeOn && <Smoke at={CRASH} t={t - smoke0} />}
      {/* responders near the scene */}
      {t > T.crater - 0.2 && !dusk && (
        <>
          <mesh position={[CRASH[0], 0.04, CRASH[2]]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[2.4, 10]} /><meshStandardMaterial color="#26221f" /></mesh>
          <mesh position={[CRASH[0], 0.035, CRASH[2]]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[4.2, 12]} /><meshStandardMaterial color="#45403b" /></mesh>
          {[[5.5, -3, 0.3], [-4.5, 6, -0.2], [6, 7, 1.4]].map(([dx, dz, ry], i) => (
            <FireTruck key={i} at={[CRASH[0] + dx, 0, CRASH[2] + dz]} rotY={ry} light={flash(i)} />
          ))}
        </>
      )}
      {t > T.evac - 0.2 && !dusk && <Evacuation T={T} t={t} />}
      {dusk && [[-48, 44, 7], [-52, 52, 8.5], [-44, 56, 6], [-58, 47, 7.5], [-62, 58, 9], [-40, 50, 5.5], [-55, 64, 7], [-68, 52, 6.5], [-46, 66, 8]].map(([x, z, h], i) => (
        <Palm key={`d${i}`} at={[W[0] + x, 0, W[2] + z]} h={h} seed={i + 200} dark />
      ))}
      {dusk && (
        <mesh position={[W[0] - 260, 22, W[2] + 260]}><sphereGeometry args={[14, 16, 16]} /><meshBasicMaterial color="#ffb070" fog={false} /></mesh>
      )}
    </group>
  );
};

const Smoke: React.FC<{ at: number[]; t: number }> = ({ at, t }) => {
  const parts = useMemo(() => {
    const r = rng(81);
    return Array.from({ length: 40 }, (_, i) => ({ t0: i * 0.22, dx: (r() - 0.5) * 1.2, dz: (r() - 0.5) * 1.2, s: 0.8 + r() * 0.8, sd: Math.floor(r() * 99) }));
  }, []);
  const life = 8.8;
  return (
    <group position={at as [number, number, number]}>
      {parts.map((p, i) => {
        const age = ((t - p.t0) % life + life) % life;
        if (t < p.t0) return null;
        const y = age * 3.2;
        const s = p.s * (1 + age * 0.6);
        return (
          <mesh key={i} position={[p.dx + age * 0.9, y + 1, p.dz]} scale={s}>
            <icosahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color={age < 1.5 ? '#3b3734' : '#5d5955'} flatShading transparent opacity={0.9 * (1 - age / life)} />
          </mesh>
        );
      })}
      <pointLight position={[0, 2, 0]} intensity={40} distance={14} color="#ff8a3a" />
    </group>
  );
};

const FireTruck: React.FC<{ at: number[]; rotY: number; light: number }> = ({ at, rotY, light }) => (
  <group position={at as [number, number, number]} rotation={[0, rotY, 0]}>
    <mesh position={[0, 1.0, 0]} castShadow><boxGeometry args={[4.4, 1.6, 1.8]} /><meshStandardMaterial color="#c62b25" flatShading /></mesh>
    <mesh position={[1.7, 1.45, 0]}><boxGeometry args={[1.0, 0.6, 1.7]} /><meshStandardMaterial color="#9fd0f0" /></mesh>
    <mesh position={[-0.6, 1.95, 0]}><boxGeometry args={[2.6, 0.12, 0.5]} /><meshStandardMaterial color="#cfd3d6" metalness={0.5} /></mesh>
    {[-1, 1].map((s) => (
      <mesh key={s} position={[1.4, 1.9, s * 0.5]}><boxGeometry args={[0.3, 0.16, 0.3]} /><meshStandardMaterial color={s * (light * 2 - 1) > 0 ? '#ff2d22' : '#ffffff'} emissive={s * (light * 2 - 1) > 0 ? '#ff2d22' : '#ffffff'} emissiveIntensity={1.5} /></mesh>
    ))}
    {[-1.4, 1.2].map((x) => [-0.9, 0.9].map((z) => (
      <mesh key={`${x}${z}`} position={[x, 0.32, z]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.32, 0.32, 0.25, 10]} /><meshStandardMaterial color="#222" /></mesh>
    )))}
  </group>
);

/** Residents walking away from the mobile homes to buses (seen from behind). */
const Evacuation: React.FC<{ T: LearjetTimeline; t: number }> = ({ T, t }) => {
  const W = TOWN;
  const people = useMemo(() => {
    const r = rng(91);
    const shirts = ['#3b6fb6', '#e2453c', '#f0b429', '#2f9e6e', '#8e5bd1', '#e57a2e', '#ffffff'];
    return Array.from({ length: 16 }, () => ({ x: 23.6 + r() * 2.6, z: 7 + r() * 9, sp: 0.8 + r() * 0.4, c: shirts[Math.floor(r() * shirts.length)], ph: r() * 6 }));
  }, []);
  const dt = t - T.evac;
  return (
    <group>
      {[0, 1].map((k) => (
        <group key={k} position={[W[0] + 25 + k * 3.4, 0, W[2] - 2]} rotation={[0, 0, 0]}>
          <mesh position={[0, 1.4, 0]} castShadow><boxGeometry args={[2.4, 2.4, 8]} /><meshStandardMaterial color="#f2f2f2" flatShading /></mesh>
          <mesh position={[0, 1.8, 0]}><boxGeometry args={[2.45, 0.6, 7.6]} /><meshStandardMaterial color="#2a4f7a" /></mesh>
          <mesh position={[0, 0.85, 0]}><boxGeometry args={[2.45, 0.2, 8.02]} /><meshStandardMaterial color="#2a4f7a" /></mesh>
        </group>
      ))}
      {people.map((p, i) => {
        const z = Math.max(W[2] + 2.6, W[2] + p.z - dt * p.sp);
        return <Person key={i} at={[W[0] + p.x, 0, z]} shirt={p.c} rotY={Math.PI} walk={z > W[2] + 2.6 ? t * 7 + p.ph : 0} />;
      })}
    </group>
  );
};

/* ------------------------------------------------------------------ main */

const LOOK: Record<string, { top: string; hor: string; bottom?: string; fog: string; near: number; far: number; sun?: number; hemi?: [string, string, number]; sunColor?: string }> = {
  dive: { top: '#5f87b8', hor: '#b9cde0', fog: '#b9cde0', near: 60, far: 280 },
  cruise: { top: '#2a6fd0', hor: '#a9d6ff', bottom: '#dfe9f3', fog: '#cfe3f7', near: 80, far: 320 },
  storm: { top: '#4b5866', hor: '#9aa6b1', bottom: '#8d98a3', fog: '#9aa6b1', near: 50, far: 240, sun: 1.3, hemi: ['#c9d2db', '#55606b', 1.0] },
  inCloud: { top: '#6f7b87', hor: '#8794a0', fog: '#8794a0', near: 6, far: 48, sun: 1.2, hemi: ['#dfe6ec', '#7d8892', 1.2] },
  map: { top: '#061224', hor: '#0e2a47', fog: '#0e2a47', near: 200, far: 900, sun: 2.0 },
  section: { top: '#0b1a2e', hor: '#1d3b5e', fog: '#1d3b5e', near: 200, far: 900, sun: 1.6 },
  cockpit: { top: '#15181c', hor: '#22272d', fog: '#22272d', near: 50, far: 300, sun: 1.0, hemi: ['#9aa4ad', '#1a1d21', 1.1] },
  stress: { top: '#6d7680', hor: '#a3acb4', fog: '#a3acb4', near: 6, far: 70, sun: 1.2, hemi: ['#dfe6ec', '#6d7680', 1.2] },
  everest: { top: '#2a7fe0', hor: '#a9d6ff', fog: '#c9e3fb', near: 120, far: 420 },
  town: { top: '#4d8fd6', hor: '#cfe2f2', fog: '#d6e4ee', near: 60, far: 300 },
  dusk: { top: '#25295a', hor: '#ff9a5a', bottom: '#6b4a5a', fog: '#c9806a', near: 40, far: 260, sun: 1.1, hemi: ['#ffb38a', '#2a2440', 0.9], sunColor: '#ffb070' },
};

export const LearjetScene: React.FC<{ timings: Timings; t: number }> = ({ timings, t }) => {
  const T = useMemo(() => buildLearjetTimeline(timings), [timings]);
  const pose = cameraPose(timings, T, t);
  const place = placeAt(T, t);
  const lookKey = place === 'cruise' ? (t >= T.ice ? 'inCloud' : t >= T.storms ? 'storm' : 'cruise') : place === 'frozen' ? 'stress' : place;
  const L = LOOK[lookKey];
  return (
    <>
      <CameraRig pose={pose} />
      <GradSky at={pose.pos} top={L.top} hor={L.hor} bottom={L.bottom} />
      <PlaceLights target={pose.target} fog={L.fog} near={L.near} far={L.far} sun={L.sun} hemi={L.hemi} sunColor={L.sunColor} />
      {place === 'dive' && <DiveHook T={T} t={t} />}
      {place === 'cruise' && <Cruise T={T} t={t} />}
      {place === 'map' && <MapPlace T={T} t={t} />}
      {place === 'section' && <SectionPlace T={T} t={t} />}
      {place === 'cockpit' && <CockpitPlace T={T} t={t} />}
      {(place === 'stress' || place === 'frozen') && <DiveSide t={t} frozen={place === 'frozen'} />}
      {place === 'everest' && <EverestPlace T={T} t={t} />}
      {(place === 'town' || place === 'dusk') && <Town T={T} t={t} dusk={place === 'dusk'} />}
    </>
  );
};
