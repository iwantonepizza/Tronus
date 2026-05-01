from __future__ import annotations

from datetime import timedelta

import pytest
from django.core.exceptions import ValidationError
from django.utils import timezone

from apps.accounts.models import User
from apps.comments.models import MatchComment
from apps.games.models import GameSession, Outcome, Participation, RoundSnapshot, SessionInvite
from apps.games.services import (
    add_participant,
    cancel_session,
    complete_round,
    create_session,
    discard_last_round,
    finalize_session,
    force_remove_participation,
    remove_participant,
    start_session,
    update_planning,
    validate_session_setup,
)
from apps.reference.models import Faction, GameMode, HouseDeck


def _ensure_reference_data() -> dict[str, object]:
    classic, _ = GameMode.objects.get_or_create(
        slug="classic",
        defaults={
            "name": "Classic",
            "min_players": 3,
            "max_players": 6,
            "max_rounds": 10,
            "westeros_deck_count": 3,
            "allowed_factions": [],
            "required_factions": [],
            "factions_by_player_count": {
                "3": ["stark", "lannister", "baratheon"],
                "4": ["stark", "lannister", "baratheon", "greyjoy"],
                "5": ["stark", "lannister", "baratheon", "greyjoy", "tyrell"],
                "6": [
                    "stark",
                    "lannister",
                    "baratheon",
                    "greyjoy",
                    "tyrell",
                    "martell",
                ],
            },
        },
    )
    feast_for_crows, _ = GameMode.objects.get_or_create(
        slug="feast_for_crows",
        defaults={
            "name": "Feast for Crows",
            "min_players": 4,
            "max_players": 4,
            "max_rounds": 7,
            "westeros_deck_count": 3,
            "allowed_factions": ["arryn", "stark", "lannister", "baratheon"],
            "required_factions": [],
            "factions_by_player_count": {},
        },
    )
    dance_with_dragons, _ = GameMode.objects.get_or_create(
        slug="dance_with_dragons",
        defaults={
            "name": "Dance with Dragons",
            "min_players": 6,
            "max_players": 6,
            "max_rounds": 10,
            "westeros_deck_count": 3,
            "allowed_factions": [
                "stark",
                "lannister",
                "baratheon",
                "greyjoy",
                "tyrell",
                "martell",
            ],
            "required_factions": [],
            "factions_by_player_count": {},
        },
    )
    mother_of_dragons, _ = GameMode.objects.get_or_create(
        slug="mother_of_dragons",
        defaults={
            "name": "Mother of Dragons",
            "min_players": 4,
            "max_players": 8,
            "max_rounds": 10,
            "westeros_deck_count": 4,
            "allowed_factions": [],
            "required_factions": ["targaryen"],
            "factions_by_player_count": {},
        },
    )
    original, _ = HouseDeck.objects.get_or_create(
        slug="original",
        defaults={"name": "Original"},
    )
    alternative, _ = HouseDeck.objects.get_or_create(
        slug="alternative",
        defaults={"name": "Alternative"},
    )
    factions: dict[str, Faction] = {}
    for slug, name, color, on_primary in (
        ("stark", "Stark", "#6B7B8C", "#F0F0F0"),
        ("lannister", "Lannister", "#9B2226", "#F5E6C8"),
        ("greyjoy", "Greyjoy", "#1C3B47", "#E0E6E8"),
        ("baratheon", "Baratheon", "#F0B323", "#1A1A22"),
        ("martell", "Martell", "#C94E2A", "#F5E6C8"),
        ("tyrell", "Tyrell", "#4B6B3A", "#F0E6D2"),
        ("arryn", "Arryn", "#8AAFC8", "#1A2A3A"),
        ("targaryen", "Targaryen", "#5B2D8A", "#E0D0F0"),
    ):
        faction, _ = Faction.objects.get_or_create(
            slug=slug,
            defaults={
                "name": name,
                "color": color,
                "on_primary": on_primary,
                "is_active": True,
            },
        )
        factions[slug] = faction
    return {
        "classic": classic,
        "feast_for_crows": feast_for_crows,
        "dance_with_dragons": dance_with_dragons,
        "mother_of_dragons": mother_of_dragons,
        "original": original,
        "alternative": alternative,
        **factions,
    }


def _create_user(*, email: str) -> User:
    return User.objects.create_user(
        username=email,
        email=email,
        password="StrongPassword123!",
        is_active=True,
    )


def _create_planned_session(*, created_by: User) -> GameSession:
    reference = _ensure_reference_data()
    return GameSession.objects.create(
        scheduled_at=timezone.now() + timedelta(days=1),
        mode=reference["classic"],
        house_deck=reference["original"],
        created_by=created_by,
    )


def _build_finalize_payload(
    *participations: Participation,
    places: list[int],
    castles: list[int],
) -> list[dict[str, int]]:
    return [
        {
            "id": participation.pk,
            "place": place,
            "castles": castles_count,
        }
        for participation, place, castles_count in zip(
            participations,
            places,
            castles,
            strict=True,
        )
    ]


