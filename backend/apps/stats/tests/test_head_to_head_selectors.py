from __future__ import annotations

import pytest

from apps.games.models import GameSession
from apps.stats.selectors import head_to_head_stats


@pytest.mark.django_db
def test_head_to_head_stats_returns_expected_aggregate(head_to_head_dataset) -> None:
    alpha = head_to_head_dataset["alpha"]
    beta = head_to_head_dataset["beta"]

    stats = head_to_head_stats(user_a_id=alpha.pk, user_b_id=beta.pk)

    assert stats["user_a"].pk == alpha.pk
    assert stats["user_b"].pk == beta.pk
    assert stats["games_together"] == 3
    assert stats["wins"] == {"user_a": 2, "user_b": 1}
    assert stats["higher_place"] == {"user_a": 2, "user_b": 1}
    assert stats["favorite_factions"] == {"user_a": "stark", "user_b": "greyjoy"}
    assert len(stats["matches"]) == 3
    assert stats["matches"][0]["user_a"]["faction"] == "stark"
    assert stats["matches"][0]["user_b"]["faction"] == "lannister"


@pytest.mark.django_db
def test_head_to_head_stats_ignores_non_completed_sessions(
    head_to_head_dataset,
    make_session_with_participations,
) -> None:
    alpha = head_to_head_dataset["alpha"]
    beta = head_to_head_dataset["beta"]

    for status, offset in (
        (GameSession.Status.CANCELLED, 20),
        (GameSession.Status.IN_PROGRESS, 21),
    ):
        make_session_with_participations(
            status=status,
            mode=head_to_head_dataset["classic"],
            house_deck=head_to_head_dataset["original"],
            created_by=alpha,
            rows=[
                (alpha, head_to_head_dataset["stark"], 2, 5, False),
                (beta, head_to_head_dataset["greyjoy"], 1, 7, True),
            ],
            days_offset=offset,
            planning_note=f"Head-to-head noise: {status}",
        )

    stats = head_to_head_stats(user_a_id=alpha.pk, user_b_id=beta.pk)

    assert stats["games_together"] == 3
    assert stats["wins"] == {"user_a": 2, "user_b": 1}
    assert stats["higher_place"] == {"user_a": 2, "user_b": 1}
