"""Contact sheet with one frame per caption phrase (its middle), labelled with time and phrase.

Usage: python scripts/qa/phrase_sheet.py <videoId> <video.mp4> <out.jpg> [cols]
A 0.5 s sheet skips phrases shorter than 0.5 s; this one shows every shot the camera plan makes.
Phrases are grouped like the captions in src/tavinho/Episode.tsx (break at punctuation or after 3 words).
"""
import json
import os
import re
import subprocess
import sys
import tempfile

FF = r"C:\Users\borge\.hoottools\ffmpeg\ffmpeg.exe"
vid, video, out = sys.argv[1:4]
cols = int(sys.argv[4]) if len(sys.argv) > 4 else 10
root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
tm = json.load(open(os.path.join(root, "public", "videos", vid, "timings.json"), encoding="utf-8"))

phrases = []
for b in tm["beats"]:
    cur = []
    for i, w in enumerate(b["words"]):
        cur.append(w)
        if re.search(r"[.,:;?!]$", w["word"]) or len(cur) >= 3 or i == len(b["words"]) - 1:
            phrases.append(((cur[0]["start"] + cur[-1]["end"]) / 2, " ".join(x["word"] for x in cur)))
            cur = []

tmp = tempfile.mkdtemp()
for k, (t, text) in enumerate(phrases):
    label = re.sub(r"[^\w ]", "", f"{t:.1f} {text}")
    subprocess.run([FF, "-v", "error", "-y", "-ss", f"{t:.3f}", "-i", video, "-frames:v", "1", "-vf",
                    f"scale=216:-1,drawtext=text='{label}':x=4:y=4:fontsize=13:fontcolor=yellow:box=1:boxcolor=black@0.7",
                    os.path.join(tmp, f"{k:03d}.png")], check=True, stderr=subprocess.DEVNULL)
rows = (len(phrases) + cols - 1) // cols
subprocess.run([FF, "-v", "error", "-y", "-framerate", "1", "-i", os.path.join(tmp, "%03d.png"), "-vf",
                f"tile={cols}x{rows}:padding=3", "-frames:v", "1", out], check=True, stderr=subprocess.DEVNULL)
print(out, len(phrases), "phrases")
