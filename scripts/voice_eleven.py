"""Voice an English Hoot video with ElevenLabs (exact word times) instead of Kokoro.

Usage:  python scripts/voice_eleven.py <videoId> [--voice <voiceId>] [--speed 1.12] [--dry]
        then: python scripts/mouth.py <videoId>
Writes public/videos/<id>/voice.wav + timings.json in the same format as scripts/tts.py, honouring the script's
leadIn / gap / tail and each beat's "hold".
Voice:  Hoot = "Mark - Natural Conversations" from the ElevenLabs voice library (owner's pick, 5 Nov 2026).
Key:    ELEVENLABS_API_KEY from the env or .env.local (git-ignored), else C:\\Users\\borge\\hoot\\.elevenlabs_key.
        The key is never printed.
Cache:  each line is paid for once: public/videos/<id>/_eleven_cache/ (keyed by text, neighbours, voice, settings).
"""
import base64, hashlib, json, os, re, subprocess, sys, urllib.request

import numpy as np
import soundfile as sf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FF = r"C:\Users\borge\.hoottools\ffmpeg\ffmpeg.exe"
HOOT_VOICE = "UgBBYS2sOqTuMpoF3BR0"  # Mark - Natural Conversations
SR = 24000
FAST = 1.2  # the hook line runs at ElevenLabs' top speed so the bridge lands by ~5 s


def opt(name, default):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else default


vid = sys.argv[1]
voice = opt("--voice", HOOT_VOICE)
speed = float(opt("--speed", "1.12"))
script = json.load(open(os.path.join(ROOT, "videos", vid, "script.json"), encoding="utf-8"))
B = script["beats"]
print(f"{vid}: {len(B)} beats, {sum(len(b['text']) for b in B)} characters")
if "--dry" in sys.argv:
    sys.exit(0)


def load_key():
    if os.environ.get("ELEVENLABS_API_KEY"):
        return os.environ["ELEVENLABS_API_KEY"]
    env = os.path.join(ROOT, ".env.local")
    if os.path.exists(env):
        for line in open(env, encoding="utf-8"):
            if line.startswith("ELEVENLABS_API_KEY="):
                return line.split("=", 1)[1].strip().strip('"')
    f = r"C:\Users\borge\hoot\.elevenlabs_key"
    return open(f, encoding="utf-8").read().strip() if os.path.exists(f) else ""


KEY = load_key()
if not KEY:
    sys.exit("missing ELEVENLABS_API_KEY")
CACHE = os.path.join(ROOT, "public", "videos", vid, "_eleven_cache")


def tts(text, prev, nxt, b_event=""):
    body = {"text": text, "model_id": "eleven_multilingual_v2",
            "voice_settings": {"stability": 0.4, "similarity_boost": 0.75, "style": 0.3, "use_speaker_boost": True, "speed": FAST if b_event == "hook" else speed},
            "previous_text": prev or None, "next_text": nxt or None}
    tag = hashlib.sha1(json.dumps([voice, body], sort_keys=True).encode()).hexdigest()[:16]
    hit = os.path.join(CACHE, f"{tag}.json")
    if os.path.exists(hit):
        res = json.load(open(hit, encoding="utf-8"))
    else:
        req = urllib.request.Request(
            f"https://api.elevenlabs.io/v1/text-to-speech/{voice}/with-timestamps?output_format=mp3_44100_128",
            data=json.dumps(body).encode(), headers={"xi-api-key": KEY, "Content-Type": "application/json"})
        res = json.loads(urllib.request.urlopen(req, timeout=120).read().decode())
        os.makedirs(CACHE, exist_ok=True)
        json.dump(res, open(hit, "w", encoding="utf-8"))
    pcm = subprocess.run([FF, "-v", "error", "-i", "pipe:0", "-f", "f32le", "-ac", "1", "-ar", str(SR), "pipe:1"],
                         input=base64.b64decode(res["audio_base64"]), capture_output=True, check=True).stdout
    return np.frombuffer(pcm, dtype=np.float32), res.get("normalized_alignment") or res["alignment"]


