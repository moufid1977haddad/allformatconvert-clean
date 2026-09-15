"""Security config, all from env vars -- mirrors services/pdf-tools/src/config.js.

BG_REMOVAL_API_KEY has no silent fallback (like PORT in main.py): a
missing key must fail loudly, not quietly disable auth. Reading it at
import time means the whole process refuses to start (and the Railway
healthcheck fails immediately, visibly) if it was never set, rather than
serving requests that always 401 for a reason nobody sees.
"""
import os

API_KEY = os.environ["BG_REMOVAL_API_KEY"]

_raw_quota = os.environ.get("BG_REMOVAL_MONTHLY_QUOTA")
MONTHLY_QUOTA_REQUESTS = int(_raw_quota) if _raw_quota else float("inf")

ALLOWED_ORIGINS = [o.strip() for o in os.environ.get("ALLOWED_ORIGINS", "").split(",") if o.strip()]