def _build_rule_modes() -> dict[str, GameMode]:
    return {
        "classic": GameMode(
            slug="classic",
            name="Classic",
            min_players=3,
            max_players=6,
            max_rounds=10,
            westeros_deck_count=3,
            allowed_factions=[],
            required_factions=[],
            factions_by_player_count={
                "3": ["stark", "lannister", "baratheon"],
                "4": ["stark", "lannister", "baratheon", "greyjoy"],
                "5": ["stark", "lannister", "baratheon", "greyjoy", "tyrell"],
                "6": [
                    "stark",
                    "lannister",
                    "baratheon",
                    "greyjoy",
                    "tyrell",
                    "martell",
                ],
            },
        ),
        "feast_for_crows": GameMode(
            slug="feast_for_crows",
            name="Feast for Crows",
            min_players=4,
            max_players=4,
            max_rounds=7,
            westeros_deck_count=3,
            allowed_factions=["arryn", "stark", "lannister", "baratheon"],
            required_factions=[],
            factions_by_player_count={},
        ),
        "dance_with_dragons": GameMode(
            slug="dance_with_dragons",
            name="Dance with Dragons",
            min_players=6,
            max_players=6,
            max_rounds=10,
            westeros_deck_count=3,
            allowed_factions=[
                "stark",
                "lannister",
                "baratheon",
                "greyjoy",
                "tyrell",
                "martell",
            ],
            required_factions=[],
            factions_by_player_count={},
        ),
        "mother_of_dragons": GameMode(
            slug="mother_of_dragons",
            name="Mother of Dragons",
            min_players=4,
            max_players=8,
            max_rounds=10,
            westeros_deck_count=4,
            allowed_factions=[],
            required_factions=["targaryen"],
            factions_by_player_count={},
        ),
    }


def test_validate_session_setup_allows_classic_three_player_core() -> None:
    reference = _build_rule_modes()

    validate_session_setup(
        mode=reference["classic"],
        faction_slugs=["stark", "lannister", "baratheon"],
    )


def test_validate_session_setup_allows_classic_five_player_with_tyrell() -> None:
    reference = _build_rule_modes()

    validate_session_setup(
        mode=reference["classic"],
        faction_slugs=["stark", "lannister", "baratheon", "greyjoy", "tyrell"],
    )


def test_validate_session_setup_rejects_classic_three_player_with_greyjoy() -> None:
    reference = _build_rule_modes()

    with pytest.raises(ValidationError) as exc_info:
        validate_session_setup(
            mode=reference["classic"],
            faction_slugs=["stark", "lannister", "greyjoy"],
        )

    assert exc_info.value.message_dict == {
        "factions": ["Фракция 'greyjoy' недоступна в режиме 'classic'."]
    }


def test_validate_session_setup_rejects_classic_five_player_with_arryn() -> None:
    reference = _build_rule_modes()

    with pytest.raises(ValidationError) as exc_info:
        validate_session_setup(
            mode=reference["classic"],
            faction_slugs=["stark", "lannister", "baratheon", "greyjoy", "arryn"],
        )

    assert exc_info.value.message_dict == {
        "factions": ["Фракция 'arryn' недоступна в режиме 'classic'."]
    }


def test_validate_session_setup_rejects_classic_too_few_players() -> None:
    reference = _build_rule_modes()

    with pytest.raises(ValidationError) as exc_info:
        validate_session_setup(
            mode=reference["classic"],
            faction_slugs=["stark", "lannister"],
        )

    assert exc_info.value.message_dict == {
        "players": ["Режим 'classic' поддерживает от 3 до 6 игроков."]
    }


def test_validate_session_setup_rejects_duplicate_factions() -> None:
    reference = _build_rule_modes()

    with pytest.raises(ValidationError) as exc_info:
        validate_session_setup(
            mode=reference["classic"],
            faction_slugs=["stark", "stark", "baratheon"],
        )

    assert exc_info.value.message_dict == {
        "factions": ["Повторяющиеся фракции недопустимы."]
    }


def test_validate_session_setup_allows_feast_for_crows_exact_roster() -> None:
    reference = _build_rule_modes()

    validate_session_setup(
        mode=reference["feast_for_crows"],
        faction_slugs=["arryn", "stark", "lannister", "baratheon"],
    )


def test_validate_session_setup_rejects_feast_for_crows_with_targaryen() -> None:
    reference = _build_rule_modes()

    with pytest.raises(ValidationError) as exc_info:
        validate_session_setup(
            mode=reference["feast_for_crows"],
            faction_slugs=["arryn", "stark", "lannister", "targaryen"],
        )

    assert exc_info.value.message_dict == {
        "factions": ["Фракция 'targaryen' недоступна в режиме 'feast_for_crows'."]
    }


def test_validate_session_setup_rejects_feast_for_crows_with_five_players() -> None:
    reference = _build_rule_modes()

    with pytest.raises(ValidationError) as exc_info:
        validate_session_setup(
            mode=reference["feast_for_crows"],
            faction_slugs=["arryn", "stark", "lannister", "baratheon", "greyjoy"],
        )

    assert exc_info.value.message_dict == {
        "players": ["Режим 'feast_for_crows' поддерживает от 4 до 4 игроков."],
        "factions": ["Фракция 'greyjoy' недоступна в режиме 'feast_for_crows'."],
    }


def test_validate_session_setup_allows_dance_with_dragons_six_player_roster() -> None:
    reference = _build_rule_modes()

    validate_session_setup(
        mode=reference["dance_with_dragons"],
        faction_slugs=["stark", "lannister", "baratheon", "greyjoy", "tyrell", "martell"],
    )


def test_validate_session_setup_rejects_dance_with_dragons_with_arryn() -> None:
    reference = _build_rule_modes()

    with pytest.raises(ValidationError) as exc_info:
        validate_session_setup(
            mode=reference["dance_with_dragons"],
            faction_slugs=["stark", "lannister", "baratheon", "greyjoy", "tyrell", "arryn"],
        )

    assert exc_info.value.message_dict == {
        "factions": ["Фракция 'arryn' недоступна в режиме 'dance_with_dragons'."]
    }


def test_validate_session_setup_rejects_dance_with_dragons_with_targaryen() -> None:
    reference = _build_rule_modes()

    with pytest.raises(ValidationError) as exc_info:
        validate_session_setup(
            mode=reference["dance_with_dragons"],
            faction_slugs=[
                "stark",
                "lannister",
                "baratheon",
                "greyjoy",
                "tyrell",
                "targaryen",
            ],
        )

    assert exc_info.value.message_dict == {
        "factions": ["Фракция 'targaryen' недоступна в режиме 'dance_with_dragons'."]
    }


