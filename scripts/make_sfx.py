"""Synthesise the stock sound effects into public/sfx/*.wav.

Placeholder-quality SFX generated in code (no downloads). Swap any file for a
real recording with the same name and everything keeps working.
"""
import os

import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

SR = 44100
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "sfx")
rs = np.random.default_rng(3)


def t_(d):
    return np.arange(int(d * SR)) / SR


def noise(d):
    return rs.standard_normal(int(d * SR))


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], btype="band", fs=SR, output="sos"), x)


def lp(x, f, order=2):
    return sosfilt(butter(order, f, btype="low", fs=SR, output="sos"), x)


def env(n, a, d_curve):
    e = np.ones(n)
    ai = int(a * SR)
    if ai:
        e[:ai] = np.linspace(0, 1, ai)
    e[ai:] = d_curve(np.arange(n - ai) / SR)
    return e


def norm(x, peak=0.9):
    return (x / (np.max(np.abs(x)) + 1e-9) * peak).astype(np.float32)


def whoosh(d=0.45):
    n = noise(d)
    tt = t_(d)
    # sweep a band-pass upward by mixing two bands with crossfade
    lo, hi = bp(n, 300, 1200), bp(n, 1200, 5000)
    k = tt / d
    x = lo * (1 - k) + hi * k
    e = np.sin(np.pi * k) ** 2
    return norm(x * e, 0.7)


def clunk():
    d = 0.18
    tt = t_(d)
    tone = np.sin(2 * np.pi * 170 * tt) * np.exp(-tt * 30) + 0.5 * np.sin(2 * np.pi * 330 * tt) * np.exp(-tt * 45)
    click = bp(noise(d), 800, 4000) * np.exp(-tt * 120)
    return norm(tone + 0.5 * click, 0.8)


def creak(d=0.75):
    tt = t_(d)
    f = 90 + 25 * np.sin(2 * np.pi * 3.5 * tt) + 40 * tt
    phase = 2 * np.pi * np.cumsum(f) / SR
    saw = 2 * ((phase / (2 * np.pi)) % 1) - 1
    x = bp(saw, 150, 1800) * (0.6 + 0.4 * np.sin(2 * np.pi * 11 * tt))
    e = np.minimum(1, tt / 0.15) * np.minimum(1, (d - tt) / 0.1)
    return norm(x * e, 0.6)


def crack():
    d = 0.9
    tt = t_(d)
    snap = bp(noise(d), 1500, 9000) * np.exp(-tt * 40)
    splinters = sum(bp(noise(d), 2000, 7000) * np.exp(-np.maximum(0, tt - o) * 60) * (tt > o) * 0.4
                    for o in (0.03, 0.07, 0.12, 0.2))
    thump = np.sin(2 * np.pi * 70 * tt) * np.exp(-tt * 9)
    return norm(snap + splinters + 0.8 * thump, 0.95)


def splash():
    d = 1.3
    tt = t_(d)
    body = lp(noise(d), 2500) * np.exp(-tt * 3.2)
    hiss = bp(noise(d), 3000, 9000) * np.exp(-tt * 5) * 0.4
    plop = np.sin(2 * np.pi * (110 - 40 * tt) * tt) * np.exp(-tt * 12)
    bubbles = sum(np.sin(2 * np.pi * f * tt) * np.exp(-np.maximum(0, tt - o) * 25) * (tt > o) * 0.15
                  for f, o in ((620, 0.25), (880, 0.4), (540, 0.55), (760, 0.7)))
    e = np.minimum(1, tt / 0.01)
    return norm((body + hiss + plop + bubbles) * e, 0.9)


def engine(d=3.0):
    tt = t_(d)
    f = 55 + 8 * tt
    phase = 2 * np.pi * np.cumsum(f) / SR
    x = np.sign(np.sin(phase)) * 0.5 + np.sin(2 * phase) * 0.5
    x = lp(x, 600) * (0.8 + 0.2 * np.sin(2 * np.pi * 9 * tt))
    e = np.minimum(1, tt / 0.3) * np.minimum(1, (d - tt) / 0.3)
    return norm(x * e, 0.5)


def thud():
    d = 1.0
    tt = t_(d)
    boom = np.sin(2 * np.pi * (60 - 20 * tt) * tt) * np.exp(-tt * 5)
    impact = lp(noise(d), 900) * np.exp(-tt * 14)
    grit = bp(noise(d), 2000, 6000) * np.exp(-tt * 8) * 0.25
    return norm(boom + 0.7 * impact + grit, 0.95)


