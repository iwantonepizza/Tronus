from __future__ import annotations

import pytest

from apps.ratings.models import MatchVote
from apps.ratings.selectors import list_votes


@pytest.mark.django_db
def test_list_votes_returns_newest_first_for_session(
    make_user,
    make_completed_session,
    add_participation,
) -> None:
    sender = make_user(email="sender@example.com")
    recipient = make_user(email="recipient@example.com")
    other = make_user(email="other@example.com")
    data = make_completed_session(created_by=sender)
    session = data["session"]
    add_participation(session=session, user=sender, faction=data["stark"])
    add_participation(session=session, user=recipient, faction=data["lannister"])
    add_participation(session=session, user=other, faction=data["greyjoy"])
    older_vote = MatchVote.objects.create(
        session=session,
        from_user=sender,
        to_user=recipient,
        vote_type=MatchVote.VoteType.CROWN,
    )
    newer_vote = MatchVote.objects.create(
        session=session,
        from_user=recipient,
        to_user=other,
        vote_type=MatchVote.VoteType.SHIT,
    )

    votes = list(list_votes(session_id=session.pk))

    assert votes == [newer_vote, older_vote]
