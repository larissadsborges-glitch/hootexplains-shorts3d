"""
(owner 17 Nov: "be the FIRST to post") waits for strong clips: the editor appends them to <OUT>/avisos.jsonl; this
script exits with code 12 and prints "AVISO: <json>" lines as soon as new ones arrive, so the assistant session that
started it sends the clip to the owner's phone and starts it again. Exit 0 at --until.
  python avisar.py --until "2026-11-20 04:00"
"""
import argparse, json, os, sys, time
from datetime import datetime

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.environ.get("CLIPPER_OUT") or r"E:\clipper"


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--until", default="2026-11-20 04:00"); ap.add_argument("--wait", type=float, default=20)
    g = ap.parse_args()
    end = datetime.strptime(g.until, "%Y-%m-%d %H:%M")
    log = os.path.join(OUT, "avisos.jsonl"); mark = os.path.join(OUT, "avisos.lidos")
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
            for ln in new: print("AVISO: " + ln, flush=True)
            sys.exit(12)
        time.sleep(15)
    print("until reached", flush=True)


if __name__ == "__main__":
    main()
