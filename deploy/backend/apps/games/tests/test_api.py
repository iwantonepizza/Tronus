from __future__ import annotations

from datetime import timedelta

import pytest
from django.contrib.auth.models import Group
from django.utils import timezone

from apps.accounts.models import User
from apps.games.models import GameSession, Outcome, Participation
from apps.reference.models import Faction, GameMode, HouseDeck


def _ensure_reference_data() -> dict[str, object]:
    classic, _ = GameMode.objects.get_or_create(
        slug="classic",
        defaults={
            "name": "Classic",
            "min_players": 3,
            "max_players": 8,
        },
    )
    original, _ = HouseDeck.objects.get_or_create(
        slug="original",
        defaults={"name": "Original"},
    )
    factions: dict[str, Faction] = {}
    for slug, name, color, on_primary in (
        ("stark", "Stark", "#6B7B8C", "#F0F0F0"),
        ("lannister", "Lannister", "#9B2226", "#F5E6C8"),
        ("greyjoy", "Greyjoy", "#1C3B47", "#E0E6E8"),
        ("baratheon", "Baratheon", "#F0B323", "#1A1A22"),
        ("martell", "Martell", "#C94E2A", "#F5E6C8"),
        ("tyrell", "Tyrell", "#4B6B3A", "#F0E6D2"),
        ("arryn", "Arryn", "#8AAFC8", "#1A2A3A"),
        ("targaryen", "Targaryen", "#5B2D8A", "#E0D0F0"),
    ):
        faction, _ = Faction.objects.get_or_create(
            slug=slug,
            defaults={
                "name": name,
                "color": color,
                "on_primary": on_primary,
                "is_active": True,
            },
        )
        factions[slug] = faction

    return {
        "classic": classic,
        "original": original,
        **factions,
    }


def _create_user(*, email: str, is_staff: bool = False) -> User:
    return User.objects.create_user(
        username=email,
        email=email,
        password="StrongPassword123!",
        is_active=True,
        is_staff=is_staff,
    )


def _grant_player_role(*, user: User) -> None:
    player_group, _ = Group.objects.get_or_create(name="player")
    user.groups.add(player_group)


def _create_session(
    *,
    created_by: User,
    scheduled_at=None,
    status: str = GameSession.Status.PLANNED,
) -> GameSession:
    reference = _ensure_reference_data()
    return GameSession.objects.create(
        scheduled_at=scheduled_at or (timezone.now() + timedelta(days=1)),
        mode=reference["classic"],
        house_deck=reference["original"],
        created_by=created_by,
        status=status,
    )


def _create_participation(
    *,
    session: GameSession,
    user: User,
    faction: Faction,
    place: int | None = None,
    castles: int | None = None,
    is_winner: bool = False,
    notes: str = "",
) -> Participation:
    return Participation.objects.create(
        session=session,
        user=user,
        faction=faction,
        place=place,
        castles=castles,
        is_winner=is_winner,
        notes=notes,
    )


@pytest.mark.django_db
def test_sessions_list_is_public_and_supports_filters(api_client) -> None:
    reference = _ensure_reference_data()
    creator = _create_user(email="creator@example.com")
    player = _create_user(email="player@example.com")
    outsider = _create_user(email="outsider@example.com")
    now = timezone.now()

    matching_session = _create_session(
        created_by=creator,
        scheduled_at=now + timedelta(days=2),
        status=GameSession.Status.PLANNED,
    )
    filtered_out_by_player = _create_session(
        created_by=creator,
        scheduled_at=now + timedelta(days=3),
        status=GameSession.Status.PLANNED,
    )
    filtered_out_by_status = _create_session(
        created_by=creator,
        scheduled_at=now + timedelta(days=4),
        status=GameSession.Status.COMPLETED,
    )

    _create_participation(session=matching_session, user=player, faction=reference["stark"])
    _create_participation(
        session=filtered_out_by_player,
        user=outsider,
        faction=reference["lannister"],
    )
    _create_participation(
        session=filtered_out_by_status,
        user=player,
        faction=reference["greyjoy"],
    )

    response = api_client.get(
        "/api/v1/sessions/",
        {
            "status": GameSession.Status.PLANNED,
            "player": player.pk,
            "from": (now + timedelta(days=1)).isoformat(),
            "to": (now + timedelta(days=2, hours=12)).isoformat(),
            "limit": 5,
        },
    )

    assert response.status_code == 200
    assert response.json()["next"] is None
    assert response.json()["previous"] is None
    assert [item["id"] for item in response.json()["results"]] == [matching_session.pk]


