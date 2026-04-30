from __future__ import annotations

import pytest


@pytest.mark.django_db
def test_head_to_head_endpoint_is_public(api_client, head_to_head_dataset) -> None:
    alpha = head_to_head_dataset["alpha"]
    beta = head_to_head_dataset["beta"]

    response = api_client.get(
        f"/api/v1/stats/head-to-head/?user_a={alpha.pk}&user_b={beta.pk}"
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["user_a"]["id"] == alpha.pk
    assert payload["user_b"]["id"] == beta.pk
    assert payload["games_together"] == 3
    assert payload["wins"] == {"user_a": 2, "user_b": 1}
    assert payload["favorite_factions"] == {"user_a": "stark", "user_b": "greyjoy"}
    assert len(payload["matches"]) == 3


@pytest.mark.django_db
def test_head_to_head_endpoint_validates_query_params(api_client, head_to_head_dataset) -> None:
    alpha = head_to_head_dataset["alpha"]

    invalid_response = api_client.get(
        f"/api/v1/stats/head-to-head/?user_a={alpha.pk}&user_b={alpha.pk}"
    )
    missing_response = api_client.get("/api/v1/stats/head-to-head/?user_a=999&user_b=1000")

    assert invalid_response.status_code == 400
    assert invalid_response.json()["error"]["code"] == "validation_error"
    assert "user_b" in invalid_response.json()["error"]["details"]

    assert missing_response.status_code == 404
    assert missing_response.json()["error"]["code"] == "not_found"
