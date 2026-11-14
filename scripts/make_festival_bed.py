"""Festival-style music bed for the 'Unidos pela Inclusão' promo (copyright-free, made in code).

100 BPM -> 1 beat = 0.6 s = 18 frames at 30 fps, 1 bar = 72 frames.
Structure (bars): intro build 0-3, drop (N_ART artists x 2 bars), tease 1 bar, headliner 3 bars,
outro 3 bars, tail. Impacts land on every artist reveal.
Writes public/promo_unidos/audio/bed.wav
"""
import os
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

SR = 44100
BEAT = 0.6
BAR = 4 * BEAT
N_ART = int(os.environ.get('N_ART', 7))  # artists before the headliner, 2 bars each
DROP_END = 3 + 2 * N_ART
BARS = DROP_END + 7
LENGTH = BARS * BAR + 2.0
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "promo_unidos", "audio", os.environ.get("BED_NAME", "bed.wav"))
rs = np.random.default_rng(7)
N = int(LENGTH * SR)
L = np.zeros(N); R = np.zeros(N)


def midi(n): return 440 * 2 ** ((n - 69) / 12)
def lp(x, f): return sosfilt(butter(2, f, fs=SR, output="sos"), x)
def hp(x, f): return sosfilt(butter(2, f, btype="high", fs=SR, output="sos"), x)
def env(n, a=0.005, d=0.2):
    t = np.arange(n) / SR
    return np.minimum(t / a, 1) * np.exp(-t / d)


def add(sig, at, pan=0.0, gain=1.0):
    i = int(at * SR)
    if i >= N: return
    s = sig[: N - i] * gain
    L[i:i + len(s)] += s * (1 - max(pan, 0)); R[i:i + len(s)] += s * (1 + min(pan, 0))


def kick():
    n = int(0.45 * SR); t = np.arange(n) / SR
    f = 45 + 120 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7) * 0.9


def clap():
    n = int(0.25 * SR); x = hp(rs.standard_normal(n), 900)
    e = sum(np.roll(env(n, 0.001, 0.012), int(k * 0.011 * SR)) for k in range(3)) + env(n, 0.001, 0.09)
    return lp(x, 6000) * e * 0.35


def hat(open_=False):
    n = int((0.18 if open_ else 0.05) * SR)
    return hp(rs.standard_normal(n), 7000) * env(n, 0.001, 0.06 if open_ else 0.015) * 0.18


def saw(f, n):
    t = np.arange(n) / SR
    return sum(np.sin(2 * np.pi * f * k * t) / k for k in range(1, 12))


def supersaw(notes, dur, cutoff=3000):
    n = int(dur * SR); x = np.zeros(n)
    for m in notes:
        for det in (-0.12, 0, 0.12):
            x += saw(midi(m + det), n)
    return lp(x, cutoff) / (len(notes) * 9)


def impact():
    n = int(2.2 * SR); t = np.arange(n) / SR
    boom = np.sin(2 * np.pi * np.cumsum(38 + 80 * np.exp(-t * 9)) / SR) * np.exp(-t * 2.2)
    noise = lp(rs.standard_normal(n), 2500) * np.exp(-t * 4) * 0.4
    return (boom + noise) * 0.8


def riser(dur):
    n = int(dur * SR); t = np.arange(n) / SR
    x = rs.standard_normal(n); out = np.zeros(n); step = int(0.05 * SR)
    for i in range(0, n, step):
        fc = 300 + 9000 * (i / n) ** 2
        seg = x[i:i + step]
        out[i:i + len(seg)] = lp(seg, fc)
    tone = np.sin(2 * np.pi * np.cumsum(200 + 900 * (t / dur) ** 2) / SR) * 0.15
    return (out * 0.35 + tone) * (t / dur) ** 1.5


