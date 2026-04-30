from __future__ import annotations

from django.urls import path

from .views import (
    SessionCancelView,
    SessionClashOfKingsView,
    SessionDetailView,
    SessionEventCardView,
    SessionFinalizePlayedView,
    SessionFinalizeView,
    SessionInviteDetailView,
    SessionInvitesView,
    SessionListCreateView,
    SessionParticipantDetailView,
    SessionParticipantsView,
    SessionRandomizeFactionsView,
    SessionReplaceParticipantView,
    SessionRoundDetailView,
    SessionRoundsView,
    SessionSelfInviteView,
    SessionStartView,
    SessionTimelineView,
    SessionWildlingsRaidView,
)

app_name = "games"

urlpatterns = [
    path("sessions/", SessionListCreateView.as_view(), name="session-list"),
    path("sessions/<int:session_id>/", SessionDetailView.as_view(), name="session-detail"),
    path("sessions/<int:session_id>/start/", SessionStartView.as_view(), name="session-start"),
    path("sessions/<int:session_id>/cancel/", SessionCancelView.as_view(), name="session-cancel"),
    path(
        "sessions/<int:session_id>/finalize/",
        SessionFinalizeView.as_view(),
        name="session-finalize",
    ),
    path(
        "sessions/<int:session_id>/finalize-played/",
        SessionFinalizePlayedView.as_view(),
        name="session-finalize-played",
    ),
    path(
        "sessions/<int:session_id>/participants/",
        SessionParticipantsView.as_view(),
        name="session-participants",
    ),
    path(
        "sessions/<int:session_id>/participants/<int:participation_id>/",
        SessionParticipantDetailView.as_view(),
        name="session-participant-detail",
    ),
    path(
        "sessions/<int:session_id>/replace-participant/",
        SessionReplaceParticipantView.as_view(),
        name="session-replace-participant",
    ),
    path(
        "sessions/<int:session_id>/invites/",
        SessionInvitesView.as_view(),
        name="session-invites",
    ),
    path(
        "sessions/<int:session_id>/invites/me/",
        SessionSelfInviteView.as_view(),
        name="session-self-invite",
    ),
    path(
        "sessions/<int:session_id>/invites/<int:invite_id>/",
        SessionInviteDetailView.as_view(),
        name="session-invite-detail",
    ),
    path(
        "sessions/<int:session_id>/randomize-factions/",
        SessionRandomizeFactionsView.as_view(),
        name="session-randomize-factions",
    ),
    path("sessions/<int:session_id>/rounds/", SessionRoundsView.as_view(), name="session-rounds"),
    path(
        "sessions/<int:session_id>/rounds/<int:round_id>/",
        SessionRoundDetailView.as_view(),
        name="session-round-detail",
    ),
    path(
        "sessions/<int:session_id>/timeline/",
        SessionTimelineView.as_view(),
        name="session-timeline",
    ),
    path(
        "sessions/<int:session_id>/timeline/wildlings-raid/",
        SessionWildlingsRaidView.as_view(),
        name="session-wildlings-raid",
    ),
    path(
        "sessions/<int:session_id>/timeline/clash-of-kings/",
        SessionClashOfKingsView.as_view(),
        name="session-clash-of-kings",
    ),
    path(
        "sessions/<int:session_id>/timeline/event-card/",
        SessionEventCardView.as_view(),
        name="session-event-card",
    ),
]
