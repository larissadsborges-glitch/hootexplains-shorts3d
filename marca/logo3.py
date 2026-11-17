"""
Round 3 (owner 17 Nov: "6 with the flame of 3"): the white sticker bubble with the gradient bolt (6) on fire (3).
6 versions: flame size, number of tongues, colour, cyan glitch edge.  python logo3.py -> logo3_1..6.png + opcoes_logo3.png
"""
import math, os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
S = 4 * 1080
BG = (14, 12, 30); PINK = (255, 42, 140); ORANGE = (255, 160, 30); YEL = (255, 210, 50); CYAN = (0, 229, 255)


def grad(c1, c2, angle=90):
    small = Image.new("RGB", (256, 256)); px = small.load(); a = math.radians(angle); dx, dy = math.cos(a), math.sin(a)
    for y in range(256):
        for x in range(256):
            t = max(0.0, min(1.0, (x * dx + y * dy) / (256 * (abs(dx) + abs(dy)))))
            px[x, y] = tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))
    return small.resize((S, S), Image.BICUBIC).convert("RGBA")


def fill(img, mask, c1, c2, angle=90):
    g = grad(c1, c2, angle); g.putalpha(mask); img.alpha_composite(g)


def glow(img, mask, color, r):
    g = Image.new("RGBA", img.size, color + (0,)); g.putalpha(mask.filter(ImageFilter.GaussianBlur(r))); img.alpha_composite(g)


def bubble(cx, cy, r, tail=True):
    m = Image.new("L", (S, S), 0); d = ImageDraw.Draw(m)
    d.rounded_rectangle([cx - r * 1.15, cy - r * 0.9, cx + r * 1.15, cy + r * 0.8], radius=r * 0.55, fill=255)
    if tail: d.polygon([(cx - r * 0.55, cy + r * 0.6), (cx - r * 0.95, cy + r * 1.3), (cx - r * 0.05, cy + r * 0.72)], fill=255)
    return m


def flames(cx, cy, r, heights, spread=0.95):
    """flame tongues rising from the bubble's top edge: wide base, sides curving in, a POINTED tip that leans and
    curls a little (alternating left/right), like a real flame"""
    m = Image.new("L", (S, S), 0); d = ImageDraw.Draw(m); n = len(heights); y0 = cy - r * 0.62
    for i, h in enumerate(heights):
        x = cx - r * spread + i * (2 * r * spread) / max(n - 1, 1); w = r * 0.30; H = r * h * 1.15
        lean = (0.35 if i % 2 else -0.35) * w
        left, right = [], []
        for k in range(31):
            t = k / 30  # 0 = base, 1 = tip
            half = w * (1 - t) ** 1.25 * (1 + 0.35 * math.sin(math.pi * t * 0.9))
            xc = x + lean * t ** 2.2
            y = y0 - H * t
            left.append((xc - half, y)); right.append((xc + half, y))
        d.polygon(left + right[::-1], fill=255)
    return m.filter(ImageFilter.GaussianBlur(S * 0.0015))


def bolt(cx, cy, s):
    return [(cx + s * x, cy + s * y) for x, y in [(0.15, -1.0), (-0.55, 0.12), (-0.05, 0.12), (-0.25, 1.0), (0.55, -0.2), (0.05, -0.2), (0.3, -1.0)]]


def make(heights, fire=(YEL, PINK), glitch=False, ring=(PINK, ORANGE)):
    im = Image.new("RGBA", (S, S), BG + (255,)); cx, cy, r = S / 2, S / 2 + S * 0.05, S * 0.24
    fl = flames(cx, cy, r, heights); body = bubble(cx, cy, r)
    allm = Image.composite(Image.new("L", (S, S), 255), body, fl)
    if glitch:
        c = Image.new("RGBA", (S, S), CYAN + (255,)); sh = Image.new("L", (S, S), 0); sh.paste(allm, (int(-S * 0.018), int(S * 0.014))); c.putalpha(sh); im.alpha_composite(c)
    glow(im, allm, ring[0], S * 0.03)
    fill(im, fl, fire[0], fire[1], 90)
    fill(im, body, ring[0], ring[1], 35)
    inner = bubble(cx, cy, r * 0.84, tail=False); w = Image.new("RGBA", (S, S), (255, 255, 255, 255)); w.putalpha(inner); im.alpha_composite(w)
    bm = Image.new("L", (S, S), 0); ImageDraw.Draw(bm).polygon(bolt(cx + S * 0.01, cy - S * 0.02, r * 0.62), fill=255)
    fill(im, bm, PINK, ORANGE, 90)
    return im


VERSIONS = [
    ("chama pequena (3)", dict(heights=(0.45, 0.7, 0.45))),
    ("chama média (4)", dict(heights=(0.55, 0.85, 0.75, 0.5))),
    ("chama grande (5)", dict(heights=(0.6, 1.0, 0.8, 1.1, 0.65))),
    ("chama + glitch azul", dict(heights=(0.55, 0.85, 0.75, 0.5), glitch=True)),
    ("chama rosa", dict(heights=(0.55, 0.85, 0.75, 0.5), fire=(PINK, ORANGE))),
    ("chama amarela + aro laranja", dict(heights=(0.5, 0.8, 0.6), fire=(YEL, ORANGE), ring=(ORANGE, PINK))),
]


def round_prev(img, size):
    im = img.resize((size, size), Image.LANCZOS)
    m = Image.new("L", (size * 4, size * 4), 0); ImageDraw.Draw(m).ellipse([0, 0, size * 4, size * 4], fill=255)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0)); out.paste(im, (0, 0), m.resize((size, size), Image.LANCZOS)); return out


def main():
    cols, W = 3, 480
    sheet = Image.new("RGB", (cols * (W + 40) + 40, 2 * (W + 330) + 40), (245, 245, 248)); d = ImageDraw.Draw(sheet)
    f = ImageFont.truetype("C:/Windows/Fonts/ariblk.ttf", 40); fs = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 28)
    for i, (label, kw) in enumerate(VERSIONS):
        im = make(**kw); big = im.resize((1080, 1080), Image.LANCZOS).convert("RGB"); big.save(os.path.join(HERE, f"logo3_{i + 1}.png"))
        x = 40 + (i % cols) * (W + 40); y = 40 + (i // cols) * (W + 330)
        d.text((x, y), f"{i + 1} · {label}", font=f, fill=(20, 20, 30)); sheet.paste(big.resize((W, W), Image.LANCZOS), (x, y + 70))
        rp = round_prev(im, 170); sheet.paste(rp, (x + 20, y + W + 90), rp); rs = round_prev(im, 60); sheet.paste(rs, (x + 240, y + W + 145), rs)
        d.text((x + 40, y + W + 270), "perfil", font=fs, fill=(90, 90, 100)); d.text((x + 225, y + W + 270), "no feed", font=fs, fill=(90, 90, 100))
    sheet.save(os.path.join(HERE, "opcoes_logo3.png")); print("ok")


if __name__ == "__main__":
    main()
