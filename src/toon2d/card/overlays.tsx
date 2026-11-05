import React from 'react';
import { AbsoluteFill } from 'remotion';
import { clamp01, easeOutBack, easeOutCubic, lerp } from '../../lib/anim';
import { HootBadge } from '../../overlays/HootBadge';
import { Pill } from '../../scenes/learjet/overlays';
import type { MoneyTimeline } from '../../scenes/money/timeline';

const FONT = "'Montserrat', 'Arial Black', sans-serif";
const pop = (t: number, t0: number) => easeOutBack(clamp01((t - t0) / 0.22));
const fade = (t: number, t1: number) => clamp01((t1 - t) / 0.15);
/** Year on Jake's wall calendar during the treadmill shot (1..12). */
export const yearAt = (T: MoneyTimeline, t: number) => {
  const s0 = T.s('shrink'), s1 = T.s('total');
  return Math.min(12, 1 + Math.floor(12 * clamp01((t - s0 - 0.3) / Math.max(1, s1 - s0 - 0.9))));
};
/** Minimum due at the start of each year: $3,000 at 22.15%, 1% + interest, $35 floor (BRIEF.md). */
const MIN_BY_YEAR = [85, 76, 67, 59, 53, 47, 41, 37, 35, 35, 35, 35];
const money = (v: number) => `$${Math.round(v).toLocaleString('en-US')}`;

/** A dark rounded card, centred, at `top`. */
const Card: React.FC<{ t: number; t0: number; t1: number; top: string; children: React.ReactNode; width?: number }> = ({ t, t0, t1, top, children, width = 820 }) => {
  if (t < t0 || t > t1) return null;
  return (
    <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', top, opacity: fade(t, t1) }}>
      <div style={{ width, background: 'rgba(10,12,16,0.8)', borderRadius: 28, padding: '16px 26px', boxShadow: '0 8px 20px rgba(0,0,0,0.35)', transform: `scale(${pop(t, t0)})` }}>{children}</div>
    </AbsoluteFill>
  );
};

