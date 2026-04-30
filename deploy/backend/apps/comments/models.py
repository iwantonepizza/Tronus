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
    # null = system/chronicler message; non-null = player comment
    author = models.ForeignKey(
        "accounts.User",
        on_delete=models.PROTECT,
        related_name="match_comments",
        null=True,
        blank=True,
    )
    body = models.TextField(validators=[MaxLengthValidator(2000)])
    edited_at = models.DateTimeField(null=True, blank=True)
    is_deleted = models.BooleanField(default=False)
    # ADR-0014: link to timeline event if created by the chronicler
    chronicler_event = models.ForeignKey(
        "games.MatchTimelineEvent",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="chronicler_messages",
    )

    class Meta:
        ordering = ["-created_at", "-pk"]
        indexes = [
            models.Index(fields=["session", "created_at"]),
            models.Index(fields=["author", "created_at"]),
        ]

    def __str__(self) -> str:
        name = self.author.profile.nickname if self.author_id else "Chronicler"
        return f"Comment #{self.pk} by {name} in session #{self.session_id}"
