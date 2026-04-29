from __future__ import annotations

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.http import HttpRequest

from .models import User
from .services import approve_user


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    actions = ("approve_selected_users",)
    list_display = ("email", "nickname", "is_active", "date_joined")
    list_filter = ("is_active",)
    ordering = ("-date_joined",)
    search_fields = ("email", "username", "profile__nickname")

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("profile")

    @admin.display(description="Nickname")
    def nickname(self, obj: User) -> str:
        return getattr(obj.profile, "nickname", "")

    @admin.action(description="Approve selected users")
    def approve_selected_users(self, request: HttpRequest, queryset) -> None:
        approved_count = 0

        for user in queryset:
            was_active = user.is_active
            approve_user(user=user)
            if not was_active:
                approved_count += 1

        self.message_user(request, f"Approved {approved_count} user(s).")
