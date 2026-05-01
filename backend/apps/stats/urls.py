from __future__ import annotations

from django.urls import path

from .views import (
    FactionStatsDetailView,
    FactionStatsListView,
    HeadToHeadStatsView,
    HeadToHeadSuggestedView,
    LeaderboardStatsView,
    OverviewStatsView,
    PlayerStatsDetailView,
)

app_name = "stats"

urlpatterns = [
    path(
        "stats/players/<int:user_id>/",
        PlayerStatsDetailView.as_view(),
        name="player-stats",
    ),
    path("stats/overview/", OverviewStatsView.as_view(), name="overview-stats"),
    path("stats/leaderboard/", LeaderboardStatsView.as_view(), name="leaderboard-stats"),
    path("stats/head-to-head/", HeadToHeadStatsView.as_view(), name="head-to-head-stats"),
    path(
        "stats/head-to-head/suggested/",
        HeadToHeadSuggestedView.as_view(),
        name="head-to-head-suggested",
    ),
    path("stats/factions/", FactionStatsListView.as_view(), name="faction-stats-list"),
    path(
        "stats/factions/<slug:slug>/",
        FactionStatsDetailView.as_view(),
        name="faction-stats-detail",
    ),
]
