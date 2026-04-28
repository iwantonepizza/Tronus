from __future__ import annotations

from unittest.mock import patch

import pytest
from django.core.cache import cache

from apps.accounts.models import User
from apps.accounts.services import approve_user
from apps.reference.models import Faction


@pytest.fixture(autouse=True)
def clear_rate_limit_cache() -> None:
    cache.clear()
    yield
    cache.clear()


def _ensure_stark_faction() -> Faction:
    faction, _ = Faction.objects.get_or_create(
        slug="stark",
        defaults={
            "name": "Stark",
            "color": "#6B7B8C",
            "on_primary": "#F0F0F0",
            "is_active": True,
        },
    )
    return faction


@pytest.mark.django_db
def test_register_endpoint_creates_inactive_user(api_client) -> None:
    response = api_client.post(
        "/api/v1/auth/register/",
        {
            "email": "friend@example.com",
            "password": "StrongPassword123!",
            "nickname": "IronFist",
        },
        format="json",
    )

    user = User.objects.get(email="friend@example.com")

    assert response.status_code == 201
    assert response.json()["status"] == "pending_approval"
    assert user.is_active is False
    assert user.profile.nickname == "IronFist"


@pytest.mark.django_db
def test_csrf_endpoint_sets_cookie(api_client) -> None:
    response = api_client.get(
        "/api/v1/auth/csrf/",
        HTTP_ORIGIN="http://localhost:5173",
    )

    assert response.status_code == 200
    assert response.json()["detail"] == "CSRF cookie set"
    assert "csrftoken" in response.cookies
    assert response.headers["Access-Control-Allow-Origin"] == "http://localhost:5173"
    assert response.headers["Access-Control-Allow-Credentials"] == "true"


@pytest.mark.django_db
def test_cors_preflight_allows_frontend_origin(api_client) -> None:
    response = api_client.options(
        "/api/v1/auth/login/",
        HTTP_ORIGIN="http://localhost:5173",
        HTTP_ACCESS_CONTROL_REQUEST_METHOD="POST",
        HTTP_ACCESS_CONTROL_REQUEST_HEADERS="content-type,x-csrftoken",
    )

    assert response.status_code == 200
    assert response.headers["Access-Control-Allow-Origin"] == "http://localhost:5173"
    assert response.headers["Access-Control-Allow-Credentials"] == "true"
    assert "POST" in response.headers["Access-Control-Allow-Methods"]
    assert "x-csrftoken" in response.headers["Access-Control-Allow-Headers"]


@pytest.mark.django_db
def test_login_inactive_user_returns_pending_approval_error(api_client) -> None:
    User.objects.create_user(
        username="pending@example.com",
        email="pending@example.com",
        password="StrongPassword123!",
        is_active=False,
    )

    response = api_client.post(
        "/api/v1/auth/login/",
        {"email": "pending@example.com", "password": "StrongPassword123!"},
        format="json",
    )

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "account_pending_approval"


@pytest.mark.django_db
def test_login_unknown_email_returns_invalid_credentials_without_authenticate(api_client) -> None:
    with patch("apps.accounts.views.authenticate") as authenticate_mock:
        response = api_client.post(
            "/api/v1/auth/login/",
            {"email": "missing@example.com", "password": "StrongPassword123!"},
            format="json",
        )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "invalid_credentials"
    authenticate_mock.assert_not_called()


@pytest.mark.django_db
def test_approved_user_can_login_and_read_me(api_client) -> None:
    user = User.objects.create_user(
        username="approved@example.com",
        email="approved@example.com",
        password="StrongPassword123!",
        is_active=False,
    )
    user.profile.nickname = "ApprovedUser"
    user.profile.save(update_fields=["nickname"])
    approve_user(user=user)

    login_response = api_client.post(
        "/api/v1/auth/login/",
        {"email": "approved@example.com", "password": "StrongPassword123!"},
        format="json",
    )
    me_response = api_client.get("/api/v1/auth/me/")

    assert login_response.status_code == 200
    assert login_response.json()["email"] == "approved@example.com"
    assert me_response.status_code == 200
    assert me_response.json()["nickname"] == "ApprovedUser"
    assert me_response.json()["email"] == "approved@example.com"


@pytest.mark.django_db
def test_logout_clears_authenticated_session(api_client) -> None:
    User.objects.create_user(
        username="logout@example.com",
        email="logout@example.com",
        password="StrongPassword123!",
        is_active=True,
    )

    assert api_client.login(username="logout@example.com", password="StrongPassword123!")

    logout_response = api_client.post("/api/v1/auth/logout/")
    me_response = api_client.get("/api/v1/auth/me/")

    assert logout_response.status_code == 204
    assert me_response.status_code == 403


