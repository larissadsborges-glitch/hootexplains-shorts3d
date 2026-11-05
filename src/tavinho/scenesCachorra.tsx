import React from 'react';
import { clamp01, easeOutBack, lerp } from '../lib/anim';
import type { MoneyTimeline } from '../scenes/money/timeline';
import { INK, ink } from '../toon2d/Hook2D';
import { place } from '../toon2d/parts';
import { Celeste, PAL, Tavinho } from './cast';
import { Phone } from './scenes';
import { Avatar } from './scenesAudio';

/* Episode "A cachorra da sogra": Dona Celeste leaves her poodle Princesa with Tavinho; she runs off in ten minutes. */
type P = { T: MoneyTimeline; t: number };
const F = 'Montserrat, Arial Black, sans-serif';
const pop = (t: number, t0: number, d = 0.22) => easeOutBack(clamp01((t - t0) / d));
const W = (T: MoneyTimeline, ev: string, w: string, d = 0.5) => T.wordTime(ev, w, T.s(ev) + d);
const OUTFIT = 'tee' as const;

/* ------------------------------------------------------------------ cast for this episode */

/** Princesa: a tiny white poodle in a leopard-print coat with a giant pink bow. Drawn around (0, 0), about 300 wide. */
export const Princesa: React.FC<{ t: number; run?: boolean; s?: number }> = ({ t, run = false, s = 1 }) => {
  const step = run ? Math.sin(t * 22) : 0;
  const bob = run ? 8 * Math.abs(Math.sin(t * 22)) : 3 * Math.sin(t * 2.4);
  const puff = (cx: number, cy: number, r: number, k: string) => <circle key={k} cx={cx} cy={cy} r={r} fill="#ffffff" {...ink(5)} />;
  return (
    <g transform={`scale(${s}) translate(0 ${-bob})`}>
      <ellipse cx={0} cy={118 + bob} rx={130} ry={16} fill="#000" opacity={0.18} />
      {/* legs with pompom feet */}
      {[[-70, 1], [-30, -1], [40, 1], [80, -1]].map(([x, ph], i) => (
        <g key={i} transform={`rotate(${24 * step * ph} ${x} 40)`}>
          <rect x={x - 9} y={40} width={18} height={56} fill="#ffffff" {...ink(4)} />
          {puff(x, 100, 18, `f${i}`)}
        </g>
      ))}
      {/* tail pompom */}
      {puff(-128 + 4 * step, -40, 26, 'tail')}
      {/* body in the leopard coat */}
      <ellipse cx={0} cy={10} rx={112} ry={62} fill="#f2b33d" {...ink(6)} />
      {[[-60, -10], [-20, 20], [20, -16], [60, 14], [-40, 34], [44, -36], [80, -6]].map(([x, y], i) => <path key={i} d={`M${x - 12} ${y} q 12 -12 24 0 q -12 12 -24 0`} fill="#6b3f22" />)}
      <path d="M-112 10 C -60 30 60 30 112 10" fill="none" stroke="#c8322a" strokeWidth={6} />
      {/* head: fluffy puffs, ears, face */}
      <g transform={`translate(96 -60) rotate(${run ? -10 : 4 * Math.sin(t * 1.7)})`}>
        {puff(-46, 10, 34, 'earL')}
        {puff(46, 10, 34, 'earR')}
        {puff(0, -40, 40, 'top')}
        <ellipse cx={0} cy={6} rx={46} ry={44} fill="#ffffff" {...ink(5)} />
        <circle cx={-16} cy={0} r={7} fill={INK} /><circle cx={16} cy={0} r={7} fill={INK} />
        <circle cx={-14} cy={-3} r={2.5} fill="#fff" /><circle cx={18} cy={-3} r={2.5} fill="#fff" />
        <ellipse cx={0} cy={20} rx={10} ry={7} fill={INK} />
        <path d="M-4 30 q 4 14 8 0" fill="#ff7aa8" {...ink(2)} />
        {/* the giant pink bow */}
        <g transform="translate(0 -78)">
          <path d="M0 0 L -86 -44 L -86 44 Z M0 0 L 86 -44 L 86 44 Z" fill="#ff5fb0" {...ink(6)} />
          <circle cx={0} cy={0} r={18} fill="#ff2f8f" {...ink(5)} />
        </g>
      </g>
    </g>
  );
};

