from __future__ import annotations

from django.urls import path

from .views import DeckListView, FactionListView, GameModeListView

app_name = "reference"

urlpatterns = [
    path("factions/", FactionListView.as_view(), name="faction-list"),
    path("modes/", GameModeListView.as_view(), name="mode-list"),
    path("decks/", DeckListView.as_view(), name="deck-list"),
]
