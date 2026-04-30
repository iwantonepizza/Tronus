from __future__ import annotations

from django.test import override_settings


def test_basic_arithmetic() -> None:
    assert 1 + 1 == 2


@override_settings(ROOT_URLCONF="config.urls")
def test_admin_reachable(api_client) -> None:
    response = api_client.get("/admin/")

    assert response.status_code == 302
    assert response.headers["Location"].startswith("/admin/login/")
