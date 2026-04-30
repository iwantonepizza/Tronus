from __future__ import annotations

from rest_framework.permissions import BasePermission


class IsAuthenticatedUser(BasePermission):
    def has_permission(self, request, view) -> bool:
        return bool(request.user and request.user.is_authenticated)


class IsSelfUser(BasePermission):
    def has_permission(self, request, view) -> bool:
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj) -> bool:
        return obj.pk == request.user.pk


class IsAdminUser(BasePermission):
    """Authenticated user with ``is_staff=True`` or ``is_superuser=True``.

    Used for the admin moderation endpoints (pending registrations etc.).
    Distinct from DRF's built-in ``IsAdminUser`` to keep the import surface
    consistent inside the project (we never use the built-in directly).
    """

    def has_permission(self, request, view) -> bool:
        user = request.user
        if not (user and user.is_authenticated):
            return False
        return bool(user.is_staff or user.is_superuser)
