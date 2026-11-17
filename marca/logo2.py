"""
Round 2 of the brand logo (owner 17 Nov: "I did not like any of them except A"): 6 new symbols that keep what A has -
a chat bubble, the pink -> orange energy, the cyan glitch edge - and push it different ways. No text (3 language pages),
original shapes only (no GTA/Rockstar/YouTube/Twitch marks).
  python logo2.py -> logo2_1.png .. logo2_6.png (1080x1080) + opcoes_logo2.png
"""
import math, os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
S = 4 * 1080
BG = (14, 12, 30); PINK = (255, 42, 140); ORANGE = (255, 160, 30); CYAN = (0, 229, 255); WHITE = (255, 255, 255, 255)


def grad(c1, c2, angle=35, size=S):
    small = Image.new("RGB", (256, 256)); px = small.load(); a = math.radians(angle); dx, dy = math.cos(a), math.sin(a)
    for y in range(256):
        for x in range(256):
            t = max(0.0, min(1.0, (x * dx + y * dy) / (256 * (abs(dx) + abs(dy)))))
            px[x, y] = tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))
    return small.resize((size, size), Image.BICUBIC).convert("RGBA")


def glow(img, mask, color, r):
    g = Image.new("RGBA", img.size, color + (0,)); g.putalpha(mask.filter(ImageFilter.GaussianBlur(r))); img.alpha_composite(g)


def fill(img, mask, c1=PINK, c2=ORANGE, angle=35):
    g = grad(c1, c2, angle); g.putalpha(mask); img.alpha_composite(g)


def bubble(cx, cy, r, tail=True, round_=0.55, d=None):
    m = Image.new("L", (S, S), 0); dd = ImageDraw.Draw(m)
    dd.rounded_rectangle([cx - r * 1.15, cy - r * 0.9, cx + r * 1.15, cy + r * 0.8], radius=r * round_, fill=255)
    if tail: dd.polygon([(cx - r * 0.55, cy + r * 0.6), (cx - r * 0.95, cy + r * 1.3), (cx - r * 0.05, cy + r * 0.72)], fill=255)
    return m


def shift(m, dx, dy):
    o = Image.new("L", m.size, 0); o.paste(m, (int(dx), int(dy))); return o


def bolt(cx, cy, s):
    return [(cx + s * x, cy + s * y) for x, y in [(0.15, -1.0), (-0.55, 0.12), (-0.05, 0.12), (-0.25, 1.0), (0.55, -0.2), (0.05, -0.2), (0.3, -1.0)]]


def base():
    return Image.new("RGBA", (S, S), BG + (255,))


def l1():
    """A, refined: bigger bolt that breaks OUT of the bubble, double glitch (cyan + pink offsets)"""
    im = base(); cx, cy, r = S / 2, S / 2, S * 0.24; m = bubble(cx, cy, r)
    for col, dx, dy in ((CYAN, -0.02, 0.015), ((255, 0, 120), 0.02, -0.012)):
        c = Image.new("RGBA", (S, S), col + (255,)); c.putalpha(shift(m, S * dx, S * dy)); im.alpha_composite(c)
    glow(im, m, PINK, S * 0.03); fill(im, m)
    d = ImageDraw.Draw(im); d.polygon(bolt(cx + S * 0.03, cy - S * 0.04, r * 0.95), fill=WHITE)
    return im


def l2():
    """neon outline bubble with a bolt inside: thin glowing pink/orange line on dark, cyan inner bolt"""
    im = base(); cx, cy, r = S / 2, S / 2, S * 0.26
    outer = bubble(cx, cy, r); inner = bubble(cx, cy, r * 0.9).filter(ImageFilter.MinFilter(1))
    ring = Image.eval(outer, lambda v: v); ring = Image.composite(Image.new("L", outer.size, 0), outer, shift(bubble(cx, cy, r * 0.88), 0, 0))
    glow(im, ring, PINK, S * 0.04); fill(im, ring)
    bm = Image.new("L", (S, S), 0); ImageDraw.Draw(bm).polygon(bolt(cx, cy - S * 0.03, r * 0.6), fill=255)
    glow(im, bm, CYAN, S * 0.025); c = Image.new("RGBA", (S, S), CYAN + (255,)); c.putalpha(bm); im.alpha_composite(c)
    return im


def l3():
    """the bubble on fire: flame-shaped top edge, white bolt"""
    im = base(); cx, cy, r = S / 2, S / 2 + S * 0.03, S * 0.23; m = bubble(cx, cy, r)
    dd = ImageDraw.Draw(m)
    for i, h in enumerate((0.55, 0.85, 0.65, 1.0, 0.6)):  # flames rising from the top edge
        x = cx - r * 0.95 + i * r * 0.47; y0 = cy - r * 0.75
        dd.polygon([(x - r * 0.24, y0 + r * 0.1), (x + r * 0.04, y0 - r * h), (x + r * 0.26, y0 + r * 0.1)], fill=255)
    glow(im, m, ORANGE, S * 0.035); fill(im, m, (255, 200, 40), PINK, 90)
    ImageDraw.Draw(im).polygon(bolt(cx + S * 0.01, cy + S * 0.01, r * 0.62), fill=WHITE)
    return im


