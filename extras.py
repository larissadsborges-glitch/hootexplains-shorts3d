"""
(owner 17 Nov: "do all of them, those ideas are perfect") the formats only we can make, because we record many
streamers at once. Both read the fact sheets (<clip>.json) the editor writes next to every finished clip.

  python extras.py resumo  --channel ishowspeed [--date 2026-11-19]
      "ISHOWSPEED'S GTA 6 DAY 1 IN 60 SECONDS": the day's best 6 moments, each from just before its payoff to just
      after, one after the other.
  python extras.py mesmo   [--hours 6]
      "SAME MOMENT": when 2-4 streamers reach the SAME scene (the game characters' lines match word for word in their
      transcripts), their clips side by side, in sync on that line.
(owner 17 Nov: "during the day only the single clips, with context; the JOINING is done only at the end of the day,
and then I decide") every joined format goes to <OUT>/fim_do_dia/<day>/ with a .txt, never to prontos, and the
owner gets ONE notice when the day's batch is ready (05:00). The same moment is rendered when the diary finds it (the
video is only on disk for an hour) but it also waits in fim_do_dia.
"""
import argparse, glob, json, os, re, subprocess, sys
from datetime import datetime, timedelta

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import clipper as C

FONT = "C\\:/Windows/Fonts/ariblk.ttf"


def day_label(now=None):
    """the 'day' a batch belongs to: up to 06:00 still counts as the day before (US lives end late)"""
    return ((now or datetime.now()) - timedelta(hours=6)).strftime("%Y-%m-%d")


def fim_dir(day=None):
    d = os.path.join(C.OUT, "fim_do_dia", day or day_label()); os.makedirs(d, exist_ok=True); return d


def sheets(hours=None, channel=None, date=None):
    out = []
    for p in (glob.glob(os.path.join(C.OUT, "prontos", "*", "*.json")) + glob.glob(os.path.join(C.OUT, "rever", "*", "*.json"))
              + glob.glob(os.path.join(C.OUT, "por_ideia", "*", "*", "*.json"))):
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


NOGTA_TAGS = {"en": "#twitchclips #streamer #gaming #funny", "pt": "#clipes #twitchbrasil #streamer #gaming",
              "es": "#clips #twitch #streamer #gaming"}


def tags(lang, gta):
    """(owner rule: a title/hashtag says GTA only when it is true) the GTA tags only for GTA clips"""
    return (C.TAGS if gta else NOGTA_TAGS).get(lang, (C.TAGS if gta else NOGTA_TAGS)["en"])


def is_gta(d):
    return (d.get("game") or "") in ("gta6", "gta")


def write_post(base, title, caption_lines, kind, extra):
    with open(base + ".txt", "w", encoding="utf-8") as f:
        f.write(f"TÍTULO: {title}\n\nLEGENDA:\n{title}\n" + "\n".join(caption_lines) + "\n")
    with open(base + ".json", "w", encoding="utf-8") as f:
        json.dump({"kind": kind, "title": title, "made": datetime.now().isoformat(timespec="seconds"), **extra}, f, ensure_ascii=False)


