"""Voice a Tavinho episode with ElevenLabs and write public/videos/<id>/voice.wav + timings.json (exact word times).

Usage:  python scripts/tav_voice_eleven.py <videoId> <voiceId> [--speed 1.05] [--dry]
Key:    read from C:\\Users\\borge\\hoot\\.elevenlabs_key (just the key on one line) or the ELEVENLABS_API_KEY env var.
        The key is never printed or saved anywhere else.
Model:  eleven_multilingual_v2 (pt-BR). One request per beat to the "with-timestamps" endpoint, so every caption and
        animation gets the real word times. Beats are joined with short pauses (a held beat before "card"/"twist" reveals).
--dry:  print the character count (credits) and exit without calling the API.
Cache:  every line is paid for once. Results are kept in public/videos/<id>/_eleven_cache/ (keyed by text, neighbours,
        voice and settings), so re-runs reuse them and only changed lines are voiced again.
"""
import base64
import hashlib
import json
import os
import re
import subprocess
import sys
import urllib.request

import numpy as np
import soundfile as sf

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FF = r"C:\Users\borge\.hoottools\ffmpeg\ffmpeg.exe"
args = [a for a in sys.argv[1:] if not a.startswith("--")]
vid, voice = args[0], (args[1] if len(args) > 1 else "")
speed = float(sys.argv[sys.argv.index("--speed") + 1]) if "--speed" in sys.argv else 1.05
script = json.load(open(os.path.join(root, "videos", vid, "script.json"), encoding="utf-8"))
chars = sum(len(b["text"]) for b in script["beats"])
print(f"{vid}: {len(script['beats'])} beats, {chars} characters (about {chars} credits)")
if "--dry" in sys.argv:
    sys.exit(0)

key_file = r"C:\Users\borge\hoot\.elevenlabs_key"
key = os.environ.get("ELEVENLABS_API_KEY") or (open(key_file, encoding="utf-8").read().strip() if os.path.exists(key_file) else "")
if not key or not voice:
    sys.exit("missing API key (file or env) or voice id")

SR = 24000
GAP, REVEAL = 0.24, 0.25


CACHE = os.path.join(root, "public", "videos", vid, "_eleven_cache")


def tts(text, prev, nxt):
    body = {
        "text": text, "model_id": "eleven_multilingual_v2",
        "voice_settings": {"stability": 0.4, "similarity_boost": 0.8, "style": 0.35, "use_speaker_boost": True, "speed": speed},
        # neighbouring lines keep the intonation continuous across beats
        "previous_text": prev or None, "next_text": nxt or None,
    }
    tag = hashlib.sha1(json.dumps([voice, body], sort_keys=True, ensure_ascii=False).encode("utf-8")).hexdigest()[:16]
    hit = os.path.join(CACHE, f"{tag}.json")
    if os.path.exists(hit):
        res = json.load(open(hit, encoding="utf-8"))
        print("  (cached, 0 credits)", flush=True)
    else:
        res = None
    if res is None:
        res = _call(body)
        os.makedirs(CACHE, exist_ok=True)
        json.dump(res, open(hit, "w", encoding="utf-8"))
    mp3 = base64.b64decode(res["audio_base64"])
    pcm = subprocess.run([FF, "-v", "error", "-i", "pipe:0", "-f", "f32le", "-ac", "1", "-ar", str(SR), "pipe:1"], input=mp3, capture_output=True, check=True).stdout
    al = res.get("normalized_alignment") or res["alignment"]
    return np.frombuffer(pcm, dtype=np.float32), al


def _call(body):
    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{voice}/with-timestamps?output_format=mp3_44100_128",
                                 data=json.dumps(body).encode("utf-8"), headers={"xi-api-key": key, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read().decode("utf-8"))


def words_from(al, text, offset):
    """Group the character timings into the script's words (punctuation stays on its word, like the captions)."""
    cs, st, en = al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]
    out, cur, s0, e0 = [], "", None, None
    for c, s, e in zip(cs, st, en):
        if c.isspace():
            if cur:
                out.append((cur, s0, e0)); cur = ""
            continue
        if not cur:
            s0 = s
        cur += c; e0 = e
    if cur:
        out.append((cur, s0, e0))
    want = text.split()
    if len(out) != len(want):  # fall back to the script's words spread over the found span
        a, b = out[0][1], out[-1][2]
        w = [len(re.sub(r"[^\w]", "", x)) + 1.5 for x in want]
        acc, res = 0.0, []
        for x, wi in zip(want, w):
            s = a + (b - a) * acc / sum(w); acc += wi
            res.append({"word": x, "start": round(offset + s, 3), "end": round(offset + a + (b - a) * acc / sum(w), 3)})
        return res
    return [{"word": x, "start": round(offset + s, 3), "end": round(offset + e, 3)} for x, (_, s, e) in zip(want, out)]


chunks, t, beats = [np.zeros(int(SR * script.get("leadIn", 0.05)), np.float32)], script.get("leadIn", 0.05), []
B = script["beats"]
for i, b in enumerate(B):
    if i > 0 and b["event"] in ("card", "twist"):
        chunks.append(np.zeros(int(SR * REVEAL), np.float32)); t += REVEAL
    audio, al = tts(b["text"], B[i - 1]["text"] if i else "", B[i + 1]["text"] if i + 1 < len(B) else "")
    # trim the silence ElevenLabs leaves around each line (keep 40 ms), so the pauses between lines are ours (GAP)
    loud = np.flatnonzero(np.abs(audio) > 10 ** (-40 / 20))
    if len(loud):
        a0 = max(0, loud[0] - int(0.04 * SR)); a1 = min(len(audio), loud[-1] + int(0.06 * SR))
        audio = audio[a0:a1]
    else:
        a0 = 0
    words = words_from(al, b["text"], t - a0 / SR)
    beats.append({**{k: v for k, v in b.items() if k != "speed"}, "index": i, "start": words[0]["start"], "end": words[-1]["end"], "words": words})
    chunks.append(audio); t += len(audio) / SR
    if i + 1 < len(B):
        chunks.append(np.zeros(int(SR * GAP), np.float32)); t += GAP
    print(f"beat {i + 1}/{len(B)} {b['event']}: {len(audio) / SR:.2f} s", flush=True)
tail = script.get("tail", 1.0)
chunks.append(np.zeros(int(SR * tail), np.float32)); t += tail

out = os.path.join(root, "public", "videos", vid)
os.makedirs(out, exist_ok=True)
raw = np.concatenate(chunks)
sf.write(os.path.join(out, "voice_raw.wav"), raw, SR)
subprocess.run([FF, "-v", "error", "-y", "-i", os.path.join(out, "voice_raw.wav"), "-af", "loudnorm=I=-16:TP=-1.5:LRA=7", "-ar", str(SR), "-ac", "1", os.path.join(out, "voice.wav")], check=True)
os.remove(os.path.join(out, "voice_raw.wav"))
meta = {k: v for k, v in script.items() if k != "beats"}
meta.update({"voice": f"elevenlabs:{voice}", "duration": round(t, 3), "beats": beats})
json.dump(meta, open(os.path.join(out, "timings.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
n = sum(len(b["words"]) for b in beats)
print(f"done: {t:.1f} s, {n} words, {n / t:.2f} words/s")
