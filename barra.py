"""(owner 19 Nov, two example reels: "podemos fazer assim?") the title in a box on the seam between the webcam and the
game, the WHOLE clip: sentence case, bold, white on black, an emoji at the end (Speed "almost eaten by a GTA 6 alligator").
Drawn with Pillow (libass cannot draw colour emoji) and laid over the video by ffmpeg."""
import os
from PIL import Image, ImageDraw, ImageFont

FONTS = os.path.join(os.path.expanduser("~"), ".hoottools", "fonts")
EMOJI_FONT = r"C:\Windows\Fonts\seguiemj.ttf"
EMOJI = {"funny": "😭", "shock": "😱", "scary": "😱", "fail": "💀", "rage": "😡", "hype": "🔥", "skill": "🔥",
         "wholesome": "🥹", "opening": "🤯", "first": "🤯"}
TITLE_FONT = "C:/Windows/Fonts/arialbd.ttf"  # (owner 19 Nov: "quero a mesma fonte dos vídeos") the examples: Arial Bold title
W, SIZE, PAD_X, PAD_Y, GAP = 960, 60, 34, 20, 6

def is_emoji(ch):
    return ord(ch) >= 0x2190 and ch not in "—–“”‘’…"

def _runs(text):
    """the text cut into (is_emoji, piece) runs"""
    out = []
    for ch in text:
        e = is_emoji(ch) or ch in "\u200d\ufe0f"
        if out and out[-1][0] == e: out[-1][1] += ch
        else: out.append([e, ch])
    return out

def _len(f, fe, s):
    return sum((fe if e else f).getlength(p) for e, p in _runs(s))

def png(path, text, emoji=""):
    """-> (path, height): the title box, `text` wrapped to fit, `emoji` stuck to the last word"""
    f = ImageFont.truetype(TITLE_FONT, SIZE)
    fe = ImageFont.truetype(EMOJI_FONT, int(SIZE * 0.9))
    words = (text.strip() + (" " + emoji if emoji else "")).split()
    lines, cur = [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if cur and _len(f, fe, t) > W - 2 * PAD_X: lines.append(cur); cur = w
        else: cur = t
    if cur: lines.append(cur)
    if len(lines) > 1 and len(lines[-1].split()) == 1 and all(is_emoji(c) for c in lines[-1]):  # (no emoji alone on a line)
        e = lines.pop(); lines[-1] += " " + e
    lh = int(SIZE * 1.12)
    h = 2 * PAD_Y + lh * len(lines) + GAP * (len(lines) - 1)
    bw = int(max(_len(f, fe, l) for l in lines)) + 2 * PAD_X
    im = Image.new("RGBA", (1080, h), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    x0 = (1080 - bw) // 2
    d.rounded_rectangle((x0, 0, x0 + bw, h - 1), radius=14, fill=(0, 0, 0, 255))
    y = PAD_Y
    for l in lines:
        x = (1080 - _len(f, fe, l)) / 2
        for e, p in _runs(l):
            if e: d.text((x, y + int(SIZE * 0.12)), p, font=fe, embedded_color=True)
            else: d.text((x, y), p, font=f, fill=(255, 255, 255, 255))
            x += (fe if e else f).getlength(p)
        y += lh + GAP
    im.save(path)
    return path, h

# (owner 19 Nov: "a legenda não pode ficar em cima da cabeça de ninguém - nos exemplos isso nunca acontece")
YOLO = os.path.join(os.path.expanduser("~"), ".hoottools", "models", "yolo", "yolo11n.pt")  # (AGPL-3.0, SOURCE.txt)

def people(src, lay, step=0.4):
    """-> [(t, [(x0, y0, x1, y1) in the 1080x1920 frame])]: the people in the game band every `step` s"""
    import cv2
    from ultralytics import YOLO as _Y
    gx, gwid, H, top, band = lay["game_crop"]
    m = _Y(YOLO); cap = cv2.VideoCapture(src); fps = cap.get(cv2.CAP_PROP_FPS) or 30
    out, k, every = [], 0, max(1, round(fps * step))
    while True:
        ok = cap.grab()
        if not ok: break
        if k % every == 0:
            ok, fr = cap.retrieve()
            if ok:
                g = fr[:, gx:gx + gwid]
                r = m.predict(g, classes=[0], conf=0.3, imgsz=640, verbose=False)[0]
                sx, sy = 1080 / gwid, band / H
                out.append((k / fps, [(float(a) * sx, top + float(b) * sy, float(c) * sx, top + float(d) * sy)
                                      for a, b, c, d in r.boxes.xyxy.tolist()]))
        k += 1
    cap.release()
    return out

def spot_finder(found, game_top, bar_h):
    """-> f(t0, t1, width) = the caption's centre y: the first place in the game band where it touches no head (and,
    if it can, no person); it stays where it was while that place is free (no jumping around)"""
    # (owner 19 Nov: "a legenda no mesmo sítio que estava") just under the title box first; lower only to clear a head
    spots = [game_top + bar_h + 95, 1010, 1250, 1490, 1660]
    last = [spots[0]]
    def inter(a, b):
        return max(0, min(a[2], b[2]) - max(a[0], b[0])) * max(0, min(a[3], b[3]) - max(a[1], b[1]))
    def f(t0, t1, width=700):
        boxes = [b for t, bs in found if t0 - 0.3 <= t <= t1 + 0.3 for b in bs]
        heads = [(x0 - 20, y0 - 30, x1 + 20, y0 + max(60, 0.32 * (y1 - y0))) for x0, y0, x1, y1 in boxes]
        def cost(y):
            r = (540 - width / 2, y - 62, 540 + width / 2, y + 62)
            return (sum(inter(r, h) for h in heads), sum(inter(r, b) for b in boxes))
        if cost(last[0]) == (0, 0): return last[0]
        best = min(spots, key=lambda y: (cost(y), spots.index(y)))
        last[0] = best
        return best
    return f

if __name__ == "__main__":
    import sys
    print(png(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else ""))
