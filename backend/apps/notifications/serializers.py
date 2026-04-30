"""Notification serializers (Wave 7 — T-130)."""

from __future__ import annotations

from rest_framework import serializers

from apps.notifications.models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "kind", "payload", "is_read", "created_at"]
        read_only_fields = fields
