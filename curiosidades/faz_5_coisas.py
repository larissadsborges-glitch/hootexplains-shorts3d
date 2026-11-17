"""
"5 THINGS YOU DIDN'T KNOW ABOUT GTA 6" (owner 17 Nov: Rockstar footage allowed; generate images where they help).
Each scene = a piece of an official trailer (16:9, kept whole in the middle, blurred copy behind) + an overlay PNG
(text in Poppins, key words yellow, plus a generated graphic: counter, regions map, #1 badge, timeline).
  python faz_5_coisas.py sheet [en|pt]   -> stills sheet for the owner's OK (house rule: sheet before render)
  python faz_5_coisas.py video [en|pt]   -> the video (after the OK)
Text and sources: gta6_5_coisas.md
"""
import os, subprocess, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = r"E:\clipper_dev\curiosidades"
FF = r"C:\Users\borge\.hoottools\ffmpeg\ffmpeg.exe"
F = os.path.join(os.path.expanduser("~"), ".hoottools", "fonts")
YEL, PINK, ORANGE, CYAN, NAVY = (255, 210, 50), (255, 42, 140), (255, 160, 30), (0, 229, 255), (14, 12, 30)
T1, T2, TL = "QdBZY2fkU-0.mp4", "VQRLujxTm3c.mp4", "rz1B4B2yBZY.mp4"
WM = {"en": "@streamwentwild", "pt": "@livedescontrolada"}

# (trailer, start s, length s, text lines, words in yellow, graphic)
SCENES = {
 "en": [
  (T1, 12.0, 2.6, ["5 THINGS YOU", "DIDN'T KNOW", "ABOUT GTA 6"], {"5", "GTA", "6"}, None),
  (T1, 22.0, 6.5, ["THE FIRST TRAILER GOT", "90.4 MILLION VIEWS", "IN 24 HOURS"], {"90.4", "MILLION", "24", "HOURS"}, ("counter", "GUINNESS WORLD RECORD")),
  (T2, 63.0, 6.5, ["LUCIA IS THE FIRST", "FEMALE LEAD IN A GTA", "AND YOU SWITCH TO JASON"], {"LUCIA", "FIRST", "FEMALE", "LEAD", "SWITCH", "JASON"}, None),
  (T1, 30.5, 6.5, ["VICE CITY IS BACK", "IN LEONIDA, ROCKSTAR'S", "FLORIDA: 6 REGIONS"], {"VICE", "CITY", "LEONIDA", "FLORIDA", "6", "REGIONS"}, ("regions", None)),
  (TL, 45.0, 6.5, ["ITS FIRST GAMEPLAY", "PREMIERED ON NETFLIX", "AND WENT #1"], {"NETFLIX", "#1"}, ("badge", "TOP 10 MOVIES")),
  (TL, 81.0, 6.5, ["IT COMES OUT 13 YEARS", "AFTER GTA V: THE", "LONGEST WAIT EVER"], {"13", "YEARS", "LONGEST", "WAIT"}, ("timeline", None)),
  (T1, 79.0, 2.6, ["FOLLOW FOR MORE", "GTA 6"], {"FOLLOW", "GTA", "6"}, None),
 ],
 "pt": [
  (T1, 12.0, 2.6, ["5 COISAS QUE", "NÃO SABIAS", "SOBRE O GTA 6"], {"5", "GTA", "6"}, None),
  (T1, 22.0, 6.5, ["O PRIMEIRO TRAILER TEVE", "90,4 MILHÕES DE VIEWS", "EM 24 HORAS"], {"90,4", "MILHÕES", "24", "HORAS"}, ("counter", "RECORDE DO GUINNESS")),
  (T2, 63.0, 6.5, ["A LUCIA É A PRIMEIRA", "PROTAGONISTA MULHER", "E TROCAS COM O JASON"], {"LUCIA", "PRIMEIRA", "PROTAGONISTA", "MULHER", "TROCAS", "JASON"}, None),
  (T1, 30.5, 6.5, ["VICE CITY VOLTOU", "EM LEONIDA, A FLORIDA", "DA ROCKSTAR: 6 REGIÕES"], {"VICE", "CITY", "LEONIDA", "FLORIDA", "6", "REGIÕES"}, ("regions", None)),
  (TL, 45.0, 6.5, ["O PRIMEIRO GAMEPLAY", "ESTREOU NA NETFLIX", "E FICOU EM #1"], {"NETFLIX", "#1"}, ("badge", "TOP 10 FILMES")),
  (TL, 81.0, 6.5, ["SAI 13 ANOS DEPOIS", "DO GTA V: A MAIOR", "ESPERA DE SEMPRE"], {"13", "ANOS", "MAIOR", "ESPERA"}, ("timeline", None)),
  (T1, 79.0, 2.6, ["SEGUE PARA MAIS", "GTA 6"], {"SEGUE", "GTA", "6"}, None),
 ]}
