"""Downloads the pinned static ffmpeg, verifies its SHA-256, installs the binary.

stdlib only. Usage: install_ffmpeg.py <url> <sha256> <destination>
Fails loudly (non-zero exit, build stops) on any mismatch -- like
services/background-removal/scripts/download_model.py.
"""
import hashlib
import os
import shutil
import sys
import tarfile
import tempfile
import urllib.request

url, expected, dest = sys.argv[1], sys.argv[2].lower(), sys.argv[3]
tmp = tempfile.mkdtemp()
archive = os.path.join(tmp, "ffmpeg.tar.xz")

h = hashlib.sha256()
with urllib.request.urlopen(url, timeout=300) as r, open(archive, "wb") as f:
    while True:
        block = r.read(1 << 20)
        if not block:
            break
        h.update(block)
        f.write(block)

if h.hexdigest() != expected:
    sys.exit(f"CHECKSUM MISMATCH for {url}: expected {expected}, got {h.hexdigest()}. Refusing to install.")

with tarfile.open(archive) as t:
    member = next(m for m in t.getmembers() if m.isfile() and os.path.basename(m.name) == "ffmpeg")
    src = t.extractfile(member)
    with open(dest, "wb") as out:
        shutil.copyfileobj(src, out)
os.chmod(dest, 0o755)
shutil.rmtree(tmp, ignore_errors=True)
print("installed", dest, "sha256 verified")
