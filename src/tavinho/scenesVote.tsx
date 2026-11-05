import React from 'react';
import { clamp01, easeOutBack, easeOutCubic, lerp } from '../lib/anim';
import type { MoneyTimeline } from '../scenes/money/timeline';
import { INK, ink } from './style';
import { place } from '../toon2d/parts';
import { PAL, TavinhoHead } from './cast';
import type { SceneFC } from './Shell';

const F = 'Montserrat, Arial Black, sans-serif';
const pop = (t: number, t0: number, d = 0.22) => easeOutBack(clamp01((t - t0) / d));
const W = (T: MoneyTimeline, ev: string, w: string, d = 0.5) => T.wordTime(ev, w, T.s(ev) + d);

export type VoteSide = {
  title: string;
  cost: string;
  /** the downside, two short lines, shown from its spoken word */
  risk: [string, string];
  riskWord: string;
  color: string;
  /** the figure standing in the panel (drawn in its own body coords, placed by the scene); focus = this side is being explained */
  figure: (t: number, focus: boolean) => React.ReactNode;
  /** an extra gag while this side is explained (canvas coords) */
  gag?: (t: number) => React.ReactNode;
};

/**
 * The vote screen (events "mission", "video" = left side, "vo" = right side, "decide"), same layout as EP1's reviewed vote:
 * MISSÃO 1 card with Tavinho, then two panels sliding in with title, cost and downside, then the question and his gulp.
 */
export const makeVote = (o: { left: VoteSide; right: VoteSide; question: string; questionWord: string; mission: (t: number) => React.ReactNode; missionLabel?: string }): SceneFC => {
  const Vote: SceneFC = ({ T, t }) => {
    const v0 = T.s('video'), o0 = T.s('vo'), d0 = T.s('decide');
    const left = clamp01((t - v0 + 0.1) / 0.3), right = clamp01((t - o0 + 0.1) / 0.3);
    const focusL = t >= v0 && t < o0, focusR = t >= o0 && t < d0;
    const panel = (s: VoteSide, x0: number, ev: string, focus: boolean, dim: boolean, slide: number, from: number, qa: string) => (
      <g transform={`translate(${lerp(from, 0, easeOutCubic(slide))} 0)`} filter={dim ? 'url(#voteGrey)' : undefined} opacity={dim ? 0.75 : 1}>
        <rect x={x0} y={330} width={540} height={1180} fill={s.color} {...ink(8)} />
        <g transform={place(x0 + 270, 1560, 0.56)}>{s.figure(t, focus)}</g>
        {focus && s.gag?.(t)}
        <rect x={x0 + 60} y={380} width={420} height={110} rx={24} fill="#fff" {...ink(6)} />
        <text data-qa-label={qa} x={x0 + 270} y={458} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={s.title.length > 7 ? 52 : 66} fill={s.color}>{s.title}</text>
        <text data-qa-label={`${qa}-cost`} x={x0 + 270} y={560} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={44} fill="#fff" stroke={INK} strokeWidth={8} paintOrder="stroke">{s.cost}</text>
        {t >= W(T, ev, s.riskWord, 2.5) - 0.1 && (
          <g data-qa-label={`${qa}-risk`}>{s.risk.map((l, i) => <text key={i} x={x0 + 270} y={608 + i * 38} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={34} fill="#fff" stroke={INK} strokeWidth={7} paintOrder="stroke">{l}</text>)}</g>
        )}
      </g>
    );
    return (
      <g>
        <rect x={0} y={0} width={1080} height={1920} fill={PAL.navy} />
        <defs><filter id="voteGrey"><feColorMatrix type="saturate" values="0.15" /></filter></defs>
        {panel(o.left, 0, 'video', focusL, focusR, left, -560, 'left')}
        {panel(o.right, 540, 'vo', focusR, focusL, right, 560, 'right')}
        {/* the empty right half waits with a "?" until the second option arrives */}
        {focusL && right <= 0 && t > v0 + 0.3 && <text x={810} y={1000} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={300} fill="#3a5ba0" opacity={0.7}>?</text>}
        {/* MISSÃO 1 / DIA 1 before the panels arrive */}
        {t < v0 - 0.05 && <g transform={place(540, 1700, 0.55)} opacity={1 - clamp01((t - v0 + 0.25) / 0.2)}>{o.mission(t)}</g>}
        {t < v0 - 0.05 && (
          <g data-qa-label="missao" opacity={1 - clamp01((t - v0 + 0.25) / 0.2)} transform={`translate(540 640) scale(${pop(t, T.s('mission'))})`}>
            <rect x={-300} y={-90} width={600} height={180} rx={30} fill={PAL.mint} {...ink(8)} />
            <text x={0} y={30} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={96} fill="#14171a">{o.missionLabel ?? 'MISSÃO 1'}</text>
          </g>
        )}
        {/* the final question + his gulp in the middle */}
        {t >= d0 && (
          <g>
            <rect x={0} y={330} width={1080} height={1180} fill={PAL.navy} opacity={0.22 * clamp01((t - d0) / 0.2)} />
            <g transform={`translate(540 905) scale(${pop(t, d0)})`}>
              <circle cx={0} cy={0} r={148} fill="#fff4e0" {...ink(8)} />
              <g transform={`scale(${0.36 * (1 + 0.06 * Math.sin(Math.max(0, t - d0 - 1.2) * 18) * Math.exp(-Math.max(0, t - d0 - 1.2) * 3))} ${0.36 * (1 - 0.08 * Math.sin(Math.max(0, t - d0 - 1.2) * 18) * Math.exp(-Math.max(0, t - d0 - 1.2) * 3))}) translate(-540 -840)`}><TavinhoHead t={t} mood="gulp" sweat={1} slip={1} /></g>
              {t > d0 + 1.2 && <text x={120} y={-150} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={56} fill="#fff" stroke="#1b1420" strokeWidth={10} paintOrder="stroke" transform={`rotate(14) scale(${pop(t, d0 + 1.2)})`}>GLUP!</text>}
            </g>
            <g data-qa-label="pergunta" transform={`translate(540 1290) scale(${pop(t, W(T, 'decide', o.questionWord, 1.4) - 0.1)})`}>
              <rect x={-360} y={-70} width={720} height={140} rx={30} fill="#fff" {...ink(8)} />
              <text x={0} y={24} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={o.question.length > 16 ? 54 : 66} fill="#14171a">{o.question}</text>
            </g>
          </g>
        )}
      </g>
    );
  };
  return Vote;
};
