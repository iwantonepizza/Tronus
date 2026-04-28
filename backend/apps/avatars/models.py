from __future__ import annotations

from pathlib import Path

from django.db import models

from apps.core.models import TimestampedModel


def avatar_source_upload_to(instance: AvatarAsset, filename: str) -> str:
    return f"avatars/{instance.user_id}/sources/{Path(filename).name}"


def avatar_generated_upload_to(instance: AvatarAsset, filename: str) -> str:
    return f"avatars/{instance.user_id}/{Path(filename).name}"


class AvatarAsset(TimestampedModel):
    class Style(models.TextChoices):
        BASIC_FRAME = "basic_frame", "Basic frame"
        REALISTIC = "realistic", "Realistic"
        DARK = "dark", "Dark"
        HERALDIC = "heraldic", "Heraldic"

    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="avatars",
    )
    faction = models.ForeignKey(
        "reference.Faction",
        on_delete=models.PROTECT,
        related_name="avatars",
    )
    style = models.CharField(
        max_length=32,
        choices=Style.choices,
        default=Style.BASIC_FRAME,
    )
    source_photo = models.ImageField(
        upload_to=avatar_source_upload_to,
        null=True,
        blank=True,
    )
    generated_image = models.ImageField(upload_to=avatar_generated_upload_to)
    is_current = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at", "-id"]
        constraints = [
            models.UniqueConstraint(
                fields=["user"],
                condition=models.Q(is_current=True),
                name="avatars_single_current_per_user",
            )
        ]

    def __str__(self) -> str:
        return f"{self.user_id}:{self.faction.slug}:{self.style}"
