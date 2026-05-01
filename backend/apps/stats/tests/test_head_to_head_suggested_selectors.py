from __future__ import annotations

import pytest

from apps.games.models import GameSession
from apps.stats.selectors import suggest_h2h_opponent

from .conftest import _ensure_reference_data


@pytest.mark.django_db
def test_suggest_h2h_opponent_prefers_most_common_completed_opponent(
    head_to_head_dataset,
) -> None:
    alpha = head_to_head_dataset["alpha"]
    beta = head_to_head_dataset["beta"]

    suggested_user_id = suggest_h2h_opponent(for_user_id=alpha.pk)

    assert suggested_user_id == beta.pk


@pytest.mark.django_db
def test_suggest_h2h_opponent_falls_back_to_leaderboard_when_no_common_games(
    make_user,
    make_session_with_participations,
) -> None:
    reference = _ensure_reference_data()
    target = make_user(email="target@example.com")
    leader = make_user(email="leader@example.com")
    runner = make_user(email="runner@example.com")

    make_session_with_participations(
        status=GameSession.Status.COMPLETED,
        mode=reference["classic"],
        house_deck=reference["original"],
        created_by=leader,
        rows=[
            (leader, reference["stark"], 1, 7, True),
            (runner, reference["lannister"], 2, 5, False),
        ],
        days_offset=1,
        planning_note="Leaderboard fallback session",
    )

    suggested_user_id = suggest_h2h_opponent(for_user_id=target.pk)

    assert suggested_user_id == leader.pk
