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
    CompleteRoundSerializer,
    FinalizeSessionSerializer,
    ParticipationSerializer,
    RoundSnapshotSerializer,
    SessionDetailSerializer,
    SessionListQuerySerializer,
    SessionListSerializer,
    SessionStartSerializer,
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

        if isinstance(exc, Http404):
            return build_error_response(
                code="not_found",
                message="Объект не найден.",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        if isinstance(exc, ObjectDoesNotExist):
            return build_error_response(
                code="not_found",
                message="Объект не найден.",
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


class SessionStartView(GamesAPIView):
    permission_classes = [IsSessionCreatorOrAdmin]

    def post(self, request, session_id: int, *args, **kwargs) -> Response:
        session = get_object_or_404(selectors.get_session_queryset(), pk=session_id)
        self.check_object_permissions(request, session)

        serializer = SessionStartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        updated_session = services.start_session(
            session=session,
            factions_assignment=serializer.validated_data["factions_assignment"],
        )
        detailed_session = selectors.get_session_detail(session_id=updated_session.pk)
        return Response(SessionDetailSerializer(detailed_session).data)


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


class SessionRoundsView(GamesAPIView):
    """GET list + POST complete_round (T-101)."""

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsSessionCreatorOrAdmin()]
        return [AllowAny()]

    def get(self, request, session_id: int, *args, **kwargs) -> Response:
        session = get_object_or_404(selectors.get_session_queryset(), pk=session_id)
        rounds = selectors.get_session_rounds(session=session)
        return Response(RoundSnapshotSerializer(rounds, many=True).data)

    def post(self, request, session_id: int, *args, **kwargs) -> Response:
        session = get_object_or_404(selectors.get_session_queryset(), pk=session_id)
        self.check_object_permissions(request, session)

        serializer = CompleteRoundSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        snapshot = services.complete_round(session=session, **serializer.validated_data)
        return Response(RoundSnapshotSerializer(snapshot).data, status=status.HTTP_201_CREATED)


class SessionRoundDetailView(GamesAPIView):
    """DELETE discard_last_round (admin only, T-101)."""

    permission_classes = [IsSessionCreatorOrAdmin]

    def delete(self, request, session_id: int, round_id: int, *args, **kwargs) -> Response:
        session = get_object_or_404(selectors.get_session_queryset(), pk=session_id)
        self.check_object_permissions(request, session)

        # Verify the round belongs to this session and is the last one
        from .models import RoundSnapshot
        snapshot = get_object_or_404(RoundSnapshot, pk=round_id, session=session)
        last = RoundSnapshot.objects.filter(session=session).order_by("-round_number").first()
        if last is None or last.pk != snapshot.pk:
            return build_error_response(
                code="not_last_round",
                message="Удалять можно только последний раунд.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        services.discard_last_round(session=session)
        return Response(status=status.HTTP_204_NO_CONTENT)


class SessionInvitesView(GamesAPIView):
    """T-120: POST /sessions/<id>/invites/ (creator invites user)."""

    permission_classes = [IsSessionCreatorOrAdmin]

    def post(self, request, session_id: int, *args, **kwargs) -> Response:
        from .serializers import InviteUserSerializer, SessionInviteSerializer
        from apps.accounts.models import User

        session = get_object_or_404(selectors.get_session_queryset(), pk=session_id)
        self.check_object_permissions(request, session)

        serializer = InviteUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        invitee = get_object_or_404(User, pk=serializer.validated_data["user_id"], is_active=True)
        invite = services.invite_user(session=session, inviter=request.user, invitee=invitee)
        invite = (
            selectors.get_invite_queryset().get(pk=invite.pk)
        )
        from .serializers import SessionInviteSerializer
        return Response(SessionInviteSerializer(invite).data, status=status.HTTP_201_CREATED)


class SessionSelfInviteView(GamesAPIView):
    """T-120: POST /sessions/<id>/invites/me/ (player self-registers)."""

    def post(self, request, session_id: int, *args, **kwargs) -> Response:
        from rest_framework.permissions import IsAuthenticated
        if not request.user or not request.user.is_authenticated:
            raise PermissionDenied

        session = get_object_or_404(selectors.get_session_queryset(), pk=session_id)
        invite = services.self_invite(session=session, user=request.user)
        invite = selectors.get_invite_queryset().get(pk=invite.pk)
        from .serializers import SessionInviteSerializer
        return Response(SessionInviteSerializer(invite).data, status=status.HTTP_201_CREATED)


class SessionInviteDetailView(GamesAPIView):
    """T-120: PATCH/DELETE /sessions/<id>/invites/<invite_id>/."""

    def _get_invite(self, session_id: int, invite_id: int):
        return get_object_or_404(
            selectors.get_invite_queryset().filter(session_id=session_id), pk=invite_id
        )

    def patch(self, request, session_id: int, invite_id: int, *args, **kwargs) -> Response:
        from .serializers import UpdateInviteSerializer, SessionInviteSerializer
        from apps.reference.models import Faction

        invite = self._get_invite(session_id, invite_id)
        # Owner can update own invite; session creator/admin can update any
        is_owner = invite.user_id == request.user.pk
        is_admin = request.user.is_staff or invite.session.created_by_id == request.user.pk
        if not (is_owner or is_admin):
            raise PermissionDenied

        serializer = UpdateInviteSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        vd = serializer.validated_data

        kwargs_update = {}
        if "rsvp_status" in vd:
            kwargs_update["rsvp_status"] = vd["rsvp_status"]
        if "desired_faction_slug" in vd:
            slug = vd["desired_faction_slug"]
            if slug is None:
                kwargs_update["desired_faction"] = None
            else:
                faction = get_object_or_404(Faction, slug=slug)
                kwargs_update["desired_faction"] = faction

        updated = services.update_rsvp(invite=invite, **kwargs_update)
        updated = selectors.get_invite_queryset().get(pk=updated.pk)
        return Response(SessionInviteSerializer(updated).data)

    def delete(self, request, session_id: int, invite_id: int, *args, **kwargs) -> Response:
        invite = self._get_invite(session_id, invite_id)
        is_owner = invite.user_id == request.user.pk
        is_admin = request.user.is_staff or invite.session.created_by_id == request.user.pk
        if not (is_owner or is_admin):
            raise PermissionDenied
        services.withdraw_invite(invite=invite)
        return Response(status=status.HTTP_204_NO_CONTENT)


class SessionRandomizeFactionsView(GamesAPIView):
    """T-121: POST /sessions/<id>/randomize-factions/ — preview assignment (no save)."""

    permission_classes = [IsSessionCreatorOrAdmin]

    def post(self, request, session_id: int, *args, **kwargs) -> Response:
        session = get_object_or_404(selectors.get_session_queryset(), pk=session_id)
        self.check_object_permissions(request, session)
        assignment = services.randomize_factions(session=session)
        # Return as list for easy frontend consumption
        return Response(
            [{"user_id": uid, "faction_slug": slug} for uid, slug in assignment.items()]
        )


# ──────────────────────────────────────────────────────────────────────────────
# T-120: Invitations & RSVP
# ──────────────────────────────────────────────────────────────────────────────

class SessionInvitesView(GamesAPIView):
    """GET list + POST invite by creator."""

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsSessionCreatorOrAdmin()]
        return [AllowAny()]

    def get(self, request, session_id: int, *args, **kwargs) -> Response:
        from .models import SessionInvite
        from .serializers import SessionInviteSerializer
        session = get_object_or_404(selectors.get_session_queryset(), pk=session_id)
        invites = SessionInvite.objects.filter(session=session).select_related(
            "user__profile", "invited_by__profile", "desired_faction"
        ).order_by("created_at")
        from .serializers import SessionInviteSerializer
        return Response(SessionInviteSerializer(invites, many=True).data)

    def post(self, request, session_id: int, *args, **kwargs) -> Response:
        from .serializers import InviteUserSerializer, SessionInviteSerializer
        session = get_object_or_404(selectors.get_session_queryset(), pk=session_id)
        self.check_object_permissions(request, session)
        serializer = InviteUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        invite = services.invite_user(
            session=session,
            inviter=request.user,
            invitee=serializer.validated_data["invitee"],
        )
        invite.refresh_from_db()
        return Response(SessionInviteSerializer(invite).data, status=status.HTTP_201_CREATED)


class SessionSelfInviteView(GamesAPIView):
    """POST self-invite (any authenticated user, planned session only)."""

    permission_classes = [IsPlayerUser]

    def post(self, request, session_id: int, *args, **kwargs) -> Response:
        from .serializers import SessionInviteSerializer
        session = get_object_or_404(selectors.get_session_queryset(), pk=session_id)
        invite = services.self_invite(session=session, user=request.user)
        invite.refresh_from_db()
        return Response(SessionInviteSerializer(invite).data, status=status.HTTP_201_CREATED)


class SessionInviteDetailView(GamesAPIView):
    """PATCH rsvp/faction + DELETE withdraw."""

    def get_permissions(self):
        return [IsPlayerUser()]

    def _get_invite(self, session_id: int, invite_id: int):
        from .models import SessionInvite
        return get_object_or_404(
            SessionInvite.objects.select_related("session", "user"),
            pk=invite_id,
            session_id=session_id,
        )

    def patch(self, request, session_id: int, invite_id: int, *args, **kwargs) -> Response:
        from .serializers import UpdateRsvpSerializer, SessionInviteSerializer
        invite = self._get_invite(session_id, invite_id)

        # Only invite owner or session creator/admin can patch
        if invite.user_id != request.user.pk and not (
            request.user.is_staff or invite.session.created_by_id == request.user.pk
        ):
            raise PermissionDenied

        serializer = UpdateRsvpSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        if "rsvp_status" in serializer.validated_data or "desired_faction" in serializer.validated_data:
            updated = services.update_rsvp(invite=invite, **serializer.validated_data)
        else:
            updated = invite

        updated.refresh_from_db()
        return Response(SessionInviteSerializer(updated).data)

    def delete(self, request, session_id: int, invite_id: int, *args, **kwargs) -> Response:
        invite = self._get_invite(session_id, invite_id)
        if invite.user_id != request.user.pk and not (
            request.user.is_staff or invite.session.created_by_id == request.user.pk
        ):
            raise PermissionDenied
        services.withdraw_invite(invite=invite)
        return Response(status=status.HTTP_204_NO_CONTENT)


# ──────────────────────────────────────────────────────────────────────────────
# T-121: Randomize factions
# ──────────────────────────────────────────────────────────────────────────────

class SessionRandomizeFactionsView(GamesAPIView):
    """POST preview — returns random assignment, does NOT persist."""

    permission_classes = [IsSessionCreatorOrAdmin]

    def post(self, request, session_id: int, *args, **kwargs) -> Response:
        session = get_object_or_404(
            selectors.get_session_queryset().select_related("mode"), pk=session_id
        )
        self.check_object_permissions(request, session)
        assignment = services.randomize_factions(session=session)
        result = [{"user_id": uid, "faction_slug": slug} for uid, slug in assignment.items()]
        return Response(result)


# ──────────────────────────────────────────────────────────────────────────────
# T-122: Replace participant
# ──────────────────────────────────────────────────────────────────────────────

class SessionReplaceParticipantView(GamesAPIView):
    permission_classes = [IsSessionCreatorOrAdmin]

    def post(self, request, session_id: int, *args, **kwargs) -> Response:
        from .serializers import ReplaceParticipantSerializer, ParticipationSerializer
        session = get_object_or_404(selectors.get_session_queryset(), pk=session_id)
        self.check_object_permissions(request, session)
        serializer = ReplaceParticipantSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_participation = services.replace_participant(
            session=session, **serializer.validated_data
        )
        new_p = get_object_or_404(selectors.get_participation_queryset(), pk=new_participation.pk)
        return Response(ParticipationSerializer(new_p).data, status=status.HTTP_201_CREATED)


# ──────────────────────────────────────────────────────────────────────────────
# T-123: Updated finalize (CR-007)
# ──────────────────────────────────────────────────────────────────────────────

class SessionFinalizeView(GamesAPIView):
    permission_classes = [IsSessionCreatorOrAdmin]

    def post(self, request, session_id: int, *args, **kwargs) -> Response:
        from .serializers import FinalizeSessionSerializer
        session = get_object_or_404(selectors.get_session_queryset(), pk=session_id)
        self.check_object_permissions(request, session)
        serializer = FinalizeSessionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        outcome = services.finalize_session(session=session, **serializer.validated_data)
        detailed = selectors.get_session_detail(session_id=outcome.session_id)
        return Response(SessionDetailSerializer(detailed).data, status=status.HTTP_201_CREATED)


# ──────────────────────────────────────────────────────────────────────────────
# T-102 / T-103 / T-104: Timeline event endpoints
# ──────────────────────────────────────────────────────────────────────────────

class SessionWildlingsRaidView(GamesAPIView):
    permission_classes = [IsSessionCreatorOrAdmin]

    def post(self, request, session_id: int, *args, **kwargs) -> Response:
        from .serializers import WildlingsRaidSerializer, MatchTimelineEventSerializer
        session = get_object_or_404(selectors.get_session_queryset(), pk=session_id)
        self.check_object_permissions(request, session)
        serializer = WildlingsRaidSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        event = services.record_wildlings_raid(
            session=session, actor=request.user, **serializer.validated_data
        )
        return Response(MatchTimelineEventSerializer(event).data, status=status.HTTP_201_CREATED)


class SessionClashOfKingsView(GamesAPIView):
    permission_classes = [IsSessionCreatorOrAdmin]

    def post(self, request, session_id: int, *args, **kwargs) -> Response:
        from .serializers import ClashOfKingsSerializer, MatchTimelineEventSerializer
        session = get_object_or_404(selectors.get_session_queryset(), pk=session_id)
        self.check_object_permissions(request, session)
        serializer = ClashOfKingsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        event = services.record_clash_of_kings(
            session=session, actor=request.user, **serializer.validated_data
        )
        return Response(MatchTimelineEventSerializer(event).data, status=status.HTTP_201_CREATED)


class SessionEventCardView(GamesAPIView):
    permission_classes = [IsSessionCreatorOrAdmin]

    def post(self, request, session_id: int, *args, **kwargs) -> Response:
        from .serializers import EventCardPlayedSerializer, MatchTimelineEventSerializer
        session = get_object_or_404(selectors.get_session_queryset(), pk=session_id)
        self.check_object_permissions(request, session)
        serializer = EventCardPlayedSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        event = services.record_event_card_played(
            session=session, actor=request.user, **serializer.validated_data
        )
        return Response(MatchTimelineEventSerializer(event).data, status=status.HTTP_201_CREATED)


# ──────────────────────────────────────────────────────────────────────────────
# T-126: Timeline list endpoint
# ──────────────────────────────────────────────────────────────────────────────

class SessionTimelineView(GamesAPIView):
    def get_permissions(self):
        return [AllowAny()]

    def get(self, request, session_id: int, *args, **kwargs) -> Response:
        from .serializers import MatchTimelineEventSerializer
        session = get_object_or_404(selectors.get_session_queryset(), pk=session_id)
        events = selectors.get_session_timeline(session=session)
        return Response(MatchTimelineEventSerializer(events, many=True).data)
