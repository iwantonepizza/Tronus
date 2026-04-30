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
    source_photo = serializers.SerializerMethodField()
    generated_image = serializers.SerializerMethodField()

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

    def get_source_photo(self, obj: AvatarAsset) -> str | None:
        if not obj.source_photo:
            return None
        return self._build_absolute_media_url(obj.source_photo.url)

    def get_generated_image(self, obj: AvatarAsset) -> str:
        return self._build_absolute_media_url(obj.generated_image.url)

    def _build_absolute_media_url(self, path: str) -> str:
        request = self.context.get("request")
        if request is None:
            return path
        return request.build_absolute_uri(path)
