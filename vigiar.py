"""
VIGIAR: keeps the clipper running all night on its own (owner 16 Nov: "keep doing IShowSpeed, and if someone really
famous starts streaming, start doing theirs too").

Every 5 minutes, until --until (default 04:00):
  - IShowSpeed (the main channel) always has a recorder; if his ends or crashes, a new one starts (it waits for him
    if he is offline).
  - The TOP list (only the very biggest names) is checked; whoever is live and not yet recorded gets a recorder.
    The watcher then EXITS with code 10 and prints NOVO: <name> so the session that started it can tell the owner and
    start the watcher again (the recorders keep running on their own).
  - Editors: 1 for up to 2 recorders, 2 above that (the GPU has room for 2).
Recorders and editors are separate, detached processes: they keep going if this watcher stops.

Run (Git Bash):  HF_HOME=C:/Users/borge/.hoottools/cache/hf CLIPPER_OUT=E:/clipper_teste python -I vigiar.py
"""
import argparse, json, os, re, subprocess, sys, time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta

HERE = os.path.dirname(os.path.abspath(__file__))
PY = sys.executable
MAIN = "https://www.youtube.com/@IShowSpeed/live"
# (owner 17 Nov, GTA 6 launch: "4 US, 1 UK, 2-3 Brazilians, 1 Spanish") checked 17 Nov: all streamed this month
# and most are in GTA week. Order = priority when too many are live at once. (url, caption language)
# Jynxzi, HasanAbi and Asmongold were stopped on the owner's word on 16 Nov. Twitch / YouTube only: their chat is read.
# (owner 17 Nov 23:15: "O Coringa, eu quero o Coringa. Se ele streamar o GTA, eu quero o Coringa.") he is first and is
# ALWAYS recorded when live, even when the MAX_LIVE slots are full
ALWAYS = {"coringa", "ricfazeres"}  # (owner 18 Nov: RicFazeres "para o público de Portugal")
TOP = [("https://www.twitch.tv/coringa", "pt"), ("https://www.youtube.com/@LOUDCoringa/live", "pt"),
       ("https://www.youtube.com/@RicFazeres/live", "pt"),                # Portugal (PT-PT)
       ("https://www.twitch.tv/kaicenat", "en"), ("https://www.youtube.com/@KaiCenat/live", "en"),
       ("https://www.twitch.tv/caseoh_", "en"), ("https://www.twitch.tv/lacy", "en"),
       ("https://www.twitch.tv/angryginge13", "en"),                       # UK
       ("https://www.twitch.tv/alanzoka", "pt"), ("https://www.twitch.tv/paulinholokobr", "pt"),
       ("https://www.twitch.tv/illojuan", "es"),                           # Spain
       ("https://www.twitch.tv/casimiro", "pt")]                           # reserve
MAX_LIVE = 12  # (18 Nov 11:00: offline-waiting recorders counted, Paulinho was left out)  IShowSpeed + 8 (the PC recorded 8 at once in the 16 Nov rehearsal)
# (owner 17 Nov: "catch the FIRST streamers playing GTA 6 from hour zero, followers and views from minute one") from
# 10:30 on 18 Nov (GTA 6 opens in New Zealand at 11:00 PT) the biggest live "GTA 6" streams on YouTube are found and
# recorded too, even if they are not on the list: up to 2 at a time, 3000+ people watching, the title must say GTA 6
DISCOVER_FROM = datetime(2026, 11, 18, 10, 30)
DISCOVER_MAX, DISCOVER_MIN_VIEWERS = 4, 3000  # (18 Nov 09:30 test: 6 found, one Indonesian - 4 so EN/PT/ES ones get in)


