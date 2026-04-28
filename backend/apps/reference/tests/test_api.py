from __future__ import annotations

import pytest

from apps.reference.models import Deck, Faction, GameMode


def _ensure_reference_seed_data() -> None:
    for slug, name, color, on_primary in (
        ("arryn", "Arryn", "#8AAFC8", "#1A2A3A"),
        ("baratheon", "Baratheon", "#F0B323", "#1A1A22"),
        ("greyjoy", "Greyjoy", "#1C3B47", "#E0E6E8"),
        ("lannister", "Lannister", "#9B2226", "#F5E6C8"),
        ("martell", "Martell", "#C94E2A", "#F5E6C8"),
        ("stark", "Stark", "#6B7B8C", "#F0F0F0"),
        ("targaryen", "Targaryen", "#5B2D8A", "#E0D0F0"),
        ("tyrell", "Tyrell", "#4B6B3A", "#F0E6D2"),
    ):
        Faction.objects.get_or_create(
            slug=slug,
            defaults={
                "name": name,
                "color": color,
                "on_primary": on_primary,
                "is_active": True,
            },
        )

    for slug, name, min_players, max_players in (
        ("alternative", "Alternative", 4, 4),
        ("classic", "Classic", 3, 6),
        ("dragons", "Dragons", 4, 8),
        ("quests", "Quests", 4, 4),
    ):
        GameMode.objects.get_or_create(
            slug=slug,
            defaults={
                "name": name,
                "min_players": min_players,
                "max_players": max_players,
            },
        )

    for slug, name in (
        ("expansion_a", "Expansion A"),
        ("expansion_b", "Expansion B"),
        ("original", "Original"),
    ):
        Deck.objects.get_or_create(slug=slug, defaults={"name": name})


@pytest.mark.django_db
def test_faction_list_returns_only_active_factions(api_client) -> None:
    _ensure_reference_seed_data()
    Faction.objects.create(
        slug="hidden-house",
        name="Скрытый дом",
        color="#123456",
        on_primary="#FFFFFF",
        is_active=False,
    )

    response = api_client.get("/api/v1/reference/factions/")

    assert response.status_code == 200
    assert response.json()[0]["slug"] == "arryn"
    assert response.json()[0]["on_primary"] == "#1A2A3A"
    assert {item["slug"] for item in response.json()} == {
        "arryn",
        "baratheon",
        "greyjoy",
        "lannister",
        "martell",
        "stark",
        "targaryen",
        "tyrell",
    }


@pytest.mark.django_db
def test_game_mode_list_returns_seeded_modes(api_client) -> None:
    _ensure_reference_seed_data()
    response = api_client.get("/api/v1/reference/modes/")

    assert response.status_code == 200
    assert {item["slug"] for item in response.json()} == {
        "alternative",
        "classic",
        "dragons",
        "quests",
    }
    assert response.json()[0]["slug"] == "classic"


@pytest.mark.django_db
def test_deck_list_returns_seeded_decks(api_client) -> None:
    _ensure_reference_seed_data()
    response = api_client.get("/api/v1/reference/decks/")

    assert response.status_code == 200
    assert {item["slug"] for item in response.json()} == {
        "expansion_a",
        "expansion_b",
        "original",
    }
    assert response.json()[0]["slug"] == "expansion_a"


@pytest.mark.django_db
def test_reference_endpoints_are_read_only(api_client, authenticated_client) -> None:
    anonymous_response = api_client.post(
        "/api/v1/reference/factions/",
        {"slug": "new-house"},
        format="json",
    )
    authenticated_response = authenticated_client.post(
        "/api/v1/reference/factions/",
        {"slug": "new-house"},
        format="json",
    )

    assert anonymous_response.status_code == 403
    assert authenticated_response.status_code == 405
    assert Faction.objects.filter(slug="new-house").exists() is False
    assert GameMode.objects.filter(slug="new-mode").exists() is False
    assert Deck.objects.filter(slug="new-deck").exists() is False