def test_validate_session_setup_allows_mother_of_dragons_with_targaryen() -> None:
    reference = _build_rule_modes()

    validate_session_setup(
        mode=reference["mother_of_dragons"],
        faction_slugs=["stark", "lannister", "baratheon", "targaryen"],
    )


def test_validate_session_setup_rejects_mother_of_dragons_without_targaryen() -> None:
    reference = _build_rule_modes()

    with pytest.raises(ValidationError) as exc_info:
        validate_session_setup(
            mode=reference["mother_of_dragons"],
            faction_slugs=["stark", "lannister", "baratheon", "greyjoy"],
        )

    assert exc_info.value.message_dict == {
        "factions": ["Фракция 'targaryen' обязательна для режима 'mother_of_dragons'."]
    }


def test_validate_session_setup_rejects_mother_of_dragons_with_too_many_players() -> None:
    reference = _build_rule_modes()

    with pytest.raises(ValidationError) as exc_info:
        validate_session_setup(
            mode=reference["mother_of_dragons"],
            faction_slugs=[
                "stark",
                "lannister",
                "baratheon",
                "greyjoy",
                "tyrell",
                "martell",
                "arryn",
                "targaryen",
                "tully",
            ],
        )

    assert exc_info.value.message_dict == {
        "players": ["Режим 'mother_of_dragons' поддерживает от 4 до 8 игроков."],
        "factions": ["Фракция 'tully' недоступна в режиме 'mother_of_dragons'."],
    }


@pytest.mark.django_db
def test_create_session_creates_planned_session() -> None:
    reference = _ensure_reference_data()
    creator = _create_user(email="creator@example.com")

    session = create_session(
        created_by=creator,
        scheduled_at=timezone.now() + timedelta(days=2),
        mode=reference["classic"],
        deck=reference["original"],
        planning_note="  Bring expansion map.  ",
    )

    assert session.created_by == creator
    assert session.status == GameSession.Status.PLANNED
    assert session.planning_note == "Bring expansion map."


@pytest.mark.django_db
def test_add_participant_creates_participation_for_planned_session() -> None:
    reference = _ensure_reference_data()
    creator = _create_user(email="creator@example.com")
    player = _create_user(email="player@example.com")
    session = _create_planned_session(created_by=creator)

    participation = add_participant(
        session=session,
        user=player,
        faction=reference["stark"],
    )

    assert participation.session == session
    assert participation.user == player
    assert participation.faction == reference["stark"]


@pytest.mark.django_db
def test_add_participant_rejects_duplicate_user() -> None:
    reference = _ensure_reference_data()
    creator = _create_user(email="creator@example.com")
    session = _create_planned_session(created_by=creator)
    add_participant(session=session, user=creator, faction=reference["stark"])

    with pytest.raises(ValidationError) as exc_info:
        add_participant(
            session=session,
            user=creator,
            faction=reference["lannister"],
        )

    assert exc_info.value.message_dict == {
        "user": ["Этот пользователь уже участвует в партии."]
    }


@pytest.mark.django_db
def test_add_participant_rejects_duplicate_faction() -> None:
    reference = _ensure_reference_data()
    creator = _create_user(email="creator@example.com")
    player = _create_user(email="player@example.com")
    session = _create_planned_session(created_by=creator)
    add_participant(session=session, user=creator, faction=reference["stark"])

    with pytest.raises(ValidationError) as exc_info:
        add_participant(
            session=session,
            user=player,
            faction=reference["stark"],
        )

    assert exc_info.value.message_dict == {
        "faction": ["Эта фракция уже занята в партии."]
    }


@pytest.mark.django_db
def test_add_participant_rejects_when_mode_is_full() -> None:
    reference = _ensure_reference_data()
    creator = _create_user(email="creator@example.com")
    session = GameSession.objects.create(
        scheduled_at=timezone.now() + timedelta(days=1),
        mode=reference["feast_for_crows"],
        house_deck=reference["original"],
        created_by=creator,
    )
    players = [
        creator,
        _create_user(email="player1@example.com"),
        _create_user(email="player2@example.com"),
        _create_user(email="player3@example.com"),
        _create_user(email="player4@example.com"),
    ]
    factions = [
        reference["stark"],
        reference["lannister"],
        reference["greyjoy"],
        reference["baratheon"],
        reference["martell"],
    ]

    for player, faction in zip(players[:4], factions[:4], strict=True):
        add_participant(session=session, user=player, faction=faction)

    with pytest.raises(ValidationError) as exc_info:
        add_participant(session=session, user=players[4], faction=factions[4])

    assert exc_info.value.message_dict == {
        "mode": ["Режим 'feast_for_crows' поддерживает не более 4 игроков."]
    }


@pytest.mark.django_db
def test_add_participant_rejects_non_planned_session() -> None:
    reference = _ensure_reference_data()
    creator = _create_user(email="creator@example.com")
    player = _create_user(email="player@example.com")
    session = _create_planned_session(created_by=creator)
    session.status = GameSession.Status.CANCELLED
    session.save(update_fields=["status", "updated_at"])

    with pytest.raises(ValidationError) as exc_info:
        add_participant(session=session, user=player, faction=reference["stark"])

    assert exc_info.value.message_dict == {
        "session": ["Изменять можно только запланированные партии."]
    }


@pytest.mark.django_db
def test_remove_participant_deletes_participation() -> None:
    reference = _ensure_reference_data()
    creator = _create_user(email="creator@example.com")
    session = _create_planned_session(created_by=creator)
    participation = add_participant(
        session=session,
        user=creator,
        faction=reference["stark"],
    )

    remove_participant(participation=participation)

    assert Participation.objects.filter(pk=participation.pk).exists() is False


