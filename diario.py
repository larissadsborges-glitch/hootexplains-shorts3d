"""
The live diary (owner 17 Nov: "record everything and do all of it, so we never depend on the clips we happened to
make" / "he may never SAY it is his first time - but it still is").

One process follows every live the recorders are writing (<OUT>/<channel>_<date>/meta.json + segments.csv + chat.jsonl):
  1. DIARY: transcribes EVERYTHING said (whisper small on the GPU, ~1 min behind the live) -> diario.jsonl
  2. EVENTS: every 5 min the AI reads the last 5 min of the diary + chat and lists what happened in the game
     (death, police, stolen car, crash, heist, mission, first look at the map) -> eventos.jsonl
  3. FIRSTS: an event this streamer never had before in GTA 6 (and we watched him from the start) becomes a clip job
     "<NAME>'S FIRST DEATH IN GTA 6", even when it was a calm moment no highlight would ever catch
  4. SAME MOMENT: the game characters' lines are the same in every stream: when 2-4 streamers say the same 6-word lines
     (2+ of them, at a steady offset), each one's piece is cut from his last hour of video and they go side by side, in sync
  python diario.py --until "2026-11-20 04:00"   (the watcher starts it)
Games watched: GTA 6 only (DIARIO_GAMES=gta6,gta to test on other GTA streams).
"""
import argparse, csv, glob, json, os, re, subprocess, sys, time, wave
from datetime import datetime

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import clipper as C
import ia, layout, extras

GAMES = set((os.environ.get("DIARIO_GAMES") or "gta6").split(","))
BATCH = 6          # 6 x 20 s pieces = 2 min of audio per transcription
SCAN_EVERY = 300   # s of live between two AI event scans
_model = None
# every event becomes its own clip in por_ideia/<category>/ (the editor does the firsts and the strong ones first)
IDEA_SCORE = {"opening": 9.0, "mission": 8.0, "heist": 8.0, "death": 6.0, "police": 6.0, "crash": 5.0, "steal_car": 4.0, "map": 4.0}

EVENT_PROMPT = """Below is what the streamer {name} said in the last minutes of a {game} livestream (times in seconds),
and what his chat wrote (chat types 5-30 s AFTER what it reacts to).

SPEECH:
{speech}

CHAT:
{chat}

List the GAME EVENTS that clearly happened in this window. Categories:
opening (owner 18 Nov: his reaction OPENING the game for the first time: the game finally launches / the Rockstar
logo or intro plays / the title screen / "we're in", "it's open", "estamos dentro", "abriu", "ya está" / he takes control
of his character for the first time), death (died / wasted / got killed), police (wanted level, chase, arrested, busted), steal_car (takes/steals a car),
crash (crashes a vehicle hard), heist (robbery / heist), mission (a mission completed or failed), map (opens / looks at
the map for the first time).
Only events that ACTUALLY HAPPENED, clearly shown by his words OR by many chat lines (e.g. lots of "WASTED", "he died",
"L"). Not a fear or a near miss: "I'm going to die", "I almost died", "we're gonna crash" are NOT events. Do not guess.
For each: t = the time it happened (seconds, from the speech times; if only chat shows it, ~15 s before the chat lines),
category, what (max 8 words, English), evidence (a short quote).
Answer JSON only: {{"events": [{{"t": 0, "category": "death", "what": "", "evidence": ""}}]}}"""


def model():
    global _model
    if _model is None:
        from faster_whisper import WhisperModel
        try:
            import nvidia
            for d in glob.glob(os.path.join(nvidia.__path__[0], "*", "bin")): os.add_dll_directory(d); os.environ["PATH"] = d + os.pathsep + os.environ["PATH"]
            _model = WhisperModel("small", device="cuda", compute_type="int8")
        except Exception as e:
            print(f"[diary] whisper on the CPU ({type(e).__name__})", flush=True)
            _model = WhisperModel("small", device="cpu", compute_type="int8", cpu_threads=3)
    return _model


