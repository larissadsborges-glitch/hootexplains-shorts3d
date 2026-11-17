"""
The AI judge (owner 16 Nov: "every clip must make sense where it starts and where it ends" -> "yes, add the AI").

A local model (Gemma 3 4B, free, already on the PC; served by llama.cpp's llama-server on 127.0.0.1:8099) reads the
numbered sentences around the moment and answers in JSON:
  makes_sense  can someone who never saw this streamer follow it from start to end?
  start / end  the sentence numbers to cut at (a whole story: setup -> moment -> reaction)
  hook         a short top line that gives the CONTEXT (what is going on), true to what was said, no made-up facts
If the server is not running, judge() returns None and the editor uses the rule-based cut (smart_cut).

Start the server (PowerShell):
  & C:\\Users\\borge\\.hoottools\\llama\\bin\\llama-server.exe -m C:\\Users\\borge\\.lmstudio\\models\\lmstudio-community\\gemma-3-4b-it-GGUF\\gemma-3-4b-it-Q4_K_M.gguf --host 127.0.0.1 --port 8099 -c 4096 -t 3 -ngl 0 --no-webui
(with the GTX 1070: -ngl 99 puts it on the graphics card and it answers in a couple of seconds)
"""
import json, re, urllib.request

URL = "http://127.0.0.1:8099/v1/chat/completions"

PROMPT = """You cut short vertical clips from a livestream for people who have NEVER seen this streamer.
Streamer: {name}. Stream title: {title}
Below are the numbered sentences spoken around a highlight (times in seconds from the start of the recording), with the
REACTIONS we measured in between (">>" lines: loud shouting/laughing in the room, and chat bursts - chat types 5-10 s
AFTER the thing it reacts to). The highlight happens in sentence {mid}.

{lines}

Pick the clip so it MAKES SENSE ON ITS OWN, from the first word to the last (the owner's rule: never start mid-context,
never cut the payoff, let the scene roll):
- FIND THE REAL MOMENT FIRST: chat reacts LATE - viewers see the stream with a delay and type after it, and a burst
  of "clip it"/"LMAO" can come 20-60 s after the thing itself. The ">> DETECTED here" line is when we noticed it, not
  when it happened: look BACK from it for what actually caused the reaction (the play, the line, the fail) and build
  the clip around THAT, with its setup before it.
- STORY SHAPE: setup -> the thing that happens -> the reaction. The setup is where the situation STARTS (the plan, the
  question, the bet, the argument, "watch this"), not earlier small talk and not halfway into it.
- START: the sentence where this situation begins. STRANGER TEST: if the first sentence only makes sense with something
  said before it (it starts with "and/but/so/because/yeah/no/exactly", or "he/she/they/it/that/this" points to something
  not named yet, or it answers a question we did not hear, or "like I said"), start earlier.
- END: let the scene PLAY OUT. End only when the situation is over: what was set up actually happened, the joke or
  argument reached its punchline/conclusion, and the reaction (the ">>" loud/chat lines) has peaked and calmed. Never end
  on rising action, mid-laugh, on an unanswered question, or on a setup line ("ready", "watch this", "here we go": the
  payoff comes after). A short follow-up line right after the reaction (within ~5 s) can stay; a new topic can not.
- LENGTH: 15-120 s (up to 2 minutes). Never shorten a good story to hit a number: if the scene needs 2 minutes, take
  2 minutes (the owner: GTA clips keep people watching). Only cut small talk before the setup and after the reaction.
- payoff: the number of the sentence where the reaction to the moment PEAKS (the biggest laugh/shout/"no way"). end >= payoff.
- start <= {mid} <= end.
- scene_continues: true if the scene is clearly still going at the LAST sentence listed.
- makes_sense: false if, even with the best start and end, a stranger could not follow what happened (it reacts to
  something only visible on screen with no words explaining it, or it is just random talk).
- hook: the line on top of the video, {lang_name}, max 8 words. It gives the SITUATION (the tension), never the punchline.
  Write it like a viral clip caption: SPECIFIC and intriguing, with the streamer's name and the concrete thing that
  happens (good: "{name_up} CAN'T BELIEVE HIS CHAT SPENT $120K", "{name_up} FINDS OUT HIS CAR IS BROKEN"). Never generic
  ("STREAMER DISCUSSES..."). Use ONLY facts said in the sentences, never invent, never mix two things up - accuracy beats
  drama. No emojis, no hashtags, no insults.
- event: what happens, in ENGLISH, max 10 words, concrete (e.g. "dies falling off a roof", "steals a police car").
- category: one of death, crash, police, steal_car, mission, heist, fail, win, scare, funny, rage, cutscene, map, other.
- first_said: true ONLY if the streamer himself says this is his first time / his first one ("my first death", "first
  time I...").
Answer with JSON only: {{"makes_sense": true, "start": 0, "payoff": 0, "end": 0, "scene_continues": false, "hook": "", "event": "", "category": "other", "first_said": false, "why": ""}}"""

