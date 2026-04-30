"""Notification services — mutating operations (Wave 7 — T-130)."""

from __future__ import annotations

from django.db import transaction

from apps.notifications.models import Notification


@transaction.atomic
def create_notification(
    *,
    user_id: int,
    kind: str,
    payload: dict,
) -> Notification:
    return Notification.objects.create(
        user_id=user_id,
        kind=kind,
        payload=payload,
    )


@transaction.atomic
def mark_notification_read(*, notification_id: int, user_id: int) -> Notification:
    notification = Notification.objects.select_for_update().get(
        id=notification_id,
        user_id=user_id,
    )
    notification.is_read = True
    notification.save(update_fields=["is_read"])
    return notification


@transaction.atomic
def mark_all_read(*, user_id: int) -> int:
    """Mark all unread notifications for user as read. Returns count updated."""
    return Notification.objects.filter(user_id=user_id, is_read=False).update(
        is_read=True
    )
