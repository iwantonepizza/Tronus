from __future__ import annotations

from rest_framework.permissions import BasePermission


class IsPlayerUser(BasePermission):
    def has_permission(self, request, view) -> bool:
        user = request.user
        if not user or not user.is_authenticated:
            return False

        return bool(
            user.is_staff
            or user.is_superuser
            or user.groups.filter(name="player").exists()
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
