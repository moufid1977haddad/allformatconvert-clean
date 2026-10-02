"""P25 (03/10, E5) edits: mirror, free crop, speed, volume and fades, codec (H.265 / AV1), exact CRF.

1. ADDITIVE, byte for byte: for a matrix of requests the site sent BEFORE P25, the command built by this code is
   identical to the one built by the previous version of ffmpeg_ops.py (read from git at REF, default the parent
   commit of the P25 change: pass it as the 2nd argument).
2. Validation: every new option refuses what is outside its allowlist.
3. Real runs with ffmpeg (MEDIA_FFMPEG_PATH): pixels after a mirror and a crop, lengths after a speed change (video
   AND sound, frame rate kept), loudness after a volume change and a fade, codec and tag of H.265 / AV1, the exact CRF.
Run (from services/media-processing):
    MEDIA_FFMPEG_PATH=/path/to/ffmpeg .venv/Scripts/python tests/run_p25_edit_tests.py [git-ref-of-the-old-code]
"""
import importlib.util
import json
import math
import os
import struct
import subprocess
import sys
import tempfile

for k, v in {"MEDIA_TICKET_SECRET": "unit-test-only-" + "x" * 32, "ALLOWED_ORIGINS": "http://localhost", "MEDIA_WORK_DIR": tempfile.gettempdir(), "MEDIA_FFMPEG_PATH": "ffmpeg",
          **{k: "1" for k in ("MEDIA_MAX_CONCURRENT_JOBS", "MEDIA_MAX_QUEUED_JOBS", "MEDIA_MAX_FILE_BYTES", "MEDIA_MAX_DURATION_SECONDS", "MEDIA_JOB_TTL_SECONDS", "MEDIA_FFMPEG_TIMEOUT_SECONDS", "MEDIA_CHUNK_BYTES")}}.items():
    os.environ.setdefault(k, v)
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, ".."))
from app import ffmpeg_ops  # noqa: E402

fails = 0


def check(name, cond, detail=""):
    global fails
    print(("PASS " if cond else "FAIL ") + name + (f"  ({detail})" if detail else ""))
    fails += 0 if cond else 1


# ---- 1. the old requests build the old commands --------------------------------------------------------------
ref = sys.argv[1] if len(sys.argv) > 1 else "HEAD"
old_src = subprocess.run(["git", "show", f"{ref}:services/media-processing/app/ffmpeg_ops.py"], capture_output=True, text=True, cwd=os.path.join(HERE, "..")).stdout
spec = importlib.util.spec_from_loader("old_ops", loader=None)
old = importlib.util.module_from_spec(spec)
old.__dict__["__package__"] = "app"
exec(compile(old_src.replace("from . import config", "from app import config"), "old_ffmpeg_ops.py", "exec"), old.__dict__)
infos = [ffmpeg_ops.ProbeResult(10.0, True, True, 1920, 1080, 8000, 30.0), ffmpeg_ops.ProbeResult(10.0, True, False, 1280, 720, 0, 25.0),
         ffmpeg_ops.ProbeResult(10.0, False, True, 0, 0, 192)]
old_infos = [old.ProbeResult(10.0, True, True, 1920, 1080, 8000), old.ProbeResult(10.0, True, False, 1280, 720, 0), old.ProbeResult(10.0, False, True, 0, 0, 192)]
legacy_requests = [("compress", {"level": lv, **({"maxHeight": 720} if lv == "strong" else {})}) for lv in ("light", "balanced", "strong")]
legacy_requests += [("convert", {"target": t, "quality": q}) for t in ffmpeg_ops.TARGETS for q in ("high", "medium", "low")]
legacy_requests += [("convert", p) for p in (
    {"target": "mp4", "maxHeight": 480}, {"target": "mp4", "rotate": 90}, {"target": "mov", "fit": {"w": 640, "h": 360, "mode": "fill"}},
    {"target": "mp4", "filter": "sepia", "fps": 24}, {"target": "mp4", "fit": {"w": 640, "h": 360, "mode": "fit"}, "fps": 30, "forConcat": True},
    {"target": "mp4", "clipStart": 1.5, "clipDuration": 3}, {"target": "gif", "gifStart": 1, "gifDuration": 3, "gifWidth": 320, "gifFps": 10},
    {"target": "opus", "kbps": 64}, {"target": "mp3", "clipStart": 2, "clipDuration": 4})]
