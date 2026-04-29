from __future__ import annotations

from collections import defaultdict
from typing import Any

from django.db.models import Count, Prefetch, Q, QuerySet
from django.utils import timezone

from apps.accounts.selectors import get_public_user_queryset
from apps.games.models import GameSession, Participation
from apps.ratings.models import MatchVote
from apps.reference.models import Faction

LEADERBOARD_LABELS = {
    "wins": "Wins",
    "winrate": "Winrate",
    "games": "Games",
    "crowns": "Crowns",
    "shits": "Shits",
    "avg_place": "Avg Place",
}


def get_active_faction_queryset() -> QuerySet[Faction]:
    return Faction.objects.filter(is_active=True).order_by("name", "pk")


def get_completed_participation_queryset() -> QuerySet[Participation]:
    return (
        Participation.objects.filter(session__status=GameSession.Status.COMPLETED)
        .select_related(
            "user__profile",
            "user__profile__favorite_faction",
            "faction",
            "session",
        )
        .order_by("-session__scheduled_at", "-session_id", "-pk")
    )


def get_overview_session_queryset() -> QuerySet[GameSession]:
    participation_queryset = (
        Participation.objects.select_related(
            "user__profile",
            "user__profile__favorite_faction",
            "faction",
        )
        .order_by("place", "pk")
    )
    return (
        GameSession.objects.select_related(
            "mode",
            "house_deck",
            "created_by__profile",
            "created_by__profile__favorite_faction",
            "outcome__mvp__profile",
            "outcome__mvp__profile__favorite_faction",
        )
        .prefetch_related(
            Prefetch("participations", queryset=participation_queryset),
        )
        .annotate(
            comments_count=Count(
                "comments",
                filter=Q(comments__is_deleted=False),
                distinct=True,
            )
        )
        .order_by("-scheduled_at", "-pk")
    )


def _round_or_none(value: float | None, digits: int = 3) -> float | None:
    if value is None:
        return None
    return round(value, digits)


def _build_faction_stats(*, faction: Faction) -> dict[str, Any]:
    participations = list(
        get_completed_participation_queryset()
        .filter(faction_id=faction.pk, user__is_active=True)
        .select_related("session__mode")
    )

    total_games = len(participations)
    wins = sum(1 for participation in participations if participation.is_winner)

    place_values = [
        participation.place
        for participation in participations
        if participation.place is not None
    ]
    castle_values = [
        participation.castles
        for participation in participations
        if participation.castles is not None
    ]

    mode_games: dict[str, int] = defaultdict(int)
    mode_wins: dict[str, int] = defaultdict(int)
    player_games: dict[int, int] = defaultdict(int)
    player_wins: dict[int, int] = defaultdict(int)
    player_refs: dict[int, Any] = {}

    for participation in participations:
        mode_slug = participation.session.mode.slug
        mode_games[mode_slug] += 1
        player_games[participation.user_id] += 1
        player_refs[participation.user_id] = participation.user

        if participation.is_winner:
            mode_wins[mode_slug] += 1
            player_wins[participation.user_id] += 1

    by_mode = [
        {
            "mode": mode_slug,
            "games": games_count,
            "winrate": _round_or_none(mode_wins[mode_slug] / games_count),
        }
        for mode_slug, games_count in sorted(mode_games.items())
    ]

    top_players = sorted(
        (
            {
                "user": player_refs[user_id],
                "games": games_count,
                "winrate": _round_or_none(player_wins[user_id] / games_count),
            }
            for user_id, games_count in player_games.items()
        ),
        key=lambda item: (
            -(item["winrate"] or 0),
            -item["games"],
            item["user"].profile.nickname,
        ),
    )[:5]

    return {
        "faction": faction,
        "total_games": total_games,
        "wins": wins,
        "winrate": _round_or_none(wins / total_games if total_games else None),
        "avg_place": _round_or_none(
            sum(place_values) / len(place_values) if place_values else None
        ),
        "avg_castles": _round_or_none(
            sum(castle_values) / len(castle_values) if castle_values else None
        ),
        "by_mode": by_mode,
        "top_players": top_players,
    }


