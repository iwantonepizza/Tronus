from __future__ import annotations

from django.urls import path

from .views import AvatarDetailView, AvatarGenerateView, AvatarListView, AvatarSetCurrentView

app_name = "avatars"

urlpatterns = [
    path("avatars/", AvatarListView.as_view(), name="avatar-list"),
    path("avatars/generate/", AvatarGenerateView.as_view(), name="avatar-generate"),
    path(
        "avatars/<int:avatar_id>/set-current/",
        AvatarSetCurrentView.as_view(),
        name="avatar-set-current",
    ),
    path("avatars/<int:avatar_id>/", AvatarDetailView.as_view(), name="avatar-detail"),
]
