from __future__ import annotations

from datetime import timedelta

import pytest
from django.core.exceptions import ValidationError
from django.utils import timezone

from apps.accounts.models import User
from apps.games.models import GameSession, Outcome, Participation
from apps.games.services import (
    add_participant,
    cancel_session,
    create_session,
    finalize_session,
    remove_participant,
    update_planning,
)
from apps.reference.models import Deck, Faction, GameMode


def _ensure_reference_data() -> dict[str, object]:
    classic, _ = GameMode.objects.get_or_create(
        slug="classic",
        defaults={
            "name": "Classic",
            "min_players": 3,
            "max_players": 6,
        },
    )
    quests, _ = GameMode.objects.get_or_create(
        slug="quests",
        defaults={
            "name": "Quests",
            "min_players": 4,
            "max_players": 4,
        },
    )
    original, _ = Deck.objects.get_or_create(
        slug="original",
        defaults={"name": "Original"},
    )
    expansion_a, _ = Deck.objects.get_or_create(
        slug="expansion_a",
        defaults={"name": "Expansion A"},
    )
    factions: dict[str, Faction] = {}
    for slug, name, color, on_primary in (
        ("stark", "Stark", "#6B7B8C", "#F0F0F0"),
        ("lannister", "Lannister", "#9B2226", "#F5E6C8"),
        ("greyjoy", "Greyjoy", "#1C3B47", "#E0E6E8"),
        ("baratheon", "Baratheon", "#F0B323", "#1A1A22"),
        ("martell", "Martell", "#C94E2A", "#F5E6C8"),
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
        "quests": quests,
        "original": original,
        "expansion_a": expansion_a,
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
        deck=reference["original"],
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
        "user": ["This user is already participating in the session."]
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
        "faction": ["This faction is already taken in the session."]
    }


@pytest.mark.django_db
def test_add_participant_rejects_when_mode_is_full() -> None:
    reference = _ensure_reference_data()
    creator = _create_user(email="creator@example.com")
    session = GameSession.objects.create(
        scheduled_at=timezone.now() + timedelta(days=1),
        mode=reference["quests"],
        deck=reference["original"],
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
        "mode": ["Mode 'quests' supports at most 4 players."]
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
        "session": ["Only planned sessions can be modified."]
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
        "session": ["Only planned sessions can be modified."]
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
        deck=reference["expansion_a"],
        planning_note="  New note.  ",
    )

    assert updated_session.scheduled_at == new_time
    assert updated_session.deck == reference["expansion_a"]
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
        update_planning(session=session, mode=reference["quests"])

    assert exc_info.value.message_dict == {
        "mode": ["Mode 'quests' supports at most 4 players."]
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
        "session": ["Only planned sessions can be modified."]
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
        "session": ["Only planned sessions can be modified."]
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
        "session": ["Only planned sessions can be modified."]
    }


@pytest.mark.django_db
def test_finalize_session_creates_outcome_and_completes_session() -> None:
    reference = _ensure_reference_data()
    creator = _create_user(email="creator@example.com")
    player_one = _create_user(email="player1@example.com")
    player_two = _create_user(email="player2@example.com")
    session = _create_planned_session(created_by=creator)
    p1 = add_participant(session=session, user=creator, faction=reference["stark"])
    p2 = add_participant(session=session, user=player_one, faction=reference["lannister"])
    p3 = add_participant(session=session, user=player_two, faction=reference["greyjoy"])

    outcome = finalize_session(
        session=session,
        rounds_played=10,
        end_reason=Outcome.EndReason.CASTLES_7,
        mvp=creator,
        final_note="  Great match.  ",
        participations=_build_finalize_payload(
            p1,
            p2,
            p3,
            places=[1, 2, 3],
            castles=[7, 5, 3],
        ),
    )

    session.refresh_from_db()
    p1.refresh_from_db()
    p2.refresh_from_db()
    p3.refresh_from_db()

    assert outcome.session == session
    assert outcome.mvp == creator
    assert outcome.final_note == "Great match."
    assert session.status == GameSession.Status.COMPLETED
    assert p1.place == 1 and p1.castles == 7 and p1.is_winner is True
    assert p2.place == 2 and p2.castles == 5 and p2.is_winner is False
    assert p3.place == 3 and p3.castles == 3 and p3.is_winner is False


@pytest.mark.django_db
def test_finalize_session_rejects_when_not_enough_players() -> None:
    reference = _ensure_reference_data()
    creator = _create_user(email="creator@example.com")
    player = _create_user(email="player@example.com")
    session = _create_planned_session(created_by=creator)
    p1 = add_participant(session=session, user=creator, faction=reference["stark"])
    p2 = add_participant(session=session, user=player, faction=reference["lannister"])

    with pytest.raises(ValidationError) as exc_info:
        finalize_session(
            session=session,
            rounds_played=8,
            end_reason=Outcome.EndReason.OTHER,
            mvp=None,
            final_note="",
            participations=_build_finalize_payload(
                p1,
                p2,
                places=[1, 2],
                castles=[7, 5],
            ),
        )

    assert exc_info.value.message_dict == {
        "session": ["Mode 'classic' requires at least 3 players to finalize."]
    }


