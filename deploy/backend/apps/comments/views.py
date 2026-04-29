from __future__ import annotations

from typing import Any

from django.core.exceptions import (
    ObjectDoesNotExist,
)
from django.core.exceptions import (
    ValidationError as DjangoValidationError,
)
from django.http import Http404
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.exceptions import (
    NotAuthenticated,
    PermissionDenied,
)
from rest_framework.exceptions import (
    ValidationError as DRFValidationError,
)
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.games.selectors import get_session_queryset

from . import selectors, services
from .permissions import IsCommentAuthorOrAdmin
from .serializers import (
    CommentListQuerySerializer,
    CommentWriteSerializer,
    MatchCommentSerializer,
)


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
                message="Ошибка валидации.",
                status_code=status.HTTP_400_BAD_REQUEST,
                details=details,
            )

        if isinstance(exc, DRFValidationError):
            return build_error_response(
                code="validation_error",
                message="Ошибка валидации.",
                status_code=status.HTTP_400_BAD_REQUEST,
                details=exc.detail,
            )

        if isinstance(exc, NotAuthenticated):
            return build_error_response(
                code="unauthorized",
                message="Требуется аутентификация.",
                status_code=status.HTTP_401_UNAUTHORIZED,
            )

        if isinstance(exc, PermissionDenied):
            return build_error_response(
                code="permission_denied",
                message="У вас нет прав для выполнения этого действия.",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        if isinstance(exc, (Http404, ObjectDoesNotExist)):
            return build_error_response(
                code="not_found",
                message="Объект не найден.",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        return super().handle_exception(exc)


class CommentsAPIView(ErrorHandlingMixin, APIView):
    pass


class SessionCommentListCreateView(CommentsAPIView):
    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated()]
        return [AllowAny()]

    def get(self, request, session_id: int, *args, **kwargs) -> Response:
        get_object_or_404(get_session_queryset(), pk=session_id)

        query_serializer = CommentListQuerySerializer(data=request.query_params)
        query_serializer.is_valid(raise_exception=True)

        comments = selectors.list_comments(
            session_id=session_id,
            limit=query_serializer.validated_data["limit"],
            before_id=query_serializer.validated_data.get("before_id"),
        )
        return Response(
            MatchCommentSerializer(
                comments,
                many=True,
                context={"request": request},
            ).data
        )

    def post(self, request, session_id: int, *args, **kwargs) -> Response:
        session = get_object_or_404(get_session_queryset(), pk=session_id)

        serializer = CommentWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        comment = services.post_comment(
            session=session,
            author=request.user,
            **serializer.validated_data,
        )
        comment = get_object_or_404(selectors.get_comment_queryset(), pk=comment.pk)
        return Response(
            MatchCommentSerializer(comment, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class SessionCommentDetailView(CommentsAPIView):
    permission_classes = [IsCommentAuthorOrAdmin]

    def patch(self, request, session_id: int, comment_id: int, *args, **kwargs) -> Response:
        comment = get_object_or_404(
            selectors.get_comment_queryset().filter(session_id=session_id),
            pk=comment_id,
        )
        self.check_object_permissions(request, comment)

        serializer = CommentWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        updated_comment = services.edit_comment(comment=comment, **serializer.validated_data)
        updated_comment = get_object_or_404(
            selectors.get_comment_queryset(),
            pk=updated_comment.pk,
        )
        return Response(MatchCommentSerializer(updated_comment, context={"request": request}).data)

    def delete(self, request, session_id: int, comment_id: int, *args, **kwargs) -> Response:
        comment = get_object_or_404(
            selectors.get_comment_queryset().filter(session_id=session_id),
            pk=comment_id,
        )
        self.check_object_permissions(request, comment)
        services.delete_comment(comment=comment)
        return Response(status=status.HTTP_204_NO_CONTENT)
