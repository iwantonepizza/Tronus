from __future__ import annotations

from django.contrib.admin.sites import site
from django.contrib.auth.models import Group
from django.contrib.messages.storage.fallback import FallbackStorage
from django.test import RequestFactory

from apps.accounts.admin import UserAdmin
from apps.accounts.models import User


def _build_admin_request() -> object:
    request = RequestFactory().post("/admin/accounts/user/")
    request.user = User(is_staff=True, is_superuser=True)
    request.session = {}
    request._messages = FallbackStorage(request)
    return request


def test_user_model_is_registered_with_custom_admin() -> None:
    assert site.is_registered(User)
    assert isinstance(site._registry[User], UserAdmin)


def test_user_admin_has_expected_filters_and_ordering() -> None:
    admin_instance = site._registry[User]

    assert admin_instance.list_filter == ("is_active",)
    assert admin_instance.ordering == ("-date_joined",)
    assert admin_instance.list_display == ("email", "nickname", "is_active", "date_joined")


def test_approve_selected_users_action_activates_users_and_adds_message(db) -> None:
    user = User.objects.create_user(
        username="pending@example.com",
        email="pending@example.com",
        password="StrongPassword123!",
        is_active=False,
    )
    admin_instance = site._registry[User]
    request = _build_admin_request()

    admin_instance.approve_selected_users(request, User.objects.filter(pk=user.pk))

    user.refresh_from_db()

    messages = [message.message for message in request._messages]

    assert user.is_active is True
    assert user.groups.filter(name="player").exists()
    assert "Approved 1 user(s)." in messages
    assert Group.objects.filter(name="player").exists()
