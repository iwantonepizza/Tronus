from __future__ import annotations

from rest_framework import generics

from . import selectors
from .serializers import FactionSerializer, GameModeSerializer, HouseDeckSerializer


class FactionListView(generics.ListAPIView):
    serializer_class = FactionSerializer

    def get_queryset(self):
        return selectors.list_active_factions()


class GameModeListView(generics.ListAPIView):
    serializer_class = GameModeSerializer

    def get_queryset(self):
        return selectors.list_game_modes()


class HouseDeckListView(generics.ListAPIView):
    serializer_class = HouseDeckSerializer

    def get_queryset(self):
        return selectors.list_decks()
