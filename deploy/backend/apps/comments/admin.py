from __future__ import annotations

from django.contrib import admin

from .models import MatchComment


@admin.register(MatchComment)
class MatchCommentAdmin(admin.ModelAdmin):
    actions = ("soft_delete_selected", "restore_selected")
    list_display = (
        "id",
        "session",
        "author",
        "created_at",
        "edited_at",
        "is_deleted",
    )
    list_filter = ("is_deleted", "created_at")
    date_hierarchy = "created_at"
    search_fields = (
        "body",
        "author__email",
        "author__username",
        "author__profile__nickname",
    )
    raw_id_fields = ("session", "author")

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("session", "author", "author__profile")

    @admin.action(description="Soft-delete selected comments")
    def soft_delete_selected(self, request, queryset) -> None:
        updated_count = queryset.filter(is_deleted=False).update(is_deleted=True)
        self.message_user(request, f"Soft-deleted {updated_count} comment(s).")

    @admin.action(description="Restore selected comments")
    def restore_selected(self, request, queryset) -> None:
        updated_count = queryset.filter(is_deleted=True).update(is_deleted=False)
        self.message_user(request, f"Restored {updated_count} comment(s).")
