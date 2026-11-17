"""
Where is the streamer's webcam? (owner 16 Nov: "take the webcam from one side and put the game on the other")

detect(path) samples frames of a clip, finds a face that stays in the same place (a webcam overlay does, faces in a game
move), then grows a box around it and snaps each side to a straight edge that never changes across the frames (the
overlay's border). Modes:
  split  webcam in a corner over the game -> webcam on top, game below (the most used layout on Shorts/TikTok)
  face   the face IS the stream (just chatting / IRL) -> 9:16 crop around the face
  game   no steady face -> the stream band over a blurred copy (the old layout)
Face detector: OpenCV YuNet (MIT), model in .hoottools/models/yunet (see SOURCE.txt there).
"""
import os
import cv2
import numpy as np

MODEL = r"C:\Users\borge\.hoottools\models\yunet\face_detection_yunet_2023mar.onnx"


FF = r"C:\Users\borge\.hoottools\ffmpeg\ffmpeg.exe"
FP = r"C:\Users\borge\.hoottools\ffmpeg\ffprobe.exe"


def _frames(path, n=12):
    """n frames spread over the clip, decoded by ffmpeg (OpenCV's seeking breaks on stream pieces)"""
    import subprocess
    r = subprocess.run([FP, "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height:format=duration",
                        "-of", "default=nw=1", path], capture_output=True, text=True).stdout
    kv = dict(l.split("=", 1) for l in r.split() if "=" in l)
    try: W, H, dur = int(kv["width"]), int(kv["height"]), float(kv["duration"])
    except (KeyError, ValueError): return []
    raw = subprocess.run([FF, "-v", "error", "-i", path, "-vf", f"fps={n / max(dur, 1):.4f}", "-frames:v", str(n),
                          "-f", "rawvideo", "-pix_fmt", "bgr24", "-"], capture_output=True).stdout
    k = len(raw) // (W * H * 3)
    return [np.frombuffer(raw[i * W * H * 3:(i + 1) * W * H * 3], np.uint8).reshape(H, W, 3) for i in range(k)]


def _faces(frames):
    # (test 16 Nov: a small corner webcam was missed at 960 px / 0.75) full 720p-ish size, 0.6
    h, w = frames[0].shape[:2]; s = min(1.0, 1280.0 / w); sw, sh = int(w * s), int(h * s)
    det = cv2.FaceDetectorYN.create(MODEL, "", (sw, sh), 0.6, 0.3, 50)
    res = []
    for f in frames:
        _, faces = det.detect(cv2.resize(f, (sw, sh)))
        rows = []
        for r in (faces if faces is not None else []):
            full = r.copy(); full[:14] = full[:14] / s
            rows.append((full[0], full[1], full[2], full[3], full[14], len(res), full))
        res.append(rows)
    return res


SFACE = r"C:\Users\borge\.hoottools\models\sface\face_recognition_sface_2021dec.onnx"
FACES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "rostos")  # rostos/<channel>.npy = the streamer's face
_rec = None


def _embed(frame, row):
    """SFace face print (128 numbers) of one detected face"""
    global _rec
    if _rec is None: _rec = cv2.FaceRecognizerSF.create(SFACE, "")
    return _rec.feature(_rec.alignCrop(frame, row.reshape(1, -1).astype(np.float32))).flatten()


def _same(a, b):
    """cosine similarity of two face prints (SFace: >= 0.363 = same person)"""
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-9))


def _group_print(frames, g):
    best = max(g, key=lambda h: h[4])  # the clearest sighting
    return _embed(frames[best[5]], best[6])


