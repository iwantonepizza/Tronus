from __future__ import annotations

import pytest

from apps.games.models import GameSession
from apps.ratings.models import MatchVote
from apps.reference.models import Faction, GameMode, HouseDeck
from apps.stats.selectors import player_profile_stats


@pytest.mark.django_db
def test_player_profile_stats_returns_expected_aggregates(player_stats_dataset) -> None:
    target = player_stats_dataset["target"]

    stats = player_profile_stats(user_id=target.pk)

    assert stats["user"].pk == target.pk
    assert stats["total_games"] == 10
    assert stats["wins"] == 5
    assert stats["winrate"] == pytest.approx(0.5)
    assert stats["avg_place"] == pytest.approx(1.8)
    assert stats["avg_castles"] == pytest.approx(5.5)
    assert stats["favorite_faction"] == "stark"
    assert stats["best_faction"] == {"faction": "baratheon", "winrate": 1.0}
    assert stats["worst_faction"] == {"faction": "lannister", "winrate": 0.0}
    assert stats["current_streak"] == {"type": "win", "count": 1}
    assert len(stats["last10"]) == 10
    assert stats["last10"][0]["match_id"] == player_stats_dataset["sessions"][0].pk
    assert stats["last10"][0]["place"] == 1
    assert stats["last10"][0]["faction"] == "stark"
    assert stats["crowns_received"] == 4
    assert stats["shits_received"] == 2


@pytest.mark.django_db
def test_player_profile_stats_returns_nullables_for_user_without_completed_games(make_user) -> None:
    target = make_user(email="fresh@example.com")

    stats = player_profile_stats(user_id=target.pk)

    assert stats["total_games"] == 0
    assert stats["wins"] == 0
    assert stats["winrate"] is None
    assert stats["avg_place"] is None
    assert stats["avg_castles"] is None
    assert stats["favorite_faction"] is None
    assert stats["best_faction"] is None
    assert stats["worst_faction"] is None
    assert stats["current_streak"] == {"type": None, "count": 0}
    assert stats["last10"] == []
    assert stats["crowns_received"] == 0
    assert stats["shits_received"] == 0


@pytest.mark.django_db
def test_player_profile_stats_ignores_cancelled_and_in_progress_sessions(
    player_stats_dataset,
    make_session_with_participations,
) -> None:
    target = player_stats_dataset["target"]
    alpha = target.__class__.objects.get(email="alpha@example.com")
    beta = target.__class__.objects.get(email="beta@example.com")
    stark = Faction.objects.get(slug="stark")
    greyjoy = Faction.objects.get(slug="greyjoy")
    classic = GameMode.objects.get(slug="classic")
    original = HouseDeck.objects.get(slug="original")

    for status, offset, vote_type in (
        (GameSession.Status.CANCELLED, 30, MatchVote.VoteType.CROWN),
        (GameSession.Status.IN_PROGRESS, 31, MatchVote.VoteType.SHIT),
    ):
        session = make_session_with_participations(
            status=status,
            mode=classic,
            house_deck=original,
            created_by=target,
            rows=[
                (target, stark, 1, 7, True),
                (
                    alpha if status == GameSession.Status.CANCELLED else beta,
                    greyjoy,
                    2,
                    5,
                    False,
                ),
            ],
            days_offset=offset,
            planning_note=f"Non-completed stats noise: {status}",
        )
        MatchVote.objects.create(
            session=session,
            from_user=alpha if status == GameSession.Status.CANCELLED else beta,
            to_user=target,
            vote_type=vote_type,
        )

    stats = player_profile_stats(user_id=target.pk)

    assert stats["total_games"] == 10
    assert stats["wins"] == 5
    assert stats["winrate"] == pytest.approx(0.5)
    assert len(stats["last10"]) == 10
    assert stats["crowns_received"] == 4
    assert stats["shits_received"] == 2
