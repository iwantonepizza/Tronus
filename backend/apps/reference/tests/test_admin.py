from __future__ import annotations

from django.contrib.admin.sites import site

from apps.reference.models import Faction, GameMode, HouseDeck


def test_reference_models_are_registered_in_admin() -> None:
    assert site.is_registered(Faction)
    assert site.is_registered(GameMode)
    assert site.is_registered(HouseDeck)


def test_reference_admin_has_owner_friendly_columns_and_filters() -> None:
    faction_admin = site._registry[Faction]
    mode_admin = site._registry[GameMode]
    deck_admin = site._registry[HouseDeck]

    assert faction_admin.list_display == ("name", "slug", "color", "on_primary", "is_active")
    assert faction_admin.list_filter == ("is_active",)
    assert mode_admin.list_display == (
        "name",
        "slug",
        "min_players",
        "max_players",
        "max_rounds",
        "westeros_deck_count",
    )
    assert mode_admin.list_filter == ("min_players", "max_players")
    assert deck_admin.list_display == ("name", "slug")


def test_gamemode_admin_form_saves_rule_fields_from_text_widgets(db) -> None:
    mode_admin = site._registry[GameMode]
    form_class = mode_admin.get_form(request=None)

    form = form_class(
        data={
            "slug": "custom-mode",
            "name": "Custom Mode",
            "min_players": "3",
            "max_players": "6",
            "max_rounds": "10",
            "description": "Owner-edited mode.",
            "westeros_deck_count": "4",
            "allowed_factions": "stark,\nlannister, baratheon",
            "required_factions": '["targaryen"]',
            "factions_by_player_count": '{"3": ["stark", "lannister", "baratheon"]}',
        }
    )

    assert form.is_valid(), form.errors

    mode = form.save()

    mode.refresh_from_db()
    assert mode.allowed_factions == ["stark", "lannister", "baratheon"]
    assert mode.required_factions == ["targaryen"]
    assert mode.factions_by_player_count == {
        "3": ["stark", "lannister", "baratheon"]
    }


def test_gamemode_admin_form_rejects_invalid_allowed_factions_json(db) -> None:
    mode_admin = site._registry[GameMode]
    form_class = mode_admin.get_form(request=None)

    form = form_class(
        data={
            "slug": "broken-mode",
            "name": "Broken Mode",
            "min_players": "3",
            "max_players": "6",
            "max_rounds": "10",
            "description": "",
            "westeros_deck_count": "3",
            "allowed_factions": '{"not": "a list"}',
            "required_factions": "",
            "factions_by_player_count": "{}",
        }
    )

    assert not form.is_valid()
    assert "allowed_factions" in form.errors
