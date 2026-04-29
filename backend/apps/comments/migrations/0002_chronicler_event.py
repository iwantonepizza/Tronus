"""Wave 6 — T-126: MatchComment.author nullable + chronicler_event FK (ADR-0014)."""

from __future__ import annotations

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("comments", "0001_add_match_comment"),
        ("games", "0004_wave6_timeline"),
    ]

    operations = [
        migrations.AlterField(
            model_name="matchcomment",
            name="author",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="match_comments",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="matchcomment",
            name="chronicler_event",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="chronicler_messages",
                to="games.matchtimelineevent",
            ),
        ),
    ]
