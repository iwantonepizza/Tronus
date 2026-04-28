from __future__ import annotations

from typing import Any

from django.core.exceptions import ObjectDoesNotExist
from django.core.exceptions import ValidationError as DjangoValidationError
from django.http import Http404, QueryDict
from django.shortcuts import get_object_or_404
from rest_framework import pagination, status
from rest_framework.exceptions import (
    NotAuthenticated,
    PermissionDenied,
)
from rest_framework.exceptions import (
    ValidationError as DRFValidationError,
)
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from . import selectors, services
from .permissions import IsPlayerUser, IsSessionCreatorOrAdmin
from .serializers import (
    AddParticipantSerializer,
    FinalizeSessionSerializer,
    ParticipationSerializer,
    SessionDetailSerializer,
    SessionListQuerySerializer,
    SessionListSerializer,
    SessionWriteSerializer,
    UpdateParticipantSerializer,
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

        if isinstance(exc, Http404):
            return build_error_response(
                code="not_found",
                message="Not found.",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        if isinstance(exc, ObjectDoesNotExist):
            return build_error_response(
                code="not_found",
                message="Not found.",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        return super().handle_exception(exc)


class GamesCursorPagination(pagination.CursorPagination):
    page_size = 20
    page_size_query_param = "limit"
    max_page_size = 100
    ordering = "-scheduled_at"


class GamesAPIView(ErrorHandlingMixin, APIView):
    pass


class GamesGenericAPIView(ErrorHandlingMixin, GenericAPIView):
    pass


class SessionListCreateView(GamesGenericAPIView):
    pagination_class = GamesCursorPagination

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsPlayerUser()]
        return [AllowAny()]

    def _get_query_data(self) -> QueryDict:
        query_data = self.request.query_params.copy()
        if "from" in query_data and "from_" not in query_data:
            query_data["from_"] = query_data["from"]
        return query_data

    def get(self, request, *args, **kwargs) -> Response:
        query_serializer = SessionListQuerySerializer(data=self._get_query_data())
        query_serializer.is_valid(raise_exception=True)

        queryset = selectors.list_sessions(
            status=query_serializer.validated_data.get("status"),
            user_id=query_serializer.validated_data.get("user_id"),
            from_at=query_serializer.validated_data.get("from_at"),
            to_at=query_serializer.validated_data.get("to_at"),
        )
        page = self.paginate_queryset(queryset)
        serializer = SessionListSerializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    def post(self, request, *args, **kwargs) -> Response:
        serializer = SessionWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        session = services.create_session(
            created_by=request.user,
            **serializer.validated_data,
        )
        detailed_session = selectors.get_session_detail(session_id=session.pk)
        return Response(
            SessionDetailSerializer(detailed_session).data,
            status=status.HTTP_201_CREATED,
        )


class SessionDetailView(GamesAPIView):
    def get_permissions(self):
        if self.request.method in {"PATCH", "DELETE"}:
            return [IsSessionCreatorOrAdmin()]
        return [AllowAny()]

    def get(self, request, session_id: int, *args, **kwargs) -> Response:
        session = selectors.get_session_detail(session_id=session_id)
        return Response(SessionDetailSerializer(session).data)

    def patch(self, request, session_id: int, *args, **kwargs) -> Response:
        session = get_object_or_404(selectors.get_session_queryset(), pk=session_id)
        self.check_object_permissions(request, session)

        serializer = SessionWriteSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        updated_session = services.update_planning(session=session, **serializer.validated_data)
        detailed_session = selectors.get_session_detail(session_id=updated_session.pk)
        return Response(SessionDetailSerializer(detailed_session).data)

    def delete(self, request, session_id: int, *args, **kwargs) -> Response:
        session = get_object_or_404(selectors.get_session_queryset(), pk=session_id)
        self.check_object_permissions(request, session)
        services.cancel_session(session=session)
        return Response(status=status.HTTP_204_NO_CONTENT)


class SessionCancelView(GamesAPIView):
    permission_classes = [IsSessionCreatorOrAdmin]

    def post(self, request, session_id: int, *args, **kwargs) -> Response:
        session = get_object_or_404(selectors.get_session_queryset(), pk=session_id)
        self.check_object_permissions(request, session)
        services.cancel_session(session=session)
        return Response(status=status.HTTP_204_NO_CONTENT)


class SessionParticipantsView(GamesAPIView):
    permission_classes = [IsSessionCreatorOrAdmin]

    def post(self, request, session_id: int, *args, **kwargs) -> Response:
        session = get_object_or_404(selectors.get_session_queryset(), pk=session_id)
        self.check_object_permissions(request, session)

        serializer = AddParticipantSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        participation = services.add_participant(session=session, **serializer.validated_data)
        participation = get_object_or_404(
            selectors.get_participation_queryset(),
            pk=participation.pk,
        )
        return Response(
            ParticipationSerializer(participation).data,
            status=status.HTTP_201_CREATED,
        )


class SessionParticipantDetailView(GamesAPIView):
    permission_classes = [IsSessionCreatorOrAdmin]

    def patch(self, request, session_id: int, participation_id: int, *args, **kwargs) -> Response:
        participation = get_object_or_404(
            selectors.get_participation_queryset().filter(session_id=session_id),
            pk=participation_id,
        )
        self.check_object_permissions(request, participation)

        serializer = UpdateParticipantSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        updated_participation = services.update_participant(
            participation=participation,
            **serializer.validated_data,
        )
        updated_participation = get_object_or_404(
            selectors.get_participation_queryset(),
            pk=updated_participation.pk,
        )
        return Response(ParticipationSerializer(updated_participation).data)

    def delete(self, request, session_id: int, participation_id: int, *args, **kwargs) -> Response:
        participation = get_object_or_404(
            selectors.get_participation_queryset().filter(session_id=session_id),
            pk=participation_id,
        )
        self.check_object_permissions(request, participation)
        services.remove_participant(participation=participation)
        return Response(status=status.HTTP_204_NO_CONTENT)


class SessionFinalizeView(GamesAPIView):
    permission_classes = [IsSessionCreatorOrAdmin]

    def post(self, request, session_id: int, *args, **kwargs) -> Response:
        session = get_object_or_404(selectors.get_session_queryset(), pk=session_id)
        self.check_object_permissions(request, session)

        serializer = FinalizeSessionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        outcome = services.finalize_session(session=session, **serializer.validated_data)
        detailed_session = selectors.get_session_detail(session_id=outcome.session_id)
        return Response(
            SessionDetailSerializer(detailed_session).data,
            status=status.HTTP_201_CREATED,
        )