same, total = 0, 0
for op, params in legacy_requests:
    for i, (inf, oinf) in enumerate(zip(infos, old_infos)):
        try:
            new_cmd = ffmpeg_ops.build_command(op, params, inf, "in.bin", "out.bin", 5_000_000, 0)
        except ValueError as e:
            new_cmd = ("ValueError", str(e))
        try:
            old_cmd = old.build_command(op, params, oinf, "in.bin", "out.bin", 5_000_000, 0)
        except ValueError as e:
            old_cmd = ("ValueError", str(e))
        total += 1
        if new_cmd == old_cmd:
            same += 1
        else:
            print("  differs:", op, json.dumps(params), "info", i, "\n   old:", old_cmd, "\n   new:", new_cmd)
check(f"requests of before P25: the same command, byte for byte ({same}/{total})", same == total)
for op, params in legacy_requests[:5]:
    check(f"effective_duration unchanged {op} {json.dumps(params)[:40]}", ffmpeg_ops.effective_duration(op, params, infos[0]) == old.effective_duration(op, params, old_infos[0]))

# ---- 2. validation --------------------------------------------------------------------------------------------
info = infos[0]
cmd = lambda params, i=info, op="convert": ffmpeg_ops.build_command(op, {"target": "mp4", **params} if op == "convert" else params, i, "in.mp4", "out.bin", 10_000_000)[0]
vf = lambda a: a[a.index("-vf") + 1] if "-vf" in a else ""
af = lambda a: a[a.index("-af") + 1] if "-af" in a else ""
check("flip h -> hflip", "hflip" in vf(cmd({"flip": "h"})) and "vflip" not in vf(cmd({"flip": "h"})))
check("crop -> clamped crop filter", vf(cmd({"crop": {"x": 10, "y": 20, "w": 640, "h": 360}})).startswith("crop=w='min(640,iw)':h='min(360,ih)':x='min(10,iw-ow)':y='min(20,ih-oh)'"))
c2 = cmd({"speed": 2})
check("speed 2 -> setpts=PTS/2.0, atempo=2, frame rate kept (fps=30)", "setpts=PTS/2.0" in vf(c2) and vf(c2).endswith("fps=30.0") and af(c2) == "atempo=2")
check("speed 0.25 -> two atempo stages", af(cmd({"speed": 0.25})) == "atempo=0.5,atempo=0.5")
check("volume 1.5 -> volume=1.5", af(cmd({"volume": 1.5})) == "volume=1.5")
cf = cmd({"fadeIn": 1, "fadeOut": 2, "fadeVideo": True})
check("fades on the output timeline (10 s): afade out at 8 s, video fades too", "afade=t=out:st=8.000:d=2.000" in af(cf) and "fade=t=in:st=0:d=1.000" in vf(cf))
check("fades with speed 2: the output lasts 5 s, fade out at 4 s", "afade=t=out:st=4.000" in af(cmd({"speed": 2, "fadeOut": 1})))
ccut = cmd({"clipStart": 1, "clipDuration": 4, "volume": 0.5})
check("cut + volume: one -af chain, cut first", af(ccut).startswith("atrim=") and af(ccut).endswith("volume=0.5") and ccut.count("-af") == 1)
h = cmd({"codec": "h265"})
check("codec h265 in MP4: libx265, hvc1", "libx265" in h and h[h.index("-tag:v") + 1] == "hvc1" and h[h.index("-f", 8) + 1] == "mp4")
hm = ffmpeg_ops.build_command("convert", {"target": "mov", "codec": "h265"}, info, "in.mp4", "out.bin", 10_000_000)[0]
check("codec h265 in MOV: written as MOV", hm[hm.index("-f", 8) + 1] == "mov")
check("codec av1: libsvtav1", "libsvtav1" in cmd({"codec": "av1"}))
cc = cmd({"crf": 18})
check("crf 18 on H.264", cc[cc.index("-crf") + 1] == "18")
check("compress h265 balanced -> x265 crf 30", "libx265" in cmd({"codec": "h265", "level": "balanced"}, op="compress") and cmd({"codec": "h265", "level": "balanced"}, op="compress")[cmd({"codec": "h265", "level": "balanced"}, op="compress").index("-crf") + 1] == "30")
check("compress crf 26 on H.264", cmd({"crf": 26, "level": "balanced"}, op="compress")[cmd({"crf": 26, "level": "balanced"}, op="compress").index("-crf") + 1] == "26")
for bad, why in (({"flip": "x"}, "flip x"), ({"flip": 1}, "flip number"), ({"crop": {"x": 0, "y": 0, "w": 15, "h": 100}}, "crop too small"),
                 ({"crop": {"x": 0, "y": 0, "w": 101, "h": 100}}, "crop odd"), ({"crop": {"x": -2, "y": 0, "w": 100, "h": 100}}, "crop negative"),
                 ({"crop": "0,0,100,100"}, "crop string"), ({"speed": 1.1}, "speed 1.1"), ({"speed": True}, "speed bool"), ({"speed": 0}, "speed 0"),
                 ({"volume": 3.5}, "volume 350 %"), ({"volume": -1}, "volume negative"), ({"fadeIn": 11}, "fade 11 s"), ({"fadeVideo": "yes"}, "fadeVideo string"),
                 ({"fadeIn": 6, "fadeOut": 6}, "fades longer than the video"), ({"codec": "vp9"}, "codec vp9"), ({"crf": 52}, "crf 52 on H.264"),
                 ({"codec": "av1", "crf": 64}, "crf 64 on AV1"), ({"crf": 20.5}, "crf not whole"), ({"target": "webm", "codec": "h265"}, "codec in WebM"),
                 ({"target": "mov", "codec": "av1"}, "AV1 in MOV"), ({"forConcat": True, "speed": 2}, "speed when joining"), ({"target": "avi", "flip": "h"}, "edit in AVI")):
    try:
        cmd(bad); ok = False
    except ValueError:
        ok = True
    check(f"refused: {why}", ok)
