from __future__ import annotations

from rest_framework import serializers

from apps.accounts.models import User
from apps.reference.models import Deck, Faction, GameMode

from .models import GameSession, Outcome, Participation


class SessionListQuerySerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=GameSession.Status.choices, required=False)
    user = serializers.IntegerField(required=False, min_value=1)
    player = serializers.IntegerField(required=False, min_value=1)
    from_ = serializers.DateTimeField(required=False)
    to = serializers.DateTimeField(required=False)

    def validate(self, attrs):
        user = attrs.get("user")
        player = attrs.get("player")

        if user is not None and player is not None and user != player:
            raise serializers.ValidationError(
                {"player": ["`player` must match `user` when both are provided."]}
            )

        attrs["user_id"] = user if user is not None else player
        attrs["from_at"] = attrs.get("from_")
        attrs["to_at"] = attrs.get("to")
        return attrs


class UserSummarySerializer(serializers.ModelSerializer):
    nickname = serializers.CharField(source="profile.nickname")

    class Meta:
        model = User
        fields = ("id", "nickname")


class OutcomeSerializer(serializers.ModelSerializer):
    mvp = UserSummarySerializer(read_only=True)

    class Meta:
        model = Outcome
        fields = ("rounds_played", "end_reason", "mvp", "final_note")


class ParticipationSerializer(serializers.ModelSerializer):
    user = UserSummarySerializer(read_only=True)
    faction = serializers.SlugRelatedField(read_only=True, slug_field="slug")

    class Meta:
        model = Participation
        fields = ("id", "user", "faction", "place", "castles", "is_winner", "notes")


class SessionListSerializer(serializers.ModelSerializer):
    mode = serializers.SlugRelatedField(read_only=True, slug_field="slug")
    deck = serializers.SlugRelatedField(read_only=True, slug_field="slug")
    created_by = UserSummarySerializer(read_only=True)

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
        )


class SessionDetailSerializer(SessionListSerializer):
    participations = ParticipationSerializer(many=True, read_only=True)
    outcome = OutcomeSerializer(read_only=True, allow_null=True)

    class Meta(SessionListSerializer.Meta):
        fields = SessionListSerializer.Meta.fields + ("participations", "outcome")


class SessionWriteSerializer(serializers.Serializer):
    scheduled_at = serializers.DateTimeField(required=False)
    mode = serializers.SlugRelatedField(
        slug_field="slug",
        queryset=GameMode.objects.all(),
        required=False,
    )
    deck = serializers.SlugRelatedField(
        slug_field="slug",
        queryset=Deck.objects.all(),
        required=False,
    )
    planning_note = serializers.CharField(required=False, allow_blank=True)


class AddParticipantSerializer(serializers.Serializer):
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.filter(is_active=True))
    faction = serializers.SlugRelatedField(
        slug_field="slug",
        queryset=Faction.objects.filter(is_active=True),
    )


class UpdateParticipantSerializer(serializers.Serializer):
    faction = serializers.SlugRelatedField(
        slug_field="slug",
        queryset=Faction.objects.filter(is_active=True),
        required=False,
    )
    notes = serializers.CharField(required=False, allow_blank=True)


class FinalizeParticipationSerializer(serializers.Serializer):
    id = serializers.IntegerField(min_value=1)
    place = serializers.IntegerField(min_value=1)
    castles = serializers.IntegerField(min_value=0)


class FinalizeSessionSerializer(serializers.Serializer):
    rounds_played = serializers.IntegerField(min_value=1)
    end_reason = serializers.ChoiceField(choices=Outcome.EndReason.choices)
    mvp = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(is_active=True),
        allow_null=True,
        required=False,
        default=None,
    )
    final_note = serializers.CharField(required=False, allow_blank=True, default="")
    participations = FinalizeParticipationSerializer(many=True)
