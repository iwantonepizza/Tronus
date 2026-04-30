from __future__ import annotations

from django.db.models import QuerySet

from .models import MatchVote


def get_vote_queryset() -> QuerySet[MatchVote]:
    return MatchVote.objects.select_related(
        "session",
        "from_user__profile",
        "to_user__profile",
    ).order_by("-created_at", "-pk")


def list_votes(*, session_id: int) -> QuerySet[MatchVote]:
    return get_vote_queryset().filter(session_id=session_id)