def seg_times(meta):
    rows = list(csv.reader(open(meta["segments"], encoding="utf-8"))) if os.path.exists(meta["segments"]) else []
    out, t = [], 0.0
    for r in rows:
        d = float(r[2]) - float(r[1]); out.append((os.path.join(meta["seg_dir"], r[0]), t, t + d)); t += d
    return out


def transcribe(paths, lang):
    import numpy as np
    lst = paths[0] + ".lst.txt"; wav = paths[0] + ".diary.wav"
    open(lst, "w", encoding="utf-8").write("".join("file '" + p.replace("\\", "/") + "'\n" for p in paths))
    subprocess.run([C.FF, "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst, "-vn", "-ac", "1", "-ar", "16000",
                    "-sample_fmt", "s16", wav], check=True)
    w = wave.open(wav); a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768; w.close()
    for p in (lst, wav):
        try: os.remove(p)
        except OSError: pass
    segs, _ = model().transcribe(a, language=lang, word_timestamps=True, vad_filter=True, beam_size=1,
                                 condition_on_previous_text=False)
    return [(x.start, x.end, x.word.strip()) for s in segs if not (s.no_speech_prob > 0.6 and s.avg_logprob < -0.8)
            for x in (s.words or []) if x.word.strip()]


class Live:
    def __init__(self, od):
        self.od = od; self.meta = json.load(open(os.path.join(od, "meta.json"), encoding="utf-8"))
        self.st_p = os.path.join(od, "diario_state.json")
        try: self.st = json.load(open(self.st_p, encoding="utf-8"))
        except (OSError, ValueError): self.st = {"k": 0, "scanned": 0.0, "upto": 0.0}

    @property
    def ch(self): return self.meta["channel"]

    def save(self):
        tmp = self.st_p + ".tmp"; json.dump(self.st, open(tmp, "w", encoding="utf-8")); os.replace(tmp, self.st_p)

    def words(self, a=0.0, b=1e12):
        out = []
        try:
            for ln in open(os.path.join(self.od, "diario.jsonl"), encoding="utf-8"):
                s, e, w = json.loads(ln)
                if a <= s <= b: out.append((s, e, w))
        except OSError: pass
        return out

    def chat(self, a, b):
        t0 = self.meta.get("t_rec0") or 0; out = []
        try:
            for ln in open(os.path.join(self.od, "chat.jsonl"), encoding="utf-8"):
                t, cat, msg = json.loads(ln)
                if a <= t - t0 <= b: out.append((t - t0, cat, msg))
        except OSError: pass
        return out

    def step(self, matcher):
        """transcribe what is new; scan for events every 5 min of live -> True if it did work"""
        self.meta = json.load(open(os.path.join(self.od, "meta.json"), encoding="utf-8"))
        segs = seg_times(self.meta); k = self.st["k"]
        new = [s for s in segs[k:k + BATCH] if os.path.exists(s[0])]
        if k < len(segs) and not os.path.exists(segs[k][0]):  # (fell behind the hour on disk: skip ahead)
            while k < len(segs) and not os.path.exists(segs[k][0]): k += 1
            self.st["k"] = k; self.save(); return True
        if len(new) < BATCH and not (new and time.time() - os.path.getmtime(self.meta["segments"]) > 120): return False
        t0 = new[0][1]
        ws = [(round(s + t0, 2), round(e + t0, 2), w) for s, e, w in transcribe([p for p, _, _ in new], self.meta.get("lang"))]
        with open(os.path.join(self.od, "diario.jsonl"), "a", encoding="utf-8") as f:
            for x in ws: f.write(json.dumps(x, ensure_ascii=False) + "\n")
        self.st["k"] = k + len(new); self.st["upto"] = new[-1][2]; self.save()
        if C.title_game(self.meta.get("title")) in GAMES:
            matcher.add(self, ws)
            if self.st["upto"] - self.st["scanned"] >= SCAN_EVERY: self.scan(segs)
        return True

    def scan(self, segs):
        a, b = self.st["scanned"], self.st["upto"]; self.st["scanned"] = b; self.save()
        ws = self.words(a, b)
        if not ws: return
        speech = "\n".join(f"({s:.0f}s) {' '.join(w for _, _, w in grp)}" for s, grp in _lines(ws))
        ch = self.chat(a, b + 30)
        chat = "\n".join(f"({t:.0f}s) {m}" for t, _, m in ch[-150:]) or "(no chat)"
        txt, eng = ia._ask(EVENT_PROMPT.format(name=self.ch, game="GTA 6", speech=speech[-6000:], chat=chat[-4000:]), 60)
        try: evs = json.loads(re.search(r"\{.*\}", txt or "", re.S).group(0)).get("events", [])
        except (AttributeError, ValueError): evs = []
        with open(os.path.join(self.od, "eventos.jsonl"), "a", encoding="utf-8") as f:
            for e in evs: f.write(json.dumps({**e, "engine": eng}, ensure_ascii=False) + "\n")
        for e in evs:
            try: t = float(e.get("t", 0)); cat = str(e.get("category", "")).lower()
            except (TypeError, ValueError): continue
            label = C.first_in_gta6(self.ch, self.meta.get("title"), {"category": cat, "first_said": False},
                                    self.meta.get("t_rec0"), self.meta.get("live_started"), (self.meta.get("lang") or "en")[:2])
            if label: self.first_job(segs, t, label, e)
            elif cat in IDEA_SCORE and self.allow(cat, t): self.first_job(segs, t, "", e, ideia=cat)

    def allow(self, cat, t):
        """(owner 17 Nov: every event its own clip, kept per idea) not the same kind twice within 90 s, max 20 an hour"""
        h = self.st.setdefault("ideias", [])
        if cat == "opening" and any(c == "opening" for c, _ in h): return False  # once per live: the first time in
        if any(c == cat and abs(x - t) < 90 for c, x in h) or sum(1 for _, x in h if t - x < 3600) >= 20: return False
        h.append([cat, t]); self.save(); return True

    def first_job(self, segs, t, label, e, ideia=""):
        a0 = max(t - C.PRE_DEFAULT, segs[0][1]); b0 = min(t + 60, segs[-1][2])
        raw = os.path.join(self.od, f"first_{int(t)}_raw.mp4")
        if not C.cut_segments(segs, a0, b0, raw): return
        t_rec0 = self.meta.get("t_rec0") or 0
        job = {"raw": raw, "short": os.path.join(self.od, f"first_{int(t)}_short.mp4"), "hook": "", "credit": "@" + self.ch,
               "lang": self.meta.get("lang"), "kind": "first", "at": t, "peak": t - a0, "channel": self.ch, "url": self.meta.get("url", ""),
               "score": 50.0 if label else IDEA_SCORE.get(ideia, 4.0), "title": self.meta.get("title", ""), "force_first": label,
               "ideia": ideia or (e.get("category") if label else ""), "rec_started": t_rec0,
               "live_started": self.meta.get("live_started"),
               "chat": [(round(ct - a0, 2), m) for ct, cat, m in self.chat(a0, b0) if cat != "plain"]}
        with open(os.path.join(C.QUEUE, f"{int(time.time() * 1000)}_{self.ch}_first.json"), "w", encoding="utf-8") as f: json.dump(job, f)
        print(f"[diary] {self.ch}: {label or ideia} at {t:.0f}s ({e.get('evidence', '')[:60]}) -> queued", flush=True)


