from __future__ import annotations

from django.contrib.auth.models import AbstractUser
from django.db import models

from apps.core.models import TimestampedModel


class User(AbstractUser):
    email = models.EmailField(unique=True)


class Profile(TimestampedModel):
    user = models.OneToOneField(
        "accounts.User",
        on_delete=models.CASCADE,
        primary_key=True,
        related_name="profile",
    )
    nickname = models.CharField(max_length=64, unique=True)
    favorite_faction = models.ForeignKey(
        "reference.Faction",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="profiles",
    )
    bio = models.TextField(blank=True)
    current_avatar = models.ForeignKey(
        "avatars.AvatarAsset",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="current_for_profiles",
    )

    class Meta:
        ordering = ["nickname"]

    def __str__(self) -> str:
        return self.nickname
