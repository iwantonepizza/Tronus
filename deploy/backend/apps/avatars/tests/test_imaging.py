from __future__ import annotations

from io import BytesIO

from PIL import Image

from apps.avatars.imaging import FRAME_WIDTH, render_basic_avatar


def test_render_basic_avatar_returns_expected_sizes() -> None:
    source = Image.new("RGB", (900, 500), color=(120, 140, 180))
    buffer = BytesIO()
    source.save(buffer, format="JPEG")

    avatar_bytes, thumbnail_bytes = render_basic_avatar(
        photo_bytes=buffer.getvalue(),
        frame_color="#6B7B8C",
    )

    avatar = Image.open(BytesIO(avatar_bytes))
    thumbnail = Image.open(BytesIO(thumbnail_bytes))

    assert avatar.size == (512, 512)
    assert thumbnail.size == (128, 128)
    assert avatar.getpixel((FRAME_WIDTH // 2, FRAME_WIDTH // 2))[:3] == (107, 123, 140)
