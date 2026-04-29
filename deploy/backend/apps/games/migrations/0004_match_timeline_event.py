"""Wave 6 — T-102+T-126: MatchTimelineEvent model."""

from __future__ import annotations

import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("games", "0003_wave6_lifecycle_models"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="MatchTimelineEvent",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "kind",
                    models.CharField(
                        choices=[
                            ("session_started", "Session started"),
                            ("round_completed", "Round completed"),
                            ("wildlings_raid", "Wildlings raid"),
                            ("clash_of_kings", "Clash of kings"),
                            ("event_card_played", "Event card played"),
                            ("participant_replaced", "Participant replaced"),
                            ("session_finalized", "Session finalized"),
                        ],
                        max_length=32,
                    ),
                ),
                (
                    "happened_at",
                    models.DateTimeField(default=django.utils.timezone.now),
                ),
                ("payload", models.JSONField(default=dict)),
                (
                    "actor",
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
                        related_name="timeline_events",
                        to="games.gamesession",
                    ),
                ),
            ],
            options={"ordering": ["happened_at", "pk"]},
        ),
        migrations.AddIndex(
            model_name="matchtimelineevent",
            index=models.Index(
                fields=["session", "happened_at"],
                name="games_timeline_session_happened_idx",
            ),
        ),
    ]
