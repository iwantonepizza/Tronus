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
