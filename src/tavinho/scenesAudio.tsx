import React from 'react';
import { clamp01, easeOutBack, lerp } from '../lib/anim';
import type { MoneyTimeline } from '../scenes/money/timeline';
import { INK, ink } from './style';
import { place } from '../toon2d/parts';
import { Camila, PAL, SeatedTavinho, Tavinho, Valdir } from './cast';
import { Phone } from './scenes';

/* Episode "O áudio": Tavinho sends a 3-minute rant about his boss... to the boss. */
type P = { T: MoneyTimeline; t: number };
const F = 'Montserrat, Arial Black, sans-serif';
const pop = (t: number, t0: number, d = 0.22) => easeOutBack(clamp01((t - t0) / d));
const W = (T: MoneyTimeline, ev: string, w: string, d = 0.5) => T.wordTime(ev, w, T.s(ev) + d);
const BLUE_TICK = '#2f9bff';

/** A voice-message bubble inside a phone screen (0..560 wide): play button, waveform, duration, ticks. */
const VoiceBubble: React.FC<{ x: number; y: number; w: number; me: boolean; dur: string; played: number; ticks?: 'grey' | 'blue'; s?: number; qa?: string }> = ({ x, y, w, me, dur, played, ticks, s = 1, qa }) => {
  const bars = Array.from({ length: 26 }, (_, i) => 10 + 26 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6)));
  return (
    <g data-qa-label={qa} transform={`translate(${x + (me ? w : 0)} ${y}) scale(${s}) translate(${me ? -w : 0} 0)`}>
      <rect x={0} y={0} width={w} height={110} rx={28} fill={me ? '#3ddc97' : '#ffffff'} {...ink(4)} />
      <circle cx={52} cy={55} r={30} fill="#14171a" />
      <path d="M44 40 L 68 55 L 44 70 Z" fill="#ffffff" />
      {bars.map((h, i) => <rect key={i} x={98 + i * 10.5} y={50 - h / 2} width={6} height={h} rx={3} fill={i / bars.length < played ? '#14171a' : 'rgba(20,23,26,0.35)'} />)}
      <text x={98} y={100} fontFamily={F} fontWeight={800} fontSize={20} fill="#14171a">{dur}</text>
      {ticks && <text x={w - 60} y={100} fontFamily={F} fontWeight={900} fontSize={24} fill={ticks === 'blue' ? BLUE_TICK : '#7d8590'}>✓✓</text>}
    </g>
  );
};

/** A round avatar: the character drawn small and clipped to its circle (ids must be unique per frame). */
export const Avatar: React.FC<{ id: string; x: number; y: number; r?: number; bg?: string; children: React.ReactNode }> = ({ id, x, y, r = 40, bg = '#fff4e0', children }) => (
  <g>
    <clipPath id={id}><circle cx={x} cy={y} r={r - 2} /></clipPath>
    <circle cx={x} cy={y} r={r} fill={bg} {...ink(4)} />
    <g clipPath={`url(#${id})`}><g data-qa-avatar="1" transform={`translate(${x} ${y + 10}) scale(${(0.2 * r) / 40}) translate(-540 -840)`}>{children}</g></g>
    <circle cx={x} cy={y} r={r} fill="none" {...ink(4)} />
  </g>
);

/** Chat header (generic invented app): avatar, name, status line. */
const Header: React.FC<{ name: string; status: React.ReactNode; avatar: React.ReactNode; color: string }> = ({ name, status, avatar, color }) => (
  <g>
    <rect x={0} y={0} width={560} height={140} fill={color} />
    <Avatar id="hdr-av" x={70} y={88}>{avatar}</Avatar>
    <text x={128} y={84} fontFamily={F} fontWeight={900} fontSize={30} fill="#fff">{name}</text>
    {status}
  </g>
);

/** Tavinho standing small at the left, in front of the giant phone (his reactions in the phone shots). */
const SideTavinho: React.FC<{ t: number; friday: boolean }> = ({ t, friday }) => (
  <g transform={place(190, 1700, 0.5)}><Tavinho t={t} mood="worried" sweat={1} slip={0.7} outfit={friday ? 'work' : 'pajama'} /></g>
);

