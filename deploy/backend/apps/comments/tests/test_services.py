from __future__ import annotations

import pytest
from django.core.exceptions import ValidationError

from apps.comments.models import MatchComment
from apps.comments.services import delete_comment, edit_comment, post_comment


@pytest.mark.django_db
def test_post_comment_creates_comment_with_trimmed_body(make_user, make_session) -> None:
    author = make_user(email="author@example.com")
    session = make_session(created_by=author)

    comment = post_comment(
        session=session,
        author=author,
        body="  Winter is coming.  ",
    )

    assert comment.session == session
    assert comment.author == author
    assert comment.body == "Winter is coming."
    assert comment.is_deleted is False


@pytest.mark.django_db
def test_post_comment_rejects_blank_body(make_user, make_session) -> None:
    author = make_user(email="author@example.com")
    session = make_session(created_by=author)

    with pytest.raises(ValidationError) as exc_info:
        post_comment(session=session, author=author, body="   ")

    assert exc_info.value.message_dict == {"body": ["Текст комментария не может быть пустым."]}


@pytest.mark.django_db
def test_edit_comment_updates_body_and_edited_at(make_user, make_session) -> None:
    author = make_user(email="author@example.com")
    session = make_session(created_by=author)
    comment = MatchComment.objects.create(
        session=session,
        author=author,
        body="Old body",
    )

    updated_comment = edit_comment(comment=comment, body="  New body  ")

    assert updated_comment.body == "New body"
    assert updated_comment.edited_at is not None


@pytest.mark.django_db
def test_edit_comment_rejects_deleted_comment(make_user, make_session) -> None:
    author = make_user(email="author@example.com")
    session = make_session(created_by=author)
    comment = MatchComment.objects.create(
        session=session,
        author=author,
        body="Original",
        is_deleted=True,
    )

    with pytest.raises(ValidationError) as exc_info:
        edit_comment(comment=comment, body="Updated")

    assert exc_info.value.message_dict == {
        "comment": ["Удалённый комментарий нельзя редактировать."]
    }


@pytest.mark.django_db
def test_delete_comment_marks_comment_as_deleted(make_user, make_session) -> None:
    author = make_user(email="author@example.com")
    session = make_session(created_by=author)
    comment = MatchComment.objects.create(
        session=session,
        author=author,
        body="Delete me",
    )

    deleted_comment = delete_comment(comment=comment)
    deleted_comment.refresh_from_db()

    assert deleted_comment.is_deleted is True
    assert deleted_comment.body == "Delete me"
