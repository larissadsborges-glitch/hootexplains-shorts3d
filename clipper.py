"""
CLIPPER: a free live-stream clipping system (Twitch, Kick, YouTube). Owner's idea, 16 Nov 2026.

  multi <channels.txt> [--minutes 600]
      The launch-day mode: one recorder per line of channels.txt plus ONE editor (below-normal priority, so the PC stays
      quick). Line format:  url | lang (en / pt) | hook text (optional)
  watch <stream url> [--minutes 60] [--lang en] [--hook "..."]
      One recorder: yt-dlp (720p max) piped into ffmpeg's segment muxer (20 s pieces, no re-encode); only the last
      15 minutes are kept on disk (older pieces are deleted). Every 10 s it looks for a HIGHLIGHT: a burst of Twitch chat
      (anonymous read-only; reactions in EN/PT-BR/ES + the channel's 7TV/BTTV/FFZ emotes weigh more, each chatter counts
      once per 5 s, bots/!commands ignored, raids and gift bombs muted, see react.py), 3+ chatters asking for a clip, or a
      burst of loudness. Each moment gets a SCORE (chat + loudness (max 6) + clip requests, none required); the bar is 6, +3 per
      clip of the last 10 min. A winner is cut (25 s before .. 8 s after) to queue/ as a raw clip + a job file; every
      candidate and its score is logged in highlights.jsonl. It does not edit (the editor does, strongest first).
  worker
      The editor: takes the queue's jobs one by one: vertical 1080x1920 (the stream over a blurred copy of itself), big
      word-by-word captions (faster-whisper small, local), the hook at the top, the streamer's credit, -14 LUFS.
  edit <video> [--start s --end s] [--hook "TEXT"] [--credit @name] [--lang en]   (one file by hand)
  chat <twitch channel> [--seconds 60]                                              (check the chat reader)

Everything is local and free: yt-dlp, ffmpeg, faster-whisper (cached), Python stdlib. Posting is not done here.
Only clip creators who allow it; the credit stays on screen.

Run with the hoottools venv:  HF_HOME=C:/Users/borge/.hoottools/cache/hf  python -I clipper.py multi channels.txt
"""
import argparse, csv, glob, json, os, re, socket, statistics, subprocess, sys, threading, time, wave
from collections import Counter, deque
from datetime import datetime

FF = r"C:\Users\borge\.hoottools\ffmpeg\ffmpeg.exe"
FP = r"C:\Users\borge\.hoottools\ffmpeg\ffprobe.exe"
# (owner 16 Nov: "use the graphics card") FFmpeg 8.1, whose NVENC works with the GTX 1050 Ti's driver 582: the video
# encodes run on the GPU and leave the CPU to the recorders and whisper; libx264 is the fallback if NVENC fails
FFG = r"C:\Users\borge\.hoottools\ffmpeg_nvenc\ffmpeg.exe"
_nvenc = None
def venc(crf=20, threads=4, cpu=False):
    """video encoder args (owner 17 Nov: "ALWAYS the maximum quality possible"):
    - crf <= 18 = an in-between file (the raw cut, the story cut): near-lossless, so the 3 encodes of a clip do not stack losses
    - else = the final clip: NVENC's slowest/best preset p7, HQ tune, constant quality 17, up to 20 Mbit/s
    CPU (x264) only if the GPU encoder refuses, at a matching quality"""
    global _nvenc
    inter = crf <= 18
    if cpu: return FF, ["-c:v", "libx264", "-preset", "fast" if inter else "medium", "-crf", "12" if inter else "17",
                        "-maxrate", "40M" if inter else "20M", "-bufsize", "80M" if inter else "40M", "-threads", str(threads)]
    if _nvenc is None:
        _nvenc = os.path.exists(FFG) and subprocess.run([FFG, "-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", "color=black:s=256x256:d=0.2",
                                                         "-c:v", "h264_nvenc", "-f", "null", "-"], capture_output=True).returncode == 0
    if _nvenc and inter: return FFG, ["-c:v", "h264_nvenc", "-preset", "p5", "-tune", "hq", "-rc", "vbr", "-cq", "15",
                                      "-b:v", "14M", "-maxrate", "16M", "-bufsize", "32M", "-spatial-aq", "1", "-bf", "3"]  # ~2x a 1080p60 stream
    if _nvenc: return FFG, ["-c:v", "h264_nvenc", "-preset", "p7", "-tune", "hq", "-rc", "vbr", "-cq", "17", "-b:v", "12M",
                            "-maxrate", "20M", "-bufsize", "40M", "-spatial-aq", "1", "-aq-strength", "8", "-bf", "3", "-rc-lookahead", "32"]
    return venc(crf, threads, cpu=True)

def run_v(build, crf=20, threads=4):
    """(16 Nov night: one clip failed - the GTX 1050 Ti refused an NVENC session while recorders and editors all
    encoded at once) run build(ff, venc_args); if the GPU encoder fails, the SAME job is encoded on the CPU"""
    ff, v = venc(crf, threads)
    r = subprocess.run(build(ff, v), capture_output=True, text=True)
    if r.returncode != 0 and "h264_nvenc" in v:
        print(f"[enc] GPU encoder refused ({(r.stderr or '').strip()[-120:]}) -> CPU", flush=True)
        ff, v = venc(crf, threads, cpu=True)
        r = subprocess.run(build(ff, v), capture_output=True, text=True)
    if r.returncode != 0:
        raise subprocess.CalledProcessError(r.returncode, build(ff, v)[:3], r.stdout, r.stderr)
    return r

HERE = os.path.dirname(os.path.abspath(__file__))
# (owner 16 Nov) recordings and clips on the E: SSD (56 GB free, not the Windows disk), so C: stays free and quick;
# CLIPPER_OUT overrides it; falls back to tools/clipper/out if E: is missing
OUT = os.environ.get("CLIPPER_OUT") or (r"E:\clipper" if os.path.isdir("E:\\") else os.path.join(HERE, "out"))
QUEUE = os.path.join(OUT, "queue")
BELOW_NORMAL = 0x00004000  # Windows process priority class for the editor
sys.path.insert(0, HERE)
import ia, layout, react, cartao  # (owner 16 Nov: "more reaction messages") the reaction words/emotes, EN + PT-BR + ES, see react.py

# ---------------------------------------------------------------- chat (Twitch, anonymous read-only IRC)
class TwitchChat(threading.Thread):
    """events: (time, weight, category, chatter). Raids and gift-sub bombs flood chat without a moment: muted for a while."""
    def __init__(self, channel):
        super().__init__(daemon=True); self.channel = channel.lower().lstrip("#"); self.events = deque(maxlen=400000)
        self.ok = False; self.stop = False; self.emotes = frozenset(); self.room = None; self.mute_until = 0.0; self.notes = []
    def _load_emotes(self, room):
        self.emotes = frozenset(react.channel_emotes(room))
    def run(self):
        while not self.stop:
            try:
                s = socket.create_connection(("irc.chat.twitch.tv", 6667), timeout=30)
                s.sendall(b"CAP REQ :twitch.tv/tags twitch.tv/commands\r\nPASS SCHMOOPIIE\r\nNICK justinfan%d\r\nJOIN #%s\r\n"
                          % (int(time.time() * 1000) % 90000 + 1000, self.channel.encode()))
                buf = b""; self.ok = True
                while not self.stop:
                    try: data = s.recv(65536)
                    except socket.timeout: continue
                    if not data: break
                    buf += data
                    *lines, buf = buf.split(b"\r\n")
                    for ln in lines: self._line(s, ln.decode("utf-8", "replace"))
            except OSError:
                self.ok = False; time.sleep(5)
    def _line(self, s, ln):
        if ln.startswith("PING"): s.sendall(("PONG" + ln[4:] + "\r\n").encode()); return
        tags = {}
        if ln.startswith("@"):
            raw, _, ln = ln.partition(" "); tags = dict(kv.split("=", 1) for kv in raw[1:].split(";") if "=" in kv)
        m = re.match(r":(\w+)!\S+ PRIVMSG #\S+ :(.*)", ln) or re.match(r":\S+ (ROOMSTATE|USERNOTICE) #\S+ ?:?(.*)", ln)
        if not m: return
        now = time.time()
        if m.group(1) == "ROOMSTATE":
            if tags.get("room-id") and not self.room:
                self.room = tags["room-id"]; threading.Thread(target=self._load_emotes, args=(self.room,), daemon=True).start()
            return
        if m.group(1) == "USERNOTICE":
            kind = tags.get("msg-id", "")
            if kind == "raid": self.mute_until = max(self.mute_until, now + 90); self.notes.append((now, "raid"))
            elif kind == "submysterygift" and int(tags.get("msg-param-mass-gift-count", "1") or 1) >= 5:
                self.mute_until = max(self.mute_until, now + 30); self.notes.append((now, "giftbomb"))
            return
        user, txt = m.group(1).lower(), m.group(2)
        if user in react.BOTS or tags.get("bot") == "1": return
        cat, w = react.classify(txt, self.emotes)
        if now < self.mute_until: w *= 0.1
        if w > 0: self.events.append((now, w, cat, user, txt[:80]))