@pytest.mark.django_db
def test_register_rate_limit_blocks_sixth_request(api_client) -> None:
    responses = []

    for attempt in range(6):
        response = api_client.post(
            "/api/v1/auth/register/",
            {
                "email": f"friend{attempt}@example.com",
                "password": "StrongPassword123!",
                "nickname": f"IronFist{attempt}",
            },
            format="json",
            REMOTE_ADDR="10.0.0.1",
        )
        responses.append(response)

    assert [response.status_code for response in responses[:5]] == [201, 201, 201, 201, 201]
    assert responses[5].status_code == 429
    assert responses[5].json()["error"]["code"] == "rate_limited"


@pytest.mark.django_db
def test_login_rate_limit_blocks_sixth_request(api_client) -> None:
    User.objects.create_user(
        username="ratelimit@example.com",
        email="ratelimit@example.com",
        password="StrongPassword123!",
        is_active=True,
    )

    responses = []
    for _ in range(6):
        response = api_client.post(
            "/api/v1/auth/login/",
            {"email": "ratelimit@example.com", "password": "wrong-password"},
            format="json",
            REMOTE_ADDR="10.0.0.2",
        )
        responses.append(response)

    assert [response.status_code for response in responses[:5]] == [400, 400, 400, 400, 400]
    assert responses[5].status_code == 429
    assert responses[5].json()["error"]["code"] == "rate_limited"


@pytest.mark.django_db
def test_users_list_returns_only_active_public_profiles(api_client) -> None:
    active_user = User.objects.create_user(
        username="active@example.com",
        email="active@example.com",
        password="StrongPassword123!",
        is_active=True,
    )
    active_user.profile.nickname = "ActiveUser"
    active_user.profile.save(update_fields=["nickname"])
    User.objects.create_user(
        username="inactive@example.com",
        email="inactive@example.com",
        password="StrongPassword123!",
        is_active=False,
    )

    response = api_client.get("/api/v1/users/")

    assert response.status_code == 200
    assert {item["nickname"] for item in response.json()} == {"ActiveUser"}
    assert "email" not in response.json()[0]


@pytest.mark.django_db
def test_user_detail_returns_public_profile(api_client) -> None:
    user = User.objects.create_user(
        username="detail@example.com",
        email="detail@example.com",
        password="StrongPassword123!",
        is_active=True,
    )
    user.profile.nickname = "DetailUser"
    user.profile.save(update_fields=["nickname"])

    response = api_client.get(f"/api/v1/users/{user.pk}/")

    assert response.status_code == 200
    assert response.json()["nickname"] == "DetailUser"
    assert "email" not in response.json()


@pytest.mark.django_db
def test_self_profile_patch_updates_profile_and_returns_private_serializer(api_client) -> None:
    user = User.objects.create_user(
        username="self@example.com",
        email="self@example.com",
        password="StrongPassword123!",
        is_active=True,
    )
    faction = _ensure_stark_faction()
    assert api_client.login(username="self@example.com", password="StrongPassword123!")

    response = api_client.patch(
        f"/api/v1/users/{user.pk}/profile/",
        {
            "nickname": "SelfUser",
            "bio": "Winterfell",
            "favorite_faction": "stark",
        },
        format="json",
    )

    user.refresh_from_db()

    assert response.status_code == 200
    assert response.json()["email"] == "self@example.com"
    assert response.json()["nickname"] == "SelfUser"
    assert response.json()["favorite_faction"] == "stark"
    assert user.profile.nickname == "SelfUser"
    assert user.profile.bio == "Winterfell"
    assert user.profile.favorite_faction == faction


@pytest.mark.django_db
def test_other_user_cannot_patch_someone_elses_profile(api_client) -> None:
    owner = User.objects.create_user(
        username="owner@example.com",
        email="owner@example.com",
        password="StrongPassword123!",
        is_active=True,
    )
    User.objects.create_user(
        username="stranger@example.com",
        email="stranger@example.com",
        password="StrongPassword123!",
        is_active=True,
    )
    assert api_client.login(username="stranger@example.com", password="StrongPassword123!")

    response = api_client.patch(
        f"/api/v1/users/{owner.pk}/profile/",
        {"nickname": "Hacked"},
        format="json",
    )

    owner.refresh_from_db()

    assert response.status_code == 403
    assert owner.profile.nickname != "Hacked"
