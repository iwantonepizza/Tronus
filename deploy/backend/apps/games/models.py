from __future__ import annotations

from django.db import models
from django.utils import timezone

from apps.core.models import TimestampedModel

# Valid wildlings threat positions from the game board
WILDLINGS_THREAT_CHOICES = [(v, str(v)) for v in (0, 2, 4, 6, 8, 10, 12)]


class GameSession(TimestampedModel):
    class Status(models.TextChoices):
        PLANNED = "planned", "Planned"
        IN_PROGRESS = "in_progress", "In Progress"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    scheduled_at = models.DateTimeField()
    mode = models.ForeignKey(
        "reference.GameMode",
        on_delete=models.PROTECT,
        related_name="sessions",
    )
    house_deck = models.ForeignKey(
        "reference.HouseDeck",
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

    # Lifecycle fields (Wave 6 — T-100)
    replaced_by_participation = models.OneToOneField(
        "self",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="replaces",
    )
    joined_at_round = models.PositiveSmallIntegerField(default=0)
    left_at_round = models.PositiveSmallIntegerField(null=True, blank=True)

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


class SessionInvite(TimestampedModel):
    """Pre-session intent to participate (Wave 6 — ADR-0013).

    Exists during ``status=planned``. Converted to Participation records when
    ``start_session()`` is called for all invites with ``rsvp_status=going``.
    Invite records are *kept* after start for history / stats.
    """

    class RsvpStatus(models.TextChoices):
        GOING = "going", "Going"
        MAYBE = "maybe", "Maybe"
        DECLINED = "declined", "Declined"
        INVITED = "invited", "Invited (no response)"

    session = models.ForeignKey(
        "games.GameSession",
        on_delete=models.CASCADE,
        related_name="invites",
    )
    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="session_invites",
    )
    rsvp_status = models.CharField(
        max_length=20,
        choices=RsvpStatus.choices,
        default=RsvpStatus.INVITED,
    )
    # Player's preferred faction — NOT unique per session (multiple players can want the same)
    desired_faction = models.ForeignKey(
        "reference.Faction",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="session_invites",
    )
    # null means self-invite; non-null means the session creator sent this invite
    invited_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["session", "user"],
                name="games_sessioninvite_user_once_per_session",
            ),
        ]
        indexes = [
            models.Index(fields=["session", "rsvp_status"]),
        ]

    def __str__(self) -> str:
        return f"Invite: {self.user_id} → session #{self.session_id} ({self.rsvp_status})"


class RoundSnapshot(TimestampedModel):
    """Immutable snapshot of game-board state at the end of each round (Wave 6 — ADR-0010).

    ``round_number=0`` is the *initial* snapshot created by ``start_session()``.
    All subsequent snapshots are created by ``complete_round()``.
    Snapshots must never be edited after creation — admin can only ``discard_last_round()``.
    """

    session = models.ForeignKey(
        "games.GameSession",
        on_delete=models.CASCADE,
        related_name="round_snapshots",
    )
    round_number = models.PositiveSmallIntegerField()  # 0 = initial, 1..max_rounds = real rounds

    # Influence tracks — ordered lists of participation_id (index 0 = 1st place on track)
    influence_throne = models.JSONField(default=list)
    influence_sword = models.JSONField(default=list)
    influence_court = models.JSONField(default=list)

    # Supply / castles — maps: {str(participation_id): value}
    supply = models.JSONField(default=dict)   # values 0..6
    castles = models.JSONField(default=dict)  # values 0..7

    # Wildlings threat marker — one of the 7 fixed positions
    wildlings_threat = models.PositiveSmallIntegerField(
        choices=WILDLINGS_THREAT_CHOICES,
        default=4,
    )

    note = models.TextField(blank=True)

    class Meta:
        unique_together = [("session", "round_number")]
        ordering = ["round_number"]
        constraints = [
            models.CheckConstraint(
                check=models.Q(wildlings_threat__in=[0, 2, 4, 6, 8, 10, 12]),
                name="games_round_snapshot_wildlings_valid",
            ),
            models.CheckConstraint(
                check=models.Q(round_number__gte=0) & models.Q(round_number__lte=10),
                name="games_round_snapshot_number_range",
            ),
        ]

    def __str__(self) -> str:
        return f"Round {self.round_number} of session #{self.session_id}"


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


class MatchTimelineEvent(TimestampedModel):
    """Chronological record of in-game events (ADR-0014).

    Each ``kind`` has its own ``payload`` schema, validated in services.
    """

    class Kind(models.TextChoices):
        SESSION_STARTED = "session_started", "Session started"
        ROUND_COMPLETED = "round_completed", "Round completed"
        WILDLINGS_RAID = "wildlings_raid", "Wildlings raid"
        CLASH_OF_KINGS = "clash_of_kings", "Clash of kings"
        EVENT_CARD_PLAYED = "event_card_played", "Event card played"
        PARTICIPANT_REPLACED = "participant_replaced", "Participant replaced"
        SESSION_FINALIZED = "session_finalized", "Session finalized"

    session = models.ForeignKey(
        "games.GameSession",
        on_delete=models.CASCADE,
        related_name="timeline_events",
    )
    kind = models.CharField(max_length=32, choices=Kind.choices)
    happened_at = models.DateTimeField(auto_now_add=True)
    actor = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )
    payload = models.JSONField(default=dict)

    class Meta:
        ordering = ["happened_at"]
        indexes = [
            models.Index(fields=["session", "happened_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.kind} in session #{self.session_id}"


class MatchTimelineEvent(TimestampedModel):
    """Chronological log of significant in-game events (ADR-0014).

    All event-specific data lives in ``payload`` (JSON), validated in services.py.
    """

    class Kind(models.TextChoices):
        SESSION_STARTED = "session_started", "Session started"
        ROUND_COMPLETED = "round_completed", "Round completed"
        WILDLINGS_RAID = "wildlings_raid", "Wildlings raid"
        CLASH_OF_KINGS = "clash_of_kings", "Clash of kings"
        EVENT_CARD_PLAYED = "event_card_played", "Event card played"
        PARTICIPANT_REPLACED = "participant_replaced", "Participant replaced"
        SESSION_FINALIZED = "session_finalized", "Session finalized"

    session = models.ForeignKey(
        "games.GameSession",
        on_delete=models.CASCADE,
        related_name="timeline_events",
    )
    kind = models.CharField(max_length=32, choices=Kind.choices)
    happened_at = models.DateTimeField(default=timezone.now)
    actor = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )
    payload = models.JSONField(default=dict)

    class Meta:
        ordering = ["happened_at", "pk"]
        indexes = [
            models.Index(fields=["session", "happened_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.kind} in session #{self.session_id}"
