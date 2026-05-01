from __future__ import annotations

import json

from django import forms
from django.contrib import admin
from django.db import models

from .models import Faction, GameMode, HouseDeck


class GameModeAdminForm(forms.ModelForm):
    allowed_factions = forms.CharField(
        label="Allowed factions",
        required=False,
        widget=forms.Textarea(attrs={"rows": 3}),
        help_text="JSON-массив или список slug через запятую/с новой строки.",
    )
    required_factions = forms.CharField(
        label="Required factions",
        required=False,
        widget=forms.Textarea(attrs={"rows": 2}),
        help_text="JSON-массив или список slug через запятую/с новой строки.",
    )

    class Meta:
        model = GameMode
        fields = "__all__"
        widgets = {
            "factions_by_player_count": forms.Textarea(attrs={"rows": 8}),
        }

    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

        if self.instance.pk:
            self.initial["allowed_factions"] = self._format_slug_list(
                self.instance.allowed_factions
            )
            self.initial["required_factions"] = self._format_slug_list(
                self.instance.required_factions
            )

    def clean_allowed_factions(self) -> list[str]:
        return self._parse_slug_list(self.cleaned_data["allowed_factions"])

    def clean_required_factions(self) -> list[str]:
        return self._parse_slug_list(self.cleaned_data["required_factions"])

    @staticmethod
    def _format_slug_list(values: list[str]) -> str:
        return "\n".join(values)

    @staticmethod
    def _parse_slug_list(raw_value: str) -> list[str]:
        value = raw_value.strip()
        if not value:
            return []

        if value.startswith("[") or value.startswith("{"):
            try:
                parsed = json.loads(value)
            except json.JSONDecodeError as error:
                raise forms.ValidationError(
                    "Введите корректный JSON-массив slug'ов."
                ) from error

            if not isinstance(parsed, list) or not all(
                isinstance(item, str) for item in parsed
            ):
                raise forms.ValidationError(
                    "JSON должен быть массивом строковых slug'ов."
                )

            return [item.strip() for item in parsed if item.strip()]

        parts = [
            part.strip()
            for chunk in value.splitlines()
            for part in chunk.split(",")
        ]
        return [part for part in parts if part]


@admin.register(Faction)
class FactionAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "color", "on_primary", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name", "slug")
    ordering = ("name",)


@admin.register(GameMode)
class GameModeAdmin(admin.ModelAdmin):
    form = GameModeAdminForm
    list_display = (
        "name",
        "slug",
        "min_players",
        "max_players",
        "max_rounds",
        "westeros_deck_count",
    )
    search_fields = ("name", "slug")
    list_filter = ("min_players", "max_players")
    ordering = ("name",)
    formfield_overrides = {
        models.JSONField: {"widget": forms.Textarea(attrs={"rows": 6})},
    }


@admin.register(HouseDeck)
class HouseDeckAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    search_fields = ("name", "slug")
    ordering = ("name",)
