"""Per-frame mouth openness (0..1) from voice.wav, stored in timings.json as "mouth" (30 fps).

Usage: python3 scripts/mouth.py <videoId>
Hoot's beak (or any talking character) reads timings.mouth[frame].
"""
import json, os, sys
import numpy as np, soundfile as sf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
vid = sys.argv[1]
d = os.path.join(ROOT, 'public', 'videos', vid)
a, sr = sf.read(os.path.join(d, 'voice.wav'))
if a.ndim > 1: a = a.mean(axis=1)
fps = 30; hop = sr // fps
n = len(a) // hop
rms = np.array([np.sqrt(np.mean(a[i*hop:(i+1)*hop] ** 2)) for i in range(n)])
ref = np.percentile(rms[rms > 0.01], 90) if np.any(rms > 0.01) else 1
o = np.clip((rms - 0.012) / (ref - 0.012), 0, 1) ** 0.7
# quick attack, softer release, so syllables read as separate openings
sm = np.zeros_like(o)
for i in range(n):
    p = sm[i-1] if i else 0
    sm[i] = o[i] if o[i] > p else p * 0.55 + o[i] * 0.45
t = json.load(open(os.path.join(d, 'timings.json')))
t['mouth'] = [round(float(x), 3) for x in sm]
json.dump(t, open(os.path.join(d, 'timings.json'), 'w'), indent=1)
print(vid, 'mouth frames', n, 'open>0.3:', int((sm > 0.3).sum()))