CHECK = """Here is a clip cut from a livestream (numbered sentences with times, ">>" lines are measured reactions).
Sentences {s} to {e} are IN the clip; the ones before and after are NOT.

{lines}

Check it like a viewer who never saw this stream:
- first_needs_context: does sentence {s} only make sense with something said before it (pronoun pointing back, answer
  to an unheard question, starts with and/but/so/yeah)? If yes, give the earliest sentence number that fixes it.
- ending_cut: does the clip stop before the situation is over (payoff not shown, reaction still going, question not
  answered)? If yes, give the sentence number where it is really over.
Answer with JSON only: {{"first_needs_context": false, "start": {s}, "ending_cut": false, "end": {e}, "why": ""}}"""

LANG_NAME = {"en": "in English", "pt": "in Brazilian Portuguese", "es": "in Spanish"}


def alive(timeout=2):
    try:
        with urllib.request.urlopen(URL.replace("/v1/chat/completions", "/health"), timeout=timeout) as r:
            return r.status == 200
    except Exception:
        return False


import os

# (owner 16 Nov: "is there no better model? install Groq") Groq's free cloud API runs much bigger models in ~1 s.
# The key is the owner's: tools/clipper/.env  ->  GROQ_API_KEY=...   (never printed, never sent anywhere but Groq)
# Only the public stream's spoken sentences + the channel name + the stream title are sent.
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODELS = ["openai/gpt-oss-120b", "qwen/qwen3.8-27b", "openai/gpt-oss-20b"]  # first that answers wins (checked 17 Nov: the old 2 were retired)
_model_off = {}  # model -> time it may be asked again
_groq_off_until = 0.0  # after a rate limit / outage, the local model is used for a while
last_engine = ""


def groq_key():
    k = os.environ.get("GROQ_API_KEY", "").strip()
    if k: return k
    p = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    try:
        for ln in open(p, encoding="utf-8"):
            if ln.strip().startswith("GROQ_API_KEY="): return ln.split("=", 1)[1].strip().strip('"')
    except OSError:
        pass
    return ""


def _post(url, body, headers, timeout):
    req = urllib.request.Request(url, data=json.dumps(body).encode(), headers={"Content-Type": "application/json",
                                                                                 "User-Agent": "clipper/1.0", **headers})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.load(r)["choices"][0]["message"]["content"]


def _ask(prompt, timeout):
    """Groq first (if there is a key), else the local llama-server -> (text, engine) or (None, "")
    (17 Nov check: each Groq model has its OWN limit - 1000 requests a day, 8000 tokens a MINUTE - so a busy minute
    only rests THAT model: a short wait (Groq says how long) or the next model, never 10 min of the weak local one)"""
    global _groq_off_until
    import time
    key = groq_key()
    if key and time.time() > _groq_off_until:
        for model in GROQ_MODELS:
            if time.time() < _model_off.get(model, 0): continue
            body = {"model": model, "messages": [{"role": "user", "content": prompt}], "temperature": 0.2,
                    "max_tokens": 1000, "response_format": {"type": "json_object"}}
            if model.startswith("openai/gpt-oss"): body["reasoning_effort"] = "low"
            for attempt in range(3):
                try:
                    return _post(GROQ_URL, body, {"Authorization": f"Bearer {key}"}, 40), f"groq:{model}"
                except urllib.error.HTTPError as e:
                    if e.code == 429:
                        try: wait = float(e.headers.get("retry-after") or 0)
                        except ValueError: wait = 0
                        if 0 < wait <= 15 and attempt < 2: time.sleep(wait + 0.5); continue  # the minute limit: wait it out
                        _model_off[model] = time.time() + min(max(wait, 60), 3600); break  # longer (the day's limit): next model
                    if e.code >= 500: _model_off[model] = time.time() + 60; break  # outage: next model
                    if e.code == 400 and attempt == 0:  # an option this model does not take: plain request
                        body.pop("response_format", None); body.pop("reasoning_effort", None); continue
                    if e.code == 404: _model_off[model] = time.time() + 86400  # model retired
                    break  # 401 bad key / 404 model gone: next model
                except Exception:
                    _groq_off_until = time.time() + 120; break  # no internet: local for 2 min
            if time.time() < _groq_off_until: break
    if alive():
        body = {"messages": [{"role": "user", "content": prompt}], "temperature": 0.2, "max_tokens": 220,
                "response_format": {"type": "json_object"}}
        try: return _post(URL, body, {}, timeout), "local:gemma-3-4b"
        except Exception: pass
    return None, ""


