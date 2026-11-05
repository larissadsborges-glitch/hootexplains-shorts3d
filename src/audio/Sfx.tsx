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

/** Length (s) of each effect file in public/sfx (measured with ffprobe), for limitSfx. */
export const SFX_LEN: Record<string, number> = { gulp: 0.32, swish: 0.22, ding: 1.2, notif: 1.1, splat: 0.25, hit: 1.4, riser: 0.9, thud: 1.0, rumble: 3.0, whoosh: 0.45, pop: 0.12, ping: 0.55, toggle: 0.12, splash: 1.3, alarm: 2.4, siren: 5.0, buzz: 2.6 };

/**
 * Keep at most `max` effects sounding at once. Cues are taken in priority order (the array order),
 * so list story cues first and filler (whooshes) last; a cue that would make a 3rd overlapping sound is dropped.
 */
export const limitSfx = (cues: Cue[], max = 2): Cue[] => {
  const len = (c: Cue) => c.dur ?? SFX_LEN[c.sfx] ?? 1;
  const kept: Cue[] = [];
  for (const c of cues) {
    const a = c.at, b = c.at + len(c);
    const over = kept.filter((k) => k.at < b && k.at + len(k) > a);
    // the most sounds at once inside [a, b): check at a and at every overlapping cue's start inside it
    const points = [a, ...over.map((k) => k.at).filter((x) => x > a && x < b)];
    const worst = Math.max(0, ...points.map((p) => over.filter((k) => k.at <= p && k.at + len(k) > p).length));
    if (worst < max) kept.push(c);
  }
  return kept.sort((x, y) => x.at - y.at);
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
export const Music: React.FC<{ timings: Timings; src?: string; dip?: (t: number) => number }> = ({ timings, src = 'music/bed.wav', dip }) => {
  const { fps, durationInFrames } = useVideoConfig();
  return (
    <Audio
      src={staticFile(src)}
      volume={(f) => {
        const s = speechEnvelope(timings, f / fps, 0.3);
        const duck = MIX.musicWhileSpeaking + (1 - MIX.musicWhileSpeaking) * s;
        const fadeOut = Math.min(1, (durationInFrames - f) / (fps * 0.8));
        return MIX.music * duck * Math.max(0, fadeOut) * (dip ? dip(f / fps) : 1);
      }}
    />
  );
};
