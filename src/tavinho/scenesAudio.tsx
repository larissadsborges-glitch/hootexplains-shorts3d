import React from 'react';
import { clamp01, easeOutBack, lerp } from '../lib/anim';
import type { MoneyTimeline } from '../scenes/money/timeline';
import { INK, ink } from '../toon2d/Hook2D';
import { place } from '../toon2d/parts';
import { Camila, PAL, Tavinho, Valdir } from './cast';
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

/* ------------------------------------------------------------------ the chat with Seu Valdir */
export const AudioChat: React.FC<P> = ({ T, t }) => {
  const sent = T.s('punch') - 0.1;
  const blue = W(T, 'twist', 'risquinhos', 1.6);
  const rec = T.s('twist2'), reply = T.s('noreturn');
  const menu0 = T.s('truth'), menuOut = T.s('twist');
  const del = W(T, 'truth', 'apagar', 0.9);
  const detail0 = T.s('detail'), detail1 = T.s('follow');
  const played = t >= detail0 ? clamp01((t - detail0) / Math.max(0.5, detail1 - detail0)) : 0;
  const recSecs = t >= rec ? Math.min(247, Math.floor((t - rec) / Math.max(0.5, reply - rec) * 247)) : 0;
  const recording = t >= rec && t < reply;
  return (
    <g>
      <rect x={0} y={0} width={1080} height={1920} fill={PAL.navy} />
      <Phone x={260} y={310} s={1} glow={1}>
        <rect x={0} y={0} width={560} height={1100} fill="#ece5dc" />
        <Header name="Seu Valdir 👔" color="#3a5ba0" avatar={<Valdir t={t} mood="neutral" />}
          status={recording
            ? <g><circle cx={136} cy={110} r={8} fill="#ff4a3d" opacity={0.6 + 0.4 * Math.sin(t * 12)} /><text x={152} y={118} fontFamily={F} fontWeight={800} fontSize={22} fill="#ffd6d2">{`gravando áudio… ${Math.floor(recSecs / 60)}:${String(recSecs % 60).padStart(2, '0')}`}</text></g>
            : <text x={128} y={118} fontFamily={F} fontWeight={700} fontSize={22} fill="#fff4e0">online</text>} />
        <text x={280} y={182} textAnchor="middle" fontFamily={F} fontWeight={700} fontSize={18} fill="#7d8590">SEXTA 18:02</text>
        {t >= sent && <VoiceBubble x={100} y={200} w={440} me dur={t >= detail0 ? `${Math.floor(played * 3)}:${String(Math.floor((played * 192) % 60)).padStart(2, '0')} / 3:12` : '3:12'} played={played} ticks={t >= blue ? 'blue' : 'grey'} s={pop(t, sent)} qa="audio" />}
        {/* his reply: a longer voice message */}
        {t >= reply && <VoiceBubble x={20} y={340} w={440} me={false} dur="4:07" played={0} s={pop(t, reply)} qa="resposta" />}
        {/* the input bar: his mic recording while "gravando áudio…" */}
        <rect x={16} y={980} width={528} height={86} rx={43} fill="#ffffff" {...ink(4)} />
        <text x={44} y={1036} fontFamily={F} fontWeight={700} fontSize={28} fill="#7d8590">Mensagem</text>
        {/* long-press menu: "Apagar para todos" */}
        {t >= menu0 && t < menuOut && (
          <g transform={`translate(280 520) scale(${pop(t, menu0)}) translate(-280 -520)`}>
            <rect x={0} y={140} width={560} height={960} fill="#000" opacity={0.25} />
            <rect x={70} y={340} width={420} height={300} rx={24} fill="#ffffff" {...ink(5)} />
            {['Responder', 'Encaminhar', 'Apagar para mim', 'Apagar para todos'].map((l, i) => {
              const hot = i === 3 && t >= del - 0.1;
              return (
                <g key={i}>
                  {hot && <rect x={80} y={352 + i * 70} width={400} height={64} rx={14} fill="#ffe2df" />}
                  <text x={104} y={396 + i * 70} fontFamily={F} fontWeight={i === 3 ? 900 : 700} fontSize={i === 3 ? 30 : 28} fill={i >= 2 ? '#c8322a' : '#14171a'}>{l}</text>
                </g>
              );
            })}
            {t >= del && <text data-qa-label="apagando" x={280} y={690} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={30} fill="#fff" stroke={INK} strokeWidth={6} paintOrder="stroke">apagando… ⏳</text>}
          </g>
        )}
      </Phone>
      {/* "3:12 de sinceridade" sticker during the detail beat */}
      {t >= detail0 && t < T.s('follow') - 0.05 && (
        <g data-qa-label="sinceridade" transform={`translate(560 720) rotate(-4) scale(${pop(t, detail0)})`}>
          <rect x={-250} y={-46} width={500} height={92} rx={20} fill={PAL.orange} {...ink(6)} />
          <text x={0} y={16} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={44} fill="#fff">3:12 DE SINCERIDADE</text>
        </g>
      )}
      {/* the two blue ticks, huge, on "azuis" */}
      {t >= blue && t < T.s('noreturn') && (
        <g data-qa-label="azuis" transform={`translate(720 620) scale(${1.6 * pop(t, blue)})`}>
          <circle cx={0} cy={0} r={70} fill="#ffffff" {...ink(6)} />
          <text x={0} y={22} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={64} fill={BLUE_TICK}>✓✓</text>
        </g>
      )}
      <SideTavinho t={t} friday={t >= T.s('card') && t < T.s('percent')} />
    </g>
  );
};