/** A generic delivery rider on a scooter (helmet with a dark visor, red jacket, box with "LANCHE"). */
const Rider: React.FC<{ t: number; s?: number }> = ({ t, s = 1 }) => (
  <g transform={`scale(${s})`}>
    {[-120, 120].map((x, i) => <g key={i}><circle cx={x} cy={90} r={52} fill="#1b1420" /><circle cx={x} cy={90} r={22} fill="#8a8f9a" transform={`rotate(${t * 600} ${x} 90)`} /></g>)}
    <path d="M-170 60 L 150 60 L 120 0 L -100 0 Z" fill="#3a8f7a" {...ink(6)} />
    <rect x={-190} y={-150} width={150} height={130} rx={12} fill="#e2453c" {...ink(6)} />
    <text x={-115} y={-75} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={30} fill="#fff">LANCHE</text>
    <path d="M110 0 L 160 -120" stroke="#1b1420" strokeWidth={12} strokeLinecap="round" />
    <path d="M-30 0 C -40 -90 40 -120 70 -40 L 60 0 Z" fill="#c8322a" {...ink(6)} />
    <circle cx={20} cy={-150} r={52} fill="#c8322a" {...ink(6)} />
    <path d="M30 -170 Q 80 -160 72 -126 L 26 -126 Z" fill="#1b1420" />
  </g>
);

/** The other dogs: in the pet-shop window and behind the sausage in the vote. */
const Dog: React.FC<{ kind: 'pug' | 'salsicha' | 'grande' | 'vira'; t: number }> = ({ kind, t }) => {
  const wag = 10 * Math.sin(t * 9);
  if (kind === 'pug') return (
    <g><ellipse cx={0} cy={40} rx={80} ry={50} fill="#e3b77e" {...ink(5)} /><circle cx={0} cy={-30} r={56} fill="#e3b77e" {...ink(5)} /><ellipse cx={0} cy={-14} rx={34} ry={26} fill="#3a2a22" /><circle cx={-22} cy={-44} r={9} fill={INK} /><circle cx={22} cy={-44} r={9} fill={INK} />{[-1, 1].map((s) => <path key={s} d={`M${s * 40} -70 l ${s * 24} 10 l ${-s * 10} 26 Z`} fill="#3a2a22" />)}</g>
  );
  if (kind === 'salsicha') return (
    <g><rect x={-130} y={10} width={260} height={60} rx={30} fill="#9a5a2c" {...ink(5)} /><circle cx={130} cy={0} r={40} fill="#9a5a2c" {...ink(5)} /><ellipse cx={168} cy={10} rx={22} ry={14} fill="#9a5a2c" {...ink(4)} /><circle cx={136} cy={-8} r={7} fill={INK} /><path d={`M-130 30 l -40 ${-20 + wag}`} stroke="#9a5a2c" strokeWidth={14} strokeLinecap="round" />{[-100, -60, 60, 100].map((x) => <rect key={x} x={x - 7} y={60} width={14} height={30} fill="#9a5a2c" {...ink(3)} />)}</g>
  );
  if (kind === 'grande') return (
    <g><rect x={-90} y={-20} width={180} height={110} rx={40} fill="#8a8f9a" {...ink(5)} /><rect x={50} y={-150} width={90} height={150} rx={40} fill="#8a8f9a" {...ink(5)} /><circle cx={100} cy={-160} r={56} fill="#8a8f9a" {...ink(5)} /><circle cx={116} cy={-170} r={9} fill={INK} /><ellipse cx={150} cy={-140} rx={16} ry={12} fill={INK} />{[-70, -30, 30, 70].map((x) => <rect key={x} x={x - 10} y={80} width={20} height={70} fill="#8a8f9a" {...ink(3)} />)}</g>
  );
  return (
    <g><circle cx={0} cy={0} r={52} fill="#d9a066" {...ink(5)} /><path d="M-40 -30 l -20 -40 l 40 20 Z M40 -30 l 20 -40 l -40 20 Z" fill="#b5793f" {...ink(4)} /><circle cx={-18} cy={-6} r={8} fill={INK} /><circle cx={18} cy={-6} r={8} fill={INK} /><ellipse cx={0} cy={16} rx={10} ry={8} fill={INK} /><path d="M-6 28 q 6 16 12 0" fill="#ff7aa8" {...ink(2)} /></g>
  );
};
export { Dog };

