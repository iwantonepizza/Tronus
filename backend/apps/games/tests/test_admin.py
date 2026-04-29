from __future__ import annotations

from django.contrib.admin.sites import site

from apps.games.admin import GameSessionAdmin, OutcomeAdmin, ParticipationAdmin
from apps.games.models import GameSession, Outcome, Participation


def test_games_models_are_registered_in_admin() -> None:
    assert site.is_registered(GameSession)
    assert site.is_registered(Participation)
    assert site.is_registered(Outcome)


def test_game_session_admin_has_owner_friendly_config() -> None:
    admin_instance = site._registry[GameSession]

    assert isinstance(admin_instance, GameSessionAdmin)
    assert admin_instance.list_filter == ("status", "mode", "house_deck", "scheduled_at")
    assert admin_instance.raw_id_fields == ("created_by",)
    assert len(admin_instance.inlines) == 2


def test_participation_admin_has_search_and_filters() -> None:
    admin_instance = site._registry[Participation]

    assert isinstance(admin_instance, ParticipationAdmin)
    assert admin_instance.list_filter == ("is_winner", "faction", "session__status")
    assert admin_instance.raw_id_fields == ("session", "user")


def test_outcome_admin_has_search_and_filters() -> None:
    admin_instance = site._registry[Outcome]

    assert isinstance(admin_instance, OutcomeAdmin)
    assert admin_instance.list_filter == ("end_reason", "created_at")
    assert admin_instance.raw_id_fields == ("session", "mvp")
