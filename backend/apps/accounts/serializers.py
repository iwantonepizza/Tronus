from __future__ import annotations

from rest_framework import serializers

from apps.reference.models import Faction

from .models import User


def _build_absolute_media_url(*, serializer: serializers.BaseSerializer, path: str) -> str:
    request = serializer.context.get("request")
    if request is None:
        return path
    return request.build_absolute_uri(path)


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    password_repeat = serializers.CharField(write_only=True, trim_whitespace=False)
    nickname = serializers.CharField(max_length=64)
    secret_word = serializers.CharField(
        required=False,
        allow_blank=True,
        write_only=True,
        trim_whitespace=False,
    )

    def validate(self, attrs: dict[str, str]) -> dict[str, str]:
        if attrs["password"] != attrs["password_repeat"]:
            raise serializers.ValidationError({"password_repeat": ["Пароли не совпадают."]})
        return attrs


class LoginSerializer(serializers.Serializer):
    login = serializers.CharField(max_length=254)
    password = serializers.CharField(write_only=True, trim_whitespace=False)


class PasswordResetSerializer(serializers.Serializer):
    login = serializers.CharField(max_length=254)
    secret_word = serializers.CharField(trim_whitespace=False)
    new_password = serializers.CharField(write_only=True, trim_whitespace=False)
    new_password_repeat = serializers.CharField(write_only=True, trim_whitespace=False)


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True, trim_whitespace=False)
    new_password = serializers.CharField(write_only=True, trim_whitespace=False)
    new_password_repeat = serializers.CharField(write_only=True, trim_whitespace=False)


class PublicUserSerializer(serializers.ModelSerializer):
    nickname = serializers.CharField(source="profile.nickname", read_only=True)
    favorite_faction = serializers.SlugRelatedField(
        source="profile.favorite_faction",
        slug_field="slug",
        read_only=True,
    )
    current_avatar = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "nickname", "favorite_faction", "current_avatar", "date_joined")

    def get_current_avatar(self, obj: User) -> str | None:
        avatar = getattr(obj.profile, "current_avatar", None)
        if avatar is None or not avatar.generated_image:
            return None
        return _build_absolute_media_url(serializer=self, path=avatar.generated_image.url)


class PrivateUserSerializer(PublicUserSerializer):
    username = serializers.CharField(read_only=True)
    email = serializers.EmailField(read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    bio = serializers.CharField(source="profile.bio", read_only=True)

    class Meta(PublicUserSerializer.Meta):
        fields = (
            "id",
            "username",
            "email",
            "is_active",
            "nickname",
            "favorite_faction",
            "bio",
            "current_avatar",
            "date_joined",
        )


class UpdateProfileSerializer(serializers.Serializer):
    nickname = serializers.CharField(max_length=64, required=False)
    favorite_faction = serializers.SlugRelatedField(
        queryset=Faction.objects.filter(is_active=True),
        slug_field="slug",
        required=False,
        allow_null=True,
    )
    bio = serializers.CharField(required=False, allow_blank=True)
