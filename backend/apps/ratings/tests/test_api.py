from __future__ import annotations

from datetime import timedelta

import pytest
from django.utils import timezone

from apps.ratings.models import MatchVote


@pytest.mark.django_db
def test_list_votes_is_public(
    api_client,
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

    response = api_client.get(f"/api/v1/sessions/{session.pk}/votes/")

    assert response.status_code == 200
    assert response.json()[0]["id"] == vote.pk
    assert response.json()[0]["vote_type"] == "positive"


@pytest.mark.django_db
def test_post_vote_requires_authentication(
    api_client,
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

    response = api_client.post(
        f"/api/v1/sessions/{session.pk}/votes/",
        {"to_user": recipient.pk, "vote_type": "positive"},
        format="json",
    )

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "unauthorized"


@pytest.mark.django_db
def test_post_vote_creates_vote_for_participant(
    api_client,
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
    assert api_client.login(username=sender.username, password="StrongPassword123!")

    response = api_client.post(
        f"/api/v1/sessions/{session.pk}/votes/",
        {"to_user": recipient.pk, "vote_type": "negative"},
        format="json",
    )

    vote = MatchVote.objects.get(session=session, from_user=sender, to_user=recipient)

    assert response.status_code == 201
    assert response.json()["id"] == vote.pk
    assert response.json()["vote_type"] == "negative"


@pytest.mark.django_db
def test_vote_detail_get_returns_method_not_allowed(
    api_client,
    make_user,
    make_completed_session,
    add_participation,
) -> None:
    sender = make_user(email="sender_method_not_allowed@example.com")
    recipient = make_user(email="recipient_method_not_allowed@example.com")
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
    assert api_client.login(username=sender.username, password="StrongPassword123!")

    response = api_client.get(f"/api/v1/sessions/{session.pk}/votes/{vote.pk}/")

    assert response.status_code == 405
    assert response.json()["error"]["code"] == "method_not_allowed"
    assert "server_error" not in response.json()["error"]["code"]


@pytest.mark.django_db
def test_post_vote_returns_validation_error_for_non_participant(
    api_client,
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
    assert api_client.login(username=sender.username, password="StrongPassword123!")

    response = api_client.post(
        f"/api/v1/sessions/{session.pk}/votes/",
        {"to_user": recipient.pk, "vote_type": "positive"},
        format="json",
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "validation_error"
    assert response.json()["error"]["details"]["from_user"] == [
        "Голосовать могут только участники партии."
    ]


@pytest.mark.django_db
def test_patch_vote_allows_author_within_window(
    api_client,
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
    assert api_client.login(username=sender.username, password="StrongPassword123!")

    response = api_client.patch(
        f"/api/v1/sessions/{session.pk}/votes/{vote.pk}/",
        {"vote_type": "negative"},
        format="json",
    )

    vote.refresh_from_db()

    assert response.status_code == 200
    assert response.json()["vote_type"] == "negative"
    assert vote.vote_type == MatchVote.VoteType.SHIT


@pytest.mark.django_db
def test_patch_vote_forbids_non_author_non_admin(
    api_client,
    make_user,
    make_completed_session,
    add_participation,
) -> None:
    sender = make_user(email="sender@example.com")
    stranger = make_user(email="stranger@example.com")
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
    assert api_client.login(username=stranger.username, password="StrongPassword123!")

    response = api_client.patch(
        f"/api/v1/sessions/{session.pk}/votes/{vote.pk}/",
        {"vote_type": "negative"},
        format="json",
    )

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "permission_denied"


@pytest.mark.django_db
def test_patch_vote_rejects_after_window_for_author(
    api_client,
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
    assert api_client.login(username=sender.username, password="StrongPassword123!")

    response = api_client.patch(
        f"/api/v1/sessions/{session.pk}/votes/{vote.pk}/",
        {"vote_type": "negative"},
        format="json",
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "validation_error"
    assert response.json()["error"]["details"]["vote"] == [
        "Окно для изменения голоса уже истекло."
    ]


@pytest.mark.django_db
def test_delete_vote_allows_admin_after_window(
    api_client,
    make_user,
    make_completed_session,
    add_participation,
) -> None:
    sender = make_user(email="sender@example.com")
    admin = make_user(email="admin@example.com", is_staff=True)
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
    assert api_client.login(username=admin.username, password="StrongPassword123!")

    response = api_client.delete(f"/api/v1/sessions/{session.pk}/votes/{vote.pk}/")

    assert response.status_code == 204
    assert MatchVote.objects.filter(pk=vote.pk).exists() is False
