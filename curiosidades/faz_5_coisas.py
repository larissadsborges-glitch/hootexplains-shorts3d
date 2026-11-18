"""
"5 THINGS YOU DIDN'T KNOW ABOUT GTA 6" — v2, GAMEPLAY ONLY (owner 17 Nov: "Quero só factos do jogo em si, da gameplay").
v1 (records, Netflix, release gap) is kept in faz_5_coisas_v1_records.py.
Each scene = 1-3 pieces of the official trailers (16:9, kept whole in the middle, blurred copy behind) + an overlay PNG
(text in Poppins, key words yellow, plus a generated graphic: 6-star meter, hollow stars, switch, option chips).
  python faz_5_coisas.py sheet [en|pt]   -> stills sheet for the owner's OK (house rule: sheet before render)
  python faz_5_coisas.py video [en|pt]   -> the video (after the OK)
Text and sources: gta6_5_coisas.md
"""
import math, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = r"E:\clipper_dev\curiosidades"
FF = r"C:\Users\borge\.hoottools\ffmpeg\ffmpeg.exe"
F = os.path.join(os.path.expanduser("~"), ".hoottools", "fonts")
YEL, PINK, ORANGE, CYAN, NAVY = (255, 210, 50), (255, 42, 140), (255, 160, 30), (0, 229, 255), (14, 12, 30)
T1, T2, TL = "QdBZY2fkU-0.mp4", "VQRLujxTm3c.mp4", "rz1B4B2yBZY.mp4"  # Trailer 1, Trailer 2, Launch Trailer
WM = {"en": "@streamwentwild", "pt": "@livedescontrolada"}
MUSIC = r"C:\Users\borge\hoot\edits\wetransfer_1845\music\hip-hop-power.mp3"

# shots (checked frame by frame on 17 Nov, clips_check.jpg)
OPEN = [(T1, 12.0, 2.6)]
POLICE = [(TL, 70.4, 1.4), (T2, 107.6, 2.9), (TL, 72.4, 1.0)]            # police lights, cops, Lucia firing
WITNESS = [(T1, 43.9, 3.9), (T1, 47.9, 2.6)]                             # people posting you online, CCTV/bodycam
SWITCH = [(TL, 25.9, 1.5), (TL, 39.9, 1.9), (T2, 63.6, 3.1)]             # Lucia + Jason, Lucia -> Jason
TALK = [(T2, 13.9, 4.0), (TL, 20.4, 1.5)]                                # a local talking to you, the iguana
ROB = [(T1, 68.8, 1.6), (T1, 70.5, 2.0), (T1, 76.6, 2.0)]                # bandana robbery, getaway car, running out
CLOSE = [(T1, 79.0, 2.6)]

