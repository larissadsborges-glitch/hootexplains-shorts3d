"""
The chosen logo (owner 17 Nov: round 3 no. 3 - the big flame - "adjust it so it sits well WITH the logo", the flame as
in the original no. 3): flame and bubble are ONE shape - the flames grow out of the bubble's own rim, one continuous
gradient (yellow at the tips -> orange -> pink at the bottom), one glow; white inside, the gradient bolt.
  python logo_final.py -> logo_final_1..3.png + opcoes_logo_final.png
"""
import math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import logo3 as L

HERE = os.path.dirname(os.path.abspath(__file__)); S = L.S
YEL, ORANGE, PINK, BG, CYAN = L.YEL, L.ORANGE, L.PINK, L.BG, L.CYAN


def grad3(top, mid, bot, y0, y1):
    """vertical gradient top -> mid -> bot between y0 and y1 (full canvas)"""
    col = Image.new("RGB", (1, 512)); px = col.load()
    for k in range(512):
        y = k / 511 * S; t = min(1.0, max(0.0, (y - y0) / max(1, y1 - y0)))
        a, b, u = (top, mid, t * 2) if t < 0.5 else (mid, bot, (t - 0.5) * 2)
        px[0, k] = tuple(int(a[i] + (b[i] - a[i]) * u) for i in range(3))
    return col.resize((S, S), Image.BICUBIC).convert("RGBA")


def make(heights=(0.6, 1.0, 0.8, 1.1, 0.65), glitch=False, top=YEL):
    im = Image.new("RGBA", (S, S), BG + (255,)); cx, cy, r = S / 2, S / 2 + S * 0.06, S * 0.24
    # flames start INSIDE the rim (lower base) so they grow out of it with no seam
    fl = L.flames(cx, cy + r * 0.12, r, heights)
    body = L.bubble(cx, cy, r)
    shape = Image.composite(Image.new("L", (S, S), 255), body, fl)
    shape = shape.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.MinFilter(9))  # round the joins
    if glitch:
        c = Image.new("RGBA", (S, S), CYAN + (255,)); sh = Image.new("L", (S, S), 0); sh.paste(shape, (int(-S * 0.016), int(S * 0.012))); c.putalpha(sh); im.alpha_composite(c)
    g = Image.new("RGBA", (S, S), PINK + (0,)); g.putalpha(shape.filter(ImageFilter.GaussianBlur(S * 0.03))); im.alpha_composite(g)
    y_top = cy - r * 0.62 - r * max(heights) * 1.15; y_bot = cy + r * 1.3
    gr = grad3(top, ORANGE, PINK, y_top, y_bot); gr.putalpha(shape); im.alpha_composite(gr)
    inner = L.bubble(cx, cy, r * 0.84, tail=False); w = Image.new("RGBA", (S, S), (255, 255, 255, 255)); w.putalpha(inner); im.alpha_composite(w)
    bm = Image.new("L", (S, S), 0); ImageDraw.Draw(bm).polygon(L.bolt(cx + S * 0.01, cy - S * 0.02, r * 0.62), fill=255)
    L.fill(im, bm, PINK, ORANGE, 90)
    return im


VERSIONS = [("amarela", dict()), ("laranja", dict(top=(255, 190, 40))),
            ("+ contorno azul", dict(glitch=True))]


def main():
    W = 480; sheet = Image.new("RGB", (3 * (W + 40) + 40, W + 400), (245, 245, 248)); d = ImageDraw.Draw(sheet)
    f = ImageFont.truetype("C:/Windows/Fonts/ariblk.ttf", 34); fs = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 28)
    for i, (label, kw) in enumerate(VERSIONS):
        im = make(**kw); big = im.resize((1080, 1080), Image.LANCZOS).convert("RGB"); big.save(os.path.join(HERE, f"logo_final_{i + 1}.png"))
        x = 40 + i * (W + 40)
        d.text((x, 30), f"{i + 1} · {label}", font=f, fill=(20, 20, 30)); sheet.paste(big.resize((W, W), Image.LANCZOS), (x, 90))
        rp = L.round_prev(im, 170); sheet.paste(rp, (x + 20, W + 110), rp); rs = L.round_prev(im, 60); sheet.paste(rs, (x + 240, W + 165), rs)
        d.text((x + 40, W + 290), "perfil", font=fs, fill=(90, 90, 100)); d.text((x + 225, W + 290), "no feed", font=fs, fill=(90, 90, 100))
    sheet.save(os.path.join(HERE, "opcoes_logo_final.png")); print("ok")


if __name__ == "__main__":
    main()