def _lines(ws, gap=1.0):
    grp = [ws[0]]
    for x in ws[1:]:
        if x[0] - grp[-1][1] > gap or len(grp) >= 25: yield grp[0][0], grp; grp = [x]
        else: grp.append(x)
    yield grp[0][0], grp


class Matcher:
    """the same game lines heard in 2+ streams -> one 'same moment' clip"""
    def __init__(self): self.idx = {}; self.done = set()

    def add(self, live, ws):
        t0 = live.meta.get("t_rec0") or 0
        for g, t in extras.grams(ws, n=6).items():
            self.idx.setdefault(g, []).append((live, t, t0 + t))
        self.check()

    def check(self):
        now = time.time(); pairs = {}
        for g, hits in self.idx.items():
            hits[:] = [h for h in hits if now - h[2] < 3300]  # only what is still on disk (the last hour)
            chans = {}
            for h in hits: chans.setdefault(h[0].ch, h)
            if len(chans) < 2: continue
            for a in chans.values():
                for b in chans.values():
                    if a[0].ch < b[0].ch: pairs.setdefault((a[0].ch, b[0].ch), []).append((a, b))
        groups = {}
        for (ca, cb), ms in pairs.items():
            offs = sorted(round(a[2] - b[2]) for a, b in ms)
            if len(ms) >= 2 and offs[-1] - offs[0] <= 5:  # 2+ lines at the same offset = the same scene
                a, b = min(ms, key=lambda m: m[0][1])
                groups.setdefault(ca, {ca: a}); groups[ca][cb] = b
        for ca, members in groups.items():
            key = "|".join(sorted(members)) + "|" + str(int(min(m[2] for m in members.values()) // 600))
            if key in self.done: continue
            self.done.add(key)
            try: render_same(list(members.values())[:4])
            except Exception as e: print("[diary] same moment failed:", e, flush=True)


def render_same(hits):
    """each streamer's piece (12 s before the shared line, 14 after) from his last hour, made vertical, then side by side"""
    picks = []
    for live, t, wall in hits:
        segs = seg_times(live.meta)
        raw = os.path.join(live.od, f"same_{int(t)}_raw.mp4")
        a0 = max(t - 12, segs[0][1])
        if not C.cut_segments(segs, a0, t + 14, raw): return
        lay = layout.detect(raw, live.ch)
        if lay.get("mode") == "ad": return
        base, _ = (("[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920[st]", 0)
                   if lay.get("H", 0) > lay.get("W", 1) else layout.filters(lay))
        panel = raw.replace("_raw.mp4", "_panel.mp4")
        C.run_v(lambda ff, v: [ff, "-y", "-loglevel", "error", "-i", raw, "-filter_complex", base + ";[st]null[v]", "-map", "[v]",
                               "-map", "0:a", *v, "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", panel], 20, 4)
        picks.append(({"_clip": panel, "channel": live.ch, "score": 0, "dur": C.duration(panel),
                       "game": C.title_game(live.meta.get("title"))}, t - a0))
    if len(picks) >= 2:
        out = extras.render_grid(picks, min(10.0, *[x for _, x in picks]), 13.0, "")
        print("[diary] SAME MOMENT ->", out, flush=True)


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--until", default="2026-11-20 04:00"); g = ap.parse_args()
    end = datetime.strptime(g.until, "%Y-%m-%d %H:%M")
    lives, matcher = {}, Matcher()
    while datetime.now() < end:
        busy = False
        for m in glob.glob(os.path.join(C.OUT, "*_2*", "meta.json")):
            od = os.path.dirname(m)
            if time.time() - os.path.getmtime(m) > 4000: continue  # a live that ended over an hour ago
            try:
                if od not in lives: lives[od] = Live(od)
                busy |= lives[od].step(matcher)
            except Exception as e:
                print(f"[diary] {os.path.basename(od)}: {type(e).__name__}: {e}", flush=True)
        for m in glob.glob(os.path.join(C.OUT, "*_2*", "meta.json")):  # a live over for 70+ min: its pieces go
            sd = os.path.join(os.path.dirname(m), "seg")
            if os.path.isdir(sd) and time.time() - os.path.getmtime(m) > 4200:
                import shutil; shutil.rmtree(sd, ignore_errors=True); lives.pop(os.path.dirname(m), None)
        if not busy: time.sleep(15)
    print("until reached", flush=True)


if __name__ == "__main__":
    main()
