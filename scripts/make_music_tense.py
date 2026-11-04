"""Dark, tense, copyright-free bed for news/mystery videos -> public/music/tense.wav

D minor, 76 BPM: low drone pad (Dm - Bb - Gm - A), pulsing 8th-note bass,
a soft clock tick on every beat and sparse high pings. No drums, no melody,
so it never competes with the voice.
"""
import os

import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

SR = 44100
BPM = 76
BEAT = 60 / BPM
LENGTH = 110.0
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "music")
rs = np.random.default_rng(7)
N = int(LENGTH * SR)
out = np.zeros(N)


def midi(n):
    return 440 * 2 ** ((n - 69) / 12)


def lp(x, f):
    return sosfilt(butter(2, f, fs=SR, output="sos"), x)


def bp(x, lo, hi):
    return sosfilt(butter(2, [lo, hi], btype="band", fs=SR, output="sos"), x)


def add(sig, at):
    i = int(at * SR)
    if i >= N:
        return
    j = min(N, i + len(sig))
    out[i:j] += sig[: j - i]


def pad(notes, dur):
    t = np.arange(int(dur * SR)) / SR
    x = sum(np.sin(2 * np.pi * midi(n) * t) + 0.25 * np.sin(2 * np.pi * midi(n) * 1.004 * t + 1) for n in notes)
    e = np.minimum(1, t / 1.2) * np.minimum(1, (dur - t) / 1.2)
    return lp(x, 900) * e * 0.07


def bass(n, dur):
    t = np.arange(int(dur * SR)) / SR
    x = np.sin(2 * np.pi * midi(n) * t) + 0.3 * np.sin(2 * np.pi * 2 * midi(n) * t)
    return x * np.exp(-t * 7) * 0.16


def tick():
    t = np.arange(int(0.04 * SR)) / SR
    return bp(rs.standard_normal(len(t)), 2500, 6000) * np.exp(-t * 160) * 0.08


def ping(n):
    t = np.arange(int(2.5 * SR)) / SR
    return np.sin(2 * np.pi * midi(n) * t) * np.exp(-t * 2.2) * 0.05


CHORDS = [[50, 53, 57], [46, 50, 53], [43, 46, 50], [45, 49, 52]]  # Dm Bb Gm A
bar = 4 * BEAT
for b in range(int(LENGTH / bar) + 1):
    t0 = b * bar
    ch = CHORDS[b % 4]
    add(pad([n - 12 for n in ch] + [ch[0]], bar + 1.2), t0)
    for k in range(8):
        if b >= 1:
            add(bass(ch[0] - 24, BEAT / 2), t0 + k * BEAT / 2)
    for k in range(4):
        add(tick() * (1.0 if k % 2 == 0 else 0.6), t0 + k * BEAT)
    if b % 2 == 1:
        add(ping(ch[2] + 24), t0 + 2.5 * BEAT)

fade = int(2.5 * SR)
out[-fade:] *= np.linspace(1, 0, fade)
out = out / np.max(np.abs(out)) * 0.8
os.makedirs(OUT, exist_ok=True)
sf.write(os.path.join(OUT, "tense.wav"), np.stack([out, out], 1).astype(np.float32), SR)
print("wrote music/tense.wav", LENGTH, "s")
