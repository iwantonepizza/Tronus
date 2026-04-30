from __future__ import annotations

import random as _random
from datetime import datetime

from django.core.exceptions import ValidationError
from django.db import transaction

from apps.accounts.models import User
from apps.comments.models import MatchComment
from apps.reference.models import Faction, GameMode, HouseDeck

from .event_cards import WESTEROS_DECKS, WILDLINGS_OUTCOME_CARDS
from .models import (
    GameSession,
    MatchTimelineEvent,
    Outcome,
    Participation,
    RoundSnapshot,
    SessionInvite,
)

UNSET = object()
ALL_FACTION_SLUGS = {
    "stark",
    "lannister",
    "baratheon",
    "greyjoy",
    "tyrell",
    "martell",
    "arryn",
    "targaryen",
}


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
        raise ValidationError({"session": ["Изменять можно только запланированные партии."]})


def _ensure_session_is_in_progress(*, session: GameSession) -> None:
    if session.status != GameSession.Status.IN_PROGRESS:
        raise ValidationError(
            {"session": ["Действие доступно только для партий в процессе игры."]}
        )


def _ensure_mode_can_fit_participants(*, mode: GameMode, participant_count: int) -> None:
    if participant_count > mode.max_players:
        raise ValidationError(
            {"mode": [f"Режим '{mode.slug}' поддерживает не более {mode.max_players} игроков."]}
        )


def _is_int_like(value: object) -> bool:
    return isinstance(value, int) and not isinstance(value, bool)


def _get_allowed_factions_for(*, mode: GameMode, player_count: int) -> set[str] | None:
    if mode.factions_by_player_count:
        allowed_factions = mode.factions_by_player_count.get(str(player_count))
        if allowed_factions is None:
            return None
        return set(allowed_factions)

    return set(mode.allowed_factions or ALL_FACTION_SLUGS)


def validate_session_setup(*, mode: GameMode, faction_slugs: list[str]) -> None:
    player_count = len(faction_slugs)
    errors: dict[str, list[str]] = {}

    if player_count < mode.min_players or player_count > mode.max_players:
        errors["players"] = [
            (
                f"Режим '{mode.slug}' поддерживает от {mode.min_players} "
                f"до {mode.max_players} игроков."
            )
        ]

    if len(set(faction_slugs)) != player_count:
        errors.setdefault("factions", []).append("Повторяющиеся фракции недопустимы.")

    allowed_factions = _get_allowed_factions_for(mode=mode, player_count=player_count)
    if allowed_factions is not None:
        invalid_factions = sorted({slug for slug in faction_slugs if slug not in allowed_factions})
        for faction_slug in invalid_factions:
            errors.setdefault("factions", []).append(
                f"Фракция '{faction_slug}' недоступна в режиме '{mode.slug}'."
            )

    for faction_slug in mode.required_factions:
        if faction_slug not in faction_slugs:
            errors.setdefault("factions", []).append(
                f"Фракция '{faction_slug}' обязательна для режима '{mode.slug}'."
            )

    if errors:
        raise ValidationError(errors)