def riser(d=0.9):
    tt = t_(d)
    k = tt / d
    x = bp(noise(d), 1500, 7000) * k ** 2
    tone = np.sin(2 * np.pi * (300 + 900 * k ** 2) * tt) * k ** 2 * 0.3
    return norm(x + tone, 0.6)


def pop():
    d = 0.12
    tt = t_(d)
    return norm(np.sin(2 * np.pi * (900 - 3000 * tt) * tt) * np.exp(-tt * 40), 0.5)


def rain(d=10.0):
    tt = t_(d)
    hiss = bp(noise(d), 1500, 8000) * 0.5 + lp(noise(d), 600) * 0.35
    drops = np.zeros(len(tt))
    for o in rs.uniform(0, d - 0.05, 260):
        i = int(o * SR)
        n = int(0.02 * SR)
        drops[i:i + n] += np.sin(2 * np.pi * rs.uniform(1800, 3500) * tt[:n]) * np.exp(-tt[:n] * 250) * 0.4
    e = np.minimum(1, tt / 0.8) * np.minimum(1, (d - tt) / 0.8)
    return norm((hiss + drops) * e, 0.6)


def dig():
    d = 0.35
    tt = t_(d)
    scrape = bp(noise(d), 300, 2500) * np.exp(-tt * 9)
    thump = np.sin(2 * np.pi * 90 * tt) * np.exp(-tt * 25)
    return norm(scrape + 0.6 * thump, 0.8)


def pour(d=1.6):
    tt = t_(d)
    x = lp(noise(d), 900) * (0.7 + 0.3 * np.sin(2 * np.pi * 6 * tt))
    glug = sum(np.sin(2 * np.pi * f * tt) * np.exp(-np.maximum(0, tt - o) * 18) * (tt > o) * 0.25
               for f, o in ((140, 0.1), (120, 0.45), (160, 0.8), (130, 1.15)))
    e = np.minimum(1, tt / 0.1) * np.minimum(1, (d - tt) / 0.3)
    return norm((x + glug) * e, 0.7)


def brush(d=1.4):
    tt = t_(d)
    strokes = 0.5 + 0.5 * np.sin(2 * np.pi * 3 * tt) ** 2
    x = bp(noise(d), 2000, 7000) * strokes
    e = np.minimum(1, tt / 0.1) * np.minimum(1, (d - tt) / 0.2)
    return norm(x * e, 0.5)


def drip():
    d = 0.25
    tt = t_(d)
    return norm(np.sin(2 * np.pi * (1200 - 2500 * tt) * tt) * np.exp(-tt * 30), 0.5)


def drill(d=6.0):
    tt = t_(d)
    grind = bp(noise(d), 200, 1400) * (0.7 + 0.3 * np.sin(2 * np.pi * 7 * tt))
    hum = np.sin(2 * np.pi * 55 * tt) * 0.5 + np.sin(2 * np.pi * 110 * tt) * 0.25
    e = np.minimum(1, tt / 0.4) * np.minimum(1, (d - tt) / 0.4)
    return norm((grind + hum) * e, 0.6)


def gush(d=2.5):
    tt = t_(d)
    x = lp(noise(d), 1800) * 0.8 + bp(noise(d), 2500, 7000) * 0.3
    e = np.minimum(1, tt / 0.05) * np.exp(-np.maximum(0, tt - 1.2) * 2)
    return norm(x * e, 0.85)


def twang(d=0.9):
    tt = t_(d)
    f = 180 * np.exp(-tt * 1.5) + 60
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 4)
    snap = bp(noise(d), 2000, 9000) * np.exp(-tt * 60)
    return norm(x + 0.8 * snap, 0.9)


def screech(d=1.2):
    tt = t_(d)
    f = 2400 + 400 * np.sin(2 * np.pi * 13 * tt)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.4 + bp(noise(d), 3000, 9000) * 0.6
    e = np.minimum(1, tt / 0.05) * np.minimum(1, (d - tt) / 0.3)
    return norm(x * e, 0.7)


def zap(d=0.5):
    tt = t_(d)
    x = np.sign(np.sin(2 * np.pi * 120 * tt)) * bp(noise(d), 500, 6000)
    return norm(x * np.exp(-tt * 6), 0.6)