def words_from(al, text):
    """Character times -> the script's words (split on spaces, like the captions). Times are relative to the clip."""
    out, cur, s0, e0 = [], "", None, None
    for c, s, e in zip(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]):
        if c.isspace():
            if cur:
                out.append((s0, e0)); cur = ""
            continue
        if not cur:
            s0 = s
        cur += c; e0 = e
    if cur:
        out.append((s0, e0))
    want = text.split()
    if len(out) != len(want):  # spread by length over the spoken span
        a, b = out[0][0], out[-1][1]
        w = [len(re.sub(r"[^\w]", "", x)) + 1.5 for x in want]
        acc, res = 0.0, []
        for wi in w:
            s = a + (b - a) * acc / sum(w); acc += wi
            res.append((s, a + (b - a) * acc / sum(w)))
        out = res
    return want, out


lead, gap0, tail = script.get("leadIn", 0.35), script.get("gap", 0.22), script.get("tail", 0.8)
chunks, t, beats = [np.zeros(int(SR * lead), np.float32)], lead, []
for i, b in enumerate(B):
    audio, al = tts(b["text"], B[i - 1]["text"] if i else "", B[i + 1]["text"] if i + 1 < len(B) else "", b.get("event", ""))
    want, times = words_from(al, b["text"])
    # trim the clip's own leading/trailing silence so the script's gaps set the pace
    head = max(0.0, times[0][0] - 0.03)
    end = min(len(audio) / SR, times[-1][1] + 0.12)
    audio = audio[int(head * SR):int(end * SR)]
    times = [(s - head, e - head) for s, e in times]
    # shorten long pauses inside a line (sentence breaks) to MAX_PAUSE, shifting the later words
    MAX_PAUSE = 0.32
    for k in range(len(times) - 1, 0, -1):
        gap = times[k][0] - times[k - 1][1]
        if gap > MAX_PAUSE + 0.02:
            cut0 = times[k - 1][1] + MAX_PAUSE / 2
            n = int((gap - MAX_PAUSE) * SR)
            a0 = int(cut0 * SR)
            audio = np.concatenate([audio[:a0], audio[a0 + n:]])
            sh = n / SR
            times = times[:k] + [(s - sh, e - sh) for s, e in times[k:]]
    words = [{"word": w, "start": round(t + s, 3), "end": round(t + e, 3)} for w, (s, e) in zip(want, times)]
    dur = len(audio) / SR
    beats.append({**{k: v for k, v in b.items() if k != "speed"}, "index": i, "start": round(t, 3), "end": round(t + dur, 3), "words": words})
    chunks.append(audio); t += dur
    g = tail if i == len(B) - 1 else gap0 + b.get("hold", 0.0)
    chunks.append(np.zeros(int(SR * g), np.float32)); t += g
    print(f"beat {i + 1}/{len(B)} {b.get('event')}: {dur:.2f} s", flush=True)

out = os.path.join(ROOT, "public", "videos", vid)
raw = os.path.join(out, "voice_raw.wav")
sf.write(raw, np.concatenate(chunks), SR)
subprocess.run([FF, "-v", "error", "-y", "-i", raw, "-af", "loudnorm=I=-16:TP=-1.5:LRA=7", "-ar", str(SR), "-ac", "1",
                os.path.join(out, "voice.wav")], check=True)
os.remove(raw)
meta = {k: v for k, v in script.items() if k != "beats"}
meta.update({"voice": f"elevenlabs:{voice}", "duration": round(t, 3), "beats": beats})
json.dump(meta, open(os.path.join(out, "timings.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
n = sum(len(b["words"]) for b in beats)
print(f"done: {t:.1f} s, {n} words, {n / t:.2f} words/s")
