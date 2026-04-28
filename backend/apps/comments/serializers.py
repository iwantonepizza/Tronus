from __future__ import annotations

from rest_framework import serializers

from apps.accounts.serializers import PublicUserSerializer

from .models import MatchComment


class CommentListQuerySerializer(serializers.Serializer):
    before = serializers.IntegerField(required=False, min_value=1)
    limit = serializers.IntegerField(required=False, min_value=1, max_value=50, default=50)

    def validate(self, attrs):
        attrs["before_id"] = attrs.get("before")
        return attrs


class CommentWriteSerializer(serializers.Serializer):
    body = serializers.CharField(max_length=2000, trim_whitespace=False)


class MatchCommentSerializer(serializers.ModelSerializer):
    author = PublicUserSerializer(read_only=True)

    class Meta:
        model = MatchComment
        fields = ("id", "author", "body", "created_at", "edited_at")
