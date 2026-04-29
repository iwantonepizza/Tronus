from __future__ import annotations

from datetime import timedelta

import pytest
from django.utils import timezone

from apps.accounts.models import User
from apps.games.models import GameSession, Outcome, Participation
from apps.reference.models import Faction, GameMode, HouseDeck


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
    factions: dict[str, Faction] = {}
    for slug, name, color, on_primary in (
        ("stark", "Stark", "#6B7B8C", "#F0F0F0"),
        ("lannister", "Lannister", "#9B2226", "#F5E6C8"),
        ("greyjoy", "Greyjoy", "#1C3B47", "#E0E6E8"),
        ("baratheon", "Baratheon", "#F0B323", "#1A1A22"),
    ):
        faction, _ = Faction.objects.get_or_create(
            slug=slug,
            defaults={
                "name": name,
                "color": color,
                "on_primary": on_primary,
                "is_active": True,
            },
        )
        factions[slug] = faction

    return {
        "classic": classic,
        "original": original,
        **factions,
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
def make_completed_session():
    def factory(*, created_by: User) -> dict[str, object]:
        reference = _ensure_reference_data()
        session = GameSession.objects.create(
            scheduled_at=timezone.now() - timedelta(days=1),
            mode=reference["classic"],
            house_deck=reference["original"],
            created_by=created_by,
            status=GameSession.Status.COMPLETED,
        )
        outcome = Outcome.objects.create(
            session=session,
            rounds_played=10,
            end_reason=Outcome.EndReason.CASTLES_7,
            mvp=created_by,
            final_note="Finished match.",
        )
        return {
            "session": session,
            "outcome": outcome,
            **reference,
        }

    return factory


@pytest.fixture
def add_participation():
    def factory(*, session: GameSession, user: User, faction: Faction) -> Participation:
        return Participation.objects.create(
            session=session,
            user=user,
            faction=faction,
        )

    return factory
