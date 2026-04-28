from __future__ import annotations

import pytest

from apps.stats.selectors import overview_stats


@pytest.mark.django_db
def test_overview_stats_returns_expected_payload(overview_stats_dataset) -> None:
    stats = overview_stats()

    assert stats["next_match"].pk == overview_stats_dataset["planned_session"].pk
    assert len(stats["recent_matches"]) == 4
    assert stats["total_matches"] == 5
    assert stats["active_players"] == 3
    assert stats["most_popular_faction"]["faction"].slug == "stark"
    assert stats["most_popular_faction"]["games"] == 4
    assert stats["current_leader"]["user"].pk == overview_stats_dataset["alpha"].pk
    assert stats["current_leader"]["wins"] == 2
    assert stats["faction_winrates"][0]["faction"].slug == "greyjoy"
    assert stats["top_winrate"][0]["user"].pk == overview_stats_dataset["alpha"].pk
    assert len(stats["fun_facts"]) == 3
    assert [item["icon"] for item in stats["fun_facts"]] == ["Crown", "Zap", "Flame"]
