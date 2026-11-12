#!/usr/bin/env python3
"""
Assemble the Dispute Compass demo video (fast path):
per-segment encode (captions + fades burned in), then concat with -c copy.
Output: /home/z/my-project/download/Dispute-Compass-Demo-Video.mp4
"""
import json, os, subprocess, sys

V = "/tmp/video"
OUT = "/home/z/my-project/download/Dispute-Compass-Demo-Video.mp4"
INTRO_D = 2.8

LOG = open("/tmp/video/progress.log", "w")

def sh(cmd):
    print("RUN:", cmd[:120], flush=True); LOG.write("RUN: " + cmd + "\n"); LOG.flush()
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True, stdin=subprocess.DEVNULL)
    if r.returncode != 0:
        print("CMD FAILED:", cmd, flush=True); print(r.stderr[-2500:], flush=True); sys.exit(1)
    LOG.write("OK\n"); LOG.flush()

marks = json.load(open(f"{V}/timestamps.json"))
audio = {k: float(v) for k, v in json.load(open(f"{V}/scenes.json")).items()}

SCENE_TEXTS = {
 "s0": "A PayPal dispute just landed. The buyer wants two hundred forty-eight dollars, and the inquiry auto-closes in four days. If it closes, that's it. Closed disputes can never be reopened. Most people don't lose because they're wrong; they lose because they missed a window or sent the wrong evidence.",
 "s1": "This is Dispute Compass, an AI case coach for PayPal disputes, built on the PayPal Disputes API. The portfolio, powered by AG Grid, sorts every case by the deadline closest to firing. Up top: active cases, deadlines inside two days, open appeal windows, and the money in play.",
 "s2": "The Deadline Engine is pure rules, never AI guesses. It knows inquiries auto-close twenty days after opening, sellers get ten days to respond to a claim, and appeals live in a ten-day window after a decision. Every window shows why it exists, what happens if you miss it, and what to do now.",
 "s3": "The Strength Meter scores evidence the way a reviewer reads it: tracking, proof of delivery, address match. Watch the score climb as items are verified. The Settlement Advisor turns that score into money: accept, offer around sixty percent, or fight with a twenty-four percent win chance. No bravado, just math.",
 "s4": "On the language side, the AI Case Coach reads the whole case file and briefs you: what's strong, what a reviewer will question, the best opening move, and next actions in order. It's grounded in case facts and a curated policy library. It cites policy IDs, never invents them.",
 "s5": "The Letter Studio drafts the appeal. It must argue new evidence. Here, the carrier confirmed the parcel was lost after the decision. Before anything is sent, the Integrity Guard flags absolute claims, and three attestations are mandatory. AI maximizes complete truth, not engineered victories.",
 "s6": "Out of the box it runs in Demo Mode, no credentials needed. Plug in PayPal Sandbox keys and it reads your real cases. Add an LLM key and the coach goes fully generative. Dispute Compass: know where you stand, settle smart, escalate right.",
}
ORDER = ["s0","s1","s2","s3","s4","s5","s6"]

ends = {ORDER[i]: marks[ORDER[i+1]] for i in range(6)}
ends["s6"] = marks["s6end"]
os.makedirs(f"{V}/clips", exist_ok=True)

from PIL import Image, ImageDraw, ImageFont
FB = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
W, H = 1440, 900
BG=(12,15,20); EM=(16,185,129); EM_L=(110,231,183); ST=(168,162,158); ST_D=(120,113,108)

