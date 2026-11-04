"""Phone sounds for the airplane mode video: headset buzz (GSM-style 'dit-dit-dit'), message ping, toggle click.

Usage: python3 scripts/make_sfx_phone.py   (writes public/sfx/buzz.wav, ping.wav, toggle.wav)
"""
import os
import sys

import numpy as np
import soundfile as sf

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_sfx import OUT, SR, bp, norm, noise, t_  # noqa: E402


def buzz(d=2.6):
    """Bursts of a harsh ~217 Hz pulse train (the classic phone-near-a-speaker 'dit-dit-dit')."""
    tt = t_(d)
    pulses = (np.sin(2 * np.pi * 217 * tt) > 0.92).astype(float)  # narrow pulses, 217 per second
    pulses = bp(pulses + 0.05 * noise(d), 300, 5000)
    gate = np.zeros_like(tt)
    # pattern: dit-dit-dit ... dit-dit-dit-dit ... dit-dit
    starts = [0.0, 0.16, 0.32, 0.85, 1.0, 1.15, 1.3, 1.85, 2.0]
    for s in starts:
        m = (tt >= s) & (tt < s + 0.11)
        gate[m] = 1.0
    # soften edges (5 ms)
    k = int(0.005 * SR)
    gate = np.convolve(gate, np.ones(k) / k, mode="same")
    return norm(pulses * gate, 0.85)


def ping(d=0.55):
    tt = t_(d)
    a = np.sin(2 * np.pi * 1318 * tt) * np.exp(-tt * 9) * (tt < 0.25)
    t2 = np.maximum(0, tt - 0.12)
    b = np.sin(2 * np.pi * 1760 * t2) * np.exp(-t2 * 7) * (tt >= 0.12)
    return norm(a + b, 0.7)


def toggle(d=0.12):
    tt = t_(d)
    c = bp(noise(d), 1500, 6000) * np.exp(-tt * 90)
    tone = 0.4 * np.sin(2 * np.pi * 2400 * tt) * np.exp(-tt * 60)
    return norm(c + tone, 0.7)


if __name__ == "__main__":
    for name, fn in [("buzz", buzz), ("ping", ping), ("toggle", toggle)]:
        sf.write(os.path.join(OUT, f"{name}.wav"), fn(), SR)
        print("wrote", name)
