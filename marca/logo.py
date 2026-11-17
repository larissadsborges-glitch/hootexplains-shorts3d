"""
Brand logos (owner 17 Nov: "e o logo"): one symbol with no text, the same on the EN / PT / ES pages
(Stream Went Wild / Live Descontrolada / Directo Descontrolado). Original shapes only: no GTA/Rockstar/YouTube marks or fonts.
  python logo.py  -> logo_A.png logo_B.png logo_C.png (1080x1080) + opcoes_logo.png (sheet with round previews)
"""
import math, os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
S = 4 * 1080  # drawn 4x, scaled down = smooth edges
BG = (14, 12, 30)


def grad(w, h, c1, c2, angle=35):
    """a linear gradient image"""
    g = Image.new("RGB", (w, h)); px = g.load()
    a = math.radians(angle); dx, dy = math.cos(a), math.sin(a)
    n = abs(w * dx) + abs(h * dy)
    for y in range(0, h, 4):
        for x in range(0, w, 4):
            t = max(0.0, min(1.0, (x * dx + y * dy) / n))
            c = tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))
            for yy in range(y, min(y + 4, h)):
                for xx in range(x, min(x + 4, w)): px[xx, yy] = c
    return g


def glow(img, mask, color, radius):
    g = Image.new("RGBA", img.size, color + (0,)); a = mask.filter(ImageFilter.GaussianBlur(radius))
    g.putalpha(a); img.alpha_composite(g)


def bubble_mask(cx, cy, r, tail=True):
    m = Image.new("L", (S, S), 0); d = ImageDraw.Draw(m)
    d.rounded_rectangle([cx - r * 1.15, cy - r * 0.9, cx + r * 1.15, cy + r * 0.8], radius=r * 0.55, fill=255)
    if tail: d.polygon([(cx - r * 0.55, cy + r * 0.6), (cx - r * 0.95, cy + r * 1.3), (cx - r * 0.05, cy + r * 0.72)], fill=255)
    return m


def bolt(cx, cy, s):
    return [(cx + s * x, cy + s * y) for x, y in [(0.15, -1.0), (-0.55, 0.12), (-0.05, 0.12), (-0.25, 1.0), (0.55, -0.2), (0.05, -0.2), (0.3, -1.0)]]


def logo_A():
    """chat bubble on fire: magenta -> orange bubble, white lightning bolt, cyan offset 'glitch' edge"""
    img = Image.new("RGBA", (S, S), BG + (255,))
    cx, cy, r = S / 2 + S * 0.02, S / 2 - S * 0.03, S * 0.24
    m = bubble_mask(cx, cy, r)
    off = Image.new("L", (S, S), 0); off.paste(m, (int(-S * 0.018), int(S * 0.014)))
    cyan = Image.new("RGBA", (S, S), (0, 229, 255, 255)); cyan.putalpha(off); img.alpha_composite(cyan)
    glow(img, m, (255, 60, 140), S * 0.03)
    g = grad(S, S, (255, 42, 140), (255, 160, 30)).convert("RGBA"); g.putalpha(m); img.alpha_composite(g)
    d = ImageDraw.Draw(img); d.polygon(bolt(cx + S * 0.01, cy - S * 0.03, r * 0.62), fill=(255, 255, 255, 255))
    return img


def logo_B():
    """live dot exploding: a red REC dot inside a jagged starburst, 'LIVE' under it (same word in EN/PT/ES)"""
    img = Image.new("RGBA", (S, S), BG + (255,))
    cx, cy = S / 2, S / 2 - S * 0.05
    pts = []
    for i in range(28):
        a = i * math.pi * 2 / 28; rr = S * (0.33 if i % 2 == 0 else 0.24) * (1 + 0.06 * math.sin(i * 2.7))
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    m = Image.new("L", (S, S), 0); ImageDraw.Draw(m).polygon(pts, fill=255)
    glow(img, m, (255, 200, 0), S * 0.03)
    g = grad(S, S, (255, 220, 40), (255, 110, 20), 90).convert("RGBA"); g.putalpha(m); img.alpha_composite(g)
    d = ImageDraw.Draw(img)
    d.ellipse([cx - S * 0.13, cy - S * 0.13, cx + S * 0.13, cy + S * 0.13], fill=(14, 12, 30, 255))
    d.ellipse([cx - S * 0.095, cy - S * 0.095, cx + S * 0.095, cy + S * 0.095], fill=(255, 40, 60, 255))
    f = ImageFont.truetype("C:/Windows/Fonts/ariblk.ttf", int(S * 0.13))
    t = "LIVE"; w = d.textlength(t, font=f)
    d.rounded_rectangle([cx - w / 2 - S * 0.04, S * 0.70, cx + w / 2 + S * 0.04, S * 0.86], radius=S * 0.03, fill=(255, 40, 60, 255))
    d.text((cx - w / 2, S * 0.695), t, font=f, fill=(255, 255, 255, 255))
    return img