/* ------------------------------------------------------------------ the chat with Seu Valdir (day 1: sent, not heard yet; then he comes online) */
export const AudioChat: React.FC<P> = ({ T, t }) => {
  const sent = T.s('punch') - 0.1;
  const detail0 = T.s('detail'), detail1 = T.s('follow');
  const played = t >= detail0 ? clamp01((t - detail0) / Math.max(0.5, detail1 - detail0)) : 0;
  // he comes online on the twist ("ficar online")
  const on = T.s('twist') + 0.3;
  const online = t >= on;
  return (
    <g>
      <rect x={0} y={0} width={1080} height={1920} fill={PAL.navy} />
      <Phone x={260} y={310} s={1} glow={1}>
        <rect x={0} y={0} width={560} height={1100} fill="#ece5dc" />
        <Header name="Seu Valdir 👔" color="#3a5ba0" avatar={<Valdir t={t} mood="neutral" beach />}
          status={online
            ? <g><circle cx={136} cy={110} r={9} fill="#3ddc97" opacity={0.7 + 0.3 * Math.sin(t * 10)} /><text x={154} y={118} fontFamily={F} fontWeight={900} fontSize={24} fill="#b9ffd9">online</text></g>
            : <text x={128} y={118} fontFamily={F} fontWeight={700} fontSize={20} fill="#fff4e0">visto por último ontem 🏖️</text>} />
        <text x={280} y={182} textAnchor="middle" fontFamily={F} fontWeight={700} fontSize={18} fill="#7d8590">SEXTA 18:04</text>
        {t >= sent && <VoiceBubble x={100} y={200} w={440} me dur={t >= detail0 ? `${Math.floor(played * 3)}:${String(Math.floor((played * 192) % 60)).padStart(2, '0')} / 3:12` : '3:12'} played={played} ticks="grey" s={pop(t, sent)} qa="audio" />}
        {/* the input bar */}
        <rect x={16} y={980} width={528} height={86} rx={43} fill="#ffffff" {...ink(4)} />
      </Phone>
      {/* "3:12 de sinceridade" sticker during the detail beat */}
      {t >= detail0 && t < W(T, 'detail', 'sinceridade', 2.0) - 0.05 && (
        <g data-qa-label="sinceridade" transform={`translate(560 720) rotate(-4) scale(${pop(t, detail0)})`}>
          <rect x={-250} y={-46} width={500} height={92} rx={20} fill={PAL.orange} {...ink(6)} />
          <text x={0} y={16} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={44} fill="#fff">3:12 DE SINCERIDADE</text>
        </g>
      )}
      {/* ONLINE, huge, on "online": the ticks are still grey, he hasn't heard it... yet */}
      {online && t < T.s('percent') - 0.05 && (
        <g data-qa-label="online" transform={`translate(700 640) rotate(4) scale(${pop(t, on)})`}>
          <rect x={-200} y={-62} width={400} height={124} rx={62} fill="#3ddc97" {...ink(7)} />
          <circle cx={-130} cy={0} r={22} fill="#ffffff" opacity={0.6 + 0.4 * Math.sin(t * 10)} {...ink(4)} />
          <text x={30} y={20} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={60} fill="#14171a">ONLINE</text>
        </g>
      )}
      <SideTavinho t={t} friday />
    </g>
  );
};

/* ------------------------------------------------------------------ Seu Valdir on holiday at the beach; the meeting on day 12 */
export const Office: React.FC<P> = ({ T, t }) => {
  const cal = W(T, 'stakes', 'marcou', 2.6) - 0.1;
  const twelve = W(T, 'stakes', 'volta', 0.8) - 0.1;
  return (
    <g>
      {/* sky, sun, sea, sand */}
      <rect x={0} y={0} width={1080} height={1920} fill="#8fd6ff" />
      <circle cx={860} cy={300} r={110} fill="#ffe08a" {...ink(5)} />
      <rect x={0} y={880} width={1080} height={300} fill="#3aa0c8" />
      {Array.from({ length: 5 }, (_, i) => <path key={i} d={`M${((i * 260 + t * 40) % 1300) - 120} ${940 + (i % 3) * 70} q 40 -24 80 0 q 40 24 80 0`} fill="none" stroke="#e9f6ff" strokeWidth={8} strokeLinecap="round" />)}
      <path d="M0 1160 C 300 1120 780 1130 1080 1170 L 1080 1920 L 0 1920 Z" fill="#f2d49a" {...ink(6)} />
      {/* beach umbrella and a towel */}
      <path d="M160 1700 L 250 900" stroke="#6b4a2c" strokeWidth={16} strokeLinecap="round" />
      <path d="M40 980 C 120 800 420 780 470 930 Z" fill="#e2453c" {...ink(7)} />
      <path d="M150 870 C 200 900 250 925 300 935 M 260 820 C 290 870 320 900 370 920" fill="none" stroke="#fff4e0" strokeWidth={16} />
      <rect x={640} y={1700} width={360} height={120} rx={16} fill="#ffd166" transform="rotate(-6 820 1760)" {...ink(6)} />
      {/* Seu Valdir in a flowered shirt, a coconut in hand */}
      <g transform={place(500, 1700, 0.62)}>
        <Valdir t={t} mood={t >= cal ? 'proud' : 'happy'} beach armR={[[X1(690), 1150], [800, 1300], [760, 1200]]}
          holdR={<g transform="translate(10 -80)"><circle cx={0} cy={0} r={70} fill="#7a4a2c" {...ink(6)} /><path d="M-30 -60 L 20 -150" stroke="#ff5fb0" strokeWidth={12} strokeLinecap="round" /><path d="M20 -150 l 26 -12" stroke="#ff5fb0" strokeWidth={12} strokeLinecap="round" /></g>} />
      </g>
      {/* "VOLTA EM 12 DIAS" */}
      {t >= twelve && t < cal && (
        <g data-qa-label="doze" transform={`translate(800 560) rotate(5) scale(${pop(t, twelve)})`}>
          <circle cx={0} cy={0} r={130} fill={PAL.orange} {...ink(8)} />
          <text x={0} y={10} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={110} fill="#fff">12</text>
          <text x={0} y={70} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={40} fill="#fff">DIAS</text>
        </g>
      )}
      {/* his phone calendar: DIA 12 · REUNIÃO: TAVINHO */}
      {t >= cal && (
        <g data-qa-label="calendario" transform={`translate(790 560) rotate(4) scale(${pop(t, cal)})`}>
          <rect x={-200} y={-230} width={400} height={440} rx={22} fill="#ffffff" {...ink(8)} />
          <rect x={-200} y={-230} width={400} height={96} rx={22} fill="#c8322a" />
          <text x={0} y={-166} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={44} fill="#fff">DIA 12</text>
          <text x={0} y={-10} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={60} fill="#14171a">REUNIÃO</text>
          <text x={0} y={70} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={44} fill="#c8322a">COM TAVINHO</text>
          <text x={0} y={150} textAnchor="middle" fontFamily={F} fontWeight={800} fontSize={34} fill="#7d8590">9h · sem atraso 🙂</text>
        </g>
      )}
    </g>
  );
};
const X1 = (x: number) => 540 + (x - 540) * 1.08;

