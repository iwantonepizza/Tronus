from __future__ import annotations

import pytest

from apps.reference.models import Faction


@pytest.mark.django_db
def test_faction_stats_list_endpoint_is_public(api_client, faction_stats_dataset) -> None:
    response = api_client.get("/api/v1/stats/factions/")

    assert response.status_code == 200
    payload = response.json()
    stark = next(item for item in payload if item["faction"]["slug"] == "stark")
    assert stark["total_games"] == 6
    assert stark["wins"] == 3
    assert stark["by_mode"][0]["mode"] == "classic"


@pytest.mark.django_db
def test_faction_stats_detail_endpoint_is_public(api_client, faction_stats_dataset) -> None:
    response = api_client.get("/api/v1/stats/factions/stark/")

    assert response.status_code == 200
    payload = response.json()
    assert payload["faction"]["slug"] == "stark"
    assert payload["total_games"] == 6
    assert payload["top_players"][0]["games"] == 3


@pytest.mark.django_db
def test_faction_stats_detail_returns_404_for_unknown_or_inactive_faction(
    api_client,
    faction_stats_dataset,
) -> None:
    inactive_faction = Faction.objects.create(
        slug="tully",
        name="Tully",
        color="#4B6FA5",
        on_primary="#F0F0F0",
        is_active=False,
    )

    missing_response = api_client.get("/api/v1/stats/factions/unknown/")
    inactive_response = api_client.get(f"/api/v1/stats/factions/{inactive_faction.slug}/")

    assert missing_response.status_code == 404
    assert missing_response.json()["error"]["code"] == "not_found"
    assert inactive_response.status_code == 404
    assert inactive_response.json()["error"]["code"] == "not_found"
