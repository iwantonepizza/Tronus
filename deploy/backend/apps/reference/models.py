from __future__ import annotations

from django.contrib.postgres.fields import ArrayField
from django.core.validators import RegexValidator
from django.db import models

from apps.core.models import TimestampedModel

HEX_COLOR_VALIDATOR = RegexValidator(
    regex=r"^#[0-9A-Fa-f]{6}$",
    message="Цвет должен быть HEX-значением вида #AABBCC.",
)


class Faction(TimestampedModel):
    slug = models.SlugField(unique=True)
    name = models.CharField(max_length=64)
    color = models.CharField(max_length=7, validators=[HEX_COLOR_VALIDATOR])
    on_primary = models.CharField(max_length=7, validators=[HEX_COLOR_VALIDATOR])
    sigil = models.ImageField(upload_to="reference/factions", blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class GameMode(TimestampedModel):
    slug = models.SlugField(unique=True)
    name = models.CharField(max_length=64)
    min_players = models.PositiveSmallIntegerField()
    max_players = models.PositiveSmallIntegerField()
    max_rounds = models.PositiveSmallIntegerField(default=10)
    description = models.TextField(blank=True)
    westeros_deck_count = models.PositiveSmallIntegerField(default=3)
    allowed_factions = ArrayField(
        base_field=models.SlugField(max_length=64),
        default=list,
        blank=True,
    )
    required_factions = ArrayField(
        base_field=models.SlugField(max_length=64),
        default=list,
        blank=True,
    )
    factions_by_player_count = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.CheckConstraint(
                check=models.Q(min_players__lte=models.F("max_players")),
                name="reference_gamemode_min_le_max",
            ),
        ]

    def __str__(self) -> str:
        return self.name


class HouseDeck(TimestampedModel):
    slug = models.SlugField(unique=True)
    name = models.CharField(max_length=64)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name
