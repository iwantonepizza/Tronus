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
        return Response(MatchVoteSerializer(votes, many=True).data)

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
        return Response(MatchVoteSerializer(vote).data, status=status.HTTP_201_CREATED)


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
        return Response(MatchVoteSerializer(updated_vote).data)

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
