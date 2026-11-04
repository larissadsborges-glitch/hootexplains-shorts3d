import '@fontsource/montserrat/800.css';
import '@fontsource/montserrat/900.css';
import React from 'react';
import { Composition, staticFile } from 'remotion';
import { Short } from './Short';
import { MascotStill } from './mascot/MascotStill';
import { Avatar } from './mascot/Avatar';
import { Cover, type CoverProps } from './overlays/Cover';
import type { ShortProps, Timings } from './types';

const FPS = 30;

export const RemotionRoot: React.FC = () => (
  <>
  <Composition
    id="Cover"
    component={Cover}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={1}
    defaultProps={{ videoId: 'planewindow', timings: null, at: 1.5, small: 'HOOT EXPLAINS', line1: 'TITLE', line2: 'HERE' } as CoverProps}
    calculateMetadata={async ({ props }) => {
      const res = await fetch(staticFile(`videos/${props.videoId}/timings.json`));
      const timings = (await res.json()) as Timings;
      return { props: { ...props, timings } };
    }}
  />
  <Composition id="Avatar" component={Avatar} width={1080} height={1080} fps={30} durationInFrames={30} />
  <Composition id="Mascot" component={MascotStill} width={1080} height={1350} fps={30} durationInFrames={60} defaultProps={{ which: 'bolt' }} />
  <Composition
    id="Short"
    component={Short}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={300}
    defaultProps={{ videoId: 'bridge-poc', timings: null } as ShortProps}
    calculateMetadata={async ({ props }) => {
      const res = await fetch(staticFile(`videos/${props.videoId}/timings.json`));
      const timings = (await res.json()) as Timings;
      return { durationInFrames: Math.ceil(timings.duration * FPS), props: { ...props, timings } };
    }}
  />
  </>
);
