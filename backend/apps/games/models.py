from __future__ import annotations

from django.db import models

from apps.core.models import TimestampedModel


class GameSession(TimestampedModel):
    class Status(models.TextChoices):
        PLANNED = "planned", "Planned"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    scheduled_at = models.DateTimeField()
    mode = models.ForeignKey(
        "reference.GameMode",
        on_delete=models.PROTECT,
        related_name="sessions",
    )
    deck = models.ForeignKey(
        "reference.Deck",
        on_delete=models.PROTECT,
        related_name="sessions",
    )
    created_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.PROTECT,
        related_name="created_sessions",
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PLANNED)
    planning_note = models.TextField(blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["status", "scheduled_at"]),
            models.Index(fields=["created_by", "status"]),
        ]

    def __str__(self) -> str:
        return f"Session #{self.pk} @ {self.scheduled_at:%Y-%m-%d}"


class Participation(TimestampedModel):
    session = models.ForeignKey(
        "games.GameSession",
        on_delete=models.CASCADE,
        related_name="participations",
    )
    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.PROTECT,
        related_name="participations",
    )
    faction = models.ForeignKey(
        "reference.Faction",
        on_delete=models.PROTECT,
        related_name="participations",
    )
    place = models.PositiveSmallIntegerField(null=True, blank=True)
    castles = models.PositiveSmallIntegerField(null=True, blank=True)
    is_winner = models.BooleanField(default=False)
    notes = models.TextField(blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["session", "user"]),
            models.Index(fields=["user", "is_winner"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["session", "user"],
                name="games_participation_user_once",
            ),
            models.UniqueConstraint(
                fields=["session", "faction"],
                name="games_participation_faction_once",
            ),
            models.UniqueConstraint(
                fields=["session", "place"],
                condition=models.Q(place__isnull=False),
                name="games_participation_unique_place_in_session",
            ),
            models.UniqueConstraint(
                fields=["session"],
                condition=models.Q(is_winner=True),
                name="games_participation_single_winner",
            ),
            models.CheckConstraint(
                check=models.Q(is_winner=False) | models.Q(place=1),
                name="games_participation_winner_requires_first_place",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.user.profile.nickname} in session #{self.session_id}"


class Outcome(TimestampedModel):
    class EndReason(models.TextChoices):
        CASTLES_7 = "castles_7", "Seven Castles"
        TIMER = "timer", "Timer"
        ROUNDS_END = "rounds_end", "Rounds End"
        EARLY = "early", "Early"
        OTHER = "other", "Other"

    session = models.OneToOneField(
        "games.GameSession",
        on_delete=models.CASCADE,
        related_name="outcome",
        primary_key=True,
    )
    rounds_played = models.PositiveSmallIntegerField()
    end_reason = models.CharField(max_length=20, choices=EndReason.choices)
    mvp = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="mvp_outcomes",
    )
    final_note = models.TextField(blank=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                check=models.Q(rounds_played__gte=1),
                name="games_outcome_rounds_played_gte_1",
            ),
        ]

    def __str__(self) -> str:
        return f"Outcome for session #{self.session_id}"