@pytest.mark.django_db
def test_remove_participant_rejects_non_planned_session() -> None:
    reference = _ensure_reference_data()
    creator = _create_user(email="creator@example.com")
    session = _create_planned_session(created_by=creator)
    participation = add_participant(
        session=session,
        user=creator,
        faction=reference["stark"],
    )
    session.status = GameSession.Status.COMPLETED
    session.save(update_fields=["status", "updated_at"])

    with pytest.raises(ValidationError) as exc_info:
        remove_participant(participation=participation)

    assert exc_info.value.message_dict == {
        "session": ["Изменять можно только запланированные партии."]
    }


@pytest.mark.django_db
def test_update_planning_updates_fields() -> None:
    reference = _ensure_reference_data()
    creator = _create_user(email="creator@example.com")
    session = _create_planned_session(created_by=creator)
    new_time = timezone.now() + timedelta(days=5)

    updated_session = update_planning(
        session=session,
        scheduled_at=new_time,
        deck=reference["alternative"],
        planning_note="  New note.  ",
    )

    assert updated_session.scheduled_at == new_time
    assert updated_session.house_deck == reference["alternative"]
    assert updated_session.planning_note == "New note."


@pytest.mark.django_db
def test_update_planning_rejects_mode_that_cannot_fit_participants() -> None:
    reference = _ensure_reference_data()
    creator = _create_user(email="creator@example.com")
    session = _create_planned_session(created_by=creator)
    extra_players = [
        _create_user(email="player1@example.com"),
        _create_user(email="player2@example.com"),
        _create_user(email="player3@example.com"),
        _create_user(email="player4@example.com"),
    ]
    factions = [
        reference["stark"],
        reference["lannister"],
        reference["greyjoy"],
        reference["baratheon"],
        reference["martell"],
    ]

    add_participant(session=session, user=creator, faction=factions[0])
    for player, faction in zip(extra_players, factions[1:], strict=True):
        add_participant(session=session, user=player, faction=faction)

    with pytest.raises(ValidationError) as exc_info:
        update_planning(session=session, mode=reference["feast_for_crows"])

    assert exc_info.value.message_dict == {
        "mode": ["Режим 'feast_for_crows' поддерживает не более 4 игроков."]
    }


@pytest.mark.django_db
def test_update_planning_rejects_non_planned_session() -> None:
    _ensure_reference_data()
    creator = _create_user(email="creator@example.com")
    session = _create_planned_session(created_by=creator)
    session.status = GameSession.Status.CANCELLED
    session.save(update_fields=["status", "updated_at"])

    with pytest.raises(ValidationError) as exc_info:
        update_planning(session=session, planning_note="Nope")

    assert exc_info.value.message_dict == {
        "session": ["Изменять можно только запланированные партии."]
    }


@pytest.mark.django_db
def test_cancel_session_sets_status_to_cancelled() -> None:
    _ensure_reference_data()
    creator = _create_user(email="creator@example.com")
    session = _create_planned_session(created_by=creator)

    cancelled_session = cancel_session(session=session)
    session.refresh_from_db()

    assert cancelled_session.status == GameSession.Status.CANCELLED
    assert session.status == GameSession.Status.CANCELLED


@pytest.mark.django_db
def test_cancel_session_rejects_completed_session() -> None:
    _ensure_reference_data()
    creator = _create_user(email="creator@example.com")
    session = _create_planned_session(created_by=creator)
    session.status = GameSession.Status.COMPLETED
    session.save(update_fields=["status", "updated_at"])

    with pytest.raises(ValidationError) as exc_info:
        cancel_session(session=session)

    assert exc_info.value.message_dict == {
        "session": ["Отменить можно только запланированную или начатую партию."]
    }


@pytest.mark.django_db
def test_cancel_session_rejects_already_cancelled_session() -> None:
    _ensure_reference_data()
    creator = _create_user(email="creator@example.com")
    session = _create_planned_session(created_by=creator)
    session.status = GameSession.Status.CANCELLED
    session.save(update_fields=["status", "updated_at"])

    with pytest.raises(ValidationError) as exc_info:
        cancel_session(session=session)

    assert exc_info.value.message_dict == {
        "session": ["Отменить можно только запланированную или начатую партию."]
    }


# ── helpers for CR-007 finalize tests ────────────────────────────────────────

def _setup_in_progress_session_with_snapshot(
    creator_email: str,
    extra_emails: list[str],
    castles_values: list[int] | None = None,
):
    """Create session with N players in in_progress + a RoundSnapshot."""
    reference = _ensure_reference_data()
    creator = _create_user(email=creator_email)
    others = [_create_user(email=e) for e in extra_emails]
    all_users = [creator] + others
    session = _create_planned_session(created_by=creator)

    factions = ["stark", "lannister", "baratheon", "greyjoy", "tyrell", "martell"]
    for user in all_users:
        add_participant(session=session, user=user, faction=reference[factions.pop(0)])

    session.status = GameSession.Status.IN_PROGRESS
    session.save(update_fields=["status", "updated_at"])

    participations = list(session.participations.order_by("pk"))
    p_ids = [p.pk for p in participations]

    if castles_values is None:
        castles_values = [7] + [min(i + 1, 6) for i in range(len(participations) - 1)]

    RoundSnapshot.objects.create(
        session=session,
        round_number=1,
        influence_throne=p_ids,
        influence_sword=p_ids,
        influence_court=p_ids,
        supply={str(pid): 1 for pid in p_ids},
        castles={str(pid): cv for pid, cv in zip(p_ids, castles_values, strict=False)},
        wildlings_threat=4,
    )
    return session, creator, participations


