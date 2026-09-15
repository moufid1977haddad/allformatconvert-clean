"""API key + monthly quota -- mirrors services/pdf-tools/src/auth.js.

In-memory usage counter, keyed by API key. Resets on every deploy or
container restart -- acceptable for now since there is exactly one real
caller (this project's own Vercel proxy), same tradeoff pdf-tools made
for the same reason. This is defense-in-depth for the Railway bill, not
the primary abuse control: the site's own three-layer quota system in
lib/quota/ is what actually limits visitor usage, and is unaffected by
this (see docs/audit/RAPPORT-detourage-phase2.md).
"""
from __future__ import annotations

import hmac
import time
from functools import wraps

from flask import jsonify, request

from . import config

_usage: dict[str, dict] = {}


def _current_month_key() -> str:
    return time.strftime("%Y-%m", time.gmtime())


def _get_usage(api_key: str) -> dict:
    month = _current_month_key()
    entry = _usage.get(api_key)
    if not entry or entry["month"] != month:
        entry = {"month": month, "requests": 0}
        _usage[api_key] = entry
    return entry


def require_api_key(handler):
    """Decorator: validates X-API-Key and enforces its monthly quota."""

    @wraps(handler)
    def wrapped(*args, **kwargs):
        key = request.headers.get("X-API-Key")
        if not key:
            return jsonify(error="unauthorized", message="Missing X-API-Key header."), 401
        if not hmac.compare_digest(key, config.API_KEY):
            return jsonify(error="unauthorized", message="Invalid API key."), 401

        usage = _get_usage(key)
        if usage["requests"] >= config.MONTHLY_QUOTA_REQUESTS:
            return (
                jsonify(error="quota_exceeded", message="Monthly request quota exceeded for this API key."),
                429,
            )
        usage["requests"] += 1
        return handler(*args, **kwargs)

    return wrapped
