from __future__ import annotations

from django.db.models import QuerySet

from .models import Deck, Faction, GameMode


def list_active_factions() -> QuerySet[Faction]:
    return Faction.objects.filter(is_active=True).order_by("name")


def list_game_modes() -> QuerySet[GameMode]:
    return GameMode.objects.order_by("name")


def list_decks() -> QuerySet[Deck]:
    return Deck.objects.order_by("name")
