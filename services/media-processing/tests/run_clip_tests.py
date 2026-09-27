"""The optional precise cut ("clipStart"/"clipDuration", Video Trimmer 28/09): command checks without ffmpeg, then
a real frame-accurate cut with ffmpeg when MEDIA_FFMPEG_PATH points to one (the first frame kept is the first one
at or after the start, the length is the one asked).
Run: MEDIA_FFMPEG_PATH=/path/to/ffmpeg python services/media-processing/tests/run_clip_tests.py"""
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
cmd = lambda params: ffmpeg_ops.build_command("convert", params, info, "in.mp4", "out.bin", 10_000_000)[0]

plain = cmd({"target": "mp4", "quality": "high"})
check("no clip: the whole file, no -ss / -t (as before)", "-ss" not in plain and "-t" not in plain)
argv = cmd({"target": "mp4", "quality": "high", "clipStart": 1.3, "clipDuration": 2.4})
check("clip: -ss 1.300 BEFORE -i (fast seek, exact once re-encoded)", argv.index("-ss") < argv.index("-i") and argv[argv.index("-ss") + 1] == "1.300")
check("clip: -t 2.400 after the input", argv.index("-t") > argv.index("-i") and argv[argv.index("-t") + 1] == "2.400")
check("clip: re-encoded to H.264 (never stream-copied)", argv[argv.index("-c:v") + 1] == "libx264" and "copy" not in argv)
check("progress 100 % = the clip's length", ffmpeg_ops.effective_duration("convert", {"target": "mp4", "clipStart": 1.3, "clipDuration": 2.4}, info) == 2.4)
check("progress: clip running past the end is capped", ffmpeg_ops.effective_duration("convert", {"target": "mp4", "clipStart": 9.0, "clipDuration": 5}, info) == 1.0)
for bad, why in (({"clipStart": -1, "clipDuration": 2}, "negative start"), ({"clipStart": 10, "clipDuration": 2}, "start past the end"), ({"clipStart": 1, "clipDuration": 0}, "zero length"),
                 ({"clipStart": "1", "clipDuration": 2}, "a string"), ({"clipStart": True, "clipDuration": 2}, "a boolean"), ({"clipDuration": 2}, "start missing")):
    try:
        cmd({"target": "mp4", **bad}); ok = False
    except ValueError:
        ok = True
    check(f"refused: {why}", ok)

ff = os.environ.get("MEDIA_FFMPEG_PATH")
if ff and ff != "ffmpeg" and os.path.exists(ff):
    d = tempfile.mkdtemp()
    src, out = os.path.join(d, "src.mp4"), os.path.join(d, "out.mp4")
    # 10 s, 30 fps, a keyframe every 2 s; each frame shows its own number (drawn as a grey level)
    subprocess.run([ff, "-y", "-v", "error", "-f", "lavfi", "-i", "color=c=black:s=320x240:r=30:d=10", "-f", "lavfi", "-i", "sine=d=10",
                    "-vf", "geq=lum='mod(N,256)':cb=128:cr=128", "-c:v", "libx264", "-g", "60", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", src], check=True)
    probe = ffmpeg_ops.probe(src)
    argv, _, _ = ffmpeg_ops.build_command("convert", {"target": "mp4", "quality": "high", "clipStart": 1.3, "clipDuration": 2.4}, probe, src, out, os.path.getsize(src))
    argv[0] = ff
    subprocess.run(argv, check=True)
    got = ffmpeg_ops.probe(out)
    check(f"real cut: length {got.duration:.3f} s for 2.4 s asked", abs(got.duration - 2.4) < 0.07)
    first = subprocess.run([ff, "-v", "error", "-i", out, "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-"], capture_output=True, check=True).stdout[:320 * 240]  # the Y plane as stored
    level = sum(first) / len(first)
    # frame 39 (1.300 s at 30 fps) -> grey level 39; the keyframe before (frame 30) would be 30
    check(f"real cut: first frame is frame 39 (1.30 s), not the keyframe at 1.00 s (grey level {level:.1f})", abs(level - 39) < 1.5)
else:
    print("SKIP real cut: MEDIA_FFMPEG_PATH not set to an ffmpeg binary")

print("FAILURES: %d" % fails if fails else "ALL PASS")
sys.exit(1 if fails else 0)