BAND_Y, BAND_H = 656, 608  # the 16:9 footage, whole, in the middle


def font(w, s): return ImageFont.truetype(os.path.join(F, f"Poppins-{w}.ttf"), s)


def outlined(d, xy, text, f, fill, anchor="mm", stroke=8):
    d.text((xy[0] + 5, xy[1] + 7), text, font=f, fill=(0, 0, 0, 140), anchor=anchor, stroke_width=stroke, stroke_fill=(0, 0, 0, 140))
    d.text(xy, text, font=f, fill=fill, anchor=anchor, stroke_width=stroke, stroke_fill=(0, 0, 0))


def text_block(d, lines, yellow, y, size=78):
    f = font("ExtraBold", size)
    while max(d.textlength(l, font=f) for l in lines) > 990: size -= 2; f = font("ExtraBold", size)  # every line fits
    for ln in lines:
        x = 540 - d.textlength(ln, font=f) / 2
        for w in ln.split():
            col = YEL if w.strip(",.:!?'") in yellow or w in yellow else (255, 255, 255)
            outlined(d, (x, y), w, f, col, anchor="lm"); x += d.textlength(w + " ", font=f)
        y += size * 0.95


def graphic(d, im, kind, label, lang):
    if kind == "counter":  # a big view counter + a record seal
        f = font("Black", 120); outlined(d, (540, 1400), "90,421,491", f, YEL, stroke=9)
        f2 = font("ExtraBold", 50); outlined(d, (540, 1500), "VIEWS · 24H" if lang == "en" else "VIEWS · 24 HORAS", f2, (255, 255, 255))
        d.rounded_rectangle([290, 1560, 790, 1640], radius=40, fill=(*PINK, 255)); d.text((540, 1600), label, font=font("ExtraBold", 40), fill=(255, 255, 255), anchor="mm")
    elif kind == "regions":  # the 6 regions as map pins
        names = ["VICE CITY", "LEONIDA KEYS", "GRASSRIVERS", "PORT GELLHORN", "AMBROSIA", "MOUNT KALAGA"]
        f = font("ExtraBold", 40)
        for i, n in enumerate(names):
            x = 270 + (i % 2) * 540; y = 1360 + (i // 2) * 90
            d.ellipse([x - 200, y - 14, x - 172, y + 14], fill=(*([YEL, ORANGE, PINK][i % 3]), 255))
            d.text((x - 155, y), n, font=f, fill=(255, 255, 255), anchor="lm", stroke_width=5, stroke_fill=(0, 0, 0))
    elif kind == "badge":  # a "#1" badge (no Netflix logo)
        d.ellipse([400, 1320, 680, 1600], fill=(*PINK, 255), outline=(255, 255, 255, 255), width=10)
        d.text((540, 1460), "#1", font=font("Black", 140), fill=(255, 255, 255), anchor="mm")
        outlined(d, (540, 1660), label, font("ExtraBold", 50), YEL)
    elif kind == "timeline":  # GTA V 2013 -> GTA VI 2026
        d.line([(200, 1460), (880, 1460)], fill=(255, 255, 255, 255), width=10)
        for x, yr, nm, col in ((200, "2013", "GTA V", (255, 255, 255)), (880, "2026", "GTA VI", YEL)):
            d.ellipse([x - 30, 1430, x + 30, 1490], fill=(*col, 255))
            outlined(d, (x, 1380), yr, font("Black", 70), col); outlined(d, (x, 1550), nm, font("ExtraBold", 50), col)
        outlined(d, (540, 1420), "13", font("Black", 90), YEL)


def overlay(i, scene, lang):
    _, _, _, lines, yellow, gr = scene
    im = Image.new("RGBA", (1080, 1920), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    last = i == len(SCENES[lang]) - 1
    if 0 < i < len(SCENES[lang]) - 1:  # the fact number
        d.rounded_rectangle([440, 150, 640, 240], radius=45, fill=(*YEL, 255)); d.text((540, 195), f"{i}/5", font=font("Black", 64), fill=NAVY, anchor="mm")
    text_block(d, lines, yellow, 330 if (0 < i and not last) else 760, 78 if (0 < i and not last) else 104)
    if gr: graphic(d, im, gr[0], gr[1], lang)
    outlined(d, (1050, 1860), WM.get(lang, ""), font("ExtraBold", 38), (255, 255, 255), anchor="rm", stroke=4)
    p = os.path.join(SRC, f"ov_{lang}_{i}.png"); im.save(p); return p


def frame(src, t):
    out = os.path.join(SRC, "_f.png")
    subprocess.run([FF, "-v", "error", "-y", "-ss", f"{t:.2f}", "-i", os.path.join(SRC, src), "-frames:v", "1", out], check=True)
    return Image.open(out).convert("RGB")


def still(i, scene, lang):
    src, t0, dur = scene[:3]
    fr = frame(src, t0 + dur / 2)
    bg = fr.resize((int(1920 * 1920 / 1080), 1920)).crop((0, 0, 1080, 1920)) if False else fr.resize((3413, 1920)).crop((1166, 0, 2246, 1920))
    bg = bg.filter(ImageFilter.GaussianBlur(30)).point(lambda v: int(v * 0.55))
    if i in (0, len(SCENES[lang]) - 1): bg = fr.resize((3413, 1920)).crop((1166, 0, 2246, 1920))  # opening/closing: the shot fills the screen
    else: bg.paste(fr.resize((1080, BAND_H)), (0, BAND_Y))
    bg = bg.convert("RGBA"); bg.alpha_composite(Image.open(overlay(i, scene, lang))); return bg.convert("RGB")


def sheet(lang):
    ims = [still(i, s, lang) for i, s in enumerate(SCENES[lang])]
    W, H = 300, 533
    sh = Image.new("RGB", (len(ims) * (W + 12) + 12, H + 24), (240, 240, 244))
    for i, im in enumerate(ims): sh.paste(im.resize((W, H), Image.LANCZOS), (12 + i * (W + 12), 12))
    p = os.path.join(HERE, f"folha_5_coisas_{lang}.png"); sh.save(p); print(p)


def video(lang):
    parts, ins = [], []
    for i, s in enumerate(SCENES[lang]):
        src, t0, dur = s[:3]; ov = overlay(i, s, lang)
        ins += ["-ss", f"{t0:.2f}", "-t", f"{dur:.2f}", "-i", os.path.join(SRC, src), "-loop", "1", "-t", f"{dur:.2f}", "-i", ov]
        v, o = 2 * i, 2 * i + 1
        if i in (0, len(SCENES[lang]) - 1):
            parts.append(f"[{v}:v]scale=3413:1920,crop=1080:1920,fps=60,setsar=1[b{i}];[b{i}][{o}:v]overlay=0:0,format=yuv420p[s{i}]")
        else:
            parts.append(f"[{v}:v]split[a{i}][c{i}];[a{i}]scale=3413:1920,crop=1080:1920,gblur=sigma=30,eq=brightness=-0.25[bg{i}];"
                         f"[c{i}]scale=1080:{BAND_H}[fg{i}];[bg{i}][fg{i}]overlay=0:{BAND_Y}[m{i}];[m{i}][{o}:v]overlay=0:0,fps=60,setsar=1,format=yuv420p[s{i}]")
    n = len(SCENES[lang])
    fc = ";".join(parts) + ";" + "".join(f"[s{i}]" for i in range(n)) + f"concat=n={n}:v=1:a=0[v]"
    out = os.path.join(HERE, f"GTA6_5_coisas_{lang}.mp4")
    subprocess.run([FF, "-v", "error", "-y", *ins, "-filter_complex", fc, "-map", "[v]", "-c:v", "libx264", "-crf", "16", "-preset", "slow", out], check=True)
    print(out)


if __name__ == "__main__":
    what, lang = sys.argv[1], (sys.argv[2] if len(sys.argv) > 2 else "en")
    sheet(lang) if what == "sheet" else video(lang)
