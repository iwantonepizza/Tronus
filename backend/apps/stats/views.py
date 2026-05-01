from __future__ import annotations

from typing import Any

from django.core.exceptions import ObjectDoesNotExist
from django.core.exceptions import ValidationError as DjangoValidationError
from django.http import Http404
from rest_framework import status
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .selectors import (
    faction_stats,
    head_to_head_stats,
    leaderboard_stats,
    list_faction_stats,
    overview_stats,
    player_profile_stats,
    suggest_h2h_opponent,
)
from .serializers import (
    FactionStatsSerializer,
    HeadToHeadQuerySerializer,
    HeadToHeadStatsSerializer,
    HeadToHeadSuggestedQuerySerializer,
    HeadToHeadSuggestedSerializer,
    LeaderboardQuerySerializer,
    LeaderboardStatsSerializer,
    OverviewStatsSerializer,
    PlayerStatsSerializer,
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

        if isinstance(exc, (Http404, ObjectDoesNotExist)):
            return build_error_response(
                code="not_found",
                message="Объект не найден.",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        return super().handle_exception(exc)


class StatsAPIView(ErrorHandlingMixin, APIView):
    permission_classes = [AllowAny]


class PlayerStatsDetailView(StatsAPIView):
    def get(self, request, user_id: int, *args, **kwargs) -> Response:
        stats = player_profile_stats(user_id=user_id)
        return Response(PlayerStatsSerializer(stats, context={"request": request}).data)


class FactionStatsListView(StatsAPIView):
    def get(self, request, *args, **kwargs) -> Response:
        stats = list_faction_stats()
        return Response(FactionStatsSerializer(stats, many=True, context={"request": request}).data)


class FactionStatsDetailView(StatsAPIView):
    def get(self, request, slug: str, *args, **kwargs) -> Response:
        stats = faction_stats(faction_slug=slug)
        return Response(FactionStatsSerializer(stats, context={"request": request}).data)


class OverviewStatsView(StatsAPIView):
    def get(self, request, *args, **kwargs) -> Response:
        stats = overview_stats()
        return Response(OverviewStatsSerializer(stats, context={"request": request}).data)


class LeaderboardStatsView(StatsAPIView):
    def get(self, request, *args, **kwargs) -> Response:
        query_serializer = LeaderboardQuerySerializer(data=request.query_params)
        query_serializer.is_valid(raise_exception=True)

        stats = leaderboard_stats(
            metric=query_serializer.validated_data["metric"],
            limit=query_serializer.validated_data["limit"],
        )
        return Response(LeaderboardStatsSerializer(stats, context={"request": request}).data)


class HeadToHeadStatsView(StatsAPIView):
    def get(self, request, *args, **kwargs) -> Response:
        query_serializer = HeadToHeadQuerySerializer(data=request.query_params)
        query_serializer.is_valid(raise_exception=True)

        stats = head_to_head_stats(
            user_a_id=query_serializer.validated_data["user_a"],
            user_b_id=query_serializer.validated_data["user_b"],
        )
        return Response(HeadToHeadStatsSerializer(stats, context={"request": request}).data)


class HeadToHeadSuggestedView(StatsAPIView):
    def get(self, request, *args, **kwargs) -> Response:
        query_serializer = HeadToHeadSuggestedQuerySerializer(data=request.query_params)
        query_serializer.is_valid(raise_exception=True)

        suggested_user_id = suggest_h2h_opponent(
            for_user_id=query_serializer.validated_data["for_user"]
        )
        payload = {"interesting_opponent_id": suggested_user_id}
        return Response(HeadToHeadSuggestedSerializer(payload).data)
