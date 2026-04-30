"""Notification selectors — read-only queries (Wave 7 — T-130)."""

from __future__ import annotations

from django.db.models import QuerySet

from apps.notifications.models import Notification


def get_notifications_for_user(user_id: int) -> QuerySet[Notification]:
    return Notification.objects.filter(user_id=user_id)


def get_unread_count(user_id: int) -> int:
    return Notification.objects.filter(user_id=user_id, is_read=False).count()
