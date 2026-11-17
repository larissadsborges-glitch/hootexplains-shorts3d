"""
What a chat message tells us (owner 16 Nov: "shouldn't there be more reaction messages? research it").

Research notes (16 Nov 2026):
- Twitch highlight papers (MINT, EPJ Data Science 2021; LIGHTOR, SFU) and open tools agree that EMOTES and short reactions
  carry the signal, more than raw message counts; counting emotes makes it language-independent.
- Most of chat's reactions are third-party emotes (7TV / BetterTTV / FrankerFaceZ: KEKW, ICANT, OMEGALUL, Pog, monkaS...)
  plus each channel's own sub emotes (xqcLUL, gauleKEK...), so names are matched by PART (LUL, KEK, Pog, monka...).
- Floods that are NOT moments: raids (hundreds of "raid" messages), gift-sub bombs ("thanks for the gift"), bots, !commands,
  one person spamming. Those are muted or counted once.

Each message gets ONE category and a weight; the detector counts each chatter once per 5 s bin (their strongest message).
"""
import json, re, urllib.request

W = {"clip": 4.0, "funny": 2.0, "shock": 2.0, "hype": 2.0, "sad": 1.5, "emote": 1.3, "plain": 1.0, "ignore": 0.0}

# whole-message one-letter reactions (W in chat = win, L = loss, F = respects)
SOLO = {"w": "hype", "ww": "hype", "www": "hype", "l": "sad", "ll": "sad", "lll": "sad", "f": "sad", "+1": "hype",
        "?": "shock", "??": "shock", "???": "shock", "!": "shock", "!!": "shock", "o7": "sad", "d:": "shock", "+2": "funny"}

# words and phrases, lower-case, EN + PT-BR + ES (the two account languages and the big GTA Kick audience)
WORDS = {
    "clip": r"clip+(ed|ped|s|it|that)?|clip (it|that|this)|\+clip|clipa+|clipem|clipar|clipado|clipe|clipea|clipeen",
    "funny": r"lo+l+|lu+l+w?|ke+k+w?|kekl|omegalul|icant|i cant|i can'?t|lma+o+|lmfa+o+|rofl|a?(ha){2,}h?|(ah){2,}|(he){3,}|"
             r"k{3,}|(rs){2,}|(ja){2,}|(je){2,}|x+d+|dead|im dead|i'?m dead|crying|i'?m crying|bru+h+|morri|morto|tô morto|"
             r"to morto|chorando|kakaka|hue(hue)+|me mijei|pepelaugh|pepega|omegadanc\w*",
    "shock": r"wtf+|wth|wha+t+|hu+h+|no wa+y+|na+h+|omg+|oh my god|oh my gosh|holy( shit| moly| fuck)?|jesus|jeez|bro+|"
             r"du+de+|yo+o+|wai+t+|what the|mds+|meu deus|caralho|carai|crl|que isso|q isso|oq+|oxe|nossa|eita|vish|"
             r"socorro|n[aã]o acredito|madre m[ií]a|qu[eé] (es eso|pas[oó])|dios m[ií]o|monka\w*|wutface|aware|stare|"
             r"flashbang|concerned|waytoodank|sheesh",
    "hype": r"po+g+|pogu|pogchamp|poggers|pagchomp|pagman|huge|insane|insano|goat(ed)?|clean|e+z+|let'?s go+|lets+ go+|"
            r"lfg|gigachad|chad|cracked|vamo+|bora+|brabo|braba|monstro|absurdo|craque|lenda|que jogada|wicked|kreygasm|"
            r"based|god(like)?|clutch|vamos+|golazo",
    "sad": r"rip|sadge|unlucky|no+o{3,}|n[aã]o+o{3,}|press f|deadge|pepehands|biblethump|pqp|que pena|f in (the )?chat|"
           r"noooo|sad|ripbozo",
}
WORD_RE = {k: re.compile(r"(?<![\w])(" + v + r")(?![\w])", re.I) for k, v in WORDS.items()}
EMOJI = {"funny": "😂🤣💀😭😆😹☠", "shock": "😱😳🤯😨😮😲‼⁉🫢", "hype": "🔥🐐💯🏆🙌👏💪🚀", "sad": "😢😞💔🥀🫡"}