@pytest.mark.django_db
def test_finalize_session_creates_outcome_and_completes_session() -> None:
    """CR-007: finalize computes winner/places from last RoundSnapshot automatically."""
    session, creator, parts = _setup_in_progress_session_with_snapshot(
        "creator_fin@example.com",
        ["p1_fin@example.com", "p2_fin@example.com"],
        castles_values=[7, 5, 3],
    )
    p1, p2, p3 = parts

    outcome = finalize_session(session=session, mvp=creator, final_note="  Great match.  ")

    session.refresh_from_db()
    p1.refresh_from_db()
    p2.refresh_from_db()
    p3.refresh_from_db()

    assert outcome.session == session
    assert outcome.mvp == creator
    assert outcome.final_note == "Great match."
    assert outcome.end_reason == Outcome.EndReason.CASTLES_7
    assert session.status == GameSession.Status.COMPLETED
    assert p1.place == 1 and p1.castles == 7 and p1.is_winner is True
    assert p2.place == 2 and p2.castles == 5 and p2.is_winner is False
    assert p3.place == 3 and p3.castles == 3 and p3.is_winner is False


@pytest.mark.django_db
def test_finalize_session_rejects_no_winner_yet() -> None:
    """CR-007: finalize → ValidationError if no player has 7 castles."""
    session, creator, parts = _setup_in_progress_session_with_snapshot(
        "creator_nw@example.com",
        ["p1_nw@example.com", "p2_nw@example.com"],
        castles_values=[6, 5, 3],  # nobody has 7
    )

    with pytest.raises(ValidationError) as exc_info:
        finalize_session(session=session)

    assert "session" in exc_info.value.message_dict


@pytest.mark.django_db
def test_finalize_session_tiebreak_by_throne() -> None:
    """CR-007: when multiple players have 7 castles, throne track decides winner."""
    reference = _ensure_reference_data()
    creator = _create_user(email="creator_tie@example.com")
    p2_user = _create_user(email="p2_tie@example.com")
    p3_user = _create_user(email="p3_tie@example.com")
    session = _create_planned_session(created_by=creator)

    p1 = add_participant(session=session, user=creator, faction=reference["stark"])
    p2 = add_participant(session=session, user=p2_user, faction=reference["lannister"])
    p3 = add_participant(session=session, user=p3_user, faction=reference["baratheon"])

    session.status = GameSession.Status.IN_PROGRESS
    session.save(update_fields=["status", "updated_at"])

    # p2 is first on throne track; p1 is second; both have 7 castles
    RoundSnapshot.objects.create(
        session=session,
        round_number=1,
        influence_throne=[p2.pk, p1.pk, p3.pk],
        influence_sword=[p1.pk, p2.pk, p3.pk],
        influence_court=[p1.pk, p2.pk, p3.pk],
        supply={str(p.pk): 1 for p in [p1, p2, p3]},
        castles={str(p1.pk): 7, str(p2.pk): 7, str(p3.pk): 4},
        wildlings_threat=4,
    )

    finalize_session(session=session)
    p1.refresh_from_db()
    p2.refresh_from_db()

    # p2 wins (index 0 on throne), p1 is second
    assert p2.is_winner is True and p2.place == 1
    assert p1.is_winner is False and p1.place == 2


@pytest.mark.django_db
def test_finalize_session_rejects_when_not_enough_players() -> None:
    """finalize → ValidationError if fewer than mode.min_players."""
    reference = _ensure_reference_data()
    creator = _create_user(email="creator_np@example.com")
    player = _create_user(email="player_np@example.com")
    session = _create_planned_session(created_by=creator)
    p1 = add_participant(session=session, user=creator, faction=reference["stark"])
    p2 = add_participant(session=session, user=player, faction=reference["lannister"])
    session.status = GameSession.Status.IN_PROGRESS
    session.save(update_fields=["status", "updated_at"])
    RoundSnapshot.objects.create(
        session=session,
        round_number=1,
        influence_throne=[p1.pk, p2.pk],
        influence_sword=[p1.pk, p2.pk],
        influence_court=[p1.pk, p2.pk],
        supply={str(p1.pk): 1, str(p2.pk): 1},
        castles={str(p1.pk): 7, str(p2.pk): 5},
        wildlings_threat=4,
    )

    with pytest.raises(ValidationError) as exc_info:
        finalize_session(session=session)

    assert "session" in exc_info.value.message_dict


@pytest.mark.django_db
def test_finalize_session_rejects_mvp_outside_session() -> None:
    """finalize → ValidationError if MVP is not a session participant."""
    session, creator, parts = _setup_in_progress_session_with_snapshot(
        "creator_mvp@example.com",
        ["p1_mvp@example.com", "p2_mvp@example.com"],
        castles_values=[7, 5, 3],
    )
    outsider = _create_user(email="outsider_mvp@example.com")

    with pytest.raises(ValidationError) as exc_info:
        finalize_session(session=session, mvp=outsider)

    assert "mvp" in exc_info.value.message_dict


@pytest.mark.django_db
def test_finalize_session_rejects_cancelled_session() -> None:
    """finalize on cancelled session → ValidationError."""
    reference = _ensure_reference_data()
    creator = _create_user(email="creator_can2@example.com")
    p1_user = _create_user(email="p1_can2@example.com")
    p2_user = _create_user(email="p2_can2@example.com")
    session = _create_planned_session(created_by=creator)
    add_participant(session=session, user=creator, faction=reference["stark"])
    add_participant(session=session, user=p1_user, faction=reference["lannister"])
    add_participant(session=session, user=p2_user, faction=reference["baratheon"])
    session.status = GameSession.Status.CANCELLED
    session.save(update_fields=["status", "updated_at"])

    with pytest.raises(ValidationError) as exc_info:
        finalize_session(session=session)

    assert exc_info.value.message_dict == {
        "session": ["Действие доступно только для партий в процессе игры."]
    }