# ------------------------------------------------------------------ the day in 60 seconds
def resumo(channel, date=None, n=6, before=7.0, after=4.0, hours=24):
    date = date or day_label()
    ds = [d for d in sheets(channel=channel, hours=hours) if d.get("makes_sense") and d.get("payoff_t") is not None]
    ds = sorted(ds, key=lambda d: -(d.get("score") or 0))[:n]
    if len(ds) < 3: print(f"resumo {channel} {date}: only {len(ds)} clips, skipped"); return None
    ds.sort(key=lambda d: d["_made"])  # in the order they happened
    lang = ds[0].get("lang", "en"); who = C.display(channel)
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
        parts.append(f"[{i}:v]setpts=PTS-STARTPTS,fps=60,scale=1080:1920,setsar=1[v{i}];[{i}:a]asetpts=PTS-STARTPTS,aresample=48000,"
                     f"afade=t=in:d=0.05,afade=t=out:st={max(0.0, b - a - 0.08):.2f}:d=0.08[a{i}]")
    cat = "".join(f"[v{i}][a{i}]" for i in range(len(ds))) + f"concat=n={len(ds)}:v=1:a=1[cv][ca]"
    # the header sits LOW (y 1450+), where the hook goes in face mode: never over a face
    box = (f"[cv]drawbox=x=0:y=1440:w=iw:h=250:color=black@0.72:t=fill:enable='lt(t,3.2)',"
           f"drawtext=fontfile='{FONT}':text='{esc(head[0])}':fontsize=64:fontcolor=white:x=(w-tw)/2:y=1470:enable='lt(t,3.2)',"
           f"drawtext=fontfile='{FONT}':text='{esc(head[1])}':fontsize=64:fontcolor=0xFFD400:x=(w-tw)/2:y=1560:enable='lt(t,3.2)'[v]")
    base = os.path.join(fim_dir(date), f"{channel}_RESUMO_DIA_{lang}")
    C.run_v(lambda ff, v: [ff, "-y", "-loglevel", "error", *ins, "-filter_complex", ";".join(parts) + ";" + cat + ";" + box,
                           "-map", "[v]", "-map", "[ca]", *v, "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k",
                           "-movflags", "+faststart", base + ".mp4"], 20, 4)
    title = f"{head[0]} {head[1]}"
    lines = [f"{i + 1}. {d.get('title') or d.get('event', '')}" for i, d in enumerate(ds)]  # (the title is in the clip's language; event is English)
    write_post(base, title, lines + [f"🎥 {channel}", tags(lang, any(is_gta(d) for d in ds))], "resumo", {"channels": channel, "lang": lang})
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
    n = len(picks); names = [C.display(d["channel"]) for d, _ in picks]
    ins, parts = [], []
    for i, (d, t) in enumerate(picks):
        ins += ["-ss", f"{t - pre:.2f}", "-t", f"{pre + post:.2f}", "-i", d["_clip"]]
        parts.append(f"[{i}:v]setpts=PTS-STARTPTS,fps=60,scale=540:960,setsar=1,"
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
    base = os.path.join(fim_dir(), f"{datetime.now():%H%M}_MESMO_MOMENTO_{'_'.join(d['channel'] for d, _ in picks)}")
    C.run_v(lambda ff, v: [ff, "-y", "-loglevel", "error", *ins, "-filter_complex", ";".join(parts) + ";" + lay + ";" + aud,
                           "-map", "[v]", "-map", "[a]", *v, "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k",
                           "-movflags", "+faststart", base + ".mp4"], 20, 4)
    game = "GTA 6" if any(d.get("game") == "gta6" for d, _ in picks) else "GTA"
    title = f"{' vs '.join(names)}: SAME MOMENT IN {game}"
    write_post(base, title, [f"🎥 {', '.join(d['channel'] for d, _ in picks)}", "#gta6 #gtavi #twitchclips #gaming"], "mesmo",
               {"channels": ",".join(d["channel"] for d, _ in picks), "line": line})
    print("mesmo ->", base + ".mp4"); return base + ".mp4"


def auto():
    """(run by the watcher every round) once a day, from 05:00: the end-of-day batch for the day that just ended"""
    now = datetime.now(); day = day_label(now)
    p = os.path.join(C.OUT, "fim_do_dia", "feitos.json")
    try: done = json.load(open(p, encoding="utf-8"))
    except (OSError, ValueError): done = []
    if now.hour < 5 or day in done: return
    fim_do_dia(day)
    done.append(day); os.makedirs(os.path.dirname(p), exist_ok=True); json.dump(done, open(p, "w", encoding="utf-8"))


def fim_do_dia(day=None):
    """the joined formats of the day -> fim_do_dia/<day>/, then ONE notice to the owner, who picks what to post"""
    day = day or day_label(); made = []
    by = {}
    for d in sheets(hours=24):
        if d.get("makes_sense"): by.setdefault(d["channel"], []).append(d)
    for ch, ds in by.items():
        if len(ds) >= 3:
            try: made.append(resumo(ch, day))
            except Exception as e: print("resumo failed", ch, e)
    for fn in FIM_EXTRA:  # the formats added later (deaths, race, top 5)
        try: made += fn(day) or []
        except Exception as e: print(fn.__name__, "failed", e)
    vids = sorted(glob.glob(os.path.join(fim_dir(day), "*.mp4")))
    if vids:
        with open(os.path.join(C.OUT, "avisos.jsonl"), "a", encoding="utf-8") as f:
            f.write(json.dumps({"fim_do_dia": fim_dir(day), "videos": vids, "title": f"Fim do dia {day}: {len(vids)} vídeos para escolheres",
                                "score": 99, "channel": "", "clip": ""}, ensure_ascii=False) + "\n")
    print(f"fim do dia {day}: {len(vids)} videos")


# ------------------------------------------------------------------ the 3 end-of-day formats (owner OK 17 Nov)
def card_video(lines, out, secs=2.8, rows=None, sub=None, lang="en"):
    """a title card (PIL picture -> a few seconds of video with silent audio), the look of marca/exemplos_formatos.png"""
    from PIL import Image, ImageDraw, ImageFont
    blk = "C:/Windows/Fonts/ariblk.ttf"; YEL = (255, 212, 0)
    im = Image.new("RGB", (1080, 1920), (14, 12, 30)); d = ImageDraw.Draw(im); y = 330
    for i, t in enumerate(lines):
        f = ImageFont.truetype(blk, 76); w = d.textlength(t, font=f)
        d.text(((1080 - w) / 2, y), t, font=f, fill=YEL if i == len(lines) - 1 else (255, 255, 255)); y += 100
    if rows:
        y += 120; f = ImageFont.truetype(blk, 56)
        for i, (name, lab) in enumerate(rows):
            d.rounded_rectangle([90, y, 990, y + 150], radius=24, fill=(32, 28, 60))
            d.text((120, y + 42), f"{i + 1}.", font=f, fill=YEL); d.text((210, y + 42), name, font=f, fill=(255, 255, 255))
            w = d.textlength(lab, font=f); d.text((960 - w, y + 44), lab, font=f, fill=YEL if i == 0 else (200, 200, 220)); y += 185
    if sub:
        f = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 40); w = d.textlength(sub, font=f); d.text(((1080 - w) / 2, 1560), sub, font=f, fill=(170, 170, 200))
    wm = C.page_handle(lang)  # (18 Nov: the PT card carried the EN page handle)
    if wm:
        f = ImageFont.truetype(blk, 40); w = d.textlength(wm, font=f); d.text(((1080 - w) / 2, 1760), wm, font=f, fill=(150, 150, 180))
    png = out + ".png"; im.save(png)
    C.run_v(lambda ff, v: [ff, "-y", "-loglevel", "error", "-loop", "1", "-t", f"{secs}", "-i", png, "-f", "lavfi", "-t", f"{secs}",
                           "-i", "anullsrc=r=48000:cl=stereo", "-vf", "fps=60,format=yuv420p", *v, "-c:a", "aac", "-shortest", out], 20, 4)
    os.remove(png); return out


