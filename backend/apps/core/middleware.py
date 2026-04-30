"""Security headers middleware (Wave 8 — I-009).

Adds headers not covered by Django's SecurityMiddleware:
  - Content-Security-Policy
  - Referrer-Policy
  - Permissions-Policy
  - X-Content-Type-Options (also in SecurityMiddleware but doubled for certainty)

Activated only in production settings (see config/settings/prod.py).
"""

from __future__ import annotations

from django.conf import settings
from django.http import HttpRequest, HttpResponse


class SecurityHeadersMiddleware:
    """Inject security headers on every response."""

    def __init__(self, get_response):
        self.get_response = get_response

        # Build CSP string once at startup
        csp_directives = {
            "default-src": getattr(settings, "CSP_DEFAULT_SRC", ("'self'",)),
            "script-src": getattr(settings, "CSP_SCRIPT_SRC", ("'self'",)),
            "style-src": getattr(settings, "CSP_STYLE_SRC", ("'self'", "'unsafe-inline'")),
            "img-src": getattr(settings, "CSP_IMG_SRC", ("'self'", "data:", "blob:")),
            "font-src": getattr(settings, "CSP_FONT_SRC", ("'self'", "data:")),
            "connect-src": getattr(settings, "CSP_CONNECT_SRC", ("'self'",)),
            "frame-ancestors": getattr(settings, "CSP_FRAME_ANCESTORS", ("'none'",)),
        }
        self._csp = "; ".join(
            f"{directive} {' '.join(sources)}"
            for directive, sources in csp_directives.items()
        )
        self._referrer_policy = getattr(
            settings, "REFERRER_POLICY", "strict-origin-when-cross-origin"
        )

    def __call__(self, request: HttpRequest) -> HttpResponse:
        response = self.get_response(request)
        response["Content-Security-Policy"] = self._csp
        response["Referrer-Policy"] = self._referrer_policy
        response["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=(), payment=()"
        )
        response["X-Content-Type-Options"] = "nosniff"
        return response
