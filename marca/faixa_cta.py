"""
The bottom band under the game (owner 17 Nov: "use that rectangle: follow us / GTA 6 every day... in the logo's colours;
the chat can go there too"). One design per logo option, so the owner picks the logo AND the brand colours at once.
  python faixa_cta.py BASE_FRAME.png -> opcoes_faixa.png
The TikTok/Reels/Shorts buttons and caption cover roughly the bottom 280 px and the right 130 px: the CTA sits right
under the game (always visible), the chat under it (fine if the app's caption covers part of it).
"""
import os, sys
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
BLK = "C:/Windows/Fonts/ariblk.ttf"; REG = "C:/Windows/Fonts/arialbd.ttf"
PALETTES = {  # from logo_A / logo_B / logo_C
    "A": {"g1": (255, 42, 140), "g2": (255, 160, 30), "acc": (0, 229, 255), "txt": (255, 255, 255)},
    "B": {"g1": (255, 212, 40), "g2": (255, 110, 20), "acc": (255, 40, 60), "txt": (20, 16, 40)},
    "C": {"g1": (255, 225, 60), "g2": (255, 120, 30), "acc": (80, 200, 255), "txt": (20, 16, 40)},
}
CTA = {"en": "FOLLOW FOR DAILY GTA 6 CLIPS", "pt": "SEGUE PRA CORTES DE GTA 6 TODO DIA", "es": "SÍGUENOS: CLIPS DE GTA 6 CADA DÍA"}


def band(img, k, lang="en", game_bottom=1542, chat=("LMAOOO", "he missed everything", "rookie KEKW")):
    pal = PALETTES[k]; im = img.copy(); d = ImageDraw.Draw(im, "RGBA")
    y0 = game_bottom + 14; h = 84
    g = Image.new("RGB", (1000, h)); gp = g.load()
    for x in range(1000):
        t = x / 999; c = tuple(int(pal["g1"][i] + (pal["g2"][i] - pal["g1"][i]) * t) for i in range(3))
        for y in range(h): gp[x, y] = c
    m = Image.new("L", (1000, h), 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, 999, h - 1], radius=h // 2, fill=255)
    im.paste(g, (40, y0), m)
    logo = Image.open(os.path.join(HERE, f"logo_{k}.png")).resize((h - 12, h - 12), Image.LANCZOS)
    lm = Image.new("L", logo.size, 0); ImageDraw.Draw(lm).ellipse([0, 0, logo.size[0] - 1, logo.size[1] - 1], fill=255)
    im.paste(logo, (46, y0 + 6), lm)
    f = ImageFont.truetype(BLK, 40); txt = CTA[lang]
    while d.textlength(txt, font=f) > 870: f = ImageFont.truetype(BLK, f.size - 2)
    d.text((40 + h + 14, y0 + (h - f.size) / 2 - 4), txt, font=f, fill=pal["txt"])
    fc = ImageFont.truetype(REG, 38); y = y0 + h + 22
    for line in chat:  # the live chat, under the CTA (same look as in the clips: dark boxes)
        w = d.textlength(line, font=fc); d.rounded_rectangle([40, y, 40 + w + 24, y + 54], radius=10, fill=(0, 0, 0, 150))
        d.text((52, y + 6), line, font=fc, fill=(255, 255, 255)); y += 64
    return im


def main():
    base = Image.open(sys.argv[1]).convert("RGB")
    shots = [(k, band(base, k)) for k in "ABC"] + [("A · PT", band(base, "A", "pt")), ("A · ES", band(base, "A", "es"))]
    W, H = 400, 711
    sheet = Image.new("RGB", (len(shots) * (W + 20) + 20, H + 300), (245, 245, 248)); sd = ImageDraw.Draw(sheet)
    for i, (k, im) in enumerate(shots):
        x = 20 + i * (W + 20)
        sd.text((x, 16), f"LOGO {k}", font=ImageFont.truetype(BLK, 30), fill=(20, 20, 30))
        sheet.paste(im.resize((W, H), Image.LANCZOS), (x, 64))
        crop = im.crop((0, 1500, 1080, 1920)).resize((W, int(420 * W / 1080)), Image.LANCZOS)  # the band, bigger
        sheet.paste(crop, (x, H + 80))
    out = os.path.join(HERE, "opcoes_faixa.png"); sheet.save(out); print(out)


if __name__ == "__main__":
    main()
