from __future__ import annotations

from datetime import datetime

from django.core.exceptions import ValidationError
from django.db import transaction

from apps.accounts.models import User
from apps.reference.models import Deck, Faction, GameMode

from .models import GameSession, Outcome, Participation

UNSET = object()


def _get_locked_session(*, session_id: int) -> GameSession:
    return GameSession.objects.select_for_update().select_related("mode").get(pk=session_id)


def _get_locked_participation(*, participation_id: int) -> Participation:
    return (
        Participation.objects.select_for_update()
        .select_related("session__mode")
        .get(pk=participation_id)
    )


def _ensure_session_is_planned(*, session: GameSession) -> None:
    if session.status != GameSession.Status.PLANNED:
        raise ValidationError({"session": ["Only planned sessions can be modified."]})


def _ensure_mode_can_fit_participants(*, mode: GameMode, participant_count: int) -> None:
    if participant_count > mode.max_players:
        raise ValidationError(
            {"mode": [f"Mode '{mode.slug}' supports at most {mode.max_players} players."]}
        )


def _is_int_like(value: object) -> bool:
    return isinstance(value, int) and not isinstance(value, bool)


@transaction.atomic
def create_session(
    *,
    created_by: User,
    scheduled_at: datetime,
    mode: GameMode,
    deck: Deck,
    planning_note: str = "",
) -> GameSession:
    return GameSession.objects.create(
        created_by=created_by,
        scheduled_at=scheduled_at,
        mode=mode,
        deck=deck,
        planning_note=planning_note.strip(),
    )


@transaction.atomic
def add_participant(
    *,
    session: GameSession,
    user: User,
    faction: Faction,
) -> Participation:
    locked_session = _get_locked_session(session_id=session.pk)
    _ensure_session_is_planned(session=locked_session)

    participant_count = locked_session.participations.count()
    _ensure_mode_can_fit_participants(
        mode=locked_session.mode,
        participant_count=participant_count + 1,
    )

    errors: dict[str, list[str]] = {}

    if locked_session.participations.filter(user=user).exists():
        errors["user"] = ["This user is already participating in the session."]

    if locked_session.participations.filter(faction=faction).exists():
        errors["faction"] = ["This faction is already taken in the session."]

    if errors:
        raise ValidationError(errors)

    return Participation.objects.create(
        session=locked_session,
        user=user,
        faction=faction,
    )


@transaction.atomic
def remove_participant(*, participation: Participation) -> None:
    locked_participation = _get_locked_participation(participation_id=participation.pk)
    _ensure_session_is_planned(session=locked_participation.session)
    locked_participation.delete()


@transaction.atomic
def update_participant(
    *,
    participation: Participation,
    faction: Faction | object = UNSET,
    notes: str | object = UNSET,
) -> Participation:
    locked_participation = _get_locked_participation(participation_id=participation.pk)
    locked_session = locked_participation.session
    _ensure_session_is_planned(session=locked_session)

    errors: dict[str, list[str]] = {}
    update_fields: list[str] = []

    if faction is not UNSET:
        if (
            locked_session.participations.exclude(pk=locked_participation.pk)
            .filter(faction=faction)
            .exists()
        ):
            errors["faction"] = ["This faction is already taken in the session."]
        else:
            locked_participation.faction = faction
            update_fields.append("faction")

    if notes is not UNSET:
        locked_participation.notes = str(notes).strip()
        update_fields.append("notes")

    if errors:
        raise ValidationError(errors)

    if update_fields:
        update_fields.append("updated_at")
        locked_participation.save(update_fields=update_fields)

    return locked_participation


@transaction.atomic
def update_planning(
    *,
    session: GameSession,
    scheduled_at: datetime | object = UNSET,
    mode: GameMode | object = UNSET,
    deck: Deck | object = UNSET,
    planning_note: str | object = UNSET,
) -> GameSession:
    locked_session = _get_locked_session(session_id=session.pk)
    _ensure_session_is_planned(session=locked_session)

    update_fields: list[str] = []

    if scheduled_at is not UNSET:
        locked_session.scheduled_at = scheduled_at
        update_fields.append("scheduled_at")

    if mode is not UNSET:
        participant_count = locked_session.participations.count()
        _ensure_mode_can_fit_participants(mode=mode, participant_count=participant_count)
        locked_session.mode = mode
        update_fields.append("mode")

    if deck is not UNSET:
        locked_session.deck = deck
        update_fields.append("deck")

    if planning_note is not UNSET:
        locked_session.planning_note = str(planning_note).strip()
        update_fields.append("planning_note")

    if update_fields:
        update_fields.append("updated_at")
        locked_session.save(update_fields=update_fields)

    return locked_session


