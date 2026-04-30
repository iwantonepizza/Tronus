from __future__ import annotations

from django.urls import path

from .views import SessionVoteDetailView, SessionVoteListCreateView

app_name = "ratings"

urlpatterns = [
    path(
        "sessions/<int:session_id>/votes/",
        SessionVoteListCreateView.as_view(),
        name="vote-list",
    ),
    path(
        "sessions/<int:session_id>/votes/<int:vote_id>/",
        SessionVoteDetailView.as_view(),
        name="vote-detail",
    ),
]
