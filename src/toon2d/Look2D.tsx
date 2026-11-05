import React, { useMemo } from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Music, Sfx } from '../audio/Sfx';
import { clamp01, easeOutCubic } from '../lib/anim';
import { Captions, Handle, TitleCard } from '../overlays/Overlays';
import { MoneyOverlays } from '../scenes/money/overlays';
import { moneySfxCues } from '../scenes/money/sfx';
import { buildMoneyTimeline } from '../scenes/money/timeline';
import type { ShortProps } from '../types';
import { Hook2D, HootGesture } from './Hook2D';
import { Market2D, Table2D } from './scenes';
import { China2D, Vault2D } from './scenes2';

/**
 * Money series in the 2D cartoon style. Each beat's "shot" picks a drawn scene; on every cut the
 * frame punches in slightly and settles, then drifts in slowly (a living camera, never static).
 */
export const Look2D: React.FC<ShortProps> = ({ videoId, timings }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = useMemo(() => (timings ? buildMoneyTimeline(timings) : null), [timings]);
  const cues = useMemo(() => (timings && T ? moneySfxCues(timings, T) : []), [timings, T]);
  if (!timings || !T) return null;
  const t = frame / fps;
  // smooth the per-frame beak value over 3 frames (removes 1-frame flicker without losing sync)
  const m = timings.mouth ?? [];
  const talk = ((m[frame - 1] ?? m[frame] ?? 0) + 2 * (m[frame] ?? 0) + (m[frame + 1] ?? m[frame] ?? 0)) / 4;
  const first = timings.beats[0];
  const last = timings.beats[timings.beats.length - 1];
  const beat = timings.beats.reduce((b, x) => (t >= x.start ? x : b), timings.beats[0]);
  // start of the current run of beats sharing this shot
  const idx = timings.beats.indexOf(beat);
  let a = idx;
  while (a > 0 && timings.beats[a - 1].shot === beat.shot) a--;
  const runS = a === 0 ? 0 : timings.beats[a].start;
  const since = t - runS;
  const punch = a === 0 ? 0 : 0.06 * (1 - easeOutCubic(clamp01(since / 0.3)));
  const drift = 1 + 0.035 * clamp01(since / 5);
  const z = (1 + punch) * drift;
  const cam = `translate(540 1000) scale(${z}) translate(-540 -1000)`;
  // Hoot rests his wings while talking and raises the pencil only on the key words (about 1.3 s each)
  const keyWords: [string, string, number][] = [['hook', 'cents', 1.7], ['barter', 'hate', 3.2], ['coins', 'worth', 3.9], ['china', 'paper', 1.85], ['gold', '1971', 3.2], ['answer', 'law', 3.2], ['answer', 'trusts', 6]];
  const raise = Math.max(0, ...keyWords.map(([ev, word, d]) => {
    const w0 = T.wordTime(ev, word, T.s(ev) + d);
    return clamp01((t - w0 + 0.15) / 0.18) * (1 - clamp01((t - w0 - 1.15) / 0.25));
  }));
  const cheer = t >= T.wordTime('final', 'would', T.s('final') + 1.7) - 0.1;
  // a wink to close the loop, after the last word
  const wink = t >= last.end + 0.5 && t < last.end + 1.2;
  return (
    <HootGesture.Provider value={{ raise, cheer, wink }}>
    <AbsoluteFill style={{ backgroundColor: '#1b1420' }}>
      {(beat.shot === 'billHook' || beat.shot === 'billLaw') && (() => {
        // the answer beat reuses the hook room: the 7¢ sticker pulses on "7 cents", LEGAL TENDER stamps down on "law", Jake nods on "trusts"
        const a = (word: string, d: number) => T.wordTime('answer', word, T.s('answer') + d);
        const inAns = beat.event === 'answer';
        const c7 = a('7', 1.4);
        const pulse = inAns ? Math.max(0, Math.sin(clamp01((t - c7 + 0.05) / 0.6) * Math.PI)) : 0;
        const stamp = inAns ? clamp01((t - a('law', 3.2) + 0.05) / 0.2) : 0;
        const nod = inAns && t > a('trusts', 6) ? Math.max(0, Math.sin((t - a('trusts', 6)) * 8)) * (1 - clamp01((t - a('trusts', 6) - 0.8) / 0.3)) : 0;
        return <Hook2D t={t} talk={talk} worth={T.wordTime('hook', 'worth', T.s('hook') + 3.4)} cents={T.wordTime('hook', 'cents', T.s('hook') + 1.7)} stamp={stamp} pulse={pulse} nod={nod} />;
      })()}
      {beat.shot !== 'billHook' && beat.shot !== 'billLaw' && (
        <svg viewBox="0 0 1080 1920" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
          <g transform={cam}>
            {beat.shot === 'barter' && <Market2D T={T} t={t} talk={talk} />}
            {beat.shot === 'timeline' && <Table2D T={T} t={t} talk={talk} />}
            {beat.shot === 'china' && <China2D T={T} t={t} talk={talk} />}
            {beat.shot === 'vault' && <Vault2D T={T} t={t} talk={talk} />}
          </g>
        </svg>
      )}
      <MoneyOverlays timings={timings} T={T} t={t} />
      {timings.hook && <TitleCard {...timings.hook} t={t} tIn={-0.7} tOut={T.wordTime('hook', 'back', T.s('hook') + 4.4) - 0.1} />}
      <Captions timings={timings} t={t} />
      {timings.outro && <TitleCard {...timings.outro} t={t} tIn={last.start + 0.02} tOut={timings.duration + 1} top={(timings.outro as { top?: string }).top ?? '30%'} />}
      <Handle handle={timings.handle} />
      <Audio src={staticFile(`videos/${videoId}/voice.wav`)} />
      <Sfx cues={cues} timings={timings} />
      <Music timings={timings} src={timings.music} />
    </AbsoluteFill>
    </HootGesture.Provider>
  );
};
