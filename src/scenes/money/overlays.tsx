import React from 'react';
import { AbsoluteFill } from 'remotion';
import { clamp01, easeInOutSine, easeOutBack, lerp } from '../../lib/anim';
import type { Timings } from '../../types';
import { HootBadge } from '../../overlays/HootBadge';
import { Pill } from '../learjet/overlays';
import { CirclePill } from '../sleep/overlays';
import type { MoneyTimeline } from './timeline';

const FONT = "'Montserrat', 'Arial Black', sans-serif";

/** Year in one format everywhere: "3000 BC" / "600 AD" / "2026 AD" (rounded to tens while it spins). */
const fmtYear = (y: number, exact: boolean) => {
  if (y <= -1250) return 'LONG AGO';
  const r = exact ? Math.round(y) : Math.round(y / 10) * 10;
  return r < 0 ? `${Math.abs(r)} BC` : `${Math.max(1, r)} AD`;
};

/**
 * Year counter. It appears on "go back" holding 2026 AD, spins back to 3000 BC on the cut to the
 * barter scene, then races forward through "So people used things everyone wanted" and lands
 * exactly on 1200 BC at "Shells" and 600 BC at "coins".
 */
const yearAt = (T: MoneyTimeline, t: number): [number, boolean] => {
  const rw = T.s('barter');
  const ws = T.wordTime('coins', 'shells', T.s('coins') + 1.9), wc = T.wordTime('coins', 'coins', T.s('coins') + 2.6);
  const k: [number, number][] = [
    [rw + 0.15, 2026], [rw + 1.0, -3000],
    [T.s('coins') + 0.1, -3000], [ws, -1200],
    [wc - 0.12, -1200], [wc, -600],
    [T.wordTime('china', 'china', T.s('china') + 1.2) - 0.3, -600], [T.wordTime('china', 'china', T.s('china') + 1.2), 1000],
    [T.s('gold') - 0.05, 1000], [T.s('gold') + 0.3, 1900],
    [T.wordTime('gold', '1971', T.s('gold') + 3.2) - 0.3, 1900], [T.wordTime('gold', '1971', T.s('gold') + 3.2), 1971],
  ];
  if (t <= k[0][0]) return [k[0][1], true];
  for (let i = 1; i < k.length; i++) if (t <= k[i][0]) {
    const moving = k[i - 1][1] !== k[i][1];
    return [lerp(k[i - 1][1], k[i][1], easeInOutSine(clamp01((t - k[i - 1][0]) / Math.max(0.01, k[i][0] - k[i - 1][0])))), !moving];
  }
  return [k[k.length - 1][1], true];
};

