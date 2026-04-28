from __future__ import annotations

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import transaction

from apps.reference.models import Faction

from .models import Profile, User

UNSET = object()


@transaction.atomic
def register_user(*, email: str, password: str, nickname: str) -> User:
    normalized_email = User.objects.normalize_email(email).strip()
    normalized_nickname = nickname.strip()

    errors: dict[str, list[str]] = {}

    if User.objects.filter(email__iexact=normalized_email).exists():
        errors["email"] = ["A user with this email already exists."]

    if Profile.objects.filter(nickname__iexact=normalized_nickname).exists():
        errors["nickname"] = ["A user with this nickname already exists."]

    try:
        validate_password(password)
    except ValidationError as exc:
        errors["password"] = list(exc.messages)

    if errors:
        raise ValidationError(errors)

    user = User(
        username=normalized_email,
        email=normalized_email,
        is_active=False,
    )
    user.set_password(password)
    user.save()

    Profile.objects.update_or_create(
        user=user,
        defaults={"nickname": normalized_nickname},
    )
    return user


@transaction.atomic
def approve_user(*, user: User) -> User:
    if user.is_active:
        return user

    user.is_active = True
    user.save(update_fields=["is_active"])
    return user


@transaction.atomic
def update_profile(
    *,
    profile: Profile,
    nickname: str | object = UNSET,
    favorite_faction: Faction | None | object = UNSET,
    bio: str | object = UNSET,
) -> Profile:
    errors: dict[str, list[str]] = {}
    update_fields: list[str] = []

    if nickname is not UNSET:
        normalized_nickname = str(nickname).strip()
        if Profile.objects.exclude(user=profile.user).filter(
            nickname__iexact=normalized_nickname
        ).exists():
            errors["nickname"] = ["A user with this nickname already exists."]
        else:
            profile.nickname = normalized_nickname
            update_fields.append("nickname")

    if bio is not UNSET:
        profile.bio = str(bio)
        update_fields.append("bio")

    if favorite_faction is not UNSET:
        profile.favorite_faction = favorite_faction
        update_fields.append("favorite_faction")

    if errors:
        raise ValidationError(errors)

    if update_fields:
        update_fields.append("updated_at")
        profile.save(update_fields=update_fields)

    profile.refresh_from_db()
    return profile
