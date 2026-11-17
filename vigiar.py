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
TOP = [("https://www.twitch.tv/kaicenat", "en"), ("https://www.youtube.com/@KaiCenat/live", "en"),
       ("https://www.twitch.tv/caseoh_", "en"), ("https://www.twitch.tv/lacy", "en"),
       ("https://www.twitch.tv/angryginge13", "en"),                       # UK
       ("https://www.twitch.tv/alanzoka", "pt"), ("https://www.twitch.tv/paulinholokobr", "pt"),
       ("https://www.twitch.tv/coringa", "pt"), ("https://www.youtube.com/@LOUDCoringa/live", "pt"),  # owner likes him
       ("https://www.twitch.tv/illojuan", "es"),                           # Spain
       ("https://www.twitch.tv/casimiro", "pt")]                           # reserve
MAX_LIVE = 9  # IShowSpeed + 8 (the PC recorded 8 at once in the 16 Nov rehearsal)
DETACH = 0x00000008 | 0x00000200 | 0x00004000  # detached, own process group, below-normal priority


def running(what="clipper.py"):
    """command lines of the clipper processes now running"""
    r = subprocess.run(["powershell", "-NoProfile", "-Command",
                        "Get-CimInstance Win32_Process -Filter \"Name='python.exe'\" | ForEach-Object { $_.CommandLine }"],
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    return [l for l in r.stdout.splitlines() if what in l]


def name_of(url):
    m = re.search(r"(?:twitch\.tv|kick\.com)/([A-Za-z0-9_]+)", url) or re.search(r"youtube\.com/@([A-Za-z0-9_.-]+)", url)
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
            if len(recorded) >= MAX_LIVE:
                print(f"{datetime.now():%H:%M} {name_of(u)} is live but {MAX_LIVE} are already recording", flush=True); continue
            start(["watch", u, "--minutes", mins, "--lang", l], name_of(u) + ".log"); recorded.add(name_of(u)); new.append(name_of(u))
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