@pytest.mark.django_db
def test_sessions_list_returns_validation_error_for_invalid_status(api_client) -> None:
    response = api_client.get(
        "/api/v1/sessions/",
        {
            "status": "unknown",
        },
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "validation_error"
    assert "status" in response.json()["error"]["details"]


@pytest.mark.django_db
def test_create_session_requires_player_role(api_client) -> None:
    _ensure_reference_data()
    user = _create_user(email="user@example.com")
    assert api_client.login(username=user.username, password="StrongPassword123!")

    response = api_client.post(
        "/api/v1/sessions/",
        {
            "scheduled_at": (timezone.now() + timedelta(days=2)).isoformat(),
            "mode": "classic",
            "deck": "original",
            "planning_note": "Test",
        },
        format="json",
    )

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "permission_denied"


@pytest.mark.django_db
def test_create_session_creates_planned_session_for_player(api_client) -> None:
    _ensure_reference_data()
    creator = _create_user(email="creator@example.com")
    _grant_player_role(user=creator)
    assert api_client.login(username=creator.username, password="StrongPassword123!")

    response = api_client.post(
        "/api/v1/sessions/",
        {
            "scheduled_at": (timezone.now() + timedelta(days=2)).isoformat(),
            "mode": "classic",
            "deck": "original",
            "planning_note": "  Plan the map.  ",
        },
        format="json",
    )

    session = GameSession.objects.get(created_by=creator)

    assert response.status_code == 201
    assert response.json()["id"] == session.pk
    assert response.json()["status"] == GameSession.Status.PLANNED
    assert session.planning_note == "Plan the map."


@pytest.mark.django_db
def test_create_session_rejects_unknown_house_deck_slug(api_client) -> None:
    _ensure_reference_data()
    creator = _create_user(email="creator@example.com")
    _grant_player_role(user=creator)
    assert api_client.login(username=creator.username, password="StrongPassword123!")

    response = api_client.post(
        "/api/v1/sessions/",
        {
            "scheduled_at": (timezone.now() + timedelta(days=2)).isoformat(),
            "mode": "classic",
            "deck": "legacy_removed_deck",
            "planning_note": "Test",
        },
        format="json",
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "validation_error"
    assert "deck" in response.json()["error"]["details"]


@pytest.mark.django_db
def test_session_detail_is_public_and_returns_participations_and_outcome(api_client) -> None:
    reference = _ensure_reference_data()
    creator = _create_user(email="creator@example.com")
    player = _create_user(email="player@example.com")
    session = _create_session(
        created_by=creator,
        status=GameSession.Status.COMPLETED,
    )
    _create_participation(
        session=session,
        user=creator,
        faction=reference["stark"],
        place=1,
        castles=7,
        is_winner=True,
    )
    _create_participation(
        session=session,
        user=player,
        faction=reference["lannister"],
        place=2,
        castles=5,
    )
    Outcome.objects.create(
        session=session,
        rounds_played=10,
        end_reason=Outcome.EndReason.CASTLES_7,
        mvp=creator,
        final_note="Great match.",
    )

    response = api_client.get(f"/api/v1/sessions/{session.pk}/")

    assert response.status_code == 200
    assert response.json()["id"] == session.pk
    assert len(response.json()["participations"]) == 2
    assert response.json()["outcome"]["final_note"] == "Great match."


@pytest.mark.django_db
def test_session_detail_returns_not_found_for_missing_session(api_client) -> None:
    response = api_client.get("/api/v1/sessions/999999/")

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_found"


@pytest.mark.django_db
def test_update_session_allows_creator_to_patch_planning(api_client) -> None:
    _ensure_reference_data()
    creator = _create_user(email="creator@example.com")
    _grant_player_role(user=creator)
    session = _create_session(created_by=creator)
    assert api_client.login(username=creator.username, password="StrongPassword123!")

    response = api_client.patch(
        f"/api/v1/sessions/{session.pk}/",
        {"planning_note": "  Updated note.  "},
        format="json",
    )

    session.refresh_from_db()

    assert response.status_code == 200
    assert response.json()["planning_note"] == "Updated note."
    assert session.planning_note == "Updated note."


@pytest.mark.django_db
def test_update_session_forbids_non_creator(api_client) -> None:
    _ensure_reference_data()
    creator = _create_user(email="creator@example.com")
    stranger = _create_user(email="stranger@example.com")
    _grant_player_role(user=creator)
    _grant_player_role(user=stranger)
    session = _create_session(created_by=creator)
    assert api_client.login(username=stranger.username, password="StrongPassword123!")

    response = api_client.patch(
        f"/api/v1/sessions/{session.pk}/",
        {"planning_note": "Hack"},
        format="json",
    )

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "permission_denied"


@pytest.mark.django_db
def test_cancel_session_action_marks_session_cancelled(api_client) -> None:
    _ensure_reference_data()
    creator = _create_user(email="creator@example.com")
    _grant_player_role(user=creator)
    session = _create_session(created_by=creator)
    assert api_client.login(username=creator.username, password="StrongPassword123!")

    response = api_client.post(f"/api/v1/sessions/{session.pk}/cancel/")
    session.refresh_from_db()

    assert response.status_code == 204
    assert session.status == GameSession.Status.CANCELLED


@pytest.mark.django_db
def test_delete_session_endpoint_also_cancels_session(api_client) -> None:
    _ensure_reference_data()
    creator = _create_user(email="creator@example.com")
    _grant_player_role(user=creator)
    session = _create_session(created_by=creator)
    assert api_client.login(username=creator.username, password="StrongPassword123!")

    response = api_client.delete(f"/api/v1/sessions/{session.pk}/")
    session.refresh_from_db()

    assert response.status_code == 204
    assert session.status == GameSession.Status.CANCELLED


@pytest.mark.django_db
def test_add_participant_creates_participation(api_client) -> None:
    _ensure_reference_data()
    creator = _create_user(email="creator@example.com")
    player = _create_user(email="player@example.com")
    _grant_player_role(user=creator)
    session = _create_session(created_by=creator)
    assert api_client.login(username=creator.username, password="StrongPassword123!")

    response = api_client.post(
        f"/api/v1/sessions/{session.pk}/participants/",
        {"user": player.pk, "faction": "stark"},
        format="json",
    )

    participation = Participation.objects.get(session=session, user=player)

    assert response.status_code == 201
    assert response.json()["id"] == participation.pk
    assert response.json()["faction"] == "stark"


@pytest.mark.django_db
def test_add_participant_forbids_non_creator(api_client) -> None:
    _ensure_reference_data()
    creator = _create_user(email="creator@example.com")
    stranger = _create_user(email="stranger@example.com")
    player = _create_user(email="player@example.com")
    _grant_player_role(user=creator)
    _grant_player_role(user=stranger)
    session = _create_session(created_by=creator)
    assert api_client.login(username=stranger.username, password="StrongPassword123!")

    response = api_client.post(
        f"/api/v1/sessions/{session.pk}/participants/",
        {"user": player.pk, "faction": "stark"},
        format="json",
    )

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "permission_denied"


@pytest.mark.django_db
def test_update_participant_updates_faction_and_notes(api_client) -> None:
    reference = _ensure_reference_data()
    creator = _create_user(email="creator@example.com")
    player = _create_user(email="player@example.com")
    _grant_player_role(user=creator)
    session = _create_session(created_by=creator)
    participation = _create_participation(
        session=session,
        user=player,
        faction=reference["stark"],
    )
    assert api_client.login(username=creator.username, password="StrongPassword123!")

    response = api_client.patch(
        f"/api/v1/sessions/{session.pk}/participants/{participation.pk}/",
        {"faction": "lannister", "notes": "  New notes.  "},
        format="json",
    )

    participation.refresh_from_db()

    assert response.status_code == 200
    assert response.json()["faction"] == "lannister"
    assert response.json()["notes"] == "New notes."
    assert participation.faction == reference["lannister"]
    assert participation.notes == "New notes."


@pytest.mark.django_db
def test_update_participant_returns_validation_error_shape(api_client) -> None:
    reference = _ensure_reference_data()
    creator = _create_user(email="creator@example.com")
    player_one = _create_user(email="player1@example.com")
    player_two = _create_user(email="player2@example.com")
    _grant_player_role(user=creator)
    session = _create_session(created_by=creator)
    locked_participation = _create_participation(
        session=session,
        user=player_one,
        faction=reference["stark"],
    )
    target_participation = _create_participation(
        session=session,
        user=player_two,
        faction=reference["lannister"],
    )
    assert api_client.login(username=creator.username, password="StrongPassword123!")

    response = api_client.patch(
        f"/api/v1/sessions/{session.pk}/participants/{target_participation.pk}/",
        {"faction": "stark"},
        format="json",
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "validation_error"
    assert response.json()["error"]["details"]["faction"] == [
        "Эта фракция уже занята в партии."
    ]
    assert locked_participation.pk != target_participation.pk


@pytest.mark.django_db
def test_delete_participant_removes_participation(api_client) -> None:
    reference = _ensure_reference_data()
    creator = _create_user(email="creator@example.com")
    player = _create_user(email="player@example.com")
    _grant_player_role(user=creator)
    session = _create_session(created_by=creator)
    participation = _create_participation(
        session=session,
        user=player,
        faction=reference["stark"],
    )
    assert api_client.login(username=creator.username, password="StrongPassword123!")

    response = api_client.delete(
        f"/api/v1/sessions/{session.pk}/participants/{participation.pk}/"
    )

    assert response.status_code == 204
    assert Participation.objects.filter(pk=participation.pk).exists() is False


@pytest.mark.django_db
def test_finalize_session_creates_outcome(api_client) -> None:
    reference = _ensure_reference_data()
    creator = _create_user(email="creator@example.com")
    player_one = _create_user(email="player1@example.com")
    player_two = _create_user(email="player2@example.com")
    _grant_player_role(user=creator)
    session = _create_session(created_by=creator)
    p1 = _create_participation(session=session, user=creator, faction=reference["stark"])
    p2 = _create_participation(session=session, user=player_one, faction=reference["lannister"])
    p3 = _create_participation(session=session, user=player_two, faction=reference["greyjoy"])
    assert api_client.login(username=creator.username, password="StrongPassword123!")

    response = api_client.post(
        f"/api/v1/sessions/{session.pk}/finalize/",
        {
            "rounds_played": 10,
            "end_reason": Outcome.EndReason.CASTLES_7,
            "mvp": creator.pk,
            "final_note": "  Great match.  ",
            "participations": [
                {"id": p1.pk, "place": 1, "castles": 7},
                {"id": p2.pk, "place": 2, "castles": 5},
                {"id": p3.pk, "place": 3, "castles": 3},
            ],
        },
        format="json",
    )

    session.refresh_from_db()

    assert response.status_code == 201
    assert session.status == GameSession.Status.COMPLETED
    assert response.json()["outcome"]["final_note"] == "Great match."
    assert response.json()["participations"][0]["place"] == 1


@pytest.mark.django_db
def test_finalize_session_forbids_non_creator(api_client) -> None:
    reference = _ensure_reference_data()
    creator = _create_user(email="creator@example.com")
    stranger = _create_user(email="stranger@example.com")
    player_one = _create_user(email="player1@example.com")
    player_two = _create_user(email="player2@example.com")
    _grant_player_role(user=creator)
    _grant_player_role(user=stranger)
    session = _create_session(created_by=creator)
    p1 = _create_participation(session=session, user=creator, faction=reference["stark"])
    p2 = _create_participation(session=session, user=player_one, faction=reference["lannister"])
    p3 = _create_participation(session=session, user=player_two, faction=reference["greyjoy"])
    assert api_client.login(username=stranger.username, password="StrongPassword123!")

    response = api_client.post(
        f"/api/v1/sessions/{session.pk}/finalize/",
        {
            "rounds_played": 10,
            "end_reason": Outcome.EndReason.CASTLES_7,
            "participations": [
                {"id": p1.pk, "place": 1, "castles": 7},
                {"id": p2.pk, "place": 2, "castles": 5},
                {"id": p3.pk, "place": 3, "castles": 3},
            ],
        },
        format="json",
    )

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "permission_denied"


@pytest.mark.django_db
def test_finalize_session_returns_validation_error_shape(api_client) -> None:
    reference = _ensure_reference_data()
    creator = _create_user(email="creator@example.com")
    player_one = _create_user(email="player1@example.com")
    player_two = _create_user(email="player2@example.com")
    _grant_player_role(user=creator)
    session = _create_session(created_by=creator)
    p1 = _create_participation(session=session, user=creator, faction=reference["stark"])
    p2 = _create_participation(session=session, user=player_one, faction=reference["lannister"])
    _create_participation(session=session, user=player_two, faction=reference["greyjoy"])
    assert api_client.login(username=creator.username, password="StrongPassword123!")

    response = api_client.post(
        f"/api/v1/sessions/{session.pk}/finalize/",
        {
            "rounds_played": 10,
            "end_reason": Outcome.EndReason.CASTLES_7,
            "participations": [
                {"id": p1.pk, "place": 1, "castles": 7},
                {"id": p2.pk, "place": 2, "castles": 5},
            ],
        },
        format="json",
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "validation_error"
    assert "participations" in response.json()["error"]["details"]
