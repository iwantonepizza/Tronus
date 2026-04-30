from __future__ import annotations

from rest_framework import serializers

from apps.accounts.models import User
from apps.reference.models import Faction, GameMode, HouseDeck

from .models import (
    GameSession,
    MatchTimelineEvent,
    Outcome,
    Participation,
    RoundSnapshot,
    SessionInvite,
)

VALID_WILDLINGS_THREAT = [0, 2, 4, 6, 8, 10, 12]


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
                {
                    "player": [
                        "Если указаны оба параметра, `player` должен совпадать с `user`."
                    ]
                }
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
    fun_facts = serializers.SerializerMethodField()

    class Meta:
        model = Outcome
        fields = ("rounds_played", "end_reason", "mvp", "final_note", "fun_facts")

    def get_fun_facts(self, obj: Outcome) -> list:
        from apps.stats.selectors import session_fun_facts

        try:
            return session_fun_facts(obj.session)
        except Exception:
            return []


class ParticipationSerializer(serializers.ModelSerializer):
    user = UserSummarySerializer(read_only=True)
    faction = serializers.SlugRelatedField(read_only=True, slug_field="slug")

    class Meta:
        model = Participation
        fields = ("id", "user", "faction", "place", "castles", "is_winner", "notes")


class SessionListSerializer(serializers.ModelSerializer):
    mode = serializers.SlugRelatedField(read_only=True, slug_field="slug")
    deck = serializers.SlugRelatedField(
        source="house_deck",
        read_only=True,
        slug_field="slug",
    )
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
        queryset=HouseDeck.objects.all(),
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


class FinalizeSessionSerializer(serializers.Serializer):
    mvp = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(is_active=True),
        allow_null=True,
        required=False,
        default=None,
    )
    final_note = serializers.CharField(required=False, allow_blank=True, default="")


class FinalizePlayedResultItemSerializer(serializers.Serializer):
    user_id = serializers.IntegerField(min_value=1)
    faction_slug = serializers.SlugField()
    place = serializers.IntegerField(min_value=1)
    castles = serializers.IntegerField(min_value=0, max_value=7, required=False, default=0)


class FinalizePlayedSessionSerializer(serializers.Serializer):
    """Payload for retroactive ('played') session finalization."""

    results = FinalizePlayedResultItemSerializer(many=True)
    rounds_played = serializers.IntegerField(min_value=1, required=False, default=1)
    end_reason = serializers.ChoiceField(
        choices=Outcome.EndReason.choices,
        required=False,
        default=Outcome.EndReason.OTHER,
    )
    mvp = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(is_active=True),
        allow_null=True,
        required=False,
        default=None,
    )
    final_note = serializers.CharField(required=False, allow_blank=True, default="")


class SessionStartSerializer(serializers.Serializer):
    class AssignmentItemSerializer(serializers.Serializer):
        user_id = serializers.IntegerField(min_value=1)
        faction_slug = serializers.SlugField()

    factions_assignment = AssignmentItemSerializer(many=True)

    def validate_factions_assignment(self, items: list[dict]) -> dict[int, str]:
        if not items:
            raise serializers.ValidationError("Необходимо передать хотя бы одну запись.")

        result: dict[int, str] = {}
        errors: list[str] = []

        for item in items:
            uid = item["user_id"]
            slug = item["faction_slug"]
            if uid in result:
                errors.append(f"Пользователь {uid} встречается несколько раз.")
            elif slug in result.values():
                errors.append(f"Фракция '{slug}' назначена нескольким игрокам.")
            else:
                result[uid] = slug

        if errors:
            raise serializers.ValidationError(errors)

        return result


class RoundSnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoundSnapshot
        fields = (
            "id",
            "round_number",
            "influence_throne",
            "influence_sword",
            "influence_court",
            "supply",
            "castles",
            "wildlings_threat",
            "note",
            "created_at",
        )
        read_only_fields = fields