# emote NAMES (case-sensitive parts), incl. channel sub emotes like xqcLUL / gauleKEK / caseohPog
EMOTE_PART = {
    "funny": re.compile(r"LUL|KEK|LMAO|ICANT|OMEGA|Laugh|LAUGH|Giggle|GIGGLE|HAHA|xdd|ROFL|Pepega|Clueless|Lmao|Lul|Kek"),
    "shock": re.compile(r"monka|Monka|MONKA|WTF|HUH|Huh|WutFace|Stare|STARE|Aware|FLASHBANG|Concerned|Shock|SHOCK|Scared|"
                        r"Panic|D:|dudWhat|Erm|BRUH|Bruh|OMG|NotLikeThis|Jebaited"),
    "hype": re.compile(r"Pog|POG|Pag|OOOO|LETSGO|LetsGo|Hype|HYPE|GIGACHAD|Gigachad|Chad|CHAD|Clap|CLAP|WICKED|Kreygasm|"
                       r"EZ$|^EZ|GOAT|Goat|PogU|COGGERS"),
    "sad": re.compile(r"Sadge|SADGE|Hands|Cry|CRY|BibleThump|Deadge|RIP|Rip|PepeHands|FeelsBad|Rain"),
}

BOTS = {"nightbot", "streamelements", "moobot", "fossabot", "streamlabs", "wizebot", "sery_bot", "botrixoficial", "kofistreambot",
        "potatbotat", "supibot", "soundalerts", "own3d", "pokemoncommunitygame", "commanderroot", "blerp", "songlistbot", "deepbot",
        "streamstickers", "lumiastream", "frostytoolsdotcom", "tangiabot", "creatisbot", "kickbot", "botrix"}


def classify(text, emotes=frozenset()):
    """-> (category, weight). `emotes` = this channel's third-party emote names (7TV/BTTV/FFZ), exact match."""
    t = text.strip()
    if not t or t.startswith("!"): return "ignore", 0.0
    low = t.lower()
    if low in SOLO: c = SOLO[low]; return c, W[c]
    if WORD_RE["clip"].search(low): return "clip", W["clip"]
    found = []
    for c in ("funny", "shock", "hype", "sad"):
        if WORD_RE[c].search(low) or any(ch in t for ch in EMOJI[c]): found.append(c)
    toks = t.split()
    n_emote = 0
    for tok in toks:
        hit = False
        for c, rx in EMOTE_PART.items():
            if rx.search(tok): found.append(c); hit = True; break
        if hit or tok in emotes: n_emote += 1
    if found:
        c = max(set(found), key=found.count); return c, W[c]
    if toks and n_emote == len(toks): return "emote", W["emote"]  # a message made only of emotes = an emote wall
    return "plain", W["plain"]


def channel_emotes(room_id):
    """the channel's + global third-party emote names (7TV, BetterTTV, FrankerFaceZ); public read-only APIs, best effort"""
    names = set()
    def get(url):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "clipper"}), timeout=15) as r:
                return json.load(r)
        except Exception:
            return None
    d = get("https://7tv.io/v3/emote-sets/global")
    if d: names |= {e["name"] for e in d.get("emotes", [])}
    if room_id:
        d = get(f"https://7tv.io/v3/users/twitch/{room_id}")
        if d: names |= {e["name"] for e in (d.get("emote_set") or {}).get("emotes", [])}
        d = get(f"https://api.betterttv.net/3/cached/users/twitch/{room_id}")
        if d: names |= {e["code"] for e in d.get("channelEmotes", []) + d.get("sharedEmotes", [])}
        d = get(f"https://api.frankerfacez.com/v1/room/id/{room_id}")
        if d: names |= {e["name"] for s in (d.get("sets") or {}).values() for e in s.get("emoticons", [])}
    d = get("https://api.betterttv.net/3/cached/emotes/global")
    if d: names |= {e["code"] for e in d}
    return names


if __name__ == "__main__":  # quick self-check
    for m in ["KEKW KEKW", "W", "clip it", "CLIPA ISSO", "kkkkkkkkk", "meu deus", "hahahaha", "lol", "no wayyy", "xqcLUL",
              "gauleKEK gauleKEK", "monkaS", "Pog", "L", "!discord", "hello chat", "nice", "💀💀", "jajajaja", "bora porra",
              "what did he just do", "ICANT", "Sadge", "o7", "???", "EZ Clap", "Clueless", "Erm"]:
        print(f"{m!r:28} -> {classify(m)}")
