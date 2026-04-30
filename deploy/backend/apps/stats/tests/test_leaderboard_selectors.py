from __future__ import annotations

import pytest

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
