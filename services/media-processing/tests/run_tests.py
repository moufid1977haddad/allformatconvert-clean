"""End-to-end tests of the media-processing service over REAL HTTP with a REAL ffmpeg.

Usage (from services/media-processing):
    .venv/Scripts/python tests/run_tests.py <ffmpeg_path> <sample_dir>

<sample_dir> must contain: s30.mp4 (a real ~30 s H.264 video). The tests derive
everything else from it with ffmpeg itself.

The signing key used here is generated in memory for the run and handed to the
child processes through their environment only: it is a throwaway test value,
never written to disk, never a project secret.
"""
import base64
import hashlib
import hmac
import json
import os
import secrets
import shutil
import subprocess
import sys
import tempfile
import threading
import time
import urllib.error
import urllib.request

FFMPEG, SAMPLES = sys.argv[1], sys.argv[2]
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SECRET = secrets.token_urlsafe(32).encode()
ORIGIN = "https://www.example.test"
failures = []
passed = 0


def check(name, cond, detail=""):
    global passed
    if cond:
        passed += 1
        print("  PASS", name)
    else:
        failures.append(name)
        print("  FAIL", name, detail)


def ticket(jid=None, op="convert", mx=200 * 1024 * 1024, exp=None, secret=SECRET):
    jid = jid or secrets.token_hex(12)
    payload = {"jid": jid, "op": op, "max": mx, "exp": int(time.time()) + 600 if exp is None else exp}
    body = base64.urlsafe_b64encode(json.dumps(payload, separators=(",", ":")).encode()).rstrip(b"=").decode()
    mac = base64.urlsafe_b64encode(hmac.new(secret, body.encode(), hashlib.sha256).digest()).rstrip(b"=").decode()
    return jid, f"v1.{body}.{mac}"