def montage(pieces, base, head=None, tags=None, card=None):
    """pieces: [(sheet, a, b)] from finished clips; tags: per piece (text, y-or-None) drawn the whole piece; head: the
    low band (l1, l2) over the first 3 s; card: a title-card video to open with"""
    ins, parts, n0 = [], [], 0
    if card: ins += ["-i", card]; parts.append("[0:v]setpts=PTS-STARTPTS,fps=60,scale=1080:1920,setsar=1[v0];[0:a]asetpts=PTS-STARTPTS,aresample=48000[a0]"); n0 = 1
    for i, (d, a, b) in enumerate(pieces):
        k = i + n0; ins += ["-ss", f"{a:.2f}", "-t", f"{b - a:.2f}", "-i", d["_clip"]]
        tag = ""
        if tags and tags[i]:
            txt, y = tags[i]
            tag = f",drawtext=fontfile='{FONT}':text='{esc(txt)}':fontsize=56:fontcolor=white:x=40:y={y + 14}:box=1:boxcolor=0xFF2D46@1:boxborderw=16"  # (the box fits the text)
        parts.append(f"[{k}:v]setpts=PTS-STARTPTS,fps=60,scale=1080:1920,setsar=1{tag}[v{k}];[{k}:a]asetpts=PTS-STARTPTS,aresample=48000,"
                     f"afade=t=in:d=0.05,afade=t=out:st={max(0.0, b - a - 0.08):.2f}:d=0.08[a{k}]")
    n = len(pieces) + n0
    cat = "".join(f"[v{i}][a{i}]" for i in range(n)) + f"concat=n={n}:v=1:a=1[cv][ca]"
    if head:
        st = 0 if not card else 0  # the band shows on the first piece (after the card if any)
        box = (f"[cv]drawbox=x=0:y=1440:w=iw:h=250:color=black@0.72:t=fill:enable='lt(t,3.2)',"
               f"drawtext=fontfile='{FONT}':text='{esc(head[0])}':fontsize=64:fontcolor=white:x=(w-tw)/2:y=1470:enable='lt(t,3.2)',"
               f"drawtext=fontfile='{FONT}':text='{esc(head[1])}':fontsize=64:fontcolor=0xFFD400:x=(w-tw)/2:y=1560:enable='lt(t,3.2)'[v]")
    else:
        box = "[cv]null[v]"
    C.run_v(lambda ff, v: [ff, "-y", "-loglevel", "error", *ins, "-filter_complex", ";".join(parts) + ";" + cat + ";" + box,
                           "-map", "[v]", "-map", "[ca]", *v, "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k",
                           "-movflags", "+faststart", base + ".mp4"], 20, 4)
    return base + ".mp4"


