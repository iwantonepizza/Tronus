from __future__ import annotations

from datetime import timedelta

import pytest
from django.utils import timezone

from apps.comments.models import MatchComment
from apps.comments.selectors import list_comments


@pytest.mark.django_db
def test_list_comments_returns_newest_first_and_hides_deleted(make_user, make_session) -> None:
    author = make_user(email="author@example.com")
    session = make_session(created_by=author)
    older_comment = MatchComment.objects.create(
        session=session,
        author=author,
        body="Older",
    )
    deleted_comment = MatchComment.objects.create(
        session=session,
        author=author,
        body="Deleted",
        is_deleted=True,
    )
    newer_comment = MatchComment.objects.create(
        session=session,
        author=author,
        body="Newer",
    )

    comments = list(list_comments(session_id=session.pk))

    assert comments == [newer_comment, older_comment]
    assert deleted_comment not in comments


@pytest.mark.django_db
def test_list_comments_applies_before_id_keyset(make_user, make_session) -> None:
    author = make_user(email="author@example.com")
    session = make_session(created_by=author)
    oldest_comment = MatchComment.objects.create(session=session, author=author, body="Oldest")
    middle_comment = MatchComment.objects.create(session=session, author=author, body="Middle")
    newest_comment = MatchComment.objects.create(session=session, author=author, body="Newest")

    comments = list(list_comments(session_id=session.pk, before_id=newest_comment.pk, limit=10))

    assert comments == [middle_comment, oldest_comment]


@pytest.mark.django_db
def test_list_comments_respects_limit_and_query_budget(
    make_user,
    make_session,
    django_assert_num_queries,
) -> None:
    author = make_user(email="author@example.com")
    session = make_session(
        created_by=author,
        scheduled_at=timezone.now() + timedelta(days=1),
    )
    for index in range(5):
        MatchComment.objects.create(
            session=session,
            author=author,
            body=f"Comment {index}",
        )

    with django_assert_num_queries(1):
        comments = list(list_comments(session_id=session.pk, limit=3))
        snapshot = [(comment.author.profile.nickname, comment.body) for comment in comments]

    assert len(comments) == 3
    assert snapshot[0][1] == "Comment 4"