class Server:
    def __init__(self, port, **over):
        self.port = port
        self.work = tempfile.mkdtemp(prefix="media-test-")
        env = dict(os.environ, PORT=str(port), MEDIA_TICKET_SECRET=SECRET.decode(), ALLOWED_ORIGINS=ORIGIN,
                   MEDIA_MAX_CONCURRENT_JOBS="2", MEDIA_MAX_QUEUED_JOBS="4", MEDIA_MAX_FILE_BYTES=str(300 * 1024 * 1024),
                   MEDIA_MAX_DURATION_SECONDS="7200", MEDIA_JOB_TTL_SECONDS="600", MEDIA_FFMPEG_TIMEOUT_SECONDS="600",
                   MEDIA_WORK_DIR=self.work, MEDIA_FFMPEG_PATH=FFMPEG, MEDIA_CHUNK_BYTES=str(4 * 1024 * 1024))
        env.update({k: str(v) for k, v in over.items()})
        self.proc = subprocess.Popen([sys.executable, "-m", "app.main"], cwd=ROOT, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
        self.log = []
        threading.Thread(target=lambda: [self.log.append(l.decode("utf8", "replace")) for l in self.proc.stdout], daemon=True).start()
        for _ in range(60):
            try:
                if req(self, "GET", "/health")[0] == 200:
                    return
            except Exception:
                time.sleep(0.5)
        raise RuntimeError("server did not start: " + "".join(self.log[-10:]))

    def stop(self):
        self.proc.kill()
        self.proc.wait()
        shutil.rmtree(self.work, ignore_errors=True)


def req(srv, method, path, tk=None, body=None, raw=None, headers=None, raw_response=False):
    h = dict(headers or {})
    if tk:
        h["Authorization"] = "Bearer " + tk
    data = raw
    if body is not None:
        data = json.dumps(body).encode()
        h["Content-Type"] = "application/json"
    r = urllib.request.Request(f"http://127.0.0.1:{srv.port}{path}", data=data, method=method, headers=h)
    try:
        with urllib.request.urlopen(r, timeout=120) as resp:
            content = resp.read()
            return resp.status, (content if raw_response else json.loads(content or b"{}")), resp.headers
    except urllib.error.HTTPError as e:
        content = e.read()
        try:
            return e.code, json.loads(content or b"{}"), e.headers
        except Exception:
            return e.code, {}, e.headers


def upload(srv, path, op, params, tk=None, jid=None, skip=()):
    if tk is None:
        jid, tk = ticket(jid, op)
    size = os.path.getsize(path)
    st, j, _ = req(srv, "POST", "/v1/jobs", tk, {"op": op, "size": size, "params": params})
    if st != 201:
        return jid, tk, st, j
    cb = j["chunkBytes"]
    with open(path, "rb") as f:
        for n in range(j["totalChunks"]):
            chunk = f.read(cb)
            if n in skip:
                continue
            s2, j2, _ = req(srv, "PUT", f"/v1/jobs/{jid}/chunks/{n}", tk, raw=chunk, headers={"X-Chunk-Sha256": hashlib.sha256(chunk).hexdigest()})
            assert s2 == 200, (n, s2, j2)
    return jid, tk, 201, j


def wait_done(srv, jid, tk, limit=300):
    t0 = time.time()
    last = None
    while time.time() - t0 < limit:
        st, j, _ = req(srv, "GET", f"/v1/jobs/{jid}", tk)
        last = j
        if st == 200 and j["status"] in ("done", "error"):
            return j, time.time() - t0
        time.sleep(0.25)
    return last, time.time() - t0


def info(path):
    p = subprocess.run([FFMPEG, "-hide_banner", "-i", path], capture_output=True)
    e = p.stderr.decode("utf8", "replace")
    import re
    d = re.search(r"Duration:\s*(\d+):(\d+):(\d+\.\d+)", e)
    dur = int(d.group(1)) * 3600 + int(d.group(2)) * 60 + float(d.group(3)) if d else None
    return dur, e


def download(srv, jid, tk, suffix):
    st, data, h = req(srv, "GET", f"/v1/jobs/{jid}/result", tk, raw_response=True)
    out = os.path.join(tempfile.gettempdir(), f"media-test-out-{jid}.{suffix}")
    if st == 200:
        open(out, "wb").write(data)
    return st, out, h


SRC = os.path.join(SAMPLES, "s30.mp4")
short = os.path.join(tempfile.gettempdir(), "media-test-short.mp4")
subprocess.run([FFMPEG, "-hide_banner", "-loglevel", "error", "-y", "-t", "6", "-i", SRC, "-c", "copy", short], check=True)
notvideo = os.path.join(tempfile.gettempdir(), "media-test-notvideo.mp4")
open(notvideo, "wb").write(b"this is not a video " * 5000)
concat = os.path.join(tempfile.gettempdir(), "media-test-concat.txt")
open(concat, "w").write("ffconcat version 1.0\nfile '" + short.replace("\\", "/") + "'\n")

srv = Server(8611)
try:
    print("auth")
    st, j, _ = req(srv, "POST", "/v1/jobs", None, {"op": "convert", "size": 10})
    check("no ticket -> 401", st == 401)
    jid, tk = ticket(secret=b"another-secret-entirely-000000000")
    st, j, _ = req(srv, "POST", "/v1/jobs", tk, {"op": "convert", "size": 10})
    check("ticket signed with a different key -> 401", st == 401 and j["reason"] == "bad_signature")
    jid, tk = ticket(exp=int(time.time()) - 5)
    st, j, _ = req(srv, "POST", "/v1/jobs", tk, {"op": "convert", "size": 10})
    check("expired ticket -> 401", st == 401 and j["reason"] == "expired")
    jid, tk = ticket(jid="../../etc/passwd0000000")
    st, j, _ = req(srv, "POST", "/v1/jobs", tk, {"op": "convert", "size": 10})
    check("path-traversal job id in a validly signed ticket -> 401", st == 401)
    jid, tk = ticket(op="compress")
    st, j, _ = req(srv, "POST", "/v1/jobs", tk, {"op": "convert", "size": 10})
    check("ticket op != request op -> 400", st == 400)
    jid, tk = ticket(mx=1000)
    st, j, _ = req(srv, "POST", "/v1/jobs", tk, {"op": "convert", "size": 5000, "params": {}})
    check("size above the ticket's max -> 413", st == 413)
    jid, tk = ticket()
    st, _, _ = req(srv, "POST", "/v1/jobs", tk, {"op": "convert", "size": os.path.getsize(short), "params": {"target": "mp4"}})
    other, tk2 = ticket()
    st2, j2, _ = req(srv, "GET", f"/v1/jobs/{jid}", tk2)
    check("ticket of job B cannot read job A -> 401", st2 == 401 and j2["reason"] == "wrong_job")
    st3, j3, _ = req(srv, "POST", "/v1/jobs", tk, {"op": "convert", "size": 10, "params": {}})
    check("a ticket cannot create its job twice -> 409", st3 == 409)

    print("cors")
    st, _, h = req(srv, "GET", "/health", headers={"Origin": ORIGIN})
    check("allowed origin is echoed", h.get("Access-Control-Allow-Origin") == ORIGIN)
    st, _, h = req(srv, "GET", "/health", headers={"Origin": "https://evil.test"})
    check("other origin gets no CORS header", h.get("Access-Control-Allow-Origin") is None)

    print("validation")
    jid, tk, st, j = upload(srv, notvideo, "convert", {"target": "mp4"})
    st, j, _ = req(srv, "POST", f"/v1/jobs/{jid}/start", tk)
    check("a non-media file is refused (422 not_media)", st == 422 and j["error"] == "not_media")
    check("...and its bytes are already deleted", not os.path.exists(os.path.join(srv.work, jid, "input.bin")))
    jid, tk, st, j = upload(srv, concat, "convert", {"target": "mp4"})
    st, j, _ = req(srv, "POST", f"/v1/jobs/{jid}/start", tk)
    check("a crafted ffconcat playlist is refused", st == 422, str((st, j)))
    jid, tk, st, j = upload(srv, short, "convert", {"target": "exe"})
    st, j, _ = req(srv, "POST", f"/v1/jobs/{jid}/start", tk)
    check("an unknown output format is refused (400)", st == 400)
    jid, tk, st, j = upload(srv, short, "convert", {"target": "mp4", "quality": "ultra"})
    st, j, _ = req(srv, "POST", f"/v1/jobs/{jid}/start", tk)
    check("an unknown quality is refused (400)", st == 400)

    print("chunked upload, resume, idempotence")
    jid, tk, st, j = upload(srv, SRC, "compress", {"level": "balanced"}, skip=(2,))
    st, j, _ = req(srv, "GET", f"/v1/jobs/{jid}", tk)
    check("status reports the received chunk count", j["status"] == "uploading" and j["receivedChunks"] == j["totalChunks"] - 1, str(j))
    st, j, _ = req(srv, "POST", f"/v1/jobs/{jid}/start", tk)
    check("start with a missing chunk -> 409 incomplete", st == 409 and j["error"] == "incomplete")
    st, j, _ = req(srv, "PUT", f"/v1/jobs/{jid}/chunks/2", tk, raw=b"short", headers={"X-Chunk-Sha256": hashlib.sha256(b"short").hexdigest()})
    check("a chunk of the wrong length is refused", st == 400)
    bad = bytearray(open(SRC, "rb").read()[2 * 4 * 1024 * 1024:3 * 4 * 1024 * 1024]); good_hash = hashlib.sha256(bytes(bad)).hexdigest(); bad[10] ^= 0xFF
    st, j, _ = req(srv, "PUT", f"/v1/jobs/{jid}/chunks/2", tk, raw=bytes(bad), headers={"X-Chunk-Sha256": good_hash})
    check("a chunk whose bytes do not match its SHA-256 (corrupted in transit) is refused", st == 400 and j["error"] == "bad_chunk")
    st, j, _ = req(srv, "PUT", f"/v1/jobs/{jid}/chunks/2", tk, raw=bytes(bad))
    check("a chunk sent without any SHA-256 is refused", st == 400)
    with open(SRC, "rb") as f:
        f.seek(2 * 4 * 1024 * 1024)
        c2 = f.read(4 * 1024 * 1024)
    h2 = {"X-Chunk-Sha256": hashlib.sha256(c2).hexdigest()}
    st, j, _ = req(srv, "PUT", f"/v1/jobs/{jid}/chunks/2", tk, raw=c2, headers=h2)
    st2, j2, _ = req(srv, "PUT", f"/v1/jobs/{jid}/chunks/2", tk, raw=c2, headers=h2)
    check("the missing chunk is accepted, resending it is idempotent", st == 200 and st2 == 200)

    print("compress: real 20.7 MB / 30 s file")
    st, j, _ = req(srv, "POST", f"/v1/jobs/{jid}/start", tk)
    check("start accepted (202)", st == 202)
    seen = []
    t0 = time.time()
    while True:
        st, j, _ = req(srv, "GET", f"/v1/jobs/{jid}", tk)
        seen.append((j["status"], j["progress"]))
        if j["status"] in ("done", "error") or time.time() - t0 > 200:
            break
        time.sleep(0.2)
    took = time.time() - t0
    check("job finished 'done'", j["status"] == "done", str(j))
    prog = [p for s, p in seen if s == "processing"]
    check("REAL progress is reported (several increasing values between 0 and 100)", len(set(prog)) >= 3 and prog == sorted(prog), str(prog[:10]))
    check("input bytes are deleted as soon as processing ends", not os.path.exists(os.path.join(srv.work, jid, "input.bin")))
    st, out, h = download(srv, jid, tk, "mp4")
    dur, e = info(out)
    check("result downloads with the right length header", st == 200 and int(h["Content-Length"]) == os.path.getsize(out) == j["outputBytes"])
    check("result is a real H.264/AAC MP4 of ~30 s", dur and 29 < dur < 32 and "h264" in e and "aac" in e, e[-200:])
    check("result is smaller than the source", os.path.getsize(out) < os.path.getsize(SRC), f"{os.path.getsize(out)} vs {os.path.getsize(SRC)}")
    check("output no longer exists after ONE complete download", not os.path.exists(os.path.join(srv.work, jid)))
    st, j, _ = req(srv, "GET", f"/v1/jobs/{jid}", tk)
    check("job is gone after download (404)", st == 404)
    print(f"      compress took {took:.1f}s for a 30.4 s video ({os.path.getsize(SRC)/1048576:.1f} MB -> {os.path.getsize(out)/1048576:.1f} MB)")

    print("convert: every target on a real clip")
    TARGETS = ["mp4", "m4v", "mov", "mkv", "flv", "ts", "3gp", "webm", "avi", "wmv", "ogv", "mpg", "gif", "mp3", "m4a", "wav", "ogg", "opus", "flac"]
    for tgt in TARGETS:
        jid, tk, st, j = upload(srv, short, "convert", {"target": tgt})
        st, j, _ = req(srv, "POST", f"/v1/jobs/{jid}/start", tk)
        j, secs = wait_done(srv, jid, tk)
        ok = j["status"] == "done" and j["outputExt"] == tgt and (j["outputBytes"] or 0) > 0
        detail = ""
        if ok:
            st, out, h = download(srv, jid, tk, tgt)
            dur, e = info(out)
            ok = st == 200 and dur is not None and 4.5 < dur < 7.5 if tgt != "gif" else st == 200 and open(out, "rb").read(6) in (b"GIF89a", b"GIF87a")
            detail = f"{os.path.getsize(out)/1024:.0f} KB {secs:.1f}s"
        check(f"{tgt:5s} -> valid, playable, right extension  ({detail or j.get('error')})", ok)

    print("cancel")
    jid, tk, st, j = upload(srv, SRC, "convert", {"target": "webm", "quality": "high"})
    st, j, _ = req(srv, "POST", f"/v1/jobs/{jid}/start", tk)
    time.sleep(1.5)
    st, j, _ = req(srv, "DELETE", f"/v1/jobs/{jid}", tk)
    time.sleep(3)
    check("DELETE mid-processing removes the job and its files", st == 200 and not os.path.exists(os.path.join(srv.work, jid)))
finally:
    srv.stop()

print("saturation: 1 worker, 1 waiting slot")
srv = Server(8612, MEDIA_MAX_CONCURRENT_JOBS=1, MEDIA_MAX_QUEUED_JOBS=1)
try:
    jobs = []
    for i in range(3):
        jid, tk, st, j = upload(srv, SRC, "convert", {"target": "webm", "quality": "high"})
        jobs.append((jid, tk))
    st1, j1, _ = req(srv, "POST", f"/v1/jobs/{jobs[0][0]}/start", jobs[0][1])
    time.sleep(1)
    st2, j2, _ = req(srv, "POST", f"/v1/jobs/{jobs[1][0]}/start", jobs[1][1])
    st3, j3, _ = req(srv, "POST", f"/v1/jobs/{jobs[2][0]}/start", jobs[2][1])
    check("first job starts processing, second waits, third is told 'busy' (503)", (st1, st2, st3) == (202, 202, 503), str((st1, st2, st3, j3)))
    stq, jq, _ = req(srv, "GET", f"/v1/jobs/{jobs[1][0]}", jobs[1][1])
    check("the waiting job reports its queue position", jq["status"] == "queued" and jq["queuePosition"] == 1, str(jq))
    check("the refused job keeps its upload (retryable, not lost)", os.path.exists(os.path.join(srv.work, jobs[2][0])))
    j, _ = wait_done(srv, jobs[0][0], jobs[0][1], 300)
    st3b, j3b, _ = req(srv, "POST", f"/v1/jobs/{jobs[2][0]}/start", jobs[2][1])
    check("once a place frees up, the refused job can be started again", j["status"] == "done" and st3b == 202, str((j, st3b, j3b)))
    for jid, tk in jobs:
        req(srv, "DELETE", f"/v1/jobs/{jid}", tk)
finally:
    srv.stop()

print("hard time limit")
srv = Server(8613, MEDIA_FFMPEG_TIMEOUT_SECONDS=1)
try:
    jid, tk, st, j = upload(srv, SRC, "convert", {"target": "webm", "quality": "high"})
    req(srv, "POST", f"/v1/jobs/{jid}/start", tk)
    j, _ = wait_done(srv, jid, tk, 60)
    check("a run past the time limit is stopped with a clear error", j["status"] == "error" and j["errorCode"] == "timeout", str(j))
    check("...and its files are gone", not os.path.exists(os.path.join(srv.work, jid, "input.bin")) and not os.path.exists(os.path.join(srv.work, jid, "output.bin")))
finally:
    srv.stop()

print("size / duration limits")
srv = Server(8614, MEDIA_MAX_FILE_BYTES=50000000, MEDIA_MAX_DURATION_SECONDS=3)
try:
    jid, tk = ticket(mx=10**9)
    st, j, _ = req(srv, "POST", "/v1/jobs", tk, {"op": "convert", "size": 60000000, "params": {"target": "mp4"}})
    check("file above the service limit -> 413", st == 413)
    jid, tk, st, j = upload(srv, short, "convert", {"target": "mp4"})
    st, j, _ = req(srv, "POST", f"/v1/jobs/{jid}/start", tk)
    check("media longer than the duration limit -> 422 too_long", st == 422 and j["error"] == "too_long", str((st, j)))
finally:
    srv.stop()

print("fail-fast configuration")
env = {k: v for k, v in os.environ.items() if not k.startswith("MEDIA_")}
p = subprocess.run([sys.executable, "-c", "import app.config"], cwd=ROOT, env=env, capture_output=True)
check("the service refuses to start without its variables (no silent default)", p.returncode != 0 and b"MEDIA_TICKET_SECRET" in p.stderr)

print(f"\n{passed} passed, {len(failures)} failed")
if failures:
    print("FAILED:", failures)
    sys.exit(1)