check("an explicit CRF is encoded once (no size ladder)", "plan = [job.params]  # P25" in open(os.path.join(HERE, "..", "app", "jobs.py"), encoding="utf-8").read())

# ---- 3. real runs -----------------------------------------------------------------------------------------------
ff = os.environ.get("MEDIA_FFMPEG_PATH")
if not (ff and ff != "ffmpeg" and os.path.exists(ff)):
    print("SKIP real runs: MEDIA_FFMPEG_PATH does not point to an ffmpeg")
else:
    fp = os.path.join(os.path.dirname(ff), "ffprobe" + (".exe" if ff.endswith(".exe") else ""))
    d = tempfile.mkdtemp()
    src = os.path.join(d, "src.mp4")
    # 320x240, 30 fps, 4 s: top-left quarter red, the rest blue; sound: a 440 Hz sine at -12 dBFS
    subprocess.run([ff, "-y", "-v", "error", "-f", "lavfi", "-i", "color=c=0x0000FF:s=320x240:r=30:d=4", "-f", "lavfi", "-i", "sine=f=440:d=4:sample_rate=48000",
                    "-vf", "drawbox=x=0:y=0:w=160:h=120:color=red:t=fill", "-af", "volume=0.25", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-shortest", src], check=True)
    pinfo = ffmpeg_ops.probe(src)
    check("probe reads the frame rate", abs(pinfo.fps - 30) < 0.01, pinfo.fps)

    def run(params, name, op="convert", target="mp4"):
        out = os.path.join(d, name)
        argv, _, _ = ffmpeg_ops.build_command(op, {"target": target, "quality": "high", **params} if op == "convert" else params, pinfo, src, out, os.path.getsize(src))
        argv[0] = ff
        subprocess.run(argv, check=True)
        return out

    def streams(p):
        return json.loads(subprocess.run([fp, "-v", "error", "-show_streams", "-show_format", "-of", "json", p], capture_output=True, check=True).stdout)

    def frame(p, t=0.0):
        s = [x for x in streams(p)["streams"] if x["codec_type"] == "video"][0]
        raw = subprocess.run([ff, "-v", "error", "-ss", str(t), "-i", p, "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True, check=True).stdout
        return raw, s["width"], s["height"]

    def pixel(p, x, y, t=0.0):
        raw, w, _ = frame(p, t)
        i = (y * w + x) * 3
        return raw[i], raw[i + 1], raw[i + 2]

    def rms(p, start=None, dur=None):
        argv = [ff, "-v", "error"] + (["-ss", str(start)] if start is not None else []) + ["-i", p] + (["-t", str(dur)] if dur else []) + ["-vn", "-ac", "1", "-f", "s16le", "-"]
        raw = subprocess.run(argv, capture_output=True, check=True).stdout
        n = len(raw) // 2
        if not n:
            return 0.0
        vals = struct.unpack(f"<{n}h", raw[: n * 2])
        return math.sqrt(sum(v * v for v in vals) / n) / 32768

    red = lambda c: c[0] > 180 and c[2] < 80
    o = run({"flip": "h"}, "flip.mp4")
    check("mirror: the red quarter moves to the top RIGHT", red(pixel(o, 300, 20)) and not red(pixel(o, 20, 20)), f"{pixel(o, 300, 20)} {pixel(o, 20, 20)}")
    o = run({"flip": "v"}, "vflip.mp4")
    check("vertical mirror: red goes bottom left", red(pixel(o, 20, 220)) and not red(pixel(o, 20, 20)))
    o = run({"crop": {"x": 0, "y": 0, "w": 160, "h": 120}}, "crop.mp4")
    _, w, hgt = frame(o)
    check("crop 160x120 of the top-left: the picture is that size and all red", (w, hgt) == (160, 120) and red(pixel(o, 80, 60)) and red(pixel(o, 150, 110)), f"{w}x{hgt}")
    o = run({"crop": {"x": 300, "y": 200, "w": 200, "h": 200}}, "crop-out.mp4")
    _, w, hgt = frame(o)
    check("a crop box past the picture is clamped, not a failure", (w, hgt) == (200, 200), f"{w}x{hgt}")
    for sp, expect in ((2, 2.0), (4, 1.0), (0.5, 8.0), (0.25, 16.0)):
        o = run({"speed": sp}, f"speed{sp}.mp4")
        s = streams(o)
        v = [x for x in s["streams"] if x["codec_type"] == "video"][0]
        a = [x for x in s["streams"] if x["codec_type"] == "audio"][0]
        vfr = eval(v["avg_frame_rate"]) if v["avg_frame_rate"] != "0/0" else 0
        check(f"speed {sp}x: video and sound last {expect} s, frame rate 30", abs(float(v["duration"]) - expect) < 0.12 and abs(float(a["duration"]) - expect) < 0.12 and abs(vfr - 30) < 0.6,
              f"v {v['duration']} a {a['duration']} fps {vfr:.2f}")
    base_rms = rms(src)
    o = run({"volume": 0.5}, "vol.mp4")
    check("volume 50 %: the sound's RMS halves (±10 %)", abs(rms(o) / base_rms - 0.5) < 0.05, f"{rms(o) / base_rms:.3f}")
    o = run({"volume": 0}, "mute.mp4")
    check("volume 0: silent", rms(o) < 1e-4, rms(o))
    o = run({"fadeIn": 1, "fadeOut": 1, "fadeVideo": True}, "fade.mp4")
    check("fade in: the first 0.1 s is near silent, the middle is full", rms(o, 0, 0.1) < 0.15 * base_rms and abs(rms(o, 1.5, 1) / base_rms - 1) < 0.1, f"{rms(o, 0, 0.1) / base_rms:.3f}")
    check("fade out: the last 0.1 s is near silent", rms(o, 3.9, 0.1) < 0.15 * base_rms, f"{rms(o, 3.9, 0.1) / base_rms:.3f}")
    check("video fade: the first frame is black", max(pixel(o, 20, 20, 0)) < 30, pixel(o, 20, 20, 0))
    for codec, name, tag in (("h265", "hevc", "hvc1"), ("av1", "av1", None)):
        o = run({"codec": codec}, f"{codec}.mp4")
        v = [x for x in streams(o)["streams"] if x["codec_type"] == "video"][0]
        check(f"codec {codec}: {name}{' tagged ' + tag if tag else ''}, decodes", v["codec_name"] == name and (tag is None or v.get("codec_tag_string") == tag) and red(pixel(o, 20, 20)), v["codec_name"])
    # a detailed picture (a flat one costs nothing at any CRF), no sound
    noisy = os.path.join(d, "noisy.mp4")
    subprocess.run([ff, "-y", "-v", "error", "-f", "lavfi", "-i", "testsrc2=s=640x360:r=30:d=3,noise=alls=10:allf=t", "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p", noisy], check=True)
    ninfo = ffmpeg_ops.probe(noisy)
    def encode(params, name):
        out = os.path.join(d, name)
        argv, _, _ = ffmpeg_ops.build_command("convert", {"target": "mp4", **params}, ninfo, noisy, out, os.path.getsize(noisy))
        argv[0] = ff
        subprocess.run(argv, check=True)
        return os.path.getsize(out)
    s40, s18 = encode({"crf": 40}, "crf40.mp4"), encode({"crf": 18}, "crf18.mp4")
    check("CRF 40 gives a much smaller file than CRF 18", s40 < 0.4 * s18, f"{s40} vs {s18}")
    o = run({"codec": "h265", "level": "balanced"}, "c265.mp4", op="compress")
    check("compress in H.265: hevc, plays", [x for x in streams(o)["streams"] if x["codec_type"] == "video"][0]["codec_name"] == "hevc")

print("ALL PASS" if not fails else f"{fails} FAIL")
sys.exit(1 if fails else 0)