def tag_y(d):
    """the counter/rank sits in the top-left of the GAME (split) or the top-left corner (face): never on the face"""
    return (d.get("game_top") or 700) + 20 if d.get("mode") == "split" else 40


def mortes(day):
    """1. EVERY DEATH of a streamer that day, one after the other, with a counter"""
    out = []
    by = {}
    for d in sheets(hours=24):
        if d.get("ideia") == "death" and d.get("payoff_t") is not None and d.get("game") == "gta6": by.setdefault(d["channel"], []).append(d)
    for ch, ds in by.items():
        if len(ds) < 3: continue
        ds.sort(key=lambda d: d["_made"]); lang = ds[0].get("lang", "en"); who = C.display(ch); N = len(ds)
        word = {"pt": "MORTE", "es": "MUERTE"}.get(lang, "DEATH")
        head = {"pt": (f"TODAS AS MORTES DO {who}", "GTA 6"), "es": (f"TODAS LAS MUERTES DE {who}", "GTA 6")}.get(lang, (f"EVERY {who} DEATH", "GTA 6"))
        pieces = [(d, max(0.0, d["payoff_t"] - 5), min(d["dur"], d["payoff_t"] + 3)) for d in ds]
        base = os.path.join(fim_dir(day), f"{ch}_TODAS_AS_MORTES_{lang}")
        montage(pieces, base, head, [(f"{word} {i + 1}/{N}", tag_y(d)) for i, (d, _, _) in enumerate(pieces)])
        write_post(base, f"{head[0]} ({N})", [f"🎥 {ch}", C.TAGS.get(lang, C.TAGS["en"])], "mortes", {"channels": ch, "lang": lang})
        out.append(base + ".mp4")
    return out


def corrida(day):
    """2. THE RACE: who finished his first mission soonest after his live began"""
    best = {}
    for d in sheets(hours=24):
        if d.get("ideia") != "mission" or d.get("game") != "gta6" or d.get("payoff_t") is None or not (d.get("rec_started") and d.get("live_started") and d.get("at") is not None): continue
        el = d["rec_started"] + d["at"] - d["live_started"]
        if el > 0 and (d["channel"] not in best or el < best[d["channel"]][1]): best[d["channel"]] = (d, el)
    if len(best) < 2: return []
    rank = sorted(best.values(), key=lambda x: x[1])
    fmt = lambda e: f"{int(e // 3600)}h {int(e % 3600 // 60):02d}m" if e >= 3600 else f"{int(e // 60)}m"
    base = os.path.join(fim_dir(day), "CORRIDA_PRIMEIRA_MISSAO")
    card = card_video(["WHO BEAT THE", "FIRST MISSION", "FASTEST?"], base + "_card.mp4",
                      rows=[(C.display(d["channel"]), fmt(e)) for d, e in rank[:5]], sub="counted from the start of each live")
    pieces = [(d, max(0.0, d["payoff_t"] - 6), min(d["dur"], d["payoff_t"] + 3)) for d, _ in rank[:5]]
    montage(pieces, base, None, [(f"#{i + 1} {C.display(d['channel'])} {fmt(e)}", tag_y(d)) for i, (d, e) in enumerate(rank[:5])], card)
    os.remove(card)
    title = "WHO BEAT THE FIRST GTA 6 MISSION FASTEST? " + " vs ".join(C.display(d["channel"]) for d, _ in rank[:5])
    write_post(base, title, [f"🎥 {', '.join(d['channel'] for d, _ in rank)}", C.TAGS["en"]], "corrida", {"channels": ",".join(best)})
    return [base + ".mp4"]