/* ------------------------------------------------------------------ Friday 6 p.m. (sepia flashback): the rant */
export const Friday: React.FC<P> = ({ T, t }) => {
  const cara = W(T, 'rant', 'cara', 1.6);
  const imit = T.s('rant2');
  const stache = t >= imit ? pop(t, W(T, 'rant2', 'imitou', 0.6) - 0.1) : 0;
  return (
    <g>
      <rect x={0} y={0} width={1080} height={1920} fill="#e8d2ab" />
      {/* sunset window */}
      <rect x={640} y={260} width={340} height={420} rx={10} fill="#ffb86b" {...ink(8)} />
      <circle cx={810} cy={560} r={70} fill="#ffe08a" />
      <path d="M810 260 L 810 680 M 640 470 L 980 470" stroke="#1b1420" strokeWidth={8} />
      <rect x={0} y={1500} width={1080} height={420} fill="#b98a5a" />
      {/* sofa back and seat (behind him) */}
      <rect x={110} y={1030} width={860} height={400} rx={60} fill="#c8643a" {...ink(8)} />
      <rect x={70} y={1380} width={940} height={180} rx={40} fill="#d9774a" {...ink(8)} />
      {/* sofa front + arms, then Tavinho sitting on its edge, the phone at his mouth, recording */}
      <rect x={70} y={1500} width={940} height={110} rx={30} fill="#c8643a" {...ink(8)} />
      {[90, 990].map((x, i) => <rect key={i} x={x - 70} y={1150} width={140} height={460} rx={50} fill="#b8552f" {...ink(8)} />)}
      <g transform={place(540, 1720, 0.62)}>
        <SeatedTavinho t={t} mood={t >= imit ? 'proud' : 'happy'} sweat={0} stache={stache}
          armR={[[720, 1150], [830, 1250], [650, 1140]]}
          holdR={<g transform="translate(-10 -30) rotate(-14)"><rect x={-50} y={-90} width={100} height={170} rx={16} fill="#20232c" {...ink(5)} /><rect x={-38} y={-78} width={76} height={140} rx={10} fill="#bfe6ff" /><circle cx={0} cy={-8} r={18} fill="#ff4a3d" opacity={0.6 + 0.4 * Math.sin(t * 10)} /></g>} />
      </g>
      {/* "GRAVANDO" mic sticker while he records the rant */}
      {t >= T.s('rant') && t < T.s('card') && (
        <g data-qa-label="gravando" transform={`translate(740 940) rotate(6) scale(${0.8 * pop(t, T.s('rant'))})`}>
          <rect x={-130} y={-40} width={260} height={80} rx={40} fill="#e2453c" {...ink(6)} />
          <text x={0} y={14} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={34} fill="#fff">{`🎤 0:${String(Math.min(59, Math.floor((t - T.s('rant')) * 9))).padStart(2, '0')}`}</text>
        </g>
      )}
      {/* the rant bubble + the potato with a mustache */}
      {t >= T.s('rant') && t < imit && (
        <g data-qa-label="batata" transform={`translate(560 470) scale(${pop(t, W(T, 'rant', 'esse', 1.2) - 0.1)})`}>
          <path d="M-380 -110 L 380 -110 Q 420 -110 420 -70 L 420 80 Q 420 120 380 120 L 40 120 L -20 200 L -10 120 L -380 120 Q -420 120 -420 80 L -420 -70 Q -420 -110 -380 -110 Z" fill="#fff" {...ink(7)} />
          <text x={-120} y={-20} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={44} fill="#14171a">ESSE HOMEM TEM</text>
          <text x={-120} y={44} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={44} fill="#c8322a">CARA DE BATATA!</text>
          {t >= cara - 0.1 && (
            <g transform={`translate(270 10) scale(${pop(t, cara - 0.1)}) rotate(${8 * Math.sin(t * 5)})`}>
              <ellipse cx={0} cy={0} rx={110} ry={86} fill="#c99a5b" {...ink(6)} />
              {[[-50, -30], [40, -50], [60, 30], [-30, 40]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={7} fill="#8a6230" />)}
              <circle cx={-28} cy={-10} r={9} fill={INK} /><circle cx={28} cy={-10} r={9} fill={INK} />
              <path d="M0 12 C -24 0 -58 6 -66 26 C -40 20 -18 24 0 26 C 18 24 40 20 66 26 C 58 6 24 0 0 12 Z" fill="#bdbdc6" {...ink(4)} />
            </g>
          )}
        </g>
      )}
      {/* imitating the boss: deep-voice bubble */}
      {t >= imit && t < T.s('card') && (
        <g data-qa-label="imitacao" transform={`translate(560 470) scale(${pop(t, imit + 0.1)}) rotate(-2)`}>
          <path d="M-360 -100 L 360 -100 Q 400 -100 400 -60 L 400 70 Q 400 110 360 110 L 40 110 L -20 190 L -10 110 L -360 110 Q -400 110 -400 70 L -400 -60 Q -400 -100 -360 -100 Z" fill="#fff" {...ink(7)} />
          <text x={0} y={-8} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={46} fill="#14171a">"RELATÓRIO</text>
          <text x={0} y={56} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={46} fill="#14171a">PRA SEGUNDA!"</text>
        </g>
      )}
    </g>
  );
};

