from __future__ import annotations

from django.urls import path

from .views import FactionListView, GameModeListView, HouseDeckListView

app_name = "reference"

urlpatterns = [
    path("factions/", FactionListView.as_view(), name="faction-list"),
    path("modes/", GameModeListView.as_view(), name="mode-list"),
    path("decks/", HouseDeckListView.as_view(), name="deck-list"),
]