/* ------------------------------------------------------------------ the living room: the hand-over, "volto em 2 horas", Princesa's outfit */
export const Living: React.FC<P> = ({ T, t }) => {
  const handing = t < T.s('punch');
  const leaving = t >= T.s('stakes') && t < T.s('back');
  const posing = t >= T.s('rant2');
  const bubbleA = T.s('hook') - 0.1;
  const bubbleB = T.s('stakes') + 0.2;
  const coat = T.s('rant2') - 0.05, bow = W(T, 'rant2', 'oncinha', 1.2) - 0.1;
  return (
    <g>
      <rect x={0} y={0} width={1080} height={1920} fill="#f0d9e6" />
      <rect x={0} y={1560} width={1080} height={360} fill="#d9b98a" />
      {/* window, framed picture of Princesa, front door */}
      <rect x={70} y={300} width={300} height={380} rx={10} fill="#9fdcff" {...ink(8)} />
      <path d="M220 300 L 220 680 M 70 490 L 370 490" stroke="#1b1420" strokeWidth={8} />
      <g transform="translate(560 420)"><rect x={-110} y={-90} width={220} height={180} rx={8} fill="#ffd166" {...ink(7)} /><g transform="scale(0.42) translate(-90 60)"><Princesa t={0} /></g></g>
      <rect x={800} y={600} width={230} height={960} rx={8} fill="#a8683c" {...ink(8)} />
      <circle cx={830} cy={1100} r={14} fill="#ffd21f" {...ink(4)} />
      {/* sofa (for Princesa's pose) */}
      {posing && (
        <g>
          <rect x={90} y={1060} width={900} height={420} rx={70} fill="#c85a8a" {...ink(8)} />
          <rect x={60} y={1380} width={960} height={220} rx={50} fill="#d96f9c" {...ink(8)} />
          <g transform="translate(560 1330)"><Princesa t={t} s={2.1} /></g>
          {t >= coat && (
            <g data-qa-label="oncinha" transform={`translate(380 1130) rotate(-3) scale(${pop(t, coat)})`}>
              <rect x={-230} y={-42} width={460} height={84} rx={18} fill={PAL.orange} {...ink(6)} />
              <text x={0} y={14} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={38} fill="#fff">CASACO DE ONCINHA</text>
            </g>
          )}
          {t >= bow && (
            <g data-qa-label="laco" transform={`translate(740 860) rotate(4) scale(${pop(t, bow)})`}>
              <rect x={-190} y={-44} width={380} height={88} rx={18} fill="#ff2f8f" {...ink(6)} />
              <text x={0} y={16} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={42} fill="#fff">LAÇO GIGANTE</text>
            </g>
          )}
        </g>
      )}
      {/* Dona Celeste hands Princesa over, then waits at the door */}
      {(handing || leaving) && (
        <g>
          <g transform={place(handing ? 760 : 905, 1720, handing ? 0.62 : 0.56)}><Celeste t={t} mood="happy" /></g>
          <g transform={place(330, 1720, 0.62)}>
            <Tavinho t={t} mood={handing ? 'worried' : 'gulp'} sweat={handing ? 0.4 : 1} slip={0.5} outfit={OUTFIT}
              armL={[[360, 1150], [330, 1330], [480, 1340]]} armR={[[720, 1150], [760, 1330], [640, 1340]]}
              holdL={<g transform="translate(80 -40)"><Princesa t={t} s={0.95} /></g>} />
          </g>
          {handing && t >= bubbleA && (
            <g data-qa-label="cuida" transform={`translate(700 660) scale(${0.85 * pop(t, bubbleA)})`}>
              <path d="M-300 -80 L 300 -80 Q 330 -80 330 -50 L 330 50 Q 330 80 300 80 L 80 80 L 40 150 L 30 80 L -300 80 Q -330 80 -330 50 L -330 -50 Q -330 -80 -300 -80 Z" fill="#fff" {...ink(7)} />
              <text x={0} y={-6} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={42} fill="#14171a">CUIDA DA MINHA</text>
              <text x={0} y={48} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={42} fill="#ff2f8f">PRINCESA! 😘</text>
            </g>
          )}
          {leaving && t >= bubbleB && (
            <g data-qa-label="volto" transform={`translate(780 760) scale(${pop(t, bubbleB)})`}>
              <path d="M-260 -80 L 260 -80 Q 290 -80 290 -50 L 290 50 Q 290 80 260 80 L 160 80 L 140 150 L 100 80 L -260 80 Q -290 80 -290 50 L -290 -50 Q -290 -80 -260 -80 Z" fill="#fff" {...ink(7)} />
              <text x={0} y={-6} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={42} fill="#14171a">VOLTO EM</text>
              <text x={0} y={48} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={42} fill="#c8322a">2 HORAS! 💋</text>
            </g>
          )}
        </g>
      )}
    </g>
  );
};

