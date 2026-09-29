"""Video edits (rotate / fit / filter / fps / forConcat, 30/09): command checks without ffmpeg, then real runs with
ffmpeg when MEDIA_FFMPEG_PATH points to one: rotation of a rotated phone video, letterbox/crop/stretch sizes, each
filter against the CSS formula on a known colour, and two different clips normalised then joined WITHOUT re-encoding
(concat demuxer, -c copy) into a file that decodes to the end with both durations.
Run: MEDIA_FFMPEG_PATH=/path/to/ffmpeg python services/media-processing/tests/run_edit_tests.py"""
import json
import os
import subprocess
import sys
import tempfile

for k, v in {"MEDIA_TICKET_SECRET": "unit-test-only-" + "x" * 32, "ALLOWED_ORIGINS": "http://localhost", "MEDIA_WORK_DIR": tempfile.gettempdir(), "MEDIA_FFMPEG_PATH": "ffmpeg",
          **{k: "1" for k in ("MEDIA_MAX_CONCURRENT_JOBS", "MEDIA_MAX_QUEUED_JOBS", "MEDIA_MAX_FILE_BYTES", "MEDIA_MAX_DURATION_SECONDS", "MEDIA_JOB_TTL_SECONDS", "MEDIA_FFMPEG_TIMEOUT_SECONDS", "MEDIA_CHUNK_BYTES")}}.items():
    os.environ.setdefault(k, v)
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from app import ffmpeg_ops  # noqa: E402

fails = 0


def check(name, cond, detail=""):
    global fails
    print(("PASS " if cond else "FAIL ") + name + (f"  ({detail})" if detail else ""))
    fails += 0 if cond else 1


info = ffmpeg_ops.ProbeResult(10.0, True, True, 1920, 1080, 8000)
silent = ffmpeg_ops.ProbeResult(10.0, True, False, 1920, 1080, 8000)
cmd = lambda params, i=info: ffmpeg_ops.build_command("convert", params, i, "in.mp4", "out.bin", 10_000_000)[0]
vf = lambda argv: argv[argv.index("-vf") + 1] if "-vf" in argv else None

plain = cmd({"target": "mp4", "quality": "high"})
check("no edit: no -vf, no extra input (as before)", "-vf" not in plain and plain.count("-i") == 1)
check("rotate 90 -> transpose=clock", vf(cmd({"target": "mp4", "rotate": 90})) == "transpose=clock")
check("rotate 270 -> transpose=cclock", vf(cmd({"target": "mp4", "rotate": 270})) == "transpose=cclock")
check("fit fit -> scale + pad (letterbox)", "pad=854:480" in vf(cmd({"target": "mp4", "fit": {"w": 854, "h": 480, "mode": "fit"}})))
check("fit fill -> scale + crop", "crop=854:480" in vf(cmd({"target": "mp4", "fit": {"w": 854, "h": 480, "mode": "fill"}})))
check("filter grayscale -> CSS luminance weights", vf(cmd({"target": "mp4", "filter": "grayscale"})).startswith("colorchannelmixer=.2126:.7152:.0722"))
a = cmd({"target": "mp4", "fit": {"w": 640, "h": 360, "mode": "fit"}, "fps": 30, "forConcat": True}, silent)
check("forConcat on a silent clip: a silence input BEFORE the output options, mapped as the audio", a.index("anullsrc=r=48000:cl=stereo") < a.index("-map_metadata") and a[a.index("-map", a.index("-map") + 1) + 1] == "1:a:0")
check("forConcat: stitchable x264, 48 kHz stereo, fixed timescale", "stitchable=1" in a and a[a.index("-ar") + 1] == "48000" and a[a.index("-ac") + 1] == "2")
for bad, why in (({"rotate": 45}, "rotation 45"), ({"rotate": True}, "rotation boolean"), ({"fit": {"w": 853, "h": 480}}, "odd width"),
                 ({"fit": {"w": 99999, "h": 480}}, "huge width"), ({"fit": {"w": 640, "h": 480, "mode": "zoom"}}, "unknown mode"),
                 ({"filter": "sharpen; rm -rf"}, "unknown filter"), ({"fps": 0}, "fps 0"), ({"fps": "30"}, "fps string"),
                 ({"target": "webm", "rotate": 90}, "edit in WebM"), ({"fit": {"w": 640, "h": 360}, "maxHeight": 480}, "size and max height")):
    try:
        cmd({"target": "mp4", **bad}); ok = False
    except ValueError:
        ok = True
    check(f"refused: {why}", ok)

