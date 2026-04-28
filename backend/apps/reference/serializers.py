from __future__ import annotations

from rest_framework import serializers

from .models import Deck, Faction, GameMode


class FactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Faction
        fields = ("slug", "name", "color", "on_primary", "sigil")


class GameModeSerializer(serializers.ModelSerializer):
    class Meta:
        model = GameMode
        fields = ("slug", "name", "min_players", "max_players", "description")


class DeckSerializer(serializers.ModelSerializer):
    class Meta:
        model = Deck
        fields = ("slug", "name", "description")
