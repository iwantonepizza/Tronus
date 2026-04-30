"""Notification API views (Wave 7 — T-130)."""

from __future__ import annotations

from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.notifications.selectors import get_notifications_for_user, get_unread_count
from apps.notifications.serializers import NotificationSerializer
from apps.notifications.services import mark_all_read, mark_notification_read


class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        notifications = get_notifications_for_user(request.user.id)
        serializer = NotificationSerializer(notifications, many=True)
        return Response(
            {
                "results": serializer.data,
                "unread_count": get_unread_count(request.user.id),
            }
        )


class NotificationMarkReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request, notification_id: int) -> Response:
        notification = mark_notification_read(
            notification_id=notification_id,
            user_id=request.user.id,
        )
        return Response(NotificationSerializer(notification).data)


class NotificationMarkAllReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        count = mark_all_read(user_id=request.user.id)
        return Response({"marked_read": count})