def logo_C():
    """the shocked face (the reaction every clip is about): yellow -> orange face, huge white eyes, open mouth, sweat drop"""
    img = Image.new("RGBA", (S, S), BG + (255,))
    cx, cy, r = S / 2, S / 2, S * 0.3
    m = Image.new("L", (S, S), 0); ImageDraw.Draw(m).ellipse([cx - r, cy - r, cx + r, cy + r], fill=255)
    glow(img, m, (255, 190, 0), S * 0.03)
    g = grad(S, S, (255, 225, 60), (255, 120, 30), 90).convert("RGBA"); g.putalpha(m); img.alpha_composite(g)
    d = ImageDraw.Draw(img)
    for ex in (-0.38, 0.38):  # eyes
        x = cx + r * ex; y = cy - r * 0.22
        d.ellipse([x - r * 0.25, y - r * 0.3, x + r * 0.25, y + r * 0.3], fill=(255, 255, 255, 255), outline=BG + (255,), width=int(S * 0.012))
        d.ellipse([x - r * 0.09, y - r * 0.09, x + r * 0.09, y + r * 0.09], fill=BG + (255,))
    d.ellipse([cx - r * 0.2, cy + r * 0.25, cx + r * 0.2, cy + r * 0.72], fill=(120, 20, 40, 255), outline=BG + (255,), width=int(S * 0.012))
    x, y = cx + r * 0.78, cy - r * 0.55  # sweat drop
    d.polygon([(x, y - r * 0.25), (x - r * 0.12, y + r * 0.02), (x + r * 0.12, y + r * 0.02)], fill=(80, 200, 255, 255))
    d.ellipse([x - r * 0.12, y - r * 0.08, x + r * 0.12, y + r * 0.16], fill=(80, 200, 255, 255))
    return img


def round_preview(img, size):
    im = img.resize((size, size), Image.LANCZOS)
    m = Image.new("L", (size * 4, size * 4), 0); ImageDraw.Draw(m).ellipse([0, 0, size * 4, size * 4], fill=255)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0)); out.paste(im, (0, 0), m.resize((size, size), Image.LANCZOS))
    return out


def main():
    logos = {"A": logo_A(), "B": logo_B(), "C": logo_C()}
    sheet = Image.new("RGB", (3 * 520 + 80, 980), (245, 245, 248)); d = ImageDraw.Draw(sheet)
    f = ImageFont.truetype("C:/Windows/Fonts/ariblk.ttf", 56); fs = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 30)
    for i, (k, im) in enumerate(logos.items()):
        big = im.resize((1080, 1080), Image.LANCZOS).convert("RGB"); big.save(os.path.join(HERE, f"logo_{k}.png"))
        x = 40 + i * 520
        sheet.paste(big.resize((480, 480), Image.LANCZOS), (x, 90))
        d.text((x + 215, 15), k, font=f, fill=(20, 20, 30))
        rp = round_preview(im, 200); sheet.paste(rp, (x + 20, 620), rp)   # profile picture size
        rs = round_preview(im, 64); sheet.paste(rs, (x + 260, 690), rs)     # in the feed / comments
        d.text((x + 20, 840), "perfil", font=fs, fill=(90, 90, 100)); d.text((x + 245, 840), "no feed", font=fs, fill=(90, 90, 100))
    sheet.save(os.path.join(HERE, "opcoes_logo.png"))
    print("ok")


if __name__ == "__main__":
    main()
