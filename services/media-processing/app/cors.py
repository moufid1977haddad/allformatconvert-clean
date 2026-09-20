"""Restrictive CORS -- same rule as services/background-removal/app/cors.py.

The browser talks to this service directly (that is the point: the file never
transits Vercel), so CORS is what stops another website's page from using a
visitor's browser against it. Only exact configured origins get headers.
"""
from flask import request

from . import config


def apply_cors(app):
    @app.before_request
    def _preflight():
        if request.method == "OPTIONS":
            return _with_cors(app.make_default_options_response())

    @app.after_request
    def _add(response):
        return _with_cors(response)


def _with_cors(response):
    origin = request.headers.get("Origin")
    if origin and origin in config.ALLOWED_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Vary"] = "Origin"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Chunk-Sha256"
        response.headers["Access-Control-Max-Age"] = "600"
    return response