def _steady_face(per_frame, W, frames=None, channel=None, lay_known=None):
    lay_known = lay_known if lay_known is not None else [False]
    """the face that is in (almost) the same place in most frames; among those, the BIGGEST (test 16 Nov: a 17 px
    cartoon face in Northernlion's game won over his real webcam); faces under 2.5 % of the width are icons, not people"""
    groups = []
    for fr in per_frame:
        for x, y, fw, fh, sc, *_ in fr:
            if fw < 0.022 * W: continue
            cx, cy = x + fw / 2, y + fh / 2; hits = []
            for fr2 in per_frame:
                near = [f for f in fr2 if abs(f[0] + f[2] / 2 - cx) < 0.04 * W and abs(f[1] + f[3] / 2 - cy) < 0.04 * W and f[2] >= 0.022 * W]
                if near: hits.append(near[0])
            if len(hits) >= 0.5 * len(per_frame): groups.append(hits)
    # (test 16 Nov: a plush toy's face in Zoil's room scored 0.69 and beat his real webcam face at 0.85) real faces score
    # >= 0.8; under 0.75 is not trusted at all; a confident face wins over a bigger unsure one
    groups = [g for g in groups if np.median([h[4] for h in g]) >= 0.75]
    if not groups: return None
    # one group per place (the loop above finds the same webcam once per frame)
    uniq = []
    for g in sorted(groups, key=len, reverse=True):
        c = np.median([[h[0] + h[2] / 2, h[1] + h[3] / 2] for h in g], axis=0)
        if all(np.hypot(*(c - u[0])) > 0.04 * W for u in uniq): uniq.append((c, g))
    groups = [g for _, g in uniq]
    best = max(groups, key=lambda g: (np.median([h[4] for h in g]) >= 0.85, np.median([h[2] for h in g]), len(g)))
    # (owner 16 Nov: "why are other people's webcams showing?" IShowSpeed's stream had 4 webcams, a teammate's face was the
    # biggest) when we know the streamer's face (rostos/<channel>.npy) the webcam that IS them wins; a channel with a
    # single webcam teaches us their face automatically
    ref_p = os.path.join(FACES_DIR, f"{channel}.npy") if channel else None
    if frames is not None and ref_p:
        try:
            if os.path.exists(ref_p):
                ref = np.load(ref_p); sims = [(_same(_group_print(frames, g), ref), g) for g in groups]
                sim, g = max(sims, key=lambda t: t[0])
                if sim >= 0.363: best = g; lay_known[0] = True
                elif len(groups) > 1: return None  # several webcams and none is the streamer: no webcam panel
            elif len(groups) == 1:
                os.makedirs(FACES_DIR, exist_ok=True); np.save(ref_p, _group_print(frames, best))
        except cv2.error:
            pass
    a = np.array([b[:4] for b in best]); return tuple(np.median(a, axis=0))  # x, y, w, h


def _snap(score, guess, near, far, size):
    """the overlay border on one side of the face, searching from `near` (next to the face) out to `far`: the first strong
    straight line (>= 0.75 of its length); else the strongest weaker one; else the frame edge if in reach; else the guess"""
    step = 1 if far > near else -1
    idx = [i for i in range(int(near), int(far), step) if 0 <= i <= size]
    for i in idx:
        if score[min(i, size - 1)] >= 0.75: return i
    weak = [(score[min(i, size - 1)], i) for i in idx if score[min(i, size - 1)] >= 0.5]
    if weak: return max(weak)[1]
    if any(i <= 2 for i in idx) or (step < 0 and far <= 0): return 0
    if any(i >= size - 2 for i in idx) or (step > 0 and far >= size): return size
    return guess


def is_ad(f):
    """Twitch's 'Commercial break in progress' screen (anonymous viewers get ads): a smooth blue-purple gradient"""
    small = cv2.resize(f, (160, 90)); hsv = cv2.cvtColor(small, cv2.COLOR_BGR2HSV)
    hue_ok = ((hsv[..., 0] > 105) & (hsv[..., 0] < 160) & (hsv[..., 1] > 90)).mean() > 0.7
    flat = (cv2.Canny(cv2.cvtColor(small, cv2.COLOR_BGR2GRAY), 60, 160) > 0).mean() < 0.06
    return bool(hue_ok and flat)


def ad_share(frames):
    return sum(is_ad(f) for f in frames) / max(len(frames), 1)


def learn(path_or_img, channel, pick="topleft"):
    """save the streamer's face print from a frame (a still or the middle of a video): pick = topleft | biggest | (x, y)"""
    img = cv2.imread(path_or_img) if isinstance(path_or_img, str) and path_or_img.lower().endswith((".jpg", ".png")) else (
        _frames(path_or_img, 3)[1] if isinstance(path_or_img, str) else path_or_img)
    rows = [r for r in _faces([img])[0] if r[4] >= 0.75]
    if not rows: raise ValueError("no face found")
    if pick == "topleft": r = min(rows, key=lambda r: r[0] + r[1])
    elif pick == "biggest": r = max(rows, key=lambda r: r[2])
    else: r = min(rows, key=lambda r: np.hypot(r[0] + r[2] / 2 - pick[0], r[1] + r[3] / 2 - pick[1]))
    os.makedirs(FACES_DIR, exist_ok=True); np.save(os.path.join(FACES_DIR, f"{channel}.npy"), _embed(img, r[6]))
    return r[:4]


