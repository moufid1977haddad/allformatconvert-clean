"""Signed upload tickets: the service never accepts an unsigned request.

A ticket is minted by the Vercel route (after its own quota / rate-limit
checks) and authorises exactly ONE job id for a short time:

    v1.<base64url(json payload)>.<base64url(HMAC-SHA256(secret, payload part))>

payload = {"jid": str, "op": str, "max": int (bytes), "exp": int (unix seconds),
           "role": "browser" | "server"  (optional, absent = "browser")}

A "server" ticket is minted by the Vercel route for the same job after it has
verified the browser's ticket; only it may read a staged source file or deposit
the converted output (see main.py). The browser can never do either.

The browser only ever holds this opaque ticket, never a long-lived key.
Comparison is constant time (hmac.compare_digest), like every other secret
check in this project.
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import time

from . import config


def _b64d(part: str) -> bytes:
    return base64.urlsafe_b64decode(part + "=" * (-len(part) % 4))


def sign(payload: dict, secret: bytes) -> str:
    """Used by tests only; production tickets are minted by the Vercel route."""
    body = base64.urlsafe_b64encode(json.dumps(payload, separators=(",", ":")).encode()).rstrip(b"=").decode()
    mac = hmac.new(secret, body.encode(), hashlib.sha256).digest()
    return "v1." + body + "." + base64.urlsafe_b64encode(mac).rstrip(b"=").decode()


def verify(ticket: str | None):
    """Returns (payload, None) when valid, else (None, reason)."""
    if not ticket:
        return None, "missing"
    parts = ticket.split(".")
    if len(parts) != 3 or parts[0] != "v1":
        return None, "malformed"
    expected = hmac.new(config.TICKET_SECRET, parts[1].encode(), hashlib.sha256).digest()
    try:
        given = _b64d(parts[2])
    except Exception:
        return None, "malformed"
    if not hmac.compare_digest(expected, given):
        return None, "bad_signature"
    try:
        payload = json.loads(_b64d(parts[1]))
        jid, op, mx, exp = payload["jid"], payload["op"], int(payload["max"]), int(payload["exp"])
    except Exception:
        return None, "malformed"
    if not isinstance(jid, str) or not jid.isalnum() or not (16 <= len(jid) <= 64):
        return None, "malformed"
    if exp < time.time():
        return None, "expired"
    role = payload.get("role", "browser")
    if role not in ("browser", "server"):
        return None, "malformed"
    return {"jid": jid, "op": op, "max": mx, "exp": exp, "role": role}, None
