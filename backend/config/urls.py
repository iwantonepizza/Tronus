"""Root URL configuration."""

from __future__ import annotations

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import HttpRequest, HttpResponse
from django.urls import include, path


def healthcheck(_: HttpRequest) -> HttpResponse:
    return HttpResponse("ok")


urlpatterns = [
    path("", healthcheck, name="healthcheck"),
    path("admin/", admin.site.urls),
    path("api/v1/", include("apps.accounts.urls")),
    path("api/v1/", include("apps.avatars.urls")),
    path("api/v1/", include("apps.comments.urls")),
    path("api/v1/", include("apps.games.urls")),
    path("api/v1/", include("apps.ratings.urls")),
    path("api/v1/", include("apps.stats.urls")),
    path("api/v1/", include("apps.notifications.urls")),
    path("api/v1/reference/", include("apps.reference.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
