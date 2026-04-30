"""Notification URL routes (Wave 7 — T-130)."""

from __future__ import annotations

from django.urls import path

from apps.notifications import views

urlpatterns = [
    path(
        "notifications/",
        views.NotificationListView.as_view(),
        name="notification-list",
    ),
    path(
        "notifications/<int:notification_id>/read/",
        views.NotificationMarkReadView.as_view(),
        name="notification-mark-read",
    ),
    path(
        "notifications/read-all/",
        views.NotificationMarkAllReadView.as_view(),
        name="notification-read-all",
    ),
]
