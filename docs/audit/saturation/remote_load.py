"""Load test of a THROW-AWAY COPY of the media-processing service on Railway (point 7a, 28/09/2026).

The copy runs the same code and the same settings as production (2 ffmpeg slots, 10 queue places, 8 vCPU), in a
separate Railway environment ("charge"), with its OWN ticket key: a throw-away key the owner generated straight
into the clipboard. This script receives it through its environment (LOAD_TICKET_SECRET), never prints it, never
writes it anywhere. No production secret, no Vercel ticket limit, no production traffic involved.

Visitors arrive together in waves of 1, 2, 4, 8 and 12. Each visitor does ONE realistic job, mixed like the
site's use: ~70 % light audio (to Opus), ~20 % a 30 s 1080p video compression, ~10 % a precise cut (10 s of 1080p,
point 8); the 12-visitor wave also carries one heavy job (a 3-min 1080p video to WebM, the worst measured case).
Measured per job: upload time, time spent waiting (queue / "service busy" retries), processing time, total time
seen by the visitor; per wave: when the last visitor got the result, and refusals.

Usage (from services/media-processing):
    LOAD_TICKET_SECRET=<clipboard> .venv/Scripts/python ../../docs/audit/saturation/remote_load.py <service url> <ffmpeg> <out.json> [waves=1,2,4,8,12]
"""
import base64, hashlib, hmac, json, os, secrets, subprocess, sys, tempfile, threading, time
import urllib.error, urllib.request

BASE, FFMPEG, OUT = sys.argv[1].rstrip("/"), sys.argv[2], sys.argv[3]
WAVES = [int(x) for x in (sys.argv[4] if len(sys.argv) > 4 else "1,2,4,8,12").split(",")]
SECRET = os.environ.get("LOAD_TICKET_SECRET", "").strip().encode()
if len(SECRET) < 32:
    sys.exit("LOAD_TICKET_SECRET missing or too short (it is read from the environment only, never displayed)")
os.environ.pop("LOAD_TICKET_SECRET", None)


def ticket(op):
    jid = secrets.token_hex(12)
    payload = {"jid": jid, "op": op, "max": 1024 * 1024 * 1024, "exp": int(time.time()) + 3600}
    body = base64.urlsafe_b64encode(json.dumps(payload, separators=(",", ":")).encode()).rstrip(b"=").decode()
    mac = base64.urlsafe_b64encode(hmac.new(SECRET, body.encode(), hashlib.sha256).digest()).rstrip(b"=").decode()
    return jid, f"v1.{body}.{mac}"


def req(method, path, tk=None, body=None, raw=None, headers=None, timeout=900):
    h = dict(headers or {})
    if tk:
        h["Authorization"] = "Bearer " + tk
    data = raw
    if body is not None:
        data = json.dumps(body).encode(); h["Content-Type"] = "application/json"
    r = urllib.request.Request(BASE + path, data=data, method=method, headers=h)
    try:
        with urllib.request.urlopen(r, timeout=timeout) as resp:
            content = resp.read()
            ctype = resp.headers.get("Content-Type", "")
            return resp.status, (json.loads(content or b"{}") if "json" in ctype else content)
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read() or b"{}")
        except Exception:
            return e.code, {}


# ---- fixtures, made here by ffmpeg (noisy content, like a camera)
tmp = tempfile.mkdtemp(prefix="load-")
def make(name, args):
    p = os.path.join(tmp, name)
    subprocess.run([FFMPEG, "-y", "-v", "error", *args, p], check=True)
    return p
