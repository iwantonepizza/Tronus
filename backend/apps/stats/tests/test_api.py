from __future__ import annotations

import pytest


@pytest.mark.django_db
def test_player_stats_endpoint_is_public(api_client, player_stats_dataset) -> None:
    target = player_stats_dataset["target"]

    response = api_client.get(f"/api/v1/stats/players/{target.pk}/")

    assert response.status_code == 200
    payload = response.json()
    assert payload["user"]["id"] == target.pk
    assert payload["total_games"] == 10
    assert payload["wins"] == 5
    assert payload["favorite_faction"] == "stark"
    assert payload["current_streak"] == {"type": "win", "count": 1}
    assert payload["crowns_received"] == 4
    assert payload["shits_received"] == 2


@pytest.mark.django_db
def test_player_stats_endpoint_returns_404_for_unknown_or_inactive_user(
    api_client,
    make_user,
) -> None:
    inactive_user = make_user(email="inactive@example.com", is_active=False)

    missing_response = api_client.get("/api/v1/stats/players/999999/")
    inactive_response = api_client.get(f"/api/v1/stats/players/{inactive_user.pk}/")

    assert missing_response.status_code == 404
    assert missing_response.json()["error"]["code"] == "not_found"
    assert inactive_response.status_code == 404
    assert inactive_response.json()["error"]["code"] == "not_found"
