from __future__ import annotations

from datetime import timedelta

import pytest
from django.utils import timezone

from apps.accounts.models import User
from apps.games.models import GameSession, Outcome, Participation
from apps.games.selectors import (
    get_session_detail,
    list_planned_after,
    list_recent_completed,
    list_sessions,
)
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
        ("martell", "Martell", "#C94E2A", "#F5E6C8"),
        ("tyrell", "Tyrell", "#4B6B3A", "#F0E6D2"),
        ("arryn", "Arryn", "#8AAFC8", "#1A2A3A"),
        ("targaryen", "Targaryen", "#5B2D8A", "#E0D0F0"),
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


def _create_user(*, email: str) -> User:
    return User.objects.create_user(
        username=email,
        email=email,
        password="StrongPassword123!",
        is_active=True,
    )


def _create_session(
    *,
    created_by: User,
    scheduled_at,
    status: str = GameSession.Status.PLANNED,
) -> GameSession:
    reference = _ensure_reference_data()
    return GameSession.objects.create(
        scheduled_at=scheduled_at,
        mode=reference["classic"],
        house_deck=reference["original"],
        created_by=created_by,
        status=status,
    )


@pytest.mark.django_db
def test_list_sessions_filters_by_status_and_user() -> None:
    reference = _ensure_reference_data()
    creator = _create_user(email="creator@example.com")
    player = _create_user(email="player@example.com")
    outsider = _create_user(email="outsider@example.com")
    now = timezone.now()

    matching_session = _create_session(
        created_by=creator,
        scheduled_at=now + timedelta(days=3),
        status=GameSession.Status.PLANNED,
    )
    other_planned_session = _create_session(
        created_by=creator,
        scheduled_at=now + timedelta(days=2),
        status=GameSession.Status.PLANNED,
    )
    completed_session = _create_session(
        created_by=creator,
        scheduled_at=now + timedelta(days=1),
        status=GameSession.Status.COMPLETED,
    )

    Participation.objects.create(
        session=matching_session,
        user=player,
        faction=reference["stark"],
    )
    Participation.objects.create(
        session=other_planned_session,
        user=outsider,
        faction=reference["lannister"],
    )
    Participation.objects.create(
        session=completed_session,
        user=player,
        faction=reference["greyjoy"],
    )

    sessions = list(
        list_sessions(
            status=GameSession.Status.PLANNED,
            user_id=player.pk,
        )
    )

    assert sessions == [matching_session]


@pytest.mark.django_db
def test_list_planned_after_returns_only_future_planned_sessions() -> None:
    creator = _create_user(email="creator@example.com")
    now = timezone.now()
    before_cutoff = _create_session(
        created_by=creator,
        scheduled_at=now + timedelta(hours=1),
        status=GameSession.Status.PLANNED,
    )
    after_cutoff = _create_session(
        created_by=creator,
        scheduled_at=now + timedelta(days=2),
        status=GameSession.Status.PLANNED,
    )
    _create_session(
        created_by=creator,
        scheduled_at=now + timedelta(days=3),
        status=GameSession.Status.CANCELLED,
    )

    sessions = list(list_planned_after(at=now + timedelta(days=1)))

    assert sessions == [after_cutoff]
    assert before_cutoff not in sessions


@pytest.mark.django_db
def test_list_recent_completed_respects_limit_and_ordering() -> None:
    creator = _create_user(email="creator@example.com")
    now = timezone.now()
    oldest = _create_session(
        created_by=creator,
        scheduled_at=now - timedelta(days=4),
        status=GameSession.Status.COMPLETED,
    )
    middle = _create_session(
        created_by=creator,
        scheduled_at=now - timedelta(days=2),
        status=GameSession.Status.COMPLETED,
    )
    newest = _create_session(
        created_by=creator,
        scheduled_at=now - timedelta(days=1),
        status=GameSession.Status.COMPLETED,
    )
    _create_session(
        created_by=creator,
        scheduled_at=now + timedelta(days=1),
        status=GameSession.Status.PLANNED,
    )

    sessions = list(list_recent_completed(limit=2))

    assert sessions == [newest, middle]
    assert oldest not in sessions


@pytest.mark.django_db
def test_get_session_detail_uses_no_more_than_four_queries(django_assert_num_queries) -> None:
    reference = _ensure_reference_data()
    creator = _create_user(email="creator@example.com")
    session = _create_session(
        created_by=creator,
        scheduled_at=timezone.now() + timedelta(days=1),
    )

    faction_slugs = [
        "stark",
        "lannister",
        "greyjoy",
        "baratheon",
        "martell",
        "tyrell",
        "arryn",
        "targaryen",
    ]
    participants: list[Participation] = []

    for index, slug in enumerate(faction_slugs, start=1):
        user = creator if index == 1 else _create_user(email=f"player{index}@example.com")
        participants.append(
            Participation.objects.create(
                session=session,
                user=user,
                faction=reference[slug],
                place=index,
                castles=max(0, 9 - index),
                is_winner=index == 1,
            )
        )

    Outcome.objects.create(
        session=session,
        rounds_played=10,
        end_reason=Outcome.EndReason.CASTLES_7,
        mvp=creator,
        final_note="Great match.",
    )

    with django_assert_num_queries(4, exact=False):
        detailed_session = get_session_detail(session_id=session.pk)
        participations = list(detailed_session.participations.all())
        participant_snapshot = [
            (
                participation.user.profile.nickname,
                participation.faction.slug,
                participation.place,
            )
            for participation in participations
        ]
        outcome = detailed_session.outcome

    assert detailed_session.pk == session.pk
    assert len(participations) == 8
    assert participant_snapshot[0] == ("creator@example.com", "stark", 1)
    assert participant_snapshot[-1] == ("player8@example.com", "targaryen", 8)
    assert outcome.final_note == "Great match."
