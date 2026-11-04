import React from 'react';
import { AbsoluteFill } from 'remotion';
import { clamp01 } from '../../lib/anim';
import type { Timings } from '../../types';
import { Headline, Pill } from '../learjet/overlays';
import type { SinkTimeline } from './timeline';

const FONT = "'Montserrat', 'Arial Black', sans-serif";

export const SinkOverlays: React.FC<{ timings: Timings; T: SinkTimeline; t: number }> = ({ T, t }) => {
  const w = (ev: string, word: string, d: number) => T.wordTime(ev, word, d);
  const facts = ['WATER PLUG', 'ROOF VENT', 'RUN THE TAP', 'LOST RING'];
  return (
    <>
      <Pill t={t} t0={T.straight + 0.2} t1={T.sewerGas} text="STRAIGHT PIPE" top="17%" dot="#9aa3ad" />
      <Pill t={t} t0={w('sewerGas', 'gas', T.sewerGas + 1.5)} t1={T.bend} text="SEWER GAS" top="17%" dot="#8fd13a" />
      <Headline t={t} t0={w('stink', 'bathroom', T.stink + 2)} t1={T.bend} text="IT STINKS!" color="#9bd34a" top="16%" />
      <Pill t={t} t0={w('seal', 'five', T.seal + 3)} t1={T.plug} text="5–10 CM OF WATER" top="17%" dot="#2f8fe0" />
      <Headline t={t} t0={w('plug', 'gas', T.plug + 1.2)} t1={T.siphon} text={'GAS: BLOCKED\nWATER: FLOWS'} size={66} top="16%" />
      <Headline t={t} t0={T.suck} t1={T.vent} text="SIPHONING" color="#ff6a5d" top="17%" />
      <Pill t={t} t0={T.air + 0.3} t1={T.roof} text="AIR IN = PLUG STAYS" top="17%" dot="#ffffff" />
      <Pill t={t} t0={w('roof', 'sewer', T.roof + 2.5)} t1={T.strap} text="GAS OUT, ABOVE YOUR HEAD" top="17%" dot="#8fd13a" />
      <Headline t={t} t0={w('strap', 's-shaped', T.strap + 1)} t1={T.stripE} text="S-TRAP · 1775" top="16%" size={78} />
      <Pill t={t} t0={T.strapBan} t1={T.stripE} text="BANNED IN MANY PLACES" top="23%" dot="#ff4a3d" />
      <Pill t={t} t0={T.evap + 1.2} t1={T.refill} text="WEEKS LATER…" top="17%" dot="#ffd21f" />
      <Headline t={t} t0={T.tap} t1={T.ring} text={'FREE FIX:\nRUN THE TAP'} size={74} top="16%" />
      <Pill t={t} t0={w('ring', 'u', T.ring + 2.5)} t1={T.final} text="IT WAITS IN THE U" top="17%" dot="#ffcf3a" />
      <Pill t={t} t0={T.unscrew} t1={T.final} text="UNSCREW THE TWO NUTS" top="23%" dot="#ffd21f" />
      {t >= T.final && t < T.end - 2.2 && (
        <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', top: '14%' }}>
          <div style={{ background: 'rgba(10,12,16,0.78)', borderRadius: 28, padding: '20px 38px' }}>
            <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 32, color: '#9fdcff', letterSpacing: 2, marginBottom: 6 }}>WHICH ONE DID YOU KNOW?</div>
            {facts.map((f, i) => {
              const a = clamp01((t - T.final - 0.25 - i * 0.18) / 0.2);
              return (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 18, margin: '8px 0', opacity: a }}>
                  <div style={{ width: 54, height: 54, borderRadius: 27, background: '#ffd21f', fontFamily: FONT, fontWeight: 900, fontSize: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</div>
                  <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 50, color: '#fff' }}>{f}</div>
                </div>
              );
            })}
          </div>
        </AbsoluteFill>
      )}
    </>
  );
};
