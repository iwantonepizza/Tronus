from __future__ import annotations

from django.contrib import admin

from .models import GameSession, Outcome, Participation


class ParticipationInline(admin.TabularInline):
    model = Participation
    extra = 0
    raw_id_fields = ("user",)
    autocomplete_fields = ("faction",)
    fields = ("user", "faction", "place", "castles", "is_winner", "notes")


class OutcomeInline(admin.StackedInline):
    model = Outcome
    extra = 0
    raw_id_fields = ("mvp",)


@admin.register(GameSession)
class GameSessionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "scheduled_at",
        "status",
        "mode",
        "deck",
        "created_by",
        "participant_count",
    )
    list_filter = ("status", "mode", "deck", "scheduled_at")
    search_fields = (
        "planning_note",
        "created_by__email",
        "created_by__username",
        "created_by__profile__nickname",
    )
    date_hierarchy = "scheduled_at"
    raw_id_fields = ("created_by",)
    inlines = (ParticipationInline, OutcomeInline)

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .select_related("mode", "deck", "created_by", "created_by__profile")
            .prefetch_related("participations")
        )

    @admin.display(description="Participants")
    def participant_count(self, obj: GameSession) -> int:
        return obj.participations.count()


@admin.register(Participation)
class ParticipationAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "session",
        "user",
        "faction",
        "place",
        "castles",
        "is_winner",
    )
    list_filter = ("is_winner", "faction", "session__status")
    search_fields = (
        "user__email",
        "user__username",
        "user__profile__nickname",
        "session__id",
        "notes",
    )
    raw_id_fields = ("session", "user")
    autocomplete_fields = ("faction",)

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .select_related("session", "user", "user__profile", "faction")
        )


@admin.register(Outcome)
class OutcomeAdmin(admin.ModelAdmin):
    list_display = ("session", "rounds_played", "end_reason", "mvp", "created_at")
    list_filter = ("end_reason", "created_at")
    search_fields = (
        "session__id",
        "mvp__email",
        "mvp__username",
        "mvp__profile__nickname",
        "final_note",
    )
    raw_id_fields = ("session", "mvp")

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("session", "mvp", "mvp__profile")
