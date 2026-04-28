from __future__ import annotations

from django.urls import path

from .views import (
    SessionCancelView,
    SessionDetailView,
    SessionFinalizeView,
    SessionListCreateView,
    SessionParticipantDetailView,
    SessionParticipantsView,
)

app_name = "games"

urlpatterns = [
    path("sessions/", SessionListCreateView.as_view(), name="session-list"),
    path("sessions/<int:session_id>/", SessionDetailView.as_view(), name="session-detail"),
    path("sessions/<int:session_id>/cancel/", SessionCancelView.as_view(), name="session-cancel"),
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
        "sessions/<int:session_id>/finalize/",
        SessionFinalizeView.as_view(),
        name="session-finalize",
    ),
]