class CompleteRoundSerializer(serializers.Serializer):
    influence_throne = serializers.ListField(child=serializers.IntegerField(min_value=1))
    influence_sword = serializers.ListField(child=serializers.IntegerField(min_value=1))
    influence_court = serializers.ListField(child=serializers.IntegerField(min_value=1))
    supply = serializers.DictField(child=serializers.IntegerField(min_value=0, max_value=6))
    castles = serializers.DictField(child=serializers.IntegerField(min_value=0, max_value=7))
    wildlings_threat = serializers.ChoiceField(
        choices=[(value, str(value)) for value in VALID_WILDLINGS_THREAT]
    )
    note = serializers.CharField(required=False, allow_blank=True, default="")


class SessionInviteSerializer(serializers.ModelSerializer):
    user = UserSummarySerializer(read_only=True)
    desired_faction = serializers.SlugRelatedField(
        read_only=True,
        slug_field="slug",
        allow_null=True,
    )
    invited_by = UserSummarySerializer(read_only=True)

    class Meta:
        model = SessionInvite
        fields = (
            "id",
            "user",
            "rsvp_status",
            "desired_faction",
            "invited_by",
            "created_at",
        )


class InviteUserSerializer(serializers.Serializer):
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(is_active=True),
        source="invitee",
    )


class UpdateInviteSerializer(serializers.Serializer):
    rsvp_status = serializers.ChoiceField(
        choices=SessionInvite.RsvpStatus.choices,
        required=False,
    )
    desired_faction_slug = serializers.SlugField(required=False, allow_null=True)


class UpdateRsvpSerializer(serializers.Serializer):
    rsvp_status = serializers.ChoiceField(
        choices=SessionInvite.RsvpStatus.choices,
        required=False,
    )
    desired_faction = serializers.SlugRelatedField(
        slug_field="slug",
        queryset=Faction.objects.filter(is_active=True),
        allow_null=True,
        required=False,
    )


class ReplaceParticipantSerializer(serializers.Serializer):
    out_user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(is_active=True),
        source="out_user",
    )
    in_user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(is_active=True),
        source="in_user",
    )


class MatchTimelineEventSerializer(serializers.ModelSerializer):
    actor = UserSummarySerializer(read_only=True)

    class Meta:
        model = MatchTimelineEvent
        fields = ("id", "kind", "happened_at", "actor", "payload", "created_at")


class WildlingsRaidSerializer(serializers.Serializer):
    class BidSerializer(serializers.Serializer):
        participation_id = serializers.IntegerField(min_value=1)
        amount = serializers.IntegerField(min_value=0)

    bids = BidSerializer(many=True)
    outcome = serializers.ChoiceField(choices=["win", "loss"])
    outcome_card_slug = serializers.CharField(required=False, allow_null=True, default=None)
    wildlings_threat_after = serializers.ChoiceField(
        choices=[(value, str(value)) for value in VALID_WILDLINGS_THREAT]
    )


class ClashOfKingsTrackEntrySerializer(serializers.Serializer):
    participation_id = serializers.IntegerField(min_value=1)
    bid = serializers.IntegerField(min_value=0)
    place = serializers.IntegerField(min_value=1)


class ClashOfKingsSerializer(serializers.Serializer):
    influence_throne = ClashOfKingsTrackEntrySerializer(many=True)
    influence_sword = ClashOfKingsTrackEntrySerializer(many=True)
    influence_court = ClashOfKingsTrackEntrySerializer(many=True)

    def validate(self, attrs):
        return {
            "tracks": {
                "influence_throne": attrs["influence_throne"],
                "influence_sword": attrs["influence_sword"],
                "influence_court": attrs["influence_court"],
            }
        }


class EventCardPlayedSerializer(serializers.Serializer):
    deck_number = serializers.IntegerField(min_value=1, max_value=4)
    card_slug = serializers.SlugField()


class RandomizeFactionResultSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    faction_slug = serializers.CharField()
