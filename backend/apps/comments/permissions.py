from __future__ import annotations

from rest_framework.permissions import BasePermission


class IsCommentAuthorOrAdmin(BasePermission):
    def has_permission(self, request, view) -> bool:
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj) -> bool:
        return bool(
            obj.author_id == request.user.pk
            or request.user.is_staff
            or request.user.is_superuser
        )
