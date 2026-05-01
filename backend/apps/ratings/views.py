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
    MethodNotAllowed,
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
from .permissions import IsVoteAuthorOrAdmin
from .serializers import MatchVoteSerializer, VoteUpdateSerializer, VoteWriteSerializer


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

        # MethodNotAllowed is HTTP 405 — explicit handling so it doesn't fall
        # through to the catch-all 500. Wave 11 / T-171: prod was returning
        # 500 for `GET /api/v1/sessions/<id>/votes/` because the catch-all
        # caught the DRF MethodNotAllowed before status was set.
        if isinstance(exc, MethodNotAllowed):
            allow_header = getattr(exc, "available_methods", None) or []
            return build_error_response(
                code="method_not_allowed",
                message=f"Метод '{getattr(exc, 'detail', exc)}' не разрешён для этого ресурса.",
                status_code=status.HTTP_405_METHOD_NOT_ALLOWED,
                details={"allowed_methods": list(allow_header)} if allow_header else None,
            )

        # Convert opaque 500s into structured ones with a readable code.
        import logging
        import traceback

        logger = logging.getLogger("apps.ratings.views")
        logger.exception("Unhandled exception in ratings view: %s", exc)
        return build_error_response(
            code="server_error",
            message="Внутренняя ошибка сервера.",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details={
                "exception_class": exc.__class__.__name__,
                "exception_message": str(exc)[:500],
                "trace_tail": traceback.format_exc().splitlines()[-5:],
            },
        )


class RatingsAPIView(ErrorHandlingMixin, APIView):
    pass


class SessionVoteListCreateView(RatingsAPIView):
    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated()]
        return [AllowAny()]

    def get(self, request, session_id: int, *args, **kwargs) -> Response:
        get_object_or_404(get_session_queryset(), pk=session_id)
        votes = selectors.list_votes(session_id=session_id)
        return Response(MatchVoteSerializer(votes, many=True, context={"request": request}).data)

    def post(self, request, session_id: int, *args, **kwargs) -> Response:
        session = get_object_or_404(get_session_queryset(), pk=session_id)

        serializer = VoteWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        vote = services.cast_vote(
            session=session,
            from_user=request.user,
            **serializer.validated_data,
        )
        vote = get_object_or_404(selectors.get_vote_queryset(), pk=vote.pk)
        return Response(
            MatchVoteSerializer(vote, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class SessionVoteDetailView(RatingsAPIView):
    permission_classes = [IsVoteAuthorOrAdmin]

    def patch(self, request, session_id: int, vote_id: int, *args, **kwargs) -> Response:
        vote = get_object_or_404(
            selectors.get_vote_queryset().filter(session_id=session_id),
            pk=vote_id,
        )
        self.check_object_permissions(request, vote)

        serializer = VoteUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        updated_vote = services.update_vote(
            vote=vote,
            is_admin=bool(request.user.is_staff or request.user.is_superuser),
            **serializer.validated_data,
        )
        updated_vote = get_object_or_404(selectors.get_vote_queryset(), pk=updated_vote.pk)
        return Response(MatchVoteSerializer(updated_vote, context={"request": request}).data)

    def delete(self, request, session_id: int, vote_id: int, *args, **kwargs) -> Response:
        vote = get_object_or_404(
            selectors.get_vote_queryset().filter(session_id=session_id),
            pk=vote_id,
        )
        self.check_object_permissions(request, vote)
        services.delete_vote(
            vote=vote,
            is_admin=bool(request.user.is_staff or request.user.is_superuser),
        )
        return Response(status=status.HTTP_204_NO_CONTENT)
