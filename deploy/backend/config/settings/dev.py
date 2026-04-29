"""Development settings."""

from __future__ import annotations

from . import base

globals().update(
    {
        setting_name: getattr(base, setting_name)
        for setting_name in dir(base)
        if setting_name.isupper()
    }
)

DEBUG = True
ALLOWED_HOSTS = ["127.0.0.1", "localhost"]
CORS_ALLOWED_ORIGINS = base.env.list(
    "CORS_ALLOWED_ORIGINS",
    default=["http://localhost:5173", "http://127.0.0.1:5173"],
)
CSRF_TRUSTED_ORIGINS = base.env.list(
    "CSRF_TRUSTED_ORIGINS",
    default=CORS_ALLOWED_ORIGINS,
)
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
