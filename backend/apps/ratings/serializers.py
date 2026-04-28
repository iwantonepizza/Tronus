from __future__ import annotations

from rest_framework import serializers

from apps.accounts.models import User
from apps.accounts.serializers import PublicUserSerializer

from .models import MatchVote

API_TO_DB_VOTE_TYPE = {
    "positive": MatchVote.VoteType.CROWN,
    "negative": MatchVote.VoteType.SHIT,
}
DB_TO_API_VOTE_TYPE = {value: key for key, value in API_TO_DB_VOTE_TYPE.items()}


class VoteWriteSerializer(serializers.Serializer):
    to_user = serializers.PrimaryKeyRelatedField(queryset=User.objects.filter(is_active=True))
    vote_type = serializers.ChoiceField(choices=tuple(API_TO_DB_VOTE_TYPE))

    def validate_vote_type(self, value: str) -> str:
        return API_TO_DB_VOTE_TYPE[value]


class VoteUpdateSerializer(serializers.Serializer):
    vote_type = serializers.ChoiceField(choices=tuple(API_TO_DB_VOTE_TYPE))

    def validate_vote_type(self, value: str) -> str:
        return API_TO_DB_VOTE_TYPE[value]


class MatchVoteSerializer(serializers.ModelSerializer):
    from_user = PublicUserSerializer(read_only=True)
    to_user = PublicUserSerializer(read_only=True)
    vote_type = serializers.SerializerMethodField()

    class Meta:
        model = MatchVote
        fields = ("id", "from_user", "to_user", "vote_type", "created_at")

    def get_vote_type(self, obj: MatchVote) -> str:
        return DB_TO_API_VOTE_TYPE[obj.vote_type]
