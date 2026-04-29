from __future__ import annotations

from datetime import timedelta

import pytest
from django.utils import timezone

from apps.accounts.models import User
from apps.games.models import GameSession
from apps.reference.models import GameMode, HouseDeck


def _ensure_reference_data() -> dict[str, object]:
    classic, _ = GameMode.objects.get_or_create(
        slug="classic",
        defaults={
            "name": "Classic",
            "min_players": 3,
            "max_players": 8,
        },
    )
    original, _ = HouseDeck.objects.get_or_create(
        slug="original",
        defaults={"name": "Original"},
    )
    return {
        "classic": classic,
        "original": original,
    }


@pytest.fixture
def make_user():
    def factory(*, email: str, is_staff: bool = False) -> User:
        return User.objects.create_user(
            username=email,
            email=email,
            password="StrongPassword123!",
            is_active=True,
            is_staff=is_staff,
        )

    return factory


@pytest.fixture
def make_session():
    def factory(*, created_by: User, scheduled_at=None) -> GameSession:
        reference = _ensure_reference_data()
        return GameSession.objects.create(
            scheduled_at=scheduled_at or (timezone.now() + timedelta(days=1)),
            mode=reference["classic"],
            house_deck=reference["original"],
            created_by=created_by,
        )

    return factory