def discover():
    """-> [(channel live url, viewers, title)] the biggest live GTA 6 streams on YouTube right now"""
    out = {}
    for q in ("gta+6", "gta+vi", "grand+theft+auto+6"):
        try:
            r = subprocess.run([PY, "-m", "yt_dlp", "-q", "--no-warnings", "--flat-playlist", "-I", "1:25", "--print",
                                "%(channel_url)s\t%(concurrent_view_count)s\t%(title)s",
                                f"https://www.youtube.com/results?search_query={q}&sp=EgJAAQ%253D%253D"],
                               capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=90)
        except subprocess.TimeoutExpired:
            continue
        for ln in r.stdout.splitlines():
            parts = ln.split("\t")
            if len(parts) < 3 or not parts[0].startswith("http"): continue
            try: v = int(parts[1])
            except ValueError: continue
            if v >= DISCOVER_MIN_VIEWERS and re.search(r"gta ?(6|vi)\b|grand theft auto (6|vi)\b", parts[2], re.I):
                u = parts[0].rstrip("/") + "/live"
                if u not in out or v > out[u][0]: out[u] = (v, parts[2])
    return sorted(((u, v, t) for u, (v, t) in out.items()), key=lambda x: -x[1])
DETACH = 0x00000008 | 0x00000200 | 0x00004000  # detached, own process group, below-normal priority


