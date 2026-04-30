from __future__ import annotations

from pathlib import Path

import pytest
from django.test import override_settings
from django.urls import clear_url_caches


@pytest.fixture(autouse=True)
def reset_url_caches() -> None:
    clear_url_caches()
    yield
    clear_url_caches()


@pytest.mark.django_db
def test_media_root_points_to_backend_media(settings) -> None:
    assert settings.MEDIA_ROOT == Path(settings.BASE_DIR) / "media"


@pytest.mark.django_db
@override_settings(ROOT_URLCONF="tests.urls_media", DEBUG=True, MEDIA_URL="/media/")
def test_debug_serves_media_files(api_client, settings, tmp_path) -> None:
    settings.MEDIA_ROOT = tmp_path
    sample_file = tmp_path / "smoke.txt"
    sample_file.write_text("winter-is-coming", encoding="utf-8")

    response = api_client.get("/media/smoke.txt")

    assert response.status_code == 200
    assert b"".join(response.streaming_content) == b"winter-is-coming"
