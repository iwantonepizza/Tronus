"""Production settings."""

from __future__ import annotations

from . import base

globals().update(
    {
        setting_name: getattr(base, setting_name)
        for setting_name in dir(base)
        if setting_name.isupper()
    }
)

DEBUG = False
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = base.env.bool("DJANGO_SECURE_SSL_REDIRECT", default=True)
SESSION_COOKIE_SECURE = base.env.bool("SESSION_COOKIE_SECURE", default=True)
CSRF_COOKIE_SECURE = base.env.bool("CSRF_COOKIE_SECURE", default=True)
SECURE_HSTS_SECONDS = base.env.int("DJANGO_SECURE_HSTS_SECONDS", default=31536000)
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# ── Sentry ────────────────────────────────────────────────────────────────────
_SENTRY_DSN = base.env("SENTRY_DSN", default="")
if _SENTRY_DSN:
    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration

    sentry_sdk.init(
        dsn=_SENTRY_DSN,
        integrations=[DjangoIntegration(transaction_style="url")],
        traces_sample_rate=0.1,   # 10% of transactions for performance
        send_default_pii=False,
        environment="production",
    )

# ── Security headers ──────────────────────────────────────────────────────────
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True  # legacy IE header, no-op in modern browsers
X_FRAME_OPTIONS = "DENY"

# Strict CSP for SPA:
# - default-src 'self' — blocks inline scripts/styles from external sources
# - script-src 'self' — same origin JS only; Vite bundles are all same-origin
# - style-src 'self' 'unsafe-inline' — Tailwind inlines some styles
# - img-src 'self' data: blob: — avatars served locally; blob for canvas
# - font-src 'self' data: fonts.gstatic.com — Google Fonts (dev only; prod
#   fonts should be self-hosted, but we allow the CDN for now)
# - connect-src 'self' — API calls same origin only
# - frame-ancestors 'none' — equivalent to X-Frame-Options DENY
SECURE_CROSS_ORIGIN_OPENER_POLICY = "same-origin"
CSP_DEFAULT_SRC = ("'self'",)
CSP_SCRIPT_SRC = ("'self'",)
CSP_STYLE_SRC = ("'self'", "'unsafe-inline'")
CSP_IMG_SRC = ("'self'", "data:", "blob:")
CSP_FONT_SRC = ("'self'", "data:", "fonts.gstatic.com", "fonts.googleapis.com")
CSP_CONNECT_SRC = ("'self'",)
CSP_FRAME_ANCESTORS = ("'none'",)

# Referrer-Policy — do not leak path to external sites
REFERRER_POLICY = "strict-origin-when-cross-origin"

# ── DRF global throttle (rate limiting) ───────────────────────────────────────
REST_FRAMEWORK = {
    **base.REST_FRAMEWORK,
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        # Anonymous users: 60 requests/minute (covers public endpoints)
        "anon": "60/minute",
        # Authenticated users: 300 requests/minute (more room for UI interactions)
        "user": "300/minute",
    },
}

# ── Security headers middleware ────────────────────────────────────────────────
# Insert right after SecurityMiddleware (index 0)
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "apps.core.middleware.SecurityHeadersMiddleware",
    *base.MIDDLEWARE[1:],
]
