from __future__ import annotations

from django.core.validators import MaxLengthValidator
from django.db import models

from apps.core.models import TimestampedModel


class MatchComment(TimestampedModel):
    session = models.ForeignKey(
        "games.GameSession",
        on_delete=models.CASCADE,
        related_name="comments",
    )
    author = models.ForeignKey(
        "accounts.User",
        on_delete=models.PROTECT,
        related_name="match_comments",
    )
    body = models.TextField(validators=[MaxLengthValidator(2000)])
    edited_at = models.DateTimeField(null=True, blank=True)
    is_deleted = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at", "-pk"]
        indexes = [
            models.Index(fields=["session", "created_at"]),
            models.Index(fields=["author", "created_at"]),
        ]

    def __str__(self) -> str:
        return f"Comment #{self.pk} by {self.author.profile.nickname} in session #{self.session_id}"