/** Two arrows swapping (drawn with shapes, not glyphs) with a label; a red X stamp lands on top. */
const SwapCard: React.FC<{ t: number; t0: number; t1: number; tX: number; top: string; left?: string; right?: string; shift?: number }> = ({ t, t0, t1, tX, top, left = 'FISH', right = 'SHOES', shift = 0 }) => {
  if (t < t0 || t > t1) return null;
  const p = easeOutBack(clamp01((t - t0) / 0.25));
  const x = clamp01((t - tX) / 0.18);
  const xs = x > 0 ? lerp(1.4, 1, x) : 0;
  const arrow = (dir: 1 | -1) => (
    <div style={{ display: 'flex', alignItems: 'center', flexDirection: dir === 1 ? 'row' : 'row-reverse' }}>
      <div style={{ width: 150, height: 12, background: dir === 1 ? '#ffd21f' : '#7fd36a', borderRadius: 6 }} />
      <div style={{ width: 0, height: 0, borderTop: '18px solid transparent', borderBottom: '18px solid transparent', [dir === 1 ? 'borderLeft' : 'borderRight']: `28px solid ${dir === 1 ? '#ffd21f' : '#7fd36a'}` } as React.CSSProperties} />
    </div>
  );
  return (
    <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', top, opacity: clamp01((t1 - t) / 0.06) }}>
      <div style={{ position: 'relative', transform: `translateX(${shift}px) scale(${p})`, background: 'rgba(10,12,16,0.72)', borderRadius: 30, padding: '14px 34px', display: 'flex', alignItems: 'center', gap: 22 }}>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 40, color: '#fff' }}>{left}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{arrow(1)}{arrow(-1)}</div>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 40, color: '#fff' }}>{right}</div>
        {x > 0 && (
          <div style={{ position: 'absolute', left: '50%', top: '50%', transform: `translate(-50%,-50%) scale(${xs})`, opacity: x }}>
            {[45, -45].map((r) => <div key={r} style={{ position: 'absolute', left: -70, top: -12, width: 140, height: 24, borderRadius: 12, background: '#ff3b30', boxShadow: '0 4px 10px rgba(0,0,0,0.4)', transform: `rotate(${r}deg)` }} />)}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

/** Overlays for the standalone money video (no series chip). */
export const MoneyOverlays: React.FC<{ timings: Timings; T: MoneyTimeline; t: number }> = ({ T, t }) => {
  const s = T.s;
  const w = (ev: string, word: string, d: number) => T.wordTime(ev, word, d);
  const barter = s('barter'), coins = s('coins');
  const back = w('hook', 'back', s('hook') + 4.4);
  const inBarter = t >= barter && t < coins;
  const flash = t >= barter - 0.05 && t < barter + 0.4;
  const showYear = t >= back && t < s('answer', s('coins') + 16);
  const [year, exact] = yearAt(T, t);
  const yearIn = easeOutBack(clamp01((t - back) / 0.25));
  return (
    <>
      {/* warm sepia grade for the flash-back */}
      {inBarter && <AbsoluteFill style={{ background: 'rgba(170,110,40,0.16)', mixBlendMode: 'multiply' }} />}
      {flash && <AbsoluteFill style={{ background: `rgba(255,255,255,${0.75 * (1 - clamp01((t - barter) / 0.4))})` }} />}
      <HootBadge t={t} />

      {/* B1 hook */}
      <CirclePill t={t} t0={w('hook', 'cents', s('hook') + 1.0) - 0.15} t1={back - 0.15} before="" circled="7.3¢" after="· FEDERAL RESERVE" top="25%" dot="#ff4a3d" />

      {/* rewind: starts on "go back", the white flash lands on the cut */}
      {t >= back && t < barter + 1.3 && (
        <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', top: '16.6%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(10,12,16,0.75)', borderRadius: 30, padding: '8px 26px', transform: `scale(${yearIn})` }}>
            {[0, 1].map((i) => <div key={i} style={{ width: 0, height: 0, borderTop: '18px solid transparent', borderBottom: '18px solid transparent', borderRight: `28px solid ${Math.floor(t * 6) % 2 === i ? '#ffd21f' : '#ffffff'}` }} />)}
            <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 40, color: '#fff', letterSpacing: 3, marginLeft: 8 }}>REWIND</div>
          </div>
        </AbsoluteFill>
      )}
      {showYear && (
        <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', top: '11%' }}>
          <div style={{ background: 'rgba(10,12,16,0.72)', border: '3px solid rgba(255,255,255,0.75)', borderRadius: 18, padding: '4px 26px', fontFamily: FONT, fontWeight: 900, fontSize: 58, color: '#ffd21f', letterSpacing: 2, transform: `scale(${yearIn})` }}>{fmtYear(year, exact)}</div>
        </AbsoluteFill>
      )}

      {/* B2 barter */}
      <SwapCard t={t} t0={w('barter', 'fish', barter + 1.6) - 0.15} t1={coins - 0.02} tX={w('barter', 'hate', barter + 3.2) + 0.05} top="20.5%" />

      {/* B3 shells → coins: one card whose rows stack up on their words and stay to the end of the beat */}
      {t >= w('coins', 'shells', coins + 1.9) - 0.05 && t < s('china', coins + 6) - 0.05 && (
        <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', top: '22%', opacity: clamp01((s('china', coins + 6) - 0.05 - t) / 0.2) }}>
          <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 28, padding: '14px 30px 10px', boxShadow: '0 6px 18px rgba(0,0,0,0.3)', minWidth: 560, transform: `scale(${easeOutBack(clamp01((t - w('coins', 'shells', coins + 1.9) + 0.05) / 0.2))})` }}>
            {([['shells', '~1200 BC', 'COWRIE SHELLS', '#f6efe0'], ['coins', '~600 BC', 'FIRST COINS (LYDIA)', '#f0c040']] as const).map(([word, when, what, dot]) => {
              const t0 = w('coins', word, coins + 2) - 0.05;
              if (t < t0) return null;
              const p = word === 'shells' ? 1 : easeOutBack(clamp01((t - t0) / 0.2));
              return (
                <div key={word} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '4px 0', transform: `scale(${p})`, transformOrigin: 'left center' }}>
                  <div style={{ width: 18, height: 18, borderRadius: 9, background: dot, border: '3px solid #14171a' }} />
                  <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 38, color: '#d6281c', width: 215, whiteSpace: 'nowrap' }}>{when}</div>
                  <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 38, color: '#14171a' }}>{what}</div>
                </div>
              );
            })}
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 20, color: '#6b7280', textAlign: 'right', marginTop: 4 }}>SOURCE: BRITANNICA</div>
          </div>
        </AbsoluteFill>
      )}
      <Pill t={t} t0={w('coins', 'worth', coins + 3.9) - 0.45} t1={s('china', coins + 6) - 0.05} text="THE METAL ITSELF HAD VALUE" top="31%" dot="#f0c040" />

      {/* B4 China: heavy → paper you can swap for coins */}
      <Pill t={t} t0={w('china', 'heavy', s('china') + 0.6) - 0.1} t1={w('china', 'heavy', s('china') + 0.6) + 1.6} text="HEAVY!" top="20.5%" dot="#ff4a3d" />
      <SwapCard t={t} t0={w('china', 'promises', s('china') + 2.1) - 0.05} shift={40} t1={s('gold', s('china') + 4) - 0.02} tX={1e9} top="20.5%" left="PAPER" right="COINS" />
      <Pill t={t} t0={w('china', 'paper', s('china') + 1.85) - 0.1} t1={s('gold', s('china') + 4) - 0.05} text="~1000 AD · PAPER MONEY, CHINA" top="27.5%" dot="#c8322a" />

      {/* B5 gold: backed by gold → 1971 */}
      <Pill t={t} t0={w('gold', 'backed', s('gold') + 1.8) - 0.1} t1={w('gold', 'cut', s('gold') + 4.4) - 0.1} text="$1 = A FIXED AMOUNT OF GOLD" top="20.5%" dot="#f0c040" />
      <Pill t={t} t0={w('gold', '1971', s('gold') + 3.2)} t1={s('answer', s('gold') + 6) - 0.05} text="SOURCE: FEDERAL RESERVE HISTORY" top="26.5%" dot="#ffffff" />

      {/* B6 answer: 7¢ of paper, worth $20 because of the law… and trust */}
      <Pill t={t} t0={w('answer', '7', s('answer') + 1.4) - 0.1} t1={w('answer', 'law', s('answer') + 3.2) - 0.02} text="PAPER + INK = 7¢" top="13%" dot="#ff4a3d" />
      {t >= w('answer', 'law', s('answer') + 3.2) - 0.05 && t < w('answer', 'trusts', s('answer') + 6) - 0.05 && (
        <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', top: '13%' }}>
          <div style={{ display: 'flex', gap: 18 }}>
            {([['debt', 'DEBTS'], ['tax', 'TAXES']] as const).map(([word, label]) => {
              const p = easeOutBack(clamp01((t - w('answer', word, s('answer') + 4.3) + (word === 'debt' ? 0.4 : 0.3)) / 0.2));
              return (
                <div key={word} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.96)', borderRadius: 30, padding: '10px 24px', boxShadow: '0 6px 18px rgba(0,0,0,0.3)', transform: `scale(${p})` }}>
                  <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 42, color: '#14171a' }}>{label}</div>
                  <div style={{ width: 40, height: 40, borderRadius: 20, background: '#2fa84f', position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 9, top: 18, width: 12, height: 5, background: '#fff', borderRadius: 3, transform: 'rotate(45deg)' }} />
                    <div style={{ position: 'absolute', left: 14, top: 15, width: 20, height: 5, background: '#fff', borderRadius: 3, transform: 'rotate(-50deg)' }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 14, fontFamily: FONT, fontWeight: 800, fontSize: 24, color: '#fff', background: 'rgba(10,12,16,0.7)', borderRadius: 14, padding: '6px 16px' }}>US LAW: 31 U.S.C. § 5103</div>
        </AbsoluteFill>
      )}
      {/* trust chain: the note hops person to person on "everyone trusts the next person will take it" */}
      {(() => {
        const t0 = w('answer', 'trusts', s('answer') + 6) - 0.05, t1 = s('final', s('answer') + 8) - 0.05;
        if (t < t0 || t > t1) return null;
        const hop = clamp01((t - w('answer', 'trusts', s('answer') + 6) - 0.2) / Math.max(0.5, w('answer', 'take', s('answer') + 7.4) - w('answer', 'trusts', s('answer') + 6)));
        const n = 4, at = hop * (n - 1);
        const colors = ['#e2553c', '#2f6fd6', '#21b3a0', '#f0b429'];
        return (
          <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', top: '13.4%', opacity: clamp01((t1 - t) / 0.15) }}>
            <div style={{ background: 'rgba(10,12,16,0.78)', borderRadius: 30, padding: '30px 26px 12px', transform: `scale(${1.2 * easeOutBack(clamp01((t - t0) / 0.25))})`, transformOrigin: 'top center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 22, position: 'relative' }}>
                {colors.map((c, i) => {
                  const got = at >= i - 0.05;
                  return (
                    <div key={i} style={{ width: 92, height: 92, borderRadius: 46, background: got ? c : '#4a4f5a', border: '5px solid #fff', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', left: 28, top: 14, width: 36, height: 36, borderRadius: 18, background: '#f3c29b' }} />
                      <div style={{ position: 'absolute', left: 14, top: 54, width: 64, height: 46, borderRadius: 30, background: got ? '#ffffff' : '#9aa0aa', opacity: 0.85 }} />
                    </div>
                  );
                })}
                <div style={{ position: 'absolute', left: 6 + at * 114, top: -30, width: 82, height: 40, background: '#a8d8a8', border: '4px solid #14171a', borderRadius: 4, transform: `rotate(${-8 + 16 * Math.sin(hop * Math.PI * 6)}deg)` }} />
              </div>
              <div style={{ textAlign: 'center', marginTop: 8, fontFamily: FONT, fontWeight: 900, fontSize: 34, color: '#ffd21f', letterSpacing: 2 }}>TRUST</div>
            </div>
          </AbsoluteFill>
        );
      })()}

      {/* B7 ending: the ask */}
      <Pill t={t} t0={w('final', 'would', s('final') + 1.7) - 0.05} t1={T.end} text="STILL TAKE IT? YES / NO" top="25%" dot="#7fd36a" />
    </>
  );
};