AUDIO = make("a.flac", ["-f", "lavfi", "-i", "sine=f=440:d=60", "-ac", "2"])
V30 = make("v30.mp4", ["-f", "lavfi", "-i", "testsrc2=size=1920x1080:rate=30:duration=30,noise=alls=20:allf=t+u", "-f", "lavfi", "-i", "sine=d=30", "-c:v", "libx264", "-preset", "faster", "-b:v", "8M", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest"])
V180 = make("v180.mp4", ["-f", "lavfi", "-i", "testsrc2=size=1920x1080:rate=30:duration=180,noise=alls=20:allf=t+u", "-f", "lavfi", "-i", "sine=d=180", "-c:v", "libx264", "-preset", "veryfast", "-b:v", "6M", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest"])
KINDS = {
    "audio_opus": ("convert", {"target": "opus", "kbps": 128}, AUDIO),
    "video_compress_30s": ("compress", {"level": "balanced"}, V30),
    "precise_cut_10s": ("convert", {"target": "mp4", "quality": "high", "clipStart": 5.3, "clipDuration": 10}, V30),
    "heavy_webm_3min": ("convert", {"target": "webm", "quality": "medium"}, V180),
}


def mix(n):
    """The wave's jobs: ~70 % audio, ~20 % compress, ~10 % precise cut (at least one video job from 2 visitors on)."""
    video = max(1 if n >= 2 else 0, round(n * 0.2))
    cut = max(1 if n >= 4 else 0, round(n * 0.1))
    kinds = ["video_compress_30s"] * video + ["precise_cut_10s"] * cut
    kinds += ["audio_opus"] * (n - len(kinds))
    if n >= 12:
        kinds[-1] = "heavy_webm_3min"
    return kinds[:n] if n > 1 else ["video_compress_30s"]


def visitor(kind, results, t_wave):
    op, params, path = KINDS[kind]
    r = {"kind": kind}
    t0 = time.time()
    try:
        jid, tk = ticket(op)
        st, j = req("POST", "/v1/jobs", tk, {"op": op, "size": os.path.getsize(path), "params": params})
        if st != 201:
            r.update(error=f"create {st} {j}"); return
        with open(path, "rb") as f:
            for k in range(j["totalChunks"]):
                c = f.read(j["chunkBytes"])
                st, _ = req("PUT", f"/v1/jobs/{jid}/chunks/{k}", tk, raw=c, headers={"X-Chunk-Sha256": hashlib.sha256(c).hexdigest()})
                if st != 200:
                    r.update(error=f"chunk {st}"); return
        t_up = time.time(); r["upload_s"] = round(t_up - t0, 1)
        busy = 0
        while True:
            st, j = req("POST", f"/v1/jobs/{jid}/start", tk)
            if st in (200, 202):
                break
            if st == 503:
                busy += 1; time.sleep(3); continue
            r.update(error=f"start {st} {j}"); return
        r["busy_retries"] = busy
        t_proc = None; max_pos = 0
        while True:
            st, j = req("GET", f"/v1/jobs/{jid}", tk)
            s = j.get("status") if isinstance(j, dict) else None
            if s == "queued":
                max_pos = max(max_pos, j.get("queuePosition") or 0)
            if s == "processing" and t_proc is None:
                t_proc = time.time()
            if s in ("done", "error"):
                break
            time.sleep(0.5)
        t_done = time.time()
        r["max_queue_position"] = max_pos
        r["wait_s"] = round((t_proc or t_done) - t_up, 1)
        r["processing_s"] = round(t_done - (t_proc or t_done), 1)
        if s == "error":
            r.update(error=f"job error {j.get('error')}"); return
        st, data = req("GET", f"/v1/jobs/{jid}/result", tk)
        r["result_bytes"] = len(data) if isinstance(data, (bytes, bytearray)) else 0
        req("DELETE", f"/v1/jobs/{jid}", tk)
        r["total_s"] = round(time.time() - t0, 1)
        r["done_at_s"] = round(time.time() - t_wave, 1)
    except Exception as e:  # network, timeout
        r.update(error=f"{type(e).__name__}: {str(e)[:120]}")
    finally:
        results.append(r)


report = {"service": BASE, "waves": []}
t = time.time(); st, _ = req("GET", "/health"); report["health_first_s"] = round(time.time() - t, 2); report["health_status"] = st
for n in WAVES:
    results, threads, t_wave = [], [], time.time()
    for kind in mix(n):
        th = threading.Thread(target=visitor, args=(kind, results, t_wave)); th.start(); threads.append(th)
    for th in threads:
        th.join()
    ok = [r for r in results if "error" not in r]
    wave = {"visitors": n, "errors": [r["error"] for r in results if "error" in r], "last_done_s": max((r.get("done_at_s", 0) for r in ok), default=None), "jobs": sorted(results, key=lambda r: r.get("done_at_s", 1e9))}
    report["waves"].append(wave)
    print(json.dumps({"visitors": n, "errors": len(wave["errors"]), "last_done_s": wave["last_done_s"],
                      "by_kind": {k: [r.get("total_s") for r in ok if r["kind"] == k] for k in KINDS}}), flush=True)
    time.sleep(5)
with open(OUT, "w") as f:
    json.dump(report, f, indent=1)
print("written", OUT)
