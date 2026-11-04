import React from 'react';
import { Audio, Sequence, staticFile, useVideoConfig } from 'remotion';
import type { Timings } from '../types';

export type Cue = { at: number; sfx: string; volume?: number; dur?: number };

/** Overall levels relative to the voice (1.0). Tweak here, not per cue. */
export const MIX = { sfx: 0.45, sfxWhileSpeaking: 0.6, music: 0.16, musicWhileSpeaking: 0.45 };

/** 1 when the narrator is silent, sliding smoothly to 0 while they speak. */
export const speechEnvelope = (timings: Timings, t: number, ramp = 0.15) => {
  let d = Infinity;
  for (const b of timings.beats) {
    if (t >= b.start && t <= b.end) return 0;
    d = Math.min(d, t < b.start ? b.start - t : t - b.end);
  }
  return Math.min(1, d / ramp);
};

/** Plays each sound effect at its cue time (seconds), ducked under the voice. */
export const Sfx: React.FC<{ cues: Cue[]; timings: Timings }> = ({ cues, timings }) => {
  const { fps } = useVideoConfig();
  return (
    <>
      {cues.map((c, i) => {
        const from = Math.max(0, Math.round(c.at * fps));
        return (
          <Sequence key={i} from={from} durationInFrames={c.dur ? Math.max(1, Math.round(c.dur * fps)) : undefined} layout="none">
            <Audio
              src={staticFile(`sfx/${c.sfx}.wav`)}
              volume={(f) => {
                const s = speechEnvelope(timings, (from + f) / fps);
                const duck = MIX.sfxWhileSpeaking + (1 - MIX.sfxWhileSpeaking) * s;
                return (c.volume ?? 1) * MIX.sfx * duck;
              }}
            />
          </Sequence>
        );
      })}
    </>
  );
};

/** Background music bed, ducked under the voice, fading out at the end. */
export const Music: React.FC<{ timings: Timings; src?: string }> = ({ timings, src = 'music/bed.wav' }) => {
  const { fps, durationInFrames } = useVideoConfig();
  return (
    <Audio
      src={staticFile(src)}
      volume={(f) => {
        const s = speechEnvelope(timings, f / fps, 0.3);
        const duck = MIX.musicWhileSpeaking + (1 - MIX.musicWhileSpeaking) * s;
        const fadeOut = Math.min(1, (durationInFrames - f) / (fps * 0.8));
        return MIX.music * duck * Math.max(0, fadeOut);
      }}
    />
  );
};
