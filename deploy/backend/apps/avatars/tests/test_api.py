from __future__ import annotations

import pytest

from apps.avatars.models import AvatarAsset
from apps.avatars.services import generate_basic_avatar, set_current_avatar


@pytest.mark.django_db
def test_list_avatars_requires_authentication(api_client) -> None:
    response = api_client.get("/api/v1/avatars/")

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "unauthorized"


@pytest.mark.django_db
def test_generate_avatar_creates_asset(
    api_client,
    avatar_media_root,
    make_user,
    ensure_faction,
    make_photo_file,
) -> None:
    user = make_user(email="sansa@example.com")
    ensure_faction()
    assert api_client.login(username=user.username, password="StrongPassword123!")

    response = api_client.post(
        "/api/v1/avatars/generate/",
        {"faction": "stark", "photo": make_photo_file()},
    )

    avatar = AvatarAsset.objects.get(user=user)

    assert response.status_code == 201
    assert response.json()["id"] == avatar.pk
    assert response.json()["faction"] == "stark"
    assert response.json()["style"] == AvatarAsset.Style.BASIC_FRAME
    assert response.json()["is_current"] is False


@pytest.mark.django_db
def test_list_avatars_returns_only_current_users_assets(
    api_client,
    avatar_media_root,
    make_user,
    ensure_faction,
    make_photo_file,
) -> None:
    faction = ensure_faction()
    owner = make_user(email="owner@example.com")
    stranger = make_user(email="stranger@example.com")
    generate_basic_avatar(user=owner, faction=faction, photo_file=make_photo_file())
    generate_basic_avatar(user=stranger, faction=faction, photo_file=make_photo_file())
    assert api_client.login(username=owner.username, password="StrongPassword123!")

    response = api_client.get("/api/v1/avatars/")

    assert response.status_code == 200
    assert len(response.json()) == 1


@pytest.mark.django_db
def test_set_current_avatar_marks_asset_and_updates_me_serializer(
    api_client,
    avatar_media_root,
    make_user,
    ensure_faction,
    make_photo_file,
) -> None:
    user = make_user(email="meera@example.com")
    faction = ensure_faction()
    avatar = generate_basic_avatar(user=user, faction=faction, photo_file=make_photo_file())
    assert api_client.login(username=user.username, password="StrongPassword123!")

    response = api_client.post(f"/api/v1/avatars/{avatar.pk}/set-current/")
    me_response = api_client.get("/api/v1/auth/me/")

    assert response.status_code == 200
    assert response.json()["is_current"] is True
    assert me_response.status_code == 200
    assert me_response.json()["current_avatar"].startswith("http://testserver/media/avatars/")


@pytest.mark.django_db
def test_delete_avatar_removes_asset(
    api_client,
    avatar_media_root,
    make_user,
    ensure_faction,
    make_photo_file,
) -> None:
    user = make_user(email="delete@example.com")
    faction = ensure_faction()
    avatar = generate_basic_avatar(user=user, faction=faction, photo_file=make_photo_file())
    set_current_avatar(avatar=avatar)
    assert api_client.login(username=user.username, password="StrongPassword123!")

    response = api_client.delete(f"/api/v1/avatars/{avatar.pk}/")
    me_response = api_client.get("/api/v1/auth/me/")

    assert response.status_code == 204
    assert AvatarAsset.objects.filter(pk=avatar.pk).exists() is False
    assert me_response.json()["current_avatar"] is None


@pytest.mark.django_db
def test_non_owner_cannot_manage_other_users_avatar(
    api_client,
    avatar_media_root,
    make_user,
    ensure_faction,
    make_photo_file,
) -> None:
    owner = make_user(email="owner2@example.com")
    stranger = make_user(email="stranger2@example.com")
    faction = ensure_faction()
    avatar = generate_basic_avatar(user=owner, faction=faction, photo_file=make_photo_file())
    assert api_client.login(username=stranger.username, password="StrongPassword123!")

    response = api_client.post(f"/api/v1/avatars/{avatar.pk}/set-current/")

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_found"
