from __future__ import annotations

from django.contrib.admin.sites import site
from django.contrib.messages.storage.fallback import FallbackStorage
from django.test import RequestFactory

from apps.accounts.models import User
from apps.comments.admin import MatchCommentAdmin
from apps.comments.models import MatchComment
from apps.games.models import GameSession
from apps.reference.models import Deck, GameMode


def _build_admin_request() -> object:
    request = RequestFactory().post("/admin/comments/matchcomment/")
    request.user = User(is_staff=True, is_superuser=True)
    request.session = {}
    request._messages = FallbackStorage(request)
    return request


def _make_session(*, user: User) -> GameSession:
    mode, _ = GameMode.objects.get_or_create(
        slug="classic",
        defaults={"name": "Classic", "min_players": 3, "max_players": 8},
    )
    deck, _ = Deck.objects.get_or_create(slug="original", defaults={"name": "Original"})
    return GameSession.objects.create(
        scheduled_at="2026-05-01T18:00:00Z",
        mode=mode,
        deck=deck,
        created_by=user,
    )


def test_match_comment_model_is_registered_with_custom_admin() -> None:
    assert site.is_registered(MatchComment)
    assert isinstance(site._registry[MatchComment], MatchCommentAdmin)


def test_match_comment_admin_has_expected_actions() -> None:
    admin_instance = site._registry[MatchComment]

    assert admin_instance.actions == ("soft_delete_selected", "restore_selected")
    assert admin_instance.list_filter == ("is_deleted", "created_at")


def test_soft_delete_selected_action_marks_comment_deleted(db) -> None:
    author = User.objects.create_user(
        username="commenter@example.com",
        email="commenter@example.com",
        password="StrongPassword123!",
        is_active=True,
    )
    session = _make_session(user=author)
    comment = MatchComment.objects.create(session=session, author=author, body="To delete")
    admin_instance = site._registry[MatchComment]
    request = _build_admin_request()

    admin_instance.soft_delete_selected(request, MatchComment.objects.filter(pk=comment.pk))
    comment.refresh_from_db()

    assert comment.is_deleted is True


def test_restore_selected_action_marks_comment_active(db) -> None:
    author = User.objects.create_user(
        username="restorer@example.com",
        email="restorer@example.com",
        password="StrongPassword123!",
        is_active=True,
    )
    session = _make_session(user=author)
    comment = MatchComment.objects.create(
        session=session,
        author=author,
        body="Restore me",
        is_deleted=True,
    )
    admin_instance = site._registry[MatchComment]
    request = _build_admin_request()

    admin_instance.restore_selected(request, MatchComment.objects.filter(pk=comment.pk))
    comment.refresh_from_db()

    assert comment.is_deleted is False
