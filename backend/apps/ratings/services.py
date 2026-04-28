from __future__ import annotations

from datetime import timedelta

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from apps.accounts.models import User
from apps.games.models import GameSession, Outcome, Participation

from .models import MatchVote


def _get_locked_session(*, session_id: int) -> GameSession:
    return GameSession.objects.select_for_update().get(pk=session_id)


def _get_locked_vote(*, vote_id: int) -> MatchVote:
    return (
        MatchVote.objects.select_for_update()
        .select_related("session", "from_user", "to_user")
        .get(pk=vote_id)
    )


def _ensure_session_can_have_votes(*, session: GameSession) -> None:
    if session.status != GameSession.Status.COMPLETED:
        raise ValidationError({"session": ["Votes are allowed only for completed sessions."]})

    if not Outcome.objects.filter(session=session).exists():
        raise ValidationError(
            {"session": ["Completed session must have an outcome before voting."]}
        )


def _get_outcome(*, session: GameSession) -> Outcome:
    try:
        return Outcome.objects.get(session=session)
    except Outcome.DoesNotExist as exc:
        raise ValidationError(
            {"session": ["Completed session must have an outcome before voting."]}
        ) from exc


def _ensure_vote_window_open(*, session: GameSession, is_admin: bool) -> None:
    if is_admin:
        return

    deadline = _get_outcome(session=session).created_at + timedelta(hours=24)
    if timezone.now() > deadline:
        raise ValidationError({"vote": ["Vote editing window has expired."]})


def _get_participant_user_ids(*, session_id: int) -> set[int]:
    return set(
        Participation.objects.filter(session_id=session_id).values_list("user_id", flat=True)
    )


@transaction.atomic
def cast_vote(
    *,
    session: GameSession,
    from_user: User,
    to_user: User,
    vote_type: str,
) -> MatchVote:
    locked_session = _get_locked_session(session_id=session.pk)
    _ensure_session_can_have_votes(session=locked_session)

    if from_user.pk == to_user.pk:
        raise ValidationError({"to_user": ["You cannot vote for yourself."]})

    participant_user_ids = _get_participant_user_ids(session_id=locked_session.pk)
    if from_user.pk not in participant_user_ids:
        raise ValidationError({"from_user": ["Only session participants can vote."]})

    if to_user.pk not in participant_user_ids:
        raise ValidationError({"to_user": ["Vote target must be a participant of the session."]})

    if MatchVote.objects.filter(
        session=locked_session,
        from_user=from_user,
        to_user=to_user,
    ).exists():
        raise ValidationError({"vote": ["You have already voted for this player in the session."]})

    return MatchVote.objects.create(
        session=locked_session,
        from_user=from_user,
        to_user=to_user,
        vote_type=vote_type,
    )


@transaction.atomic
def update_vote(
    *,
    vote: MatchVote,
    vote_type: str,
    is_admin: bool = False,
) -> MatchVote:
    locked_vote = _get_locked_vote(vote_id=vote.pk)
    _ensure_session_can_have_votes(session=locked_vote.session)
    _ensure_vote_window_open(session=locked_vote.session, is_admin=is_admin)

    locked_vote.vote_type = vote_type
    locked_vote.save(update_fields=["vote_type", "updated_at"])
    return locked_vote


@transaction.atomic
def delete_vote(*, vote: MatchVote, is_admin: bool = False) -> None:
    locked_vote = _get_locked_vote(vote_id=vote.pk)
    _ensure_session_can_have_votes(session=locked_vote.session)
    _ensure_vote_window_open(session=locked_vote.session, is_admin=is_admin)
    locked_vote.delete()
