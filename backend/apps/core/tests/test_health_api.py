from __future__ import annotations

import pytest
from django.conf import settings
from django.db.utils import OperationalError


class BrokenCursor:
    def __enter__(self):
        raise OperationalError("db unavailable")

    def __exit__(self, exc_type, exc, tb):
        return False


@pytest.mark.django_db
def test_healthcheck_is_public_and_returns_ok(api_client) -> None:
    response = api_client.get("/api/v1/health/")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "database": "ok",
        "version": settings.APP_VERSION,
    }


@pytest.mark.django_db
def test_healthcheck_returns_503_when_database_is_unavailable(api_client, monkeypatch) -> None:
    from apps.core import views

    monkeypatch.setattr(views.connection, "cursor", lambda: BrokenCursor())

    response = api_client.get("/api/v1/health/")

    assert response.status_code == 503
    assert response.json() == {
        "status": "degraded",
        "database": "error",
        "version": settings.APP_VERSION,
    }
