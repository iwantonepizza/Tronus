from __future__ import annotations

from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpRequest, HttpResponse
from django.urls import path


def healthcheck(_: HttpRequest) -> HttpResponse:
    return HttpResponse("ok")


urlpatterns = [
    path("", healthcheck, name="healthcheck"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
