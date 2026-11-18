"""
(owner 18 Nov: "tudo que seja da página inglesa podes postar tudo sozinho ... se vir que é muito bom, publica logo")
Gets a finished EN clip ready for vidIQ posting (Instagram + TikTok + YouTube on Stream Went Wild):
  python postar.py <E:/clipper/prontos/en/clip.mp4>
  1. posts/<name>_post.mp4: the cover (<clip>_capa.jpg) as the first 3 frames, because the posting API has no cover field
  2. posts/<name>_post.json: the captions (Instagram/TikTok text, YouTube title + description), true facts only
  3. commits it and pushes it to the public branch `clipper`, prints the raw URL for vidiq_video_upload
The posting itself (vidiq draft + publish) is done by the assistant, who checks the clip first.
"""
import json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import clipper as C

POSTS = os.path.join(HERE, "posts")
RAW = "https://raw.githubusercontent.com/larissadsborges-glitch/hootexplains-shorts3d/clipper/posts/"
FF = r"C:\Users\borge\.hoottools\ffmpeg\ffmpeg.exe"


NAMES = {"caseoh_": "CaseOh", "ishowspeed": "IShowSpeed", "kaicenat": "Kai Cenat", "lacy": "Lacy", "angryginge13": "Angry Ginge",
         "jasontheween": "Jason The Ween", "plaqueboymax": "PlaqueBoyMax", "theburntpeanut": "TheBurntPeanut"}


def captions(sheet):
    name = sheet.get("channel", ""); who = NAMES.get(name.lower())
    if not who: who = C.display(name); who = who.title() if who.isupper() else who
    gta = (sheet.get("game") or "") in ("gta6", "gta")
    title = re.sub(r"\s+", " ", (sheet.get("title") or "").strip())
    tag = "#" + re.sub(r"[^a-z0-9]", "", name.lower())
    tags = ("#gta6 #gtavi #gta " if gta else "") + f"{tag} #twitchclips #gaming #fyp"
    text = f"{title} 😭🔥\nWould you have done the same? 👇\n🎥 {who} live\n{tags}"
    yt_title = (title if len(title) <= 88 else title[:85].rsplit(" ", 1)[0] + "…") + " #shorts"
    yt_desc = (f"{title}\n\n🎥 {who} live. Every clip credits the streamer.\n🔔 Subscribe for the wildest GTA 6 stream moments.\n\n"
               + tags.replace(" #fyp", " #shorts"))
    return {"text": text, "yt_title": yt_title, "yt_desc": yt_desc, "yt_tags": [t.lstrip("#") for t in tags.split() if t != "#fyp"] + [who]}


def main(clip):
    base = clip[:-4]; sheet = json.load(open(base + ".json", encoding="utf-8"))
    cover = base + "_capa.jpg"; name = os.path.basename(base)
    os.makedirs(POSTS, exist_ok=True); out = os.path.join(POSTS, name + "_post.mp4")
    if os.path.exists(cover):
        fc = ("[0:v]scale=1080:1920,setsar=1,fps=60,format=yuv420p[c];[1:v]scale=1080:1920,setsar=1,fps=60,format=yuv420p[v];"
              "[2:a]atrim=0:0.05[ca];[1:a]aresample=48000[a];[c][ca][v][a]concat=n=2:v=1:a=1[ov][oa]")
        cmd = [FF, "-y", "-loglevel", "error", "-loop", "1", "-t", "0.05", "-i", cover, "-i", clip,
               "-f", "lavfi", "-t", "0.05", "-i", "anullsrc=r=48000:cl=stereo", "-filter_complex", fc,
               "-map", "[ov]", "-map", "[oa]", "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-maxrate", "12M", "-bufsize", "24M",
               "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", out]
    else:
        cmd = [FF, "-y", "-loglevel", "error", "-i", clip, "-c", "copy", "-movflags", "+faststart", out]
    subprocess.run(cmd, check=True)
    if os.path.getsize(out) > 95e6: sys.exit(f"too big for GitHub: {os.path.getsize(out) / 1e6:.0f} MB")
    cap = captions(sheet); json.dump(cap, open(os.path.join(POSTS, name + "_post.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    g = lambda *a: subprocess.run(["git", "-C", HERE, *a], check=True, capture_output=True, text=True)
    g("add", "-f", out, os.path.join(POSTS, name + "_post.json"))
    g("commit", "-q", "-m", f"post copy: {name}\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>")
    g("push", "-q", "origin", "HEAD:clipper")
    print(json.dumps({"url": RAW + name + "_post.mp4", "mb": round(os.path.getsize(out) / 1e6, 1), **cap}, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main(sys.argv[1].replace("\\", "/"))
