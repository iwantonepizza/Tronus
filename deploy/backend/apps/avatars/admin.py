from __future__ import annotations

from django.contrib import admin

from .models import AvatarAsset


@admin.register(AvatarAsset)
class AvatarAssetAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "faction", "style", "is_current", "created_at")
    list_filter = ("style", "is_current", "faction")
    search_fields = ("user__email", "user__username", "user__profile__nickname", "faction__slug")
    raw_id_fields = ("user",)
    autocomplete_fields = ("faction",)

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("user", "user__profile", "faction")
