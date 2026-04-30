from __future__ import annotations

from rest_framework.permissions import BasePermission


class IsPlayerUser(BasePermission):
    """Allow any active authenticated user.

    We accept ``is_active=True`` as sufficient because auto-activated users are
    created with ``is_active=True`` directly (skipping the signal that would
    normally add the ``player`` group).  The group is still added for
    consistency via ``register_user``, but we no longer gate on it here.
    """

    def has_permission(self, request, view) -> bool:
        user = request.user
        if not user or not user.is_authenticated:
            return False

        return bool(
            user.is_active
            or user.is_staff
            or user.is_superuser
        )


class IsSessionCreatorOrAdmin(BasePermission):
    def has_permission(self, request, view) -> bool:
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj) -> bool:
        session = getattr(obj, "session", obj)
        return bool(
            session.created_by_id == request.user.pk
            or request.user.is_staff
            or request.user.is_superuser
        )