def spring(d=0.8):
    tt = t_(d)
    x = np.sin(2 * np.pi * (90 + 40 * np.sin(2 * np.pi * 9 * tt)) * tt) * np.exp(-tt * 5)
    return norm(x + 0.4 * lp(noise(d), 500) * np.exp(-tt * 10), 0.8)


def jet(d=5.0):
    """Cruise: turbofan whine over a soft airflow hiss."""
    tt = t_(d)
    whine = sum(np.sin(2 * np.pi * f * tt + i) * a for i, (f, a) in enumerate([(1850, 0.25), (3700, 0.1), (920, 0.15)]))
    air = lp(noise(d), 1200) * 0.8
    e = np.minimum(1, tt / 0.6) * np.minimum(1, (d - tt) / 0.6)
    return norm((whine * 0.5 + air) * e, 0.5)


def wind(d=6.0):
    """Dive: roaring air that rises in pitch and level."""
    tt = t_(d)
    k = tt / d
    n = noise(d)
    x = lp(n, 500) * (1 - k) + bp(n, 500, 3000) * k
    x = x * (0.4 + 0.6 * k) * (1 + 0.15 * np.sin(2 * np.pi * 7 * tt))
    e = np.minimum(1, tt / 0.3) * np.minimum(1, (d - tt) / 0.4)
    return norm(x * e, 0.7)


def thunder(d=2.5):
    tt = t_(d)
    x = lp(noise(d), 300) * (np.exp(-tt * 1.6) + 0.5 * np.exp(-((tt - 0.4) ** 2) / 0.05))
    crackle = bp(noise(d), 1500, 5000) * np.exp(-tt * 12) * 0.4
    return norm(x + crackle, 0.9)


def radio(d=0.6):
    """Push-to-talk: click, a burst of band-limited static, click."""
    tt = t_(d)
    st = bp(noise(d), 800, 3200) * 0.5
    e = (tt > 0.03) * (tt < d - 0.05)
    clicks = np.zeros_like(tt)
    for c in (0.0, d - 0.05):
        i = int(c * SR)
        clicks[i:i + 200] += np.exp(-np.arange(min(200, len(tt) - i)) / 30)
    return norm(st * e + clicks, 0.6)


def alarm(d=2.4):
    """Cockpit warning: repeating two-tone chime."""
    tt = t_(d)
    f = np.where((tt * 4).astype(int) % 2 == 0, 1100, 800)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.2 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    ph = (tt * 4) % 1
    gate = np.minimum(1, ph / 0.03) * np.clip((0.75 - ph) / 0.05, 0, 1)
    return norm(lp(x, 2500) * gate, 0.4)


def siren(d=5.0):
    """Distant emergency siren (soft, far away)."""
    tt = t_(d)
    f = 750 + 250 * np.sin(2 * np.pi * 0.4 * tt)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR)
    e = np.minimum(1, tt / 0.8) * np.minimum(1, (d - tt) / 0.8)
    return norm(lp(x, 1500) * e, 0.35)


def rumble(d=3.0):
    """Distant low boom (heard from far away, no sharp crack)."""
    tt = t_(d)
    x = lp(noise(d), 120) * np.exp(-tt * 1.2) + np.sin(2 * np.pi * 38 * tt) * np.exp(-tt * 2) * 0.5
    return norm(x * np.minimum(1, tt / 0.05), 0.8)


def heartbeat(d=1.0):
    tt = t_(d)
    beat = lambda t0: np.sin(2 * np.pi * 50 * (tt - t0)) * np.exp(-np.maximum(0, tt - t0) * 18) * (tt >= t0)
    return norm(beat(0.0) + 0.7 * beat(0.28), 0.8)


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for name, fn in [("whoosh", whoosh), ("clunk", clunk), ("creak", creak), ("crack", crack),
                     ("splash", splash), ("engine", engine), ("thud", thud), ("riser", riser), ("pop", pop),
                     ("rain", rain), ("dig", dig), ("pour", pour), ("brush", brush), ("drip", drip), ("drill", drill), ("gush", gush),
                     ("twang", twang), ("screech", screech), ("zap", zap), ("spring", spring),
                     ("jet", jet), ("wind", wind), ("thunder", thunder), ("radio", radio), ("alarm", alarm),
                     ("siren", siren), ("rumble", rumble), ("heartbeat", heartbeat)]:
        sf.write(os.path.join(OUT, f"{name}.wav"), fn(), SR)
        print("wrote", name)
