from __future__ import annotations

from rest_framework import serializers

from apps.accounts.serializers import PublicUserSerializer
from apps.games.models import GameSession, Outcome, Participation
from apps.reference.serializers import FactionSerializer, GameModeSerializer, HouseDeckSerializer

LEADERBOARD_METRIC_CHOICES = (
    "wins",
    "winrate",
    "games",
    "crowns",
    "shits",
    "avg_place",
)


class PlayerStatsFactionSerializer(serializers.Serializer):
    faction = serializers.CharField()
    winrate = serializers.FloatField()


class PlayerStatsCurrentStreakSerializer(serializers.Serializer):
    type = serializers.ChoiceField(choices=["win", "loss"], allow_null=True)
    count = serializers.IntegerField(min_value=0)


class PlayerStatsLastMatchSerializer(serializers.Serializer):
    match_id = serializers.IntegerField()
    place = serializers.IntegerField(allow_null=True)
    faction = serializers.CharField()


class PlayerStatsSerializer(serializers.Serializer):
    user = PublicUserSerializer()
    total_games = serializers.IntegerField(min_value=0)
    wins = serializers.IntegerField(min_value=0)
    winrate = serializers.FloatField(allow_null=True)
    avg_place = serializers.FloatField(allow_null=True)
    avg_castles = serializers.FloatField(allow_null=True)
    favorite_faction = serializers.CharField(allow_null=True)
    best_faction = PlayerStatsFactionSerializer(allow_null=True)
    worst_faction = PlayerStatsFactionSerializer(allow_null=True)
    current_streak = PlayerStatsCurrentStreakSerializer()
    last10 = PlayerStatsLastMatchSerializer(many=True)
    crowns_received = serializers.IntegerField(min_value=0)
    shits_received = serializers.IntegerField(min_value=0)


class FactionStatsByModeSerializer(serializers.Serializer):
    mode = serializers.CharField()
    winrate = serializers.FloatField(allow_null=True)
    games = serializers.IntegerField(min_value=0)


class FactionStatsTopPlayerSerializer(serializers.Serializer):
    user = PublicUserSerializer()
    winrate = serializers.FloatField(allow_null=True)
    games = serializers.IntegerField(min_value=0)


class FactionStatsSerializer(serializers.Serializer):
    faction = FactionSerializer()
    total_games = serializers.IntegerField(min_value=0)
    wins = serializers.IntegerField(min_value=0)
    winrate = serializers.FloatField(allow_null=True)
    avg_place = serializers.FloatField(allow_null=True)
    avg_castles = serializers.FloatField(allow_null=True)
    by_mode = FactionStatsByModeSerializer(many=True)
    top_players = FactionStatsTopPlayerSerializer(many=True)


class OverviewOutcomeSerializer(serializers.ModelSerializer):
    mvp = PublicUserSerializer(read_only=True)

    class Meta:
        model = Outcome
        fields = ("rounds_played", "end_reason", "mvp", "final_note")


class OverviewParticipationSerializer(serializers.ModelSerializer):
    user = PublicUserSerializer(read_only=True)
    faction = serializers.SlugRelatedField(read_only=True, slug_field="slug")

    class Meta:
        model = Participation
        fields = ("id", "user", "faction", "place", "castles", "is_winner", "notes")


class OverviewSessionSerializer(serializers.ModelSerializer):
    mode = GameModeSerializer(read_only=True)
    deck = HouseDeckSerializer(source="house_deck", read_only=True)
    created_by = PublicUserSerializer(read_only=True)
    participations = OverviewParticipationSerializer(many=True, read_only=True)
    outcome = OverviewOutcomeSerializer(read_only=True, allow_null=True)
    comments_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = GameSession
        fields = (
            "id",
            "scheduled_at",
            "status",
            "mode",
            "deck",
            "created_by",
            "planning_note",
            "participations",
            "outcome",
            "comments_count",
        )


class OverviewMostPopularFactionSerializer(serializers.Serializer):
    faction = FactionSerializer()
    games = serializers.IntegerField(min_value=0)


