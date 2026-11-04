import React, { useMemo } from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { Music, Sfx, type Cue } from './audio/Sfx';
import { Captions, Handle, TermLabel, TitleCard } from './overlays/Overlays';
import { RiverBridge } from './scenes/RiverBridge';
import { buildTimeline, cameraPose, sfxCues } from './scenes/riverBridgeTimeline';
import { BridgeFull } from './scenes/bridgeFull/Scene';
import { BridgeFullOverlays } from './scenes/bridgeFull/overlays';
import { fullSfxCues } from './scenes/bridgeFull/sfx';
import { buildFullTimeline, cameraPose as fullCameraPose, sceneTime as fullSceneTime } from './scenes/bridgeFull/timeline';
import { HouseScene } from './scenes/house/Scene';
import { HouseOverlays } from './scenes/house/overlays';
import { houseSfxCues } from './scenes/house/sfx';
import { buildHouseTimeline, cameraPose as houseCameraPose, sceneTime as houseSceneTime } from './scenes/house/timeline';
import { TunnelScene } from './scenes/tunnel/Scene';
import { tunnelSfxCues } from './scenes/tunnel/sfx';
import { buildTunnelTimeline, cameraPose as tunnelCameraPose, labelAnchor as tunnelAnchor, sceneTime as tunnelSceneTime } from './scenes/tunnel/timeline';
import { ElevatorScene } from './scenes/elevator/Scene';
import { ElevatorOverlays } from './scenes/elevator/overlays';
import { elevatorSfxCues } from './scenes/elevator/sfx';
import { buildElevatorTimeline, cameraPose as elevatorCameraPose, labelAnchor as elevatorAnchor } from './scenes/elevator/timeline';
import { LearjetScene } from './scenes/learjet/Scene';
import { LearjetOverlays } from './scenes/learjet/overlays';
import { learjetSfxCues } from './scenes/learjet/sfx';
import { buildLearjetTimeline, cameraPose as learjetCameraPose, labelAnchor as learjetAnchor } from './scenes/learjet/timeline';
import { SinkScene } from './scenes/sink/Scene';
import { SinkOverlays } from './scenes/sink/overlays';
import { sinkSfxCues } from './scenes/sink/sfx';
import { buildSinkTimeline, cameraPose as sinkCameraPose, labelAnchor as sinkAnchor } from './scenes/sink/timeline';
import { PlaneWindowScene } from './scenes/planewindow/Scene';
import { PlaneWindowOverlays } from './scenes/planewindow/overlays';
import { planeWindowSfxCues } from './scenes/planewindow/sfx';
import { buildPlaneWindowTimeline, cameraPose as pwCameraPose, labelAnchor as pwAnchor } from './scenes/planewindow/timeline';
import { AirplaneModeScene } from './scenes/airplanemode/Scene';
import { AirplaneModeOverlays } from './scenes/airplanemode/overlays';
import { airplaneModeSfxCues } from './scenes/airplanemode/sfx';
import { buildAirplaneModeTimeline, cameraPose as amCameraPose, labelAnchor as amAnchor } from './scenes/airplanemode/timeline';
import { SleepScene } from './scenes/sleep/Scene';
import { SleepOverlays } from './scenes/sleep/overlays';
import { sleepSfxCues } from './scenes/sleep/sfx';
import { buildSleepTimeline, cameraPose as sleepCameraPose, labelAnchor as sleepAnchor } from './scenes/sleep/timeline';
import { AwakeScene } from './scenes/awake/Scene';
import { AwakeOverlays } from './scenes/awake/overlays';
import { awakeSfxCues } from './scenes/awake/sfx';
import { buildAwakeTimeline, cameraPose as awakeCameraPose } from './scenes/awake/timeline';
import type { ShortProps, Timings } from './types';
import { StylePass } from './style/StylePass';
import type { CameraPose } from './world/Props';

type SceneDef = {
  Scene: React.FC<{ timings: Timings; t: number }>;
  timeline: (tm: Timings) => any;
  pose: (tm: Timings, T: any, t: number) => CameraPose;
  cues: (tm: Timings, T: any) => Cue[];
  Overlays?: React.FC<{ timings: Timings; T: any; t: number }>;
  sceneTime?: (T: any, t: number) => number;
  anchor?: (T: any, key: string, t: number) => number[] | null;
};

