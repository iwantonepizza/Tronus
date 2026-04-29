from __future__ import annotations

from django.db.models import QuerySet

from .models import User


def list_public_users() -> QuerySet[User]:
    return (
        User.objects.filter(is_active=True)
        .select_related("profile", "profile__favorite_faction", "profile__current_avatar")
        .order_by("profile__nickname", "id")
    )


def get_public_user_queryset() -> QuerySet[User]:
    return list_public_users()


def get_user_queryset() -> QuerySet[User]:
    return User.objects.select_related(
        "profile",
        "profile__favorite_faction",
        "profile__current_avatar",
    ).order_by("id")


def get_user_by_email(*, email: str) -> User | None:
    return get_user_queryset().filter(email__iexact=email).first()


def get_user_by_nickname(*, nickname: str) -> User | None:
    return get_user_queryset().filter(profile__nickname__iexact=nickname).first()
