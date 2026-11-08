import '@fontsource/anton/400.css';
import '@fontsource/montserrat/700.css';
import '@fontsource/montserrat/800.css';
import '@fontsource/montserrat/900.css';
import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { ARTISTS, BAR, BEAT, HEADLINER, T, type Artist } from './config';

const G = '#0f4a33';
const G2 = '#06281b';
const GOLD = '#f7b733';
const img = (f: string) => staticFile(`promo_unidos/img/${f}`);
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const ANTON: React.CSSProperties = { fontFamily: 'Anton', fontWeight: 400, textTransform: 'uppercase', lineHeight: 0.95 };
const MONT: React.CSSProperties = { fontFamily: 'Montserrat', fontWeight: 800, textTransform: 'uppercase' };

/* ---------- shared bits ---------- */

// Stage light beams sweeping from the top.
const Beams: React.FC<{ color?: string; opacity?: number }> = ({ color = '255,255,255', opacity = 1 }) => {
  const f = useCurrentFrame();
  const beams = [
    { x: 15, a: -22, s: 0.035, p: 0 },
    { x: 40, a: 12, s: 0.05, p: 1.3 },
    { x: 62, a: -8, s: 0.042, p: 2.1 },
    { x: 85, a: 20, s: 0.03, p: 3.3 },
  ];
  return (
    <AbsoluteFill style={{ opacity, mixBlendMode: 'screen', pointerEvents: 'none' }}>
      {beams.map((b, i) => {
        const ang = b.a + Math.sin(f * b.s + b.p) * 18;
        return (
          <div
            key={i}
            style={{
              position: 'absolute', left: `${b.x}%`, top: -200, width: 260, height: 2600,
              transformOrigin: '50% 0', transform: `translateX(-50%) rotate(${ang}deg)`,
              background: `linear-gradient(180deg, rgba(${color},.55), rgba(${color},.12) 45%, transparent 80%)`,
              filter: 'blur(18px)', clipPath: 'polygon(42% 0, 58% 0, 100% 100%, 0 100%)',
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// White strobe on cuts; `at` frames relative to the local sequence.
const Flash: React.FC<{ at?: number[]; len?: number; max?: number }> = ({ at = [0], len = 6, max = 0.9 }) => {
  const f = useCurrentFrame();
  const o = Math.max(0, ...at.map((a) => (f >= a && f < a + len ? max * (1 - (f - a) / len) : 0)));
  return <AbsoluteFill style={{ background: '#fff', opacity: o, pointerEvents: 'none' }} />;
};

const Grain: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        opacity: 0.07, mixBlendMode: 'overlay', pointerEvents: 'none',
        backgroundImage: 'radial-gradient(#fff 1px, transparent 1.5px)', backgroundSize: '6px 6px',
        transform: `translate(${(f * 7) % 6}px, ${(f * 13) % 6}px)`,
      }}
    />
  );
};

// Beat pulse 1 -> 0 over each beat.
const usePulse = () => {
  const f = useCurrentFrame();
  return Math.exp(-((f % BEAT) / 5));
};

// Big name, slammed in with a mask wipe, then a slow push.
const BigName: React.FC<{ lines: string[]; size: number; color?: string; delay?: number; accent?: number }> = ({
  lines, size, color = '#fff', delay = 0, accent = -1,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: size * 0.06 }}>
      {lines.map((l, i) => {
        const s = spring({ frame: f - delay - i * 4, fps, config: { damping: 14, stiffness: 180 } });
        const fit = Math.min(size, 980 / (l.length * 0.46));
        return (
          <div key={i} style={{ overflow: 'hidden', padding: `${fit * 0.22}px 10px 0`, marginTop: -fit * 0.22 }}>
            <div
              style={{
                ...ANTON, fontSize: fit, color: i === accent ? GOLD : color, whiteSpace: 'nowrap', textAlign: 'center',
                transform: `translateY(${(1 - s) * 110}%) scale(${1 + (1 - s) * 0.3})`,
                textShadow: '0 8px 30px rgba(0,0,0,.55)', letterSpacing: interpolate(s, [0, 1], [0.12, 0.01]) + 'em',
              }}
            >
              {l}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Tag: React.FC<{ text: string; delay?: number; bg?: string; fg?: string; size?: number }> = ({
  text, delay = 0, bg = GOLD, fg = G2, size = 30,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - delay, fps, config: { damping: 12 } });
  return (
    <div
      style={{
        ...MONT, fontWeight: 900, fontSize: size, letterSpacing: '.3em', background: bg, color: fg,
        padding: `${size * 0.3}px ${size * 0.6}px ${size * 0.3}px ${size * 0.9}px`, transform: `scale(${s}) rotate(${(1 - s) * -8}deg)`,
        display: 'inline-block', whiteSpace: 'nowrap',
      }}
    >
      {text}
    </div>
  );
};

const InfoLine: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const f = useCurrentFrame();
  const o = interpolate(f - delay, [0, 10], [0, 1], clamp);
  return (
    <div style={{ ...MONT, fontSize: 30, letterSpacing: '.2em', color: '#fff', opacity: o, textAlign: 'center', textShadow: '0 3px 12px rgba(0,0,0,.7)' }}>
      28 NOV <span style={{ color: GOLD }}>•</span> PAVILHÃO VÍTOR DOMINGOS
    </div>
  );
};

// Scrolling festival ticker.
const Ticker: React.FC<{ top: number }> = ({ top }) => {
  const f = useCurrentFrame();
  const txt = 'FESTIVAL SOLIDÁRIO ✦ UNIDOS PELA INCLUSÃO ✦ 28 NOVEMBRO ✦ ENTRADA 5 BOLAS ✦ ';
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top, height: 64, background: GOLD, overflow: 'hidden', transform: 'rotate(-3deg) scale(1.1)' }}>
      <div style={{ ...ANTON, fontSize: 40, color: G2, whiteSpace: 'nowrap', lineHeight: '64px', transform: `translateX(${-((f * 6) % 1400)}px)` }}>
        {txt.repeat(4)}
      </div>
    </div>
  );
};

/* ---------- scenes ---------- */

const Intro: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = usePulse();
  const part = f < BAR ? 0 : f < 2 * BAR ? 1 : 2;
  const s = spring({ frame: f - part * BAR, fps, config: { damping: 11, stiffness: 160 } });
  const shake = part > 0 && f % BAR < 8 ? Math.sin(f * 3) * (8 - (f % BAR)) * 2 : 0;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 40%, #17643f, ${G} 45%, ${G2})` }}>
      <Beams opacity={interpolate(f, [0, 60], [0.3, 1], clamp)} />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', transform: `translateX(${shake}px)` }}>
        {part === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40, opacity: s }}>
            <div style={{ display: 'flex', gap: 40 }}>
              {['gdf.jpg', 'boccia.jpg'].map((l, i) => (
                <div key={l} style={{ width: 230, height: 230, borderRadius: '50%', background: '#fff', padding: 16, overflow: 'hidden', transform: `scale(${spring({ frame: f - i * 6, fps, config: { damping: 10 } })})`, boxShadow: '0 20px 50px rgba(0,0,0,.4)' }}>
                  <Img src={img(l)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
              ))}
            </div>
            <div style={{ ...MONT, fontSize: 40, letterSpacing: '.3em', color: '#d8efe2', textAlign: 'center', lineHeight: 1.5 }}>
              GRUPO DESPORTIVO FABRIL<br /><span style={{ color: GOLD }}>APRESENTA</span>
            </div>
          </div>
        )}
        {part === 1 && (
          <div style={{ transform: `scale(${(2 - s) * (1 + p * 0.03)})`, textAlign: 'center' }}>
            <div style={{ ...ANTON, fontSize: 230, color: '#fff' }}>FESTIVAL</div>
            <div style={{ ...ANTON, fontSize: 196, color: GOLD }}>SOLIDÁRIO</div>
          </div>
        )}
        {part === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40 }}>
            <div style={{ transform: `scale(${(1.6 - s * 0.6) * (1 + p * 0.03)})`, textAlign: 'center' }}>
              <div style={{ ...ANTON, fontSize: 168, color: '#fff' }}>UNIDOS PELA</div>
              <div style={{ ...ANTON, fontSize: 204, color: GOLD }}>INCLUSÃO</div>
            </div>
            <InfoLine delay={2 * BAR + 14} />
          </div>
        )}
      </AbsoluteFill>
      <Flash at={[BAR, 2 * BAR]} />
      <Grain />
    </AbsoluteFill>
  );
};

