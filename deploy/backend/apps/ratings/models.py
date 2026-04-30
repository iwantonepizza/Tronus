from __future__ import annotations

from django.db import models

from apps.core.models import TimestampedModel


class MatchVote(TimestampedModel):
    class VoteType(models.TextChoices):
        CROWN = "CROWN", "Crown"
        SHIT = "SHIT", "Shit"

    session = models.ForeignKey(
        "games.GameSession",
        on_delete=models.CASCADE,
        related_name="votes",
    )
    from_user = models.ForeignKey(
        "accounts.User",
        on_delete=models.PROTECT,
        related_name="sent_match_votes",
    )
    to_user = models.ForeignKey(
        "accounts.User",
        on_delete=models.PROTECT,
        related_name="received_match_votes",
    )
    vote_type = models.CharField(max_length=8, choices=VoteType.choices)

    class Meta:
        ordering = ["-created_at", "-pk"]
        indexes = [
            models.Index(fields=["session", "created_at"]),
            models.Index(fields=["to_user", "vote_type"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["session", "from_user", "to_user"],
                name="ratings_vote_unique_pair_per_session",
            ),
            models.CheckConstraint(
                check=~models.Q(from_user=models.F("to_user")),
                name="ratings_vote_from_user_not_equal_to_user",
            ),
        ]

    def __str__(self) -> str:
        return (
            f"Vote #{self.pk} {self.vote_type} "
            f"{self.from_user.profile.nickname}->{self.to_user.profile.nickname}"
        )
