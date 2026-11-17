"""
The 'post card' look (owner 17 Nov, 2nd example clip: "this is good too"): a white header like a social post - the
page's logo, name and @, and the context line - then the WHOLE 16:9 stream with rounded corners on black, and
colourful captions (2-3 words, each word its own colour). Used for chat / big-webcam clips (face mode): the full frame,
no crop, nobody's head ever cut. (No 'verified' tick: faking one gets accounts removed.)
"""
import json, os, re, textwrap
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(os.path.expanduser("~"), ".hoottools", "fonts")
HEADER_H = 472
INSET_X, INSET_Y, INSET_W, INSET_H = 158, 562, 764, 1358  # (3rd example) the vertical clip on a white page
VID_X, VID_Y, VID_W = 24, 760, 1032
VID_H = int(VID_W * 9 / 16) // 2 * 2
RADIUS = 44
NAMES = {"en": "Stream Went Wild", "pt": "Live Descontrolada", "es": "Directo Descontrolado"}
COLORS = ["&H00C76EFF&", "&H00FFD03F&", "&H006BFF7C&", "&H004DE4FF&", "&H00508CFF&"]  # ASS BGR: pink, cyan, green, yellow, orange


def brand(lang):
    try: m = json.load(open(os.path.join(HERE, "marca", "marca.json"), encoding="utf-8"))
    except (OSError, ValueError): m = {}
    handle = m.get((lang or "en")[:2], "")
    logo = m.get("logo") or os.path.join(HERE, "marca", "logo_A.png")
    return NAMES.get((lang or "en")[:2], NAMES["en"]), handle, logo


def sentence(t):
    """THE AI HOOK IN CAPS -> The ai hook in sentence case (the card reads like a post)"""
    t = (t or "").strip().strip('"“”')
    if not t: return ""
    if t != t.upper(): return t  # already written in normal case
    t = t.lower(); t = t[0].upper() + t[1:]
    return re.sub(r"\b(gta)\b", "GTA", t)


def header_png(path, hook, lang, inset=False):
    """inset=False: 2nd example (header, the 16:9 stream rounded on black); True: 3rd example (white page, the
    vertical clip inset under the header)"""
    name, handle, logo = brand(lang)
    im = Image.new("RGBA", (1080, 1920), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 1080, INSET_Y if inset else HEADER_H], fill=(255, 255, 255, 255))
    try:
        lg = Image.open(logo).convert("RGB").resize((150, 150), Image.LANCZOS)
        m = Image.new("L", (600, 600), 0); ImageDraw.Draw(m).ellipse([0, 0, 599, 599], fill=255)
        im.paste(lg, (200, 85), m.resize((150, 150), Image.LANCZOS))
    except OSError: pass
    fb = ImageFont.truetype(os.path.join(FONTS, "Poppins-Bold.ttf"), 56)
    fr = ImageFont.truetype(os.path.join(FONTS, "Poppins-Bold.ttf"), 38)
    d.text((380, 98), name, font=fb, fill=(15, 15, 15)); d.text((380, 170), handle, font=fr, fill=(110, 110, 110))
    txt = sentence(hook)
    fh = ImageFont.truetype(os.path.join(FONTS, "Poppins-Bold.ttf"), 54)
    lines = textwrap.wrap(txt, 30)[:2]
    y = (390 if len(lines) == 2 else 430) if inset else (285 if len(lines) == 2 else 320)
    for ln in lines:
        w = d.textlength(ln, font=fh); d.text(((1080 - w) / 2, y), ln, font=fh, fill=(15, 15, 15)); y += 72
    if inset:  # white page around the clip
        mask = Image.new("L", (1080, 1920), 255); md = ImageDraw.Draw(mask)
        md.rectangle([0, 0, 1080, INSET_Y], fill=0); md.rectangle([INSET_X, INSET_Y, INSET_X + INSET_W - 1, 1919], fill=0)
        white = Image.new("RGBA", (1080, 1920), (255, 255, 255, 255)); white.putalpha(mask); im.alpha_composite(white)
        im.save(path); return path
    # black outside the rounded video window (the corners), so the video shows through a rounded rectangle
    mask = Image.new("L", (1080, 1920), 255); md = ImageDraw.Draw(mask)
    md.rectangle([0, 0, 1080, HEADER_H], fill=0)
    md.rounded_rectangle([VID_X, VID_Y, VID_X + VID_W - 1, VID_Y + VID_H - 1], radius=RADIUS, fill=0)
    black = Image.new("RGBA", (1080, 1920), (0, 0, 0, 255)); black.putalpha(mask)
    im.alpha_composite(black)
    im.save(path)
    return path


