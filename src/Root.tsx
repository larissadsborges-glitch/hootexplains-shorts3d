import '@fontsource/montserrat/800.css';
import '@fontsource/montserrat/900.css';
import React from 'react';
import { Composition, staticFile } from 'remotion';
import { Short } from './Short';
import { Look2D } from './toon2d/Look2D';
import { CastSheet } from './tavinho/CastSheet';
import { TavinhoEpisode } from './tavinho/Episode';
import { TavinhoAvatar, TavinhoCover } from './tavinho/Art';
import { TavinhoLooks } from './tavinho/Looks';
import { TavinhoNewStyle } from './tavinho/NewStyle';
import { TavinhoSheet } from './tavinho/CharacterSheet';
import { Avatar2D } from './toon2d/Avatar2D';
import { Cover2D, type Cover2DProps } from './toon2d/Cover2D';
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
  <Composition
    id="Tavinho"
    component={TavinhoEpisode}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={300}
    defaultProps={{ videoId: 'tavinho1', timings: null } as ShortProps}
    calculateMetadata={async ({ props }) => {
      const res = await fetch(staticFile(`videos/${props.videoId}/timings.json`));
      const timings = (await res.json()) as Timings;
      return { durationInFrames: Math.ceil(timings.duration * FPS), props: { ...props, timings } };
    }}
  />
  <Composition id="TavinhoAvatar" component={TavinhoAvatar} width={1080} height={1080} fps={30} durationInFrames={1} />
  <Composition id="TavinhoCover" component={TavinhoCover} width={1080} height={1920} fps={30} durationInFrames={1} defaultProps={{ line1: 'MENTIU PRA', line2: 'SOGRA 😳', tag: 'EP 1 · A CEIA DA SOGRA' }} />
  <Composition id="TavinhoCast" component={CastSheet} width={2160} height={1920} fps={30} durationInFrames={1} />
  <Composition id="TavinhoLooks" component={TavinhoLooks} width={1080} height={1350} fps={30} durationInFrames={1} defaultProps={{ look: 0 }} />
  <Composition id="TavinhoNewStyle" component={TavinhoNewStyle} width={1080} height={1920} fps={30} durationInFrames={1} defaultProps={{ shot: 0 }} />
  <Composition id="TavinhoSheet" component={TavinhoSheet} width={1080} height={1920} fps={30} durationInFrames={1} defaultProps={{ page: 0 }} />
  <Composition id="Avatar2D" component={Avatar2D} width={1080} height={1080} fps={30} durationInFrames={1} />
  <Composition id="Avatar" component={Avatar} width={1080} height={1080} fps={30} durationInFrames={30} />
  <Composition id="Mascot" component={MascotStill} width={1080} height={1350} fps={30} durationInFrames={60} defaultProps={{ which: 'bolt' }} />
  <Composition
    id="Cover2D"
    component={Cover2D}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={1}
    defaultProps={{ videoId: 'money1', timings: null, at: 1.95, small: 'HOOT EXPLAINS · MONEY', line1: 'THIS $20 COST', line2: '7¢ TO PRINT' } as Cover2DProps}
    calculateMetadata={async ({ props }) => {
      const res = await fetch(staticFile(`videos/${props.videoId}/timings.json`));
      const timings = (await res.json()) as Timings;
      return { props: { ...props, timings } };
    }}
  />
  <Composition
    id="Look2D"
    component={Look2D}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={360}
    defaultProps={{ videoId: 'money1', timings: null } as ShortProps}
    calculateMetadata={async ({ props }) => {
      const res = await fetch(staticFile(`videos/${props.videoId}/timings.json`));
      const timings = (await res.json()) as Timings;
      return { durationInFrames: Math.ceil(timings.duration * FPS), props: { ...props, timings } };
    }}
  />
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
