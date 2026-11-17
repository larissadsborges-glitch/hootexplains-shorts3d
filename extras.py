"""
(owner 17 Nov: "do all of them, those ideas are perfect") the formats only we can make, because we record many
streamers at once. Both read the fact sheets (<clip>.json) the editor writes next to every finished clip.

  python extras.py resumo  --channel ishowspeed [--date 2026-11-19]
      "ISHOWSPEED'S GTA 6 DAY 1 IN 60 SECONDS": the day's best 6 moments, each from just before its payoff to just
      after, one after the other.
  python extras.py mesmo   [--hours 6]
      "SAME MOMENT": when 2-4 streamers reach the SAME scene (the game characters' lines match word for word in their
      transcripts), their clips side by side, in sync on that line.
Outputs go to <OUT>/prontos/<lang>/ with a .txt (title + caption) like every clip, and strong ones go to avisos.jsonl.
"""
import argparse, glob, json, os, re, subprocess, sys
from datetime import datetime, timedelta

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import clipper as C

FONT = "C\\:/Windows/Fonts/ariblk.ttf"


def sheets(hours=None, channel=None, date=None):
    out = []
    for p in glob.glob(os.path.join(C.OUT, "prontos", "*", "*.json")) + glob.glob(os.path.join(C.OUT, "rever", "*", "*.json")):
        try: d = json.load(open(p, encoding="utf-8"))
        except (OSError, ValueError): continue
        if d.get("kind") in ("resumo", "mesmo"): continue
        made = datetime.fromisoformat(d.get("made", "2000-01-01T00:00:00"))
        if hours and made < datetime.now() - timedelta(hours=hours): continue
        if channel and (d.get("channel") or "").lower().lstrip("@") != channel.lower().lstrip("@"): continue
        if date and made.strftime("%Y-%m-%d") != date: continue
        d["_clip"] = p[:-5] + ".mp4"; d["_made"] = made
        if os.path.exists(d["_clip"]): out.append(d)
    return out


def esc(t):
    return t.replace("\\", "\\\\").replace(":", "\\:").replace("'", "’").replace("%", "\\%")


def write_post(base, title, caption_lines, kind, extra):
    with open(base + ".txt", "w", encoding="utf-8") as f:
        f.write(f"TÍTULO: {title}\n\nLEGENDA:\n{title}\n" + "\n".join(caption_lines) + "\n")
    with open(base + ".json", "w", encoding="utf-8") as f:
        json.dump({"kind": kind, "title": title, "made": datetime.now().isoformat(timespec="seconds"), **extra}, f, ensure_ascii=False)
    with open(os.path.join(C.OUT, "avisos.jsonl"), "a", encoding="utf-8") as f:
        f.write(json.dumps({"clip": base + ".mp4", "title": title, "channel": extra.get("channels", ""), "score": 99, "first": kind}, ensure_ascii=False) + "\n")


