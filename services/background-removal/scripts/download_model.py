#!/usr/bin/env python3
"""Build-time model download with mandatory checksum verification.

Run only during `docker build`. Fails the build (non-zero exit) on any
network error or checksum mismatch -- a broken or tampered model file must
never silently end up in the image.

Usage: download_model.py <url> <output_path> <expected_sha256_hex>
"""
import hashlib
import sys
import urllib.request


def main() -> int:
    if len(sys.argv) != 4:
        print("usage: download_model.py <url> <output_path> <expected_sha256_hex>", file=sys.stderr)
        return 2

    url, out_path, expected_sha256 = sys.argv[1], sys.argv[2], sys.argv[3].lower()

    print(f"Downloading model from {url}", flush=True)
    try:
        urllib.request.urlretrieve(url, out_path)
    except Exception as exc:
        print(f"FATAL: download failed: {exc}", file=sys.stderr)
        return 1

    digest = hashlib.sha256()
    with open(out_path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            digest.update(chunk)
    actual_sha256 = digest.hexdigest()

    if actual_sha256 != expected_sha256:
        print(
            f"FATAL: checksum mismatch for {out_path}\n"
            f"  expected: {expected_sha256}\n"
            f"  actual:   {actual_sha256}\n"
            "Refusing to use this file. The upstream artifact may have changed, "
            "moved, or been tampered with.",
            file=sys.stderr,
        )
        return 1

    print(f"OK: {out_path} sha256={actual_sha256}", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
