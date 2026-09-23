"""GIF options of the "convert" job (video-to-gif, mp4-to-gif) over REAL HTTP with a REAL ffmpeg.

Usage (from services/media-processing):  python tests/run_gif_tests.py <ffmpeg_path> <video>...
Throwaway signing key generated in memory. Checks, for each video: the GIF keeps the source's
proportions (a vertical video stays vertical), honours width / fps / start / duration, and the
defaults (no options: what video-converter sends) are unchanged.
"""
import base64
import hashlib
import hmac
import json
import os
import secrets
import subprocess
import sys
import tempfile
import time
import urllib.request

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SECRET = secrets.token_urlsafe(32).encode()
FFMPEG = sys.argv[1]
VIDEOS = sys.argv[2:]
PORT = 8633
failures, passed = [], 0


def check(name, cond, detail=""):
    global passed
    if cond:
        passed += 1
        print("  PASS", name)
    else:
        failures.append(name)
        print("  FAIL", name, detail)


def ticket(op="convert"):
    jid = secrets.token_hex(12)
    payload = {"jid": jid, "op": op, "max": 500 * 1024 * 1024, "exp": int(time.time()) + 600}
    body = base64.urlsafe_b64encode(json.dumps(payload, separators=(",", ":")).encode()).rstrip(b"=").decode()
    mac = base64.urlsafe_b64encode(hmac.new(SECRET, body.encode(), hashlib.sha256).digest()).rstrip(b"=").decode()
    return jid, f"v1.{body}.{mac}"


def req(method, path, tk, body=None, raw=None, headers=None):
    h = {"Authorization": "Bearer " + tk, **(headers or {})}
    data = raw if raw is not None else (json.dumps(body).encode() if body is not None else None)
    if body is not None:
        h["Content-Type"] = "application/json"
    r = urllib.request.Request(f"http://127.0.0.1:{PORT}{path}", data=data, method=method, headers=h)
    try:
        with urllib.request.urlopen(r, timeout=120) as res:
            b = res.read()
            return res.status, b
    except urllib.error.HTTPError as e:
        return e.code, e.read()


def gif(video, params):
    data = open(video, "rb").read()
    jid, tk = ticket()
    st, b = req("POST", "/v1/jobs", tk, {"op": "convert", "size": len(data), "params": dict(target="gif", **params)})
    assert st == 201, (st, b)
    j = json.loads(b)
    for n in range(j["totalChunks"]):
        part = data[n * j["chunkBytes"]:(n + 1) * j["chunkBytes"]]
        st, _ = req("PUT", f"/v1/jobs/{jid}/chunks/{n}", tk, raw=part, headers={"X-Chunk-Sha256": hashlib.sha256(part).hexdigest()})
        assert st == 200
    req("POST", f"/v1/jobs/{jid}/start", tk)
    for _ in range(600):
        st, b = req("GET", f"/v1/jobs/{jid}", tk)
        s = json.loads(b)
        if s["status"] in ("done", "error"):
            break
        time.sleep(0.3)
    if s["status"] != "done":
        return None, s
    st, b = req("GET", f"/v1/jobs/{jid}/result", tk)
    path = os.path.join(tempfile.gettempdir(), f"gif-test-{jid}.gif")
    open(path, "wb").write(b)
    return path, s


def props(path):
    im = Image.open(path)
    n, total = 0, 0
    try:
        while True:
            total += im.info.get("duration", 0)
            n += 1
            im.seek(im.tell() + 1)
    except EOFError:
        pass
    return Image.open(path).size, n, total / 1000.0


def probe_size(video):
    out = subprocess.run([FFMPEG, "-hide_banner", "-i", video], capture_output=True, text=True).stderr
    import re
    m = re.search(r"Video:.*?(\d{2,5})x(\d{2,5})", out)
    return int(m.group(1)), int(m.group(2))


def main():
    work = tempfile.mkdtemp(prefix="gif-test-")
    env = dict(os.environ, PORT=str(PORT), MEDIA_TICKET_SECRET=SECRET.decode(), ALLOWED_ORIGINS="https://www.example.test",
               MEDIA_MAX_CONCURRENT_JOBS="1", MEDIA_MAX_QUEUED_JOBS="4", MEDIA_MAX_FILE_BYTES=str(500 * 1024 * 1024),
               MEDIA_MAX_DURATION_SECONDS="600", MEDIA_JOB_TTL_SECONDS="600", MEDIA_FFMPEG_TIMEOUT_SECONDS="300",
               MEDIA_WORK_DIR=work, MEDIA_FFMPEG_PATH=FFMPEG, MEDIA_CHUNK_BYTES=str(4 * 1024 * 1024))
    proc = subprocess.Popen([sys.executable, "-m", "app.main"], cwd=ROOT, env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(60):
            try:
                urllib.request.urlopen(f"http://127.0.0.1:{PORT}/health", timeout=2)
                break
            except Exception:
                time.sleep(0.3)
        for video in VIDEOS:
            vw, vh = probe_size(video)
            print(f"== {os.path.basename(video)} ({vw}x{vh})")
            path, s = gif(video, {"gifStart": 1.0, "gifDuration": 2.0, "gifWidth": 320, "gifFps": 10})
            check("gif produced", path is not None, s)
            if path:
                (w, h), frames, secs = props(path)
                check(f"width 320 honoured ({w}x{h})", w == min(320, vw))
                check(f"proportions kept (source {vw / vh:.3f}, gif {w / h:.3f})", abs(w / h - vw / vh) < 0.02)
                check(f"~10 fps x 2 s ({frames} frames, {secs:.2f} s)", 18 <= frames <= 22 and 1.8 <= secs <= 2.2)
            path, s = gif(video, {})
            check("defaults (video-converter) still produce a GIF", path is not None, s)
            if path:
                (w, h), frames, secs = props(path)
                check(f"default width min(640, source) ({w}x{h}), proportions kept", w == min(640, vw) and abs(w / h - vw / vh) < 0.02)
        jid, tk = ticket()
        st, b = req("POST", "/v1/jobs", tk, {"op": "convert", "size": 1000, "params": {"target": "gif", "gifFps": 7}})
        # validation happens at probe time (after upload); creating the job is allowed, the job then fails
        check("job with an invalid option is created (validated on start)", st == 201)
    finally:
        proc.terminate()
    print(f"\n{passed} passed, {len(failures)} failed")
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
