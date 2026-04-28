from __future__ import annotations

from django.contrib import admin

from .models import Deck, Faction, GameMode


@admin.register(Faction)
class FactionAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "color", "on_primary", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name", "slug")
    ordering = ("name",)


@admin.register(GameMode)
class GameModeAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "min_players", "max_players")
    search_fields = ("name", "slug")
    list_filter = ("min_players", "max_players")
    ordering = ("name",)


@admin.register(Deck)
class DeckAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    search_fields = ("name", "slug")
    ordering = ("name",)
