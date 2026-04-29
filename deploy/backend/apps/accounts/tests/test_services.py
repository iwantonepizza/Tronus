from __future__ import annotations

import pytest
from django.core.exceptions import ValidationError
from django.db.models.signals import post_save

from apps.accounts.models import Profile, User
from apps.accounts.serializers import PublicUserSerializer
from apps.accounts.services import (
    approve_user,
    change_password,
    find_user_by_login,
    register_user,
    reset_password,
    update_profile,
)
from apps.accounts.signals import create_profile_for_user
from apps.reference.models import Faction


def _ensure_stark_faction() -> Faction:
    faction, _ = Faction.objects.get_or_create(
        slug="stark",
        defaults={
            "name": "Stark",
            "color": "#6B7B8C",
            "on_primary": "#F0F0F0",
            "is_active": True,
        },
    )
    return faction


@pytest.mark.django_db
def test_register_user_creates_inactive_user_and_profile() -> None:
    result = register_user(
        email="friend@example.com",
        password="StrongPassword123!",
        nickname="IronFist",
    )
    user = result["user"]

    assert user.is_active is False
    assert result["auto_activated"] is False
    assert user.email == "friend@example.com"
    assert user.username == "friend@example.com"
    assert Profile.objects.filter(user=user, nickname="IronFist").exists()


@pytest.mark.django_db
def test_register_user_works_without_signals() -> None:
    post_save.disconnect(create_profile_for_user, sender=User)

    try:
        result = register_user(
            email="nosignal@example.com",
            password="StrongPassword123!",
            nickname="NoSignalUser",
        )
    finally:
        post_save.connect(create_profile_for_user, sender=User)

    user = result["user"]
    assert Profile.objects.filter(user=user, nickname="NoSignalUser").exists()


@pytest.mark.django_db
def test_register_user_auto_activates_with_matching_secret_word(settings) -> None:
    settings.REGISTRATION_SECRET_WORD = "lovecraft"

    result = register_user(
        email="autoactive@example.com",
        password="StrongPassword123!",
        nickname="Dreamer",
        secret_word="LoVeCrAfT",
    )

    user = result["user"]

    assert user.is_active is True
    assert result["auto_activated"] is True


@pytest.mark.django_db
def test_register_user_ignores_wrong_secret_word(settings) -> None:
    settings.REGISTRATION_SECRET_WORD = "lovecraft"

    result = register_user(
        email="wrongsecret@example.com",
        password="StrongPassword123!",
        nickname="DreamerTwo",
        secret_word="wrong-word",
    )

    user = result["user"]

    assert user.is_active is False
    assert result["auto_activated"] is False


@pytest.mark.django_db
def test_approve_user_activates_user() -> None:
    user = User.objects.create_user(
        username="friend@example.com",
        email="friend@example.com",
        password="StrongPassword123!",
        is_active=False,
    )

    approve_user(user=user)
    user.refresh_from_db()

    assert user.is_active is True


@pytest.mark.django_db
def test_find_user_by_login_finds_by_email() -> None:
    user = User.objects.create_user(
        username="friend@example.com",
        email="friend@example.com",
        password="StrongPassword123!",
        is_active=True,
    )
    user.profile.nickname = "IronFist"
    user.profile.save(update_fields=["nickname"])

    found_user = find_user_by_login(login="FRIEND@example.com")

    assert found_user == user


@pytest.mark.django_db
def test_find_user_by_login_finds_by_nickname() -> None:
    user = User.objects.create_user(
        username="friend@example.com",
        email="friend@example.com",
        password="StrongPassword123!",
        is_active=True,
    )
    user.profile.nickname = "IronFist"
    user.profile.save(update_fields=["nickname"])

    found_user = find_user_by_login(login="ironfist")

    assert found_user == user


@pytest.mark.django_db
def test_reset_password_updates_password_with_valid_secret_word(settings) -> None:
    settings.REGISTRATION_SECRET_WORD = "lovecraft"
    user = User.objects.create_user(
        username="friend@example.com",
        email="friend@example.com",
        password="StrongPassword123!",
        is_active=True,
    )
    user.profile.nickname = "IronFist"
    user.profile.save(update_fields=["nickname"])

    reset_password(
        login="ironfist",
        secret_word="LoVeCrAfT",
        new_password="NewStrongPassword123!",
        new_password_repeat="NewStrongPassword123!",
    )

    user.refresh_from_db()
    assert user.check_password("NewStrongPassword123!")


@pytest.mark.django_db
def test_reset_password_rejects_unknown_login_with_shared_message(settings) -> None:
    settings.REGISTRATION_SECRET_WORD = "lovecraft"

    with pytest.raises(ValidationError) as exc_info:
        reset_password(
            login="missing@example.com",
            secret_word="lovecraft",
            new_password="NewStrongPassword123!",
            new_password_repeat="NewStrongPassword123!",
        )

    assert exc_info.value.message_dict == {"login": ["Неверный логин или секретное слово."]}


@pytest.mark.django_db
def test_reset_password_rejects_wrong_secret_word_with_shared_message(settings) -> None:
    settings.REGISTRATION_SECRET_WORD = "lovecraft"
    user = User.objects.create_user(
        username="friend@example.com",
        email="friend@example.com",
        password="StrongPassword123!",
        is_active=True,
    )

    with pytest.raises(ValidationError) as exc_info:
        reset_password(
            login=user.email,
            secret_word="wrong-word",
            new_password="NewStrongPassword123!",
            new_password_repeat="NewStrongPassword123!",
        )

    assert exc_info.value.message_dict == {"login": ["Неверный логин или секретное слово."]}


@pytest.mark.django_db
def test_change_password_updates_password_with_valid_current_password() -> None:
    user = User.objects.create_user(
        username="friend@example.com",
        email="friend@example.com",
        password="StrongPassword123!",
        is_active=True,
    )

    change_password(
        user=user,
        current_password="StrongPassword123!",
        new_password="NewStrongPassword123!",
        new_password_repeat="NewStrongPassword123!",
    )

    user.refresh_from_db()
    assert user.check_password("NewStrongPassword123!")


@pytest.mark.django_db
def test_change_password_rejects_invalid_current_password() -> None:
    user = User.objects.create_user(
        username="friend@example.com",
        email="friend@example.com",
        password="StrongPassword123!",
        is_active=True,
    )

    with pytest.raises(ValidationError) as exc_info:
        change_password(
            user=user,
            current_password="wrong-password",
            new_password="NewStrongPassword123!",
            new_password_repeat="NewStrongPassword123!",
        )

    assert exc_info.value.message_dict == {
        "current_password": ["Текущий пароль введён неверно."]
    }


@pytest.mark.django_db
def test_public_user_serializer_omits_email() -> None:
    user = User.objects.create_user(
        username="public@example.com",
        email="public@example.com",
        password="StrongPassword123!",
    )
    user.profile.nickname = "PublicUser"
    user.profile.save(update_fields=["nickname"])

    data = PublicUserSerializer(user).data

    assert "email" not in data
    assert data["nickname"] == "PublicUser"


@pytest.mark.django_db
def test_update_profile_updates_profile_fields() -> None:
    user = User.objects.create_user(
        username="update@example.com",
        email="update@example.com",
        password="StrongPassword123!",
        is_active=True,
    )
    faction = _ensure_stark_faction()

    profile = update_profile(
        profile=user.profile,
        nickname="UpdatedUser",
        bio="King in the North",
        favorite_faction=faction,
    )

    assert profile.nickname == "UpdatedUser"
    assert profile.bio == "King in the North"
    assert profile.favorite_faction == faction