class YouTubeChat(threading.Thread):
    """(owner 16 Nov: "read the chat for all the big ones") YouTube live chat, read-only, through yt-dlp's own live_chat
    downloader (kept up to date, unlike the chat libraries): it appends chat lines to a .live_chat.json file as they come;
    we read the new lines. Same events as TwitchChat: (time, weight, category, chatter, text)."""
    def __init__(self, url, workdir):
        super().__init__(daemon=True); self.url = url; self.events = deque(maxlen=400000); self.ok = False; self.stop = False
        self.emotes = frozenset(); self.room = None; self.mute_until = 0.0; self.dir = workdir; self.proc = None; self.lag = 40.0
    def run(self):
        os.makedirs(self.dir, exist_ok=True)
        while not self.stop:
            base = os.path.join(self.dir, f"chat_{int(time.time())}")
            self.proc = subprocess.Popen([sys.executable, "-m", "yt_dlp", "-q", "--no-warnings", "--skip-download", "--write-subs",
                                          "--sub-langs", "live_chat", "-o", base, self.url],
                                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            path, pos = base + ".live_chat.json.part", 0
            while not self.stop and self.proc.poll() is None:
                time.sleep(2)
                if not os.path.exists(path): continue
                self.ok = True
                with open(path, encoding="utf-8", errors="replace") as f:
                    f.seek(pos); data = f.read(); pos = f.tell()
                for ln in data.splitlines():
                    try: self._line(json.loads(ln))
                    except (ValueError, KeyError, TypeError): pass
            if self.proc.poll() is None: self.proc.terminate()
            self.ok = False
            for p in glob.glob(base + "*"):
                try: os.remove(p)
                except OSError: pass
            if not self.stop: time.sleep(30)  # offline / ended: try again
    def _line(self, d):
        acts = (d.get("replayChatItemAction") or {}).get("actions") or d.get("actions") or []
        for a in acts:
            r = ((a.get("addChatItemAction") or {}).get("item") or {}).get("liveChatTextMessageRenderer")
            if not r: continue
            parts = []
            for run in (r.get("message") or {}).get("runs", []):
                if "text" in run: parts.append(run["text"])
                elif "emoji" in run:  # standard emoji = the character; channel emoji = its :name:
                    e = run["emoji"]; eid = e.get("emojiId", "")
                    parts.append(eid if len(eid) <= 4 else (e.get("shortcuts") or [""])[0].strip(":"))
            txt = " ".join(x.strip() for x in parts if x.strip())
            user = (r.get("authorName") or {}).get("simpleText", "?").lower()
            try: t = int(r.get("timestampUsec")) / 1e6
            except (TypeError, ValueError): t = time.time()
            t = min(t, time.time())
            if user.lstrip("@") in react.BOTS: continue
            cat, w = react.classify(txt, self.emotes)
            if w > 0: self.events.append((t, w, cat, user, txt[:80]))

def channel_of(url):
    m = re.search(r"(?:twitch\.tv|kick\.com)/([A-Za-z0-9_]+)", url) or re.search(r"youtube\.com/@([A-Za-z0-9_.-]+)", url)
    return m.group(1) if m else None

# ---------------------------------------------------------------- highlight finding
def chat_bins(events, t0, t1, w=5.0):
    """per 5 s bin: (weighted chat = each chatter once, at their strongest message; chatters asking for a clip)"""
    n = max(int((t1 - t0) // w), 0); per = [dict() for _ in range(n)]; clips = [0] * n
    for t, k, cat, user, *_ in events:
        i = int((t - t0) // w)
        if 0 <= i < n:
            if k > per[i].get(user, 0.0): per[i][user] = k
            if cat == "clip": clips[i] += 1  # (several "clip" lines from one chatter still count once below)
    clips = [min(c, len([1 for u, k in p.items() if k >= react.W["clip"]])) for c, p in zip(clips, per)]
    return [sum(p.values()) for p in per], clips

def score_at(at, ws, series, clips, loud):
    """how strong a moment at `at` s is (series starts at ws s). Every signal only ADDS points, none is required:
    chat (weighted burst vs the last 5 min) + loudness (LU over the last 2 min, minus 8) + 1.5 per chatter asking to clip."""
    i0 = int((at - ws) // 5); win = range(max(i0, 0), min(i0 + 5, len(series)))  # chat reacts in the 20 s after
    chat = 0.0
    if win:
        base = statistics.median(series[max(0, i0 - 60):max(i0, 1)] or [1.0]) or 1.0
        ratio = max(series[j] for j in win) / base
        chat = min(ratio, 12.0) if ratio >= 2.0 else 0.0
    s = int(at); seg = loud[max(0, s - 10):s + 6]; jump = 0.0
    if seg and s >= 90: jump = max(seg) - statistics.median([max(v, -45.0) for v in loud[max(0, s - 120):s]])
    clip = min(1.5 * sum(clips[j] for j in win), 6.0) if win else 0.0
    return round(chat + min(max(0.0, jump - 8.0), 6.0) + clip, 2), {"chat": round(chat, 1), "loud": round(jump, 1), "clip_asks": int(clip / 1.5)}

def chat_spikes(series, ratio=3.0, floor=8, history=60):
    """start bins of chat bursts: weighted count >= ratio x the median of the previous `history` bins and >= floor"""
    hits, last = [], -99
    for i in range(24, len(series)):  # (test 16 Nov: the first minute fired on nothing) 2 min of chat history first
        base = statistics.median(series[max(0, i - history):i]) or 1.0
        if series[i] >= floor and series[i] >= ratio * base:
            if i - last > 2: hits.append(i)
            last = i
    return hits

def loudness(path):
    """momentary loudness (LUFS) per second of a file, via ffmpeg ebur128"""
    r = subprocess.run([FF, "-hide_banner", "-nostats", "-i", path, "-vn", "-af", "ebur128=metadata=1,ametadata=print:key=lavfi.r128.M",
                        "-f", "null", "-"], capture_output=True, text=True)
    vals, cur = [], None
    for ln in r.stderr.splitlines():
        m = re.search(r"pts_time:([\d.]+)", ln)
        if m: cur = float(m.group(1))
        m = re.search(r"lavfi\.r128\.M=(-?[\d.]+|-?inf)", ln)
        if m and cur is not None:
            v = -70.0 if "inf" in m.group(1) else float(m.group(1)); sec = int(cur)
            if len(vals) <= sec: vals.extend([-70.0] * (sec + 1 - len(vals)))
            vals[sec] = max(vals[sec], v)
    return vals

def loud_spikes(vals, jump=11.0, floor=-18.0, history=120, start=0):
    """(rehearsal 16 Nov: 9 LU / 15 s gave a 'highlight' a minute, mostly nothing) 11 LU over the median, 45 s apart"""
    hits, last = [], -99
    for i in range(max(90, start), len(vals)):  # (test 16 Nov: 27 LU 'jumps' over the silent first seconds) 90 s warm-up
        base = statistics.median([max(v, -45.0) for v in vals[max(0, i - history):i]])
        if vals[i] >= floor and vals[i] - base >= jump:
            if i - last > 45: hits.append(i)
            last = i
    return hits

# ---------------------------------------------------------------- media helpers
def duration(path):
    r = subprocess.run([FP, "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path], capture_output=True, text=True)
    try: return float(r.stdout.strip())
    except ValueError: return 0.0

def cut(src, start, end, dst):
    subprocess.run([FF, "-y", "-loglevel", "error", "-ss", f"{max(0, start):.2f}", "-i", src, "-t", f"{end - max(0, start):.2f}",
                    "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-c:a", "aac", "-b:a", "192k", dst], check=True)

ORIG_PRE = 180.0  # (owner 17 Nov: "don't delete the recording, keep an unedited copy, I'm afraid we lose context")
ORIGINALS = os.path.join(OUT, "originais")  # every finished clip keeps its UNEDITED recording here: 3 min before -> 50 s after
ORIG_MIN_FREE_GB = 15  # only if the disk gets this full are the OLDEST originals removed (logged), so recording never stops

def copy_segments(segs, a, b, dst):
    """[a, b] out of the pieces WITHOUT re-encoding (the original quality; starts at the nearest keyframe)"""
    use = [s for s in segs if s[2] > a and s[1] < b and os.path.exists(s[0])]
    if not use: return False
    lst = dst + ".txt"
    with open(lst, "w", encoding="utf-8") as f:
        for p, _, _ in use: f.write("file '" + p.replace("\\", "/") + "'\n")
    off = max(0.0, a - use[0][1])
    r = subprocess.run([FF, "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst, "-ss", f"{off:.2f}",
                        "-t", f"{b - max(a, use[0][1]):.2f}", "-c", "copy", "-avoid_negative_ts", "make_zero", dst])
    os.remove(lst); return r.returncode == 0 and os.path.exists(dst)

def keep_original(orig, base_name):
    """move the unedited recording next to the owner's folders: originais/<same name as the clip>_original.mp4"""
    if not orig or not os.path.exists(orig): return ""
    import shutil
    os.makedirs(ORIGINALS, exist_ok=True)
    while shutil.disk_usage(OUT).free < ORIG_MIN_FREE_GB * 1e9:  # disk nearly full: the oldest original goes (logged)
        old = sorted((os.path.join(ORIGINALS, f) for f in os.listdir(ORIGINALS) if f.endswith(".mp4")), key=os.path.getmtime)
        if not old: break
        os.remove(old[0]); print(f"[editor] disk nearly full: removed the oldest original {os.path.basename(old[0])}", flush=True)
    dst = os.path.join(ORIGINALS, base_name + "_original.mp4")
    os.replace(orig, dst); return dst

def cut_segments(segs, a, b, dst):
    """cut [a, b] (recording seconds) out of the 20 s pieces: segs = [(path, t0, t1)] in order"""
    use = [s for s in segs if s[2] > a and s[1] < b and os.path.exists(s[0])]
    if not use: return False
    lst = dst + ".txt"
    with open(lst, "w", encoding="utf-8") as f:
        for p, _, _ in use: f.write("file '" + p.replace("\\", "/") + "'\n")
    off = max(0.0, a - use[0][1])
    run_v(lambda ff, v: [ff, "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst, "-ss", f"{off:.2f}",
                         "-t", f"{b - max(a, use[0][1]):.2f}", *v, "-c:a", "aac", "-b:a", "192k", dst], 18, 2)
    os.remove(lst); return True

_model = None
def MODEL_NAME():
    """large-v3-turbo (much better at fast, slangy streamer talk) if it is in the cache, else small"""
    hub = os.path.join(os.environ.get("HF_HOME", r"C:\Users\borge\.hoottools\cache\hf"), "hub")
    turbo = glob.glob(os.path.join(hub, "models--mobiuslabsgmbh--faster-whisper-large-v3-turbo", "snapshots", "*", "model.bin"))
    return "large-v3-turbo" if turbo else "small"

def words(path, lang=None):
    global _model
    from faster_whisper import WhisperModel
    import numpy as np
    tmp = path + ".16k.wav"
    subprocess.run([FF, "-y", "-loglevel", "error", "-i", path, "-ac", "1", "-ar", "16000", "-sample_fmt", "s16", tmp], check=True)
    w = wave.open(tmp); a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768; w.close(); os.remove(tmp)
    if _model is None:
        # (16 Nov) on the GPU first (NVIDIA's cuBLAS/cuDNN pip packages in the venv; Pascal cards: int8): 22 s of speech
        # in 2.5 s and the CPU stays free for the recorders; the CPU (4 of 8 threads) if the GPU fails
        try:
            import nvidia
            for d in glob.glob(os.path.join(nvidia.__path__[0], "*", "bin")): os.add_dll_directory(d); os.environ["PATH"] = d + os.pathsep + os.environ["PATH"]
            _model = WhisperModel(MODEL_NAME(), device="cuda", compute_type="int8")
        except Exception as e:
            print(f"[editor] whisper on the CPU ({type(e).__name__})", flush=True)
            _model = WhisperModel("small", device="cpu", compute_type="int8", cpu_threads=4)
    segs, info = _model.transcribe(a, language=lang, word_timestamps=True, vad_filter=True, beam_size=5,
                                   condition_on_previous_text=False, vad_parameters={"min_silence_duration_ms": 300})
    # (owner 16 Nov: captions must be right) drop what whisper makes up over silence/noise: a segment it thinks is not
    # speech and is unsure about, the classic "thanks for watching" lines, and single words it barely heard
    FAKE = re.compile(r"^(thanks? (you )?for watching|please subscribe|subtitles by|legendas pela|obrigad[oa] por assistir)", re.I)
    segs = [g for g in segs if not (g.no_speech_prob > 0.6 and g.avg_logprob < -0.8) and not FAKE.match(g.text.strip())]
    for g in segs:
        if g.words: g.words = [w for w in g.words if w.probability >= 0.2 or len(g.words) > 3]
    music = any(re.search(r"♪|♫|\[(music|música|musica)\]|\((music|música|musica)\)", s.text, re.I) for s in segs)
    return [(x.start, x.end, x.word.strip()) for s in segs for x in (s.words or []) if x.word.strip()], info.language, music

def ass_time(t):
    t = max(0.0, t); return f"{int(t // 3600)}:{int(t % 3600 // 60):02d}:{t % 60:05.2f}"

HOOK_H = 230  # the hook box, 2 lines of Arial Black 70 + padding

def hook_spot(mode, seam, head, game_top=None):
    """top y of the hook: the first place that does not touch the streamer's head (head = (top, bottom) or None)"""
    gt = game_top or 700  # split: over the webcam top, over the game band, or under the captions
    under = gt + 120 if seam <= gt + 10 else gt + 84  # (under the @streamer tag on top of the game) (captions on the seam: the hook goes a bit lower)
    # (17 Nov: in face mode the 2nd spot, 1150-1380, sat ON the captions (centred at 1300, ~1190-1410)) -> under them
    spots = {"split": [50, under, (game_top or 700) + 640], "face": [90, 1450, 1640]}.get(mode, [300])
    for y in spots:
        if not head or y + HOOK_H < head[0] or y > head[1]: return y
    return spots[-1]

BRAND_HEX = "0xFF2A8C"  # the logo's main colour (logo A pink); set when the final logo is chosen

def cut_windows(ws, loud, dur, face_ok):
    """(the example) where the picture cuts: the face FULL SCREEN for ~2 s on the 2-3 biggest reactions (loud 8+ LU
    over the median for 1+ s, after the first 3 s so the hook reads), the game FULL SCREEN in quiet stretches with no
    words for 3+ s. Cuts, never zooms (owner: no fast zooms)."""
    base = statistics.median(loud) if loud else -70.0
    face = []
    if face_ok:
        runs, t = [], 3
        while t < min(len(loud), int(dur) - 1):
            if loud[t] > base + 8 and (t + 1 < len(loud) and loud[t + 1] > base + 6):
                u = t
                while u + 1 < len(loud) and loud[u + 1] > base + 5: u += 1
                runs.append((max(loud[t:u + 1]), t, u)); t = u + 1
            else: t += 1
        for _, a, b in sorted(runs, reverse=True)[:3]:
            w = (float(a), min(float(a) + 2.2, float(b) + 0.8, dur - 0.5))
            if w[1] - w[0] >= 1.2 and all(w[0] > y + 4 or w[1] < x - 4 for x, y in face): face.append(w)
    game = []
    for k in range(1, len(ws)):
        a, b = ws[k - 1][1], ws[k][0]
        if b - a >= 5.0 and a > 4 and len(game) < 2:  # (17 Nov: it cut away from the face too often) 5 s+ silences, 2 at most
            w = (a + 0.4, min(b - 0.3, a + 3.5))
            if all(w[1] < x or w[0] > y for x, y in face): game.append(w)
    return sorted(face), game

def page_handle(lang):
    """(owner 17 Nov: "every clip must ALWAYS have a watermark or the page name - super important") marca/marca.json"""
    try: return json.load(open(os.path.join(HERE, "marca", "marca.json"), encoding="utf-8")).get((lang or "en")[:2], "")
    except (OSError, ValueError): return ""

FONTS_DIR = os.path.join(os.path.expanduser("~"), ".hoottools", "fonts")  # Poppins (OFL, Google Fonts): the font of the owner's example clip
FONTS_DIR_FF = FONTS_DIR.replace("\\", "/").replace(":", "\\:")
INSET_CARD = os.environ.get("CLIPPER_INSET", "0") == "1"  # (3rd example) the game clip inset on a white post page - owner picks
CARD_FOR_FACE = True  # (owner 17 Nov) chat / big-webcam clips use the post-card look (cartao.py)
KEYWORDS = set()  # the clip's key words (from the AI judge), shown in yellow
KEY_STOP = set("""the and you that this what with have just like your they them there here about was were are bro yeah okay chat
dude man guys gonna wanna got get its it's not but all one now yes nah
que não isso aí cara mano velho então tipo aqui ali pra para com uma um ele ela eles mas mais muito tá tô vai foi ser
qué eso esto pero con una uno muy está tío chaval vale bueno""".split())
ONE_WORD = True  # (owner 17 Nov, the LOUD Coringa example) one word on screen at a time, no chat lines, no stamp
CAP_STYLE = ("Style: Cap,Poppins ExtraBold,150,&H00FFFFFF,&H00FFFFFF,&H00000000,&H90000000,0,0,0,0,100,100,0,0,1,1.5,5,5,60,60,0,1\n"
             if ONE_WORD else
             "Style: Cap,Arial Black,84,&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,1,0,0,0,100,100,0,0,1,7,3,5,60,60,0,1\n")

def card_text(hook, channel):
    """the post card's line: normal case, the streamer as people know him (KAICENAT MISSES -> Kai Cenat misses)"""
    t = cartao.sentence((hook or "").strip("“”"))
    if channel: t = re.sub(re.escape(channel.rstrip("_")) + "_?", display(channel).title().replace("Ishowspeed", "IShowSpeed"), t, flags=re.I)
    return t

def hook_words(hook):
    """the title in caps, its key words (the AI's keywords) in the brand yellow, like the captions"""
    out = []
    for w in hook.upper().split():
        k = re.sub(r"[^\w']", "", w.lower())
        out.append("{\\c&H00D4FF&}" + w + "{\\c&HFFFFFF&}" if k and k in KEYWORDS else w)
    return " ".join(out)

def _outside(dur, wins):
    """the stretches of [0, dur] outside the full-screen cuts (names are hidden while the face/game fills the screen)"""
    out, t = [], 0.0
    for a, b in sorted(wins or []):
        if a > t: out.append((t, a))
        t = max(t, b)
    if t < dur: out.append((t, dur))
    return out

def make_ass(ws, hook, credit, dur, path, mode="game", seam=1265, chat=(), label="", head_box=None, game_top=None, lang="en", game_bottom=None, full_wins=()):
    """captions: 3 words a chunk, the word being said in yellow, reaction words (NO WAY, WHAT, LET'S GO...) in red; big bold
    white with a black outline at `seam` (between webcam and game in the split layout); the hook at the top for the first
    3.5 s; the credit; real chat messages popping in at the moment (no usernames), like watching it live"""
    hook_v = {"split": 70, "face": 220}.get(mode, 300)
    head = ("[Script Info]\nScriptType: v4.00+\nPlayResX: 1080\nPlayResY: 1920\n\n[V4+ Styles]\n"
            "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n"
            + CAP_STYLE +  # (the example: Poppins, soft shadow)
            # (owner 17 Nov: "I don't like the title - the black box looks bad") no box: Poppins with outline + shadow
            f"Style: Hook,Poppins ExtraBold,68,&H00FFFFFF,&H00FFFFFF,&H00000000,&H96000000,0,0,0,0,100,100,0,0,1,6,4,8,70,70,{hook_v},1\n"
            "Style: Credit,Arial,40,&H00FFFFFF,&H00FFFFFF,&H00000000,&H78000000,1,0,0,0,100,100,0,0,1,3,1,8,60,60,1370,1\n"
            "Style: Chat,Arial,40,&H00FFFFFF,&H00FFFFFF,&H50000000,&H50000000,1,0,0,0,100,100,0,0,3,10,0,7,40,40,0,1\n"
            "Style: Wm,Arial Black,40,&H40FFFFFF,&H40FFFFFF,&H60000000,&H80000000,1,0,0,0,100,100,0,0,1,3,0,9,30,30,30,1\n"
            "Style: Label,Arial Black,38,&H00101010,&H00101010,&H0000D7FF,&H0000D7FF,1,0,0,0,100,100,1,0,3,12,0,7,28,28,28,1\n\n"
            "[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n")
    ev = []
    wm = page_handle(lang)
    if wm:  # the page's @ the whole clip: bottom-right of the webcam (split), top-right (face), bottom (game)
        pos = {"split": f"{{\\an3\\pos(1052,{(game_top or 700) - 22})}}", "face": "{\\an9\\pos(1052,40)}"}.get(mode, "{\\an2\\pos(540,1700)}")
        for a, b in _outside(dur, full_wins): ev.append(f"Dialogue: 4,{ass_time(a)},{ass_time(b)},Wm,,0,0,0,,{pos}{wm}")
    if hook:  # never over the face: the hook goes where the head is not (see hook_spot)
        ev.append(f"Dialogue: 1,{ass_time(0)},{ass_time(min(3.5, dur))},Hook,,0,0,0,,{{\\an8\\pos(540,{hook_spot(mode, seam, head_box, game_top)})}}{hook_words(hook)}")
    if label:  # (owner 16 Nov: context, like The Till stamps) a small yellow stamp top-left: GTA 6 · LAUNCH DAY
        y = {"split": (game_top or 700) + (70 if seam <= (game_top or 700) + 10 else 16)}.get(mode, 28)  # (top-left of the game)
        ev.append(f"Dialogue: 3,{ass_time(0)},{ass_time(dur)},Label,,0,0,0,,{{\\an7\\pos(28,{y})}}{label.upper()}")
    if credit:
        pos = {"split": f"{{\\an1\\pos(28,{(game_top or 700) - 22})}}", "face": "{\\an8\\pos(540,1440)}"}.get(mode, "")
        if ONE_WORD and mode == "split": pos = f"{{\\an8\\pos(540,{(game_top or 600) + 14})}}"  # (the example: the name on top of the game)
        for a, b in _outside(dur, full_wins): ev.append(f"Dialogue: 0,{ass_time(a)},{ass_time(b)},Credit,,0,0,0,,{pos}{credit}")
    hot = re.compile(r"^(" + "|".join(react.WORDS[c] for c in ("shock", "hype")) + r")[.,!?]*$", re.I)
    # (owner 16 Nov: "captions well made, and in silences they must not stay on screen") chunks of up to 3 words /
    # 20 letters that never run over a pause (>= 0.45 s) or a sentence end; a chunk leaves 0.35 s after its last word
    chunks, cur = [], []
    for k, wd in enumerate(ws):
        cur.append(wd)
        nxt = ws[k + 1] if k + 1 < len(ws) else None
        if (len(cur) == (1 if ONE_WORD else 3) or sum(len(x[2]) for x in cur) >= 20 or wd[2][-1:] in ".?!" or not nxt
                or nxt[0] - wd[1] >= 0.45): chunks.append(cur); cur = []
    for ci, chunk in enumerate(chunks):
        nxt0 = chunks[ci + 1][0][0] if ci + 1 < len(chunks) else None
        end_chunk = min(chunk[-1][1] + 0.35, nxt0) if nxt0 is not None else chunk[-1][1] + 0.35
        for j, (s, e, _) in enumerate(chunk):
            e2 = chunk[j + 1][0] if j + 1 < len(chunk) else end_chunk
            def look(k, w):
                if ONE_WORD:  # (owner 17 Nov: "the important words in another colour - yellow or orange")
                    key = re.sub(r"[^\w']", "", w.lower())
                    if key and (key in KEYWORDS or hot.match(w) or re.search(r"\d", w)): return "{\\c&H00D4FF&}" + w.upper() + "{\\c&HFFFFFF&}"
                    return w.upper()
                if k == j: return "{\\c&H00F2FF&\\fscx112\\fscy112}" + w.upper() + "{\\c&HFFFFFF&\\fscx100\\fscy100}"
                if hot.match(w): return "{\\c&H3C3CFF&}" + w.upper() + "{\\c&HFFFFFF&}"
                return w.upper()
            txt = " ".join(look(k, w) for k, (_, _, w) in enumerate(chunk))
            ev.append(f"Dialogue: 0,{ass_time(s)},{ass_time(max(e2, s + 0.05))},Cap,,0,0,0,,{{\\pos(540,{seam})}}{txt}")
    # chat: up to 4 lines stacked; each stays 3.2 s or until a 5th arrives
    at_seam = mode == "split" and game_top and seam <= game_top + 10
    y0 = {"split": seam + (150 if at_seam else 70), "face": 980}.get(mode, 330)
    if mode == "split" and game_bottom and game_bottom < 1700:  # (owner 17 Nov: "use the empty space at the bottom")
        y0 = game_bottom + 24  # the chat moves under the game: the game is not covered and the space is used
    chat = list(chat)
    for k, (t, msg) in enumerate(chat):
        end = min(t + 3.2, chat[k + 4][0]) if k + 4 < len(chat) else t + 3.2
        if end <= t or t >= dur: continue
        slots = (3 if at_seam else 2) if mode == "split" else 4
        ev.append(f"Dialogue: 2,{ass_time(t)},{ass_time(min(end, dur))},Chat,,0,0,0,,{{\\pos(40,{y0 + (k % slots) * 66})\\fad(120,150)}}{msg}")
    with open(path, "w", encoding="utf-8") as f: f.write(head + "\n".join(ev) + "\n")

# (owner 16 Nov: "rules") slurs never shown in captions/hooks, and the clip goes to review; mild swearing stays
SLURS = re.compile(r"\b(n[i1]gg\w*|n[i1]gl\w*|fag+(ot|it)?s?|f[a@]gg\w*|retard(ed|s)?|tr[a@]nn(y|ies)|chinks?|spics?|kikes?|"
                   r"retardad[oa]s?|travec[oa]s?|viad[oa]s?|bichas?|retrasad[oa]s?|maric[oó]n(es)?|sudacas?|subnormal(es)?)\b", re.I)
# (rehearsal 16 Nov: "THIS F***ING B***H?", "ASSHOLE" in big captions) strong swearing is starred in the TEXT only (the
# audio stays): shown words get less reach and some viewers report them
SWEAR = re.compile(r"\b(fuck\w*|motherfuck\w*|shit\w*|bitch\w*|asshole\w*|cunt\w*|dick(head)?s?|put[ao]\w*|mierda|"
                   r"cabr[oó]n\w*|pendej\w*|caralho|porra|merda|fdp|pqp)\b", re.I)
TAGS = {"en": "#gta6 #gtavi #twitchclips #gaming", "pt": "#gta6 #gtavi #clipes #twitchbrasil", "es": "#gta6 #gtavi #clips #twitch"}

def mask(w):
    star = lambda m: m.group(0)[0] + "*" * (len(m.group(0)) - 1)
    return SWEAR.sub(star, SLURS.sub(star, w))

SHORT_OK = {"lol", "lmao", "lmfao", "omg", "what", "wtf", "bro", "nah", "no", "yes", "w", "l", "huh", "why", "how", "wow",
            "insane", "clean", "nice", "rip", "goat", "jajaja", "kkkk", "noooo", "lets", "go", "way", "dude", "damn", "holy"}

def readable(msg):
    """a chat line someone off Twitch understands: 2+ normal words (not CamelCase / ALLCAPS emote codes), or a known short reaction"""
    toks = re.findall(r"[^\s]+", msg)
    def word(t):
        t = t.strip(".,!?'\"")
        return bool(re.fullmatch(r"[a-zà-ÿ']{2,}|[A-ZÀ-Ý][a-zà-ÿ']+|[A-ZÀ-Ý]{1,3}|I", t)) and not re.search(r"[a-z][A-Z]", t)
    words = [t for t in toks if word(t)]
    if len(toks) == 1: return toks[0].lower().strip(".,!?") in SHORT_OK or bool(re.fullmatch(r"(ha){2,}h?|k{4,}|(ja){2,}", toks[0].lower()))
    return len(words) >= 2 and len(words) >= len(toks) / 2

def quote_at(ws, t, max_words=8):
    """the sentence said around second t (pauses of 0.5 s split sentences), for an automatic hook"""
    if not ws: return ""
    # sentences: a word ending in . ? ! or a pause of 0.7 s closes one
    sents, cur = [], []
    for k, (s, e, w) in enumerate(ws):
        cur.append((s, e, w))
        if w[-1:] in ".?!" or (k + 1 < len(ws) and ws[k + 1][0] - e >= 0.7) or k + 1 == len(ws): sents.append(cur); cur = []
    def dist(sn): return 0.0 if sn[0][0] <= t <= sn[-1][1] else min(abs(sn[0][0] - t), abs(sn[-1][1] - t))
    ok = [sn for sn in sents if 2 <= len(sn) and dist(sn) < 8]
    if not ok: return ""
    # the sentence at the moment; a short one just before/after wins over a long rambling one
    sn = min(ok, key=lambda sn: dist(sn) + (3.0 if len(sn) > max_words else 0.0))
    q = " ".join(w for _, _, w in sn[:max_words]).strip(" ,")
    return q + ("…" if len(sn) > max_words else "")

def add_replay(dst, peak, before=2.2, after=0.8, speed=0.6):
    """(16 Nov) the key moment again at 60 % speed with a REPLAY stamp, after the clip: the action people want to see twice;
    ~5 s more. Built from the finished short, so captions/chat/webcam are the same."""
    a = max(0.0, peak - before); d = before + after; tmp = dst + ".rp.mp4"
    font = "C\\:/Windows/Fonts/ariblk.ttf"
    ff, v = venc(20, 4)
    fc = (f"[0:v]trim={a:.2f}:{a + d:.2f},setpts=(PTS-STARTPTS)/{speed},"
          f"drawbox=x=(iw-360)/2:y=150:w=360:h=96:color=0xFFD700@1:t=fill,"
          f"drawtext=fontfile='{font}':text='REPLAY':fontsize=64:fontcolor=0x101010:x=(w-tw)/2:y=168[rv];"
          f"[0:a]atrim={a:.2f}:{a + d:.2f},asetpts=PTS-STARTPTS,atempo={speed}[ra];"
          f"[0:v][0:a][rv][ra]concat=n=2:v=1:a=1[v][a]")
    r = subprocess.run([ff, "-y", "-loglevel", "error", "-i", dst, "-filter_complex", fc, "-map", "[v]", "-map", "[a]", *v,
                        "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", tmp],
                       capture_output=True, text=True)
    if r.returncode == 0 and os.path.getsize(tmp) > 0: os.replace(tmp, dst)
    else:
        print(f"[editor] replay skipped: {r.stderr[-200:]}", flush=True)
        try: os.remove(tmp)
        except OSError: pass

GAMES = [(r"gta ?(6|vi)\b|grand theft auto (6|vi)\b", "GTA 6"), (r"\bgta ?(5|v)\b|gta ?rp\b|nopixel", "GTA RP")]

def context_label(title, when=None):
    """GTA 6 · LAUNCH DAY / GTA 6 / GTA RP (+ FIRST TIME) from the stream title; empty when the title says nothing"""
    t = (title or "").lower(); when = when or datetime.now()
    game = next((g for rx, g in GAMES if re.search(rx, t)), "")
    if not game: return ""
    if game == "GTA 6" and (when.month, when.day) == (11, 19): return "GTA 6 · LAUNCH DAY"
    if re.search(r"first time|1st time|primeira vez", t): return f"{game} · FIRST TIME"
    return game

CONNECT = re.compile(r"^(and|but|so|because|cause|cuz|like|yeah|yes|no|nah|that|that's|it|it's|he|he's|she|she's|they|they're|"
                     r"this|these|those|which|then|also|or|well|anyway|okay|ok|right|e|mas|então|porque|que|isso|ele|ela|y|pero|"
                     r"entonces|porque|eso|él|ella)\b", re.I)

def sentences(ws):
    """[(first word index, last word index)]: a sentence ends at . ? ! or a pause of 0.7 s"""
    out, st = [], 0
    for k in range(len(ws)):
        last = k + 1 == len(ws)
        n = k - st + 1; gap = 0 if last else ws[k + 1][0] - ws[k][1]
        # (test 16 Nov: streamers who talk without pauses/punctuation gave 15 s 'sentences') a long run also splits
        # at a small pause, and never runs past 22 words
        if last or ws[k][2][-1:] in ".?!" or gap >= 0.7 or (n >= 12 and gap >= 0.3) or n >= 22:
            out.append((st, k)); st = k + 1
    return out

FRAME_WORDS = set("""a an the his her their him he she they it its to of in on at for with from by and or but is was are were
be been has have had just now this that what who why how when gets got finds found out learns asks wants tries says tells
reacts reaction cant can't can t believe shocked surprised chat stream live stream's viewers fans friend friends gets
o a os as um uma do da dos das no na em com para por e que é foi seu sua ele ela chat live el la los las un una de del en
con por y que es fue su
discovers discover shows show reveals reveal prepares prepare explains explain admits admit realizes realize notices notice
checks check tests test tries try starts start plans plan decides decide responds respond calls call answers answer laughs
laugh freaks freak goes go takes take gives give makes make plays play watches watch sees see hears hear learns learn
finds find shares share talks talk opens open shows off up about over off after before new first again finally almost
nearly really totally still gets get wants want needs need meets meet invites invite every all whole
descobre mostra reage tenta explica fala faz joga encontra vê pede chama recebe leva dá fica quer vai começa decide planeja
testa conta revela finalmente quase de novo todo toda todos tudo seu sua dele dela durante depois antes primeira vez
descubre muestra reacciona intenta explica habla hace juega encuentra ve pide llama recibe lleva da queda quiere va
empieza decide planea prueba cuenta revela finalmente casi otra vez todo toda todos durante después antes""".split())

NUM_W = {"zero": 0, "one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9,
         "ten": 10, "eleven": 11, "twelve": 12, "fifteen": 15, "twenty": 20, "thirty": 30, "forty": 40, "fifty": 50,
         "sixty": 60, "seventy": 70, "eighty": 80, "ninety": 90}

def spoken_numbers(text):
    """numbers said in words or digits: 'five hundred' -> 500, 'two k' -> 2000, '120 000' -> 120000, '10k' -> 10000"""
    toks = re.findall(r"[a-z]+|\d[\d,.]*", text.lower()); out = set(); cur = None
    for t in toks + ["end"]:
        if t in NUM_W: cur = (cur or 0) + NUM_W[t]; continue
        if re.fullmatch(r"\d[\d,.]*", t):
            v = int(re.sub(r"[^0-9]", "", t) or 0)
            cur = cur * 1000 + v if cur is not None and v == 0 else (cur or 0) + v if cur is not None and v < 1000 and cur >= 1000 else v
            continue
        if cur is not None and t in ("hundred",): cur *= 100; continue
        if cur is not None and t in ("thousand", "k", "grand"): cur *= 1000; out.add(cur); continue
        if cur is not None and t in ("million", "mil"): cur *= 1000000; out.add(cur); continue
        if cur is not None: out.add(cur); cur = None
    return out

def grounded(hook, said, channel=""):
    """(owner rule: "titles never say something that did not happen") every real word of the AI's hook (4+ letters or a
    number) must have been SAID, or be the streamer's name or a plain framing word (finds, asks, reacts, chat...)"""
    said_w = set(re.findall(r"[a-zà-ÿ0-9$']+", said.lower().replace(",", "")))
    spoken = spoken_numbers(said)
    name = (channel or "").lower(); unsaid = ""
    for w in re.findall(r"[a-zà-ÿ0-9$']+", hook.lower().replace(",", "")):
        if w in said_w or w in FRAME_WORDS or (name and (w == name or w in name or name in w)): continue
        if re.search(r"\d", w):
            v = int(re.sub(r"[^0-9]", "", w) or 0) * (1000 if w.endswith("k") else 1000000 if w.endswith("m") else 1)
            if v in spoken or any(str(v).rstrip("0") == str(x).rstrip("0") for x in spoken if x): continue  # $500 ~ five hundred
            return False
        if len(w) < 4: continue
        stem = lambda x: re.sub(r"e$", "", re.sub(r"(ing|ied|ies|ed|(?<=ss|sh|ch)es|(?<=x)es|(?<!s)s)$", "", x))  # misses/miss
        if any(stem(x) == stem(w) or x.startswith(w[:5]) for x in said_w if len(x) >= 3): continue  # pays/paying, cars/car
        if w in {"came", "went", "said", "told", "paid", "got", "gave", "made", "saw"}: continue  # past forms
        # (17 Nov test: almost every AI title was refused for one plain describing word - "enemies", "every", "heist
        # van" - and the clip lost its context line) ONE unsaid describing word may stay; claims never do
        if w in CLAIMS or unsaid: return False
        unsaid = w
    return True

# words that state something happened: they must be SAID, never guessed
CLAIMS = set("""dies died dead death kills killed murder murdered banned ban arrested jail prison quits quit quitting fired
breaks broke broken crashes crashed wins won winning loses lost losing cheats cheated cheating steals stole stolen robbed
scammed scam pregnant divorce breakup proposes proposed engaged married sues sued hacked leaked leak million billion
record first last never ever
morre morreu mata matou banido preso perde perdeu ganha ganhou quebra quebrou rouba roubou bateu recorde primeiro último
nunca milhão milhões
muere murió mata mató baneado arrestado pierde perdió gana ganó rompe rompió roba robó chocó récord primero último nunca
millón millones
gta gta6 gtavi rockstar""".split()) | set("""""".split())

def reactions(loud, chat, base):
    """(research 17 Nov) what the AI should SEE besides the words: loud runs in the room (2+ s at 8+ LU over the
    median) and chat bursts (3+ reaction lines in 5 s) -> [(t, "text")]"""
    ev, t = [], 0
    while t < len(loud):
        if loud[t] > base + 8:
            u = t
            while u + 1 < len(loud) and loud[u + 1] > base + 5: u += 1
            if u - t + 1 >= 2: ev.append((float(t), f"LOUD in the room for {u - t + 1} s (shouting/laughing)"))
            t = u + 1
        else: t += 1
    bins = {}
    for tm, msg in chat: bins.setdefault(int(tm // 5), []).append(msg)
    for b, msgs in sorted(bins.items()):
        if len(msgs) >= 3:
            top = [m for m, _ in Counter(m.strip()[:20] for m in msgs).most_common(3)]
            ev.append((b * 5.0, f"chat burst: {len(msgs)} reactions ({', '.join(top)})"))
    return ev

DEPENDENT = re.compile(r"^(and|but|so|because|cause|cuz|yeah|yes|no|nah|exactly|which|then|also|or|too|again|e|mas|então|"
                       r"porque|y|pero|entonces)\b|^(like i said|he said|she said|they said|that's what)", re.I)

def find_event(loud, trigger, back=60.0):
    """(owner 17 Nov: "when the chat goes crazy, the thing may have happened 20, 30, 40, 50 s before - always search
    for the context first") the moment is marked when CHAT reacted; the real event is the loudest second in the
    `back` s before it (+3 s), if it clearly stands out (6+ LU over the clip's median and 2+ over the trigger itself)"""
    if trigger is None or not loud: return trigger
    a, b = max(0, int(trigger - back)), min(len(loud), int(trigger) + 4)
    if b <= a: return trigger
    base = statistics.median(loud); i = max(range(a, b), key=lambda k: loud[k])
    here = max(loud[max(0, int(trigger) - 2):int(trigger) + 3] or [-70.0])
    return float(i) if loud[i] >= base + 6 and loud[i] >= here + 2 else trigger

def guard_cut(ws, loud, base, s0, e0, dur, peak):
    """(research 17 Nov: the code, not the AI, makes the final cut) -> (s0, e0)
    START: a first sentence that leans on the one before (and/but/so/yeah/exactly...) brings that one in (up to 2, 25 s).
    END: never inside a sentence that is still being said; the loud reaction runs out (back within 3 LU of normal,
    up to +6 s); the last word gets 0.5 s to breathe."""
    if not ws: return s0, e0
    sn = sentences(ws)
    st_t = lambda i: ws[sn[i][0]][0]; en_t = lambda i: ws[sn[i][1]][1]
    si = min(range(len(sn)), key=lambda i: abs(st_t(i) - s0 - 0.25))
    steps = 0
    while si > 0 and steps < 2 and DEPENDENT.match(ws[sn[si][0]][2].strip(".,!?\"'“”")) and peak - st_t(si - 1) <= 45:
        si -= 1; steps += 1
    s0 = min(s0, max(0.0, st_t(si) - 0.25))
    ei = min(range(len(sn)), key=lambda i: abs(en_t(i) - e0))
    # a word starting right at the cut = the speaker is still going: finish that sentence (max +8 s)
    for i in range(len(sn)):
        if st_t(i) <= e0 + 0.3 < en_t(i) + 0.01 and en_t(i) - e0 <= 8: ei = max(ei, i)
    e0 = max(e0, en_t(ei) + 0.5)
    t = int(e0); lim = min(len(loud), int(e0) + 6)
    while t < lim and loud[t] > base + 3: t += 1  # the laugh/shout runs out
    e0 = min(dur, max(e0, float(t)))
    return s0, e0

def smart_cut(src, ws, peak, dur, force=None):
    """(owner 16 Nov: "it must always make sense where it starts and where it ends, never cut with no context")
    -> (pieces to keep, mapper old time -> new time). RULES:
    1. START on the first word of a whole sentence, 6-30 s before the moment, where the story begins: after a long pause
       is better; a sentence that leans on something said before ("and", "but", "so", "that", "he", "it"...) is not a
       start, so the cut moves back one sentence (up to 30 s) to bring that context in.
    2. END on the last word of a whole sentence (never mid-sentence), after the moment AND after the reaction to it
       (the words in the 1.5-10 s after it, and laughing/shouting); if the next sentence carries on the same thought
       ("and", "because"...), it is kept too. +0.6 s so the last word breathes.
    3. Length 12-45 s. 4. Inside: pauses of 1.2 s+ with nobody talking AND a quiet room are cut (never at the moment)."""
    loud = loudness(src) or [0.0]
    base = statistics.median(loud)
    if peak is None: peak = dur * 0.6
    if not ws: return [(max(0.0, peak - 15), min(dur, peak + 6))], None
    sn = sentences(ws)
    st_t = lambda i: ws[sn[i][0]][0]; en_t = lambda i: ws[sn[i][1]][1]
    if force:  # the AI judge chose the sentences: keep its story, the guards fix the edges, only dead air comes out
        s0, e0 = guard_cut(ws, loud, base, max(0.0, force[0]), min(dur, force[1]), dur, peak)
        return _dead_air(ws, loud, base, peak, s0, e0)
    first_w = lambda i: ws[sn[i][0]][2].strip(".,!?\"'“”")
    # 1. start
    cands = [i for i in range(len(sn)) if 6 <= peak - st_t(i) <= 30]
    def start_score(i):
        gap = st_t(i) - (en_t(i - 1) if i > 0 else 0.0)
        return min(gap, 3.0) - (2.0 if CONNECT.match(first_w(i)) else 0.0) - 0.04 * abs(peak - st_t(i) - 14)
    si = max(cands, key=start_score) if cands else max([i for i in range(len(sn)) if st_t(i) <= peak] or [0])
    while si > 0 and CONNECT.match(first_w(si)) and peak - st_t(si - 1) <= 30: si -= 1  # bring the context in
    s0 = max(0.0, st_t(si) - 0.25)
    # 2. end: the sentence holding the reaction (words 1.5-10 s after the moment) ends; laughing/shouting runs on
    react_end = max([e for s, e, w in ws if peak + 1.5 <= s <= peak + 20] or [peak + 2.5])  # (owner: let the scene roll)
    ei = next((i for i in range(len(sn)) if en_t(i) >= react_end), len(sn) - 1)
    SETUP = re.compile(r"\b(ready|watch this|watch|let'?s do (this|it)|here we go|let'?s go|look at this|wait for it|okay so)\W*$", re.I)
    while ei + 1 < len(sn) and en_t(ei + 1) - s0 <= 120 and (CONNECT.match(first_w(ei + 1)) or
            SETUP.search(" ".join(w for _, _, w in ws[sn[ei][0]:sn[ei][1] + 1]))): ei += 1  # same thought / the payoff comes next
    e0 = en_t(ei) + 0.6
    t = int(e0)
    while t < min(len(loud), e0 + 4) and loud[t] > base + 4: t += 1  # the laugh after the last word
    e0 = min(dur, max(e0, t))
    if e0 - s0 < 15:  # too short: one more sentence before
        while si > 0 and e0 - s0 < 15: si -= 1; s0 = max(0.0, st_t(si) - 0.25)
    if e0 - s0 > 120:  # too long (over 2 min): start later, on a sentence start
        later = [i for i in range(si, len(sn)) if e0 - st_t(i) <= 120 and st_t(i) <= peak - 4]
        if later: s0 = max(0.0, st_t(later[0]) - 0.25)
    s0, e0 = guard_cut(ws, loud, base, s0, e0, dur, peak)
    return _dead_air(ws, loud, base, peak, s0, e0)

def _dead_air(ws, loud, base, peak, s0, e0):
    """pauses of 1.2 s+ with nobody talking AND a quiet room are cut out (never at the moment) -> (keep, mapper)"""
    cuts = []
    for k in range(1, len(ws)):
        a, b = ws[k - 1][1], ws[k][0]
        if a < s0 or b > e0 or b - a < 1.2 or a - 0.5 < peak < b + 0.5: continue
        sec = loud[int(a):int(b) + 1]
        if sec and max(sec) < base: cuts.append((a + 0.3, b - 0.3))
    keep, cur = [], s0
    for a, b in cuts: keep.append((cur, a)); cur = b
    keep.append((cur, e0)); keep = [(a, b) for a, b in keep if b - a > 0.2]
    if sum(b - a for a, b in keep) < 12: keep = [(s0, e0)]
    def mapper(t):
        acc = 0.0
        for a, b in keep:
            if a <= t <= b: return acc + (t - a)
            acc += b - a
        return None
    return keep, mapper

def apply_cut(src, keep, out):
    """the kept pieces joined (video + audio), re-encoded on the GPU"""
    parts, cat = [], []
    for i, (a, b) in enumerate(keep):
        parts.append(f"[0:v]trim={a:.3f}:{b:.3f},setpts=PTS-STARTPTS[v{i}];[0:a]atrim={a:.3f}:{b:.3f},asetpts=PTS-STARTPTS,"
                     f"afade=t=in:d=0.03,afade=t=out:st={max(0.0, b - a - 0.03):.3f}:d=0.03[a{i}]")
        cat.append(f"[v{i}][a{i}]")
    fc = ";".join(parts) + ";" + "".join(cat) + f"concat=n={len(keep)}:v=1:a=1[v][a]"
    run_v(lambda ff, v: [ff, "-y", "-loglevel", "error", "-i", src, "-filter_complex", fc, "-map", "[v]", "-map", "[a]", *v,
                         "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", out], 16, 4)
    return out

SPANS = threading.Lock()

def is_repeat(src, channel, a, b, share=0.5):
    """(17 Nov: 3-min windows -> two moments 40 s apart gave two near-equal clips; research: drop on big overlap)
    True if more than `share` of [a, b] (recording seconds of this session) is already in a finished clip of the same
    session; else the span is written down. The best moment is edited first, so the best version is the one kept."""
    p = os.path.join(QUEUE, "spans.json"); key = f"{channel}|{os.path.dirname(os.path.abspath(src))}"
    with SPANS:
        try: d = json.load(open(p, encoding="utf-8"))
        except (OSError, ValueError): d = {}
        for x, y in d.get(key, []):
            ov = min(b, y) - max(a, x)
            if ov > share * min(b - a, y - x): return True
        d.setdefault(key, []).append([round(a, 1), round(b, 1)])
        tmp = p + ".tmp"; json.dump(d, open(tmp, "w", encoding="utf-8")); os.replace(tmp, p)
    return False

def edit(src, dst, hook="", credit="", lang=None, peak=None, channel="", url="", score=None, chat=(), title="", replay=False, original="", at=None,
         orig_at=None, rec_started=None, live_started=None, force_first="", ideia=""):  # (owner 16 Nov: "stop doing the replay at the end") off
    """-> dst, or None when the clip is an ad break (anonymous viewers get Twitch ads)"""
    dur = duration(src); peak0 = peak  # (the trigger's place in the raw: peak may move back to the real event below)
    ws, found, music = words(src, lang)
    # (owner 16 Nov) the story around the moment, dead air out: a new, shorter source; words/peak/chat moved onto it
    # (owner 16 Nov: "yes, add the AI") the local AI reads the sentences: does it make sense alone, where does the story
    # start and end, and a hook that gives the context. Without it (server off) the rules decide.
    verdict, ai_hook, no_sense, scene_cut = None, "", False, False
    sn = sentences(ws) if ws else []
    if sn and peak is not None:
        sents = [(ws[a][0], ws[b][1], " ".join(w for _, _, w in ws[a:b + 1])) for a, b in sn]
        lo = loudness(src) or [0.0]
        trigger = peak; peak = find_event(lo, trigger)  # the event, not the chat's late reaction to it
        if peak != trigger: print(f"[editor] the event is {trigger - peak:.0f} s before the trigger", flush=True)
        mid = min(range(len(sents)), key=lambda i: 0 if sents[i][0] <= peak <= sents[i][1] else min(abs(sents[i][0] - peak), abs(sents[i][1] - peak)))
        verdict = ia.judge(sents, mid, (lang or found or "en")[:2], name=channel or "", title=title or "",
                           events=reactions(lo, chat, statistics.median(lo)) + [(trigger, "<- the moment was DETECTED here (chat/loudness); "
                                                                                 "the thing it reacts to may be up to 60 s earlier")])
    force = None
    global KEYWORDS
    KEYWORDS = set()
    for k in (verdict or {}).get("keywords", []):
        KEYWORDS |= {re.sub(r"[^\w']", "", x) for x in k.split() if len(x) >= 3}
    KEYWORDS -= KEY_STOP  # (filler the AI sometimes returns: "aí", "isso", "não", "cara"...)
    if verdict:
        no_sense = not verdict["makes_sense"]
        a, b = sn[verdict["start"]][0], sn[verdict["end"]][1]
        force = (ws[a][0] - 0.25, ws[b][1] + 0.6)
        if not 12 <= force[1] - force[0] <= 130: force = None  # outside the length rules: the rules decide
        scene_cut = verdict.get("scene_continues", False)
        h = verdict["hook"]
        wrong_lang = (lang or found or "en")[:2] in ("pt", "es") and re.search(
            r"(the|his|her|their|reacts?|gets?|after|with|about|when|finds|tries|loses|wins|says)", h, re.I)  # (17 Nov: an English title on a PT clip)
        if h and not wrong_lang and len(h.split()) <= 9 and not SLURS.search(h) and grounded(h, " ".join(w for _, _, w in ws), channel): ai_hook = mask(h)
        elif h: verdict["why"] = f"(gancho da IA recusado, não foi dito: {h}) " + verdict["why"]
    keep, mp = smart_cut(src, ws, peak, dur, force)
    if not ideia and at is not None and peak0 is not None and is_repeat(src, channel, at - peak0 + keep[0][0], at - peak0 + keep[-1][1]):
        print(f"[editor] skipped: the same scene is already in another {channel} clip", flush=True); return None
    cut_src = os.path.splitext(dst)[0] + "_cut.mp4"; apply_cut(src, keep, cut_src)
    if mp:
        ws = [(mp(s), mp(e), w) for s, e, w in ws if mp(s) is not None and mp(e) is not None]
        chat = [(mp(t), m) for t, m in chat if mp(t) is not None]
        peak = mp(peak) if peak is not None and mp(peak) is not None else None
    else:
        a0 = keep[0][0]; ws = [(s - a0, e - a0, w) for s, e, w in ws if s >= a0]; chat = [(t - a0, m) for t, m in chat if t >= a0]
        peak = peak - a0 if peak is not None else None
    src = cut_src; dur = duration(src); trim = 0.0
    lay = layout.detect(src, channel or None)
    if lay["mode"] == "ad":
        print(f"[editor] skipped: ad break in the clip ({lay['ads']:.0%} of frames)", flush=True)
        os.remove(cut_src); return None
    slur = any(SLURS.search(w) for _, _, w in ws)
    ws = [(s, e, mask(w)) for s, e, w in ws]
    quote = quote_at(ws, peak if peak is not None else dur * 0.7)
    # the AI's context hook first; else a quote from the moment; else the channel's fixed line
    hook = ai_hook or mask(f"“{quote.upper()}”" if quote else hook)
    talk = sum(e - s for s, e, _ in ws) / max(dur, 1.0)
    # chat lines on screen: real messages with words (no usernames, no emoji the font cannot draw, slurs masked)
    lines, seen = [], set()
    for t, msg in chat:
        msg = mask(re.sub(r"[^\u0000-\uFFFF]", "", msg)).strip()
        if not (2 <= len(msg) <= 40) or not re.search(r"[A-Za-zÀ-ÿ]{2}", msg) or msg.lower() in seen: continue
        if not readable(msg): continue
        if lines and t - trim - lines[-1][0] < 0.6: continue
        seen.add(msg.lower()); lines.append((t - trim, msg))
    lines = [l for l in lines if l[0] >= 0][:10]
    vertical = lay.get("H", 0) > lay.get("W", 1); full_wins = []
    if layout.REF_STYLE and lay["mode"] == "split" and not vertical:
        fw_, gw_ = cut_windows(ws, loudness(src) or [0.0], dur, layout.face_full_ok(lay))
        base, seam = layout.filters_ref(lay, fw_, gw_); full_wins = fw_ + gw_
    else:
        base, seam = (("[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920[st]", 1265) if vertical else layout.filters(lay))
    if ONE_WORD: lines = []  # (the example has no chat lines)
    mode = "face" if vertical else lay["mode"]
    ass = os.path.splitext(dst)[0] + ".ass"; card_png = ""
    if CARD_FOR_FACE and mode == "face" and not vertical:
        # (owner 17 Nov, 2nd example: "this is good too") chat / big-webcam clips: the post card - header with our logo,
        # name, @ and the context line; the WHOLE stream rounded under it; colourful 2-3 word captions
        card_png = os.path.splitext(dst)[0] + "_card.png"
        cartao.header_png(card_png, card_text(hook, channel), (lang or found or "en")[:2])
        base, seam = cartao.filters(lay, card_png)
        cred = (f"Dialogue: 0,{ass_time(0)},{ass_time(dur)},Credit,,0,0,0,,{{\\an8\\pos(540,{cartao.VID_Y + cartao.VID_H + 18})}}{credit}"
                if credit else "")
        make_ass([], "", "", dur, ass, mode, seam, [], "", None, None, "", None)  # the style block only
        body = open(ass, encoding="utf-8").read().replace("Style: Wm,", cartao.CARD_STYLE + "Style: Wm,")
        body = "\n".join(l for l in body.split("\n") if ",Wm," not in l or l.startswith("Style:"))  # (the @ is in the header)
        with open(ass, "w", encoding="utf-8") as f: f.write(body + "\n".join(cartao.ass_words(ws, dur, seam) + ([cred] if cred else [])) + "\n")
    else:
        make_ass(ws, hook, credit, dur, ass, mode, seam, lines, "" if ONE_WORD else context_label(title), lay.get("head_out"), lay.get("game_top"), (lang or found or "en")[:2], lay.get("game_bottom"), full_wins)
    assf = ass.replace("\\", "/").replace(":", "\\:")
    # (the example) a thin progress bar at the bottom, in the brand colour, filling up to the end
    bar = f",drawbox=x=0:y=1832:w='max(2,iw*t/{max(dur - trim, 1):.2f})':h=9:color={BRAND_HEX}@0.95:t=fill"
    bar = ""  # (owner 17 Nov: "take out that red line") no progress bar
    vf = base + f";[st]ass='{assf}':fontsdir='{FONTS_DIR_FF}'{bar}[v]"
    if INSET_CARD and mode == "split" and not card_png:
        card_png = os.path.splitext(dst)[0] + "_card.png"
        cartao.header_png(card_png, card_text(hook, channel), (lang or found or "en")[:2], inset=True)
        vf = base + f";[st]ass='{assf}':fontsdir='{FONTS_DIR_FF}'[in];" + cartao.wrap(card_png)
    run_v(lambda ff, v: [ff, "-y", "-loglevel", "error", *(["-ss", f"{trim:.2f}"] if trim else []), "-i", src, "-filter_complex", vf,
                         "-map", "[v]", "-map", "0:a?", "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", *v, "-pix_fmt", "yuv420p",
                         "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", "-map_metadata", "-1", dst], 20, 4)  # GPU, CPU if refused
    for tmp in (ass, cut_src, card_png):
        try: os.remove(tmp)
        except OSError: pass
    if replay and peak is not None and 3.0 <= peak <= dur - 1.0: add_replay(dst, peak)
    # ready to post, or to look at first (music = muted/claimed; slur = never post as is; little talk = maybe a cutscene,
    # a story spoiler or game-only: Rockstar takes down cutscenes and big story reveals)
    # (owner 17 Nov: "I only want audience - monetization and strikes don't matter, put everything in") music and
    # little talk (cutscenes/spoilers) no longer hold a clip back; they are only noted in the .txt
    notes = [w for w, bad in (("tem música", music), ("pouca fala (cutscene?)", talk < 0.15)) if bad]
    why = [w for w, bad in (("palavra proibida", slur),
                            ("sem sentido sozinho (IA)", no_sense), ("a cena continua depois do fim (IA)", scene_cut)) if bad]
    first = force_first or (first_in_gta6(channel, title, verdict, rec_started, live_started, (lang or found or "en")[:2]) if verdict and channel else "")
    if force_first: why = []  # (the diary found it: a first is posted even when the AI finds the moment quiet)
    if first: ai_hook = first  # (owner 17 Nov: "the FIRST of each one in GTA 6") the milestone is the headline
    name = channel or "stream"; site = "Twitch" if "twitch.tv" in url else "Kick" if "kick.com" in url else "YouTube" if "youtu" in url else ""
    # the post title: the AI's context line (checked against what was said) first, else the spoken quote
    title = (ai_hook.capitalize() if ai_hook else quote[:1].upper() + quote[1:] if quote else hook.strip("“”").capitalize() or f"{name} clip")[:90]
    if ai_hook and quote: title = f"{title} — “{quote}”"[:110]
    post = (f"TÍTULO: {title}\n\nLEGENDA:\n{title}\n🎥 {name}" + (f" ({site}: {url})" if url else "") + f"\n{TAGS.get((lang or found or 'en')[:2], TAGS['en'])} #{re.sub(r'[^A-Za-z0-9_]', '', name)}\n\n"
            f"Pontuação: {score}   Rever: {', '.join(why) or 'não'}" + (f"   Notas: {', '.join(notes)}" if notes else "") + "\n"
            f"IA ({verdict.get('engine', '') if verdict else ''}): {('sentido ok' if verdict['makes_sense'] else 'SEM SENTIDO') + ' - ' + verdict['why'] if verdict else 'desligada (regras)'}\n\nTranscrição ({found}): {' '.join(w for _, _, w in ws)}\n")
    with open(os.path.splitext(dst)[0] + ".txt", "w", encoding="utf-8") as f: f.write(post)
    if channel:  # the owner's folders: prontos/<lang> (post from the phone) and rever/<lang>
        fd = os.path.join(OUT, "rever" if why else "prontos", (lang or found or "en")[:2])
        if ideia and not first: fd = os.path.join(OUT, "por_ideia", ideia, (lang or found or "en")[:2])  # (owner 17 Nov: a clip per idea)
        os.makedirs(fd, exist_ok=True)
        base = os.path.join(fd, f"{datetime.now():%m%d_%H%M%S}_{name}_{score if score is not None else 0:.0f}pts")  # (17 Nov: seconds, two clips in one minute overwrote each other)
        import shutil
        kept = keep_original(original, os.path.basename(base))
        if kept:
            with open(os.path.splitext(dst)[0] + ".txt", "a", encoding="utf-8") as f:
                f.write(f"\nOriginal sem edição (3 min antes do momento, 50 s depois): {kept}\n")
        shutil.copyfile(dst, base + ".mp4"); shutil.copyfile(os.path.splitext(dst)[0] + ".txt", base + ".txt")
        # (17 Nov) the clip's fact sheet: what the recap, the "same moment" clips and the phone notices read
        sheet = {"channel": name, "lang": (lang or found or "en")[:2], "score": score, "title": title, "hook": ai_hook or hook,
                 "event": (verdict or {}).get("event", ""), "category": (verdict or {}).get("category", "other"), "first": first,
                 "makes_sense": not why, "payoff_t": round(peak - trim, 2) if peak is not None else None, "dur": round(dur - trim, 2),
                 "game": title_game(title), "stream_title": title, "at": at, "session": os.path.basename(os.path.dirname(os.path.abspath(dst))),
                 "original": kept, "orig_at": orig_at, "made": datetime.now().isoformat(timespec="seconds"), "ideia": ideia,
                 "rec_started": rec_started, "live_started": live_started, "mode": mode, "game_top": lay.get("game_top"),
                 "words": [(round(s - trim, 2), round(e - trim, 2), w) for s, e, w in ws if s >= trim]}
        with open(base + ".json", "w", encoding="utf-8") as f: json.dump(sheet, f, ensure_ascii=False)
        if not why and score is not None and (score >= STRONG or first):  # (owner: be the FIRST to post) a strong one -> phone
            with open(os.path.join(OUT, "avisos.jsonl"), "a", encoding="utf-8") as f:
                f.write(json.dumps({"clip": base + ".mp4", "title": title, "channel": name, "score": score, "first": first}, ensure_ascii=False) + "\n")
    return dst

STRONG = 10.0  # score that sends a clip straight to the owner's phone

DISPLAY = {"ishowspeed": "ISHOWSPEED", "kaicenat": "KAI CENAT", "caseoh_": "CASEOH", "lacy": "LACY", "angryginge13": "ANGRY GINGE",
           "alanzoka": "ALANZOKA", "paulinholokobr": "PAULINHO O LOKO", "coringa": "CORINGA", "loudcoringa": "CORINGA",
           "illojuan": "ILLOJUAN", "casimiro": "CASIMIRO", "jasontheween": "JASONTHEWEEN", "plaqueboymax": "PLAQUEBOYMAX"}

def display(ch):
    """the name people know (titles, tags): angryginge13 -> ANGRY GINGE"""
    c = (ch or "").lower().lstrip("@")
    return DISPLAY.get(c, c.upper().rstrip("_"))

# (17 Nov: "semana de gta 6" on a GTA 5 stream gave a FALSE "first death in GTA 6") GTA 6 can only be played from
# midnight in New Zealand = 11:00 here on 18 Nov; before that a title that says GTA 6 is only hype, not the game
GTA6_FROM = datetime(2026, 11, 18, 11, 0)

def title_game(stream_title):
    t = (stream_title or "").lower()
    if re.search(r"gta ?(6|vi)\b|grand theft auto (6|vi)\b", t): return "gta6" if datetime.now() >= GTA6_FROM else "gta"
    if re.search(r"\bgta\b|grand theft auto", t): return "gta"
    return ""

FIRST_LABEL = {  # category -> what the headline calls it (en / pt / es)
    "death": ("FIRST DEATH", "PRIMEIRA MORTE", "PRIMERA MUERTE"), "crash": ("FIRST CRASH", "PRIMEIRA BATIDA", "PRIMER CHOQUE"),
    "police": ("FIRST POLICE CHASE", "PRIMEIRA FUGA DA POLÍCIA", "PRIMERA PERSECUCIÓN"),
    "steal_car": ("FIRST STOLEN CAR", "PRIMEIRO CARRO ROUBADO", "PRIMER COCHE ROBADO"),
    "heist": ("FIRST HEIST", "PRIMEIRO ASSALTO", "PRIMER ATRACO"), "map": ("FIRST LOOK AT THE MAP", "PRIMEIRA VEZ NO MAPA", "PRIMERA VEZ EN EL MAPA"),
    "mission": ("FIRST MISSION", "PRIMEIRA MISSÃO", "PRIMERA MISIÓN")}

def first_in_gta6(channel, stream_title, verdict, rec_started, live_started, lang="en"):
    """(owner 17 Nov) "<NAME>'S FIRST DEATH IN GTA 6" - only when it is TRUE as far as we can know: the streamer says it
    is his first, OR we have watched him since the very start of his first GTA 6 live (recording began <= 15 min after
    the live did) and this kind of moment never happened before in any of his GTA 6 recordings."""
    if title_game(stream_title) != "gta6": return ""
    cat = verdict.get("category", "other")
    if cat not in FIRST_LABEL: return ""
    p = os.path.join(OUT, "marcos.json")
    with SPANS:
        try: d = json.load(open(p, encoding="utf-8"))
        except (OSError, ValueError): d = {}
        c = d.setdefault(channel, {"seen": [], "full": None, "days": []})
        if c["full"] is None:  # his first GTA 6 recording decides if we saw it all from the start
            c["full"] = bool(rec_started and live_started and rec_started - live_started <= 900)
        day = datetime.now().strftime("%Y-%m-%d")
        if day not in c["days"]: c["days"].append(day)
        new = cat not in c["seen"]
        if new: c["seen"].append(cat)
        tmp = p + ".tmp"; json.dump(d, open(tmp, "w", encoding="utf-8")); os.replace(tmp, p)
    if not new or not (c["full"] or verdict.get("first_said")): return ""
    who = display(channel)
    en, pt, es = FIRST_LABEL[cat]
    return {"pt": f"{pt} DO {who} NO GTA 6", "es": f"{es} DE {who} EN GTA 6"}.get(lang, f"{who}'S {en} IN GTA 6")

# ---------------------------------------------------------------- one recorder (segments, rolling 15 min)
MIN_FREE_GB = 8  # below this on the output disk no new clips are cut (the editor still finishes the queue)

PRE_DEFAULT, POST_DEFAULT = 120.0, 90.0  # (owner 17 Nov: "the chat goes crazy 20-50 s AFTER the event") 2 min before  # (owner 17 Nov: "good context" + "up to 2 minutes if it needs it") was 60 / 50

def watch(url, minutes, lang=None, hook="", credit="", pre=PRE_DEFAULT, post=POST_DEFAULT, keep_min=60, seg=20, height=1080):  # (owner 16 Nov: "more image quality") source 1080p60
    """(16 Nov) runs until `minutes` are up: a channel that is offline (launch day: start before they go live) or a stream
    that drops is retried every 60 s; each live session gets its own folder"""
    name = channel_of(url) or "stream"; credit = credit or f"@{name}"; t_end = time.time() + minutes * 60
    chat = (TwitchChat(channel_of(url)) if "twitch.tv" in url else
            YouTubeChat(url, os.path.join(OUT, "chat", name)) if ("youtube.com" in url or "youtu.be" in url) else None)
    if chat: chat.start()
    n, tries = 0, 0
    while time.time() < t_end:
        got, live = _session(url, name, credit, t_end, chat, lang, hook, pre, post, keep_min, seg, height, quiet=tries > 0)
        n += got; tries = 0 if live else tries + 1
        if time.time() < t_end:
            if tries == 1: print(f"[{name}] offline; trying again every 60 s", flush=True)
            time.sleep(60 if not live else 15)
    if chat:
        chat.stop = True
        if getattr(chat, "proc", None) and chat.proc.poll() is None: chat.proc.terminate()
    print(f"[{name}] stopped; {n} highlights", flush=True)

def _session(url, name, credit, t_end, chat, lang, hook, pre, post, keep_min, seg, height, quiet=False):
    import shutil
    od = os.path.join(OUT, f"{name}_{datetime.now():%Y%m%d_%H%M%S}"); sd = os.path.join(od, "seg"); os.makedirs(sd, exist_ok=True); os.makedirs(QUEUE, exist_ok=True)
    lst = os.path.join(od, "segments.csv")
    yt = [sys.executable, "-m", "yt_dlp", "-q", "--no-warnings", "--no-part", "--ffmpeg-location", os.path.dirname(FF), "--hls-use-mpegts", "-f", f"best[height<={height}]/best", "-o", "-", url]
    ff = [FF, "-loglevel", "error", "-i", "pipe:0", "-map", "0", "-c", "copy", "-f", "segment", "-segment_time", str(seg),
          "-reset_timestamps", "1", "-segment_list", lst, "-segment_list_type", "csv", os.path.join(sd, "s%06d.ts")]
    if "youtube.com" in url or "youtu.be" in url:
        # (test 16 Nov, IShowSpeed) YouTube lives now come as separate video-only + audio-only HLS: yt-dlp gives the two
        # addresses and ffmpeg reads both and writes the pieces itself (the addresses expire after hours: a retry gets new ones)
        h = max(height, 1080)  # (IShowSpeed's own webcam is small among teammates': 1080p keeps his face sharp)
        r = subprocess.run([sys.executable, "-m", "yt_dlp", "-q", "--no-warnings", "-g", "-f",
                            f"bv*[height<={h}]+ba/b[height<={h}]/b", url], capture_output=True, text=True)
        hls = [l for l in r.stdout.split() if l.startswith("http")]
        if not hls:
            if not quiet: print(f"[{name}] not live or no formats {r.stderr[-200:].strip()}", flush=True)
            shutil.rmtree(od, ignore_errors=True); return 0, False
        ins = sum([["-i", u] for u in hls], [])
        ff = [FF, "-loglevel", "error", *ins, *(["-map", "0:v:0", "-map", "1:a:0"] if len(hls) > 1 else ["-map", "0"]), *ff[ff.index("-c"):]]
        p1 = subprocess.Popen([sys.executable, "-c", "import time; time.sleep(10**9)"], stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)  # (placeholder)
        p2 = subprocess.Popen(ff, stdin=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    else:
        p1 = subprocess.Popen(yt, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        p2 = subprocess.Popen(ff, stdin=p1.stdout, stderr=subprocess.DEVNULL); p1.stdout.close()
    if not quiet: print(f"[{name}] connecting {url}", flush=True)
    t_rec0, segs, loud, n, done, emitted, warned, meta = None, [], [], 0, set(), [], False, {"title": ""}
    log = open(os.path.join(od, "highlights.jsonl"), "a", encoding="utf-8")
    # (owner 17 Nov: "record everything, so the special clips never depend on the clips we happened to make") the
    # live's info and ALL its chat go to files the diary (diario.py) reads; the last hour of video stays on disk
    chat_f = open(os.path.join(od, "chat.jsonl"), "a", encoding="utf-8"); chat_n = 0
    def _meta():
        tmp = os.path.join(od, "meta.json.tmp")
        json.dump({"channel": name, "url": url, "lang": lang, "t_rec0": t_rec0, "live_started": meta.get("started"),
                   "title": meta.get("title", ""), "seg_dir": sd, "segments": lst}, open(tmp, "w", encoding="utf-8"))
        os.replace(tmp, os.path.join(od, "meta.json"))
    while time.time() < t_end:
        time.sleep(10)
        if t_rec0 is not None:
            try: _meta()
            except OSError: pass
        if chat is not None:
            ev = list(chat.events)
            if len(ev) < chat_n: chat_n = 0
            for e in ev[chat_n:]:
                if len(e) > 4: chat_f.write(json.dumps([round(e[0], 2), e[2], e[4]], ensure_ascii=False) + "\n")
            chat_n = len(ev); chat_f.flush()
        if p2.poll() is not None or p1.poll() not in (None, 0):
            err = p1.stderr.read().decode(errors="replace")[-300:].strip() if p1.poll() is not None else ""
            if segs or not quiet: print(f"[{name}] stream ended or not live {err}", flush=True)
            break
        # the finished pieces (the csv lists a piece once it is closed): our own timeline from their durations
        rows = list(csv.reader(open(lst, encoding="utf-8"))) if os.path.exists(lst) else []
        if t_rec0 is None and rows:
            t_rec0 = os.path.getctime(os.path.join(sd, rows[0][0])) - 1.0; print(f"[{name}] LIVE, recording", flush=True)
            def _title():
                r = subprocess.run([sys.executable, "-m", "yt_dlp", "-q", "--no-warnings", "--simulate", "--print", "description", url],
                                   capture_output=True, text=True, encoding="utf-8", errors="replace")
                meta["title"] = r.stdout.strip()[:200]
                r = subprocess.run([sys.executable, "-m", "yt_dlp", "-q", "--no-warnings", "--simulate", "--print",
                                    "%(timestamp|)s %(release_timestamp|)s", url], capture_output=True, text=True)
                ts = [float(x) for x in r.stdout.split() if re.fullmatch(r"\d{9,11}(\.\d+)?", x)]
                meta["started"] = min(ts) if ts else None  # when the live itself began (epoch s), if the site says
            threading.Thread(target=_title, daemon=True).start()
        while len(segs) < len(rows):
            r = rows[len(segs)]; t0 = segs[-1][2] if segs else 0.0; p = os.path.join(sd, r[0])
            segs.append((p, t0, t0 + float(r[2]) - float(r[1])))
            loud.extend(loudness(p)[:int(round(float(r[2]) - float(r[1])))])  # (each piece is measured once)
        if not segs: continue
        rec_end = segs[-1][2]
        # only the last 20 min are looked at (older pieces are gone anyway); 5 s bins from ws
        ws = max(0.0, (rec_end - 20 * 60) // 5 * 5)
        series, clips = ([], [])
        if chat and t_rec0: series, clips = chat_bins(list(chat.events), t_rec0 + ws, t_rec0 + rec_end)
        cands = [("chat", ws + i * 5.0 - 5.0) for i in chat_spikes(series)]  # (chat reacts ~5 s after the moment)
        cands += [("clip_asks", ws + i * 5.0 - 10.0) for i, c in enumerate(clips) if c >= 3]  # 3+ chatters asking "clip it"
        cands += [("loud", float(s)) for s in loud_spikes(loud, start=int(ws))]
        low_disk = shutil.disk_usage(OUT).free < MIN_FREE_GB * 1e9
        if low_disk and not warned: print(f"[{name}] DISK ALMOST FULL (< {MIN_FREE_GB} GB on {OUT}): no new clips", flush=True); warned = True
        for kind, at in sorted(cands, key=lambda c: c[1]):
            key = round(at / 20)
            # (wait for the chat after the moment: 20 s on Twitch; YouTube's chat arrives in batches ~25 s late -> 40 s)
            if key in done or at + max(post, getattr(chat, "lag", 20.0) if chat else 20.0) > rec_end: continue
            done.add(key)
            if any(abs(at - t) < 35 for t in emitted): continue  # (test 16 Nov: the same moment came out twice, 25 s apart)
            score, why = score_at(at, ws, series, clips, loud)
            # the bar rises with every clip of the last 10 min: a calm stream gives its best moment, a crazy one only its best few
            k = sum(1 for t in emitted if t > at - 600); bar = 6.0 + 3.0 * k  # (rehearsal 16 Nov: 3 + 1.5k gave ~20 clips an hour per streamer; this halves it)
            log.write(json.dumps({"at": round(at), "kind": kind, "score": score, "bar": bar, **why}) + "\n"); log.flush()
            if score < bar or low_disk: continue
            emitted.append(at); n += 1
            raw = os.path.join(od, f"clip{n:03d}_raw.mp4"); a0 = max(at - pre, segs[0][1])
            if cut_segments(segs, a0, at + post, raw):
                orig = os.path.join(od, f"clip{n:03d}_original.mp4")
                try:
                    if not copy_segments(segs, max(at - ORIG_PRE, segs[0][1]), at + post, orig): orig = ""
                except Exception: orig = ""
                o0 = max(at - ORIG_PRE, segs[0][1])
                job = {"raw": raw, "original": orig, "orig_at": round(at - o0, 2), "rec_started": t_rec0, "live_started": meta.get("started"), "short": os.path.join(od, f"clip{n:03d}_short.mp4"), "hook": hook, "credit": credit, "lang": lang,
                       "kind": kind, "at": at, "peak": at - a0, "channel": name, "url": url, "score": score, **why,
                       "title": meta["title"], "chat": [(round(e[0] - (t_rec0 + a0), 2), e[4]) for e in list(chat.events)
                                if t_rec0 and t_rec0 + a0 <= e[0] <= t_rec0 + at + post and e[2] != "plain" and len(e) > 4] if chat else []}
                with open(os.path.join(QUEUE, f"{int(time.time() * 1000)}_{name}_{n:03d}.json"), "w", encoding="utf-8") as f: json.dump(job, f)
                print(f"[{name}] highlight {n} ({kind}, score {score}: {why}) at {at:.0f}s -> queued", flush=True)
        # keep only the last keep_min minutes on disk (an hour; 20 min when the disk gets tight)
        km = keep_min if shutil.disk_usage(OUT).free > 25e9 else min(keep_min, 20)
        for p, _, t1 in segs:
            if t1 < rec_end - km * 60 and os.path.exists(p): os.remove(p)
    for p in (p2, p1):
        if p.poll() is None: p.terminate()
    for p in (p2, p1):
        try: p.wait(10)
        except Exception: pass
    log.close()
    # (17 Nov) the pieces stay for the diary's last hour (same moment / firsts); diario.py removes them after
    if not segs: shutil.rmtree(od, ignore_errors=True)  # an offline try leaves nothing behind
    return n, bool(segs)

# ---------------------------------------------------------------- the editor (one, below normal priority)
def worker(idle_exit=None):
    os.makedirs(QUEUE, exist_ok=True); idle = 0
    while True:
        jobs = sorted(glob.glob(os.path.join(QUEUE, "*.json")))
        if not jobs:
            time.sleep(3); idle += 3
            if idle_exit and idle >= idle_exit: return
            continue
        idle = 0
        def sc(p):  # the strongest moment is edited first (ties: the oldest)
            try: return json.load(open(p, encoding="utf-8")).get("score", 0.0)
            except Exception: return 0.0
        jp0 = max(jobs, key=lambda p: (sc(p), -jobs.index(p))); jp = jp0 + ".working"
        try: os.replace(jp0, jp)  # (two editors) whoever renames it first edits it
        except OSError: continue
        try:
            job = json.load(open(jp, encoding="utf-8"))
            t = time.time(); made = edit(job["raw"], job["short"], job.get("hook", ""), job.get("credit", ""), job.get("lang"),
                                  peak=job.get("peak"), channel=job.get("channel", ""), url=job.get("url", ""), score=job.get("score"),
                                  chat=job.get("chat", []), title=job.get("title", ""), original=job.get("original", ""), at=job.get("at"),
                                  orig_at=job.get("orig_at"), rec_started=job.get("rec_started"), live_started=job.get("live_started"),
                                  force_first=job.get("force_first", ""), ideia=job.get("ideia", ""))
            if made is None:
                os.replace(jp, jp0 + ".skipped"); os.remove(job["raw"])
                if job.get("original") and os.path.exists(job["original"]): os.remove(job["original"])
                continue
            print(f"[editor] {os.path.basename(job['short'])} ready in {time.time() - t:.0f}s ({len(jobs) - 1} waiting)", flush=True)
            os.replace(jp, jp0 + ".done")
            try: os.remove(job["raw"])  # (disk) the raw cut is not needed once the short exists
            except OSError: pass
        except Exception as e:  # a bad clip must not stop the line
            print(f"[editor] failed {jp0}: {e}", flush=True)
            try: os.replace(jp, jp0 + ".failed")
            except OSError: pass

def multi(path, minutes):
    lines = [l.strip() for l in open(path, encoding="utf-8-sig") if l.strip() and not l.startswith("#")]
    me = [sys.executable, "-I", os.path.abspath(__file__)]
    n_ed = 2 if len(lines) >= 6 else 1  # (2 x whisper turbo int8 ~ 3 GB of the GPU's 4 GB)
    eds = [subprocess.Popen(me + ["worker"], creationflags=BELOW_NORMAL) for _ in range(n_ed)]
    procs = list(eds)
    for l in lines:
        parts = [x.strip() for x in l.split("|")] + ["", ""]
        procs.append(subprocess.Popen(me + ["watch", parts[0], "--minutes", str(minutes)] + (["--lang", parts[1]] if parts[1] else []) + (["--hook", parts[2]] if parts[2] else [])))
    print(f"{len(lines)} recorders + {n_ed} editor(s) running, all the time (recording never stops while clips are edited)", flush=True)
    try:
        while any(p.poll() is None for p in procs[n_ed:]): time.sleep(10)
        # (test 16 Nov: the last clip was cut off mid-edit) let the editors finish the queue before stopping them
        while (glob.glob(os.path.join(QUEUE, "*.json")) or glob.glob(os.path.join(QUEUE, "*.working"))) and any(e.poll() is None for e in eds):
            time.sleep(5)
    finally:
        for p in procs:
            if p.poll() is None: p.terminate()

def chat_test(channel, seconds):
    c = TwitchChat(channel); c.start(); t0 = time.time()
    while time.time() - t0 < seconds:
        time.sleep(5); ev = [e for e in c.events if e[0] > time.time() - 5]
        cats = {}
        for e in ev: cats[e[2]] = cats.get(e[2], 0) + 1
        s, _ = chat_bins(ev, time.time() - 5, time.time() + 0.01)
        print(f"{time.time() - t0:5.0f}s  connected={c.ok} room={c.room} emotes={len(c.emotes)}  last 5 s: {len(ev)} msgs from "
              f"{len({e[3] for e in ev})} chatters, score {s[0] if s else 0:.0f}  {cats}" + ("  [muted: raid/gifts]" if time.time() < c.mute_until else ""), flush=True)
    c.stop = True

if __name__ == "__main__":
    ap = argparse.ArgumentParser(); sp = ap.add_subparsers(dest="cmd", required=True)
    a = sp.add_parser("watch"); a.add_argument("url"); a.add_argument("--minutes", type=float, default=60); a.add_argument("--lang"); a.add_argument("--hook", default=""); a.add_argument("--credit", default="")
    m = sp.add_parser("multi"); m.add_argument("channels"); m.add_argument("--minutes", type=float, default=600)
    w = sp.add_parser("worker"); w.add_argument("--idle-exit", type=float)
    b = sp.add_parser("edit"); b.add_argument("video"); b.add_argument("--start", type=float); b.add_argument("--end", type=float); b.add_argument("--hook", default=""); b.add_argument("--credit", default=""); b.add_argument("--lang"); b.add_argument("--out")
    c = sp.add_parser("chat"); c.add_argument("channel"); c.add_argument("--seconds", type=float, default=60)
    g = ap.parse_args()
    if g.cmd == "watch": watch(g.url, g.minutes, g.lang, g.hook, g.credit)
    elif g.cmd == "multi": multi(g.channels, g.minutes)
    elif g.cmd == "worker": worker(g.idle_exit)
    elif g.cmd == "chat": chat_test(g.channel, g.seconds)
    else:
        os.makedirs(OUT, exist_ok=True); src = g.video
        base = os.path.join(OUT, os.path.splitext(os.path.basename(src))[0])
        if g.start is not None:
            raw = base + "_cut.mp4"; cut(src, g.start, g.end if g.end is not None else duration(src), raw); src = raw
        print(edit(src, g.out or base + "_short.mp4", g.hook, g.credit, g.lang))
