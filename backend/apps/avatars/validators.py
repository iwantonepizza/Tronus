from __future__ import annotations

from django.core.exceptions import ValidationError
from PIL import Image, UnidentifiedImageError

MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024
ALLOWED_IMAGE_FORMATS = {"JPEG", "PNG", "WEBP"}
FORMAT_TO_EXTENSION = {
    "JPEG": "jpg",
    "PNG": "png",
    "WEBP": "webp",
}


def validate_image_file(photo_file) -> str:
    if photo_file.size > MAX_IMAGE_SIZE_BYTES:
        raise ValidationError({"photo": ["Изображение должно быть не больше 10 МБ."]})

    try:
        current_position = photo_file.tell()
    except (AttributeError, OSError):
        current_position = 0

    try:
        image = Image.open(photo_file)
        image.load()
    except (UnidentifiedImageError, OSError) as exc:
        raise ValidationError(
            {"photo": ["Загрузите корректное изображение в формате JPEG, PNG или WEBP."]}
        ) from exc
    finally:
        try:
            photo_file.seek(current_position)
        except (AttributeError, OSError):
            pass

    image_format = (image.format or "").upper()
    if image_format not in ALLOWED_IMAGE_FORMATS:
        raise ValidationError(
            {"photo": ["Загрузите корректное изображение в формате JPEG, PNG или WEBP."]}
        )

    return image_format
