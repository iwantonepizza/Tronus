from __future__ import annotations

from datetime import timedelta

import pytest
from django.utils import timezone

from apps.accounts.models import User
from apps.comments.models import MatchComment
from apps.games.models import GameSession, Outcome, Participation
from apps.ratings.models import MatchVote
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
    feast_for_crows, _ = GameMode.objects.get_or_create(
        slug="feast_for_crows",
        defaults={
            "name": "Feast for Crows",
            "min_players": 4,
            "max_players": 4,
        },
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
        "feast_for_crows": feast_for_crows,
        "original": original,
        **factions,
    }


@pytest.fixture
def make_user():
    def factory(*, email: str, is_active: bool = True) -> User:
        return User.objects.create_user(
            username=email,
            email=email,
            password="StrongPassword123!",
            is_active=is_active,
        )

    return factory


@pytest.fixture
def player_stats_dataset(make_user):
    reference = _ensure_reference_data()
    target = make_user(email="target@example.com")
    alpha = make_user(email="alpha@example.com")
    beta = make_user(email="beta@example.com")
    gamma = make_user(email="gamma@example.com")

    session_specs = [
        ("stark", 1, 7, True, alpha, MatchVote.VoteType.CROWN),
        ("lannister", 2, 5, False, beta, MatchVote.VoteType.SHIT),
        ("stark", 1, 7, True, gamma, MatchVote.VoteType.CROWN),
        ("greyjoy", 1, 6, True, alpha, MatchVote.VoteType.CROWN),
        ("stark", 3, 4, False, beta, None),
        ("lannister", 2, 5, False, gamma, MatchVote.VoteType.SHIT),
        ("stark", 1, 7, True, alpha, MatchVote.VoteType.CROWN),
        ("stark", 2, 5, False, beta, None),
        ("greyjoy", 4, 2, False, gamma, None),
        ("baratheon", 1, 7, True, alpha, None),
    ]

    sessions: list[GameSession] = []
    for index, (faction_slug, place, castles, is_winner, opponent, vote_type) in enumerate(
        session_specs,
        start=1,
    ):
        scheduled_at = timezone.now() - timedelta(days=index)
        session = GameSession.objects.create(
            scheduled_at=scheduled_at,
            mode=reference["classic"],
            house_deck=reference["original"],
            created_by=target,
            status=GameSession.Status.COMPLETED,
            planning_note=f"Completed session #{index}",
        )
        Participation.objects.create(
            session=session,
            user=target,
            faction=reference[faction_slug],
            place=place,
            castles=castles,
            is_winner=is_winner,
        )
        Participation.objects.create(
            session=session,
            user=opponent,
            faction=reference["baratheon" if faction_slug != "baratheon" else "stark"],
            place=2 if is_winner else 1,
            castles=5 if is_winner else 7,
            is_winner=not is_winner,
        )
        Outcome.objects.create(
            session=session,
            rounds_played=8 + (index % 3),
            end_reason=Outcome.EndReason.CASTLES_7,
            mvp=target if is_winner else opponent,
            final_note=f"Outcome #{index}",
        )
        if vote_type is not None:
            MatchVote.objects.create(
                session=session,
                from_user=opponent,
                to_user=target,
                vote_type=vote_type,
            )
        sessions.append(session)

    return {
        "target": target,
        "sessions": sessions,
    }


@pytest.fixture
def faction_stats_dataset(make_user):
    reference = _ensure_reference_data()
    alpha = make_user(email="alpha@example.com")
    beta = make_user(email="beta@example.com")
    gamma = make_user(email="gamma@example.com")

    session_specs = [
        (
            "classic",
            [
                (alpha, "stark", 1, 7),
                (beta, "lannister", 2, 5),
                (gamma, "baratheon", 3, 4),
            ],
        ),
        (
            "feast_for_crows",
            [
                (alpha, "stark", 2, 5),
                (beta, "greyjoy", 1, 7),
                (gamma, "lannister", 3, 3),
            ],
        ),
        (
            "classic",
            [
                (alpha, "lannister", 1, 7),
                (beta, "stark", 2, 6),
                (gamma, "baratheon", 3, 4),
            ],
        ),
        (
            "feast_for_crows",
            [
                (alpha, "baratheon", 1, 7),
                (beta, "greyjoy", 2, 5),
                (gamma, "stark", 3, 3),
            ],
        ),
        ("classic", [(alpha, "stark", 1, 7), (beta, "baratheon", 2, 5)]),
        ("feast_for_crows", [(beta, "stark", 1, 7), (alpha, "greyjoy", 2, 5)]),
    ]

    sessions: list[GameSession] = []
    for index, (mode_slug, rows) in enumerate(session_specs, start=1):
        session = GameSession.objects.create(
            scheduled_at=timezone.now() - timedelta(days=index),
            mode=reference[mode_slug],
            house_deck=reference["original"],
            created_by=alpha,
            status=GameSession.Status.COMPLETED,
            planning_note=f"Faction stats session #{index}",
        )
        winner_user = next(user for user, _, place, _ in rows if place == 1)
        for user, faction_slug, place, castles in rows:
            Participation.objects.create(
                session=session,
                user=user,
                faction=reference[faction_slug],
                place=place,
                castles=castles,
                is_winner=place == 1,
            )
        Outcome.objects.create(
            session=session,
            rounds_played=7 + index,
            end_reason=Outcome.EndReason.CASTLES_7,
            mvp=winner_user,
            final_note=f"Faction outcome #{index}",
        )
        sessions.append(session)

    return {
        "alpha": alpha,
        "beta": beta,
        "gamma": gamma,
        "sessions": sessions,
        **reference,
    }


