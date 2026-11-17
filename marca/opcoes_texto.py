"""
Title and caption style options (owner 17 Nov: "I don't like the caption, nor the title as it is - maybe it's the big
background box"). Drawn on one real frame of the new layout so she can point at what she likes.
  python opcoes_texto.py FRAME.png -> opcoes_titulo.png, opcoes_legenda.png
"""
import os, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
F = os.path.join(os.path.expanduser("~"), ".hoottools", "fonts")
def pop(w, s): return ImageFont.truetype(os.path.join(F, f"Poppins-{w}.ttf"), s)
YEL = (255, 214, 0); PINK = (255, 42, 140); ORANGE = (255, 160, 30)
TITLE = "KAI CENAT MISSES EVERY SHOT ON THE ROOF"; TITLE_PT = "Kai Cenat misses every shot on the roof"
WORD = "ROOF"


def outlined(d, xy, text, font, fill, stroke=6, shadow=True, anchor="mm"):
    if shadow: d.text((xy[0] + 5, xy[1] + 7), text, font=font, fill=(0, 0, 0, 150), anchor=anchor, stroke_width=stroke, stroke_fill=(0, 0, 0, 150))
    d.text(xy, text, font=font, fill=fill, anchor=anchor, stroke_width=stroke, stroke_fill=(0, 0, 0))


def wrap(d, text, font, maxw):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if d.textlength(t, font=font) <= maxw: cur = t
        else: lines.append(cur); cur = w
    return lines + [cur]


def title_variants(base):
    out = []
    # T1: no title on the video (like the 1st example): context only in the post's description
    im = base.copy(); out.append(("T1 · sem título no vídeo", im))
    # T2: white Poppins, black outline + shadow, no box, on top of the game
    im = base.copy(); d = ImageDraw.Draw(im); f = pop("ExtraBold", 62); y = 680
    for ln in wrap(d, TITLE, f, 960): outlined(d, (540, y), ln, f, (255, 255, 255)); y += 78
    out.append(("T2 · branco com contorno, sem caixa", im))
    # T3: small rounded white sticker, black text (compact, not a big block)
    im = base.copy(); d = ImageDraw.Draw(im, "RGBA"); f = pop("Bold", 46); lines = wrap(d, TITLE_PT, f, 820); y = 660
    w = max(d.textlength(l, font=f) for l in lines) + 60; h = 62 * len(lines) + 34
    d.rounded_rectangle([540 - w / 2, y, 540 + w / 2, y + h], radius=28, fill=(255, 255, 255, 235))
    for i, ln in enumerate(lines): d.text((540, y + 22 + 62 * i + 24), ln, font=f, fill=(20, 20, 20), anchor="mm")
    out.append(("T3 · etiqueta branca pequena", im))
    # T4: white outline text with the key words in the brand yellow
    im = base.copy(); d = ImageDraw.Draw(im); f = pop("ExtraBold", 62); y = 680
    for ln in wrap(d, TITLE, f, 960):
        x = 540 - d.textlength(ln, font=f) / 2
        for wd in ln.split():
            col = YEL if wd in ("MISSES", "EVERY", "SHOT") else (255, 255, 255)
            outlined(d, (x, y), wd, f, col, anchor="lm"); x += d.textlength(wd + " ", font=f)
        y += 78
    out.append(("T4 · palavras-chave a amarelo", im))
    return out


def caption_variants(base):
    out = []
    for label, fn in [
        ("L1 · branca (agora)", lambda d: outlined(d, (540, 960), WORD, pop("ExtraBold", 130), (255, 255, 255), stroke=0)),
        ("L2 · amarela (3.º exemplo)", lambda d: outlined(d, (540, 960), WORD, pop("ExtraBold", 130), YEL, stroke=0)),
        ("L3 · branca com contorno grosso", lambda d: outlined(d, (540, 960), WORD, pop("Black", 120), (255, 255, 255), stroke=10)),
        ("L4 · 3 palavras, a dita a amarelo", None),
    ]:
        im = base.copy(); d = ImageDraw.Draw(im)
        if fn: fn(d)
        else:
            f = pop("ExtraBold", 92); words = ["EVERY", "SHOT", "ROOF"]; x = 540 - d.textlength(" ".join(words), font=f) / 2
            for i, wd in enumerate(words):
                outlined(d, (x, 960), wd, f, YEL if i == 2 else (255, 255, 255), stroke=7, anchor="lm"); x += d.textlength(wd + " ", font=f)
        out.append((label, im))
    return out


def sheet(items, path):
    W, H = 420, 747
    s = Image.new("RGB", (len(items) * (W + 20) + 20, H + 90), (245, 245, 248)); d = ImageDraw.Draw(s)
    for i, (label, im) in enumerate(items):
        x = 20 + i * (W + 20); d.text((x, 26), label, font=pop("Bold", 21), fill=(20, 20, 30))
        s.paste(im.convert("RGB").resize((W, H), Image.LANCZOS), (x, 70))
    s.save(path); print(path)


def main():
    base = Image.open(sys.argv[1]).convert("RGBA")
    sheet(title_variants(base), os.path.join(HERE, "opcoes_titulo.png"))
    sheet(caption_variants(base), os.path.join(HERE, "opcoes_legenda.png"))


if __name__ == "__main__":
    main()