# (shots, text lines, words in yellow, graphic)
SCENES = {
 "en": [
  (OPEN, ["5 THINGS YOU", "DIDN'T KNOW", "ABOUT GTA 6"], {"5", "GTA", "6"}, None),
  (POLICE, ["THE WANTED LEVEL", "NOW GOES UP TO", "6 STARS"], {"WANTED", "6", "STARS"}, ("stars", "GTA V HAD ONLY 5")),
  (WITNESS, ["WITNESSES AND CAMERAS", "DESCRIBE YOU TO COPS", "AND THEY REMEMBER YOU"], {"WITNESSES", "CAMERAS", "REMEMBER"}, ("hollow", "HOLLOW STARS = THEY DON'T KNOW IT'S YOU YET")),
  (SWITCH, ["SWITCH BETWEEN", "LUCIA AND JASON", "WITH ONE BUTTON"], {"SWITCH", "LUCIA", "JASON", "ONE", "BUTTON"}, ("switch", None)),
  (TALK, ["HOLD ONE BUTTON TO", "INTERACT WITH PEOPLE", "AND EVEN ANIMALS"], {"INTERACT", "PEOPLE", "ANIMALS"}, ("chips", ["GREET", "TAUNT", "CALM DOWN"])),
  (ROB, ["IN ROBBERIES, YOUR", "DISGUISE AND GETAWAY CAR", "CHANGE HOW COPS REACT"], {"ROBBERIES", "DISGUISE", "GETAWAY", "CAR", "COPS"}, ("chips", ["DISGUISE", "GETAWAY CAR"])),
  (CLOSE, ["FOLLOW FOR MORE", "GTA 6"], {"FOLLOW", "GTA", "6"}, None),
 ],
 "pt": [
  (OPEN, ["5 COISAS QUE", "NÃO SABIAS", "SOBRE O GTA 6"], {"5", "GTA", "6"}, None),
  (POLICE, ["O NÍVEL DE PROCURADO", "AGORA VAI ATÉ", "6 ESTRELAS"], {"PROCURADO", "6", "ESTRELAS"}, ("stars", "NO GTA V ERAM SÓ 5")),
  (WITNESS, ["TESTEMUNHAS E CÂMARAS", "DÃO A TUA DESCRIÇÃO", "E A POLÍCIA LEMBRA-SE"], {"TESTEMUNHAS", "CÂMARAS", "LEMBRA-SE"}, ("hollow", "ESTRELAS VAZIAS = AINDA NÃO SABEM QUE ÉS TU")),
  (SWITCH, ["TROCAS ENTRE", "A LUCIA E O JASON", "COM UM SÓ BOTÃO"], {"TROCAS", "LUCIA", "JASON", "UM", "BOTÃO"}, ("switch", None)),
  (TALK, ["SEGURAS UM BOTÃO PARA", "INTERAGIR COM PESSOAS", "E ATÉ COM ANIMAIS"], {"INTERAGIR", "PESSOAS", "ANIMAIS"}, ("chips", ["CUMPRIMENTAR", "PROVOCAR", "ACALMAR"])),
  (ROB, ["NOS ASSALTOS, O DISFARCE", "E O CARRO DE FUGA MUDAM", "A REAÇÃO DA POLÍCIA"], {"ASSALTOS", "DISFARCE", "CARRO", "FUGA", "POLÍCIA"}, ("chips", ["DISFARCE", "CARRO DE FUGA"])),
  (CLOSE, ["SEGUE PARA MAIS", "GTA 6"], {"SEGUE", "GTA", "6"}, None),
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


def star(d, cx, cy, r, fill=None, outline=None, width=0):
    pts = [(cx + (r if k % 2 == 0 else r * 0.45) * math.sin(math.pi * k / 5), cy - (r if k % 2 == 0 else r * 0.45) * math.cos(math.pi * k / 5)) for k in range(10)]
    d.polygon([(x + 4, y + 6) for x, y in pts], fill=(0, 0, 0, 150))  # shadow
    d.polygon(pts, fill=fill, outline=outline, width=width)


def fit(d, text, w, size, max_w=990):
    f = font(w, size)
    while d.textlength(text, font=f) > max_w: size -= 2; f = font(w, size)
    return f


def chip(d, cx, cy, text, col, size=46):
    f = font("ExtraBold", size); tw = d.textlength(text, font=f)
    d.rounded_rectangle([cx - tw / 2 - 34 + 4, cy - 44 + 6, cx + tw / 2 + 34 + 4, cy + 44 + 6], radius=44, fill=(0, 0, 0, 150))
    d.rounded_rectangle([cx - tw / 2 - 34, cy - 44, cx + tw / 2 + 34, cy + 44], radius=44, fill=(*col, 255), outline=(255, 255, 255, 255), width=5)
    d.text((cx, cy), text, font=f, fill=NAVY if col == YEL else (255, 255, 255), anchor="mm")
    return tw + 68


def graphic(d, im, kind, label, lang):
    if kind == "stars":  # the wanted meter with a 6th star
        for k in range(6):
            cx = 540 + (k - 2.5) * 150
            star(d, cx, 1400, 62, fill=(*(YEL if k == 5 else (255, 255, 255)), 255), outline=(0, 0, 0, 255), width=6)
        d.rounded_rectangle([540 + 2.5 * 150 - 70, 1480, 540 + 2.5 * 150 + 70, 1530], radius=25, fill=(*PINK, 255))
        d.text((540 + 2.5 * 150, 1505), "NEW" if lang == "en" else "NOVA", font=font("ExtraBold", 30), fill=(255, 255, 255), anchor="mm")
        outlined(d, (540, 1600), label, font("ExtraBold", 52), (255, 255, 255))
    elif kind == "hollow":  # hollow stars: the cops are searching without knowing who you are
        for k in range(3):
            star(d, 540 + (k - 1) * 160, 1400, 66, fill=(0, 0, 0, 90), outline=(255, 255, 255, 255), width=9)
        a, b = label.split(" = ")
        outlined(d, (540, 1520), a + " =", fit(d, a + " =", "ExtraBold", 50), YEL)
        outlined(d, (540, 1590), b, fit(d, b, "ExtraBold", 50), (255, 255, 255))
    elif kind == "switch":  # LUCIA <-> JASON
        f = font("Black", 60)
        for cx, name, col in ((285, "LUCIA", PINK), (795, "JASON", CYAN)):
            tw = d.textlength(name, font=f)
            d.rounded_rectangle([cx - tw / 2 - 40, 1360, cx + tw / 2 + 40, 1470], radius=55, fill=(*col, 255), outline=(255, 255, 255, 255), width=6)
            d.text((cx, 1415), name, font=f, fill=NAVY if col == CYAN else (255, 255, 255), anchor="mm")
        for y, x0, x1 in ((1392, 470, 610), (1438, 610, 470)):  # two arrows (Poppins has no ⇄ glyph)
            tip = 1 if x1 > x0 else -1
            for off, col, wd in ((4, (0, 0, 0, 160), 14), (0, (*YEL, 255), 12)):
                d.line([(x0 + off, y + off), (x1 - tip * 22 + off, y + off)], fill=col, width=wd)
                d.polygon([(x1 + off, y + off), (x1 - tip * 30 + off, y - 20 + off), (x1 - tip * 30 + off, y + 20 + off)], fill=col)
    elif kind == "chips":  # the options as pills, centred, wrapped onto rows
        f = font("ExtraBold", 46); widths = [d.textlength(t, font=f) + 68 for t in label]
        rows, row, w = [], [], 0
        for t, tw in zip(label, widths):
            if row and w + tw + 24 > 1000: rows.append(row); row, w = [], 0
            row.append((t, tw)); w += tw + 24
        rows.append(row)
        cols = [YEL, PINK, CYAN, ORANGE]; k = 0
        for r, row in enumerate(rows):
            tot = sum(tw for _, tw in row) + 24 * (len(row) - 1); x = 540 - tot / 2
            for t, tw in row:
                chip(d, x + tw / 2, 1400 + r * 120, t, cols[k % 4]); x += tw + 24; k += 1


def overlay(i, scene, lang):
    _, lines, yellow, gr = scene
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


def still(i, scene, lang, shot=0):
    src, t0, dur = scene[0][shot]
    fr = frame(src, t0 + dur / 2)
    full = fr.resize((3413, 1920)).crop((1166, 0, 2246, 1920))
    if i in (0, len(SCENES[lang]) - 1): bg = full  # opening/closing: the shot fills the screen
    else:
        bg = full.filter(ImageFilter.GaussianBlur(30)).point(lambda v: int(v * 0.55)); bg.paste(fr.resize((1080, BAND_H)), (0, BAND_Y))
    bg = bg.convert("RGBA"); bg.alpha_composite(Image.open(overlay(i, scene, lang))); return bg.convert("RGB")


def sheet(lang):
    """top row: one still per scene; bottom row: every other shot of each fact, small, so the footage can be checked"""
    ims = [still(i, s, lang) for i, s in enumerate(SCENES[lang])]
    W, H = 300, 533
    extra = [[frame(sh[0], sh[1] + sh[2] / 2).resize((W, int(W * 9 / 16))) for sh in s[0][1:]] for s in SCENES[lang]]
    eh = max((len(e) for e in extra), default=0) * (int(W * 9 / 16) + 8)
    sh_ = Image.new("RGB", (len(ims) * (W + 12) + 12, H + 24 + eh), (240, 240, 244))
    for i, im in enumerate(ims):
        sh_.paste(im.resize((W, H), Image.LANCZOS), (12 + i * (W + 12), 12))
        for k, e in enumerate(extra[i]): sh_.paste(e, (12 + i * (W + 12), H + 20 + k * (int(W * 9 / 16) + 8)))
    p = os.path.join(HERE, f"folha_5_coisas_{lang}.png"); sh_.save(p); print(p)


# (owner 18 Nov: "Não seria melhor fazer o vídeo com um narrador? Este tipo de vídeos fazia sentido.") curiosity videos
# get a narrator (the no-narrator rule is for the drama series). One spoken line per scene; the scene lasts as long as
# its line (+ a breath) and the footage is slowed to fill it. Voices: ElevenLabs library, the ones the owner already heard:
# EN "Mark - Natural Conversations", PT "Maria" (pt-PT, the Unidos promo narrator).
NARR = {
 # (owner 18 Nov: "corrige erros na sintaxe e pausas desnecessárias na voz inglesa") one flowing sentence per line,
 # no fragments ("Even animals."), no ambiguous "they", no full stops in the middle (each one made the voice stop)
 "en": ["Here are five things you didn't know about GTA 6.",
        "The wanted level now goes up to six stars, while GTA 5 only had five.",
        "Witnesses and security cameras give the cops your description, and the police remember you even after you escape.",
        "You can switch between Lucia and Jason with a single button.",
        "You can hold one button to greet, taunt or calm down the people around you, and even animals.",
        "And in robberies, your disguise and your getaway car change how the police react.",
        "Follow for more GTA 6."],
 "pt": ["Cinco coisas que não sabias sobre o GTA 6.",
        "O nível de procurado agora vai até seis estrelas. No GTA 5 eram só cinco.",
        "Testemunhas e câmaras de vigilância dão a tua descrição à polícia, e eles lembram-se de ti, mesmo depois de fugires.",
        "Podes trocar entre a Lucia e o Jason com um só botão.",
        "Seguras um botão para interagir com as pessoas. Cumprimentar, provocar ou acalmar. E até com animais.",
        "E nos assaltos, o teu disfarce e o carro de fuga mudam a forma como a polícia reage.",
        "Segue para mais GTA 6."]}
VOICE = {"en": ("UgBBYS2sOqTuMpoF3BR0", {"stability": 0.4, "similarity_boost": 0.8, "style": 0.3, "use_speaker_boost": True, "speed": 1.05}),
         "pt": ("iLelOQ6m5mpSeNH8fRob", {"stability": 0.55, "similarity_boost": 0.9, "style": 0.15, "use_speaker_boost": True, "speed": 1.05})}
GAP = 0.08  # breath after each line (owner 18 Nov: no unnecessary pauses; each scene is now as long as its line)
MIN_SCENE = 1.6
MUSIC_VOL = 0.07  # (owner 18 Nov: "mete a música mais baixo"; was 0.16)
# long silences inside a line are cut to 0.15 s; silence before/after a line is removed
TRIM = ("silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03,"
        "silenceremove=stop_periods=-1:stop_duration=0.25:stop_threshold=-45dB:stop_silence=0.15")


def narrate(lang, redo=False):
    """-> [(mp3 path, seconds)] one per scene. The key is read from file and never printed."""
    import json, urllib.request
    vid, settings = VOICE[lang]; out = []
    for i, text in enumerate(NARR[lang]):
        p = os.path.join(SRC, f"vo_{lang}_{i}.mp3")
        if redo or not os.path.exists(p):
            key = open(r"C:\Users\borge\hoot\.elevenlabs_key", encoding="utf-8").read().strip()
            body = {"text": text, "model_id": "eleven_multilingual_v2", "voice_settings": settings,
                    "previous_text": NARR[lang][i - 1] if i else None, "next_text": NARR[lang][i + 1] if i + 1 < len(NARR[lang]) else None}
            req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{vid}?output_format=mp3_44100_128",
                                         data=json.dumps(body).encode(), headers={"xi-api-key": key, "Content-Type": "application/json"})
            open(p, "wb").write(urllib.request.urlopen(req, timeout=120).read())
        w = p[:-4] + "_t.wav"  # the line with its long pauses cut
        subprocess.run([FF, "-v", "error", "-y", "-i", p, "-af", TRIM, "-ar", "48000", w], check=True)
        d = float(subprocess.run([FF.replace("ffmpeg.exe", "ffprobe.exe"), "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", w],
                                 capture_output=True, text=True).stdout)
        out.append((w, d))
    return out


def video(lang):
    parts, ins, n_in, labels = [], [], 0, []
    vo = narrate(lang); starts, t = [], 0.0
    for i, s in enumerate(SCENES[lang]):
        ov = overlay(i, s, lang); full = i in (0, len(SCENES[lang]) - 1)
        shots = sum(d for _, _, d in s[0]); want = max(vo[i][1] + GAP, MIN_SCENE); f = want / shots
        starts.append(t); t += want
        for j, (src, t0, dur) in enumerate(s[0]):
            # longer line -> the footage slows; shorter line -> each shot is cut shorter (no dead air)
            src_d, sp = (dur, f"setpts=PTS*{f:.4f},") if f >= 1 else (dur * f, "")
            ins += ["-ss", f"{t0:.2f}", "-t", f"{src_d:.3f}", "-i", os.path.join(SRC, src), "-loop", "1", "-t", f"{dur * f:.3f}", "-i", ov]
            v, o, k = n_in, n_in + 1, f"{i}_{j}"; n_in += 2
            if full:
                parts.append(f"[{v}:v]{sp}scale=3413:1920,crop=1080:1920,fps=60,setsar=1[b{k}];[b{k}][{o}:v]overlay=0:0:shortest=1,format=yuv420p[s{k}]")
            else:
                parts.append(f"[{v}:v]{sp}split[a{k}][c{k}];[a{k}]scale=3413:1920,crop=1080:1920,gblur=sigma=30,eq=brightness=-0.25[bg{k}];"
                             f"[c{k}]scale=1080:{BAND_H}[fg{k}];[bg{k}][fg{k}]overlay=0:{BAND_Y}[m{k}];[m{k}][{o}:v]overlay=0:0:shortest=1,fps=60,setsar=1,format=yuv420p[s{k}]")
            labels.append(f"[s{k}]")
    total = t
    # music: "Hip Hop Power" by kulakovka, Pixabay Content License (free, no attribution) - edits/wetransfer_1845/music/LICENCE.txt
    ins += ["-i", MUSIC]; mus = n_in; n_in += 1
    vlabs = []
    for i, (p, d) in enumerate(vo):
        ins += ["-i", p]; ms = int((starts[i] + 0.05) * 1000)
        parts.append(f"[{n_in}:a]aresample=48000,adelay={ms}|{ms}[vo{i}]"); vlabs.append(f"[vo{i}]"); n_in += 1
    fc = (";".join(parts) + ";" + "".join(labels) + f"concat=n={len(labels)}:v=1:a=0[v];"
          + "".join(vlabs) + f"amix=inputs={len(vlabs)}:normalize=0,apad,atrim=0:{total:.2f}[voice];"
          f"[{mus}:a]aresample=48000,atrim=0:{total:.2f},volume={MUSIC_VOL},afade=t=in:d=0.3,afade=t=out:st={total - 1.5:.2f}:d=1.5[mus];"
          f"[voice][mus]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5,aresample=48000[a]")
    out = os.path.join(HERE, f"GTA6_5_coisas_{lang}.mp4")
    subprocess.run([FF, "-v", "error", "-y", *ins, "-filter_complex", fc, "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-crf", "16",
                    "-preset", "slow", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", out], check=True)
    print(out)


COVER_SHOT = (T2, 65.0, 0.37)  # (owner 17 Nov: covers for every video) Lucia at the prison fence (sharp, still), crop centred at 37 % of the width
COVER_TEXT = {"en": ("5 THINGS YOU DIDN'T KNOW ABOUT GTA 6", {"5", "gta", "6"}),
              "pt": ("5 COISAS QUE NÃO SABIAS NO GTA 6", {"5", "gta", "6"})}


def cover(lang):
    sys.path.insert(0, os.path.dirname(HERE)); import capa
    src, t, cx = COVER_SHOT
    fr = frame(src, t); g = fr.convert("L")
    rows = [y for y in range(fr.height) if sum(g.crop((0, y, fr.width, y + 1)).getdata()) / fr.width > 12]  # drop the letterbox bars
    fr = fr.crop((0, rows[0] + 2, fr.width, rows[-1] - 2)); W = int(fr.width * 1920 / fr.height)
    fr = fr.resize((W, 1920), Image.LANCZOS); x0 = int(min(max(cx * W - 540, 0), W - 1080))
    title, keys = COVER_TEXT[lang]
    p = capa.make(fr.crop((x0, 0, x0 + 1080, 1920)), title, out=os.path.join(HERE, f"GTA6_5_coisas_{lang}_capa.jpg"), t=0, keywords=keys, handle=WM[lang])
    print(p)


if __name__ == "__main__":
    what, lang = sys.argv[1], (sys.argv[2] if len(sys.argv) > 2 else "en")
    {"sheet": sheet, "video": video, "capa": cover}[what](lang)
