from __future__ import annotations

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile

from apps.avatars.models import AvatarAsset
from apps.comments.models import MatchComment
from apps.reference.models import Faction


@pytest.mark.django_db
def test_list_comments_is_public_and_supports_before_cursor(
    api_client,
    make_user,
    make_session,
) -> None:
    author = make_user(email="author@example.com")
    session = make_session(created_by=author)
    oldest_comment = MatchComment.objects.create(session=session, author=author, body="Oldest")
    middle_comment = MatchComment.objects.create(session=session, author=author, body="Middle")
    newest_comment = MatchComment.objects.create(session=session, author=author, body="Newest")

    response = api_client.get(
        f"/api/v1/sessions/{session.pk}/comments/",
        {"before": newest_comment.pk, "limit": 2},
    )

    assert response.status_code == 200
    assert [item["id"] for item in response.json()] == [middle_comment.pk, oldest_comment.pk]


@pytest.mark.django_db
def test_list_comments_returns_absolute_author_avatar_url(
    api_client,
    make_user,
    make_session,
    settings,
    tmp_path,
) -> None:
    media_root = tmp_path / "media"
    media_root.mkdir(parents=True, exist_ok=True)
    settings.MEDIA_ROOT = media_root
    settings.MEDIA_URL = "/media/"

    author = make_user(email="avatar-author@example.com")
    faction, _ = Faction.objects.get_or_create(
        slug="stark",
        defaults={
            "name": "Stark",
            "color": "#6B7B8C",
            "on_primary": "#F0F0F0",
            "is_active": True,
        },
    )
    avatar = AvatarAsset.objects.create(
        user=author,
        faction=faction,
        generated_image=SimpleUploadedFile(
            "comment-avatar.png",
            b"comment-avatar-bytes",
            content_type="image/png",
        ),
        is_current=True,
    )
    author.profile.current_avatar = avatar
    author.profile.save(update_fields=["current_avatar"])
    session = make_session(created_by=author)
    MatchComment.objects.create(session=session, author=author, body="Avatar comment")

    response = api_client.get(f"/api/v1/sessions/{session.pk}/comments/")

    assert response.status_code == 200
    assert response.json()[0]["author"]["current_avatar"].startswith(
        "http://testserver/media/avatars/"
    )


@pytest.mark.django_db
def test_list_comments_returns_validation_error_for_invalid_limit(
    api_client,
    make_user,
    make_session,
) -> None:
    author = make_user(email="author@example.com")
    session = make_session(created_by=author)

    response = api_client.get(f"/api/v1/sessions/{session.pk}/comments/", {"limit": 0})

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "validation_error"
    assert "limit" in response.json()["error"]["details"]


@pytest.mark.django_db
def test_post_comment_requires_authentication(api_client, make_user, make_session) -> None:
    author = make_user(email="author@example.com")
    session = make_session(created_by=author)

    response = api_client.post(
        f"/api/v1/sessions/{session.pk}/comments/",
        {"body": "Hello"},
        format="json",
    )

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "unauthorized"


@pytest.mark.django_db
def test_post_comment_creates_comment_for_authenticated_user(
    api_client,
    make_user,
    make_session,
) -> None:
    author = make_user(email="author@example.com")
    session = make_session(created_by=author)
    assert api_client.login(username=author.username, password="StrongPassword123!")

    response = api_client.post(
        f"/api/v1/sessions/{session.pk}/comments/",
        {"body": "  Burn them all.  "},
        format="json",
    )

    comment = MatchComment.objects.get(session=session, author=author)

    assert response.status_code == 201
    assert response.json()["id"] == comment.pk
    assert response.json()["body"] == "Burn them all."


@pytest.mark.django_db
def test_post_comment_returns_validation_error_for_blank_body(
    api_client,
    make_user,
    make_session,
) -> None:
    author = make_user(email="author@example.com")
    session = make_session(created_by=author)
    assert api_client.login(username=author.username, password="StrongPassword123!")

    response = api_client.post(
        f"/api/v1/sessions/{session.pk}/comments/",
        {"body": "   "},
        format="json",
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "validation_error"
    assert "body" in response.json()["error"]["details"]


@pytest.mark.django_db
def test_patch_comment_allows_author_to_edit(api_client, make_user, make_session) -> None:
    author = make_user(email="author@example.com")
    session = make_session(created_by=author)
    comment = MatchComment.objects.create(session=session, author=author, body="Original")
    assert api_client.login(username=author.username, password="StrongPassword123!")

    response = api_client.patch(
        f"/api/v1/sessions/{session.pk}/comments/{comment.pk}/",
        {"body": "  Updated  "},
        format="json",
    )

    comment.refresh_from_db()

    assert response.status_code == 200
    assert response.json()["body"] == "Updated"
    assert comment.edited_at is not None


@pytest.mark.django_db
def test_patch_comment_forbids_non_author(api_client, make_user, make_session) -> None:
    author = make_user(email="author@example.com")
    stranger = make_user(email="stranger@example.com")
    session = make_session(created_by=author)
    comment = MatchComment.objects.create(session=session, author=author, body="Original")
    assert api_client.login(username=stranger.username, password="StrongPassword123!")

    response = api_client.patch(
        f"/api/v1/sessions/{session.pk}/comments/{comment.pk}/",
        {"body": "Hack"},
        format="json",
    )

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "permission_denied"


@pytest.mark.django_db
def test_patch_comment_returns_validation_error_for_deleted_comment(
    api_client,
    make_user,
    make_session,
) -> None:
    author = make_user(email="author@example.com")
    session = make_session(created_by=author)
    comment = MatchComment.objects.create(
        session=session,
        author=author,
        body="Original",
        is_deleted=True,
    )
    assert api_client.login(username=author.username, password="StrongPassword123!")

    response = api_client.patch(
        f"/api/v1/sessions/{session.pk}/comments/{comment.pk}/",
        {"body": "Updated"},
        format="json",
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "validation_error"
    assert response.json()["error"]["details"]["comment"] == [
        "Удалённый комментарий нельзя редактировать."
    ]


@pytest.mark.django_db
def test_delete_comment_allows_author_and_hides_comment_from_list(
    api_client,
    make_user,
    make_session,
) -> None:
    author = make_user(email="author@example.com")
    session = make_session(created_by=author)
    comment = MatchComment.objects.create(session=session, author=author, body="Delete me")
    assert api_client.login(username=author.username, password="StrongPassword123!")

    delete_response = api_client.delete(f"/api/v1/sessions/{session.pk}/comments/{comment.pk}/")
    list_response = api_client.get(f"/api/v1/sessions/{session.pk}/comments/")
    comment.refresh_from_db()

    assert delete_response.status_code == 204
    assert comment.is_deleted is True
    assert list_response.json() == []


@pytest.mark.django_db
def test_delete_comment_allows_admin(api_client, make_user, make_session) -> None:
    author = make_user(email="author@example.com")
    admin = make_user(email="admin@example.com", is_staff=True)
    session = make_session(created_by=author)
    comment = MatchComment.objects.create(session=session, author=author, body="Delete me")
    assert api_client.login(username=admin.username, password="StrongPassword123!")

    response = api_client.delete(f"/api/v1/sessions/{session.pk}/comments/{comment.pk}/")
    comment.refresh_from_db()

    assert response.status_code == 204
    assert comment.is_deleted is True
