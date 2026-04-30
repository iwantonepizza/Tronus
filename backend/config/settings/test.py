"""Test settings — SQLite, no Postgres-specific fields.

Used by pytest when DJANGO_SETTINGS_MODULE=config.settings.test.
"""

from __future__ import annotations

from .dev import *  # noqa: F401, F403

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

# Silence migration warnings
MIGRATION_MODULES: dict[str, None] = {}

# Speed up password hashing in tests
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]