/* ------------------------------------------------------------------ the fridge note */
export const Note: React.FC<P> = ({ T, t }) => {
  const items: [string, string][] = [['ração', '🍖 Ração importada'], ['música', '🎻 Música clássica'], ['escovar', '🪥 Escovar os dentes']];
  return (
    <g>
      <rect x={0} y={0} width={1080} height={1920} fill="#2a3a55" />
      {/* fridge door */}
      <rect x={120} y={120} width={840} height={1700} rx={50} fill="#eef3f8" stroke="#1b1420" strokeWidth={12} />
      <rect x={160} y={700} width={30} height={260} rx={14} fill="#9aa6b8" stroke="#1b1420" strokeWidth={6} />
      {/* the note, slightly crooked, held by two magnets */}
      <g transform={`translate(560 820) rotate(-3) scale(${0.85 * pop(t, T.s('back') + 0.2)})`}>
        <rect x={-330} y={-450} width={660} height={820} rx={10} fill="#fff6c8" {...ink(7)} />
        {Array.from({ length: 9 }, (_, i) => <path key={i} d={`M-300 ${-300 + i * 80} L 300 ${-300 + i * 80}`} stroke="#c8d6ec" strokeWidth={4} />)}
        <text data-qa-label="lista" x={0} y={-350} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={60} fill="#ff2f8f">PRINCESA 👑</text>
        {items.map(([w, label], i) => {
          const at = W(T, 'rant', w, 0.6 + i * 0.9) - 0.1;
          if (t < at) return null;
          return <text key={i} data-qa-label={`item${i}`} x={-290} y={-190 + i * 160} fontFamily={F} fontWeight={900} fontSize={48} fill="#14171a" transform={`translate(${-290 * (1 - pop(t, at))} 0)`}>{label}</text>;
        })}
        <text x={160} y={330} textAnchor="middle" fontFamily={F} fontWeight={800} fontSize={40} fill="#c8322a">Celeste 💋</text>
        {[[-260, -440], [260, -440]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={30} fill={i ? '#3ddc97' : '#ff7a2e'} {...ink(5)} />)}
      </g>
    </g>
  );
};

