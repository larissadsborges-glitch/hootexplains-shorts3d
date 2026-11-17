"""
Visual examples (stills) of the 3 end-of-day formats for the owner's OK (house rule: sheet before render):
  1. EVERY DEATH of a streamer that day, with a counter
  2. THE RACE: who finished the first mission fastest
  3. TOP 5 GTA 6 MOMENTS of the day, all streamers
Frames come from test clips (no GTA 6 yet). Overlays sit where the hook/title rules allow: never on the face.
  python exemplos_formatos.py CLIP_SPLIT.mp4 CLIP_FACE.mp4 -> exemplos_formatos.png
"""
import os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
FF = r"C:\Users\borge\.hoottools\ffmpeg\ffmpeg.exe"
BLK = "C:/Windows/Fonts/ariblk.ttf"; REG = "C:/Windows/Fonts/arialbd.ttf"
NAVY = (14, 12, 30); YEL = (255, 212, 0); RED = (255, 45, 70)


def frame(path, t):
    out = os.path.join(HERE, f"_f_{os.path.basename(path)}_{t}.png")
    subprocess.run([FF, "-v", "error", "-y", "-ss", str(t), "-i", path, "-frames:v", "1", out], check=True)
    im = Image.open(out).convert("RGB"); os.remove(out); return im


def f(size, bold=True): return ImageFont.truetype(BLK if bold else REG, size)


def pill(d, xy, text, size, fill, color=(255, 255, 255), pad=(26, 14), anchor_center=False):
    font = f(size); w = d.textlength(text, font=font); x, y = xy
    if anchor_center: x -= (w + 2 * pad[0]) / 2
    d.rounded_rectangle([x, y, x + w + 2 * pad[0], y + size + 2 * pad[1]], radius=18, fill=fill)
    d.text((x + pad[0], y + pad[1] - size * 0.12), text, font=font, fill=color)


def low_band(im, l1, l2):
    d = ImageDraw.Draw(im, "RGBA"); d.rectangle([0, 1440, 1080, 1690], fill=(0, 0, 0, 185))
    for txt, y, col in ((l1, 1468, (255, 255, 255)), (l2, 1562, YEL)):
        w = d.textlength(txt, font=f(62)); d.text(((1080 - w) / 2, y), txt, font=f(62), fill=col)


def card(title_lines, rows=None, sub=None):
    im = Image.new("RGB", (1080, 1920), NAVY); d = ImageDraw.Draw(im)
    y = 330
    for i, t in enumerate(title_lines):
        w = d.textlength(t, font=f(76)); d.text(((1080 - w) / 2, y), t, font=f(76), fill=YEL if i == len(title_lines) - 1 else (255, 255, 255)); y += 100
    if rows:
        y += 120
        best = min(r[2] for r in rows)
        for i, (name, tlabel, mins) in enumerate(rows):
            d.rounded_rectangle([90, y, 990, y + 150], radius=24, fill=(32, 28, 60))
            d.text((120, y + 40), ["🥇", "🥈", "🥉"][i] if False else f"{i + 1}.", font=f(60), fill=YEL)
            d.text((210, y + 40), name, font=f(60), fill=(255, 255, 255))
            w = d.textlength(tlabel, font=f(56)); d.text((960 - w, y + 44), tlabel, font=f(56), fill=YEL if mins == best else (200, 200, 220))
            y += 185
    if sub:
        w = d.textlength(sub, font=f(40, False)); d.text(((1080 - w) / 2, 1560), sub, font=f(40, False), fill=(170, 170, 200))
    return im


def main():
    split, face = sys.argv[1], sys.argv[2]
    shots = []
    # 1. every death
    a = frame(split, 3); low_band(a, "EVERY KAICENAT DEATH", "GTA 6 · DAY 1"); shots.append(("1. TODAS AS MORTES", "início", a))
    b = frame(split, 20); d = ImageDraw.Draw(b, "RGBA"); pill(d, (30, 720), "DEATH 3/14", 58, RED); shots.append(("1. TODAS AS MORTES", "a meio (contador)", b))
    # 2. the race
    c = card(["WHO BEAT THE", "FIRST MISSION", "FASTEST?"], [("KAICENAT", "1h 12m", 72), ("ISHOWSPEED", "1h 40m", 100), ("CASEOH", "2h 05m", 125)],
             "contado desde o início da live de cada um"); shots.append(("2. A CORRIDA", "início", c))
    e = frame(face, 30); d = ImageDraw.Draw(e, "RGBA"); low_band(e, "#1 ALANZOKA", "1h 12m · MISSION COMPLETE"); shots.append(("2. A CORRIDA", "o momento de cada um", e))
    # 3. top 5
    g = card(["TOP 5", "GTA 6 MOMENTS", "DAY 1"], None, "Speed · Kai · CaseOh · Lacy · Ginge · Alanzoka · IlloJuan"); shots.append(("3. TOP 5 DO DIA", "início", g))
    h = frame(split, 40); d = ImageDraw.Draw(h, "RGBA"); pill(d, (30, 720), "#3", 110, YEL, NAVY, (30, 10)); pill(d, (250, 742), "KAICENAT", 56, (0, 0, 0, 200))
    shots.append(("3. TOP 5 DO DIA", "cada momento (#5 → #1)", h))
    W, TH = 360, 640
    sheet = Image.new("RGB", (len(shots) * (W + 24) + 24, TH + 170), (245, 245, 248)); sd = ImageDraw.Draw(sheet)
    for i, (head, sub, im) in enumerate(shots):
        x = 24 + i * (W + 24)
        sheet.paste(im.resize((W, TH), Image.LANCZOS), (x, 120))
        sd.text((x, 22), head, font=f(26), fill=(20, 20, 30)); sd.text((x, 64), sub, font=f(24, False), fill=(90, 90, 100))
    out = os.path.join(HERE, "exemplos_formatos.png"); sheet.save(out); print(out)


if __name__ == "__main__":
    main()
