"""Wave 6 — T-100: extended session lifecycle.

Changes:
- GameSession.Status gains IN_PROGRESS choice.
- Participation gets replaced_by_participation, joined_at_round, left_at_round.
- New model: SessionInvite (ADR-0013).
- New model: RoundSnapshot (ADR-0010).
"""

from __future__ import annotations

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("games", "0002_rename_deck_to_house_deck"),
        ("reference", "0007_localize_hex_color_validator"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # ── 1. GameSession.status: add IN_PROGRESS choice ────────────────────
        migrations.AlterField(
            model_name="gamesession",
            name="status",
            field=models.CharField(
                choices=[
                    ("planned", "Planned"),
                    ("in_progress", "In Progress"),
                    ("completed", "Completed"),
                    ("cancelled", "Cancelled"),
                ],
                default="planned",
                max_length=20,
            ),
        ),
        # ── 2. Participation: lifecycle fields ────────────────────────────────
        migrations.AddField(
            model_name="participation",
            name="joined_at_round",
            field=models.PositiveSmallIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="participation",
            name="left_at_round",
            field=models.PositiveSmallIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="participation",
            name="replaced_by_participation",
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="replaces",
                to="games.participation",
            ),
        ),
        # ── 3. SessionInvite ──────────────────────────────────────────────────
        migrations.CreateModel(
            name="SessionInvite",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "rsvp_status",
                    models.CharField(
                        choices=[
                            ("going", "Going"),
                            ("maybe", "Maybe"),
                            ("declined", "Declined"),
                            ("invited", "Invited (no response)"),
                        ],
                        default="invited",
                        max_length=20,
                    ),
                ),
                (
                    "desired_faction",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="session_invites",
                        to="reference.faction",
                    ),
                ),
                (
                    "invited_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="+",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "session",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="invites",
                        to="games.gamesession",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="session_invites",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"abstract": False},
        ),
        migrations.AddConstraint(
            model_name="sessioninvite",
            constraint=models.UniqueConstraint(
                fields=["session", "user"],
                name="games_sessioninvite_user_once_per_session",
            ),
        ),
        migrations.AddIndex(
            model_name="sessioninvite",
            index=models.Index(fields=["session", "rsvp_status"], name="games_sessioninvite_rsvp_idx"),
        ),
        # ── 4. RoundSnapshot ─────────────────────────────────────────────────
        migrations.CreateModel(
            name="RoundSnapshot",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("round_number", models.PositiveSmallIntegerField()),
                ("influence_throne", models.JSONField(default=list)),
                ("influence_sword", models.JSONField(default=list)),
                ("influence_court", models.JSONField(default=list)),
                ("supply", models.JSONField(default=dict)),
                ("castles", models.JSONField(default=dict)),
                (
                    "wildlings_threat",
                    models.PositiveSmallIntegerField(
                        choices=[(0, "0"), (2, "2"), (4, "4"), (6, "6"), (8, "8"), (10, "10"), (12, "12")],
                        default=4,
                    ),
                ),
                ("note", models.TextField(blank=True)),
                (
                    "session",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="round_snapshots",
                        to="games.gamesession",
                    ),
                ),
            ],
            options={
                "ordering": ["round_number"],
                "unique_together": {("session", "round_number")},
            },
        ),
        migrations.AddConstraint(
            model_name="roundsnapshot",
            constraint=models.CheckConstraint(
                check=models.Q(wildlings_threat__in=[0, 2, 4, 6, 8, 10, 12]),
                name="games_round_snapshot_wildlings_valid",
            ),
        ),
        migrations.AddConstraint(
            model_name="roundsnapshot",
            constraint=models.CheckConstraint(
                check=models.Q(round_number__gte=0) & models.Q(round_number__lte=10),
                name="games_round_snapshot_number_range",
            ),
        ),
    ]
