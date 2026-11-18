"""
Covers (owner 17 Nov: "vai ser preciso capa para todos os vídeos"). A 1080x1920 cover for every clip: the clip's
strongest frame (the payoff), a dark band in the middle, the title big in Poppins Black with the key words yellow
(the house caption style), the @streamer tag and the page handle.
  python capa.py <clip.mp4> [<clip2.mp4> ...]   -> <clip>_capa.jpg next to each clip (reads <clip>.json)
clipper.edit() calls make() for every new clip.
"""
import json, os, re, subprocess, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
FF = r"C:\Users\borge\.hoottools\ffmpeg\ffmpeg.exe"
FONTS = os.path.join(os.path.expanduser("~"), ".hoottools", "fonts")
YEL, PINK, NAVY = (255, 210, 50), (255, 42, 140), (14, 12, 30)
STOP = set("a o os as e de do da dos das que em no na um uma pra para por com se eu ele ela the a an and of to in on is it i you he she "
           "his her my me at for this that was are be el la los las y en un una con mano cara chat velho".split())


def font(w, s): return ImageFont.truetype(os.path.join(FONTS, f"Poppins-{w}.ttf"), s)


def frame(video, t):
    out = os.path.splitext(video)[0] + "_capa_f.png"
    subprocess.run([FF, "-v", "error", "-y", "-ss", f"{max(t, 0):.2f}", "-i", video, "-frames:v", "1", out], check=True)
    im = Image.open(out).convert("RGB"); os.remove(out); return im


def wrap(d, words, f, width=960):
    lines, cur = [], []
    for w in words:
        if cur and d.textlength(" ".join(cur + [w]), font=f) > width: lines.append(cur); cur = [w]
        else: cur.append(w)
    return lines + ([cur] if cur else [])


def make(video, hook, out=None, t=None, keywords=(), streamer="", handle=""):
    """-> the cover path. t = the moment to show (default: a third of the way in)"""
    if t is None:
        try:
            d = subprocess.run([FF.replace("ffmpeg.exe", "ffprobe.exe"), "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", video],
                               capture_output=True, text=True).stdout
            t = float(d) / 3
        except ValueError: t = 3.0
    im = video if isinstance(video, Image.Image) else frame(video, t)  # (a ready 1080x1920 picture works too)
    if im.size != (1080, 1920): im = im.resize((1080, 1920))
    hook = re.sub(r"[“”\"«»]", "", hook or "").strip().upper()
    words = hook.split()
    keys = {k.lower() for k in keywords}
    if not keys:  # no AI keywords: the two longest real words
        clean = [re.sub(r"[^\w]", "", w).lower() for w in words]
        keys = set(sorted((w for w in clean if w and w not in STOP), key=len, reverse=True)[:2])
    d0 = ImageDraw.Draw(im)
    size = 128
    while True:  # the biggest size that fits in 4 lines
        f = font("Black", size); lines = wrap(d0, words, f)
        if len(lines) <= 4 or size <= 70: break
        size -= 6
    lh = int(size * 1.02); block = lh * len(lines)
    y0 = 960 - block // 2
    # dark band behind the title (soft edges), so it reads on any frame and hides the burnt-in caption word
    band = Image.new("L", (1080, 1920), 0); bd = ImageDraw.Draw(band)
    bd.rectangle([0, y0 - 90, 1080, y0 + block + 90], fill=170); band = band.filter(ImageFilter.GaussianBlur(40))
    im = Image.composite(Image.new("RGB", im.size, (0, 0, 0)), im, band)
    d = ImageDraw.Draw(im)
    for i, ln in enumerate(lines):
        y = y0 + i * lh + lh // 2; x = 540 - d.textlength(" ".join(ln), font=f) / 2
        for w in ln:
            col = YEL if re.sub(r"[^\w]", "", w).lower() in keys else (255, 255, 255)
            d.text((x + 6, y + 9), w, font=f, fill=(0, 0, 0), anchor="lm", stroke_width=10, stroke_fill=(0, 0, 0))
            d.text((x, y), w, font=f, fill=col, anchor="lm", stroke_width=10, stroke_fill=(0, 0, 0))
            x += d.textlength(w + " ", font=f)
    if streamer:  # the streamer pill above the title
        fs = font("ExtraBold", 52); tw = d.textlength(streamer, font=fs)
        d.rounded_rectangle([540 - tw / 2 - 36, y0 - 170, 540 + tw / 2 + 36, y0 - 80], radius=45, fill=PINK, outline=(255, 255, 255), width=5)
        d.text((540, y0 - 125), streamer, font=fs, fill=(255, 255, 255), anchor="mm")
    if handle:
        d.text((1050, 1860), handle, font=font("ExtraBold", 40), fill=(255, 255, 255), anchor="rm", stroke_width=5, stroke_fill=(0, 0, 0))
    out = out or os.path.splitext(video)[0] + "_capa.jpg"
    im.save(out, quality=93); return out


def from_sheet(video):
    s = json.load(open(os.path.splitext(video)[0] + ".json", encoding="utf-8"))
    try:
        sys.path.insert(0, HERE); import clipper as C
        streamer, handle = "@" + C.display(s["channel"]).lower().replace(" ", ""), C.page_handle(s.get("lang"))
    except Exception:
        streamer, handle = "@" + s["channel"], ""
    return make(video, s.get("hook") or s.get("title", ""), t=cover_t(s.get("payoff_t"), s.get("dur")), streamer=streamer)  # (handle already burnt in)


def cover_t(payoff, dur):
    """the payoff frame, but after the burnt-in title (on screen 0-3.5 s), so the cover never shows the title twice"""
    t = payoff if payoff is not None else (dur or 12) / 3
    return min(max(t, HOOK_END), max((dur or 12) - 0.5, HOOK_END))


HOOK_END = 3.8


if __name__ == "__main__":
    for v in sys.argv[1:]: print(from_sheet(v))