def player_profile_stats(*, user_id: int) -> dict[str, Any]:
    user = get_public_user_queryset().get(pk=user_id)
    participations = list(get_completed_participation_queryset().filter(user_id=user_id))

    total_games = len(participations)
    wins = sum(1 for participation in participations if participation.is_winner)

    place_values = [
        participation.place
        for participation in participations
        if participation.place is not None
    ]
    castle_values = [
        participation.castles
        for participation in participations
        if participation.castles is not None
    ]

    faction_games: dict[str, int] = defaultdict(int)
    faction_wins: dict[str, int] = defaultdict(int)

    for participation in participations:
        faction_games[participation.faction.slug] += 1
        if participation.is_winner:
            faction_wins[participation.faction.slug] += 1

    favorite_faction = None
    if faction_games:
        favorite_faction = min(
            faction_games.items(),
            key=lambda item: (-item[1], -faction_wins[item[0]], item[0]),
        )[0]

    faction_winrates = [
        {
            "faction": faction_slug,
            "games": games_count,
            "wins": faction_wins[faction_slug],
            "winrate": faction_wins[faction_slug] / games_count,
        }
        for faction_slug, games_count in faction_games.items()
    ]

    best_faction = None
    worst_faction = None
    if faction_winrates:
        best_entry = min(
            faction_winrates,
            key=lambda item: (-item["winrate"], -item["games"], item["faction"]),
        )
        worst_entry = min(
            faction_winrates,
            key=lambda item: (item["winrate"], -item["games"], item["faction"]),
        )
        best_faction = {
            "faction": best_entry["faction"],
            "winrate": _round_or_none(best_entry["winrate"]),
        }
        worst_faction = {
            "faction": worst_entry["faction"],
            "winrate": _round_or_none(worst_entry["winrate"]),
        }

    streak_type = None
    streak_count = 0
    for participation in participations:
        result_type = "win" if participation.is_winner else "loss"
        if streak_type is None:
            streak_type = result_type
            streak_count = 1
            continue

        if result_type != streak_type:
            break

        streak_count += 1

    vote_counts = {
        row["vote_type"]: row["total"]
        for row in (
            MatchVote.objects.filter(
                session__status=GameSession.Status.COMPLETED,
                to_user_id=user_id,
            )
            .values("vote_type")
            .annotate(total=Count("id"))
        )
    }

    return {
        "user": user,
        "total_games": total_games,
        "wins": wins,
        "winrate": _round_or_none(wins / total_games if total_games else None),
        "avg_place": _round_or_none(
            sum(place_values) / len(place_values) if place_values else None
        ),
        "avg_castles": _round_or_none(
            sum(castle_values) / len(castle_values) if castle_values else None
        ),
        "favorite_faction": favorite_faction,
        "best_faction": best_faction,
        "worst_faction": worst_faction,
        "current_streak": {
            "type": streak_type,
            "count": streak_count,
        },
        "last10": [
            {
                "match_id": participation.session_id,
                "place": participation.place,
                "faction": participation.faction.slug,
            }
            for participation in participations[:10]
        ],
        "crowns_received": vote_counts.get(MatchVote.VoteType.CROWN, 0),
        "shits_received": vote_counts.get(MatchVote.VoteType.SHIT, 0),
    }


def list_faction_stats() -> list[dict[str, Any]]:
    return [_build_faction_stats(faction=faction) for faction in get_active_faction_queryset()]


def faction_stats(*, faction_slug: str) -> dict[str, Any]:
    faction = get_active_faction_queryset().get(slug=faction_slug)
    return _build_faction_stats(faction=faction)


