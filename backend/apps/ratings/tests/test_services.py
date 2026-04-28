from __future__ import annotations

from datetime import timedelta

import pytest
from django.core.exceptions import ValidationError
from django.utils import timezone

from apps.games.models import GameSession
from apps.ratings.models import MatchVote
from apps.ratings.services import cast_vote, delete_vote, update_vote


@pytest.mark.django_db
def test_cast_vote_creates_vote_for_participants(
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

    vote = cast_vote(
        session=session,
        from_user=sender,
        to_user=recipient,
        vote_type=MatchVote.VoteType.CROWN,
    )

    assert vote.vote_type == MatchVote.VoteType.CROWN
    assert vote.session == session


@pytest.mark.django_db
def test_cast_vote_rejects_non_participant_sender(
    make_user,
    make_completed_session,
    add_participation,
) -> None:
    creator = make_user(email="creator@example.com")
    sender = make_user(email="sender@example.com")
    recipient = make_user(email="recipient@example.com")
    data = make_completed_session(created_by=creator)
    session = data["session"]
    add_participation(session=session, user=creator, faction=data["stark"])
    add_participation(session=session, user=recipient, faction=data["lannister"])

    with pytest.raises(ValidationError) as exc_info:
        cast_vote(
            session=session,
            from_user=sender,
            to_user=recipient,
            vote_type=MatchVote.VoteType.CROWN,
        )

    assert exc_info.value.message_dict == {"from_user": ["Only session participants can vote."]}


@pytest.mark.django_db
def test_cast_vote_rejects_self_vote(make_user, make_completed_session, add_participation) -> None:
    sender = make_user(email="sender@example.com")
    data = make_completed_session(created_by=sender)
    session = data["session"]
    add_participation(session=session, user=sender, faction=data["stark"])

    with pytest.raises(ValidationError) as exc_info:
        cast_vote(
            session=session,
            from_user=sender,
            to_user=sender,
            vote_type=MatchVote.VoteType.CROWN,
        )

    assert exc_info.value.message_dict == {"to_user": ["You cannot vote for yourself."]}


@pytest.mark.django_db
def test_cast_vote_rejects_duplicate_pair(
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
    MatchVote.objects.create(
        session=session,
        from_user=sender,
        to_user=recipient,
        vote_type=MatchVote.VoteType.CROWN,
    )

    with pytest.raises(ValidationError) as exc_info:
        cast_vote(
            session=session,
            from_user=sender,
            to_user=recipient,
            vote_type=MatchVote.VoteType.SHIT,
        )

    assert exc_info.value.message_dict == {
        "vote": ["You have already voted for this player in the session."]
    }


@pytest.mark.django_db
def test_cast_vote_rejects_non_completed_session(
    make_user,
    make_completed_session,
    add_participation,
) -> None:
    sender = make_user(email="sender@example.com")
    recipient = make_user(email="recipient@example.com")
    data = make_completed_session(created_by=sender)
    session = data["session"]
    session.status = GameSession.Status.PLANNED
    session.save(update_fields=["status", "updated_at"])
    add_participation(session=session, user=sender, faction=data["stark"])
    add_participation(session=session, user=recipient, faction=data["lannister"])

    with pytest.raises(ValidationError) as exc_info:
        cast_vote(
            session=session,
            from_user=sender,
            to_user=recipient,
            vote_type=MatchVote.VoteType.CROWN,
        )

    assert exc_info.value.message_dict == {
        "session": ["Votes are allowed only for completed sessions."]
    }


@pytest.mark.django_db
def test_update_vote_changes_type_within_window(
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

    updated_vote = update_vote(vote=vote, vote_type=MatchVote.VoteType.SHIT)

    assert updated_vote.vote_type == MatchVote.VoteType.SHIT


@pytest.mark.django_db
def test_update_vote_rejects_after_window_for_non_admin(
    make_user,
    make_completed_session,
    add_participation,
) -> None:
    sender = make_user(email="sender@example.com")
    recipient = make_user(email="recipient@example.com")
    data = make_completed_session(created_by=sender)
    session = data["session"]
    outcome = data["outcome"]
    add_participation(session=session, user=sender, faction=data["stark"])
    add_participation(session=session, user=recipient, faction=data["lannister"])
    vote = MatchVote.objects.create(
        session=session,
        from_user=sender,
        to_user=recipient,
        vote_type=MatchVote.VoteType.CROWN,
    )
    outcome.created_at = timezone.now() - timedelta(hours=25)
    outcome.save(update_fields=["created_at"])

    with pytest.raises(ValidationError) as exc_info:
        update_vote(vote=vote, vote_type=MatchVote.VoteType.SHIT)

    assert exc_info.value.message_dict == {"vote": ["Vote editing window has expired."]}


@pytest.mark.django_db
def test_delete_vote_allows_admin_after_window(
    make_user,
    make_completed_session,
    add_participation,
) -> None:
    sender = make_user(email="sender@example.com")
    recipient = make_user(email="recipient@example.com")
    data = make_completed_session(created_by=sender)
    session = data["session"]
    outcome = data["outcome"]
    add_participation(session=session, user=sender, faction=data["stark"])
    add_participation(session=session, user=recipient, faction=data["lannister"])
    vote = MatchVote.objects.create(
        session=session,
        from_user=sender,
        to_user=recipient,
        vote_type=MatchVote.VoteType.CROWN,
    )
    outcome.created_at = timezone.now() - timedelta(hours=25)
    outcome.save(update_fields=["created_at"])

    delete_vote(vote=vote, is_admin=True)

    assert MatchVote.objects.filter(pk=vote.pk).exists() is False