/* ------------------------------------------------------------------ the street: the gate, the rider, the chase, the kerb */
export const Street: React.FC<P> = ({ T, t }) => {
  const flash = t < T.s('you');            // "ela fugiu em dez minutos": flash-forward
  const arrive = T.s('lunch'), bag = W(T, 'lunch', 'lanche', 0.8);
  const run0 = T.s('run'), sit0 = T.s('sit');
  const open = flash || t >= arrive;
  const riderX = t < run0 ? lerp(1300, 760, clamp01((t - arrive) / 0.6)) : lerp(760, -500, clamp01((t - run0) / 2.2));
  const dogX = t < run0 ? 620 : lerp(620, -300, clamp01((t - run0 - 0.3) / 2.2));
  const sitting = t >= sit0;
  return (
    <g>
      <rect x={0} y={0} width={1080} height={1920} fill="#9fdcff" />
      <circle cx={900} cy={240} r={70} fill="#ffe08a" />
      {/* house wall + gate */}
      <rect x={0} y={560} width={1080} height={960} fill="#f2c9a0" {...ink(6)} />
      <rect x={60} y={640} width={200} height={220} rx={8} fill="#9fdcff" {...ink(6)} />
      <rect x={300} y={900} width={480} height={620} fill="#5a4636" {...ink(6)} />
      <g transform={`translate(300 900) ${open ? 'scale(0.25 1)' : ''}`}>
        <rect x={0} y={0} width={480} height={620} fill="#6d7a8a" {...ink(6)} />
        {Array.from({ length: 8 }, (_, i) => <rect key={i} x={30 + i * 58} y={20} width={14} height={580} fill="#3a4554" />)}
      </g>
      {/* tree */}
      <rect x={900} y={980} width={60} height={540} fill="#7a4a2c" {...ink(6)} />
      <circle cx={930} cy={900} r={150} fill="#4f9a4a" {...ink(6)} />
      {/* sidewalk, kerb, street */}
      <rect x={0} y={1520} width={1080} height={180} fill="#cfcfd4" {...ink(5)} />
      <rect x={0} y={1690} width={1080} height={30} fill="#9a9aa6" />
      <rect x={0} y={1720} width={1080} height={200} fill="#4a4f5a" />
      {Array.from({ length: 6 }, (_, i) => <rect key={i} x={i * 200 + 40} y={1810} width={110} height={16} fill="#fff4e0" />)}
      {/* flash-forward: an empty gate, a dust trail, "10 MIN" */}
      {flash && (
        <g>
          {[0, 1, 2, 3].map((i) => { const k = (t * 0.9 + i * 0.25) % 1; return <circle key={i} cx={760 + 300 * k} cy={1600 - 40 * k} r={30 + 60 * k} fill="#e8dcc8" opacity={0.8 * (1 - k)} {...ink(3)} />; })}
          <g data-qa-label="10min" transform={`translate(760 700) rotate(6) scale(${pop(t, T.s('punch') + 0.3)})`}>
            <circle cx={0} cy={0} r={110} fill="#c8322a" {...ink(8)} />
            <text x={0} y={-6} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={74} fill="#fff">10</text>
            <text x={0} y={52} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={40} fill="#fff">MIN</text>
          </g>
        </g>
      )}
      {/* the delivery rider */}
      {!flash && t >= arrive && riderX > -480 && <g transform={`translate(${riderX} 1600)`}><Rider t={t} s={1.0} /></g>}
      {/* Princesa sneaking out / chasing the rider */}
      {!flash && t >= W(T, 'card', 'portão', 0.8) && dogX > -280 && <g transform={`translate(${dogX} 1630)`}><g transform="scale(-1 1)"><Princesa t={t} run={t >= run0} s={0.7} /></g></g>}
      {/* Tavinho: at the gate (with the bag), then sitting on the kerb, soaked */}
      {!sitting && (
        <g transform={place(flash ? 420 : 470, 1660, 0.5)}>
          <Tavinho t={t} mood={flash ? 'shock' : t >= run0 ? 'shock' : 'happy'} sweat={flash || t >= run0 ? 1 : 0.2} slip={0.4} outfit={OUTFIT}
            armR={t >= bag && !flash ? [[720, 1150], [820, 1300], [760, 1420]] : undefined}
            holdR={t >= bag && !flash ? <g><rect x={-60} y={0} width={120} height={120} rx={10} fill="#c8a06a" {...ink(5)} /><text x={0} y={70} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={24} fill="#5a3a24">LANCHE</text></g> : undefined} />
        </g>
      )}
      {sitting && (
        <g>
          {/* two blocks away: another street (a blue house, a bakery), no gate */}
          <rect x={0} y={560} width={1080} height={960} fill="#bcd6f0" {...ink(6)} />
          {[90, 420, 750].map((x, i) => <rect key={i} x={x} y={660} width={220} height={240} rx={8} fill="#fff4e0" {...ink(6)} />)}
          <rect x={240} y={1060} width={600} height={120} rx={14} fill="#c8643a" {...ink(6)} />
          <text x={540} y={1140} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={64} fill="#fff4e0">PADARIA</text>
          <rect x={300} y={1200} width={480} height={320} fill="#8a6a4a" {...ink(6)} />
          <g transform={place(420, 1820, 0.5)}>
            <Tavinho t={t} mood="gulp" sweat={1} slip={1} outfit={OUTFIT} armL={[[360, 1150], [300, 1330], [400, 1560]]} armR={[[720, 1150], [780, 1330], [680, 1560]]} />
          </g>
          <rect x={0} y={1690} width={1080} height={30} fill="#9a9aa6" />
          {/* sitting: knees towards us, shoes on the road */}
          <g transform={place(420, 1820, 0.5)}>
            {[440, 640].map((x, i) => <ellipse key={i} cx={x} cy={1800} rx={90} ry={70} fill="#2c3550" {...ink(8)} />)}
            {[430, 650].map((x, i) => <path key={`s${i}`} d={`M${x - 70} 2016 C ${x - 74} 1975 ${x - 44} 1955 ${x} 1955 C ${x + 44} 1955 ${x + 74} 1975 ${x + 70} 2016 Z`} fill="#6b3f22" {...ink(7)} />)}
          </g>
          {t < T.s('follow') && <g data-qa-label="quarteiroes" transform={`translate(780 700) rotate(-5) scale(${pop(t, W(T, 'sit', 'dois', 0.9) - 0.1)})`}>
            <rect x={-200} y={-90} width={400} height={180} rx={20} fill="#ffd21f" {...ink(7)} />
            <text x={0} y={-12} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={60} fill="#14171a">2</text>
            <text x={0} y={52} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={40} fill="#14171a">QUARTEIRÕES</text>
          </g>}
        </g>
      )}
    </g>
  );
};

