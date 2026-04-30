"""Wave 7 — T-130: Notification model."""

from __future__ import annotations

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Notification",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="notifications",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "kind",
                    models.CharField(
                        choices=[
                            ("invite_received", "Invite received"),
                            ("invite_accepted", "Invite accepted"),
                            ("invite_declined", "Invite declined"),
                        ],
                        max_length=32,
                    ),
                ),
                ("payload", models.JSONField(default=dict)),
                ("is_read", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "ordering": ["-created_at"],
                "indexes": [
                    models.Index(
                        fields=["user", "is_read", "-created_at"],
                        name="notif_user_unread_idx",
                    )
                ],
            },
        ),
    ]
