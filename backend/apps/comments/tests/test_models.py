from __future__ import annotations

import pytest

from apps.comments.models import MatchComment


@pytest.mark.django_db
def test_match_comment_str_includes_author_and_session(make_user, make_session) -> None:
    author = make_user(email="author@example.com")
    session = make_session(created_by=author)
    comment = MatchComment.objects.create(
        session=session,
        author=author,
        body="For the Iron Throne.",
    )

    assert str(comment) == f"Comment #{comment.pk} by author@example.com in session #{session.pk}"
