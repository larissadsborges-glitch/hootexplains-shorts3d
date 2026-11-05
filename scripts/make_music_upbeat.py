"""Two energetic, copyright-free comedy beds made in code, for A Vida do Tavinho (fast cuts, vote comedy).

Usage: python scripts/make_music_upbeat.py   -> public/music/upbeat_a.wav, public/music/upbeat_b.wav (~75 s each)
A: 124 BPM bouncy pop (four-on-the-floor kick, claps on 2 and 4, swung hats, octave bass, marimba hook), F major.
B: 132 BPM "sneaky chase" comedy (staccato bass, pizzicato hook, snare rolls into each 8th bar), D minor.
The old slow bed (scripts/make_music.py -> bed.wav) is kept for Hoot.
"""
import os

import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

SR = 44100
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "music")
rs = np.random.default_rng(7)


def midi(n):
    return 440 * 2 ** ((n - 69) / 12)


def filt(x, f, kind="low", order=2):
    return sosfilt(butter(order, f, btype=kind, fs=SR, output="sos"), x)


def tt(d):
    return np.arange(int(d * SR)) / SR


def kick():
    t = tt(0.3)
    return np.sin(2 * np.pi * (48 + 110 * np.exp(-t * 35)) * t) * np.exp(-t * 11) * 0.55 + filt(rs.standard_normal(len(t)), 4000, "high") * np.exp(-t * 300) * 0.06


def clap():
    t = tt(0.25)
    n = filt(rs.standard_normal(len(t)), [900, 5000], "band")
    e = sum(np.exp(-np.maximum(0, t - k * 0.011) * 60) * (t >= k * 0.011) for k in range(3)) / 3
    return n * e * 0.32


def snare():
    t = tt(0.2)
    return (filt(rs.standard_normal(len(t)), [1500, 7000], "band") * 0.3 + np.sin(2 * np.pi * 190 * t) * 0.15) * np.exp(-t * 28)


def hat(open_=False):
    t = tt(0.18 if open_ else 0.05)
    return filt(rs.standard_normal(len(t)), 8000, "high") * np.exp(-t * (18 if open_ else 95)) * 0.07


def bass(n, d, bright=1.0):
    t = tt(d)
    f = midi(n)
    x = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t) * bright + 0.12 * np.sin(2 * np.pi * 3 * f * t) * bright
    e = np.minimum(1, t / 0.005) * np.exp(-t * 6)
    return filt(x * e, 900) * 0.32


def marimba(n, d=0.4):
    t = tt(d)
    f = midi(n)
    x = np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * 4 * f * t) * np.exp(-t * 30) + 0.2 * np.sin(2 * np.pi * 10 * f * t) * np.exp(-t * 60)
    return x * np.exp(-t * 9) * 0.13


def pizz(n, d=0.3):
    t = tt(d)
    f = midi(n)
    x = sum((0.6 ** k) * np.sin(2 * np.pi * f * (k + 1) * t) for k in range(5))
    return filt(x * np.minimum(1, t / 0.003) * np.exp(-t * 14), 3500) * 0.12


def stab(notes, d=0.18):
    t = tt(d)
    x = sum(np.sign(np.sin(2 * np.pi * midi(n) * t)) * 0.5 + np.sin(2 * np.pi * midi(n) * t) for n in notes)
    return filt(x * np.exp(-t * 16), 2400) * 0.035


def render(bpm, length, bars_fn):
    n = int(length * SR)
    out = np.zeros(n)

    def add(sig, at):
        i = int(at * SR)
        if 0 <= i < n:
            j = min(n, i + len(sig))
            out[i:j] += sig[: j - i]

    beat = 60 / bpm
    for b in range(int(length / (4 * beat)) + 1):
        bars_fn(add, b, b * 4 * beat, beat)
    f = int(1.5 * SR)
    out[-f:] *= np.linspace(1, 0, f)
    out[: int(0.02 * SR)] *= np.linspace(0, 1, int(0.02 * SR))
    # gentle bus compression-ish: soft clip, then normalise
    out = np.tanh(out * 1.6) / 1.6
    return out / np.max(np.abs(out)) * 0.85


# ------------------------------------------------------------------ A: bouncy pop, F major
A_CH = [[65, 69, 72], [60, 64, 67], [62, 65, 69], [58, 62, 65]]  # F C Dm Bb
A_HOOK = [77, 79, 81, 79, 77, 74, 77, None, 76, 77, 79, 76, 72, None, 74, 76]  # 8th notes over 2 bars


def bars_a(add, b, t0, beat):
    ch = A_CH[b % 4]
    sw = beat / 2 * 0.12  # swing
    for k in range(4):
        add(kick(), t0 + k * beat)
        if k % 2 == 1:
            add(clap(), t0 + k * beat)
        for h in range(2):
            add(hat(open_=(h == 1 and k == 3)), t0 + k * beat + h * beat / 2 + (sw if h else 0))
    root = ch[0] - 24
    for k, (o, d) in enumerate([(0, 0.5), (12, 0.5), (0, 0.5), (12, 0.5), (0, 0.5), (12, 0.5), (7, 0.5), (12, 0.5)]):
        add(bass(root + o, beat * d * 0.95), t0 + k * beat / 2)
    for k in (1, 3):
        add(stab([x + 12 for x in ch]), t0 + k * beat + beat / 2)
    if b >= 2:
        half = A_HOOK[(b % 2) * 8:(b % 2) * 8 + 8]
        for k, note in enumerate(half):
            if note:
                add(marimba(note), t0 + k * beat / 2 + (sw if k % 2 else 0))


# ------------------------------------------------------------------ B: sneaky chase, D minor
B_BASS = [50, 50, 53, 50, 55, 53, 50, 48]  # staccato 8ths
B_HOOK = [62, 65, 69, 65, 62, None, 61, 62, 65, 64, 62, 61, 57, None, 58, 61]


def bars_b(add, b, t0, beat):
    for k in range(4):
        add(kick(), t0 + k * beat) if k in (0, 2) else None
        if k in (1, 3):
            add(snare(), t0 + k * beat)
        for h in range(2):
            add(hat(), t0 + k * beat + h * beat / 2)
    shift = [0, 0, 3, -2][b % 4]
    for k, note in enumerate(B_BASS):
        add(bass(note - 12 + shift, beat * 0.3, bright=1.3), t0 + k * beat / 2)
    if b >= 1:
        half = B_HOOK[(b % 2) * 8:(b % 2) * 8 + 8]
        for k, note in enumerate(half):
            if note:
                add(pizz(note + shift), t0 + k * beat / 2)
    if b % 8 == 7:  # snare roll into the next phrase
        for k in range(8):
            add(snare() * (0.4 + 0.08 * k), t0 + 3 * beat + k * beat / 8)


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for name, bpm, fn in (("upbeat_a", 124, bars_a), ("upbeat_b", 132, bars_b)):
        x = render(bpm, 75.0, fn)
        sf.write(os.path.join(OUT, f"{name}.wav"), np.stack([x, x], 1).astype(np.float32), SR)
        print("wrote", name)