def track(path, channel, fps=3.0):
    """(owner 16 Nov: "you have to know who IShowSpeed is and keep tracking him") where the streamer's face is, second by
    second: [(t, cx, cy, fw)] for every sampled frame where the face matching rostos/<channel>.npy is seen"""
    ref_p = os.path.join(FACES_DIR, f"{channel}.npy")
    if not channel or not os.path.exists(ref_p): return []
    ref = np.load(ref_p)
    import subprocess
    r = subprocess.run([FP, "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path], capture_output=True, text=True)
    try: dur = float(r.stdout.strip())
    except ValueError: return []
    frames = _frames(path, max(4, int(dur * fps)))
    if not frames: return []
    W = frames[0].shape[1]; out = []
    for i, rows in enumerate(_faces(frames)):
        cand = [rw for rw in rows if rw[2] >= 0.03 * W and rw[4] >= 0.7]
        best = None
        for rw in cand:
            try: sim = _same(_embed(frames[i], rw[6]), ref)
            except cv2.error: continue
            if sim >= 0.363 and (best is None or sim > best[0]): best = (sim, rw)
        if best:
            rw = best[1]; out.append(((i + 0.5) * dur / len(frames), rw[0] + rw[2] / 2, rw[1] + rw[3] / 2, rw[2]))
    return out


def _follow_cmds(pts, dur, cw, W, path_out, max_speed=0.25, dead=0.16, hz=30):
    """(owner 17 Nov: "the camera shakes a lot" on JasonTheWeen IRL) a STEADY virtual camera, like a camera operator:
    the crop stays still while the face is near its middle and only moves when the face drifts past `dead` crop-widths
    from the centre, then glides (eased, at most max_speed crop-widths a second) just far enough to bring it back.
    The IRL cameraman already follows the streamer, so following every small move doubled the shake.
    Written as ffmpeg sendcmd lines, `hz` a second (10 a second made visible 6-frame steps at 60 fps)."""
    ts = np.array([p[0] for p in pts]); xs = np.array([p[1] for p in pts], dtype=float)
    if len(xs) >= 5:  # a wrong sighting for one sample must not swing the camera: median of 5
        xs = np.array([np.median(xs[max(0, i - 2):i + 3]) for i in range(len(xs))])
    step = 1.0 / hz
    grid = np.arange(0, dur + step, step)
    face = np.interp(grid, ts, xs)
    dz = dead * cw
    cam = [face[0]]; vel = 0.0; vmax = max_speed * cw * step; acc = vmax / (0.6 * hz)  # ~0.6 s to reach full speed
    for f in face[1:]:
        c = cam[-1]; off = f - c
        want = 0.0 if abs(off) <= dz else (off - np.sign(off) * dz * 0.4)  # past the edge: re-centre most of the way
        target_v = max(-vmax, min(vmax, want * 0.08))
        vel += max(-acc, min(acc, target_v - vel))  # eased start / stop
        cam.append(c + vel)
    k = max(3, int(0.8 * hz)); pad = np.pad(np.array(cam), (k // 2, k - 1 - k // 2), mode="edge")
    cam = np.convolve(pad, np.ones(k) / k, mode="valid")[:len(grid)]  # no corners left in the path
    with open(path_out, "w") as f:
        last = None
        for t, cx in zip(grid, cam):
            x = int(round(min(max(cx - cw / 2, 0), W - cw)))
            if x != last: f.write(f"{t:.3f} crop x {x};\n"); last = x
    return int(round(min(max(cam[0] - cw / 2, 0), W - cw)))


def detect(path, channel=None):
    frames = _frames(path)
    if len(frames) < 4: return {"mode": "game"}
    H, W = frames[0].shape[:2]
    ads = ad_share(frames)
    if ads >= 0.25: return {"mode": "ad", "W": W, "H": H, "ads": ads}  # a clip of an ad break is thrown away
    known = [False]; face = _steady_face(_faces(frames), W, frames, channel, known)
    if face is None:
        pts = track(path, channel) if channel else []
        if len(pts) >= 4 and np.median([p[3] for p in pts]) >= 0.05 * W:  # (IRL: they walk, the camera moves)
            x0 = np.median([p[1] for p in pts]); y0 = np.median([p[2] for p in pts]); f0 = np.median([p[3] for p in pts])
            return {"mode": "face", "W": W, "H": H, "cx": x0, "cy": y0, "face": (x0 - f0 / 2, y0 - f0 / 2, f0, f0 * 1.25),
                    "follow": pts, "src": path}
        return {"mode": "game", "W": W, "H": H}
    x, y, fw, fh = face; cx, cy = x + fw / 2, y + fh / 2
    if fw > 0.11 * W and 0.2 * W < cx < 0.8 * W:  # a big face in the middle: the camera is the stream
        lay = {"mode": "face", "W": W, "H": H, "cx": cx, "cy": cy, "face": (x, y, fw, fh), "src": path}
        pts = track(path, channel) if known[0] else []
        if len(pts) >= 4 and np.ptp([p[1] for p in pts]) > 0.06 * W: lay["follow"] = pts  # they move: follow them
        return lay
    # (test 16 Nov: a 39 px face blown up 6x to fill the top was mush) too small to fill the panel; the RECOGNISED streamer
    # may be smaller (IShowSpeed with 3 teammates: 3 % of the width) - the owner wants their face
    if fw < (0.022 if known[0] else 0.033) * W:
        return {"mode": "game", "W": W, "H": H}
    # the overlay border: straight edges in the AVERAGE frame (the game moves and blurs out, the overlay stays sharp)
    m = cv2.cvtColor(np.mean(frames, axis=0).astype(np.uint8), cv2.COLOR_BGR2GRAY).astype(np.float32)
    gy = np.abs(cv2.Sobel(m, cv2.CV_32F, 0, 1, ksize=3)) > 40; gx = np.abs(cv2.Sobel(m, cv2.CV_32F, 1, 0, ksize=3)) > 40
    ya, yb = int(max(0, y - fh)), int(min(H, y + 2 * fh)); xa, xb = int(max(0, x - fw)), int(min(W, x + 2 * fw))
    col = gx[ya:yb].mean(axis=0); row = gy[:, xa:xb].mean(axis=1)
    # the usual webcam box (if no border is found): ~3.4 face widths wide, face a bit above the middle
    gw = 3.4 * fw; gh = gw * 9 / 16
    left = _snap(col, cx - gw / 2, x - 0.3 * fw, cx - 3.5 * fw, W)
    right = _snap(col, cx + gw / 2, x + 1.3 * fw, cx + 3.5 * fw, W)
    top = _snap(row, cy - gh * 0.45, y - 0.3 * fh, cy - 3.0 * fh, H)
    bottom = _snap(row, cy + gh * 0.55, y + 1.4 * fh, cy + 3.2 * fh, H)
    left, top = max(0, int(left)), max(0, int(top)); right, bottom = min(W, int(right)), min(H, int(bottom))
    if right - left < 1.5 * fw or bottom - top < 1.5 * fh: return {"mode": "game", "W": W, "H": H}
    if (right - left) * (bottom - top) > 0.4 * W * H or bottom - top > 0.85 * H:
        # (test 16 Nov, Lacy / JasonTheWeen just chatting: the 'webcam' is the whole room camera, so webcam-on-top + full
        # picture showed the same person twice) the camera IS the stream: one vertical picture following the person
        lay = {"mode": "face", "W": W, "H": H, "cx": cx, "cy": cy, "face": (x, y, fw, fh), "src": path}
        pts = track(path, channel) if known[0] else []
        if len(pts) >= 4 and np.ptp([p[1] for p in pts]) > 0.06 * W: lay["follow"] = pts
        return lay
    return {"mode": "split", "W": W, "H": H, "cam": (left, top, right - left, bottom - top), "face": (x, y, fw, fh)}


def _head_out(lay, y0, scale):
    """(owner 16 Nov: "a title covered the streamer's face for 3-4 s, never again") where the HEAD is in the 1080x1920
    output, with room for hair, chin and leaning: lay["head_out"] = (top, bottom) px"""
    x, y, fw, fh = lay["face"]
    lay["head_out"] = (max(0, int((y - 0.7 * fh - y0) * scale)), min(1920, int((y + 1.7 * fh - y0) * scale)))


GAME_KEEP = 0.72  # share of the stream's width shown under the webcam (1.0 = the whole 16:9)


def filters(lay, cam_h=None, keep=None):
    """ffmpeg filter (input [0:v], output [st] 1080x1920) and the y of the seam where captions sit"""
    W, H = lay.get("W", 1280), lay.get("H", 720)
    if lay["mode"] == "face":
        cw = int(H * 9 / 16) // 2 * 2; x0 = int(min(max(lay["cx"] - cw / 2, 0), W - cw))
        _head_out(lay, 0, 1920 / H)
        if lay.get("follow"):  # the crop follows the streamer through the clip (a steady camera: moves only when needed)
            import subprocess
            r = subprocess.run([FP, "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", lay["src"]], capture_output=True, text=True)
            cmd = os.path.splitext(lay["src"])[0] + "_follow.cmd"
            x0 = _follow_cmds(lay["follow"], float(r.stdout.strip() or 30), cw, W, cmd)
            cmdf = cmd.replace("\\", "/").replace(":", "\\:")
            return f"[0:v]sendcmd=f='{cmdf}',crop={cw}:{H}:{x0}:0,scale=1080:1920:flags=lanczos,unsharp=5:5:0.4[st]", 1300
        return f"[0:v]crop={cw}:{H}:{x0}:0,scale=1080:1920:flags=lanczos,unsharp=5:5:0.4[st]", 1300
    if lay["mode"] == "split":
        x, y, w, h = lay["cam"]
        # (owner 16 Nov: "do it like forsen, no. 6, that's exactly how I want it") the webcam fills the top panel edge to
        # edge: framed FROM THE FACE (face ~1/4.4 of the width, eyes a bit above the middle), kept inside the webcam box
        # minus a 3 % border (no frame lines, no game or overlay bits next to the camera)
        # (owner 16 Nov: "the video comes 16:9, it has to show WHOLE on the screen, not cut in 9:16") webcam on top 700 px,
        # then the FULL 16:9 stream 1080x608 right under it (its copy of the webcam blurred out: no face twice), then a
        # blurred copy filling the rest, where the captions and chat sit
        top = cam_h or 700
        want = 1080 / top
        fw = lay["face"][2]; fx = lay["face"][0] + fw / 2; fy = lay["face"][1] + lay["face"][3] / 2
        bx, by, bw, bh = x + 0.03 * w, y + 0.03 * h, 0.94 * w, 0.94 * h
        nw, nh = 4.4 * fw, 4.4 * fw / want
        s = min(1.0, bw / nw, bh / nh); nw, nh = int(nw * s) // 2 * 2, int(nh * s) // 2 * 2
        nx = int(min(max(fx - nw / 2, bx), bx + bw - nw)); ny = int(min(max(fy - 0.45 * nh, by), by + bh - nh))
        # (owner 16 Nov: "like all the other clips, but the game must not look cut, and not tiny either - find the resize
        # that looks good") the game keeps GAME_KEEP of the width (72 %: ~14 % off each side, the action stays) so it is
        # ~40 % bigger than the whole 16:9; the window avoids the webcam; captions at the seam like forsen no. 6
        keep = min(1.0, keep or GAME_KEEP); rest = 1920 - top
        gwid = int(W * keep) // 2 * 2; band = int(1080 * H / gwid) // 2 * 2
        if band > rest: band = rest // 2 * 2; gwid = int(1080 * H / band) // 2 * 2
        def overlap(g0): return max(0, min(g0 + gwid, x + w) - max(g0, x))
        gx = min(range(0, W - gwid + 1, 4), key=lambda g: (overlap(g), abs(g + gwid / 2 - W / 2)))
        ox0, ox1 = max(gx, x), min(gx + gwid, x + w)
        # (test 16 Nov, JasonTheWeen: his 'webcam' is a big room camera; a blurred block that size hid half the stream)
        # only a corner webcam (< 15 % of the picture) is blurred where it shows in the game; a big one stays as it is
        hide = (f"split[g1][g2];[g2]crop={(ox1 - ox0) // 2 * 2 or 2}:{h // 2 * 2}:{ox0}:{y},gblur=sigma=30,eq=brightness=-0.15[gb];"
                f"[g1][gb]overlay={ox0}:{y}," if ox1 - ox0 >= 2 and w * h < 0.15 * W * H else "")
        _head_out(lay, ny, top / nh)
        lay["game_top"] = top; lay["game_bottom"] = top + band
        f = (f"[0:v]split=3[c][g][b];[c]crop={nw}:{nh}:{nx}:{ny},scale=1080:{top}:flags=lanczos,unsharp=5:5:0.6[cam];"
             f"[g]{hide}crop={gwid}:{H}:{gx}:0,scale=1080:{band}:flags=lanczos,unsharp=3:3:0.3[game];"
             f"[b]scale=-2:{rest},crop=1080:{rest},gblur=sigma=26,eq=brightness=-0.22[bg];[bg][game]overlay=0:0[low];"
             f"[cam][low]vstack,drawbox=x=0:y={top - 3}:w=1080:h=6:color=black:t=fill[st]")
        lay["caps_at_seam"] = keep < 0.99
        return f, (top if keep < 0.99 else top + band + 70)  # captions on the seam (or under a whole 16:9 game)
    return ("[0:v]split[a][b];[a]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=28:2,eq=brightness=-0.12[bg];"
            "[b]scale=1080:-2[fg];[bg][fg]overlay=0:560[st]"), 1265


if __name__ == "__main__":
    import sys, json
    for p in sys.argv[1:]: print(p, json.dumps(detect(p), default=float))