def _lines(sents, events, lo=0, hi=None):
    """numbered sentences with the measured reactions (events: [(t, text)]) placed between them"""
    hi = len(sents) - 1 if hi is None else hi
    out, ev = [], sorted(events or [])
    for i in range(lo, hi + 1):
        a, b, t = sents[i]
        out.append(f"[{i}] ({a:.0f}-{b:.0f}s) {t}")
        nxt = sents[i + 1][0] if i + 1 < len(sents) else 1e9
        for et, txt in ev:
            if b <= et < nxt or (i == lo and et < a and lo == 0): out.append(f"   >> {et:.0f}s: {txt}")
    return "\n".join(out)


def _json(txt):
    try:
        m = re.search(r"\{.*\}", txt or "", re.S); return json.loads(m.group(0)) if m else None
    except ValueError:
        return None


def judge(sents, mid, lang="en", timeout=150, name="", title="", events=()):
    """sents: [(start_s, end_s, text)], mid: index of the highlight sentence, events: [(t, "loud shouting")...]
    -> dict or None (no AI reachable / bad answer). Two looks: pick the clip, then the stranger test on the pick."""
    global last_engine
    if not sents: return None
    lines = _lines(sents, events)
    prompt = PROMPT.format(mid=mid, lines=lines, lang_name=LANG_NAME.get(lang, "in English"), name=name or "the streamer",
                           name_up=(name or "HE").upper(), title=title or "(unknown)")
    txt, last_engine = _ask(prompt, timeout)
    d = _json(txt)
    if not d: return None
    try:
        s, e = int(d.get("start", mid)), int(d.get("end", mid))
    except (TypeError, ValueError):
        return None
    s, e = max(0, min(s, mid)), min(len(sents) - 1, max(e, mid))  # the moment always stays in
    try: e = min(len(sents) - 1, max(e, int(d.get("payoff", e))))  # (research 17 Nov) never end before the payoff
    except (TypeError, ValueError): pass
    # second look (research 17 Nov: "would a stranger understand the first line? is the reaction over?")
    moved = ""
    if last_engine.startswith("groq"):
        c = _json(_ask(CHECK.format(s=s, e=e, lines=_lines(sents, events, max(0, s - 6), min(len(sents) - 1, e + 4))), timeout)[0])
        try:
            if c and c.get("first_needs_context"):
                ns = int(c.get("start", s))
                if 0 <= ns < s and sents[s][0] - sents[ns][0] <= 40: moved += f" início recuado {s}->{ns};"; s = ns
            if c and c.get("ending_cut"):
                ne = int(c.get("end", e))
                if e < ne < len(sents) and sents[ne][1] - sents[e][1] <= 45: moved += f" fim alargado {e}->{ne};"; e = ne
        except (TypeError, ValueError):
            pass
    return {"makes_sense": bool(d.get("makes_sense", True)), "start": s, "end": e,
            "hook": str(d.get("hook", "")).strip().strip('"').upper()[:60], "why": (moved + " " + str(d.get("why", ""))).strip()[:240],
            "event": str(d.get("event", ""))[:80], "category": str(d.get("category", "other")).lower()[:20],
            "first_said": bool(d.get("first_said", False)),
            "engine": last_engine, "scene_continues": bool(d.get("scene_continues", False)) and e >= len(sents) - 2}