def top5(day):
    """3. TOP 5 MOMENTS of the day, all streamers, #5 -> #1 (one per language page)"""
    out = []
    by = {}
    for d in sheets(hours=24):
        if d.get("makes_sense") and d.get("payoff_t") is not None and not d.get("ideia"): by.setdefault(d.get("lang", "en"), []).append(d)
    for lang, ds in by.items():
        top = []
        for d in sorted(ds, key=lambda d: -(d.get("score") or 0)):  # one per streamer first, so it is not 5 of the same
            if all(x["channel"] != d["channel"] for x in top): top.append(d)
            if len(top) == 5: break
        if len(top) < 5: top += [d for d in sorted(ds, key=lambda d: -(d.get("score") or 0)) if d not in top][:5 - len(top)]
        if len(top) < 3: continue
        top = list(reversed(top))  # countdown
        g6 = all(d.get("game") == "gta6" for d in top)  # (18 Nov: the 1st batch said "GTA 6" over Deadlock/Wordle clips) only when EVERY moment is GTA 6
        if g6: head = {"pt": ["TOP 5", "MOMENTOS DO GTA 6", "DE HOJE"], "es": ["TOP 5", "MOMENTOS DE GTA 6", "DE HOY"]}.get(lang, ["TOP 5", "GTA 6 MOMENTS", "OF THE DAY"])
        else: head = {"pt": ["TOP 5", "MOMENTOS DAS LIVES", "DE HOJE"], "es": ["TOP 5", "MOMENTOS DE LOS", "DIRECTOS DE HOY"]}.get(lang, ["TOP 5", "STREAM MOMENTS", "OF THE DAY"])
        base = os.path.join(fim_dir(day), f"TOP5_{lang}")
        card = card_video(head, base + "_card.mp4", sub=" · ".join(dict.fromkeys(d["channel"] for d in top)), lang=lang)
        pieces = [(d, max(0.0, d["payoff_t"] - 9), min(d["dur"], d["payoff_t"] + 4)) for d in top]
        montage(pieces, base, None, [(f"#{len(top) - i} {C.display(d['channel'])}", tag_y(d)) for i, d in enumerate(top)], card)
        os.remove(card)
        write_post(base, " ".join(head), [f"{len(top) - i}. {d.get('title') or d.get('event', '')} ({d['channel']})" for i, d in enumerate(top)]
                   + [tags(lang, all(is_gta(d) for d in top))], "top5", {"channels": ",".join(d["channel"] for d in top), "lang": lang})
        out.append(base + ".mp4")
    return out


FIM_EXTRA = [mortes, corrida, top5]


def main():
    ap = argparse.ArgumentParser(); sp = ap.add_subparsers(dest="cmd")
    r = sp.add_parser("resumo"); r.add_argument("--channel", required=True); r.add_argument("--date")
    m = sp.add_parser("mesmo"); m.add_argument("--hours", type=float, default=6)
    sp.add_parser("auto"); f = sp.add_parser("fim"); f.add_argument("--day")
    g = ap.parse_args()
    if g.cmd == "resumo": resumo(g.channel, g.date)
    elif g.cmd == "mesmo": mesmo(g.hours)
    elif g.cmd == "auto": auto()
    elif g.cmd == "fim": fim_do_dia(g.day)
    else: ap.print_help()


if __name__ == "__main__":
    main()
