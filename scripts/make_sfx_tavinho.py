"""Sound effects for A Vida do Tavinho (owner feedback 5 Nov 2026: a sound "like a fart", whooshes confused with breaths).

Usage: python scripts/make_sfx_tavinho.py   -> public/sfx/{swish,ding,notif,splat,hit}.wav
Rules for these: nothing low and buzzy, no falling low pitch (both read as rude noises), every sound short and clearly "cartoon".
- swish: scene change; fast, bright, airy (2-9 kHz) with a rising whistle, 0.22 s. Unlike a breath (300-2400 Hz puff).
- ding:  microwave bell, one clean 2.1 kHz strike with a soft 2nd partial.
- notif: messages piling up: 5 quick rising "plink"s (replaces the 217 Hz GSM buzz).
- splat: egg hitting the floor: a short wet crack, mid-high, 0.25 s.
- hit:   the twist: a tight low boom at a FIXED pitch (no glide) plus a bright crash tail.
"""
import os
import sys

import numpy as np
import soundfile as sf

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_sfx import OUT, SR, bp, lp, noise, norm, t_  # noqa: E402


def swish(d=0.22):
    tt = t_(d)
    k = tt / d
    air = bp(noise(d), 2000, 9000) * np.sin(np.pi * k) ** 1.5
    whistle = np.sin(2 * np.pi * (1800 * tt + 2600 * tt ** 2 / d / 2)) * np.sin(np.pi * k) ** 3 * 0.12
    return norm(air + whistle, 0.6)


def ding(d=1.2):
    tt = t_(d)
    x = np.sin(2 * np.pi * 2093 * tt) * np.exp(-tt * 3.5) + 0.35 * np.sin(2 * np.pi * 5230 * tt) * np.exp(-tt * 9)
    return norm(x * np.minimum(1, tt / 0.002), 0.7)


def notif(d=1.1):
    tt = t_(d)
    out = np.zeros_like(tt)
    for i, f in enumerate([1320, 1480, 1660, 1760, 1980]):
        t0 = i * 0.17
        m = tt >= t0
        u = tt[m] - t0
        out[m] += np.sin(2 * np.pi * f * u) * np.exp(-u * 22) * (0.7 + 0.06 * i)
    return norm(out, 0.65)


def splat(d=0.25):
    tt = t_(d)
    crack = bp(noise(d), 1800, 7000) * np.exp(-tt * 45)
    wet = bp(noise(d), 600, 2500) * np.exp(-tt * 18) * (1 + 0.6 * np.sin(2 * np.pi * 38 * tt))
    return norm(crack + 0.6 * wet, 0.7)


def hit(d=1.4):
    tt = t_(d)
    boom = np.sin(2 * np.pi * 58 * tt) * np.exp(-tt * 9) * np.minimum(1, tt / 0.003)
    punch = lp(noise(d), 1200) * np.exp(-tt * 40) * 0.5
    crash = bp(noise(d), 3000, 11000) * np.exp(-tt * 3.2) * 0.35
    # a short bright stab (A minor triad, 440/523/659 Hz) so phone speakers hear the hit too
    stab = sum(np.sin(2 * np.pi * f * tt) for f in (440, 523.25, 659.25)) * np.exp(-tt * 7) * np.minimum(1, tt / 0.002) * 0.35
    return norm(boom + punch + crash + stab, 0.9)


def gulp(d=0.32):
    """A cartoon swallow: two quick RISING bloops (300->650 Hz), short and clean."""
    tt = t_(d)
    out = np.zeros_like(tt)
    for t0, f0 in ((0.0, 300), (0.13, 380)):
        m = tt >= t0
        u = tt[m] - t0
        f = f0 + 900 * u
        out[m] += np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-u * 26) * np.minimum(1, u / 0.004)
    return norm(out, 0.7)


if __name__ == "__main__":
    for name, fn in [("swish", swish), ("ding", ding), ("notif", notif), ("splat", splat), ("hit", hit), ("gulp", gulp)]:
        sf.write(os.path.join(OUT, f"{name}.wav"), fn(), SR)
        print("wrote", name, round(len(fn()) / SR, 2), "s")
