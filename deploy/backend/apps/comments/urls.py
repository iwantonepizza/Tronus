from __future__ import annotations

from django.urls import path

from .views import SessionCommentDetailView, SessionCommentListCreateView

app_name = "comments"

urlpatterns = [
    path(
        "sessions/<int:session_id>/comments/",
        SessionCommentListCreateView.as_view(),
        name="comment-list",
    ),
    path(
        "sessions/<int:session_id>/comments/<int:comment_id>/",
        SessionCommentDetailView.as_view(),
        name="comment-detail",
    ),
]