/* ------------------------------------------------------------------ the chat list: the boss sits right above Camila */
export const Contacts: React.FC<P> = ({ T, t }) => {
  const tap = T.s('card') + 0.05;
  const rows: [string, string, React.ReactNode][] = [
    ['Seu Valdir 👔', 'relatório pra segunda', <Valdir key="v" t={t} mood="neutral" />],
    ['Camila 💛', 'kkkk tô chegando', <Camila key="c" t={t} mood="happy" />],
    ['Mãe', 'leva casaco', null],
  ];
  return (
    <g>
      <rect x={0} y={0} width={1080} height={1920} fill={PAL.navy} />
      <Phone x={260} y={310} s={1} glow={1}>
        <rect x={0} y={0} width={560} height={140} fill={PAL.orange} />
        <text x={40} y={100} fontFamily={F} fontWeight={900} fontSize={40} fill="#fff">Conversas</text>
        {rows.map(([name, last, av], i) => {
          const y = 160 + i * 140;
          const wrong = i === 0 && t >= tap;
          return (
            <g key={i}>
              <rect x={10} y={y} width={540} height={124} rx={18} fill={wrong ? '#ffe2df' : '#ffffff'} stroke={wrong ? '#e2453c' : 'none'} strokeWidth={6} />
              {av ? <Avatar id={`row-av-${i}`} x={70} y={y + 62} r={44} bg={['#3a5ba0', '#f2b33d'][i]}>{av}</Avatar> : <circle cx={70} cy={y + 62} r={44} fill="#c9a6ff" {...ink(4)} />}
              <text x={132} y={y + 54} fontFamily={F} fontWeight={900} fontSize={28} fill="#14171a">{name}</text>
              <text x={132} y={y + 92} fontFamily={F} fontWeight={700} fontSize={22} fill="#7d8590">{wrong ? '🎤 áudio 3:12 ✓✓' : last}</text>
            </g>
          );
        })}
        {/* the tap ripple on the wrong chat */}
        {t >= tap && t < tap + 0.9 && <circle cx={300} cy={222} r={20 + 160 * clamp01((t - tap) / 0.6)} fill="#e2453c" opacity={0.35 * (1 - clamp01((t - tap) / 0.9))} />}
      </Phone>
      <SideTavinho t={t} friday />
    </g>
  );
};