class OverviewCurrentLeaderSerializer(serializers.Serializer):
    user = PublicUserSerializer()
    wins = serializers.IntegerField(min_value=0)


class OverviewFactionWinrateSerializer(serializers.Serializer):
    faction = FactionSerializer()
    winrate = serializers.FloatField(allow_null=True)


class OverviewTopWinrateSerializer(serializers.Serializer):
    user = PublicUserSerializer()
    winrate = serializers.FloatField(allow_null=True)


class OverviewFunFactSerializer(serializers.Serializer):
    icon = serializers.CharField()
    title = serializers.CharField()
    description = serializers.CharField()


class LeaderboardQuerySerializer(serializers.Serializer):
    metric = serializers.ChoiceField(
        choices=tuple((value, value) for value in LEADERBOARD_METRIC_CHOICES),
        required=False,
        default="wins",
    )
    limit = serializers.IntegerField(required=False, min_value=1, max_value=100, default=20)


class LeaderboardEntrySerializer(serializers.Serializer):
    rank = serializers.IntegerField(min_value=1)
    user = PublicUserSerializer()
    games = serializers.IntegerField(min_value=0)
    metric_value = serializers.JSONField()


class LeaderboardStatsSerializer(serializers.Serializer):
    metric = serializers.ChoiceField(
        choices=tuple((value, value) for value in LEADERBOARD_METRIC_CHOICES)
    )
    label = serializers.CharField()
    results = LeaderboardEntrySerializer(many=True)


class HeadToHeadQuerySerializer(serializers.Serializer):
    user_a = serializers.IntegerField(min_value=1)
    user_b = serializers.IntegerField(min_value=1)

    def validate(self, attrs):
        if attrs["user_a"] == attrs["user_b"]:
            raise serializers.ValidationError(
                {"user_b": ["Параметр `user_b` должен отличаться от `user_a`."]}
            )
        return attrs


class HeadToHeadSideSerializer(serializers.Serializer):
    faction = serializers.CharField()
    place = serializers.IntegerField(allow_null=True)
    castles = serializers.IntegerField(allow_null=True)
    is_winner = serializers.BooleanField()


class HeadToHeadMatchSerializer(serializers.Serializer):
    id = serializers.IntegerField(min_value=1)
    scheduled_at = serializers.DateTimeField()
    mode = GameModeSerializer()
    deck = HouseDeckSerializer()
    user_a = HeadToHeadSideSerializer()
    user_b = HeadToHeadSideSerializer()


class HeadToHeadCountPairSerializer(serializers.Serializer):
    user_a = serializers.IntegerField(min_value=0)
    user_b = serializers.IntegerField(min_value=0)


class HeadToHeadFavoriteFactionsSerializer(serializers.Serializer):
    user_a = serializers.CharField(allow_null=True)
    user_b = serializers.CharField(allow_null=True)


class HeadToHeadStatsSerializer(serializers.Serializer):
    user_a = PublicUserSerializer()
    user_b = PublicUserSerializer()
    games_together = serializers.IntegerField(min_value=0)
    wins = HeadToHeadCountPairSerializer()
    higher_place = HeadToHeadCountPairSerializer()
    favorite_factions = HeadToHeadFavoriteFactionsSerializer()
    matches = HeadToHeadMatchSerializer(many=True)


class OverviewStatsSerializer(serializers.Serializer):
    next_match = OverviewSessionSerializer(allow_null=True)
    recent_matches = OverviewSessionSerializer(many=True)
    total_matches = serializers.IntegerField(min_value=0)
    active_players = serializers.IntegerField(min_value=0)
    most_popular_faction = OverviewMostPopularFactionSerializer(allow_null=True)
    current_leader = OverviewCurrentLeaderSerializer(allow_null=True)
    faction_winrates = OverviewFactionWinrateSerializer(many=True)
    top_winrate = OverviewTopWinrateSerializer(many=True)
    fun_facts = OverviewFunFactSerializer(many=True)
