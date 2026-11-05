"""Word timings for a Tavinho episode from its script alone (no voice yet), plus a silent voice.wav.

Usage: python scripts/tav_timing.py <videoId>   (reads videos/<id>/script.json, writes public/videos/<id>/)
The owner is getting an ElevenLabs voice; until then the episode is built and reviewed on these timings.
Every animation is pinned to words, so swapping in the real voice + its timings re-times the whole video.
Pace: ~2.9 words/s like the narrator we had (2.9 measured), short pauses at commas/colons, longer between beats,
and a held beat before reveals (events "card" and "twist").
"""
import json
import os
import re
import sys

import numpy as np
import soundfile as sf

vid = sys.argv[1]
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
script = json.load(open(os.path.join(root, "videos", vid, "script.json"), encoding="utf-8"))
UNIT = 0.05          # seconds per letter-ish unit
PHRASE_GAP = 0.14    # after , : ;
BEAT_GAP = 0.3       # between beats
REVEAL = 0.25        # extra hold before a reveal beat

t = script.get("leadIn", 0.05)
beats = []
for bi, b in enumerate(script["beats"]):
    if b["event"] in ("card", "twist") and bi > 0:
        t += REVEAL
    words, start = [], t
    for w in b["text"].split():
        d = UNIT * (len(re.sub(r"[^\w]", "", w)) + 1.6)
        words.append({"word": w, "start": round(t, 3), "end": round(t + d, 3)})
        t += d
        if re.search(r"[,:;]$", w):
            t += PHRASE_GAP
        elif re.search(r"[.?!]$", w) and w is not b["text"].split()[-1]:
            t += PHRASE_GAP * 1.5
    beats.append({**{k: v for k, v in b.items() if k != "speed"}, "index": bi, "start": round(start, 3), "end": round(words[-1]["end"], 3), "words": words})
    t += BEAT_GAP
duration = round(t - BEAT_GAP + script.get("tail", 1.0), 3)
out = os.path.join(root, "public", "videos", vid)
os.makedirs(out, exist_ok=True)
meta = {k: v for k, v in script.items() if k != "beats"}
meta.update({"voice": "none (script timing; ElevenLabs pending)", "duration": duration, "beats": beats})
json.dump(meta, open(os.path.join(out, "timings.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
sf.write(os.path.join(out, "voice.wav"), np.zeros(int(duration * 24000), np.float32), 24000)
n = sum(len(b["words"]) for b in beats)
print(vid, "duration", duration, "s,", n, "words,", round(n / duration, 2), "words/s; you at", next(b["start"] for b in beats if b["event"] == "you"))