export const CardOverlays: React.FC<{ T: MoneyTimeline; t: number }> = ({ T, t }) => {
  const w = (ev: string, word: string, d = 1) => T.wordTime(ev, word, T.s(ev) + d);
  const t85 = w('split', '85', 1.5), t55 = w('split', '55', 2.6);
  const split = clamp01((t - t55 + 0.05) / 0.35);
  const tShr = w('shrink', 'shrinks', 1);
  const minDue = MIN_BY_YEAR[yearAt(T, t) - 1];
  const t7 = w('total', '7000', 1.5);
  const paid = 7039 * easeOutCubic(clamp01((t - T.s('total') - 0.1) / Math.max(0.5, t7 - T.s('total') - 0.1)));
  const tDo = w('final', 'do', 3.6);
  const t29 = w('final', '2900', 2.5);
  return (
    <>
      <HootBadge t={t} />

      {/* bridge: the open question */}
      <Pill t={t} t0={w('bridge', 'goes', 1) - 0.1} t1={T.s('split') - 0.05} text="WHERE DOES IT GO?" top="14.5%" dot="#ffd21f" />

      {/* the $85 payment, split into interest and debt on "55" */}
      <Card t={t} t0={t85 - 0.15} t1={T.s('shrink') - 0.05} top="70.5%">
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 36, color: '#fff', textAlign: 'center', marginBottom: 10 }}>HIS $85 PAYMENT</div>
        <div style={{ display: 'flex', height: 74, borderRadius: 16, overflow: 'hidden', border: '4px solid #fff' }}>
          <div style={{ width: `${lerp(100, (55 / 85) * 100, split)}%`, background: split > 0 ? '#e2453c' : '#8a93a3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 34, color: '#fff' }}>{split > 0.5 ? 'INTEREST $55' : '$85'}</div>
          <div style={{ flex: 1, background: '#2fa84f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 30, color: '#fff' }}>{split > 0.5 ? 'DEBT $30' : ''}</div>
        </div>
      </Card>
      <Pill t={t} t0={w('rate', '22', 1) - 0.1} t1={T.s('shrink') - 0.05} text="AVG CARD RATE · FEDERAL RESERVE" top="14.5%" dot="#ffffff" />

      {/* the minimum shrinks with the debt */}
      <Card t={t} t0={T.s('shrink') + 0.1} t1={T.s('total') - 0.05} top="14.5%" width={640}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 36, color: '#fff' }}>MINIMUM DUE</div>
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 64, color: '#ffd21f' }}>${Math.round(minDue)}</div>
          <div style={{ width: 0, height: 0, borderLeft: '20px solid transparent', borderRight: '20px solid transparent', borderTop: '30px solid #ff4a3d', opacity: t > tShr && minDue < 85 ? 1 : 0 }} />
        </div>
      </Card>

      {/* the total paid counts up */}
      <Card t={t} t0={T.s('total') + 0.05} t1={T.s('exit') - 0.05} top="15%" width={560}>
        <div style={{ textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 30, color: '#fff' }}>TOTAL PAID</div>
        <div style={{ textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 84, color: '#ff4a3d', lineHeight: 1.05 }}>{money(paid)}</div>
      </Card>
      <Card t={t} t0={T.s('total') + 0.3} t1={T.s('exit') - 0.05} top="71%" width={860}>
        <div style={{ textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 28, color: '#e6e9ef', lineHeight: 1.3 }}>MATH: 22% A YEAR · MINIMUM = 1% + INTEREST<br />($35 FLOOR) · NO NEW CHARGES · ~12.2 YEARS</div>
      </Card>

      {/* the way out */}
      <Pill t={t} t0={w('exit', 'printed', 1.5) - 0.1} t1={T.s('final') - 0.05} text="SOURCE: CFPB · ON EVERY STATEMENT" top="14.5%" dot="#7fd36a" />
      <Pill t={t} t0={w('exit', '115', 3) - 0.1} t1={T.s('final') - 0.05} text="$115 A MONTH → DONE IN 3 YEARS" top="21.5%" dot="#2fa84f" />

      {/* same debt, two plans */}
      <Card t={t} t0={T.s('final') + 0.1} t1={tDo - 0.05} top="23.5%" width={860}>
        {([['MINIMUM ONLY', '12+ YEARS', '#ff4a3d', 1], ['$115 A MONTH', '3 YEARS', '#7fd36a', 0.25]] as const).map(([who, yrs, c, len], i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '6px 0' }}>
            <div style={{ width: 250, fontFamily: FONT, fontWeight: 800, fontSize: 28, color: '#fff' }}>{who}</div>
            <div style={{ flex: 1, height: 40, position: 'relative' }}>
              <div style={{ width: `${len * 100}%`, height: '100%', background: c, borderRadius: 10 }} />
            </div>
            <div style={{ width: 200, textAlign: 'right', fontFamily: FONT, fontWeight: 900, fontSize: 30, color: c }}>{yrs}</div>
          </div>
        ))}
        {t >= t29 - 0.1 && (
          <div style={{ marginTop: 8, textAlign: 'center', transform: `scale(${pop(t, t29 - 0.1)})` }}>
            <span style={{ background: '#2fa84f', borderRadius: 16, padding: '6px 22px', fontFamily: FONT, fontWeight: 900, fontSize: 42, color: '#fff' }}>HE KEEPS ≈ $2,900</span>
          </div>
        )}
      </Card>

      {/* the closing question, on screen for sound-off viewers */}
      <Card t={t} t0={tDo - 0.05} t1={T.end + 1} top="24%" width={800}>
        <div style={{ textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 46, color: '#fff', lineHeight: 1.15 }}>DO YOU PAY MORE<br /><span style={{ color: '#ffd21f' }}>THAN THE MINIMUM?</span></div>
      </Card>
    </>
  );
};
