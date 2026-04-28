from __future__ import annotations

from django.contrib.admin.sites import site

from apps.reference.models import Deck, Faction, GameMode


def test_reference_models_are_registered_in_admin() -> None:
    assert site.is_registered(Faction)
    assert site.is_registered(GameMode)
    assert site.is_registered(Deck)


def test_reference_admin_has_owner_friendly_columns_and_filters() -> None:
    faction_admin = site._registry[Faction]
    mode_admin = site._registry[GameMode]
    deck_admin = site._registry[Deck]

    assert faction_admin.list_display == ("name", "slug", "color", "on_primary", "is_active")
    assert faction_admin.list_filter == ("is_active",)
    assert mode_admin.list_filter == ("min_players", "max_players")
    assert deck_admin.list_display == ("name", "slug")
