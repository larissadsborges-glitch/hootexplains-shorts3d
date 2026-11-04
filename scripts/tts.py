"""Generate the voiceover and word timings for one video.

Usage: python3 scripts/tts.py videos/<id>/script.json

Writes public/videos/<id>/voice.wav and public/videos/<id>/timings.json.
Each beat is synthesised separately so we know exactly when it starts and
ends; word timings inside a beat are spread by word length (good enough for
word-by-word captions).
"""
import json
import os
import re
import sys

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 24000
LEAD_IN = 0.35      # silence before the first word (s)
GAP = 0.22          # pause between beats (s)
TAIL = 0.8          # silence after the last word (s)


def trim(audio, thresh=0.01):
    idx = np.where(np.abs(audio) > thresh)[0]
    if len(idx) == 0:
        return audio
    pad = int(0.03 * SR)
    return audio[max(0, idx[0] - pad): idx[-1] + pad]


def word_weights(words):
    # Longer words take longer; punctuation adds a small pause after the word.
    out = []
    for w in words:
        letters = len(re.sub(r"[^A-Za-z0-9']", "", w)) or 1
        pause = 2.5 if re.search(r"[.,!?;:…]$", w) else 0.0
        out.append((letters + 1.5, pause))
    return out


def main(script_path):
    script = json.load(open(script_path))
    vid = script["id"]
    out_dir = os.path.join(ROOT, "public", "videos", vid)
    os.makedirs(out_dir, exist_ok=True)

    k = Kokoro(os.path.join(ROOT, "models", "kokoro-v1.0.onnx"),
               os.path.join(ROOT, "models", "voices-v1.0.bin"))

    # "voice" is either a name or a blend like {"bm_george": 0.6, "bm_fable": 0.4}
    voice = script["voice"]
    if isinstance(voice, dict):
        voice = sum(k.get_voice_style(name) * w for name, w in voice.items())

    lead_in = script.get("leadIn", LEAD_IN)
    gap_s = script.get("gap", GAP)
    tail_s = script.get("tail", TAIL)

    chunks = [np.zeros(int(lead_in * SR), dtype=np.float32)]
    t = lead_in
    beats = []
    for i, beat in enumerate(script["beats"]):
        audio, sr = k.create(beat["text"], voice=voice,
                             speed=beat.get("speed", script.get("speed", 1.0)), lang=script["lang"])
        assert sr == SR
        audio = trim(audio.astype(np.float32))
        dur = len(audio) / SR

        words = beat["text"].split()
        weights = word_weights(words)
        total = sum(a + b for a, b in weights)
        wt, cursor = [], t
        for w, (a, b) in zip(words, weights):
            speak = dur * a / total
            wt.append({"word": w, "start": round(cursor, 3), "end": round(cursor + speak, 3)})
            cursor += speak + dur * b / total

        beats.append({**beat, "index": i, "start": round(t, 3),
                      "end": round(t + dur, 3), "words": wt})
        chunks.append(audio)
        t += dur
        gap = tail_s if i == len(script["beats"]) - 1 else gap_s + beat.get("hold", 0.0)
        chunks.append(np.zeros(int(gap * SR), dtype=np.float32))
        t += gap

    sf.write(os.path.join(out_dir, "voice.wav"), np.concatenate(chunks), SR)
    timings = {**{k_: v for k_, v in script.items() if k_ != "beats"},
               "duration": round(t, 3), "beats": beats}
    json.dump(timings, open(os.path.join(out_dir, "timings.json"), "w"), indent=2)
    print(f"{vid}: {t:.2f}s, {len(beats)} beats -> {out_dir}")


if __name__ == "__main__":
    main(sys.argv[1])
