from __future__ import annotations

import pytest
from django.db.models.signals import post_save

from apps.accounts.models import Profile, User
from apps.accounts.serializers import PublicUserSerializer
from apps.accounts.services import approve_user, register_user, update_profile
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
    user = register_user(
        email="friend@example.com",
        password="StrongPassword123!",
        nickname="IronFist",
    )

    assert user.is_active is False
    assert user.email == "friend@example.com"
    assert user.username == "friend@example.com"
    assert Profile.objects.filter(user=user, nickname="IronFist").exists()


@pytest.mark.django_db
def test_register_user_works_without_signals() -> None:
    post_save.disconnect(create_profile_for_user, sender=User)

    try:
        user = register_user(
            email="nosignal@example.com",
            password="StrongPassword123!",
            nickname="NoSignalUser",
        )
    finally:
        post_save.connect(create_profile_for_user, sender=User)

    assert Profile.objects.filter(user=user, nickname="NoSignalUser").exists()


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