def running(what="clipper.py"):
    """command lines of the clipper processes now running"""
    r = subprocess.run(["powershell", "-NoProfile", "-Command",
                        "Get-CimInstance Win32_Process -Filter \"Name='python.exe'\" | ForEach-Object { $_.CommandLine }"],
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    return [l for l in r.stdout.splitlines() if what in l]


def name_of(url):
    m = (re.search(r"(?:twitch\.tv|kick\.com)/([A-Za-z0-9_]+)", url) or re.search(r"youtube\.com/@([A-Za-z0-9_.-]+)", url)
         or re.search(r"youtube\.com/channel/([A-Za-z0-9_-]+)", url))
    n = m.group(1).lower() if m else url
    return {"loudcoringa": "coringa"}.get(n, n)  # the same person on two sites is recorded once


def is_live(url):
    try:
        r = subprocess.run([PY, "-m", "yt_dlp", "-q", "--no-warnings", "--simulate", "--print", "is_live", url],
                           capture_output=True, text=True, timeout=60)
        return "True" in r.stdout
    except subprocess.TimeoutExpired:
        return False


def start(args, log):
    os.makedirs(os.path.join(HERE, "logs"), exist_ok=True)
    out = open(os.path.join(HERE, "logs", log), "a", encoding="utf-8")
    script = "clipper.py"
    if args and args[0] == "__extras": script, args = "extras.py", args[1:]
    if args and args[0] == "__diario": script, args = "diario.py", args[1:]
    subprocess.Popen([PY, "-I", "-X", "utf8", os.path.join(HERE, script)] + args, stdout=out, stderr=subprocess.STDOUT,
                     stdin=subprocess.DEVNULL, creationflags=DETACH, cwd=HERE)


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--until", default="04:00"); ap.add_argument("--every", type=int, default=300)
    g = ap.parse_args()
    if " " in g.until:  # (GTA 6 launch, 17 Nov) a full date: --until "2026-11-20 04:00"
        end = datetime.strptime(g.until, "%Y-%m-%d %H:%M")
    else:
        hh, mm = map(int, g.until.split(":")); end = datetime.now().replace(hour=hh, minute=mm, second=0, microsecond=0)
        if end <= datetime.now(): end += timedelta(days=1)
    while datetime.now() < end:
        mins = str(int((end - datetime.now()).total_seconds() / 60))
        cmd = running()
        rec = [c for c in cmd if " watch " in c]
        recorded = {name_of(u) for c in rec for u in re.findall(r"https?://\S+", c.replace('"', ""))}
        # 1. IShowSpeed always
        if name_of(MAIN) not in recorded:
            start(["watch", MAIN, "--minutes", mins, "--lang", "en"], "ishowspeed.log"); recorded.add(name_of(MAIN))
            print(f"{datetime.now():%H:%M} IShowSpeed recorder (re)started", flush=True)
        # 2. the very famous ones who are live
        todo = [(u, l) for u, l in TOP if name_of(u) not in recorded]
        with ThreadPoolExecutor(8) as ex: live = [(u, l) for (u, l), ok in zip(todo, ex.map(lambda x: is_live(x[0]), todo)) if ok]
        new = []
        for u, l in live:  # (in TOP order: the first ones win when too many are live)
            if name_of(u) in recorded: continue  # (twitch + youtube of the same person: one is enough)
            if len(recorded) >= MAX_LIVE and name_of(u) not in ALWAYS:
                print(f"{datetime.now():%H:%M} {name_of(u)} is live but {MAX_LIVE} are already recording", flush=True); continue
            start(["watch", u, "--minutes", mins, "--lang", l], name_of(u) + ".log"); recorded.add(name_of(u)); new.append(name_of(u))
        # 2a. (from 10:30 on 18 Nov) the biggest live GTA 6 streams not on the list
        if datetime.now() >= DISCOVER_FROM:
            mine = {name_of(u) for u, _ in TOP} | {name_of(MAIN)}
            found_now = [c for c in recorded if c not in mine]
            for u, v, t in discover():
                if len(found_now) >= DISCOVER_MAX: break
                n = name_of(u)
                if n in recorded or n in mine: continue
                start(["watch", u, "--minutes", mins], n[:40] + ".log"); recorded.add(n); found_now.append(n); new.append(f"{n} ({v} a ver: {t[:50]})")
        # 2b. the AI judge (llama-server + Gemma 3, owner approved 16 Nov): start it again if it is not answering
        try:
            if HERE not in sys.path: sys.path.insert(0, HERE)  # (-I mode leaves the script's folder out)
            import ia
            if not ia.alive():
                m = os.path.expanduser(r"~\.lmstudio\models\lmstudio-community\gemma-3-4b-it-GGUF\gemma-3-4b-it-Q4_K_M.gguf")
                exe = os.path.expanduser(r"~\.hoottools\llama\bin\llama-server.exe")
                if os.path.exists(m) and os.path.exists(exe):
                    os.makedirs(os.path.join(HERE, "logs"), exist_ok=True)
                    subprocess.Popen([exe, "-m", m, "--host", "127.0.0.1", "--port", "8099", "-c", "4096", "-t", "3", "-ngl", "0", "--no-webui"],
                                     stdout=open(os.path.join(HERE, "logs", "llama.log"), "a"), stderr=subprocess.STDOUT,
                                     stdin=subprocess.DEVNULL, creationflags=DETACH)
                    print(f"{datetime.now():%H:%M} AI judge (re)started", flush=True)
        except Exception as e:
            print(f"AI judge check failed: {e}", flush=True)
        # 3. editors
        n_rec = len(recorded); want = 1 if n_rec <= 2 else 2
        have = len([c for c in running() if " worker" in c]) // 2 or len([c for c in running() if " worker" in c])
        for _ in range(max(0, want - have)): start(["worker"], "editor.log")
        print(f"{datetime.now():%H:%M} recording: {', '.join(sorted(recorded))} | editors {max(have, want)}", flush=True)
        # (owner 17 Nov ideas) a live that ended -> its day in 60 seconds; every round -> the same moment across streamers
        # (recorders stay on waiting for the live to come back, so "ended" = 45 min with no new clip: extras.py auto)
        if not running("extras.py"): start(["__extras", "auto"], "extras.log")
        # (owner 17 Nov) the live diary: everything transcribed, events, firsts, same moment across streamers
        if not running("diario.py"): start(["__diario", "--until", end.strftime("%Y-%m-%d %H:%M")], "diario.log")
        if new:
            print("NOVO: " + ", ".join(new), flush=True); sys.exit(10)
        time.sleep(g.every)
    print("until reached", flush=True)


if __name__ == "__main__":
    main()