def snare_roll(dur):
    out = np.zeros(int(dur * SR)); steps = 16
    for k in range(steps):
        at = dur * (1 - (1 - k / steps) ** 1.2); i = int(at * SR)
        c = clap()[: len(out) - i] * (0.4 + 0.6 * k / steps)
        out[i:i + len(c)] += c
    return out


# Progression Am F C G (minor, festival anthem)
PROG = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]
ROOTS = [45, 41, 36, 43]
K, C = kick(), clap()

for bar in range(BARS):
    t0 = bar * BAR
    ch = PROG[bar % 4]; root = ROOTS[bar % 4]
    intro = bar < 3; tease = bar == DROP_END; outro_end = bar >= BARS - 1
    if intro:
        cut = 600 + 2500 * (bar / 3)
        add(supersaw([n + 12 for n in ch], BAR, cut) * np.linspace(0.7, 1, int(BAR * SR)), t0, gain=1.4)
        add(lp(np.tanh(2 * np.sin(2 * np.pi * midi(root) * np.arange(int(BAR * SR)) / SR)), 300) * env(int(BAR * SR), 0.05, 2.0), t0, gain=0.35)
        for b in range(4):
            add(K, t0 + b * BEAT, gain=0.35 if bar < 2 else 0.6)
            if bar >= 1: add(hat(), t0 + b * BEAT + BEAT / 2, gain=0.6)
        continue
    if tease:
        add(supersaw([n + 12 for n in ch], BAR, 1200), t0, gain=0.4)
        add(snare_roll(BAR), t0, gain=0.8)
        add(riser(BAR), t0, gain=0.9)
        continue
    if outro_end:
        add(supersaw([n + 12 for n in PROG[0]], 2 * BAR, 2500) * np.exp(-np.arange(int(2 * BAR * SR)) / SR / 1.2), t0, gain=0.7)
        add(impact(), t0, gain=1.0)
        break
    # drop groove
    for b in range(4):
        add(K, t0 + b * BEAT)
        add(hat(open_=True), t0 + b * BEAT + BEAT / 2, pan=0.3)
        add(hat(), t0 + b * BEAT + BEAT / 4, pan=-0.3, gain=0.7)
        add(hat(), t0 + b * BEAT + 3 * BEAT / 4, pan=-0.3, gain=0.7)
        if b in (1, 3): add(C, t0 + b * BEAT, gain=0.9)
        # sidechained stabs on offbeats
        n = int(BEAT / 2 * SR)
        st = supersaw([x + 12 for x in ch], BEAT / 2, 3500) * env(n, 0.004, 0.18)
        add(st, t0 + b * BEAT + BEAT / 2, pan=0.15, gain=1.0)
        add(st, t0 + b * BEAT + BEAT / 2 + 0.012, pan=-0.15, gain=0.8)
        # bass
        nb = int(BEAT * SR); tb = np.arange(nb) / SR
        bass = np.tanh(2.5 * np.sin(2 * np.pi * midi(root) * tb)) * np.minimum(tb / 0.08, 1) * np.exp(-tb * 1.5)
        add(lp(bass, 400), t0 + b * BEAT, gain=0.45)

# impacts on reveals: drop (bar 3), each artist (bars 3,5,...,17), headliner (bar 20), outro (bar 23)
for bar in list(range(3, DROP_END, 2)) + [DROP_END + 1, DROP_END + 4]:
    add(impact(), bar * BAR, gain=0.7 if bar not in (3, DROP_END + 1) else 1.0)
add(riser(2 * BAR), 1 * BAR, gain=0.9)
add(snare_roll(BAR), 2 * BAR, gain=0.7)
add(riser(BAR), (DROP_END + 3) * BAR, gain=0.6)

mix = np.stack([L, R], 1)
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
mix /= np.max(np.abs(mix)) * 1.12
fade = int(1.5 * SR); mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
sf.write(OUT, mix.astype(np.float32), SR)
print("wrote", OUT, round(LENGTH, 2), "s")