/* ------------------------------------------------------------------ the boss's office: Monday 9 a.m. */
export const Office: React.FC<P> = ({ T, t }) => {
  const seg = W(T, 'stakes', 'segunda', 1.0);
  return (
    <g>
      <rect x={0} y={0} width={1080} height={1920} fill="#d9cdb5" />
      <rect x={0} y={1250} width={1080} height={670} fill="#8a6a4a" />
      {/* window with the city */}
      <rect x={90} y={300} width={360} height={420} rx={10} fill="#9fd0ff" {...ink(8)} />
      {[[120, 520, 70, 200], [210, 460, 90, 260], [320, 560, 100, 160]].map(([x, y, w, h], i) => <rect key={i} x={x} y={y} width={w} height={h} fill="#6d86b5" {...ink(4)} />)}
      <path d="M270 300 L 270 720 M 90 510 L 450 510" stroke="#1b1420" strokeWidth={8} />
      {/* wall clock */}
      <g transform="translate(560 380)"><circle r={70} fill="#fff" {...ink(7)} /><path d={`M0 0 L ${40 * Math.sin(t * 0.8)} ${-40 * Math.cos(t * 0.8)} M0 0 L 0 -52`} stroke={INK} strokeWidth={8} strokeLinecap="round" /></g>
      {/* the calendar: MONDAY circled */}
      <g data-qa-label="calendario" transform={`translate(820 520) rotate(3)`}>
        <rect x={-150} y={-190} width={300} height={360} rx={14} fill="#ffffff" {...ink(7)} />
        <rect x={-150} y={-190} width={300} height={80} rx={14} fill="#c8322a" />
        <text x={0} y={-135} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={40} fill="#fff">SEGUNDA</text>
        <text x={0} y={10} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={110} fill="#14171a">9h</text>
        <text x={0} y={100} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={42} fill="#c8322a">REUNIÃO</text>
        {t >= seg && <ellipse cx={0} cy={-10} rx={120} ry={90} fill="none" stroke="#e2453c" strokeWidth={10} strokeDasharray={`${640 * clamp01((t - seg) / 0.4)} 640`} transform="rotate(-8)" />}
      </g>
      {/* Seu Valdir behind his desk */}
      <g transform={place(480, 1720, 0.62)}><Valdir t={t} mood={t >= seg ? 'worried' : 'neutral'} /></g>
      <rect x={60} y={1260} width={960} height={60} rx={12} fill="#6b4a2c" {...ink(8)} />
      <rect x={100} y={1316} width={880} height={420} fill="#5a3d24" {...ink(7)} />
      {/* name plate + mug */}
      <g data-qa-label="placa" transform="translate(480 1236)"><rect x={-170} y={-40} width={340} height={70} rx={10} fill="#d4b26a" {...ink(5)} /><text x={0} y={8} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={30} fill="#3a2a12">SEU VALDIR · CHEFE</text></g>
      <g transform="translate(830 1200)"><rect x={-50} y={-70} width={100} height={110} rx={14} fill="#ffffff" {...ink(6)} /><path d="M50 -40 q 40 0 40 30 q 0 30 -40 30" fill="none" {...ink(8)} /><text x={0} y={-6} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={22} fill="#c8322a">CHEFE</text></g>
    </g>
  );
};

/* ------------------------------------------------------------------ Friday 6 p.m. (sepia flashback): the rant */
export const Friday: React.FC<P> = ({ T, t }) => {
  const cara = W(T, 'rant', 'cara', 1.6);
  const imit = T.s('rant2');
  const stache = t >= imit ? pop(t, W(T, 'rant2', 'imitou', 0.6) - 0.1) : 0;
  const talk = 0.25 + 0.25 * Math.abs(Math.sin(t * 13));
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
      {/* Tavinho sitting on the sofa, phone in front of his mouth, recording */}
      <g transform={place(540, 1550, 0.62)}>
        <Tavinho t={t} mood={t >= imit ? 'proud' : 'happy'} talk={t >= T.s('rant') && t < T.s('card') ? talk : 0} sweat={0} stache={stache}
          armR={[[720, 1150], [820, 1200], [660, 1120]]}
          holdR={<g transform="translate(-30 -40) rotate(-12)"><rect x={-50} y={-90} width={100} height={170} rx={16} fill="#20232c" {...ink(5)} /><rect x={-38} y={-78} width={76} height={140} rx={10} fill="#bfe6ff" /><circle cx={0} cy={-8} r={18} fill="#ff4a3d" opacity={0.6 + 0.4 * Math.sin(t * 10)} /></g>} />
        {/* knees on the cushion: he is sitting */}
        {[440, 640].map((x, i) => <ellipse key={i} cx={x} cy={1800} rx={95} ry={72} fill="#2c3550" {...ink(8)} />)}
      </g>
      {/* sofa front + arms */}
      <rect x={70} y={1500} width={940} height={110} rx={30} fill="#c8643a" {...ink(8)} />
      {[90, 990].map((x, i) => <rect key={i} x={x - 70} y={1150} width={140} height={460} rx={50} fill="#b8552f" {...ink(8)} />)}
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
  const arrow = T.s('contacts') + 0.2;
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
      {/* "LOGO ACIMA" arrow between the boss and Camila */}
      {t >= arrow && (
        <g data-qa-label="acima" transform={`translate(${lerp(1100, 730, clamp01((t - arrow) / 0.25))} 620) scale(${0.75 * pop(t, arrow)})`}>
          <rect x={-130} y={-130} width={260} height={210} rx={22} fill="#ffd21f" {...ink(6)} />
          <path d="M0 -110 L 44 -56 L 16 -56 L 16 0 L -16 0 L -16 -56 L -44 -56 Z" fill="#c8322a" {...ink(4)} />
          <text x={0} y={52} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={34} fill="#14171a">LOGO ACIMA</text>
        </g>
      )}
      <SideTavinho t={t} friday />
    </g>
  );
};
