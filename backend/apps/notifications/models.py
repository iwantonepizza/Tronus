"""In-app notification model (Wave 7 — T-130)."""

from __future__ import annotations

from django.db import models


class Notification(models.Model):
    """Single in-app notification for a user."""

    class Kind(models.TextChoices):
        INVITE_RECEIVED = "invite_received", "Invite received"
        INVITE_ACCEPTED = "invite_accepted", "Invite accepted"
        INVITE_DECLINED = "invite_declined", "Invite declined"

    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    kind = models.CharField(max_length=32, choices=Kind.choices)
    payload = models.JSONField(default=dict)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "is_read", "-created_at"]),
        ]

    def __str__(self) -> str:
        return f"Notification({self.kind}) → {self.user_id}"
