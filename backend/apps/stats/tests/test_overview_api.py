from __future__ import annotations

import pytest


@pytest.mark.django_db
def test_overview_stats_endpoint_is_public(api_client, overview_stats_dataset) -> None:
    response = api_client.get("/api/v1/stats/overview/")

    assert response.status_code == 200
    payload = response.json()
    assert payload["next_match"]["id"] == overview_stats_dataset["planned_session"].pk
    assert len(payload["recent_matches"]) == 4
    assert payload["total_matches"] == 4
    assert payload["active_players"] == 3
    assert payload["most_popular_faction"]["faction"]["slug"] == "stark"
    assert payload["current_leader"]["user"]["id"] == overview_stats_dataset["alpha"].pk
    assert payload["faction_winrates"][0]["faction"]["slug"] == "greyjoy"
    assert payload["top_winrate"][0]["user"]["id"] == overview_stats_dataset["alpha"].pk
    assert payload["fun_facts"][0]["icon"] == "Crown"