/* ------------------------------------------------------------------ the pet shop: none of them looks like her */
export const PetShop: React.FC<P> = ({ T, t }) => {
  const no = W(T, 'truth', 'cachorra', 1.6) - 0.1;
  const dogs: ['pug' | 'salsicha' | 'grande', number][] = [['pug', 300], ['salsicha', 560], ['grande', 790]];
  return (
    <g>
      <rect x={0} y={0} width={1080} height={1920} fill="#bfe3cf" />
      <rect x={0} y={1560} width={1080} height={360} fill="#cfcfd4" />
      <rect x={140} y={260} width={800} height={150} rx={20} fill={PAL.orange} {...ink(8)} />
      <text x={540} y={365} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={84} fill="#fff">PET SHOP 🐾</text>
      <rect x={120} y={480} width={840} height={760} rx={16} fill="#e9f6ff" {...ink(8)} />
      <rect x={140} y={1100} width={800} height={30} fill="#c9a06a" />
      {dogs.map(([k, x], i) => (
        <g key={k}>
          <g transform={`translate(${x} ${k === 'grande' ? 1000 : 1030})`}><Dog kind={k} t={t + i} /></g>
          {t >= no && (
            <g data-qa-label={`nao${i}`} transform={`translate(${x} 700) rotate(${-8 + i * 8}) scale(${pop(t, no + i * 0.08)})`}>
              <rect x={-110} y={-40} width={220} height={80} rx={14} fill="#e2453c" {...ink(5)} />
              <text x={0} y={14} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={34} fill="#fff">NÃO É ELA</text>
            </g>
          )}
        </g>
      ))}
      <g transform={place(220, 1820, 0.55)}><Tavinho t={t} mood="neutral" sweat={0.8} slip={0.6} outfit={OUTFIT} /></g>
    </g>
  );
};

/* ------------------------------------------------------------------ the chat with Dona Celeste: "me manda um vídeo" */
export const CelesteChat: React.FC<P> = ({ T, t }) => {
  const m1 = W(T, 'twist', 'me', 1.1) - 0.1, m2 = T.s('noreturn');
  return (
    <g>
      <rect x={0} y={0} width={1080} height={1920} fill={PAL.navy} />
      <Phone x={260} y={310} s={1} glow={1}>
        <rect x={0} y={0} width={560} height={1100} fill="#fdeef5" />
        <rect x={0} y={0} width={560} height={140} fill="#ff5fb0" />
        <Avatar id="celeste-av" x={70} y={88}><Celeste t={t} mood="happy" /></Avatar>
        <text x={128} y={84} fontFamily={F} fontWeight={900} fontSize={30} fill="#fff">Dona Celeste 🌹</text>
        <text x={128} y={118} fontFamily={F} fontWeight={700} fontSize={22} fill="#fff4e0">{t >= m1 - 0.6 && t < m1 ? 'digitando…' : 'online'}</text>
        {t >= m1 && (
          <g data-qa-label="video" transform={`translate(20 200) scale(${pop(t, m1)})`}>
            <rect x={0} y={0} width={480} height={170} rx={26} fill="#ffffff" {...ink(4)} />
            <text x={22} y={56} fontFamily={F} fontWeight={800} fontSize={32} fill="#14171a">me manda um vídeo</text>
            <text x={22} y={102} fontFamily={F} fontWeight={800} fontSize={32} fill="#14171a">da minha princesa</text>
            <text x={22} y={148} fontFamily={F} fontWeight={800} fontSize={32} fill="#14171a">😍🐩</text>
          </g>
        )}
        {t >= m2 && (
          <g data-qa-label="agora" transform={`translate(20 392) scale(${pop(t, m2)})`}>
            <rect x={0} y={0} width={250} height={80} rx={24} fill="#ffffff" {...ink(4)} />
            <text x={22} y={54} fontFamily={F} fontWeight={900} fontSize={34} fill="#c8322a">AGORA 😘</text>
          </g>
        )}
        <rect x={16} y={980} width={528} height={86} rx={43} fill="#ffffff" {...ink(4)} />
        <text x={44} y={1036} fontFamily={F} fontWeight={700} fontSize={28} fill="#7d8590">Mensagem</text>
      </Phone>
      <g transform={place(190, 1700, 0.5)}><Tavinho t={t} mood="shock" sweat={1} slip={0.8} outfit={OUTFIT} /></g>
    </g>
  );
};