def overview_stats() -> dict[str, Any]:
    public_users = list(get_public_user_queryset())
    public_users_by_id = {user.pk: user for user in public_users}
    completed_participations = list(
        get_completed_participation_queryset().filter(user__is_active=True)
    )
    session_queryset = get_overview_session_queryset()
    next_match = (
        session_queryset.filter(
            status=GameSession.Status.PLANNED,
            scheduled_at__gte=timezone.now(),
        )
        .order_by("scheduled_at", "pk")
        .first()
    )
    recent_matches = list(
        session_queryset.filter(status=GameSession.Status.COMPLETED)[:4]
    )
    total_matches = GameSession.objects.count()
    active_players = len(public_users)

    faction_stats_rows = [
        row for row in list_faction_stats() if row["total_games"] > 0
    ]
    most_popular_faction = None
    if faction_stats_rows:
        most_popular_entry = min(
            faction_stats_rows,
            key=lambda item: (
                -item["total_games"],
                -(item["wins"]),
                item["faction"].slug,
            ),
        )
        most_popular_faction = {
            "faction": most_popular_entry["faction"],
            "games": most_popular_entry["total_games"],
        }

    player_games: dict[int, int] = defaultdict(int)
    player_wins: dict[int, int] = defaultdict(int)
    for participation in completed_participations:
        player_games[participation.user_id] += 1
        if participation.is_winner:
            player_wins[participation.user_id] += 1

    player_rows = [
        {
            "user": public_users_by_id[user_id],
            "games": games_count,
            "wins": player_wins[user_id],
            "winrate": _round_or_none(player_wins[user_id] / games_count),
        }
        for user_id, games_count in player_games.items()
        if user_id in public_users_by_id and games_count > 0
    ]

    current_leader = None
    if player_rows:
        leader_entry = min(
            player_rows,
            key=lambda item: (
                -item["wins"],
                -(item["winrate"] or 0),
                item["user"].profile.nickname,
            ),
        )
        current_leader = {
            "user": leader_entry["user"],
            "wins": leader_entry["wins"],
        }

    faction_winrates = sorted(
        (
            {
                "faction": row["faction"],
                "winrate": row["winrate"],
            }
            for row in faction_stats_rows
        ),
        key=lambda item: (
            -(item["winrate"] or 0),
            item["faction"].name,
        ),
    )[:5]

    top_winrate = sorted(
        (
            {
                "user": row["user"],
                "winrate": row["winrate"],
            }
            for row in player_rows
        ),
        key=lambda item: (
            -(item["winrate"] or 0),
            item["user"].profile.nickname,
        ),
    )[:5]

    fun_facts: list[dict[str, str]] = []
    longest_match = (
        session_queryset.filter(status=GameSession.Status.COMPLETED, outcome__isnull=False)
        .order_by("-outcome__rounds_played", "-scheduled_at", "-pk")
        .first()
    )
    if longest_match and longest_match.outcome is not None:
        fun_facts.append(
            {
                "icon": "Crown",
                "title": "Самая длинная партия",
                "description": (
                    f"Матч #{longest_match.pk} шёл {longest_match.outcome.rounds_played} "
                    "раундов и завершился по "
                    f"{longest_match.outcome.get_end_reason_display().lower()}."
                ),
            }
        )

    if current_leader is not None:
        leader_streak = player_profile_stats(user_id=current_leader["user"].pk)["current_streak"]
        if leader_streak["type"] is not None and leader_streak["count"] > 0:
            streak_label = "побед" if leader_streak["type"] == "win" else "поражений"
            fun_facts.append(
                {
                    "icon": "Zap",
                    "title": "Текущая серия",
                    "description": (
                        f"{current_leader['user'].profile.nickname} идёт на серии "
                        f"из {leader_streak['count']} {streak_label}."
                    ),
                }
            )

    if faction_winrates:
        top_factions = ", ".join(item["faction"].name for item in faction_winrates[:2])
        fun_facts.append(
            {
                "icon": "Flame",
                "title": "Метагейм сезона",
                "description": f"Сейчас впереди {top_factions}.",
            }
        )

    return {
        "next_match": next_match,
        "recent_matches": recent_matches,
        "total_matches": total_matches,
        "active_players": active_players,
        "most_popular_faction": most_popular_faction,
        "current_leader": current_leader,
        "faction_winrates": faction_winrates,
        "top_winrate": top_winrate,
        "fun_facts": fun_facts,
    }