@pytest.fixture
def overview_stats_dataset(make_user):
    reference = _ensure_reference_data()
    alpha = make_user(email="alpha@example.com")
    beta = make_user(email="beta@example.com")
    gamma = make_user(email="gamma@example.com")

    completed_specs = [
        (
            "classic",
            [
                (alpha, "stark", 1, 7),
                (beta, "lannister", 2, 5),
                (gamma, "baratheon", 3, 4),
            ],
            11,
            "Longest table of the month.",
        ),
        (
            "feast_for_crows",
            [
                (beta, "greyjoy", 1, 7),
                (alpha, "stark", 2, 5),
            ],
            8,
            "Fast swing after the midgame.",
        ),
        (
            "classic",
            [
                (alpha, "stark", 1, 7),
                (gamma, "lannister", 2, 5),
            ],
            9,
            "Alpha closed the board again.",
        ),
        (
            "feast_for_crows",
            [
                (gamma, "baratheon", 1, 7),
                (beta, "stark", 2, 5),
            ],
            7,
            "Gamma stole the finish.",
        ),
    ]

    completed_sessions: list[GameSession] = []
    for index, (mode_slug, rows, rounds_played, final_note) in enumerate(
        completed_specs,
        start=1,
    ):
        session = GameSession.objects.create(
            scheduled_at=timezone.now() - timedelta(days=index),
            mode=reference[mode_slug],
            house_deck=reference["original"],
            created_by=alpha,
            status=GameSession.Status.COMPLETED,
            planning_note=f"Overview completed #{index}",
        )
        winner_user = next(user for user, _, place, _ in rows if place == 1)
        for user, faction_slug, place, castles in rows:
            Participation.objects.create(
                session=session,
                user=user,
                faction=reference[faction_slug],
                place=place,
                castles=castles,
                is_winner=place == 1,
            )
        Outcome.objects.create(
            session=session,
            rounds_played=rounds_played,
            end_reason=Outcome.EndReason.CASTLES_7,
            mvp=winner_user,
            final_note=final_note,
        )
        completed_sessions.append(session)

    MatchComment.objects.create(
        session=completed_sessions[0],
        author=beta,
        body="Need a rematch.",
    )

    planned_session = GameSession.objects.create(
        scheduled_at=timezone.now() + timedelta(days=1),
        mode=reference["classic"],
        house_deck=reference["original"],
        created_by=alpha,
        status=GameSession.Status.PLANNED,
        planning_note="Next planned overview session.",
    )
    Participation.objects.create(
        session=planned_session,
        user=alpha,
        faction=reference["stark"],
    )
    Participation.objects.create(
        session=planned_session,
        user=beta,
        faction=reference["greyjoy"],
    )

    return {
        "alpha": alpha,
        "beta": beta,
        "gamma": gamma,
        "planned_session": planned_session,
        "completed_sessions": completed_sessions,
        **reference,
    }


@pytest.fixture
def head_to_head_dataset(make_user):
    reference = _ensure_reference_data()
    alpha = make_user(email="alpha@example.com")
    beta = make_user(email="beta@example.com")
    gamma = make_user(email="gamma@example.com")

    session_specs = [
        [
            (alpha, "stark", 1, 7),
            (beta, "lannister", 2, 5),
        ],
        [
            (beta, "greyjoy", 1, 7),
            (alpha, "stark", 2, 5),
        ],
        [
            (alpha, "stark", 1, 7),
            (gamma, "baratheon", 2, 5),
            (beta, "greyjoy", 3, 4),
        ],
        [
            (gamma, "lannister", 1, 7),
            (beta, "greyjoy", 2, 5),
        ],
    ]

    common_sessions: list[GameSession] = []
    for index, rows in enumerate(session_specs, start=1):
        session = GameSession.objects.create(
            scheduled_at=timezone.now() - timedelta(days=index),
            mode=reference["classic"],
            house_deck=reference["original"],
            created_by=alpha,
            status=GameSession.Status.COMPLETED,
            planning_note=f"Head to head session #{index}",
        )
        winner_user = next(user for user, _, place, _ in rows if place == 1)
        for user, faction_slug, place, castles in rows:
            Participation.objects.create(
                session=session,
                user=user,
                faction=reference[faction_slug],
                place=place,
                castles=castles,
                is_winner=place == 1,
            )
        Outcome.objects.create(
            session=session,
            rounds_played=6 + index,
            end_reason=Outcome.EndReason.CASTLES_7,
            mvp=winner_user,
            final_note=f"Head to head outcome #{index}",
        )
        if {alpha.pk, beta.pk}.issubset({user.pk for user, _, _, _ in rows}):
            common_sessions.append(session)

    return {
        "alpha": alpha,
        "beta": beta,
        "gamma": gamma,
        "common_sessions": common_sessions,
        **reference,
    }