const ArtistScene: React.FC<{ a: Artist; n: number; total: number; headliner?: boolean }> = ({ a, n, total, headliner }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = usePulse();
  const len = headliner ? 3 * BAR : T.artistLen;
  const push = interpolate(f, [0, len], [1.12, 1.0], clamp) * (1 + p * 0.012);
  const rgb = interpolate(f, [0, 10], [26, 0], clamp);
  const cardIn = spring({ frame: f - 2, fps, config: { damping: 13, stiffness: 140 } });
  const out = interpolate(f, [len - 6, len], [1, 0], clamp);

  const photo = (style: React.CSSProperties = {}) => (
    <Img src={img(a.img)} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: a.pos ?? '50% 40%', ...style }} />
  );

  return (
    <AbsoluteFill style={{ background: '#000', opacity: out }}>
      {/* background */}
      {a.mode === 'full' ? (
        <AbsoluteFill style={{ transform: `scale(${push})` }}>
          <AbsoluteFill style={{ filter: 'grayscale(.25) contrast(1.15) brightness(.85)' }}>{photo()}</AbsoluteFill>
          {rgb > 0.5 && (
            <>
              <AbsoluteFill style={{ mixBlendMode: 'screen', opacity: 0.6, transform: `translateX(${rgb}px)`, filter: 'sepia(1) saturate(6) hue-rotate(-50deg)' }}>{photo()}</AbsoluteFill>
              <AbsoluteFill style={{ mixBlendMode: 'screen', opacity: 0.6, transform: `translateX(${-rgb}px)`, filter: 'sepia(1) saturate(6) hue-rotate(140deg)' }}>{photo()}</AbsoluteFill>
            </>
          )}
        </AbsoluteFill>
      ) : (
        <AbsoluteFill style={{ transform: `scale(${push * 1.2})`, filter: 'blur(40px) brightness(.45) saturate(1.3)' }}>
          {a.mode === 'logo' ? <AbsoluteFill style={{ background: `radial-gradient(circle, #17643f, ${G2})` }} /> : photo()}
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(6,40,27,.55) 0%, transparent 22%, transparent 45%, rgba(6,40,27,.92) 72%, ${G2} 100%)` }} />
      <Beams color={headliner ? '247,183,51' : '255,255,255'} opacity={0.55} />

      {/* card for landscape photos / logos */}
      {a.mode !== 'full' && (
        <AbsoluteFill style={{ alignItems: 'center', paddingTop: headliner ? 300 : 300 }}>
          <div
            style={{
              width: headliner ? 1000 : 920, height: headliner ? 620 : a.mode === 'logo' ? 740 : 640, borderRadius: 26, overflow: 'hidden',
              border: `6px solid ${GOLD}`, background: a.logoBg ?? '#000', boxShadow: '0 30px 80px rgba(0,0,0,.6)',
              transform: `scale(${(0.6 + 0.4 * cardIn) * push}) rotate(${(1 - cardIn) * -6 + (headliner ? 0 : n % 2 ? 1.5 : -1.5)}deg)`,
              opacity: cardIn,
            }}
          >
            {a.mode === 'logo' ? (
              <Img src={img(a.img)} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 30 }} />
            ) : (
              photo({ objectPosition: headliner ? '62% 30%' : '50% 40%' })
            )}
          </div>
        </AbsoluteFill>
      )}

      {/* top tags */}
      <div style={{ position: 'absolute', top: 170, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', padding: '0 60px', alignItems: 'center' }}>
        <Tag text={headliner ? 'CABEÇA DE CARTAZ' : 'CONFIRMADO'} delay={4} size={headliner ? 34 : 28} />
        {!headliner && (
          <div style={{ ...ANTON, fontSize: 56, color: 'rgba(255,255,255,.9)', opacity: interpolate(f, [6, 14], [0, 1], clamp) }}>
            {String(n).padStart(2, '0')}<span style={{ color: GOLD, fontSize: 34 }}> / {String(total).padStart(2, '0')}</span>
          </div>
        )}
      </div>

      {/* name block */}
      <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: headliner ? 380 : 400, gap: 28 }}>
        <BigName lines={a.lines} size={headliner ? 260 : a.lines.length > 1 ? 150 : 210} delay={3} color={headliner ? GOLD : '#fff'} accent={headliner ? -1 : a.lines.length - 1} />
        <InfoLine delay={12} />
      </AbsoluteFill>

      {headliner && <Confetti />}
      <Flash at={[0]} len={7} />
      <Grain />
    </AbsoluteFill>
  );
};

const Confetti: React.FC = () => {
  const f = useCurrentFrame();
  const bits = Array.from({ length: 70 }, (_, i) => {
    const r = (k: number) => (Math.sin(i * 12.9898 + k * 78.233) * 43758.5453) % 1;
    const x = Math.abs(r(1)) * 1080;
    const sp = 6 + Math.abs(r(2)) * 10;
    const y = -60 + ((f * sp + Math.abs(r(3)) * 2000) % 2100);
    const rot = f * (4 + Math.abs(r(4)) * 8);
    return { x, y, rot, c: i % 3 === 0 ? '#fff' : GOLD, w: 10 + Math.abs(r(5)) * 14 };
  });
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', opacity: interpolate(f, [0, 10], [0, 1], clamp) }}>
      {bits.map((b, i) => (
        <div key={i} style={{ position: 'absolute', left: b.x, top: b.y, width: b.w, height: b.w * 0.45, background: b.c, transform: `rotate(${b.rot}deg)`, opacity: 0.85 }} />
      ))}
    </AbsoluteFill>
  );
};

const Tease: React.FC = () => {
  const f = useCurrentFrame();
  const strobe = f > 36 && f % 6 < 2 ? 0.35 : 0;
  const zoom = interpolate(f, [0, BAR], [1, 1.25]);
  return (
    <AbsoluteFill style={{ background: '#000', alignItems: 'center', justifyContent: 'center' }}>
      <Beams color="247,183,51" opacity={interpolate(f, [0, BAR], [0.2, 1])} />
      <div style={{ transform: `scale(${zoom})`, textAlign: 'center' }}>
        <div style={{ ...MONT, fontSize: 44, letterSpacing: '.3em', color: '#fff', opacity: interpolate(f, [0, 8], [0, 1], clamp) }}>E O</div>
        <div style={{ ...ANTON, fontSize: 150, color: GOLD, opacity: interpolate(f, [10, 18], [0, 1], clamp) }}>CABEÇA DE</div>
        <div style={{ ...ANTON, fontSize: 150, color: GOLD, opacity: interpolate(f, [20, 28], [0, 1], clamp) }}>CARTAZ É…</div>
      </div>
      <AbsoluteFill style={{ background: '#fff', opacity: strobe }} />
    </AbsoluteFill>
  );
};

const Outro: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = usePulse();
  const row = (i: number) => spring({ frame: f - 6 - i * 6, fps, config: { damping: 13 } });
  const names = ['SÉRGIO ROSSI', ...ARTISTS.map((a) => a.lines.join(' '))];
  const sponsors = ['sp_fidalgo.jpg', 'sp_mente.jpg', 'sp_prisquel.jpg', 'sp_amouri.jpg', 'sp_juntas.jpg', 'sp_barreiro.jpg'];
  const end = interpolate(f, [3 * BAR + 30, 3 * BAR + 58], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 30%, #17643f, ${G} 45%, ${G2})`, opacity: end }}>
      <Beams opacity={0.7} />
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 200 }}>
        <div style={{ transform: `scale(${row(0) * (1 + p * 0.02)})`, textAlign: 'center' }}>
          <Tag text="FESTIVAL SOLIDÁRIO" size={30} />
          <div style={{ ...ANTON, fontSize: 130, color: '#fff', marginTop: 20 }}>UNIDOS PELA</div>
          <div style={{ ...ANTON, fontSize: 158, color: GOLD }}>INCLUSÃO</div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px 18px', width: 960, marginTop: 30, opacity: row(2) }}>
          {names.map((nm, i) => (
            <span key={nm} style={{ ...ANTON, fontSize: i === 0 ? 50 : 34, color: i === 0 ? GOLD : '#fff' }}>
              {nm}{i < names.length - 1 && <span style={{ color: GOLD, margin: '0 0 0 18px' }}>•</span>}
            </span>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, width: 960, marginTop: 44 }}>
          {[
            ['28 NOVEMBRO', 'SÁBADO'],
            ['10H – 01H', 'HORÁRIO'],
            ['5 BOLAS', 'ENTRADA'],
            ['PAVILHÃO', 'VÍTOR DOMINGOS'],
          ].map(([a, b], i) => (
            <div key={a} style={{ background: GOLD, color: G2, borderRadius: 18, padding: '18px 10px', textAlign: 'center', transform: `scale(${row(4 + i)})` }}>
              <div style={{ ...ANTON, fontSize: 64 }}>{a}</div>
              <div style={{ ...MONT, fontSize: 22, letterSpacing: '.22em', marginTop: 6 }}>{b}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 40, background: '#fff', borderRadius: 18, width: 960, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0 16px', opacity: row(9) }}>
          {sponsors.map((s) => (
            <Img key={s} src={img(s)} style={{ height: 84, maxWidth: 150, objectFit: 'contain' }} />
          ))}
          <div style={{ ...MONT, fontSize: 12, color: '#3d2a16', textAlign: 'center', border: '2px solid #6b4b2a', borderRadius: 8, padding: '4px 8px' }}>
            PASTELARIA<div style={{ ...ANTON, fontSize: 26 }}>IRIS</div>
          </div>
        </div>
        <div style={{ ...ANTON, fontSize: 92, color: '#fff', marginTop: 40, transform: `scale(${row(11) * (1 + p * 0.04)})` }}>
          NÃO <span style={{ color: GOLD }}>FALTES!</span>
        </div>
      </AbsoluteFill>
      <Flash at={[0]} len={8} />
      <Grain />
    </AbsoluteFill>
  );
};

/* ---------- audio ---------- */

const clipWindows = [
  ...ARTISTS.map((a, i) => ({ a, from: T.artists + i * T.artistLen, len: T.artistLen })),
  { a: HEADLINER, from: T.headliner, len: 3 * BAR },
].filter((w) => w.a.clip);

const bedVolume = (f: number) => {
  const inClip = clipWindows.some((w) => f >= w.from + 4 && f < w.from + w.len - 4);
  return inClip ? 0.18 : 1;
};

export const PromoUnidos: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Audio src={staticFile('promo_unidos/audio/bed.wav')} volume={bedVolume} />
      {clipWindows.map((w) => (
        <Sequence key={w.a.id} from={w.from} durationInFrames={w.len}>
          <Audio
            src={staticFile(`promo_unidos/audio/${w.a.clip}`)}
            startFrom={Math.round((w.a.clipFrom ?? 0) * 30)}
            volume={(f) => interpolate(f, [0, 6, w.len - 8, w.len], [0, 1, 1, 0], clamp)}
          />
        </Sequence>
      ))}

      <Sequence from={T.intro} durationInFrames={T.artists}>
        <Intro />
      </Sequence>
      {ARTISTS.map((a, i) => (
        <Sequence key={a.id} from={T.artists + i * T.artistLen} durationInFrames={T.artistLen}>
          <ArtistScene a={a} n={i + 1} total={ARTISTS.length + 1} />
        </Sequence>
      ))}
      <Sequence from={T.tease} durationInFrames={BAR}>
        <Tease />
      </Sequence>
      <Sequence from={T.headliner} durationInFrames={3 * BAR}>
        <ArtistScene a={HEADLINER} n={ARTISTS.length + 1} total={ARTISTS.length + 1} headliner />
      </Sequence>
      <Sequence from={T.outro} durationInFrames={T.end - T.outro}>
        <Outro />
      </Sequence>
      <Sequence from={T.artists} durationInFrames={T.tease - T.artists}>
        <Ticker top={1590} />
      </Sequence>
    </AbsoluteFill>
  );
};
