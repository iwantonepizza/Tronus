from __future__ import annotations

from io import BytesIO

from PIL import Image, ImageDraw, ImageOps

AVATAR_SIZE = (512, 512)
THUMBNAIL_SIZE = (128, 128)
FRAME_WIDTH = 24


def render_basic_avatar(*, photo_bytes: bytes, frame_color: str) -> tuple[bytes, bytes]:
    image = Image.open(BytesIO(photo_bytes)).convert("RGBA")
    avatar = ImageOps.fit(
        image,
        AVATAR_SIZE,
        method=Image.Resampling.LANCZOS,
        centering=(0.5, 0.5),
    )

    draw = ImageDraw.Draw(avatar)
    for offset in range(FRAME_WIDTH):
        draw.rectangle(
            (
                offset,
                offset,
                AVATAR_SIZE[0] - 1 - offset,
                AVATAR_SIZE[1] - 1 - offset,
            ),
            outline=frame_color,
        )

    avatar_bytes = BytesIO()
    avatar.save(avatar_bytes, format="PNG")

    thumbnail = avatar.resize(THUMBNAIL_SIZE, Image.Resampling.LANCZOS)
    thumbnail_bytes = BytesIO()
    thumbnail.save(thumbnail_bytes, format="PNG")

    return avatar_bytes.getvalue(), thumbnail_bytes.getvalue()
