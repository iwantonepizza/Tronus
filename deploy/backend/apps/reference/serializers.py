from __future__ import annotations

from rest_framework import serializers

from .models import Faction, GameMode, HouseDeck


class FactionSerializer(serializers.ModelSerializer):
    sigil = serializers.SerializerMethodField()

    class Meta:
        model = Faction
        fields = ("slug", "name", "color", "on_primary", "sigil")

    def get_sigil(self, obj: Faction) -> str | None:
        if not obj.sigil:
            return None

        request = self.context.get("request")
        if request is None:
            return obj.sigil.url
        return request.build_absolute_uri(obj.sigil.url)


class GameModeSerializer(serializers.ModelSerializer):
    class Meta:
        model = GameMode
        fields = (
            "slug",
            "name",
            "min_players",
            "max_players",
            "max_rounds",
            "description",
            "westeros_deck_count",
            "allowed_factions",
            "required_factions",
            "factions_by_player_count",
        )


class HouseDeckSerializer(serializers.ModelSerializer):
    class Meta:
        model = HouseDeck
        fields = ("slug", "name", "description")
