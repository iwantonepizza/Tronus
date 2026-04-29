from __future__ import annotations

import pytest
from django.db import IntegrityError

from apps.accounts.models import Profile, User


@pytest.mark.django_db
def test_profile_str_returns_nickname() -> None:
    user = User.objects.create_user(
        username="ned@example.com",
        email="ned@example.com",
        password="winteriscoming",
    )

    assert str(user.profile) == "ned@example.com"


@pytest.mark.django_db
def test_profile_uses_user_id_as_primary_key() -> None:
    user = User.objects.create_user(
        username="arya@example.com",
        email="arya@example.com",
        password="needle123",
    )

    assert user.profile.pk == user.pk


@pytest.mark.django_db(transaction=True)
def test_profile_nickname_must_be_unique() -> None:
    User.objects.create_user(
        username="jon@example.com",
        email="jon@example.com",
        password="ghost123",
    )
    second_user = User.objects.create_user(
        username="sansa@example.com",
        email="sansa@example.com",
        password="winterfell123",
    )

    with pytest.raises(IntegrityError):
        Profile.objects.filter(user=second_user).update(nickname="jon@example.com")
