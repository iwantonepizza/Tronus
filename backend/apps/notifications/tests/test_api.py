"""Tests for notifications backend (Wave 7 — T-130)."""

from __future__ import annotations

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.notifications.models import Notification
from apps.notifications.services import (
    create_notification,
    mark_all_read,
    mark_notification_read,
)

User = get_user_model()


@pytest.fixture
def user(db):
    return User.objects.create_user(username="alice", email="alice@test.com", password="pw")


@pytest.fixture
def other_user(db):
    return User.objects.create_user(username="bob", email="bob@test.com", password="pw")


@pytest.fixture
def auth_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


# ── Service tests ─────────────────────────────────────────────────────────────


class TestCreateNotification:
    def test_creates_unread_notification(self, db, user):
        notif = create_notification(
            user_id=user.pk,
            kind=Notification.Kind.INVITE_RECEIVED,
            payload={"session_id": 1},
        )
        assert notif.pk is not None
        assert notif.is_read is False
        assert notif.kind == "invite_received"
        assert notif.payload == {"session_id": 1}


class TestMarkRead:
    def test_marks_single_notification_read(self, db, user):
        notif = create_notification(
            user_id=user.pk, kind=Notification.Kind.INVITE_RECEIVED, payload={}
        )
        updated = mark_notification_read(notification_id=notif.pk, user_id=user.pk)
        assert updated.is_read is True

    def test_cannot_mark_other_user_notification(self, db, user, other_user):
        notif = create_notification(
            user_id=other_user.pk, kind=Notification.Kind.INVITE_RECEIVED, payload={}
        )
        with pytest.raises(Notification.DoesNotExist):
            mark_notification_read(notification_id=notif.pk, user_id=user.pk)

    def test_mark_all_read_returns_count(self, db, user):
        create_notification(user_id=user.pk, kind=Notification.Kind.INVITE_RECEIVED, payload={})
        create_notification(user_id=user.pk, kind=Notification.Kind.INVITE_ACCEPTED, payload={})
        count = mark_all_read(user_id=user.pk)
        assert count == 2
        assert Notification.objects.filter(user=user, is_read=False).count() == 0


# ── API tests ─────────────────────────────────────────────────────────────────


class TestNotificationListAPI:
    def test_returns_notifications_for_authenticated_user(self, db, auth_client, user):
        create_notification(user_id=user.pk, kind=Notification.Kind.INVITE_RECEIVED, payload={"session_id": 10})
        response = auth_client.get("/api/v1/notifications/")
        assert response.status_code == 200
        data = response.json()
        assert data["unread_count"] == 1
        assert len(data["results"]) == 1
        assert data["results"][0]["kind"] == "invite_received"

    def test_requires_authentication(self, db):
        client = APIClient()
        response = client.get("/api/v1/notifications/")
        assert response.status_code == 403


class TestMarkReadAPI:
    def test_marks_notification_read(self, db, auth_client, user):
        notif = create_notification(
            user_id=user.pk, kind=Notification.Kind.INVITE_RECEIVED, payload={}
        )
        response = auth_client.post(f"/api/v1/notifications/{notif.pk}/read/")
        assert response.status_code == 200
        assert response.json()["is_read"] is True

    def test_mark_all_read(self, db, auth_client, user):
        create_notification(user_id=user.pk, kind=Notification.Kind.INVITE_RECEIVED, payload={})
        create_notification(user_id=user.pk, kind=Notification.Kind.INVITE_ACCEPTED, payload={})
        response = auth_client.post("/api/v1/notifications/read-all/")
        assert response.status_code == 200
        assert response.json()["marked_read"] == 2
