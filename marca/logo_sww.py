"""
Owner 17 Nov: "what about an SWW logo?" - the chosen flame bubble with the letters in place of the bolt.
SWW (Stream Went Wild, EN) + LD (Live Descontrolada, PT) + DD (Directo Descontrolado, ES) so she sees the family.
  python logo_sww.py -> logo_sww_*.png + opcoes_logo_sww.png
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import logo3 as L, logo_final as LF

HERE = os.path.dirname(os.path.abspath(__file__)); S = L.S
POP = os.path.join(os.path.expanduser("~"), ".hoottools", "fonts", "Poppins-Black.ttf")


def make(text, italic=False):
    im = LF.make(glitch=True)
    cx, cy, r = S / 2, S / 2 + S * 0.06, S * 0.24
    # white out the bolt: redraw the white inside of the bubble
    inner = L.bubble(cx, cy, r * 0.84, tail=False); w = Image.new("RGBA", (S, S), (255, 255, 255, 255)); w.putalpha(inner); im.alpha_composite(w)
    size = int(r * (0.95 if len(text) == 3 else 1.15))
    f = ImageFont.truetype(POP, size)
    m = Image.new("L", (S, S), 0); d = ImageDraw.Draw(m)
    tw = d.textlength(text, font=f)
    while tw > r * 1.75: size = int(size * 0.94); f = ImageFont.truetype(POP, size); tw = d.textlength(text, font=f)
    d.text((cx, cy - r * 0.04), text, font=f, fill=255, anchor="mm")
    if italic: m = m.transform(m.size, Image.AFFINE, (1, 0.18, -0.18 * cy, 0, 1, 0), Image.BICUBIC)
    L.fill(im, m, L.PINK, L.ORANGE, 90)
    return im


def main():
    items = [("SWW", make("SWW")), ("SWW itálico", make("SWW", True)), ("LD (PT)", make("LD", True)), ("DD (ES)", make("DD", True))]
    W = 420; sheet = Image.new("RGB", (len(items) * (W + 30) + 30, W + 380), (245, 245, 248)); d = ImageDraw.Draw(sheet)
    f = ImageFont.truetype("C:/Windows/Fonts/ariblk.ttf", 34); fs = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 26)
    for i, (label, im) in enumerate(items):
        big = im.convert("RGB"); big.resize((1080, 1080), Image.LANCZOS).save(os.path.join(HERE, f"logo_sww_{i + 1}.png"))
        x = 30 + i * (W + 30)
        d.text((x, 24), label, font=f, fill=(20, 20, 30)); sheet.paste(big.resize((W, W), Image.LANCZOS), (x, 80))
        rp = L.round_prev(im, 160); sheet.paste(rp, (x + 20, W + 100), rp); rs = L.round_prev(im, 60); sheet.paste(rs, (x + 230, W + 150), rs)
        d.text((x + 40, W + 275), "perfil", font=fs, fill=(90, 90, 100)); d.text((x + 215, W + 275), "no feed", font=fs, fill=(90, 90, 100))
    sheet.save(os.path.join(HERE, "opcoes_logo_sww.png")); print("ok")


if __name__ == "__main__":
    main()