@transaction.atomic
def create_session(
    *,
    created_by: User,
    scheduled_at: datetime,
    mode: GameMode,
    deck: HouseDeck,
    planning_note: str = "",
) -> GameSession:
    return GameSession.objects.create(
        created_by=created_by,
        scheduled_at=scheduled_at,
        mode=mode,
        house_deck=deck,
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
        errors["user"] = ["Этот пользователь уже участвует в партии."]

    if locked_session.participations.filter(faction=faction).exists():
        errors["faction"] = ["Эта фракция уже занята в партии."]

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
            errors["faction"] = ["Эта фракция уже занята в партии."]
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
    deck: HouseDeck | object = UNSET,
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
        locked_session.house_deck = deck
        update_fields.append("house_deck")

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

    # Cancel is allowed from both planned and in_progress (ADR-0009)
    if locked_session.status not in (
        GameSession.Status.PLANNED,
        GameSession.Status.IN_PROGRESS,
    ):
        raise ValidationError(
            {"session": ["Отменить можно только запланированную или начатую партию."]}
        )

    locked_session.status = GameSession.Status.CANCELLED
    locked_session.save(update_fields=["status", "updated_at"])
    return locked_session


@transaction.atomic
def start_session(
    *,
    session: GameSession,
    factions_assignment: dict[int, str],
) -> GameSession:
    """Transition session from ``planned`` → ``in_progress`` (ADR-0009).

    ``factions_assignment`` maps user_id → faction_slug for every player
    that should participate.  All assigned users must have a SessionInvite
    with ``rsvp_status=going`` for this session.

    Side-effects:
    - Creates ``Participation`` records for each entry in the assignment.
    - Creates the initial ``RoundSnapshot`` (round_number=0, ADR-0010).
    - Sets session.status = IN_PROGRESS.
    """
    locked_session = _get_locked_session(session_id=session.pk)
    _ensure_session_is_planned(session=locked_session)

    if not factions_assignment:
        raise ValidationError(
            {"factions_assignment": ["Необходимо указать хотя бы одного участника."]}
        )

    user_ids = list(factions_assignment.keys())

    # ── 1. Validate all assigned users have going invite ──────────────────
    going_user_ids: set[int] = set(
        SessionInvite.objects.filter(
            session=locked_session,
            user_id__in=user_ids,
            rsvp_status=SessionInvite.RsvpStatus.GOING,
        ).values_list("user_id", flat=True)
    )
    not_going = [uid for uid in user_ids if uid not in going_user_ids]
    if not_going:
        raise ValidationError(
            {
                "factions_assignment": [
                    f"Пользователь(и) {not_going} не имеют приглашения со статусом 'going'."
                ]
            }
        )

    # ── 2. Validate faction slugs exist ───────────────────────────────────
    faction_slugs = list(factions_assignment.values())
    existing_slugs: set[str] = set(
        Faction.objects.filter(slug__in=faction_slugs).values_list("slug", flat=True)
    )
    unknown = [s for s in faction_slugs if s not in existing_slugs]
    if unknown:
        raise ValidationError(
            {"factions_assignment": [f"Неизвестные фракции: {unknown}."]}
        )

    # ── 3. Validate game-mode rules (player count, allowed factions, etc.) ─
    validate_session_setup(mode=locked_session.mode, faction_slugs=faction_slugs)

    # ── 4. Create Participation records ───────────────────────────────────
    faction_objs: dict[str, Faction] = {
        f.slug: f for f in Faction.objects.filter(slug__in=faction_slugs)
    }
    participations: list[Participation] = []
    for user_id, faction_slug in factions_assignment.items():
        participations.append(
            Participation(
                session=locked_session,
                user_id=user_id,
                faction=faction_objs[faction_slug],
                joined_at_round=0,
            )
        )
    Participation.objects.bulk_create(participations)

    # Reload with PKs assigned by bulk_create
    created_participations = list(
        Participation.objects.filter(session=locked_session).order_by("pk")
    )

    # ── 5. Create initial RoundSnapshot (round 0) ─────────────────────────
    # Influence tracks start empty — first real positions set after round 1.
    # Supply defaults to 1 per player; castles to 0 (faction starting values
    # will be seeded when faction.starting_castles is added in a future task).
    p_ids = [p.pk for p in created_participations]
    RoundSnapshot.objects.create(
        session=locked_session,
        round_number=0,
        influence_throne=list(p_ids),
        influence_sword=list(p_ids),
        influence_court=list(p_ids),
        supply={str(pid): 1 for pid in p_ids},
        castles={str(pid): 0 for pid in p_ids},
        wildlings_threat=4,
    )

    # ── 6. Transition status ──────────────────────────────────────────────
    locked_session.status = GameSession.Status.IN_PROGRESS
    locked_session.save(update_fields=["status", "updated_at"])
    return locked_session


# ---------------------------------------------------------------------------
# T-101: Round system (ADR-0010)
# ---------------------------------------------------------------------------

VALID_WILDLINGS_THREAT: frozenset[int] = frozenset([0, 2, 4, 6, 8, 10, 12])


@transaction.atomic
def complete_round(
    *,
    session: GameSession,
    influence_throne: list[int],
    influence_sword: list[int],
    influence_court: list[int],
    supply: dict[str, int],
    castles: dict[str, int],
    wildlings_threat: int,
    note: str = "",
) -> RoundSnapshot:
    """Record the end-of-round board state as an immutable snapshot (ADR-0010).

    The next round number is inferred from the last existing snapshot — callers
    do not pass it explicitly.  All participation_ids in the tracks/supply/castles
    maps must belong to the session; no extra or missing ids are allowed.
    """
    locked_session = _get_locked_session(session_id=session.pk)
    _ensure_session_is_in_progress(session=locked_session)

    # Load current participations and last snapshot inside the lock
    participation_ids: list[int] = list(
        Participation.objects.filter(session=locked_session)
        .order_by("pk")
        .values_list("pk", flat=True)
    )
    if not participation_ids:
        raise ValidationError({"session": ["Нет участников в партии."]})

    last_snapshot = (
        RoundSnapshot.objects.filter(session=locked_session).order_by("-round_number").first()
    )
    # round_number=0 is always created by start_session, so last_snapshot is never None here
    next_round = last_snapshot.round_number + 1  # type: ignore[union-attr]

    if next_round > locked_session.mode.max_rounds:
        raise ValidationError(
            {
                "round": [
                    f"Максимальное количество раундов для режима "
                    f"'{locked_session.mode.slug}' — {locked_session.mode.max_rounds}."
                ]
            }
        )

    _validate_round_payload(
        participation_ids=participation_ids,
        influence_throne=influence_throne,
        influence_sword=influence_sword,
        influence_court=influence_court,
        supply=supply,
        castles=castles,
        wildlings_threat=wildlings_threat,
    )

    return RoundSnapshot.objects.create(
        session=locked_session,
        round_number=next_round,
        influence_throne=influence_throne,
        influence_sword=influence_sword,
        influence_court=influence_court,
        supply=supply,
        castles=castles,
        wildlings_threat=wildlings_threat,
        note=note.strip(),
    )


def _validate_round_payload(
    *,
    participation_ids: list[int],
    influence_throne: list[int],
    influence_sword: list[int],
    influence_court: list[int],
    supply: dict[str, int],
    castles: dict[str, int],
    wildlings_threat: int,
) -> None:
    """Validate all fields of a round payload against the session's participations."""
    expected_ids = set(participation_ids)
    str_expected = {str(pid) for pid in participation_ids}
    errors: dict[str, list[str]] = {}

    # Influence tracks: ordered lists, each must be a permutation of participation_ids
    for track_name, track in (
        ("influence_throne", influence_throne),
        ("influence_sword", influence_sword),
        ("influence_court", influence_court),
    ):
        if set(track) != expected_ids or len(track) != len(participation_ids):
            errors.setdefault(track_name, []).append(
                f"Трек '{track_name}' должен содержать ровно по одному ID каждого участника."
            )

    # Supply: keys must be str(participation_ids), values 0..6
    if set(supply.keys()) != str_expected:
        errors.setdefault("supply", []).append(
            "Ключи supply должны соответствовать ID участников партии."
        )
    else:
        for pid, val in supply.items():
            if not isinstance(val, int) or val < 0 or val > 6:
                errors.setdefault("supply", []).append(
                    f"Значение supply для участника {pid} должно быть целым числом от 0 до 6."
                )

    # Castles: keys must be str(participation_ids), values 0..7
    if set(castles.keys()) != str_expected:
        errors.setdefault("castles", []).append(
            "Ключи castles должны соответствовать ID участников партии."
        )
    else:
        for pid, val in castles.items():
            if not isinstance(val, int) or val < 0 or val > 7:
                errors.setdefault("castles", []).append(
                    f"Значение castles для участника {pid} должно быть целым числом от 0 до 7."
                )

    # Wildlings threat: must be one of the valid positions
    if wildlings_threat not in VALID_WILDLINGS_THREAT:
        errors["wildlings_threat"] = [
            f"wildlings_threat должен быть одним из: {sorted(VALID_WILDLINGS_THREAT)}."
        ]

    if errors:
        raise ValidationError(errors)


@transaction.atomic
def discard_last_round(*, session: GameSession) -> None:
    """Delete the most recent RoundSnapshot (admin undo, ADR-0010).

    Round 0 (initial snapshot) cannot be discarded — it is the anchor for the
    entire round sequence and is removed only when the session is cancelled.
    """
    locked_session = _get_locked_session(session_id=session.pk)
    _ensure_session_is_in_progress(session=locked_session)

    last_snapshot = (
        RoundSnapshot.objects.select_for_update()
        .filter(session=locked_session)
        .order_by("-round_number")
        .first()
    )
    if last_snapshot is None or last_snapshot.round_number == 0:
        raise ValidationError(
            {"round": ["Нет раундов для удаления (начальный снимок не удаляется)."]}
        )
    last_snapshot.delete()


@transaction.atomic
def finalize_session(
    *,
    session: GameSession,
    mvp: User | None = None,
    final_note: str = "",
) -> Outcome:
    """Transition session from ``in_progress`` → ``completed`` (CR-007 / ADR-0009).

    Winner and places are computed automatically from the last ``RoundSnapshot``:
    - Candidates for 1st place = participations with ``castles == 7``.
    - If no one has 7 castles → ``ValidationError("no_winner_yet")``.
    - Tiebreak: highest position on ``influence_throne`` (lower index = higher).
    - Remaining places: sorted by (castles desc, throne position asc).
    """
    locked_session = _get_locked_session(session_id=session.pk)
    _ensure_session_is_in_progress(session=locked_session)

    if hasattr(locked_session, "outcome"):
        raise ValidationError({"session": ["У этой партии уже есть итог."]})

    locked_participations = list(
        Participation.objects.select_for_update()
        .filter(session=locked_session)
        .select_related("user", "faction")
        .order_by("pk")
    )
    if len(locked_participations) < locked_session.mode.min_players:
        raise ValidationError(
            {
                "session": [
                    f"Для завершения партии в режиме '{locked_session.mode.slug}' "
                    f"нужно минимум {locked_session.mode.min_players} игрока(ов)."
                ]
            }
        )

    # Validate MVP belongs to session
    session_user_ids = {p.user_id for p in locked_participations}
    if mvp is not None and mvp.pk not in session_user_ids:
        raise ValidationError({"mvp": ["MVP должен быть одним из участников партии."]})

    # ── Compute places from last RoundSnapshot ────────────────────────────
    last_snapshot = (
        RoundSnapshot.objects.filter(session=locked_session).order_by("-round_number").first()
    )
    if last_snapshot is None:
        raise ValidationError({"session": ["Нет данных раундов для финализации."]})

    castles_map: dict[int, int] = {
        int(pid): val for pid, val in last_snapshot.castles.items()
    }
    throne_track: list[int] = last_snapshot.influence_throne  # ordered list of participation_ids

    def throne_pos(pid: int) -> int:
        try:
            return throne_track.index(pid)
        except ValueError:
            return len(throne_track)  # not found → worst position

    winners = [p for p in locked_participations if castles_map.get(p.pk, 0) == 7]
    if not winners:
        raise ValidationError(
            {
                "session": [
                    "Финализировать нельзя: ни у одного участника нет 7 замков. "
                    "Продолжайте игру или добавьте раунд с победителем."
                ],
                "code": ["no_winner_yet"],
            }
        )

    # Sort all by (-castles, throne_position) to get full ranking
    sorted_parts = sorted(
        locked_participations,
        key=lambda p: (-castles_map.get(p.pk, 0), throne_pos(p.pk)),
    )

    rounds_played = last_snapshot.round_number
    end_reason = Outcome.EndReason.CASTLES_7

    for rank, participation in enumerate(sorted_parts, start=1):
        participation.place = rank
        participation.castles = castles_map.get(participation.pk, 0)
        participation.is_winner = rank == 1
        participation.save(update_fields=["place", "castles", "is_winner", "updated_at"])

    outcome = Outcome.objects.create(
        session=locked_session,
        rounds_played=max(rounds_played, 1),
        end_reason=end_reason,
        mvp=mvp,
        final_note=final_note.strip(),
    )
    locked_session.status = GameSession.Status.COMPLETED
    locked_session.save(update_fields=["status", "updated_at"])
    return outcome

# ---------------------------------------------------------------------------
# T-120: Invitations & RSVP (ADR-0013)
# ---------------------------------------------------------------------------


@transaction.atomic
def invite_user(
    *,
    session: GameSession,
    inviter: User,
    invitee: User,
) -> SessionInvite:
    """Creator invites a specific user. Invite starts as ``invited`` (no response)."""
    locked_session = _get_locked_session(session_id=session.pk)
    _ensure_session_is_planned(session=locked_session)

    if SessionInvite.objects.filter(session=locked_session, user=invitee).exists():
        raise ValidationError({"user": ["Этот пользователь уже приглашён в партию."]})

    invite = SessionInvite.objects.create(
        session=locked_session,
        user=invitee,
        invited_by=inviter,
        rsvp_status=SessionInvite.RsvpStatus.INVITED,
    )

    # Notify invitee about new invite. Defensive: never block the invite flow
    # on a notification failure (e.g. unknown kind, race in DB).
    from apps.notifications.services import create_notification  # noqa: PLC0415

    try:
        create_notification(
            user_id=invitee.pk,
            kind="invite_received",
            payload={
                "session_id": locked_session.pk,
                "invited_by_id": inviter.pk,
                "invited_by_nickname": getattr(
                    getattr(inviter, "profile", None),
                    "nickname",
                    inviter.username,
                ),
            },
        )
    except Exception:  # pragma: no cover — never break invite on notif failure
        pass
    return invite


@transaction.atomic
def self_invite(*, session: GameSession, user: User) -> SessionInvite:
    """Player self-registers as going (no creator action needed)."""
    locked_session = _get_locked_session(session_id=session.pk)
    _ensure_session_is_planned(session=locked_session)

    if SessionInvite.objects.filter(session=locked_session, user=user).exists():
        raise ValidationError({"user": ["Вы уже добавлены в эту партию."]})

    return SessionInvite.objects.create(
        session=locked_session,
        user=user,
        invited_by=None,
        rsvp_status=SessionInvite.RsvpStatus.GOING,
    )


UNSET_INVITE = object()


@transaction.atomic
def update_rsvp(
    *,
    invite: SessionInvite,
    rsvp_status: str | object = UNSET_INVITE,
    desired_faction: object = UNSET_INVITE,
) -> SessionInvite:
    """Player changes their RSVP status and/or desired faction."""
    locked_invite = (
        SessionInvite.objects.select_for_update()
        .select_related("session__mode")
        .get(pk=invite.pk)
    )
    _ensure_session_is_planned(session=locked_invite.session)

    update_fields: list[str] = []

    if rsvp_status is not UNSET_INVITE:
        locked_invite.rsvp_status = str(rsvp_status)
        update_fields.append("rsvp_status")

    if desired_faction is not UNSET_INVITE:
        # desired_faction may be a Faction instance or None
        locked_invite.desired_faction = desired_faction  # type: ignore[assignment]
        update_fields.append("desired_faction")

    if update_fields:
        update_fields.append("updated_at")
        locked_invite.save(update_fields=update_fields)

    # Notify session creator when invitee responds (going / declined).
    # `maybe` and `invited` don't trigger a notification.
    if rsvp_status is not UNSET_INVITE and str(rsvp_status) in (
        SessionInvite.RsvpStatus.GOING,
        SessionInvite.RsvpStatus.DECLINED,
    ):
        from apps.notifications.services import create_notification  # noqa: PLC0415

        kind = (
            "invite_accepted"
            if str(rsvp_status) == SessionInvite.RsvpStatus.GOING
            else "invite_declined"
        )
        # Don't fail the RSVP update if the notification subsystem misbehaves —
        # users care more about their RSVP working than the creator getting a ping.
        try:
            create_notification(
                user_id=locked_invite.session.created_by_id,
                kind=kind,
                payload={
                    "session_id": locked_invite.session_id,
                    "user_id": locked_invite.user_id,
                },
            )
        except Exception:  # pragma: no cover — defensive, never break RSVP on notif fail
            pass

    return locked_invite


@transaction.atomic
def withdraw_invite(*, invite: SessionInvite) -> None:
    """Delete an invite — creator withdraws or player un-registers."""
    locked_invite = (
        SessionInvite.objects.select_for_update().select_related("session").get(pk=invite.pk)
    )
    _ensure_session_is_planned(session=locked_invite.session)
    locked_invite.delete()


# ---------------------------------------------------------------------------
# T-121: Random faction assignment
# ---------------------------------------------------------------------------


def randomize_factions(*, session: GameSession) -> dict[int, str]:
    """Return a random faction assignment for all going invites (preview, no side effects).

    Respects mode rules: uses ``factions_by_player_count`` if set, otherwise
    ``allowed_factions``. Also honours ``required_factions`` (e.g. Targaryen
    for Mother of Dragons).  Raises ``ValidationError`` if there are not
    enough allowed factions for the number of going players.
    """
    going_invites = list(
        SessionInvite.objects.filter(
            session=session, rsvp_status=SessionInvite.RsvpStatus.GOING
        ).values_list("user_id", flat=True)
    )
    if not going_invites:
        raise ValidationError({"session": ["Нет игроков со статусом 'going'."]})

    mode = GameSession.objects.select_related("mode").get(pk=session.pk).mode
    player_count = len(going_invites)

    allowed = _get_allowed_factions_for(mode=mode, player_count=player_count)
    if allowed is None:
        raise ValidationError(
            {
                "factions": [
                    f"Нет допустимых фракций для {player_count} игроков в режиме "
                    f"'{mode.slug}'."
                ]
            }
        )

    available = list(allowed)
    if len(available) < player_count:
        raise ValidationError(
            {
                "factions": [
                    f"Недостаточно фракций для {player_count} игроков "
                    f"(доступно {len(available)})."
                ]
            }
        )

    # Honour required factions — they must be in the assignment
    required = list(mode.required_factions)
    pool = [f for f in available if f not in required]
    _random.shuffle(pool)

    chosen: list[str] = required + pool
    chosen = chosen[:player_count]
    _random.shuffle(chosen)

    return dict(zip(going_invites, chosen, strict=True))

# ---------------------------------------------------------------------------
# T-122: Replace participant (ADR-0013 §replacement)
# ---------------------------------------------------------------------------


@transaction.atomic
def replace_participant(
    *,
    session: GameSession,
    out_user: User,
    in_user: User,
) -> Participation:
    """Swap one player for another mid-game (ADR-0013).

    The outgoing Participation gets ``left_at_round`` = current round.
    A new Participation is created with the same faction.
    A ``participant_replaced`` timeline event is recorded.
    """
    locked_session = _get_locked_session(session_id=session.pk)
    _ensure_session_is_in_progress(session=locked_session)

    out_participation = (
        Participation.objects.select_for_update()
        .filter(session=locked_session, user=out_user, left_at_round__isnull=True)
        .select_related("faction")
        .first()
    )
    if out_participation is None:
        raise ValidationError({"out_user": ["Игрок не является активным участником партии."]})

    if Participation.objects.filter(
        session=locked_session,
        user=in_user,
        left_at_round__isnull=True,
    ).exists():
        raise ValidationError({"in_user": ["Новый игрок уже участвует в этой партии."]})

    last_snapshot = (
        RoundSnapshot.objects.filter(session=locked_session).order_by("-round_number").first()
    )
    current_round = last_snapshot.round_number if last_snapshot else 0

    # Mark outgoing as having left
    out_participation.left_at_round = current_round
    out_participation.save(update_fields=["left_at_round", "updated_at"])

    # Create incoming participation with same faction
    in_participation = Participation.objects.create(
        session=locked_session,
        user=in_user,
        faction=out_participation.faction,
        joined_at_round=current_round,
    )
    out_participation.replaced_by_participation = in_participation
    out_participation.save(update_fields=["replaced_by_participation_id", "updated_at"])

    # Record timeline event
    event = MatchTimelineEvent.objects.create(
        session=locked_session,
        kind=MatchTimelineEvent.Kind.PARTICIPANT_REPLACED,
        payload={
            "out_participation_id": out_participation.pk,
            "in_participation_id": in_participation.pk,
            "faction_slug": out_participation.faction.slug,
            "round_number": current_round,
        },
    )
    MatchComment.objects.create(
        session=locked_session,
        author=None,
        body=(
            f"Летописец: игрок заменён на раунде {current_round} "
            f"(фракция {out_participation.faction.slug})."
        ),
        chronicler_event=event,
    )
    return in_participation


# ---------------------------------------------------------------------------
# T-102: Wildlings raid timeline event (ADR-0014)
# ---------------------------------------------------------------------------


@transaction.atomic
def record_wildlings_raid(
    *,
    session: GameSession,
    actor: User,
    bids: list[dict],
    outcome: str,
    outcome_card_slug: str | None = None,
    wildlings_threat_after: int,
) -> MatchTimelineEvent:
    """Record a wildlings raid event (T-102 / ADR-0014)."""

    locked_session = _get_locked_session(session_id=session.pk)
    _ensure_session_is_in_progress(session=locked_session)

    if outcome not in ("win", "loss"):
        raise ValidationError({"outcome": ["Должно быть 'win' или 'loss'."]})

    if wildlings_threat_after not in VALID_WILDLINGS_THREAT:
        raise ValidationError(
            {"wildlings_threat_after": ["Недопустимое значение угрозы одичалых."]}
        )

    if outcome_card_slug is not None and outcome_card_slug not in WILDLINGS_OUTCOME_CARDS:
        raise ValidationError(
            {"outcome_card_slug": [f"Неизвестная карта исхода: '{outcome_card_slug}'."]}
        )

    # Validate bid participation_ids belong to session
    valid_p_ids = set(
        Participation.objects.filter(session=locked_session).values_list("pk", flat=True)
    )
    for bid in bids:
        pid = bid.get("participation_id")
        amount = bid.get("amount", 0)
        if pid not in valid_p_ids:
            raise ValidationError({"bids": [f"Участник {pid} не относится к этой партии."]})
        if not isinstance(amount, int) or amount < 0:
            raise ValidationError({"bids": ["Ставка должна быть неотрицательным целым числом."]})

    event = MatchTimelineEvent.objects.create(
        session=locked_session,
        kind=MatchTimelineEvent.Kind.WILDLINGS_RAID,
        actor=actor,
        payload={
            "bids": bids,
            "outcome": outcome,
            "outcome_card_slug": outcome_card_slug,
            "wildlings_threat_after": wildlings_threat_after,
        },
    )
    outcome_text = "отбита" if outcome == "win" else "прорвалась"
    MatchComment.objects.create(
        session=locked_session,
        author=None,
        body=(
            f"Летописец: атака одичалых {outcome_text}. "
            f"Угроза после атаки: {wildlings_threat_after}."
        ),
        chronicler_event=event,
    )
    return event


# ---------------------------------------------------------------------------
# T-103: Clash of Kings timeline event
# ---------------------------------------------------------------------------


@transaction.atomic
def record_clash_of_kings(
    *,
    session: GameSession,
    actor: User,
    tracks: dict,
) -> MatchTimelineEvent:
    """Record a clash of kings event (T-103 / ADR-0014).

    ``tracks`` schema:
    {
      "influence_throne": [{"participation_id": int, "bid": int, "place": int}, ...],
      "influence_sword":  [...],
      "influence_court":  [...],
    }
    """
    locked_session = _get_locked_session(session_id=session.pk)
    _ensure_session_is_in_progress(session=locked_session)

    valid_p_ids = set(
        Participation.objects.filter(session=locked_session).values_list("pk", flat=True)
    )
    errors: dict[str, list[str]] = {}

    for track_name in ("influence_throne", "influence_sword", "influence_court"):
        track_data = tracks.get(track_name, [])
        for entry in track_data:
            pid = entry.get("participation_id")
            if pid not in valid_p_ids:
                errors.setdefault(track_name, []).append(
                    f"Участник {pid} не относится к этой партии."
                )
            if not isinstance(entry.get("bid", 0), int) or entry.get("bid", 0) < 0:
                errors.setdefault(track_name, []).append("Ставка должна быть ≥ 0.")

    if errors:
        raise ValidationError(errors)

    event = MatchTimelineEvent.objects.create(
        session=locked_session,
        kind=MatchTimelineEvent.Kind.CLASH_OF_KINGS,
        actor=actor,
        payload={"tracks": tracks},
    )
    MatchComment.objects.create(
        session=locked_session,
        author=None,
        body="Летописец: битва королей завершена.",
        chronicler_event=event,
    )
    return event


# ---------------------------------------------------------------------------
# T-104: Event card played
# ---------------------------------------------------------------------------


@transaction.atomic
def record_event_card_played(
    *,
    session: GameSession,
    actor: User,
    deck_number: int,
    card_slug: str,
) -> MatchTimelineEvent:
    """Record that an event card was played from a specific Westeros deck (T-104)."""

    locked_session = _get_locked_session(session_id=session.pk)
    _ensure_session_is_in_progress(session=locked_session)

    mode_slug = locked_session.mode.slug
    deck_key = (mode_slug, deck_number)
    if deck_key not in WESTEROS_DECKS:
        raise ValidationError(
            {"deck_number": [f"Колода {deck_number} недоступна для режима '{mode_slug}'."]}
        )

    valid_cards = WESTEROS_DECKS[deck_key]
    if card_slug not in valid_cards:
        raise ValidationError(
            {"card_slug": [f"Карта '{card_slug}' отсутствует в колоде {deck_number}."]}
        )

    event = MatchTimelineEvent.objects.create(
        session=locked_session,
        kind=MatchTimelineEvent.Kind.EVENT_CARD_PLAYED,
        actor=actor,
        payload={"deck_number": deck_number, "card_slug": card_slug},
    )
    MatchComment.objects.create(
        session=locked_session,
        author=None,
        body=f"Летописец: сыграна карта '{card_slug}' из колоды {deck_number}.",
        chronicler_event=event,
    )
    return event


# ---------------------------------------------------------------------------
# Wave 9 — T-130: Retroactive (played) sessions
# ---------------------------------------------------------------------------
#
# Use case: the owner just finished a real-life game and wants to record the
# result without going through the planned → invites → in_progress → rounds
# → finalize flow. They only know who played, what faction each person had,
# what place they took and how many castles they ended on.
#
# This service short-circuits the lifecycle in a single atomic step:
#   1. Validate session is still ``planned`` (otherwise use the regular flow).
#   2. Validate the supplied roster against mode rules (player count, factions).
#   3. Create Participations directly, with place / castles / is_winner already
#      filled in.
#   4. Create a single synthetic RoundSnapshot (round_number = rounds_played)
#      so that downstream stats / fun_facts code that expects a snapshot still
#      finds one.
#   5. Create the Outcome and bump status to ``completed`` in the same txn.
#
# Reference: USER_FEEDBACK 2026-04-30, ADR-0009 §revisit (no schema change).


@transaction.atomic
def finalize_played_session(
    *,
    session: GameSession,
    results: list[dict],
    rounds_played: int = 1,
    end_reason: str = "other",
    mvp: User | None = None,
    final_note: str = "",
) -> Outcome:
    """planned → completed in one shot for retroactive game logging.

    ``results`` is a list of dicts, one per participant::

        {"user_id": 17, "faction_slug": "stark", "place": 1, "castles": 7}

    Exactly one entry must have ``place == 1`` and that entry's user becomes
    the winner. Castles are validated 0..7. Places must form 1..N with no
    gaps or duplicates.
    """
    locked_session = _get_locked_session(session_id=session.pk)

    # Allow retroactive finalize only from `planned`. If the user already
    # started rounds they should use the regular finalize_session flow.
    if locked_session.status != GameSession.Status.PLANNED:
        raise ValidationError(
            {
                "session": [
                    "Ретроактивно завершить можно только запланированную партию. "
                    "Если партия уже идёт — отметьте раунды и используйте обычное "
                    "завершение."
                ]
            }
        )

    if locked_session.participations.exists():
        raise ValidationError(
            {
                "session": [
                    "В этой партии уже есть участники. Удалите их вручную или "
                    "используйте обычное завершение."
                ]
            }
        )

    if not results:
        raise ValidationError({"results": ["Нужен хотя бы один участник."]})

    # ── 1. Field-level validation ─────────────────────────────────────────
    errors: dict[str, list[str]] = {}
    user_ids: list[int] = []
    faction_slugs: list[str] = []
    places: list[int] = []
    for index, item in enumerate(results):
        prefix = f"results[{index}]"
        uid = item.get("user_id")
        slug = item.get("faction_slug")
        place = item.get("place")
        castles = item.get("castles", 0)

        if not isinstance(uid, int) or uid <= 0:
            errors.setdefault(prefix, []).append("user_id обязателен.")
            continue
        if not isinstance(slug, str) or not slug:
            errors.setdefault(prefix, []).append("faction_slug обязателен.")
            continue
        if not isinstance(place, int) or place < 1:
            errors.setdefault(prefix, []).append("place должен быть положительным целым.")
            continue
        if not isinstance(castles, int) or castles < 0 or castles > 7:
            errors.setdefault(prefix, []).append("castles должно быть целым 0..7.")
            continue

        user_ids.append(uid)
        faction_slugs.append(slug)
        places.append(place)

    if errors:
        raise ValidationError(errors)

    if len(set(user_ids)) != len(user_ids):
        raise ValidationError({"results": ["Игрок встречается несколько раз."]})

    expected_places = sorted(range(1, len(results) + 1))
    if sorted(places) != expected_places:
        raise ValidationError(
            {"results": [f"Места должны быть 1..{len(results)} без повторов и пропусков."]}
        )

    if len(set(faction_slugs)) != len(faction_slugs):
        raise ValidationError({"results": ["Каждая фракция может быть выбрана один раз."]})

    # ── 2. Mode rules ──────────────────────────────────────────────────────
    validate_session_setup(mode=locked_session.mode, faction_slugs=faction_slugs)

    # ── 3. Resolve Faction and User instances ──────────────────────────────
    faction_objs: dict[str, Faction] = {
        f.slug: f for f in Faction.objects.filter(slug__in=faction_slugs)
    }
    missing_factions = [s for s in faction_slugs if s not in faction_objs]
    if missing_factions:
        raise ValidationError(
            {"results": [f"Неизвестные фракции: {missing_factions}."]}
        )

    found_users = {u.pk: u for u in User.objects.filter(pk__in=user_ids)}
    missing_users = [uid for uid in user_ids if uid not in found_users]
    if missing_users:
        raise ValidationError(
            {"results": [f"Не найдены пользователи: {missing_users}."]}
        )

    if mvp is not None and mvp.pk not in found_users:
        raise ValidationError({"mvp": ["MVP должен быть одним из участников партии."]})

    if end_reason not in {choice for choice, _ in Outcome.EndReason.choices}:
        raise ValidationError({"end_reason": [f"Недопустимое значение: '{end_reason}'."]})

    # ── 4. Create Participations with final places / castles ──────────────
    # Sort by place so participation IDs come out in result order — purely
    # cosmetic but keeps the participation list stable in the UI.
    sorted_results = sorted(results, key=lambda r: r["place"])
    created_parts: list[Participation] = []
    for item in sorted_results:
        is_winner = item["place"] == 1
        created_parts.append(
            Participation.objects.create(
                session=locked_session,
                user=found_users[item["user_id"]],
                faction=faction_objs[item["faction_slug"]],
                place=item["place"],
                castles=int(item.get("castles") or 0),
                is_winner=is_winner,
                joined_at_round=0,
            )
        )

    # ── 5. Synthetic RoundSnapshot for stats / fun-facts compatibility ─────
    # Some downstream selectors (fun_facts) expect at least one snapshot. We
    # produce one snapshot at round_number = rounds_played that mirrors the
    # final castles state. Influence tracks are filled with participation IDs
    # in place order; supply defaults to 1 per player.
    p_ids = [p.pk for p in created_parts]
    RoundSnapshot.objects.create(
        session=locked_session,
        round_number=max(1, int(rounds_played or 1)),
        influence_throne=list(p_ids),
        influence_sword=list(p_ids),
        influence_court=list(p_ids),
        supply={str(pid): 1 for pid in p_ids},
        castles={str(p.pk): int(p.castles or 0) for p in created_parts},
        wildlings_threat=4,
        note="Снимок создан автоматически для ретроактивной записи партии.",
    )

    # ── 6. Outcome + status transition ─────────────────────────────────────
    outcome = Outcome.objects.create(
        session=locked_session,
        rounds_played=max(1, int(rounds_played or 1)),
        end_reason=end_reason,
        mvp=mvp,
        final_note=(final_note or "").strip(),
    )
    locked_session.status = GameSession.Status.COMPLETED
    locked_session.save(update_fields=["status", "updated_at"])

    # Chronicler entry so the history shows this was retroactive.
    MatchComment.objects.create(
        session=locked_session,
        author=None,
        body="Летописец: партия записана задним числом без отметки раундов.",
    )
    return outcome