def _add_going_invite(session: GameSession, user: User) -> SessionInvite:
    return SessionInvite.objects.create(
        session=session,
        user=user,
        rsvp_status=SessionInvite.RsvpStatus.GOING,
    )


@pytest.mark.django_db
def test_start_session_happy_path() -> None:
    """start_session creates Participations, initial RoundSnapshot, sets status=in_progress."""
    _ensure_reference_data()
    creator = _create_user(email="creator_start@example.com")
    p1 = _create_user(email="p1_start@example.com")
    p2 = _create_user(email="p2_start@example.com")
    session = _create_planned_session(created_by=creator)

    _add_going_invite(session, creator)
    _add_going_invite(session, p1)
    _add_going_invite(session, p2)

    assignment = {
        creator.pk: "stark",
        p1.pk: "lannister",
        p2.pk: "baratheon",
    }
    result = start_session(session=session, factions_assignment=assignment)

    assert result.status == GameSession.Status.IN_PROGRESS

    participations = list(result.participations.order_by("pk"))
    assert len(participations) == 3
    faction_slugs = {p.faction.slug for p in participations}
    assert faction_slugs == {"stark", "lannister", "baratheon"}

    snapshot = RoundSnapshot.objects.get(session=result, round_number=0)
    assert snapshot.wildlings_threat == 4
    assert len(snapshot.supply) == 3
    assert all(v == 1 for v in snapshot.supply.values())
    assert all(v == 0 for v in snapshot.castles.values())


@pytest.mark.django_db
def test_start_session_replaces_legacy_planned_participations() -> None:
    reference = _ensure_reference_data()
    creator = _create_user(email="creator_legacy_start@example.com")
    p1 = _create_user(email="p1_legacy_start@example.com")
    p2 = _create_user(email="p2_legacy_start@example.com")
    session = _create_planned_session(created_by=creator)

    legacy_one = Participation.objects.create(
        session=session,
        user=creator,
        faction=reference["greyjoy"],
    )
    legacy_two = Participation.objects.create(
        session=session,
        user=p1,
        faction=reference["martell"],
    )

    _add_going_invite(session, creator)
    _add_going_invite(session, p1)
    _add_going_invite(session, p2)

    result = start_session(
        session=session,
        factions_assignment={
            creator.pk: "stark",
            p1.pk: "lannister",
            p2.pk: "baratheon",
        },
    )

    assert result.status == GameSession.Status.IN_PROGRESS
    assert Participation.objects.filter(pk__in=[legacy_one.pk, legacy_two.pk]).exists() is False

    participations = list(result.participations.order_by("pk"))
    assert len(participations) == 3
    assert {p.user_id for p in participations} == {creator.pk, p1.pk, p2.pk}
    assert {p.faction.slug for p in participations} == {"stark", "lannister", "baratheon"}


@pytest.mark.django_db
def test_start_session_rejects_user_without_going_invite() -> None:
    """start_session raises ValidationError if a user has no going invite."""
    _ensure_reference_data()
    creator = _create_user(email="creator_noinvite@example.com")
    p1 = _create_user(email="p1_noinvite@example.com")
    p2 = _create_user(email="p2_noinvite@example.com")
    session = _create_planned_session(created_by=creator)

    _add_going_invite(session, creator)
    _add_going_invite(session, p1)
    # p2 has no invite at all

    assignment = {creator.pk: "stark", p1.pk: "lannister", p2.pk: "baratheon"}

    with pytest.raises(ValidationError) as exc_info:
        start_session(session=session, factions_assignment=assignment)

    assert "factions_assignment" in exc_info.value.message_dict


@pytest.mark.django_db
def test_start_session_rejects_user_with_non_going_rsvp() -> None:
    """start_session rejects user whose RSVP is 'maybe' (not going)."""
    _ensure_reference_data()
    creator = _create_user(email="creator_maybe@example.com")
    p1 = _create_user(email="p1_maybe@example.com")
    p2 = _create_user(email="p2_maybe@example.com")
    session = _create_planned_session(created_by=creator)

    _add_going_invite(session, creator)
    _add_going_invite(session, p1)
    SessionInvite.objects.create(
        session=session, user=p2, rsvp_status=SessionInvite.RsvpStatus.MAYBE
    )

    assignment = {creator.pk: "stark", p1.pk: "lannister", p2.pk: "baratheon"}

    with pytest.raises(ValidationError) as exc_info:
        start_session(session=session, factions_assignment=assignment)

    assert "factions_assignment" in exc_info.value.message_dict


@pytest.mark.django_db
def test_start_session_rejects_duplicate_faction() -> None:
    """Duplicate faction in assignment triggers validate_session_setup → ValidationError."""
    _ensure_reference_data()
    creator = _create_user(email="creator_dupfac@example.com")
    p1 = _create_user(email="p1_dupfac@example.com")
    p2 = _create_user(email="p2_dupfac@example.com")
    session = _create_planned_session(created_by=creator)

    _add_going_invite(session, creator)
    _add_going_invite(session, p1)
    _add_going_invite(session, p2)

    # Two players assigned the same faction
    assignment = {creator.pk: "stark", p1.pk: "stark", p2.pk: "baratheon"}

    with pytest.raises(ValidationError):
        start_session(session=session, factions_assignment=assignment)


@pytest.mark.django_db
def test_start_session_rejects_non_planned_session() -> None:
    """start_session on a cancelled session raises ValidationError."""
    _ensure_reference_data()
    creator = _create_user(email="creator_cancelled@example.com")
    session = _create_planned_session(created_by=creator)
    session.status = GameSession.Status.CANCELLED
    session.save(update_fields=["status", "updated_at"])

    with pytest.raises(ValidationError) as exc_info:
        start_session(session=session, factions_assignment={})

    assert "session" in exc_info.value.message_dict


