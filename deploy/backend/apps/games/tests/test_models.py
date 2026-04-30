from __future__ import annotations

from datetime import timedelta

import pytest
from django.db import IntegrityError, transaction
from django.utils import timezone

from apps.accounts.models import User
from apps.games.models import GameSession, Outcome, Participation
from apps.reference.models import Faction, GameMode, HouseDeck


def _ensure_reference_data() -> dict[str, object]:
    mode, _ = GameMode.objects.get_or_create(
        slug="classic",
        defaults={
            "name": "Classic",
            "min_players": 3,
            "max_players": 6,
        },
    )
    deck, _ = HouseDeck.objects.get_or_create(
        slug="original",
        defaults={
            "name": "Original",
        },
    )
    stark, _ = Faction.objects.get_or_create(
        slug="stark",
        defaults={
            "name": "Stark",
            "color": "#6B7B8C",
            "on_primary": "#F0F0F0",
            "is_active": True,
        },
    )
    lannister, _ = Faction.objects.get_or_create(
        slug="lannister",
        defaults={
            "name": "Lannister",
            "color": "#9B2226",
            "on_primary": "#F5E6C8",
            "is_active": True,
        },
    )
    return {
        "mode": mode,
        "deck": deck,
        "stark": stark,
        "lannister": lannister,
    }


def _create_user(*, email: str) -> User:
    return User.objects.create_user(
        username=email,
        email=email,
        password="StrongPassword123!",
        is_active=True,
    )


def _create_session(*, created_by: User) -> GameSession:
    reference = _ensure_reference_data()
    return GameSession.objects.create(
        scheduled_at=timezone.now() + timedelta(days=1),
        mode=reference["mode"],
        house_deck=reference["deck"],
        created_by=created_by,
    )


@pytest.mark.django_db
def test_game_session_str_includes_date() -> None:
    user = _create_user(email="creator@example.com")
    session = _create_session(created_by=user)

    assert f"Session #{session.pk}" in str(session)


@pytest.mark.django_db
def test_participation_rejects_duplicate_user_in_session() -> None:
    reference = _ensure_reference_data()
    user = _create_user(email="player@example.com")
    session = _create_session(created_by=user)
    Participation.objects.create(
        session=session,
        user=user,
        faction=reference["stark"],
    )

    with pytest.raises(IntegrityError), transaction.atomic():
        Participation.objects.create(
            session=session,
            user=user,
            faction=reference["lannister"],
        )


@pytest.mark.django_db
def test_participation_rejects_duplicate_faction_in_session() -> None:
    reference = _ensure_reference_data()
    creator = _create_user(email="creator@example.com")
    player = _create_user(email="player@example.com")
    session = _create_session(created_by=creator)
    faction = reference["stark"]
    Participation.objects.create(session=session, user=creator, faction=faction)

    with pytest.raises(IntegrityError), transaction.atomic():
        Participation.objects.create(session=session, user=player, faction=faction)


@pytest.mark.django_db
def test_participation_rejects_duplicate_non_null_place_in_session() -> None:
    reference = _ensure_reference_data()
    creator = _create_user(email="creator@example.com")
    player = _create_user(email="player@example.com")
    session = _create_session(created_by=creator)
    Participation.objects.create(
        session=session,
        user=creator,
        faction=reference["stark"],
        place=1,
    )

    with pytest.raises(IntegrityError), transaction.atomic():
        Participation.objects.create(
            session=session,
            user=player,
            faction=reference["lannister"],
            place=1,
        )


@pytest.mark.django_db
def test_participation_winner_requires_first_place() -> None:
    reference = _ensure_reference_data()
    user = _create_user(email="winner@example.com")
    session = _create_session(created_by=user)

    with pytest.raises(IntegrityError), transaction.atomic():
        Participation.objects.create(
            session=session,
            user=user,
            faction=reference["stark"],
            place=2,
            is_winner=True,
        )


@pytest.mark.django_db
def test_participation_allows_only_one_winner_per_session() -> None:
    reference = _ensure_reference_data()
    creator = _create_user(email="creator@example.com")
    player = _create_user(email="player@example.com")
    session = _create_session(created_by=creator)
    Participation.objects.create(
        session=session,
        user=creator,
        faction=reference["stark"],
        place=1,
        is_winner=True,
    )

    with pytest.raises(IntegrityError), transaction.atomic():
        Participation.objects.create(
            session=session,
            user=player,
            faction=reference["lannister"],
            place=2,
            is_winner=True,
        )


@pytest.mark.django_db
def test_outcome_rounds_played_must_be_positive() -> None:
    user = _create_user(email="creator@example.com")
    session = _create_session(created_by=user)

    with pytest.raises(IntegrityError), transaction.atomic():
        Outcome.objects.create(
            session=session,
            rounds_played=0,
            end_reason=Outcome.EndReason.OTHER,
        )


@pytest.mark.django_db
def test_outcome_uses_session_id_as_primary_key() -> None:
    user = _create_user(email="creator@example.com")
    session = _create_session(created_by=user)
    outcome = Outcome.objects.create(
        session=session,
        rounds_played=10,
        end_reason=Outcome.EndReason.CASTLES_7,
        mvp=user,
    )

    assert outcome.pk == session.pk
