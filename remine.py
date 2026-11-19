"""
(owner 19 Nov 01:10: "Tens mais clipes?" - and 18 Nov: "usa o que já tem de gravado", "não elimines as gravações")
Reads FINISHED recordings with the diary (transcribe everything + the AI lists what happened) and queues a clip job per
event, like the live diary does - but without the diary's clean-up (it deletes the pieces of lives over 70 min) and
without the "same moment" grids.
  python remine.py <session folder> [<session folder> ...]
Then the editor (clipper.py worker --only en) makes the clips.
"""
import os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
os.environ.setdefault("DIARIO_GAMES", "gta6,gta,")  # (launch day: every one of these lives was GTA 6, whatever the title says)
import diario


class NoMatch:
    def add(self, live, ws): pass


def main(folders):
    for od in folders:
        live = diario.Live(od)
        n = len(diario.seg_times(live.meta))
        print(f"[remine] {os.path.basename(od)}: {n} pieces, from {live.st['k']}", flush=True)
        while live.step(NoMatch()):
            pass
        if live.st["upto"] > live.st["scanned"]: live.scan(diario.seg_times(live.meta))  # the last few minutes
        print(f"[remine] {os.path.basename(od)} done", flush=True)


if __name__ == "__main__":
    main(sys.argv[1:])
