from __future__ import annotations

from io import BytesIO

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image

from apps.accounts.models import User
from apps.reference.models import Faction


@pytest.fixture
def avatar_media_root(settings, tmp_path):
    media_root = tmp_path / "media"
    media_root.mkdir(parents=True, exist_ok=True)
    settings.MEDIA_ROOT = media_root
    settings.MEDIA_URL = "/media/"
    return media_root


@pytest.fixture
def make_user():
    def factory(*, email: str, is_staff: bool = False) -> User:
        return User.objects.create_user(
            username=email,
            email=email,
            password="StrongPassword123!",
            is_active=True,
            is_staff=is_staff,
        )

    return factory


@pytest.fixture
def ensure_faction():
    def factory(
        *,
        slug: str = "stark",
        name: str = "Stark",
        color: str = "#6B7B8C",
        on_primary: str = "#F0F0F0",
    ) -> Faction:
        faction, _ = Faction.objects.get_or_create(
            slug=slug,
            defaults={
                "name": name,
                "color": color,
                "on_primary": on_primary,
                "is_active": True,
            },
        )
        return faction

    return factory


@pytest.fixture
def make_photo_file():
    def factory(
        *,
        name: str = "avatar.jpg",
        image_format: str = "JPEG",
        size: tuple[int, int] = (800, 600),
        color: tuple[int, int, int] = (120, 140, 180),
    ) -> SimpleUploadedFile:
        image = Image.new("RGB", size, color=color)
        buffer = BytesIO()
        image.save(buffer, format=image_format)
        return SimpleUploadedFile(
            name=name,
            content=buffer.getvalue(),
            content_type=f"image/{image_format.lower()}",
        )

    return factory