@transaction.atomic
def cancel_session(*, session: GameSession) -> GameSession:
    locked_session = _get_locked_session(session_id=session.pk)
    _ensure_session_is_planned(session=locked_session)

    locked_session.status = GameSession.Status.CANCELLED
    locked_session.save(update_fields=["status", "updated_at"])
    return locked_session


@transaction.atomic
def finalize_session(
    *,
    session: GameSession,
    rounds_played: int,
    end_reason: str,
    mvp: User | None,
    final_note: str,
    participations: list[dict[str, object]],
) -> Outcome:
    locked_session = _get_locked_session(session_id=session.pk)
    _ensure_session_is_planned(session=locked_session)

    locked_participations = list(
        Participation.objects.select_for_update()
        .filter(session=locked_session)
        .select_related("user")
        .order_by("pk")
    )
    _validate_finalize_session(
        session=locked_session,
        session_participations=locked_participations,
        payload=participations,
        mvp=mvp,
    )

    participations_by_id = {
        participation.pk: participation for participation in locked_participations
    }

    for item in participations:
        participation = participations_by_id[int(item["id"])]
        place = int(item["place"])
        participation.place = place
        participation.castles = int(item["castles"])
        participation.is_winner = place == 1
        participation.save(update_fields=["place", "castles", "is_winner", "updated_at"])

    outcome = Outcome.objects.create(
        session=locked_session,
        rounds_played=rounds_played,
        end_reason=end_reason,
        mvp=mvp,
        final_note=final_note.strip(),
    )
    locked_session.status = GameSession.Status.COMPLETED
    locked_session.save(update_fields=["status", "updated_at"])
    return outcome


def _validate_finalize_session(
    *,
    session: GameSession,
    session_participations: list[Participation],
    payload: list[dict[str, object]],
    mvp: User | None,
) -> None:
    participant_count = len(session_participations)
    errors: dict[str, list[str]] = {}

    if participant_count < session.mode.min_players:
        errors["session"] = [
            (
                f"Mode '{session.mode.slug}' requires at least "
                f"{session.mode.min_players} players to finalize."
            )
        ]
    elif participant_count > session.mode.max_players:
        errors["session"] = [
            f"Mode '{session.mode.slug}' supports at most {session.mode.max_players} players."
        ]

    if hasattr(session, "outcome"):
        errors.setdefault("session", []).append("This session already has an outcome.")

    if len(payload) != participant_count:
        errors.setdefault("participations", []).append(
            "All session participations must be provided for finalize."
        )

    session_participations_by_id = {
        participation.pk: participation for participation in session_participations
    }
    session_user_ids = {participation.user_id for participation in session_participations}
    payload_ids: list[int] = []
    places: list[int] = []
    seen_ids: set[int] = set()

    for item in payload:
        participation_id = item.get("id")
        place = item.get("place")
        castles = item.get("castles")

        if not _is_int_like(participation_id):
            errors.setdefault("participations", []).append(
                "Each participation payload entry must include an integer id."
            )
            continue

        if participation_id in seen_ids:
            errors.setdefault("participations", []).append(
                f"Participation #{participation_id} is duplicated in finalize payload."
            )
            continue

        seen_ids.add(participation_id)
        payload_ids.append(participation_id)

        if participation_id not in session_participations_by_id:
            errors.setdefault("participations", []).append(
                f"Participation #{participation_id} does not belong to this session."
            )

        if not _is_int_like(place) or place < 1:
            errors.setdefault("participations", []).append(
                "Each participation must have a positive integer place."
            )
        else:
            places.append(place)

        if not _is_int_like(castles) or castles < 0:
            errors.setdefault("participations", []).append(
                "Each participation must have a non-negative integer castles value."
            )

    if set(payload_ids) != set(session_participations_by_id):
        errors.setdefault("participations", []).append(
            "Finalize payload must match session participants exactly."
        )

    if places and sorted(places) != list(range(1, participant_count + 1)):
        errors.setdefault("participations", []).append(
            "Places must form a contiguous range from 1 to participant count."
        )

    if mvp is not None and mvp.pk not in session_user_ids:
        errors["mvp"] = ["MVP must be one of the session participants."]

    if errors:
        raise ValidationError(errors)
