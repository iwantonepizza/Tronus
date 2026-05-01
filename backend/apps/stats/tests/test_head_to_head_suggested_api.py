from __future__ import annotations

import pytest

from apps.games.models import GameSession

from .conftest import _ensure_reference_data


@pytest.mark.django_db
def test_head_to_head_suggested_endpoint_is_public(
    api_client,
    head_to_head_dataset,
) -> None:
    alpha = head_to_head_dataset["alpha"]
    beta = head_to_head_dataset["beta"]

    response = api_client.get(f"/api/v1/stats/head-to-head/suggested/?for_user={alpha.pk}")

    assert response.status_code == 200
    assert response.json() == {"interesting_opponent_id": beta.pk}


@pytest.mark.django_db
def test_head_to_head_suggested_endpoint_falls_back_to_leaderboard(
    api_client,
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

    response = api_client.get(f"/api/v1/stats/head-to-head/suggested/?for_user={target.pk}")

    assert response.status_code == 200
    assert response.json() == {"interesting_opponent_id": leader.pk}


@pytest.mark.django_db
def test_head_to_head_suggested_endpoint_validates_target_user(api_client) -> None:
    response = api_client.get("/api/v1/stats/head-to-head/suggested/?for_user=999")

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_found"
