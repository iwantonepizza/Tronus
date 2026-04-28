# CR-005: CORS и CSRF для фронтенд-интеграции

**Status:** closed
**Closed:** 2026-04-23
**Created:** 2026-04-22
**Author:** architect
**Related:** blocks I-001 (dev integration), F-002 (auth flow)

---

## Проблема

Фронтенд будет работать на отдельном порту (в dev) и, возможно, на отдельном домене (в prod). Без CORS-настроек любой запрос с фронта получит CORS-блокировку в браузере.

Session-auth (выбран в ADR-0003) требует передачи куки между доменами. Это работает только если:
1. На сервере: `CORS_ALLOW_CREDENTIALS = True` + `CORS_ALLOWED_ORIGINS` с точными доменами (не `*`).
2. На сервере: `SESSION_COOKIE_SAMESITE = "Lax"` (минимум) или `"None"` + `Secure` для кросс-доменной работы.
3. На клиенте: `fetch(..., { credentials: "include" })`.

Также нужен CSRF:
- Django отдаёт `csrftoken` cookie при GET-запросах.
- Фронт читает его и шлёт в заголовке `X-CSRFToken` для unsafe methods.

## Решение

### Зависимость

Добавить в `backend/requirements.in`:

```
django-cors-headers>=4.4,<5.0
```

### `backend/config/settings/base.py`

```python
INSTALLED_APPS = [
    ...,
    "corsheaders",
    ...
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",   # ← до CommonMiddleware
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    ...
]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=[])

CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS", default=[])

SESSION_COOKIE_SAMESITE = env("SESSION_COOKIE_SAMESITE", default="Lax")
CSRF_COOKIE_SAMESITE = env("CSRF_COOKIE_SAMESITE", default="Lax")
```

### `backend/config/settings/dev.py`

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Vite default
    "http://127.0.0.1:5173",
]
CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS
```

### `backend/config/settings/prod.py`

Читает из env:
```python
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
# SameSite=None требуется только если фронт на другом eTLD+1; по умолчанию Lax и фронт на поддомене.
```

### `.env.example`

```
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
CSRF_TRUSTED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
SESSION_COOKIE_SAMESITE=Lax
CSRF_COOKIE_SAMESITE=Lax
```

### Дополнительно: выставить CSRF cookie на anonymous GET-запросах

Чтобы фронт при первой загрузке сразу получал CSRF-токен, добавить `GET /api/v1/auth/csrf/` эндпоинт, возвращающий `{"detail": "CSRF cookie set"}` и декорированный `@ensure_csrf_cookie`. Это стандартный DRF-паттерн.

## Impact на файлы

- `backend/requirements.in`, `backend/requirements.txt`.
- `backend/config/settings/base.py`, `dev.py`, `prod.py`.
- `backend/config/urls.py` — `/api/v1/auth/csrf/` эндпоинт.
- `backend/apps/accounts/views.py` — `CsrfTokenView`.
- `backend/apps/accounts/urls.py`.
- `.env.example`.
- `docker-compose.yml` — передать нужные env в контейнер.

## Рождает задачу

**I-001: выполнить CR-005 + dev-проверку интеграции** — см. `BACKLOG.md`.