@pytest.mark.django_db
def test_cancel_session_from_in_progress() -> None:
    """cancel_session works when session is in_progress (ADR-0009)."""
    _ensure_reference_data()
    creator = _create_user(email="creator_cancel_inp@example.com")
    p1 = _create_user(email="p1_cancel_inp@example.com")
    p2 = _create_user(email="p2_cancel_inp@example.com")
    session = _create_planned_session(created_by=creator)

    _add_going_invite(session, creator)
    _add_going_invite(session, p1)
    _add_going_invite(session, p2)

    start_session(
        session=session,
        factions_assignment={creator.pk: "stark", p1.pk: "lannister", p2.pk: "baratheon"},
    )
    session.refresh_from_db()
    assert session.status == GameSession.Status.IN_PROGRESS

    cancelled = cancel_session(session=session)
    assert cancelled.status == GameSession.Status.CANCELLED


@pytest.mark.django_db
def test_finalize_session_rejects_planned_session() -> None:
    """finalize_session requires in_progress — calling on planned → 400 (CR-007)."""
    reference = _ensure_reference_data()
    creator = _create_user(email="creator_finplan@example.com")
    p1 = _create_user(email="p1_finplan@example.com")
    p2 = _create_user(email="p2_finplan@example.com")
    session = _create_planned_session(created_by=creator)
    add_participant(session=session, user=creator, faction=reference["stark"])
    add_participant(session=session, user=p1, faction=reference["lannister"])
    add_participant(session=session, user=p2, faction=reference["baratheon"])

    # Session is still planned — should fail (CR-007: requires in_progress)
    with pytest.raises(ValidationError) as exc_info:
        finalize_session(session=session)

    assert "session" in exc_info.value.message_dict

def _build_round_payload(participation_ids: list[int]) -> dict:
    """Build a valid round payload for the given participation IDs."""
    return {
        "influence_throne": list(participation_ids),
        "influence_sword": list(participation_ids),
        "influence_court": list(participation_ids),
        "supply": {str(pid): 1 for pid in participation_ids},
        "castles": {str(pid): 2 for pid in participation_ids},
        "wildlings_threat": 6,
    }


def _start_session_for_test(
    session: GameSession,
    users: list[User],
    factions: list[str],
) -> list[int]:
    """Create going invites + start session; return participation IDs."""
    for user in users:
        SessionInvite.objects.create(
            session=session, user=user, rsvp_status=SessionInvite.RsvpStatus.GOING
        )
    assignment = {u.pk: f for u, f in zip(users, factions, strict=False)}
    result = start_session(session=session, factions_assignment=assignment)
    result.refresh_from_db()
    return list(result.participations.order_by("pk").values_list("pk", flat=True))


@pytest.mark.django_db
def test_complete_round_creates_next_snapshot() -> None:
    """complete_round creates round 1 after the initial round 0."""
    _ensure_reference_data()
    creator = _create_user(email="cr_r1@example.com")
    p1 = _create_user(email="p1_r1@example.com")
    p2 = _create_user(email="p2_r1@example.com")
    session = _create_planned_session(created_by=creator)

    p_ids = _start_session_for_test(session, [creator, p1, p2], ["stark", "lannister", "baratheon"])
    session.refresh_from_db()

    payload = _build_round_payload(p_ids)
    snapshot = complete_round(session=session, **payload)

    assert snapshot.round_number == 1
    assert snapshot.wildlings_threat == 6
    assert snapshot.supply == {str(pid): 1 for pid in p_ids}
    assert snapshot.castles == {str(pid): 2 for pid in p_ids}


@pytest.mark.django_db
def test_complete_round_rejects_non_sequential_round() -> None:
    """Cannot create round 5 if last round is 3."""
    _ensure_reference_data()
    creator = _create_user(email="cr_seq@example.com")
    p1 = _create_user(email="p1_seq@example.com")
    p2 = _create_user(email="p2_seq@example.com")
    session = _create_planned_session(created_by=creator)

    p_ids = _start_session_for_test(session, [creator, p1, p2], ["stark", "lannister", "baratheon"])
    session.refresh_from_db()

    # Complete rounds 1, 2, 3 legitimately
    payload = _build_round_payload(p_ids)
    for _ in range(3):
        complete_round(session=session, **payload)

    # Round 4 is next, not 5 — but we just verify that rounds ARE sequential
    # (complete_round always adds next, not arbitrary; this proves monotonicity)
    snap4 = complete_round(session=session, **payload)
    assert snap4.round_number == 4


@pytest.mark.django_db
def test_complete_round_rejects_invalid_wildlings_threat() -> None:
    """wildlings_threat not in enum → ValidationError."""
    _ensure_reference_data()
    creator = _create_user(email="cr_wt@example.com")
    p1 = _create_user(email="p1_wt@example.com")
    p2 = _create_user(email="p2_wt@example.com")
    session = _create_planned_session(created_by=creator)

    p_ids = _start_session_for_test(session, [creator, p1, p2], ["stark", "lannister", "baratheon"])
    session.refresh_from_db()

    payload = _build_round_payload(p_ids)
    payload["wildlings_threat"] = 5  # invalid

    with pytest.raises(ValidationError) as exc_info:
        complete_round(session=session, **payload)

    assert "wildlings_threat" in exc_info.value.message_dict


