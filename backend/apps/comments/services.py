from __future__ import annotations

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from apps.accounts.models import User
from apps.games.models import GameSession

from .models import MatchComment


def _normalize_body(*, body: str) -> str:
    normalized_body = body.strip()
    if not normalized_body:
        raise ValidationError({"body": ["Текст комментария не может быть пустым."]})
    return normalized_body


@transaction.atomic
def post_comment(
    *,
    session: GameSession,
    author: User,
    body: str,
) -> MatchComment:
    return MatchComment.objects.create(
        session=session,
        author=author,
        body=_normalize_body(body=body),
    )


@transaction.atomic
def edit_comment(
    *,
    comment: MatchComment,
    body: str,
) -> MatchComment:
    if comment.is_deleted:
        raise ValidationError({"comment": ["Удалённый комментарий нельзя редактировать."]})

    comment.body = _normalize_body(body=body)
    comment.edited_at = timezone.now()
    comment.save(update_fields=["body", "edited_at", "updated_at"])
    return comment


@transaction.atomic
def delete_comment(*, comment: MatchComment) -> MatchComment:
    if comment.is_deleted:
        return comment

    comment.is_deleted = True
    comment.save(update_fields=["is_deleted", "updated_at"])
    return comment