def leaderboard_stats(*, metric: str, limit: int) -> dict[str, Any]:
    public_users = list(get_public_user_queryset())
    public_users_by_id = {user.pk: user for user in public_users}
    completed_participations = list(
        get_completed_participation_queryset().filter(user__is_active=True)
    )

    games_by_user: dict[int, int] = defaultdict(int)
    wins_by_user: dict[int, int] = defaultdict(int)
    place_total_by_user: dict[int, int] = defaultdict(int)
    place_count_by_user: dict[int, int] = defaultdict(int)

    for participation in completed_participations:
        games_by_user[participation.user_id] += 1
        if participation.is_winner:
            wins_by_user[participation.user_id] += 1
        if participation.place is not None:
            place_total_by_user[participation.user_id] += participation.place
            place_count_by_user[participation.user_id] += 1

    vote_rows = (
        MatchVote.objects.filter(
            session__status=GameSession.Status.COMPLETED,
            to_user__is_active=True,
        )
        .values("to_user_id", "vote_type")
        .annotate(total=Count("id"))
    )
    crowns_by_user: dict[int, int] = defaultdict(int)
    shits_by_user: dict[int, int] = defaultdict(int)
    for row in vote_rows:
        if row["vote_type"] == MatchVote.VoteType.CROWN:
            crowns_by_user[row["to_user_id"]] = row["total"]
        elif row["vote_type"] == MatchVote.VoteType.SHIT:
            shits_by_user[row["to_user_id"]] = row["total"]

    rows: list[dict[str, Any]] = []
    for user_id, games_count in games_by_user.items():
        user = public_users_by_id.get(user_id)
        if user is None or games_count <= 0:
            continue

        wins_count = wins_by_user[user_id]
        avg_place = None
        if place_count_by_user[user_id] > 0:
            avg_place = _round_or_none(
                place_total_by_user[user_id] / place_count_by_user[user_id]
            )

        rows.append(
            {
                "user": user,
                "games": games_count,
                "wins": wins_count,
                "winrate": _round_or_none(wins_count / games_count),
                "crowns": crowns_by_user[user_id],
                "shits": shits_by_user[user_id],
                "avg_place": avg_place,
            }
        )

    sorters: dict[str, Any] = {
        "wins": lambda item: (
            -item["wins"],
            -item["games"],
            item["user"].profile.nickname,
        ),
        "winrate": lambda item: (
            -(item["winrate"] or 0),
            -item["games"],
            -item["wins"],
            item["user"].profile.nickname,
        ),
        "games": lambda item: (
            -item["games"],
            -item["wins"],
            item["user"].profile.nickname,
        ),
        "crowns": lambda item: (
            -item["crowns"],
            -item["games"],
            item["user"].profile.nickname,
        ),
        "shits": lambda item: (
            -item["shits"],
            -item["games"],
            item["user"].profile.nickname,
        ),
        "avg_place": lambda item: (
            item["avg_place"] if item["avg_place"] is not None else 999,
            -item["wins"],
            -item["games"],
            item["user"].profile.nickname,
        ),
    }
    sorted_rows = sorted(rows, key=sorters[metric])[:limit]

    results = [
        {
            "rank": index,
            "user": row["user"],
            "games": row["games"],
            "metric_value": row[metric],
        }
        for index, row in enumerate(sorted_rows, start=1)
    ]

    return {
        "metric": metric,
        "label": LEADERBOARD_LABELS[metric],
        "results": results,
    }