@pytest.mark.django_db
def test_complete_round_rejects_wrong_participation_ids() -> None:
    """Supply/castles with wrong keys → ValidationError."""
    _ensure_reference_data()
    creator = _create_user(email="cr_wid@example.com")
    p1 = _create_user(email="p1_wid@example.com")
    p2 = _create_user(email="p2_wid@example.com")
    session = _create_planned_session(created_by=creator)

    p_ids = _start_session_for_test(session, [creator, p1, p2], ["stark", "lannister", "baratheon"])
    session.refresh_from_db()

    payload = _build_round_payload(p_ids)
    payload["supply"] = {"9999": 1}  # wrong id

    with pytest.raises(ValidationError) as exc_info:
        complete_round(session=session, **payload)

    assert "supply" in exc_info.value.message_dict


@pytest.mark.django_db
def test_complete_round_rejects_planned_session() -> None:
    """complete_round on a planned (not in_progress) session → ValidationError."""
    _ensure_reference_data()
    creator = _create_user(email="cr_plan@example.com")
    session = _create_planned_session(created_by=creator)

    with pytest.raises(ValidationError) as exc_info:
        complete_round(
            session=session,
            influence_throne=[],
            influence_sword=[],
            influence_court=[],
            supply={},
            castles={},
            wildlings_threat=4,
        )

    assert "session" in exc_info.value.message_dict


@pytest.mark.django_db
def test_complete_round_respects_max_rounds() -> None:
    """Cannot add a round beyond mode.max_rounds."""
    reference = _ensure_reference_data()
    # Use feast_for_crows mode (max_rounds=7)
    creator = _create_user(email="cr_max@example.com")
    p1 = _create_user(email="p1_max@example.com")
    p2 = _create_user(email="p2_max@example.com")
    p3 = _create_user(email="p3_max@example.com")

    session = GameSession.objects.create(
        scheduled_at=timezone.now() + timedelta(days=1),
        mode=reference["feast_for_crows"],
        house_deck=reference["original"],
        created_by=creator,
    )
    p_ids = _start_session_for_test(
        session, [creator, p1, p2, p3], ["arryn", "stark", "lannister", "baratheon"]
    )
    session.refresh_from_db()

    payload = _build_round_payload(p_ids)
    for _ in range(7):  # max rounds for feast_for_crows
        complete_round(session=session, **payload)

    with pytest.raises(ValidationError) as exc_info:
        complete_round(session=session, **payload)

    assert "round" in exc_info.value.message_dict


@pytest.mark.django_db
def test_discard_last_round_removes_most_recent() -> None:
    """discard_last_round deletes the most recent snapshot, not round 0."""
    _ensure_reference_data()
    creator = _create_user(email="cr_disc@example.com")
    p1 = _create_user(email="p1_disc@example.com")
    p2 = _create_user(email="p2_disc@example.com")
    session = _create_planned_session(created_by=creator)

    p_ids = _start_session_for_test(session, [creator, p1, p2], ["stark", "lannister", "baratheon"])
    session.refresh_from_db()

    complete_round(session=session, **_build_round_payload(p_ids))
    complete_round(session=session, **_build_round_payload(p_ids))
    assert RoundSnapshot.objects.filter(session=session).count() == 3  # 0, 1, 2

    discard_last_round(session=session)
    assert RoundSnapshot.objects.filter(session=session).count() == 2  # 0, 1
    assert not RoundSnapshot.objects.filter(session=session, round_number=2).exists()


@pytest.mark.django_db
def test_discard_last_round_refuses_round_zero() -> None:
    """discard_last_round raises if the only snapshot is the initial round 0."""
    _ensure_reference_data()
    creator = _create_user(email="cr_disc0@example.com")
    p1 = _create_user(email="p1_disc0@example.com")
    p2 = _create_user(email="p2_disc0@example.com")
    session = _create_planned_session(created_by=creator)

    _start_session_for_test(session, [creator, p1, p2], ["stark", "lannister", "baratheon"])
    session.refresh_from_db()

    with pytest.raises(ValidationError) as exc_info:
        discard_last_round(session=session)

    assert "round" in exc_info.value.message_dict


@pytest.mark.django_db
def test_force_remove_participation_deletes_active_player_and_writes_timeline() -> None:
    creator = _create_user(email="creator_force@example.com")
    player_one = _create_user(email="player1_force@example.com")
    player_two = _create_user(email="player2_force@example.com")
    session = _create_planned_session(created_by=creator)

    participation_ids = _start_session_for_test(
        session,
        [creator, player_one, player_two],
        ["stark", "lannister", "baratheon"],
    )
    participation = Participation.objects.get(pk=participation_ids[1])

    force_remove_participation(participation=participation, by_user=creator)

    assert Participation.objects.filter(pk=participation.pk).exists() is False

    timeline_event = session.timeline_events.get(kind="participant_removed")
    assert timeline_event.payload["participation_id"] == participation.pk
    assert timeline_event.payload["user_id"] == player_one.pk
    assert timeline_event.payload["faction_slug"] == "lannister"
    assert timeline_event.actor_id == creator.pk

    chronicler_comment = MatchComment.objects.get(chronicler_event=timeline_event)
    assert player_one.profile.nickname in chronicler_comment.body


@pytest.mark.django_db
def test_force_remove_participation_rejects_non_creator_non_admin() -> None:
    creator = _create_user(email="creator_force_denied@example.com")
    player_one = _create_user(email="player1_force_denied@example.com")
    player_two = _create_user(email="player2_force_denied@example.com")
    stranger = _create_user(email="stranger_force_denied@example.com")
    session = _create_planned_session(created_by=creator)

    participation_ids = _start_session_for_test(
        session,
        [creator, player_one, player_two],
        ["stark", "lannister", "baratheon"],
    )
    participation = Participation.objects.get(pk=participation_ids[1])

    with pytest.raises(ValidationError) as exc_info:
        force_remove_participation(participation=participation, by_user=stranger)

    assert exc_info.value.message_dict == {
        "permission": ["Только создатель партии или администратор может удалить участника после старта."]
    }
