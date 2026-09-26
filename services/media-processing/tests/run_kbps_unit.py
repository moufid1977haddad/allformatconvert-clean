"""The optional "kbps" parameter (Audio Compressor's Opus), checked on the ffmpeg command itself: no ffmpeg needed.
Run: python services/media-processing/tests/run_kbps_unit.py   (the end-to-end encode is in run_tests.py)"""
import os
import sys
import tempfile

# Throw-away values for this process only, so app.config can load (nothing here talks to a real service).
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


info = ffmpeg_ops.ProbeResult(10.0, False, True, 0, 0, 1411)
cmd = lambda params: ffmpeg_ops.build_command("convert", params, info, "in.flac", "out.bin", 1_000_000)[0]
bitrate = lambda argv: argv[argv.index("-b:a") + 1]

check("no kbps: Opus at the quality level's bitrate, as before (medium = 128k)", bitrate(cmd({"target": "opus"})) == "128k")
for k in (64, 96, 192, 256, 320):
    argv = cmd({"target": "opus", "kbps": k})
    check(f"kbps {k}: libopus at {k}k", bitrate(argv) == f"{k}k" and argv[argv.index("-c:a") + 1] == "libopus")
for bad, why in ((5, "below Opus's 6k"), (511, "above Opus's 510k"), ("128", "a string"), (True, "a boolean"), (128.5, "not whole")):
    try:
        cmd({"target": "opus", "kbps": bad}); ok = False
    except ValueError as e:
        ok = "bitrate" in str(e)
    check(f"kbps {bad!r} refused ({why})", ok)
try:
    cmd({"target": "mp3", "kbps": 128}); ok = False
except ValueError:
    ok = True
check("kbps on another target (mp3) refused: only Opus takes it", ok)
print(f"{fails} FAILED" if fails else "all passed")
sys.exit(1 if fails else 0)
