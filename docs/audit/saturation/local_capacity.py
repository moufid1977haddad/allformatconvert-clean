"""Local capacity of the media-processing service (27/09/2026), no project secret, no ticket limit.

The REAL service code (services/media-processing) runs here with a real ffmpeg; the ticket key is generated in memory
for the run (a throwaway test value, like tests/run_tests.py), so neither Vercel's 20 tickets/hour/IP limit nor any
production secret is involved. For each value of MEDIA_MAX_CONCURRENT_JOBS, N identical jobs are submitted at once;
measured: time until the last one is done (makespan), each job's wait + run time, throughput, and the CPU time the
ffmpeg processes used (from the OS, summed over the run).

Usage (from services/media-processing):
    .venv/Scripts/python ../../docs/audit/saturation/local_capacity.py <ffmpeg> <video 30 s 1080p> <audio> <slots,...> <N>
"""
import base64, hashlib, hmac, json, os, secrets, shutil, subprocess, sys, tempfile, threading, time
import urllib.error, urllib.request

FFMPEG, VIDEO, AUDIO, SLOTS, N = sys.argv[1], sys.argv[2], sys.argv[3], [int(x) for x in sys.argv[4].split(",")], int(sys.argv[5])
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "services", "media-processing"))
SECRET = secrets.token_urlsafe(32).encode()
ORIGIN = "https://www.example.test"


def ticket(op):
    jid = secrets.token_hex(12)
    payload = {"jid": jid, "op": op, "max": 400 * 1024 * 1024, "exp": int(time.time()) + 3600}
    body = base64.urlsafe_b64encode(json.dumps(payload, separators=(",", ":")).encode()).rstrip(b"=").decode()
    mac = base64.urlsafe_b64encode(hmac.new(SECRET, body.encode(), hashlib.sha256).digest()).rstrip(b"=").decode()
    return jid, f"v1.{body}.{mac}"


def req(port, method, path, tk=None, body=None, raw=None, headers=None):
    h = dict(headers or {})
    if tk:
        h["Authorization"] = "Bearer " + tk
    data = raw
    if body is not None:
        data = json.dumps(body).encode(); h["Content-Type"] = "application/json"
    r = urllib.request.Request(f"http://127.0.0.1:{port}{path}", data=data, method=method, headers=h)
    try:
        with urllib.request.urlopen(r, timeout=600) as resp:
            return resp.status, json.loads(resp.read() or b"{}")
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read() or b"{}")
        except Exception:
            return e.code, {}


def ffmpeg_cpu_seconds():
    """CPU seconds of every running ffmpeg.exe (Windows), via PowerShell."""
    out = subprocess.run(["powershell", "-NoProfile", "-Command",
                          "(Get-Process ffmpeg -ErrorAction SilentlyContinue | Measure-Object -Property CPU -Sum).Sum"],
                         capture_output=True, text=True).stdout.strip()
    try:
        return float(out.replace(",", "."))
    except ValueError:
        return 0.0


def run(slots, op, params, path, n):
    port = 8700 + slots
    work = tempfile.mkdtemp(prefix="media-cap-")
    env = dict(os.environ, PORT=str(port), MEDIA_TICKET_SECRET=SECRET.decode(), ALLOWED_ORIGINS=ORIGIN,
               MEDIA_MAX_CONCURRENT_JOBS=str(slots), MEDIA_MAX_QUEUED_JOBS="50", MEDIA_MAX_FILE_BYTES=str(400 * 1024 * 1024),
               MEDIA_MAX_DURATION_SECONDS="7200", MEDIA_JOB_TTL_SECONDS="1800", MEDIA_FFMPEG_TIMEOUT_SECONDS="1200",
               MEDIA_WORK_DIR=work, MEDIA_FFMPEG_PATH=FFMPEG, MEDIA_CHUNK_BYTES=str(4 * 1024 * 1024))
    proc = subprocess.Popen([sys.executable, "-m", "app.main"], cwd=ROOT, env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(60):
            try:
                if req(port, "GET", "/health")[0] == 200:
                    break
            except Exception:
                time.sleep(0.5)
        jobs = []
        for _ in range(n):  # upload all first, then start them together
            jid, tk = ticket(op)
            st, j = req(port, "POST", "/v1/jobs", tk, {"op": op, "size": os.path.getsize(path), "params": params})
            assert st == 201, (st, j)
            with open(path, "rb") as f:
                for k in range(j["totalChunks"]):
                    c = f.read(j["chunkBytes"])
                    assert req(port, "PUT", f"/v1/jobs/{jid}/chunks/{k}", tk, raw=c, headers={"X-Chunk-Sha256": hashlib.sha256(c).hexdigest()})[0] == 200
            jobs.append((jid, tk))
        cpu = {"sum": 0.0, "seen": {}}
        stop = threading.Event()

        def sample():  # ffmpeg processes come and go: keep the last CPU value seen for each PID
            while not stop.is_set():
                out = subprocess.run(["powershell", "-NoProfile", "-Command",
                                      "Get-Process ffmpeg -ErrorAction SilentlyContinue | ForEach-Object { \"$($_.Id) $($_.CPU) $($_.WorkingSet64)\" }"],
                                     capture_output=True, text=True).stdout
                for line in out.splitlines():
                    p = line.split()
                    if len(p) == 3:
                        pid, c, ws = p[0], float(p[1].replace(",", ".") or 0), int(p[2])
                        prev = cpu["seen"].get(pid, (0.0, 0))
                        cpu["seen"][pid] = (max(prev[0], c), max(prev[1], ws))
                time.sleep(0.5)
        threading.Thread(target=sample, daemon=True).start()
        t0 = time.time()
        for jid, tk in jobs:
            assert req(port, "POST", f"/v1/jobs/{jid}/start", tk)[0] in (200, 202)
        done = {}
        while len(done) < n and time.time() - t0 < 3600:
            for jid, tk in jobs:
                if jid in done:
                    continue
                st, j = req(port, "GET", f"/v1/jobs/{jid}", tk)
                if j.get("status") in ("done", "error"):
                    done[jid] = (time.time() - t0, j.get("status"))
            time.sleep(0.25)
        stop.set(); time.sleep(0.6)
        ends = sorted(v[0] for v in done.values())
        cpu_s = sum(v[0] for v in cpu["seen"].values())
        peak_ws = max((v[1] for v in cpu["seen"].values()), default=0)
        return {"slots": slots, "jobs": n, "errors": sum(1 for v in done.values() if v[1] != "done"),
                "makespan_s": round(ends[-1], 1), "first_done_s": round(ends[0], 1),
                "median_done_s": round(ends[len(ends) // 2], 1), "jobs_per_min": round(n / ends[-1] * 60, 2),
                "ffmpeg_cpu_s_total": round(cpu_s, 1), "cpu_s_per_job": round(cpu_s / n, 1),
                "ffmpeg_peak_mem_mb": round(peak_ws / 1048576)}
    finally:
        proc.kill(); proc.wait(); shutil.rmtree(work, ignore_errors=True)


print("logical CPUs here:", os.cpu_count())
for op, params, path, label in [("compress", {"level": "balanced"}, VIDEO, "video compress 30 s 1080p"),
                                ("convert", {"target": "opus", "kbps": 128}, AUDIO, "audio -> opus")]:
    for s in SLOTS:
        r = run(s, op, params, path, N)
        print(label, json.dumps(r), flush=True)