# ------------------------------------------------------------------ the day in 60 seconds
def resumo(channel, date=None, n=6, before=7.0, after=4.0):
    date = date or datetime.now().strftime("%Y-%m-%d")
    ds = [d for d in sheets(channel=channel, date=date) if d.get("makes_sense") and d.get("payoff_t") is not None]
    ds = sorted(ds, key=lambda d: -(d.get("score") or 0))[:n]
    if len(ds) < 3: print(f"resumo {channel} {date}: only {len(ds)} clips, skipped"); return None
    ds.sort(key=lambda d: d["_made"])  # in the order they happened
    lang = ds[0].get("lang", "en"); who = channel.upper().rstrip("_")
    gta6 = any(d.get("game") == "gta6" for d in ds)
    day = 1
    try:
        m = json.load(open(os.path.join(C.OUT, "marcos.json"), encoding="utf-8")).get(channel, {})
        if date in m.get("days", []): day = m["days"].index(date) + 1
    except (OSError, ValueError): pass
    head = {"en": (f"{who}'S GTA 6 DAY {day}" if gta6 else f"{who} TODAY", "IN 60 SECONDS"),
            "pt": (f"DIA {day} DO {who} NO GTA 6" if gta6 else f"{who} HOJE", "EM 60 SEGUNDOS"),
            "es": (f"DÍA {day} DE {who} EN GTA 6" if gta6 else f"{who} HOY", "EN 60 SEGUNDOS")}.get(lang)
    ins, parts = [], []
    for i, d in enumerate(ds):
        a = max(0.0, d["payoff_t"] - before); b = min(d["dur"], d["payoff_t"] + after)
        ins += ["-ss", f"{a:.2f}", "-t", f"{b - a:.2f}", "-i", d["_clip"]]
        parts.append(f"[{i}:v]setpts=PTS-STARTPTS,fps=30,scale=1080:1920,setsar=1[v{i}];[{i}:a]asetpts=PTS-STARTPTS,aresample=48000,"
                     f"afade=t=in:d=0.05,afade=t=out:st={max(0.0, b - a - 0.08):.2f}:d=0.08[a{i}]")
    cat = "".join(f"[v{i}][a{i}]" for i in range(len(ds))) + f"concat=n={len(ds)}:v=1:a=1[cv][ca]"
    # the header sits LOW (y 1450+), where the hook goes in face mode: never over a face
    box = (f"[cv]drawbox=x=0:y=1440:w=iw:h=250:color=black@0.72:t=fill:enable='lt(t,3.2)',"
           f"drawtext=fontfile='{FONT}':text='{esc(head[0])}':fontsize=64:fontcolor=white:x=(w-tw)/2:y=1470:enable='lt(t,3.2)',"
           f"drawtext=fontfile='{FONT}':text='{esc(head[1])}':fontsize=64:fontcolor=0xFFD400:x=(w-tw)/2:y=1560:enable='lt(t,3.2)'[v]")
    fd = os.path.join(C.OUT, "prontos", lang); os.makedirs(fd, exist_ok=True)
    base = os.path.join(fd, f"{date.replace('-', '')[4:]}_{channel}_RESUMO_DIA")
    C.run_v(lambda ff, v: [ff, "-y", "-loglevel", "error", *ins, "-filter_complex", ";".join(parts) + ";" + cat + ";" + box,
                           "-map", "[v]", "-map", "[ca]", *v, "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k",
                           "-movflags", "+faststart", base + ".mp4"], 20, 4)
    title = f"{head[0]} {head[1]}"
    lines = [f"{i + 1}. {d.get('event') or d.get('title', '')}" for i, d in enumerate(ds)]
    write_post(base, title, lines + [f"🎥 {channel}", C.TAGS.get(lang, C.TAGS["en"])], "resumo", {"channels": channel, "lang": lang})
    print("resumo ->", base + ".mp4"); return base + ".mp4"


# ------------------------------------------------------------------ the same moment, several streamers
STOP = set("the and you that this with what have just like your they them there here about would could from were been".split())


def grams(words, n=5):
    """distinctive 5-word runs of a transcript (game characters' lines repeat word for word across streams) -> {gram: t}"""
    toks = [(s, re.sub(r"[^a-z0-9']", "", w.lower())) for s, e, w in words]
    toks = [(s, w) for s, w in toks if w and "*" not in w]
    out = {}
    for i in range(len(toks) - n + 1):
        g = tuple(w for _, w in toks[i:i + n])
        if sum(1 for w in g if len(w) >= 4 and w not in STOP) >= 3 and g not in out: out[g] = toks[i][0]
    return out


def mesmo(hours=6, before=8.0, after=12.0):
    ds = [d for d in sheets(hours=hours) if d.get("game") and d.get("words")]
    done_p = os.path.join(C.OUT, "mesmo_feitos.json")
    try: done = set(json.load(open(done_p, encoding="utf-8")))
    except (OSError, ValueError): done = set()
    g_of = [grams(d["words"]) for d in ds]
    groups = {}  # gram -> {channel: (sheet, t)}
    for i, d in enumerate(ds):
        for g, t in g_of[i].items():
            groups.setdefault(g, {})
            cur = groups[g].get(d["channel"])
            if cur is None or (d.get("score") or 0) > (cur[0].get("score") or 0): groups[g][d["channel"]] = (d, t)
    made = []
    seen_sets = set()
    for g, by in sorted(groups.items(), key=lambda kv: -len(kv[1])):
        if len(by) < 2: continue
        picks = sorted(by.values(), key=lambda x: -(x[0].get("score") or 0))[:4]
        key = "|".join(sorted(os.path.basename(p[0]["_clip"]) for p in picks))
        if key in done or key in seen_sets: continue
        seen_sets.add(key)
        pre = min(before, *[t for _, t in picks]); post = min(after, *[d["dur"] - t for d, t in picks])
        if pre + post < 8: continue
        out = render_grid(picks, pre, post, " ".join(g))
        if out: made.append(out); done.add(key)
    json.dump(sorted(done), open(done_p, "w", encoding="utf-8"))
    print(f"mesmo: {len(made)} new"); return made


