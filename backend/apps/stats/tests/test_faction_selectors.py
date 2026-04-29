from __future__ import annotations

import pytest

from apps.games.models import GameSession
from apps.stats.selectors import faction_stats, list_faction_stats


@pytest.mark.django_db
def test_faction_stats_returns_expected_aggregates(faction_stats_dataset) -> None:
    stats = faction_stats(faction_slug="stark")

    assert stats["faction"].slug == "stark"
    assert stats["total_games"] == 6
    assert stats["wins"] == 3
    assert stats["winrate"] == pytest.approx(0.5)
    assert stats["avg_place"] == pytest.approx(1.667, rel=1e-3)
    assert stats["avg_castles"] == pytest.approx(5.833, rel=1e-3)
    assert stats["by_mode"] == [
        {"mode": "classic", "games": 3, "winrate": pytest.approx(0.667, rel=1e-3)},
        {
            "mode": "feast_for_crows",
            "games": 3,
            "winrate": pytest.approx(0.333, rel=1e-3),
        },
    ]
    assert [row["user"].profile.nickname for row in stats["top_players"]] == [
        "alpha@example.com",
        "beta@example.com",
        "gamma@example.com",
    ]
    assert stats["top_players"][0]["games"] == 3
    assert stats["top_players"][0]["winrate"] == pytest.approx(0.667, rel=1e-3)


@pytest.mark.django_db
def test_list_faction_stats_includes_all_active_factions(faction_stats_dataset) -> None:
    stats = list_faction_stats()

    by_slug = {item["faction"].slug: item for item in stats}

    assert {"baratheon", "greyjoy", "lannister", "stark"}.issubset(set(by_slug))
    assert by_slug["lannister"]["total_games"] == 3
    assert by_slug["greyjoy"]["wins"] == 1
    assert by_slug["arryn"]["total_games"] == 0


@pytest.mark.django_db
def test_faction_stats_ignores_non_completed_sessions(
    faction_stats_dataset,
    make_session_with_participations,
) -> None:
    alpha = faction_stats_dataset["alpha"]
    beta = faction_stats_dataset["beta"]

    for status, offset in (
        (GameSession.Status.CANCELLED, 20),
        (GameSession.Status.IN_PROGRESS, 21),
    ):
        make_session_with_participations(
            status=status,
            mode=faction_stats_dataset["classic"],
            house_deck=faction_stats_dataset["original"],
            created_by=alpha,
            rows=[
                (alpha, faction_stats_dataset["stark"], 1, 7, True),
                (beta, faction_stats_dataset["lannister"], 2, 5, False),
            ],
            days_offset=offset,
            planning_note=f"Faction stats noise: {status}",
        )

    stats = faction_stats(faction_slug="stark")

    assert stats["total_games"] == 6
    assert stats["wins"] == 3
    assert stats["winrate"] == pytest.approx(0.5)
