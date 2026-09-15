"""Restrictive CORS -- mirrors services/pdf-tools/src/cors.js exactly.

Only echoes the Origin header back (which is what actually lets a
browser read the response) when it exactly matches one of the configured
origins. Any other origin gets no CORS headers at all, so the browser
blocks the response. Requests with no Origin header (server-to-server,
curl, this project's own Vercel proxy) are never subject to CORS in the
first place -- this only affects a browser calling the service directly.
"""
from flask import request

from . import config


def apply_cors(app):
    @app.before_request
    def _handle_preflight():
        if request.method == "OPTIONS":
            return _with_cors_headers(app.make_default_options_response())

    @app.after_request
    def _add_cors_headers(response):
        return _with_cors_headers(response)


def _with_cors_headers(response):
    origin = request.headers.get("Origin")
    if origin and origin in config.ALLOWED_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Vary"] = "Origin"
        response.headers["Access-Control-Allow-Methods"] = "POST, GET, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, X-API-Key"
    return response
