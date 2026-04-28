from __future__ import annotations

from django.contrib import admin

from .models import MatchVote


@admin.register(MatchVote)
class MatchVoteAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "session",
        "from_user",
        "to_user",
        "vote_type",
        "created_at",
    )
    list_filter = ("vote_type", "created_at")
    date_hierarchy = "created_at"
    search_fields = (
        "from_user__email",
        "from_user__username",
        "from_user__profile__nickname",
        "to_user__email",
        "to_user__username",
        "to_user__profile__nickname",
    )
    raw_id_fields = ("session", "from_user", "to_user")

    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            "session",
            "from_user",
            "from_user__profile",
            "to_user",
            "to_user__profile",
        )
