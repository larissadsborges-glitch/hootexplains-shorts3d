"""
Offline test of the whole editor on a downloaded broadcast piece (no live needed).
  python teste_vod.py VIDEO.mp4 CHAT.rechat.json --offset 36000 --channel kaicenat --lang en --top 6 --out E:/clipper_dev/out
VIDEO: a piece of a Twitch VOD (yt-dlp --download-sections "*10:00:00-10:25:00")
CHAT:  the same VOD's chat (yt-dlp --write-subs --sub-langs rechat), --offset = where the piece starts in the VOD (s)
It finds the moments the same way the recorder does (chat bursts + loudness), cuts the same raw window around each
(pre/post as the recorder) and runs edit() on it, so new cut rules can be checked on real footage before a live.
"""
import argparse, json, os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import clipper as C
import react


def load_chat(path, offset, dur):
    d = json.load(open(path, encoding="utf-8"))
    items = d if isinstance(d, list) else d.get("comments") or d.get("data") or []
    ev = []
    for c in items:
        t = c.get("content_offset_seconds")
        if t is None: t = c.get("contentOffsetSeconds")
        if t is None: continue
        t = float(t) - offset
        if not 0 <= t <= dur: continue
        msg = c.get("message") or {}
        body = msg.get("body") if isinstance(msg, dict) else None
        if body is None:
            frags = (msg.get("fragments") if isinstance(msg, dict) else None) or c.get("fragments") or []
            body = "".join(f.get("text", "") for f in frags)
        user = ((c.get("commenter") or {}).get("display_name") or (c.get("commenter") or {}).get("login")
                or c.get("author") or str(len(ev)))
        cat, w = react.classify(body or "", set())
        ev.append((t, w, cat, user, body or ""))
    return sorted(ev)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video"); ap.add_argument("chat"); ap.add_argument("--offset", type=float, default=0)
    ap.add_argument("--channel", default=""); ap.add_argument("--lang", default="en"); ap.add_argument("--top", type=int, default=6)
    ap.add_argument("--out", default=os.path.join(HERE, "out_teste")); ap.add_argument("--title", default="")
    ap.add_argument("--only", default="", help="comma list of moment times (s) to edit instead of searching")
    g = ap.parse_args()
    os.makedirs(g.out, exist_ok=True)
    dur = C.duration(g.video)
    ev = load_chat(g.chat, g.offset, dur)
    loud = C.loudness(g.video)
    series, clips = C.chat_bins(ev, 0.0, dur)
    cands = sorted({i * 5.0 for i in C.chat_spikes(series)} | {float(i) for i in C.loud_spikes(loud)})
    scored = []
    for at in cands:
        s, why = C.score_at(at, None and 0 or 0.0, series, clips, loud)
        scored.append((s, at, why))
    if g.only: scored = [(0, float(x), {}) for x in g.only.split(",")]
    picked, emitted = [], []
    for s, at, why in sorted(scored, reverse=True):
        if any(abs(at - t) < 35 for t in emitted): continue
        emitted.append(at); picked.append((s, at, why))
        if len(picked) >= g.top: break
    print(f"{len(ev)} chat lines, {len(cands)} candidates, editing {len(picked)}", flush=True)
    pre, post = C.PRE_DEFAULT, C.POST_DEFAULT
    for n, (s, at, why) in enumerate(sorted(picked, key=lambda x: x[1]), 1):
        a0, b0 = max(0.0, at - pre), min(dur, at + post)
        raw = os.path.join(g.out, f"m{n:02d}_{int(at)}s_raw.mp4")
        ff, v = C.venc(18, 2)
        subprocess.run([ff, "-y", "-loglevel", "error", "-ss", f"{a0:.2f}", "-i", g.video, "-t", f"{b0 - a0:.2f}", *v,
                        "-c:a", "aac", "-b:a", "192k", raw], check=True)
        chat = [(round(t - a0, 2), m) for t, w, c, u, m in ev if a0 <= t <= b0 and c != "plain"]
        print(f"--- moment {n} at {at:.0f}s (score {s} {why})", flush=True)
        made = C.edit(raw, os.path.join(g.out, f"m{n:02d}_{int(at)}s.mp4"), "", "@" + g.channel, g.lang, peak=at - a0,
                      channel=g.channel, url=f"https://www.twitch.tv/{g.channel}", score=s, chat=chat, title=g.title)
        print("   ->", made, flush=True)


if __name__ == "__main__":
    main()
