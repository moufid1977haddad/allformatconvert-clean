"""Tests of the "stage" job type (Office / document files) over REAL HTTP. No ffmpeg needed.

Usage (from services/media-processing):  .venv/Scripts/python tests/run_stage_tests.py
Throwaway signing key generated in memory, never written anywhere.
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

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SECRET = secrets.token_urlsafe(32).encode()
failures, passed = [], 0


def check(name, cond, detail=""):
    global passed
    if cond:
        passed += 1
        print("  PASS", name)
    else:
        failures.append(name)
        print("  FAIL", name, detail)


def ticket(jid=None, op="stage", role=None, mx=100 * 1024 * 1024, exp=None, secret=SECRET):
    jid = jid or secrets.token_hex(12)
    payload = {"jid": jid, "op": op, "max": mx, "exp": int(time.time()) + 600 if exp is None else exp}
    if role:
        payload["role"] = role
    body = base64.urlsafe_b64encode(json.dumps(payload, separators=(",", ":")).encode()).rstrip(b"=").decode()
    mac = base64.urlsafe_b64encode(hmac.new(secret, body.encode(), hashlib.sha256).digest()).rstrip(b"=").decode()
    return jid, f"v1.{body}.{mac}"


class Server:
    def __init__(self, port):
        self.port = port
        self.work = tempfile.mkdtemp(prefix="stage-test-")
        env = dict(os.environ, PORT=str(port), MEDIA_TICKET_SECRET=SECRET.decode(), ALLOWED_ORIGINS="https://www.example.test",
                   MEDIA_MAX_CONCURRENT_JOBS="1", MEDIA_MAX_QUEUED_JOBS="1", MEDIA_MAX_FILE_BYTES=str(64 * 1024 * 1024),
                   MEDIA_MAX_DURATION_SECONDS="60", MEDIA_JOB_TTL_SECONDS="600", MEDIA_FFMPEG_TIMEOUT_SECONDS="60",
                   MEDIA_WORK_DIR=self.work, MEDIA_FFMPEG_PATH="unused", MEDIA_CHUNK_BYTES=str(1024 * 1024))
        self.proc = subprocess.Popen([sys.executable, "-m", "app.main"], cwd=ROOT, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
        self.log = []
        threading.Thread(target=lambda: [self.log.append(l.decode("utf8", "replace")) for l in self.proc.stdout], daemon=True).start()
        for _ in range(60):
            try:
                if req(self, "GET", "/health")[0] == 200:
                    return
            except Exception:
                time.sleep(0.5)
        raise RuntimeError("no start: " + "".join(self.log[-10:]))

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
        with urllib.request.urlopen(r, timeout=60) as resp:
            c = resp.read()
            return resp.status, (c if raw_response else json.loads(c or b"{}")), resp.headers
    except urllib.error.HTTPError as e:
        c = e.read()
        try:
            return e.code, json.loads(c or b"{}"), e.headers
        except Exception:
            return e.code, {}, e.headers


def stage_upload(srv, data):
    jid, tk = ticket()
    st, j, _ = req(srv, "POST", "/v1/jobs", tk, {"op": "stage", "size": len(data), "params": {}})
    if st != 201:
        return jid, tk, st, j
    cb = j["chunkBytes"]
    for n in range(j["totalChunks"]):
        chunk = data[n * cb:(n + 1) * cb]
        s2, j2, _ = req(srv, "PUT", f"/v1/jobs/{jid}/chunks/{n}", tk, raw=chunk, headers={"X-Chunk-Sha256": hashlib.sha256(chunk).hexdigest()})
        assert s2 == 200, (n, s2, j2)
    return jid, tk, 201, j


def deposit(srv, jid, body, ext="pdf", sha=None):
    _, stk = ticket(jid, role="server")
    h = {"X-Output-Ext": ext, "X-Output-Sha256": sha if sha is not None else hashlib.sha256(body).hexdigest()}
    return req(srv, "PUT", f"/v1/jobs/{jid}/output", stk, raw=body, headers=h)


def run():
    srv = Server(8631)
    try:
        st, j, _ = req(srv, "GET", "/health")
        check("health advertises stage support", j.get("stage") is True, j)

        data = os.urandom(3 * 1024 * 1024 + 123)  # 4 chunks of 1 MiB
        jid, tk, st, j = stage_upload(srv, data)
        check("stage job created (201) and chunks accepted", st == 201 and j["totalChunks"] == 4, (st, j))
        st, j, _ = req(srv, "POST", f"/v1/jobs/{jid}/start", tk)
        check("start -> 202 staged, no ffmpeg probe", st == 202 and j["status"] == "staged", (st, j))
        st, j, _ = req(srv, "GET", f"/v1/jobs/{jid}", tk)
        check("status is staged", j["status"] == "staged", j)
        st, j, _ = req(srv, "POST", f"/v1/jobs/{jid}/start", tk)
        check("start is idempotent", st == 202, (st, j))

        # --- role separation
        st, j, _ = req(srv, "GET", f"/v1/jobs/{jid}/source", tk)
        check("browser ticket CANNOT read the source (401 wrong_role)", st == 401 and j.get("reason") == "wrong_role", (st, j))
        st, j, _ = req(srv, "GET", f"/v1/jobs/{jid}/source")
        check("no ticket -> source 401", st == 401, st)
        _, wrong = ticket(role="server")  # server ticket of ANOTHER job
        st, j, _ = req(srv, "GET", f"/v1/jobs/{jid}/source", wrong)
        check("server ticket of another job refused", st == 401 and j.get("reason") == "wrong_job", (st, j))
        _, badsig = ticket(jid, role="server", secret=b"not-the-secret")
        st, j, _ = req(srv, "GET", f"/v1/jobs/{jid}/source", badsig)
        check("wrongly signed server ticket refused", st == 401 and j.get("reason") == "bad_signature", (st, j))
        _, exp = ticket(jid, role="server", exp=int(time.time()) - 5)
        st, j, _ = req(srv, "GET", f"/v1/jobs/{jid}/source", exp)
        check("expired server ticket refused", st == 401 and j.get("reason") == "expired", (st, j))
        _, stk = ticket(jid, role="server")
        st, body, _ = req(srv, "GET", f"/v1/jobs/{jid}/source", stk, raw_response=True)
        check("server ticket reads the staged bytes exactly", st == 200 and body == data, st)
        pdf_probe = b"%PDF-1.4 x"
        st, j, _ = req(srv, "PUT", f"/v1/jobs/{jid}/output", tk, raw=pdf_probe, headers={"X-Output-Ext": "pdf", "X-Output-Sha256": hashlib.sha256(pdf_probe).hexdigest()})
        check("browser ticket CANNOT deposit an output", st == 401 and j.get("reason") == "wrong_role", (st, j))
        _, stk2 = ticket(role="server")
        st, j, _ = req(srv, "POST", "/v1/jobs", stk2, {"op": "stage", "size": 10, "params": {}})
        check("server ticket cannot CREATE a job", st == 401, (st, j))

        # --- deposit validation
        pdf = b"%PDF-1.7\n" + os.urandom(2 * 1024 * 1024)
        st, j, _ = deposit(srv, jid, pdf, sha="0" * 64)
        check("wrong SHA-256 refused (400 bad_output)", st == 400 and j["error"] == "bad_output", (st, j))
        junk = b"not a pdf at all"
        st, j, _ = deposit(srv, jid, junk, ext="pdf")
        check("bytes that are not a PDF refused", st == 400, (st, j))
        st, j, _ = deposit(srv, jid, pdf, ext="exe")
        check("unknown output type refused", st == 400, (st, j))
        st, j, _ = req(srv, "GET", f"/v1/jobs/{jid}/result", tk)
        check("no result while staged (409)", st == 409, (st, j))
        st, j, _ = deposit(srv, jid, pdf)
        check("valid deposit accepted", st == 200 and j["outputBytes"] == len(pdf), (st, j))
        check("source destroyed once the output is stored", not os.path.exists(os.path.join(srv.work, jid, "input.bin")))
        st, j, _ = req(srv, "GET", f"/v1/jobs/{jid}", tk)
        check("status done with real size and ext", j["status"] == "done" and j["outputBytes"] == len(pdf) and j["outputExt"] == "pdf", j)
        st, body, h = req(srv, "GET", f"/v1/jobs/{jid}/result", tk, raw_response=True)
        check("browser downloads exact output, application/pdf", st == 200 and body == pdf and h["Content-Type"] == "application/pdf", (st, h.get("Content-Type")))
        time.sleep(0.5)
        check("output + job directory deleted after one full download", not os.path.exists(os.path.join(srv.work, jid)))
        st, j, _ = req(srv, "GET", f"/v1/jobs/{jid}", tk)
        check("job unknown afterwards (404)", st == 404, st)

        # --- docx output magic
        jid2, tk2, st, _ = stage_upload(srv, b"x" * 2000)
        req(srv, "POST", f"/v1/jobs/{jid2}/start", tk2)
        docx = b"PK\x03\x04" + os.urandom(5000)
        st, j, _ = deposit(srv, jid2, docx, ext="docx")
        check("docx (PK) deposit accepted", st == 200, (st, j))
        st, _b, h = req(srv, "GET", f"/v1/jobs/{jid2}/result", tk2, raw_response=True)
        check("docx served with the docx MIME type", "wordprocessingml" in h["Content-Type"], h.get("Content-Type"))

        # --- png output magic (Image Upscaler)
        jid4, tk4, st, _ = stage_upload(srv, b"z" * 3000)
        req(srv, "POST", f"/v1/jobs/{jid4}/start", tk4)
        st, j, _ = deposit(srv, jid4, b"GIF89a" + os.urandom(3000), ext="png")
        check("png deposit with non-PNG bytes refused", st == 400, (st, j))
        png = b"\x89PNG\r\n\x1a\n" + os.urandom(5000)
        st, j, _ = deposit(srv, jid4, png, ext="png")
        check("png deposit accepted", st == 200, (st, j))
        st, b4, h = req(srv, "GET", f"/v1/jobs/{jid4}/result", tk4, raw_response=True)
        check("png served as image/png, exact bytes", st == 200 and b4 == png and h["Content-Type"] == "image/png", h.get("Content-Type"))

        # --- cancel destroys everything
        jid3, tk3, st, _ = stage_upload(srv, b"y" * 5000)
        req(srv, "POST", f"/v1/jobs/{jid3}/start", tk3)
        req(srv, "DELETE", f"/v1/jobs/{jid3}", tk3)
        check("DELETE destroys a staged file", not os.path.exists(os.path.join(srv.work, jid3)))

        # --- limits
        _, big = ticket(mx=10 * 1024 * 1024)
        st, j, _ = req(srv, "POST", "/v1/jobs", big, {"op": "stage", "size": 20 * 1024 * 1024, "params": {}})
        check("size above the ticket's max refused (413)", st == 413, (st, j))
        _, huge = ticket(mx=10**12)
        st, j, _ = req(srv, "POST", "/v1/jobs", huge, {"op": "stage", "size": 65 * 1024 * 1024, "params": {}})
        check("size above the service's max refused (413)", st == 413, (st, j))
        _, conv = ticket(op="convert")
        st, j, _ = req(srv, "POST", "/v1/jobs", conv, {"op": "stage", "size": 10, "params": {}})
        check("op must match the ticket (convert ticket cannot open a stage job)", st == 400, (st, j))
        st, j, _ = req(srv, "POST", "/v1/jobs", None, {"op": "stage", "size": 10, "params": {}})
        check("unsigned create refused (401)", st == 401, (st, j))

        # --- chunk integrity on stage too
        jid4, tk4 = ticket()
        req(srv, "POST", "/v1/jobs", tk4, {"op": "stage", "size": 100, "params": {}})
        st, j, _ = req(srv, "PUT", f"/v1/jobs/{jid4}/chunks/0", tk4, raw=b"z" * 100, headers={"X-Chunk-Sha256": "0" * 64})
        check("altered chunk refused", st == 400, (st, j))
        st, j, _ = req(srv, "POST", f"/v1/jobs/{jid4}/start", tk4)
        check("start with a missing chunk refused (409 incomplete)", st == 409, (st, j))
    finally:
        srv.stop()
    print(f"\n{passed} passed, {len(failures)} failed")
    if failures:
        print("FAILED:", failures)
        sys.exit(1)


run()
