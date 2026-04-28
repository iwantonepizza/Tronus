from __future__ import annotations

import pytest
from django.contrib.auth.models import Group

from apps.accounts.models import Profile, User


@pytest.mark.django_db
def test_user_creation_creates_profile_with_username_as_nickname() -> None:
    user = User.objects.create_user(
        username="robb@example.com",
        email="robb@example.com",
        password="north123",
    )

    assert Profile.objects.filter(user=user, nickname="robb@example.com").exists()


@pytest.mark.django_db
def test_updating_existing_user_does_not_create_duplicate_profile() -> None:
    user = User.objects.create_user(
        username="bran@example.com",
        email="bran@example.com",
        password="threeeyed123",
    )

    user.first_name = "Bran"
    user.save(update_fields=["first_name"])

    assert Profile.objects.filter(user=user).count() == 1


@pytest.mark.django_db
def test_activation_creates_player_group_membership_and_restores_missing_profile() -> None:
    user = User.objects.create_user(
        username="activate@example.com",
        email="activate@example.com",
        password="threeeyed123",
        is_active=False,
    )
    user.profile.delete()

    user.is_active = True
    user.save(update_fields=["is_active"])

    assert Profile.objects.filter(user=user).count() == 1
    assert user.groups.filter(name="player").exists()
    assert Group.objects.filter(name="player").exists()


@pytest.mark.django_db
def test_signal_does_not_add_player_group_on_regular_active_user_save() -> None:
    user = User.objects.create_user(
        username="active@example.com",
        email="active@example.com",
        password="threeeyed123",
        is_active=True,
    )

    user.first_name = "Active"
    user.save(update_fields=["first_name"])

    assert user.groups.filter(name="player").exists() is False