def card(path, lines, start_y=420):
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    cx, cy, r = W//2, 210, 70
    d.ellipse([cx-r, cy-r, cx+r, cy+r], outline=EM, width=4)
    d.ellipse([cx-8, cy-8, cx+8, cy+8], fill=EM)
    d.line([cx, cy, cx+r-18, cy-r+18], fill=EM, width=6)
    d.text((cx, cy+r+22), "N", font=ImageFont.truetype(FB, 26), fill=EM_L, anchor="mm")
    y = start_y
    for text, (fp, size), color in lines:
        d.text((W//2, y), text, font=ImageFont.truetype(fp, size), fill=color, anchor="mm")
        y += size + 36
    img.save(path)

card(f"{V}/intro.png", [
    ("TEAM AHVO", (FR, 30), ST),
    ("Dispute Compass", (FB, 92), (255,255,255)),
    ("AI Case Coach for PayPal Disputes", (FB, 38), EM_L),
    ("PayPal AI Hackathon  ·  Demo Mode  ·  no credentials needed", (FR, 27), ST_D),
])
card(f"{V}/outro.png", start_y=380, lines=[
    ("Know where you stand.", (FB, 56), (255,255,255)),
    ("Settle smart.", (FB, 56), (255,255,255)),
    ("Escalate right.", (FB, 56), EM_L),
    ("Dispute Compass · Team AHVO", (FB, 32), EM),
    ("PayPal Disputes API sandbox · AG Grid · LLM-adapter ready", (FR, 25), ST),
    ("MIT licensed · full source in submission", (FR, 25), ST_D),
])

NORM = "scale=1440:900:force_original_aspect_ratio=decrease,pad=1440:900:(ow-iw)/2:(oh-ih)/2,format=yuv420p"
ENC = "-c:v libx264 -preset superfast -crf 20 -r 30"
AUD = "-c:a aac -b:a 160k -ar 44100 -ac 2"

def ts(sec):
    sec = max(0, sec)
    h = int(sec // 3600); m = int(sec % 3600 // 60); s = sec % 60
    return f"{h}:{m:02d}:{s:05.2f}"

def sentences(text):
    raw = text.replace("; ", ". ").split(". ")
    out = []
    for s in raw:
        s = s.strip()
        if not s: continue
        if not s.endswith((".", "!", "?")): s += "."
        out.append(s)
    merged = []
    for s in out:
        if len(s) < 32 and merged: merged[-1] += " " + s
        else: merged.append(s)
    return merged

def write_ass(path, events):
    hdr = ["[Script Info]", "ScriptType: v4.00+", f"PlayResX: {W}", f"PlayResY: {H}", "WrapStyle: 0", "ScaledBorderAndShadow: yes",
           "", "[V4+ Styles]",
           "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
           "Style: Cap,DejaVu Sans,31,&H00FFFFFF,&H00FFFFFF,&HC8000000,&H64000000,0,0,0,0,100,100,0,0,1,2.2,0,2,60,60,44,1",
           "", "[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
    for a, b, txt in events:
        if b - a < 0.3: continue
        hdr.append(f"Dialogue: 0,{ts(a)},{ts(b)},Cap,,0,0,0,,{txt.replace(chr(39), chr(8217))}")
    open(path, "w").write("\n".join(hdr))

def scene_events(s, seg_offset=0.0, cap_dur=None):
    """Sentence events for scene s; returns list of (start, end, text) in local segment time."""
    d = audio[s]
    sens = sentences(SCENE_TEXTS[s])
    total = sum(len(x) for x in sens)
    ev, t = [], 0.0
    for x in sens:
        frac = len(x) / total
        dur = min(frac * d, 7.5)
        a, b = seg_offset + t, seg_offset + t + dur
        if cap_dur is not None:
            if a >= cap_dur: t += frac * d; continue
            b = min(b, cap_dur)
        ev.append((a, b, x))
        t += frac * d
    return ev

# ---------- intro ----------
write_ass(f"{V}/cap_intro.ass", [])
sh(f'ffmpeg -y -v error -loop 1 -t {INTRO_D} -i {V}/intro.png -f lavfi -t {INTRO_D} -i anullsrc=r=44100:cl=stereo '
   f'-vf "{NORM},fade=t=in:st=0:d=0.7" {ENC} -map 0:v -map 1:a {AUD} -shortest {V}/clips/intro.mp4')
print("intro done", flush=True)

# ---------- scenes 0..5 ----------
for s in ORDER[:6]:
    dur = ends[s] - marks[s]
    write_ass(f"{V}/cap_{s}.ass", scene_events(s))
    sh(f'ffmpeg -y -v error -ss {marks[s]} -i {V}/raw.webm -t {dur} '
       f'-vf "{NORM},ass={V}/cap_{s}.ass" {ENC} -an {V}/clips/{s}_v.mp4')
    sh(f'ffmpeg -y -v error -i {V}/clips/{s}_v.mp4 -i {V}/narr/{s}.wav '
       f'-map 0:v -map 1:a -c:v copy {AUD} -shortest {V}/clips/{s}.mp4')
    os.remove(f"{V}/clips/{s}_v.mp4")
    print(s, "done", flush=True)

# ---------- scene 6: badges + outro ----------
badge_dur = ends["s6"] - marks["s6"]
outro_dur = max(6.0, audio["s6"] + 1.0 - badge_dur)
ev6 = scene_events("s6")  # events in scene-local time (0..audio)
write_ass(f"{V}/cap_badges.ass", [(a, min(b, badge_dur), x) for a, b, x in ev6 if a < badge_dur])
write_ass(f"{V}/cap_outro.ass", [(a - badge_dur, b - badge_dur, x) for a, b, x in ev6 if a >= badge_dur - 0.2])
sh(f'ffmpeg -y -v error -ss {marks["s6"]} -i {V}/raw.webm -t {badge_dur} -vf "{NORM},ass={V}/cap_badges.ass" {ENC} -an {V}/clips/badges_v.mp4')
sh(f'ffmpeg -y -v error -loop 1 -t {outro_dur} -i {V}/outro.png -vf "{NORM},ass={V}/cap_outro.ass,fade=t=out:st={outro_dur-1.1}:d=1.1" {ENC} -an {V}/clips/outro_v.mp4')
sh(f'ffmpeg -y -v error -i {V}/clips/badges_v.mp4 -i {V}/clips/outro_v.mp4 -filter_complex "[0:v][1:v]concat=n=2:v=1:a=0" {ENC} -an {V}/clips/s6.mp4')
sh(f'ffmpeg -y -v error -i {V}/clips/s6.mp4 -i {V}/narr/s6.wav -map 0:v -map 1:a -c:v copy {AUD} -shortest {V}/clips/s6f.mp4')
os.remove(f"{V}/clips/badges_v.mp4"); os.remove(f"{V}/clips/outro_v.mp4"); os.remove(f"{V}/clips/s6.mp4")
os.rename(f"{V}/clips/s6f.mp4", f"{V}/clips/s6.mp4")
print("s6 done", flush=True)

# ---------- concat (no re-encode) ----------
with open(f"{V}/list.txt", "w") as f:
    for name in ["intro"] + ORDER:
        f.write(f"file '{V}/clips/{name}.mp4'\n")
sh(f'ffmpeg -y -v error -f concat -safe 0 -i {V}/list.txt -c copy -movflags +faststart {OUT}')

probe = subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration,size","-of","json",OUT]).decode()
info = json.loads(probe)["format"]
print(f"FINAL: {OUT}", flush=True)
print(f"duration: {float(info['duration']):.1f}s  size: {int(info['size'])/1e6:.1f} MB", flush=True)
assert float(info["duration"]) < 180, "VIDEO EXCEEDS 3 MINUTES"
print("UNDER 3:00 OK", flush=True)
