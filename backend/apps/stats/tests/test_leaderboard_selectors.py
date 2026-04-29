from __future__ import annotations

import pytest

from apps.games.models import GameSession
from apps.ratings.models import MatchVote
from apps.reference.models import Faction, GameMode, HouseDeck
from apps.stats.selectors import leaderboard_stats


@pytest.mark.django_db
def test_leaderboard_stats_returns_expected_wins_order(player_stats_dataset) -> None:
    stats = leaderboard_stats(metric="wins", limit=3)

    assert stats["metric"] == "wins"
    assert stats["label"] == "Wins"
    assert [row["rank"] for row in stats["results"]] == [1, 2, 3]
    assert [row["user"].email for row in stats["results"]] == [
        "target@example.com",
        "beta@example.com",
        "gamma@example.com",
    ]
    assert [row["metric_value"] for row in stats["results"]] == [5, 3, 2]
    assert [row["games"] for row in stats["results"]] == [10, 3, 3]


@pytest.mark.django_db
def test_leaderboard_stats_sorts_avg_place_ascending(player_stats_dataset) -> None:
    stats = leaderboard_stats(metric="avg_place", limit=4)

    assert [row["user"].email for row in stats["results"]] == [
        "beta@example.com",
        "gamma@example.com",
        "target@example.com",
        "alpha@example.com",
    ]
    assert [row["metric_value"] for row in stats["results"]] == [1.0, 1.333, 1.8, 2.0]


@pytest.mark.django_db
def test_leaderboard_stats_ignores_non_completed_sessions(
    player_stats_dataset,
    make_session_with_participations,
) -> None:
    target = player_stats_dataset["target"]
    alpha = target.__class__.objects.get(email="alpha@example.com")
    classic = GameMode.objects.get(slug="classic")
    original = HouseDeck.objects.get(slug="original")
    stark = Faction.objects.get(slug="stark")
    greyjoy = Faction.objects.get(slug="greyjoy")

    for status, offset in (
        (GameSession.Status.CANCELLED, 20),
        (GameSession.Status.IN_PROGRESS, 21),
    ):
        session = make_session_with_participations(
            status=status,
            mode=classic,
            house_deck=original,
            created_by=target,
            rows=[
                (alpha, stark, 1, 7, True),
                (target, greyjoy, 2, 5, False),
            ],
            days_offset=offset,
            planning_note=f"Leaderboard noise: {status}",
        )
        MatchVote.objects.create(
            session=session,
            from_user=target,
            to_user=alpha,
            vote_type=MatchVote.VoteType.CROWN,
        )

    stats = leaderboard_stats(metric="wins", limit=3)

    assert [row["user"].email for row in stats["results"]] == [
        "target@example.com",
        "beta@example.com",
        "gamma@example.com",
    ]
    assert [row["metric_value"] for row in stats["results"]] == [5, 3, 2]
