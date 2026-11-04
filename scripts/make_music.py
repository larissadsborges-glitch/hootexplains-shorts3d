"""Compose a simple, upbeat, copyright-free background loop in code.

Writes public/music/bed.wav (~120 s). Placeholder until a real library track
is dropped in at the same path.
Chords I-V-vi-IV in C at 112 BPM: soft pad, plucked arpeggio, light kick and hats.
"""
import os

import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

SR = 44100
BPM = 112
BEAT = 60 / BPM
LENGTH = 120.0
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "music")
rs = np.random.default_rng(1)


def midi(n):
    return 440 * 2 ** ((n - 69) / 12)


def lp(x, f):
    return sosfilt(butter(2, f, fs=SR, output="sos"), x)


def hp(x, f):
    return sosfilt(butter(2, f, btype="high", fs=SR, output="sos"), x)


CHORDS = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]]  # C G Am F
N = int(LENGTH * SR)
out = np.zeros(N)


def add(sig, at):
    i = int(at * SR)
    if i >= N:
        return
    j = min(N, i + len(sig))
    out[i:j] += sig[: j - i]


def pad(notes, dur):
    t = np.arange(int(dur * SR)) / SR
    x = sum(np.sin(2 * np.pi * midi(n) * t) + 0.3 * np.sin(2 * np.pi * midi(n) * 2.003 * t) for n in notes)
    e = np.minimum(1, t / 0.4) * np.minimum(1, (dur - t) / 0.4)
    return lp(x, 1800) * e * 0.06


def pluck(n, dur=0.35):
    t = np.arange(int(dur * SR)) / SR
    f = midi(n)
    x = np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * 2 * f * t) + 0.15 * np.sin(2 * np.pi * 3 * f * t)
    return x * np.exp(-t * 9) * 0.09


def kick():
    t = np.arange(int(0.25 * SR)) / SR
    return np.sin(2 * np.pi * (50 + 80 * np.exp(-t * 30)) * t) * np.exp(-t * 14) * 0.35


def hat():
    t = np.arange(int(0.05 * SR)) / SR
    return hp(rs.standard_normal(len(t)), 7000) * np.exp(-t * 90) * 0.05


bar = 4 * BEAT
nbars = int(LENGTH / bar) + 1
arp = [0, 1, 2, 1, 2, 0, 1, 2]
for b in range(nbars):
    t0 = b * bar
    ch = CHORDS[b % 4]
    add(pad([n - 12 for n in ch], bar + 0.4), t0)
    add(pluck(ch[0] - 24, 0.6) * 1.6, t0)  # bass note
    if b >= 2:  # let the arpeggio come in after two bars
        for k in range(8):
            add(pluck(ch[arp[k]] + 12), t0 + k * BEAT / 2)
    for k in range(4):
        if b >= 1:
            add(kick(), t0 + k * BEAT)
            add(hat(), t0 + k * BEAT + BEAT / 2)

fade = int(2.0 * SR)
out[-fade:] *= np.linspace(1, 0, fade)
out = out / np.max(np.abs(out)) * 0.8
os.makedirs(OUT, exist_ok=True)
sf.write(os.path.join(OUT, "bed.wav"), np.stack([out, out], 1).astype(np.float32), SR)
print("wrote music/bed.wav", LENGTH, "s")
