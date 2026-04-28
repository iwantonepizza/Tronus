from __future__ import annotations

from rest_framework import generics

from . import selectors
from .serializers import DeckSerializer, FactionSerializer, GameModeSerializer


class FactionListView(generics.ListAPIView):
    serializer_class = FactionSerializer

    def get_queryset(self):
        return selectors.list_active_factions()


class GameModeListView(generics.ListAPIView):
    serializer_class = GameModeSerializer

    def get_queryset(self):
        return selectors.list_game_modes()


class DeckListView(generics.ListAPIView):
    serializer_class = DeckSerializer

    def get_queryset(self):
        return selectors.list_decks()
