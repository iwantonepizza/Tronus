from __future__ import annotations

from rest_framework import serializers

from apps.reference.models import Faction

from .models import AvatarAsset


class AvatarGenerateSerializer(serializers.Serializer):
    faction = serializers.SlugRelatedField(
        queryset=Faction.objects.filter(is_active=True),
        slug_field="slug",
    )
    photo = serializers.ImageField()


class AvatarAssetSerializer(serializers.ModelSerializer):
    faction = serializers.SlugRelatedField(read_only=True, slug_field="slug")

    class Meta:
        model = AvatarAsset
        fields = (
            "id",
            "faction",
            "style",
            "source_photo",
            "generated_image",
            "is_current",
            "created_at",
        )
