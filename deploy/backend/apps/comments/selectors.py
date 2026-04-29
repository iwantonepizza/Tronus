from __future__ import annotations

from django.db.models import Q, QuerySet

from .models import MatchComment


def get_comment_queryset() -> QuerySet[MatchComment]:
    return MatchComment.objects.select_related("author__profile", "session")


def list_comments(
    *,
    session_id: int,
    limit: int = 50,
    before_id: int | None = None,
) -> QuerySet[MatchComment]:
    queryset = get_comment_queryset().filter(session_id=session_id, is_deleted=False)

    if before_id is not None:
        anchor_comment = MatchComment.objects.filter(session_id=session_id).get(pk=before_id)
        queryset = queryset.filter(
            Q(created_at__lt=anchor_comment.created_at)
            | Q(created_at=anchor_comment.created_at, pk__lt=anchor_comment.pk)
        )

    return queryset.order_by("-created_at", "-pk")[:limit]
