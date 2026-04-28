from __future__ import annotations

from typing import Any

from django.core.exceptions import ObjectDoesNotExist
from django.core.exceptions import ValidationError as DjangoValidationError
from django.http import Http404
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.exceptions import NotAuthenticated, PermissionDenied
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from . import selectors, services
from .serializers import AvatarAssetSerializer, AvatarGenerateSerializer


def build_error_response(
    *,
    code: str,
    message: str,
    status_code: int,
    details: Any | None = None,
) -> Response:
    payload: dict[str, Any] = {
        "error": {
            "code": code,
            "message": message,
        }
    }
    if details:
        payload["error"]["details"] = details

    return Response(payload, status=status_code)


class ErrorHandlingMixin:
    def handle_exception(self, exc):
        if isinstance(exc, DjangoValidationError):
            details = getattr(exc, "message_dict", None) or {"non_field_errors": exc.messages}
            return build_error_response(
                code="validation_error",
                message="Validation error.",
                status_code=status.HTTP_400_BAD_REQUEST,
                details=details,
            )

        if isinstance(exc, DRFValidationError):
            return build_error_response(
                code="validation_error",
                message="Validation error.",
                status_code=status.HTTP_400_BAD_REQUEST,
                details=exc.detail,
            )

        if isinstance(exc, NotAuthenticated):
            return build_error_response(
                code="unauthorized",
                message="Authentication credentials were not provided.",
                status_code=status.HTTP_401_UNAUTHORIZED,
            )

        if isinstance(exc, PermissionDenied):
            return build_error_response(
                code="permission_denied",
                message="You do not have permission to perform this action.",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        if isinstance(exc, (Http404, ObjectDoesNotExist)):
            return build_error_response(
                code="not_found",
                message="Not found.",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        return super().handle_exception(exc)


class AvatarsAPIView(ErrorHandlingMixin, APIView):
    permission_classes = [IsAuthenticated]

    def _get_avatar_for_request(self, *, request, avatar_id: int):
        queryset = selectors.get_avatar_queryset()
        if not (request.user.is_staff or request.user.is_superuser):
            queryset = queryset.filter(user=request.user)
        return get_object_or_404(queryset, pk=avatar_id)


class AvatarListView(AvatarsAPIView):
    def get(self, request, *args, **kwargs) -> Response:
        avatars = selectors.list_user_avatars(user_id=request.user.pk)
        serializer = AvatarAssetSerializer(avatars, many=True, context={"request": request})
        return Response(serializer.data)


class AvatarGenerateView(AvatarsAPIView):
    def post(self, request, *args, **kwargs) -> Response:
        serializer = AvatarGenerateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        avatar = services.generate_basic_avatar(
            user=request.user,
            faction=serializer.validated_data["faction"],
            photo_file=serializer.validated_data["photo"],
        )
        response_serializer = AvatarAssetSerializer(avatar, context={"request": request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class AvatarSetCurrentView(AvatarsAPIView):
    def post(self, request, avatar_id: int, *args, **kwargs) -> Response:
        avatar = self._get_avatar_for_request(request=request, avatar_id=avatar_id)
        avatar = services.set_current_avatar(avatar=avatar)
        serializer = AvatarAssetSerializer(avatar, context={"request": request})
        return Response(serializer.data)


class AvatarDetailView(AvatarsAPIView):
    def delete(self, request, avatar_id: int, *args, **kwargs) -> Response:
        avatar = self._get_avatar_for_request(request=request, avatar_id=avatar_id)
        services.delete_avatar(avatar=avatar)
        return Response(status=status.HTTP_204_NO_CONTENT)
