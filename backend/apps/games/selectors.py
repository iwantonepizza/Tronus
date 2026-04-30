from __future__ import annotations

from datetime import datetime

from django.db.models import Prefetch, QuerySet

from .models import GameSession, MatchTimelineEvent, Participation, RoundSnapshot, SessionInvite


def _session_base_queryset() -> QuerySet[GameSession]:
    return GameSession.objects.select_related(
        "mode",
        "house_deck",
        "created_by__profile",
        "outcome__mvp__profile",
    ).order_by("-scheduled_at", "-pk")


def get_session_queryset() -> QuerySet[GameSession]:
    return _session_base_queryset()


def get_participation_queryset() -> QuerySet[Participation]:
    return Participation.objects.select_related(
        "session__created_by",
        "user__profile",
        "faction",
    ).order_by("pk")


def list_sessions(
    *,
    status: str | None = None,
    user_id: int | None = None,
    from_at: datetime | None = None,
    to_at: datetime | None = None,
) -> QuerySet[GameSession]:
    queryset = _session_base_queryset()

    if status is not None:
        queryset = queryset.filter(status=status)

    if user_id is not None:
        queryset = queryset.filter(participations__user_id=user_id).distinct()

    if from_at is not None:
        queryset = queryset.filter(scheduled_at__gte=from_at)

    if to_at is not None:
        queryset = queryset.filter(scheduled_at__lte=to_at)

    return queryset


def get_session_detail(*, session_id: int) -> GameSession:
    participation_queryset = get_participation_queryset().select_related(
        "user__profile",
        "faction",
    )

    return (
        _session_base_queryset()
        .prefetch_related(
            Prefetch("participations", queryset=participation_queryset),
            "outcome",
        )
        .get(pk=session_id)
    )


def list_planned_after(*, at: datetime) -> QuerySet[GameSession]:
    return (
        _session_base_queryset()
        .filter(status=GameSession.Status.PLANNED, scheduled_at__gte=at)
        .order_by("scheduled_at", "pk")
    )


def list_recent_completed(*, limit: int) -> QuerySet[GameSession]:
    return _session_base_queryset().filter(status=GameSession.Status.COMPLETED)[:limit]


def get_session_rounds(*, session: GameSession) -> QuerySet[RoundSnapshot]:
    """Return all RoundSnapshots for a session, ordered by round_number."""
    return RoundSnapshot.objects.filter(session=session).order_by("round_number")


def get_invite_queryset():
    return SessionInvite.objects.select_related(
        "user__profile", "desired_faction", "session"
    ).order_by("created_at")


def get_session_timeline(*, session: GameSession) -> QuerySet[MatchTimelineEvent]:
    """Return all timeline events for a session, ordered by happened_at."""
    return MatchTimelineEvent.objects.filter(session=session).order_by("happened_at", "pk")