def head_to_head_stats(*, user_a_id: int, user_b_id: int) -> dict[str, Any]:
    user_a = get_public_user_queryset().get(pk=user_a_id)
    user_b = get_public_user_queryset().get(pk=user_b_id)

    participations = list(
        get_completed_participation_queryset()
        .filter(user_id__in=[user_a_id, user_b_id])
        .select_related("session__mode", "session__house_deck")
    )

    grouped_by_session: dict[int, dict[str, Any]] = {}
    for participation in participations:
        session_bucket = grouped_by_session.setdefault(
            participation.session_id,
            {
                "session": participation.session,
                "by_user": {},
            },
        )
        session_bucket["by_user"][participation.user_id] = participation

    common_rows: list[dict[str, Any]] = []
    for bucket in grouped_by_session.values():
        if user_a_id not in bucket["by_user"] or user_b_id not in bucket["by_user"]:
            continue
        participation_a = bucket["by_user"][user_a_id]
        participation_b = bucket["by_user"][user_b_id]
        common_rows.append(
            {
                "session": bucket["session"],
                "user_a": participation_a,
                "user_b": participation_b,
            }
        )

    common_rows.sort(
        key=lambda item: (
            -item["session"].scheduled_at.timestamp(),
            -item["session"].pk,
        )
    )

    wins_user_a = sum(1 for row in common_rows if row["user_a"].is_winner)
    wins_user_b = sum(1 for row in common_rows if row["user_b"].is_winner)

    higher_place_user_a = 0
    higher_place_user_b = 0
    faction_games_user_a: dict[str, int] = defaultdict(int)
    faction_games_user_b: dict[str, int] = defaultdict(int)
    faction_wins_user_a: dict[str, int] = defaultdict(int)
    faction_wins_user_b: dict[str, int] = defaultdict(int)

    for row in common_rows:
        participation_a = row["user_a"]
        participation_b = row["user_b"]
        faction_games_user_a[participation_a.faction.slug] += 1
        faction_games_user_b[participation_b.faction.slug] += 1

        if participation_a.is_winner:
            faction_wins_user_a[participation_a.faction.slug] += 1
        if participation_b.is_winner:
            faction_wins_user_b[participation_b.faction.slug] += 1

        if participation_a.place is None or participation_b.place is None:
            continue
        if participation_a.place < participation_b.place:
            higher_place_user_a += 1
        elif participation_b.place < participation_a.place:
            higher_place_user_b += 1

    def resolve_favorite_faction(
        faction_games: dict[str, int],
        faction_wins: dict[str, int],
    ) -> str | None:
        if not faction_games:
            return None
        return min(
            faction_games.items(),
            key=lambda item: (-item[1], -faction_wins[item[0]], item[0]),
        )[0]

    matches = [
        {
            "id": row["session"].pk,
            "scheduled_at": row["session"].scheduled_at,
            "mode": row["session"].mode,
            "deck": row["session"].house_deck,
            "user_a": {
                "faction": row["user_a"].faction.slug,
                "place": row["user_a"].place,
                "castles": row["user_a"].castles,
                "is_winner": row["user_a"].is_winner,
            },
            "user_b": {
                "faction": row["user_b"].faction.slug,
                "place": row["user_b"].place,
                "castles": row["user_b"].castles,
                "is_winner": row["user_b"].is_winner,
            },
        }
        for row in common_rows
    ]

    return {
        "user_a": user_a,
        "user_b": user_b,
        "games_together": len(common_rows),
        "wins": {
            "user_a": wins_user_a,
            "user_b": wins_user_b,
        },
        "higher_place": {
            "user_a": higher_place_user_a,
            "user_b": higher_place_user_b,
        },
        "favorite_factions": {
            "user_a": resolve_favorite_faction(faction_games_user_a, faction_wins_user_a),
            "user_b": resolve_favorite_faction(faction_games_user_b, faction_wins_user_b),
        },
        "matches": matches,
    }
