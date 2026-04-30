from __future__ import annotations

import pytest

from apps.reference.models import Faction, GameMode, HouseDeck


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

    for slug, name, min_players, max_players, max_rounds, deck_count, required in (
        ("classic", "Classic", 3, 6, 10, 3, []),
        ("dance_with_dragons", "Dance with Dragons", 6, 6, 10, 3, []),
        ("feast_for_crows", "Feast for Crows", 4, 4, 7, 3, []),
        ("mother_of_dragons", "Mother of Dragons", 4, 8, 10, 4, ["targaryen"]),
    ):
        GameMode.objects.get_or_create(
            slug=slug,
            defaults={
                "name": name,
                "min_players": min_players,
                "max_players": max_players,
                "max_rounds": max_rounds,
                "westeros_deck_count": deck_count,
                "required_factions": required,
            },
        )

    for slug, name in (
        ("alternative", "Alternative"),
        ("original", "Original"),
    ):
        HouseDeck.objects.get_or_create(slug=slug, defaults={"name": name})


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
        "classic",
        "dance_with_dragons",
        "feast_for_crows",
        "mother_of_dragons",
    }
    assert response.json()[0]["slug"] == "classic"
    by_slug = {item["slug"]: item for item in response.json()}
    assert by_slug["feast_for_crows"]["max_rounds"] == 7
    assert by_slug["mother_of_dragons"]["required_factions"] == ["targaryen"]


@pytest.mark.django_db
def test_deck_list_returns_seeded_house_decks(api_client) -> None:
    _ensure_reference_seed_data()
    response = api_client.get("/api/v1/reference/decks/")

    assert response.status_code == 200
    assert {item["slug"] for item in response.json()} == {"alternative", "original"}
    assert response.json()[0]["slug"] == "alternative"


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
    assert HouseDeck.objects.filter(slug="new-deck").exists() is False
