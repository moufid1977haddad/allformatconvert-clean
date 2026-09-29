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
check("clip: coarse -ss BEFORE -i on the file's own clock (-copyts)", argv.index("-copyts") < argv.index("-ss") < argv.index("-i") and argv[argv.index("-ss") + 1] == "0.000")
check("clip: exact video trim + audio atrim, no -t", "trim=start=1.2975:end=3.6975,setpts=PTS-STARTPTS" in argv[argv.index("-vf") + 1]
      and argv[argv.index("-af") + 1] == "atrim=start=1.3000:end=3.7000,asetpts=PTS-STARTPTS" and "-t" not in argv)
late = cmd({"target": "mp4", "quality": "high", "clipStart": 8.25, "clipDuration": 1})
check("clip: the coarse seek stays 5 s before the start (speed only)", late[late.index("-ss") + 1] == "3.250")
fitted = cmd({"target": "mp4", "quality": "high", "clipStart": 1.3, "clipDuration": 2.4, "rotate": 90})
check("clip + edit: the trim comes first in the same filter chain", fitted[fitted.index("-vf") + 1].startswith("trim=") and "transpose=clock" in fitted[fitted.index("-vf") + 1])
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
    ffprobe = os.path.join(os.path.dirname(ff), "ffprobe" + (".exe" if ff.endswith(".exe") else ""))

    def frames_and_durations(path):
        rows = subprocess.run([ffprobe, "-v", "error", "-count_frames", "-show_entries", "stream=codec_type,nb_read_frames,duration,start_time", "-of", "csv=p=0", path],
                              capture_output=True, text=True, check=True).stdout.split()
        return {r.split(",")[0]: r.split(",")[1:] for r in rows}

    def first_level(path):
        first = subprocess.run([ff, "-v", "error", "-i", path, "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-"], capture_output=True, check=True).stdout[:320 * 240]
        return sum(first) / len(first)

    # 10 s, 30 fps, B-frames, a keyframe every 2 s, AAC; each frame shows its own number (drawn as a grey level)
    src = os.path.join(d, "src.mp4")
    subprocess.run([ff, "-y", "-v", "error", "-f", "lavfi", "-i", "color=c=black:s=320x240:r=30:d=10", "-f", "lavfi", "-i", "sine=d=10:r=48000",
                    "-vf", "geq=lum='mod(N,256)':cb=128:cr=128", "-c:v", "libx264", "-g", "60", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", src], check=True)
    # The piece Video Trimmer sends (30/09): copied from the keyframe at 0 s into MKV -- sound starts at ~0.046 s,
    # video at 0.067 s (B-frames), which is what made the old cut 1-2 frames late and short (Safari: 118 frames).
    piece = os.path.join(d, "piece.mkv")
    subprocess.run([ff, "-y", "-v", "error", "-ss", "0", "-i", src, "-t", "6", "-map", "0:v:0", "-map", "0:a:0", "-c", "copy", "-avoid_negative_ts", "make_zero", piece], check=True)
    p0 = float(subprocess.run([ffprobe, "-v", "error", "-select_streams", "v:0", "-read_intervals", "%+#1", "-show_entries", "frame=pts_time", "-of", "csv=p=0", piece],
                              capture_output=True, text=True, check=True).stdout.strip().split(",")[0])
    cases = [("whole file, 1.3 s + 2.4 s", src, 1.3, 2.4, 39, 72), ("whole file, 7.3 s + 2.0 s (coarse seek)", src, 7.3, 2.0, 219, 60),
             ("browser piece, 1 s -> 5 s (the Safari case)", piece, round(p0 + 1.0, 3), 4.0, 30, 120)]
    for name, path, start, dur, frame, count in cases:
        out = os.path.join(d, "out.mp4")
        argv, _, _ = ffmpeg_ops.build_command("convert", {"target": "mp4", "quality": "high", "clipStart": start, "clipDuration": dur}, ffmpeg_ops.probe(path), path, out, os.path.getsize(path))
        argv[0] = ff
        subprocess.run(argv, check=True)
        got = frames_and_durations(out)
        v, a = got["video"], got["audio"]
        check(f"real cut, {name}: {v[2]} video frames for {count}", int(v[2]) == count)
        check(f"real cut, {name}: video {float(v[1]):.3f} s and sound {float(a[1]):.3f} s for {dur} s, both from 0",
              abs(float(v[1]) - dur) < 0.001 and abs(float(a[1]) - dur) < 0.022 and float(v[0]) == 0 and float(a[0]) == 0)
        level = first_level(out)
        check(f"real cut, {name}: first frame is frame {frame} (grey level {level:.1f})", abs(level - (frame % 256)) < 1.5)
else:
    print("SKIP real cut: MEDIA_FFMPEG_PATH not set to an ffmpeg binary")

print("FAILURES: %d" % fails if fails else "ALL PASS")
sys.exit(1 if fails else 0)
