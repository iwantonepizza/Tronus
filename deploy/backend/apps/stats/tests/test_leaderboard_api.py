from __future__ import annotations

import pytest


@pytest.mark.django_db
def test_leaderboard_endpoint_is_public_and_uses_metric_query(
    api_client,
    player_stats_dataset,
) -> None:
    response = api_client.get("/api/v1/stats/leaderboard/?metric=crowns&limit=2")

    assert response.status_code == 200
    payload = response.json()
    assert payload["metric"] == "crowns"
    assert payload["label"] == "Crowns"
    assert len(payload["results"]) == 2
    assert payload["results"][0]["rank"] == 1
    assert payload["results"][0]["user"]["id"] == player_stats_dataset["target"].pk
    assert payload["results"][0]["metric_value"] == 4
    assert payload["results"][0]["games"] == 10


@pytest.mark.django_db
def test_leaderboard_endpoint_returns_validation_error_for_unknown_metric(
    api_client,
) -> None:
    response = api_client.get("/api/v1/stats/leaderboard/?metric=elo")

    assert response.status_code == 400
    payload = response.json()
    assert payload["error"]["code"] == "validation_error"
    assert "metric" in payload["error"]["details"]