@pytest.mark.django_db
def test_finalize_session_rejects_missing_participation_in_payload() -> None:
    reference = _ensure_reference_data()
    creator = _create_user(email="creator@example.com")
    player_one = _create_user(email="player1@example.com")
    player_two = _create_user(email="player2@example.com")
    session = _create_planned_session(created_by=creator)
    p1 = add_participant(session=session, user=creator, faction=reference["stark"])
    p2 = add_participant(session=session, user=player_one, faction=reference["lannister"])
    add_participant(session=session, user=player_two, faction=reference["greyjoy"])

    with pytest.raises(ValidationError) as exc_info:
        finalize_session(
            session=session,
            rounds_played=8,
            end_reason=Outcome.EndReason.OTHER,
            mvp=None,
            final_note="",
            participations=_build_finalize_payload(
                p1,
                p2,
                places=[1, 2],
                castles=[7, 5],
            ),
        )

    assert exc_info.value.message_dict == {
        "participations": [
            "All session participations must be provided for finalize.",
            "Finalize payload must match session participants exactly.",
            "Places must form a contiguous range from 1 to participant count.",
        ]
    }


@pytest.mark.django_db
def test_finalize_session_rejects_unknown_participation_id() -> None:
    reference = _ensure_reference_data()
    creator = _create_user(email="creator@example.com")
    player_one = _create_user(email="player1@example.com")
    player_two = _create_user(email="player2@example.com")
    session = _create_planned_session(created_by=creator)
    p1 = add_participant(session=session, user=creator, faction=reference["stark"])
    p2 = add_participant(session=session, user=player_one, faction=reference["lannister"])
    add_participant(session=session, user=player_two, faction=reference["greyjoy"])

    with pytest.raises(ValidationError) as exc_info:
        finalize_session(
            session=session,
            rounds_played=8,
            end_reason=Outcome.EndReason.OTHER,
            mvp=None,
            final_note="",
            participations=[
                {"id": p1.pk, "place": 1, "castles": 7},
                {"id": p2.pk, "place": 2, "castles": 5},
                {"id": 999999, "place": 3, "castles": 3},
            ],
        )

    assert exc_info.value.message_dict == {
        "participations": [
            "Participation #999999 does not belong to this session.",
            "Finalize payload must match session participants exactly.",
        ]
    }


@pytest.mark.django_db
def test_finalize_session_rejects_non_contiguous_places() -> None:
    reference = _ensure_reference_data()
    creator = _create_user(email="creator@example.com")
    player_one = _create_user(email="player1@example.com")
    player_two = _create_user(email="player2@example.com")
    session = _create_planned_session(created_by=creator)
    p1 = add_participant(session=session, user=creator, faction=reference["stark"])
    p2 = add_participant(session=session, user=player_one, faction=reference["lannister"])
    p3 = add_participant(session=session, user=player_two, faction=reference["greyjoy"])

    with pytest.raises(ValidationError) as exc_info:
        finalize_session(
            session=session,
            rounds_played=8,
            end_reason=Outcome.EndReason.OTHER,
            mvp=None,
            final_note="",
            participations=_build_finalize_payload(
                p1,
                p2,
                p3,
                places=[1, 3, 4],
                castles=[7, 5, 3],
            ),
        )

    assert exc_info.value.message_dict == {
        "participations": ["Places must form a contiguous range from 1 to participant count."]
    }


@pytest.mark.django_db
def test_finalize_session_rejects_mvp_outside_session() -> None:
    reference = _ensure_reference_data()
    creator = _create_user(email="creator@example.com")
    player_one = _create_user(email="player1@example.com")
    player_two = _create_user(email="player2@example.com")
    outsider = _create_user(email="outsider@example.com")
    session = _create_planned_session(created_by=creator)
    p1 = add_participant(session=session, user=creator, faction=reference["stark"])
    p2 = add_participant(session=session, user=player_one, faction=reference["lannister"])
    p3 = add_participant(session=session, user=player_two, faction=reference["greyjoy"])

    with pytest.raises(ValidationError) as exc_info:
        finalize_session(
            session=session,
            rounds_played=8,
            end_reason=Outcome.EndReason.OTHER,
            mvp=outsider,
            final_note="",
            participations=_build_finalize_payload(
                p1,
                p2,
                p3,
                places=[1, 2, 3],
                castles=[7, 5, 3],
            ),
        )

    assert exc_info.value.message_dict == {
        "mvp": ["MVP must be one of the session participants."]
    }


@pytest.mark.django_db
def test_finalize_session_rejects_cancelled_session() -> None:
    reference = _ensure_reference_data()
    creator = _create_user(email="creator@example.com")
    player_one = _create_user(email="player1@example.com")
    player_two = _create_user(email="player2@example.com")
    session = _create_planned_session(created_by=creator)
    p1 = add_participant(session=session, user=creator, faction=reference["stark"])
    p2 = add_participant(session=session, user=player_one, faction=reference["lannister"])
    p3 = add_participant(session=session, user=player_two, faction=reference["greyjoy"])
    session.status = GameSession.Status.CANCELLED
    session.save(update_fields=["status", "updated_at"])

    with pytest.raises(ValidationError) as exc_info:
        finalize_session(
            session=session,
            rounds_played=8,
            end_reason=Outcome.EndReason.OTHER,
            mvp=None,
            final_note="",
            participations=_build_finalize_payload(
                p1,
                p2,
                p3,
                places=[1, 2, 3],
                castles=[7, 5, 3],
            ),
        )

    assert exc_info.value.message_dict == {
        "session": ["Only planned sessions can be modified."]
    }
