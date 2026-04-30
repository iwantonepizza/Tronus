"""Backfill player group for all active users who are missing it.

Run once after deploy to fix existing auto-activated users:

    python manage.py backfill_player_group

Safe to run multiple times (idempotent).
"""

from __future__ import annotations

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.management.base import BaseCommand

User = get_user_model()


class Command(BaseCommand):
    help = "Add active users without the player group to the player group."

    def handle(self, *args, **options) -> None:
        player_group, _ = Group.objects.get_or_create(name="player")

        users_missing_group = (
            User.objects.filter(is_active=True)
            .exclude(groups=player_group)
        )

        count = users_missing_group.count()
        if count == 0:
            self.stdout.write(self.style.SUCCESS("All active users already in player group. Nothing to do."))
            return

        for user in users_missing_group:
            user.groups.add(player_group)
            self.stdout.write(f"  Added player group to: {user.email or user.username}")

        self.stdout.write(self.style.SUCCESS(f"\nDone. Fixed {count} user(s)."))
