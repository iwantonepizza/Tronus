# CR-004: Добавить MEDIA_ROOT / MEDIA_URL в settings

**Status:** closed
**Closed:** 2026-04-23
**Created:** 2026-04-22
**Author:** architect
**Related:** T-001 (approved_with_comments), blocks T-050 (avatars)

---

## Проблема

`backend/config/settings/base.py` не содержит `MEDIA_ROOT` и `MEDIA_URL`. T-050 (аватары через Pillow) требует сохранять сгенерированные изображения, а без MEDIA settings `ImageField.upload_to` ругается или складывает файлы в произвольное место.

Также `sigil = ImageField(upload_to="reference/factions")` в `Faction` модели сейчас формально работает, но пути файлов непредсказуемы.

## Решение

В `backend/config/settings/base.py`:

```python
MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"
```

В `backend/config/urls.py` для dev-окружения добавить serving медиа (только при `DEBUG=True`):

```python
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [...]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

В prod медиа отдаёт reverse-proxy (nginx / Cloudflare R2 / S3). Это конфигурится в `I-003` при деплое, не в коде.

В `.dockerignore` и `.gitignore`: добавить `media/` (файлы не в git).

В `docker-compose.yml`: примонтировать том `./backend/media:/app/media` к web-сервису, чтобы файлы переживали пересборку контейнера.

## Impact на файлы

- `backend/config/settings/base.py` — добавить 2 константы.
- `backend/config/urls.py` — добавить dev-serving.
- `backend/.gitignore` и корневой `.gitignore` — добавить `media/`.
- `backend/.dockerignore` — добавить `media/`.
- `docker-compose.yml` — volume для `media/`.

## Рождает задачу

**T-072: выполнить CR-004** — см. `BACKLOG.md`.
