from __future__ import annotations

from django.urls import path

from .views import (
    CsrfTokenView,
    LoginView,
    LogoutView,
    MeView,
    PasswordChangeView,
    PasswordResetView,
    PendingRegistrationApproveView,
    PendingRegistrationListView,
    PendingRegistrationRejectView,
    ProfileUpdateView,
    PublicUserDetailView,
    PublicUserListView,
    RegisterView,
    SearchView,
)

app_name = "accounts"

urlpatterns = [
    path("auth/csrf/", CsrfTokenView.as_view(), name="csrf"),
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/password/reset/", PasswordResetView.as_view(), name="password-reset"),
    path("auth/password/change/", PasswordChangeView.as_view(), name="password-change"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/me/", MeView.as_view(), name="me"),
    path("users/", PublicUserListView.as_view(), name="user-list"),
    path("users/<int:user_id>/", PublicUserDetailView.as_view(), name="user-detail"),
    path("users/<int:user_id>/profile/", ProfileUpdateView.as_view(), name="profile-update"),
    path("search/", SearchView.as_view(), name="search"),
    path(
        "admin/pending-users/",
        PendingRegistrationListView.as_view(),
        name="admin-pending-users",
    ),
    path(
        "admin/pending-users/<int:user_id>/approve/",
        PendingRegistrationApproveView.as_view(),
        name="admin-pending-users-approve",
    ),
    path(
        "admin/pending-users/<int:user_id>/reject/",
        PendingRegistrationRejectView.as_view(),
        name="admin-pending-users-reject",
    ),
]
