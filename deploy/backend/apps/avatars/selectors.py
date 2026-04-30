from __future__ import annotations

from django.db.models import QuerySet

from .models import AvatarAsset


def get_avatar_queryset() -> QuerySet[AvatarAsset]:
    return (
        AvatarAsset.objects.select_related("user", "user__profile", "faction")
        .order_by("-created_at", "-id")
    )


def list_user_avatars(*, user_id: int) -> QuerySet[AvatarAsset]:
    return get_avatar_queryset().filter(user_id=user_id)