ff = os.environ.get("MEDIA_FFMPEG_PATH")
if ff and ff != "ffmpeg" and os.path.exists(ff):
    fp = os.path.join(os.path.dirname(ff), "ffprobe" + (".exe" if ff.endswith(".exe") else ""))
    d = tempfile.mkdtemp()

    def run_edit(src, params):
        out = os.path.join(d, f"out-{abs(hash(src + json.dumps(params, sort_keys=True)))}.mp4")
        argv, _, _ = ffmpeg_ops.build_command("convert", {"target": "mp4", "quality": "high", **params}, ffmpeg_ops.probe(src), src, out, os.path.getsize(src))
        argv[0] = ff
        subprocess.run(argv, check=True)
        return out

    def streams(p):
        return json.loads(subprocess.run([fp, "-v", "error", "-show_streams", "-show_format", "-of", "json", p], capture_output=True, check=True).stdout)

    def pixel(p, x, y):
        raw = subprocess.run([ff, "-v", "error", "-i", p, "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True, check=True).stdout
        s = streams(p)["streams"][0]; w = s["width"]
        i = (y * w + x) * 3
        return raw[i], raw[i + 1], raw[i + 2]

    # A 320x240 clip, top-left quarter red, the rest (0,120,200), stored rotated 90 degrees (a phone portrait video).
    src = os.path.join(d, "phone.mp4")
    subprocess.run([ff, "-y", "-v", "error", "-f", "lavfi", "-i", "color=c=0x0078C8:s=320x240:r=30:d=2", "-f", "lavfi", "-i", "sine=d=2",
                    "-vf", "drawbox=x=0:y=0:w=160:h=120:color=red:t=fill", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", src + ".raw.mp4"], check=True)
    # stored 320x240, shown turned 90 degrees clockwise (display matrix -90, as an iPhone portrait video)
    subprocess.run([ff, "-y", "-v", "error", "-display_rotation:v:0", "-90", "-i", src + ".raw.mp4", "-c", "copy", src], check=True)
    s0 = streams(src)["streams"][0]
    out = run_edit(src, {"rotate": 90})
    s = streams(out)["streams"][0]
    # displayed source = 240x320 (rotated 90); turned 90 more -> 320x240, no rotation left in the file
    rot = [sd.get("rotation") for sd in s.get("side_data_list", []) if "rotation" in sd]
    check(f"rotate 90 of a phone video shown 240x320: result {s['width']}x{s['height']}, rotation metadata {rot or 'none'}", s["width"] == 320 and s["height"] == 240 and not any(rot))
    r = pixel(out, 300, 220)  # red quarter: source top-left -> shown top-right (90) -> bottom-right (180)
    check(f"rotate: red corner ends bottom-right (180 degrees from the stored top-left) {r}", r[0] > 180 and r[2] < 80)
    out = run_edit(src, {"fit": {"w": 640, "h": 360, "mode": "fit"}})
    s = streams(out)["streams"][0]
    check(f"fit 640x360 of a 240x320 portrait: {s['width']}x{s['height']}, black bars left/right", s["width"] == 640 and s["height"] == 360 and max(pixel(out, 10, 180)) < 30)
    out = run_edit(src, {"fit": {"w": 640, "h": 360, "mode": "fill"}})
    check("fill 640x360: no bars (cropped)", max(pixel(out, 10, 180)) > 60)
    # filters on a flat (0,120,200) frame vs the CSS formula
    flat = os.path.join(d, "flat.mp4")
    subprocess.run([ff, "-y", "-v", "error", "-f", "lavfi", "-i", "color=c=0x0078C8:s=64x64:r=10:d=1", "-c:v", "libx264", "-qp", "0", "-pix_fmt", "yuv444p", flat], check=True)
    base = pixel(flat, 32, 32)
    css = {
        "grayscale": lambda r, g, b: (0.2126 * r + 0.7152 * g + 0.0722 * b,) * 3,
        "invert": lambda r, g, b: (255 - r, 255 - g, 255 - b),
        "brightness": lambda r, g, b: tuple(min(255, v * 1.5) for v in (r, g, b)),
        "contrast": lambda r, g, b: tuple(min(255, max(0, (v - 127.5) * 2 + 127.5)) for v in (r, g, b)),
        "sepia": lambda r, g, b: (min(255, .393 * r + .769 * g + .189 * b), min(255, .349 * r + .686 * g + .168 * b), min(255, .272 * r + .534 * g + .131 * b)),
    }
    for name, f in css.items():
        got = pixel(run_edit(flat, {"filter": name}), 32, 32)
        want = f(*base)
        err = max(abs(a - b) for a, b in zip(got, want))
        check(f"filter {name}: {got} vs CSS {tuple(round(v) for v in want)} from {base}", err <= 12, f"max error {err:.0f}")
    # merge: a 2 s phone clip (rotated, with sound) + a 1.5 s silent 640x360 clip at 25 fps -> both 640x360, 30 fps,
    # forConcat; joined by -c copy with the concat demuxer (what the browser does with ffmpeg.wasm)
    other = os.path.join(d, "other.mp4")
    subprocess.run([ff, "-y", "-v", "error", "-f", "lavfi", "-i", "testsrc=s=640x360:r=25:d=1.5", "-c:v", "libx264", "-pix_fmt", "yuv420p", other], check=True)
    parts = [run_edit(p, {"fit": {"w": 640, "h": 360, "mode": "fit"}, "fps": 30, "forConcat": True}) for p in (src, other)]
    lst = os.path.join(d, "list.txt")
    with open(lst, "w") as fh:
        fh.write("".join(f"file '{p}'\n" for p in parts))
    joined = os.path.join(d, "joined.mp4")
    subprocess.run([ff, "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", "-movflags", "+faststart", joined], check=True)
    dec = subprocess.run([ff, "-v", "error", "-i", joined, "-f", "null", "-"], capture_output=True, text=True)
    info_j = streams(joined)
    dur = float(info_j["format"]["duration"])
    print("   parts:", [(round(float(streams(p)["format"]["duration"]), 3), [(x["codec_type"], x.get("duration")) for x in streams(p)["streams"]]) for p in parts])
    print("   joined:", [(x["codec_type"], x.get("duration"), x.get("nb_frames")) for x in info_j["streams"]])
    kinds = sorted(s["codec_type"] for s in info_j["streams"])
    check(f"merge by copy: {dur:.2f} s for 3.5 s, streams {kinds}, decodes with no error", abs(dur - 3.5) < 0.12 and kinds == ["audio", "video"] and dec.returncode == 0 and not dec.stderr.strip(), dec.stderr.strip()[:200])
    # a browser recording has no duration in its header (MediaRecorder WebM; ffmpeg's "-live 1" writes the same)
    live = os.path.join(d, "recording.webm")
    subprocess.run([ff, "-y", "-v", "error", "-f", "lavfi", "-i", "testsrc=s=320x240:r=30:d=2.5", "-c:v", "libvpx-vp9", "-b:v", "200k", "-f", "webm", "-live", "1", live], check=True)
    head = subprocess.run([ff, "-hide_banner", "-i", live], capture_output=True).stderr.decode()
    pr = ffmpeg_ops.probe(live)
    check(f"browser recording without a duration ('Duration: N/A' in its header): read, {pr.duration if pr else None} s", "Duration: N/A" in head and pr is not None and abs(pr.duration - 2.5) < 0.1)
else:
    print("(ffmpeg runs skipped: MEDIA_FFMPEG_PATH not set)")

print("ALL PASS" if not fails else f"FAILURES: {fails}")
sys.exit(1 if fails else 0)