def render_grid(picks, pre, post, line):
    n = len(picks); names = [d["channel"].upper().rstrip("_") for d, _ in picks]
    ins, parts = [], []
    for i, (d, t) in enumerate(picks):
        ins += ["-ss", f"{t - pre:.2f}", "-t", f"{pre + post:.2f}", "-i", d["_clip"]]
        parts.append(f"[{i}:v]setpts=PTS-STARTPTS,fps=30,scale=540:960,setsar=1,"
                     f"drawbox=x=0:y=0:w=iw:h=64:color=black@0.7:t=fill,"
                     f"drawtext=fontfile='{FONT}':text='{esc(names[i])}':fontsize=40:fontcolor=0xFFD400:x=(w-tw)/2:y=12[p{i}]")
    if n == 2:  # side by side in the middle, the title above
        lay = (f"color=c=0x0E0C1E:s=1080x1920:d={pre + post:.2f}[bg];[bg][p0]overlay=0:520[b1];[b1][p1]overlay=540:520,"
               f"drawtext=fontfile='{FONT}':text='SAME MOMENT':fontsize=96:fontcolor=white:x=(w-tw)/2:y=250,"
               f"drawtext=fontfile='{FONT}':text='{esc(' vs '.join(names))}':fontsize=56:fontcolor=0xFFD400:x=(w-tw)/2:y=380[v]")
    else:  # 2 x 2
        slots = [(0, 0), (540, 0), (0, 960), (540, 960)]
        lay = f"color=c=0x0E0C1E:s=1080x1920:d={pre + post:.2f}[bg]"; prev = "bg"
        for i in range(n):
            lay += f";[{prev}][p{i}]overlay={slots[i][0]}:{slots[i][1]}[o{i}]"; prev = f"o{i}"
        lay += f";[{prev}]" + ("" if n == 4 else f"drawtext=fontfile='{FONT}':text='SAME':fontsize=90:fontcolor=white:x=540+(540-tw)/2:y=1300,"
                                                f"drawtext=fontfile='{FONT}':text='MOMENT':fontsize=90:fontcolor=0xFFD400:x=540+(540-tw)/2:y=1420,") + "null[v]"
    aud = "".join(f"[{i}:a]" for i in range(n)) + f"amix=inputs={n}:normalize=1,loudnorm=I=-14:TP=-1.5:LRA=11[a]"
    fd = os.path.join(C.OUT, "prontos", "en"); os.makedirs(fd, exist_ok=True)
    base = os.path.join(fd, f"{datetime.now():%m%d_%H%M}_MESMO_MOMENTO_{'_'.join(d['channel'] for d, _ in picks)}")
    C.run_v(lambda ff, v: [ff, "-y", "-loglevel", "error", *ins, "-filter_complex", ";".join(parts) + ";" + lay + ";" + aud,
                           "-map", "[v]", "-map", "[a]", *v, "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k",
                           "-movflags", "+faststart", base + ".mp4"], 20, 4)
    game = "GTA 6" if any(d.get("game") == "gta6" for d, _ in picks) else "GTA"
    title = f"{' vs '.join(names)}: SAME MOMENT IN {game}"
    write_post(base, title, [f"🎥 {', '.join(d['channel'] for d, _ in picks)}", "#gta6 #gtavi #twitchclips #gaming"], "mesmo",
               {"channels": ",".join(d["channel"] for d, _ in picks), "line": line})
    print("mesmo ->", base + ".mp4"); return base + ".mp4"


def auto(quiet_min=45):
    """(run by the watcher every round) the day recap of every streamer who has been quiet for quiet_min minutes
    (no new clip: the live ended or calmed down), made again when 4+ new clips came since; then the same-moment search"""
    today = datetime.now().strftime("%Y-%m-%d")
    p = os.path.join(C.OUT, "resumos_feitos.json")
    try: done = json.load(open(p, encoding="utf-8"))
    except (OSError, ValueError): done = {}
    by = {}
    for d in sheets(date=today):
        if d.get("makes_sense"): by.setdefault(d["channel"], []).append(d)
    for ch, ds in by.items():
        last = max(d["_made"] for d in ds); key = f"{ch}|{today}"
        if len(ds) >= 3 and last < datetime.now() - timedelta(minutes=quiet_min) and len(ds) - done.get(key, 0) >= (4 if key in done else 3):
            try:
                if resumo(ch, today): done[key] = len(ds)
            except Exception as e: print("resumo failed", ch, e)
    json.dump(done, open(p, "w", encoding="utf-8"))
    # (the same moment now comes from the live diary - diario.py - which has every streamer's whole hour, not only clips)


def main():
    ap = argparse.ArgumentParser(); sp = ap.add_subparsers(dest="cmd")
    r = sp.add_parser("resumo"); r.add_argument("--channel", required=True); r.add_argument("--date")
    m = sp.add_parser("mesmo"); m.add_argument("--hours", type=float, default=6)
    sp.add_parser("auto")
    g = ap.parse_args()
    if g.cmd == "resumo": resumo(g.channel, g.date)
    elif g.cmd == "mesmo": mesmo(g.hours)
    elif g.cmd == "auto": auto()
    else: ap.print_help()


if __name__ == "__main__":
    main()
