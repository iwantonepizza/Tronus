from __future__ import annotations

import pytest

from apps.ratings.models import MatchVote


@pytest.mark.django_db
def test_match_vote_str_includes_direction_and_type(
    make_user,
    make_completed_session,
    add_participation,
) -> None:
    sender = make_user(email="sender@example.com")
    recipient = make_user(email="recipient@example.com")
    data = make_completed_session(created_by=sender)
    session = data["session"]
    add_participation(session=session, user=sender, faction=data["stark"])
    add_participation(session=session, user=recipient, faction=data["lannister"])

    vote = MatchVote.objects.create(
        session=session,
        from_user=sender,
        to_user=recipient,
        vote_type=MatchVote.VoteType.CROWN,
    )

    assert str(vote) == f"Vote #{vote.pk} CROWN sender@example.com->recipient@example.com"
