"""
(owner 17 Nov: "be the FIRST to post") waits for strong clips: the editor appends them to <OUT>/avisos.jsonl; this
script exits with code 12 and prints "AVISO: <json>" lines as soon as new ones arrive, so the assistant session that
started it sends the clip to the owner's phone and starts it again. Exit 0 at --until.
  python avisar.py --until "2026-11-20 04:00" [--lang pt]
(owner 18 Nov: "PT videos in a different chat and ES in a different chat, so I don't get lost") --lang en|pt|es: only
that page's notices, with its own read mark (avisos.lidos.<lang>), so one assistant chat per page language.
"""
import argparse, json, os, re, sys, time
from datetime import datetime

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.environ.get("CLIPPER_OUT") or r"E:\clipper"


def mine(line, lang):
    """is this notice for this chat's page language (a clip in prontos/<lang>, or an end-of-day video ending _<lang>)"""
    if not lang: return True
    try: d = json.loads(line)
    except ValueError: return False
    paths = [d.get("clip") or ""] + list(d.get("videos") or [])
    return any(re.search(rf"[\\/]{lang}[\\/]|_{lang}\.mp4$", p) for p in paths if p)


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--until", default="2026-11-20 04:00"); ap.add_argument("--wait", type=float, default=20)
    ap.add_argument("--lang", default="")
    g = ap.parse_args()
    end = datetime.strptime(g.until, "%Y-%m-%d %H:%M")
    log = os.path.join(OUT, "avisos.jsonl"); mark = os.path.join(OUT, "avisos.lidos" + (f".{g.lang}" if g.lang else ""))
    if g.lang and not os.path.exists(mark):  # a new language chat starts from now, not from the old notices
        try: n0 = len(open(log, encoding="utf-8").read().splitlines())
        except OSError: n0 = 0
        open(mark, "w").write(str(n0))
    while datetime.now() < end:
        try: done = int(open(mark).read().strip() or 0)
        except (OSError, ValueError): done = 0
        try: lines = open(log, encoding="utf-8").read().splitlines()
        except OSError: lines = []
        new = lines[done:]
        if new:
            time.sleep(g.wait)  # a few seconds more: clips that finish together go in one message
            lines = open(log, encoding="utf-8").read().splitlines(); new = lines[done:]
            open(mark, "w").write(str(len(lines)))
            new = [ln for ln in new if mine(ln, g.lang)]
            if not new: continue
            for ln in new: print("AVISO: " + ln, flush=True)
            sys.exit(12)
        time.sleep(15)
    print("until reached", flush=True)


if __name__ == "__main__":
    main()