def wrap(png):
    """(3rd example) [in] = the finished 1080x1920 clip (captions on) -> [v]: inset on the white page under the header"""
    p = png.replace("\\", "/").replace(":", "\\:")
    sc = "flags=lanczos+accurate_rnd+full_chroma_int"
    return (f"[in]scale={INSET_W}:{INSET_H}:{sc},setsar=1[ins];color=c=white:s=1080x1920:r=60[wb];[wb][ins]overlay={INSET_X}:{INSET_Y}:shortest=1[w1];"
            f"movie='{p}',format=rgba[hd];[w1][hd]overlay=0:0[v]")


def filters(lay, png):
    """input [0:v] -> [st]: the whole stream 1032 wide, rounded, under the header png. -> (filter, caption y)"""
    p = png.replace("\\", "/").replace(":", "\\:")
    sc = "flags=lanczos+accurate_rnd+full_chroma_int"
    f = (f"[0:v]scale={VID_W}:{VID_H}:{sc},setsar=1[vid];color=c=black:s=1080x1920:r=60[bg];"
         f"[bg][vid]overlay={VID_X}:{VID_Y}:shortest=1[b1];movie='{p}',format=rgba[hd];[b1][hd]overlay=0:0[st]")
    return f, VID_Y + VID_H - 150


def ass_words(ws, dur, y):
    """colourful captions: 2-3 words a line, each word its own colour, the one being said a bit bigger"""
    ev, cur, chunks = [], [], []
    for k, wd in enumerate(ws):
        cur.append(wd); nxt = ws[k + 1] if k + 1 < len(ws) else None
        if len(cur) == 3 or wd[2][-1:] in ".?!" or not nxt or nxt[0] - wd[1] >= 0.45: chunks.append(cur); cur = []
    ci = 0
    for n, ch in enumerate(chunks):
        nxt0 = chunks[n + 1][0][0] if n + 1 < len(chunks) else None
        end = min(ch[-1][1] + 0.35, nxt0) if nxt0 is not None else ch[-1][1] + 0.35
        for j, (s, e, _) in enumerate(ch):
            e2 = ch[j + 1][0] if j + 1 < len(ch) else end
            parts = []
            for k, (_, _, w) in enumerate(ch):
                c = COLORS[(ci + k) % len(COLORS)]
                size = "\\fscx118\\fscy118" if k == j else ""
                parts.append(f"{{\\c{c}{size}}}{w.upper().strip('.,!?')}{{\\fscx100\\fscy100}}")
            ev.append(f"Dialogue: 0,{_t(s)},{_t(max(e2, s + 0.05))},Card,,0,0,0,,{{\\an5\\pos(540,{y})}}" + " ".join(parts))
        ci += len(ch)
    return ev


def _t(t):
    h, r = divmod(max(0.0, t), 3600); m, s = divmod(r, 60); return f"{int(h)}:{int(m):02d}:{s:05.2f}"


CARD_STYLE = "Style: Card,Poppins ExtraBold,84,&H00FFFFFF,&H00FFFFFF,&H00202020,&H90000000,0,0,0,0,100,100,0,0,1,2,4,5,40,40,0,1\n"