/** Scene registry: each script picks its scene by name ("scene" in script.json). */
export const SCENES: Record<string, SceneDef> = {
  'river-bridge': { Scene: RiverBridge, timeline: buildTimeline, pose: cameraPose, cues: sfxCues },
  elevator: { Scene: ElevatorScene, timeline: buildElevatorTimeline, pose: elevatorCameraPose, cues: elevatorSfxCues, Overlays: ElevatorOverlays, anchor: elevatorAnchor },
  learjet: { Scene: LearjetScene, timeline: buildLearjetTimeline, pose: learjetCameraPose, cues: learjetSfxCues, Overlays: LearjetOverlays, anchor: learjetAnchor },
  sink: { Scene: SinkScene, timeline: buildSinkTimeline, pose: sinkCameraPose, cues: sinkSfxCues, Overlays: SinkOverlays, anchor: (T, k) => sinkAnchor(T, k) },
  planewindow: { Scene: PlaneWindowScene, timeline: buildPlaneWindowTimeline, pose: pwCameraPose, cues: planeWindowSfxCues, Overlays: PlaneWindowOverlays, anchor: (T, k) => pwAnchor(T, k) },
  airplanemode: { Scene: AirplaneModeScene, timeline: buildAirplaneModeTimeline, pose: amCameraPose, cues: airplaneModeSfxCues, Overlays: AirplaneModeOverlays, anchor: (T, k) => amAnchor(T, k) },
  sleep: { Scene: SleepScene, timeline: buildSleepTimeline, pose: sleepCameraPose, cues: sleepSfxCues, Overlays: SleepOverlays, anchor: (T, k) => sleepAnchor(T, k) },
  awake: { Scene: AwakeScene, timeline: buildAwakeTimeline, pose: awakeCameraPose, cues: awakeSfxCues, Overlays: AwakeOverlays },
  tunnel: { Scene: TunnelScene, timeline: buildTunnelTimeline, pose: tunnelCameraPose, cues: tunnelSfxCues, anchor: tunnelAnchor, sceneTime: tunnelSceneTime },
  house: { Scene: HouseScene, timeline: buildHouseTimeline, pose: houseCameraPose, cues: houseSfxCues, Overlays: HouseOverlays, sceneTime: houseSceneTime },
  'river-bridge-full': { Scene: BridgeFull, timeline: buildFullTimeline, pose: fullCameraPose, cues: fullSfxCues, Overlays: BridgeFullOverlays, sceneTime: fullSceneTime },
};

export const Short: React.FC<ShortProps> = ({ videoId, timings, style }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const S = SCENES[timings?.scene ?? 'river-bridge'];
  const T = useMemo(() => (timings ? S.timeline(timings) : null), [timings, S]);
  const cues = useMemo(() => (timings && T ? S.cues(timings, T) : []), [timings, T, S]);
  if (!timings || !T) return null;
  const t = frame / fps;
  // house style: 'real' (decided Nov 2026); old videos can still pass blocky/soft
  const vs = style ?? timings.style ?? 'real';
  const pose = S.pose(timings, T, t);
  const first = timings.beats[0];
  const last = timings.beats[timings.beats.length - 1];
  return (
    <AbsoluteFill style={{ backgroundColor: '#9fd3fb' }}>
      <AbsoluteFill style={{ filter: vs === 'real' ? 'saturate(1.18) contrast(1.06)' : vs === 'soft' ? 'saturate(1.08)' : undefined }}>
      <ThreeCanvas width={width} height={height} shadows gl={{ antialias: true }} camera={{ fov: 45, position: [0, 10, 20] }}>
        <S.Scene timings={timings} t={S.sceneTime ? S.sceneTime(T, t) : t} />
        <StylePass style={vs} />
      </ThreeCanvas>
      </AbsoluteFill>
      {S.Overlays && <S.Overlays timings={timings} T={T} t={t} />}
      {timings.hook && <TitleCard {...timings.hook} t={t} tIn={-0.7} tOut={first.end + 0.15} />}
      <TermLabel timings={timings} t={t} pose={pose} anchor={S.anchor ? (k, tt) => S.anchor!(T, k, tt) : undefined} />
      <Captions timings={timings} t={t} />
      {timings.outro && <TitleCard {...timings.outro} t={t} tIn={last.end + 0.05} tOut={timings.duration + 1} top={(timings.outro as { top?: string }).top ?? "30%"} />}
      <Handle handle={timings.handle} />
      <Audio src={staticFile(`videos/${videoId}/voice.wav`)} />
      <Sfx cues={cues} timings={timings} />
      <Music timings={timings} src={timings.music} />
    </AbsoluteFill>
  );
};
