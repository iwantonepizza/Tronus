from __future__ import annotations

from typing import TypedDict

from django.conf import settings
from django.contrib.auth.models import Group
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import transaction

from apps.reference.models import Faction

from . import selectors
from .models import Profile, User

UNSET = object()


class RegistrationResult(TypedDict):
    user: User
    auto_activated: bool


@transaction.atomic
def register_user(
    *,
    email: str,
    password: str,
    nickname: str,
    secret_word: str | None = None,
) -> RegistrationResult:
    normalized_email = User.objects.normalize_email(email).strip()
    normalized_nickname = nickname.strip()

    errors: dict[str, list[str]] = {}

    if User.objects.filter(email__iexact=normalized_email).exists():
        errors["email"] = ["Пользователь с таким email уже существует."]

    if Profile.objects.filter(nickname__iexact=normalized_nickname).exists():
        errors["nickname"] = ["Пользователь с таким ником уже существует."]

    try:
        validate_password(password)
    except ValidationError as exc:
        errors["password"] = list(exc.messages)

    if errors:
        raise ValidationError(errors)

    configured_secret_word = settings.REGISTRATION_SECRET_WORD.strip()
    normalized_secret_word = (secret_word or "").strip().lower()
    auto_activated = bool(
        configured_secret_word
        and normalized_secret_word
        and normalized_secret_word == configured_secret_word.lower()
    )

    user = User(
        username=normalized_email,
        email=normalized_email,
        is_active=auto_activated,
    )
    user.set_password(password)
    user.save()

    # If auto-activated, add player group immediately (signal only fires on
    # is_active False→True transition, not on initial creation with is_active=True)
    if auto_activated:
        player_group, _ = Group.objects.get_or_create(name="player")
        user.groups.add(player_group)

    Profile.objects.update_or_create(
        user=user,
        defaults={"nickname": normalized_nickname},
    )
    return {"user": user, "auto_activated": auto_activated}


def find_user_by_login(*, login: str) -> User | None:
    normalized_login = login.strip()

    user = selectors.get_user_by_email(email=normalized_login)
    if user is not None:
        return user

    return selectors.get_user_by_nickname(nickname=normalized_login)


@transaction.atomic
def reset_password(
    *,
    email: str,
    secret_word: str,
    new_password: str,
    new_password_repeat: str,
) -> User:
    """ADR-0019 / Wave 11: password reset accepts ONLY email, not nickname.

    Rationale (owner): "по нику легко взломать, секретное слово все знают".
    Reset by-nickname removed because nicknames are public.
    """
    invalid_login_or_secret_error = ValidationError(
        {"email": ["Неверный email или секретное слово."]}
    )
    normalized_email = email.strip()
    user = selectors.get_user_by_email(email=normalized_email)

    if user is None:
        raise invalid_login_or_secret_error

    configured_secret_word = settings.REGISTRATION_SECRET_WORD.strip()
    normalized_secret_word = secret_word.strip().lower()
    if (
        not configured_secret_word
        or not normalized_secret_word
        or normalized_secret_word != configured_secret_word.lower()
    ):
        raise invalid_login_or_secret_error

    errors: dict[str, list[str]] = {}
    if new_password != new_password_repeat:
        errors["new_password_repeat"] = ["Пароли не совпадают."]

    try:
        validate_password(new_password, user=user)
    except ValidationError as exc:
        errors["new_password"] = list(exc.messages)

    if errors:
        raise ValidationError(errors)

    user.set_password(new_password)
    user.save(update_fields=["password"])
    return user


@transaction.atomic
def change_password(
    *,
    user: User,
    current_password: str,
    new_password: str,
    new_password_repeat: str,
) -> User:
    errors: dict[str, list[str]] = {}

    if not user.check_password(current_password):
        errors["current_password"] = ["Текущий пароль введён неверно."]

    if new_password != new_password_repeat:
        errors["new_password_repeat"] = ["Пароли не совпадают."]

    try:
        validate_password(new_password, user=user)
    except ValidationError as exc:
        errors["new_password"] = list(exc.messages)

    if errors:
        raise ValidationError(errors)

    user.set_password(new_password)
    user.save(update_fields=["password"])
    return user


@transaction.atomic
def approve_user(*, user: User) -> User:
    if user.is_active:
        return user

    user.is_active = True
    user.save(update_fields=["is_active"])

    # Add to player group, just like the auto-activation path. The signal
    # that handles the False→True transition takes care of this in most
    # setups but a duplicate add is harmless.
    player_group, _ = Group.objects.get_or_create(name="player")
    user.groups.add(player_group)
    return user


@transaction.atomic
def reject_user(*, user: User) -> None:
    """Hard-delete a not-yet-activated user.

    Only allowed for ``is_active=False`` accounts so an admin can never wipe
    an active player by mistake. Active users with their own data should be
    deactivated through the regular admin / API surface.
    """
    if user.is_active:
        raise ValidationError(
            {"user": ["Удалять можно только аккаунты, ожидающие подтверждения."]}
        )
    user.delete()


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
            errors["nickname"] = ["Пользователь с таким ником уже существует."]
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