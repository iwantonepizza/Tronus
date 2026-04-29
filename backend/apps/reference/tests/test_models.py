from __future__ import annotations

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError

from apps.reference.models import Faction, GameMode, HouseDeck

EXPECTED_FACTION_SLUGS = {
    "arryn",
    "baratheon",
    "greyjoy",
    "lannister",
    "martell",
    "stark",
    "targaryen",
    "tyrell",
}
EXPECTED_GAME_MODE_SLUGS = {
    "classic",
    "dance_with_dragons",
    "feast_for_crows",
    "mother_of_dragons",
}
EXPECTED_DECK_SLUGS = {"alternative", "original"}
EXPECTED_FACTION_COLORS = {
    "arryn": ("#8AAFC8", "#1A2A3A"),
    "baratheon": ("#F0B323", "#1A1A22"),
    "greyjoy": ("#1C3B47", "#E0E6E8"),
    "lannister": ("#9B2226", "#F5E6C8"),
    "martell": ("#C94E2A", "#F5E6C8"),
    "stark": ("#6B7B8C", "#F0F0F0"),
    "targaryen": ("#5B2D8A", "#E0D0F0"),
    "tyrell": ("#4B6B3A", "#F0E6D2"),
}


def _ensure_reference_seed_data() -> None:
    for slug, name in (
        ("arryn", "Arryn"),
        ("baratheon", "Baratheon"),
        ("greyjoy", "Greyjoy"),
        ("lannister", "Lannister"),
        ("martell", "Martell"),
        ("stark", "Stark"),
        ("targaryen", "Targaryen"),
        ("tyrell", "Tyrell"),
    ):
        color, on_primary = EXPECTED_FACTION_COLORS[slug]
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
def test_faction_str_returns_name() -> None:
    faction = Faction.objects.create(
        slug="custom-stark",
        name="Старки",
        color="#FFFFFF",
        on_primary="#000000",
    )

    assert str(faction) == "Старки"


@pytest.mark.django_db
def test_house_deck_str_returns_name() -> None:
    deck = HouseDeck.objects.create(
        slug="custom-original",
        name="Оригинальная",
    )

    assert str(deck) == "Оригинальная"


@pytest.mark.django_db
def test_faction_color_requires_hex() -> None:
    faction = Faction(
        slug="invalid-color",
        name="Invalid",
        color="red",
        on_primary="#FFFFFF",
    )

    with pytest.raises(ValidationError):
        faction.full_clean()


@pytest.mark.django_db
def test_faction_on_primary_requires_hex() -> None:
    faction = Faction(
        slug="invalid-on-primary",
        name="Invalid",
        color="#FFFFFF",
        on_primary="white",
    )

    with pytest.raises(ValidationError):
        faction.full_clean()


@pytest.mark.django_db(transaction=True)
def test_game_mode_rejects_min_players_greater_than_max_players() -> None:
    with pytest.raises(IntegrityError):
        GameMode.objects.create(
            slug="broken-mode",
            name="Broken",
            min_players=5,
            max_players=4,
        )


@pytest.mark.django_db
def test_reference_seed_data_is_loaded() -> None:
    _ensure_reference_seed_data()

    assert set(Faction.objects.values_list("slug", flat=True)) == EXPECTED_FACTION_SLUGS
    assert set(GameMode.objects.values_list("slug", flat=True)) == EXPECTED_GAME_MODE_SLUGS
    assert set(HouseDeck.objects.values_list("slug", flat=True)) == EXPECTED_DECK_SLUGS

    assert Faction.objects.filter(slug="stark", is_active=True).exists()
    assert GameMode.objects.filter(slug="classic", min_players=3, max_players=6).exists()
    assert GameMode.objects.filter(
        slug="mother_of_dragons",
        required_factions=["targaryen"],
        westeros_deck_count=4,
    ).exists()
    assert HouseDeck.objects.filter(slug="original").exists()

    faction_colors = {
        row["slug"]: (row["color"], row["on_primary"])
        for row in Faction.objects.values("slug", "color", "on_primary")
    }
    assert faction_colors == EXPECTED_FACTION_COLORS