def l4():
    """two bubbles colliding (the chat going wild): pink + orange overlapping, cyan spark where they meet"""
    im = base(); r = S * 0.17
    m1 = bubble(S * 0.42, S * 0.45, r); m2 = bubble(S * 0.6, S * 0.58, r, tail=False)
    glow(im, m1, PINK, S * 0.025); fill(im, m1, PINK, (255, 90, 120))
    m2f = m2.transpose(Image.FLIP_LEFT_RIGHT); m2f = shift(m2f, -S * 0.0, 0)
    glow(im, m2, ORANGE, S * 0.025); fill(im, m2, (255, 120, 60), ORANGE)
    d = ImageDraw.Draw(im); cx, cy = S * 0.515, S * 0.515
    for a in range(0, 360, 45):
        ra = math.radians(a); d.line([(cx, cy), (cx + S * 0.07 * math.cos(ra), cy + S * 0.07 * math.sin(ra))], fill=CYAN + (255,), width=int(S * 0.012))
    d.ellipse([cx - S * 0.025, cy - S * 0.025, cx + S * 0.025, cy + S * 0.025], fill=WHITE)
    return im


def l5():
    """a bubble that is a 'live' screen: rounded bubble, red live dot + bolt, glitch slices"""
    im = base(); cx, cy, r = S / 2, S / 2, S * 0.25; m = bubble(cx, cy, r, round_=0.32)
    glow(im, m, PINK, S * 0.03); fill(im, m)
    for k, (y, dx) in enumerate(((0.38, 0.03), (0.52, -0.025), (0.61, 0.02))):  # glitch slices
        band = Image.new("L", (S, S), 0); ImageDraw.Draw(band).rectangle([0, S * y, S, S * y + S * 0.018], fill=255)
        sl = Image.composite(m, Image.new("L", (S, S), 0), band); c = Image.new("RGBA", (S, S), CYAN + (255,)); c.putalpha(shift(sl, S * dx, 0)); im.alpha_composite(c)
    d = ImageDraw.Draw(im); d.polygon(bolt(cx + S * 0.03, cy - S * 0.02, r * 0.6), fill=WHITE)
    d.ellipse([cx - r * 0.95, cy - r * 0.68, cx - r * 0.65, cy - r * 0.38], fill=(255, 30, 60, 255), outline=WHITE, width=int(S * 0.008))
    return im


def l6():
    """bold sticker: white bubble with thick gradient border, gradient bolt inside (reads on any background)"""
    im = base(); cx, cy, r = S / 2, S / 2, S * 0.25
    m = bubble(cx, cy, r); glow(im, m, PINK, S * 0.03); fill(im, m)
    inner = bubble(cx, cy, r * 0.84, tail=False); w = Image.new("RGBA", (S, S), (255, 255, 255, 255)); w.putalpha(inner); im.alpha_composite(w)
    bm = Image.new("L", (S, S), 0); ImageDraw.Draw(bm).polygon(bolt(cx + S * 0.01, cy - S * 0.02, r * 0.62), fill=255)
    fill(im, bm, PINK, ORANGE, 90)
    return im


def round_prev(img, size):
    im = img.resize((size, size), Image.LANCZOS)
    m = Image.new("L", (size * 4, size * 4), 0); ImageDraw.Draw(m).ellipse([0, 0, size * 4, size * 4], fill=255)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0)); out.paste(im, (0, 0), m.resize((size, size), Image.LANCZOS)); return out


def main():
    logos = [l1(), l2(), l3(), l4(), l5(), l6()]
    cols = 3; W = 480
    sheet = Image.new("RGB", (cols * (W + 40) + 40, 2 * (W + 330) + 40), (245, 245, 248)); d = ImageDraw.Draw(sheet)
    f = ImageFont.truetype("C:/Windows/Fonts/ariblk.ttf", 52); fs = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 28)
    for i, im in enumerate(logos):
        big = im.resize((1080, 1080), Image.LANCZOS).convert("RGB"); big.save(os.path.join(HERE, f"logo2_{i + 1}.png"))
        x = 40 + (i % cols) * (W + 40); y = 40 + (i // cols) * (W + 330)
        d.text((x, y), str(i + 1), font=f, fill=(20, 20, 30)); sheet.paste(big.resize((W, W), Image.LANCZOS), (x, y + 70))
        rp = round_prev(im, 170); sheet.paste(rp, (x + 20, y + W + 90), rp); rs = round_prev(im, 60); sheet.paste(rs, (x + 240, y + W + 145), rs)
        d.text((x + 40, y + W + 270), "perfil", font=fs, fill=(90, 90, 100)); d.text((x + 225, y + W + 270), "no feed", font=fs, fill=(90, 90, 100))
    sheet.save(os.path.join(HERE, "opcoes_logo2.png")); print("ok")


if __name__ == "__main__":
    main()
