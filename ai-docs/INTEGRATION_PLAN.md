# INTEGRATION_PLAN.md

Как backend и frontend живут вместе — dev и prod.

---

## 1. Dev-окружение

### Режим запуска

Два процесса рядом:

- Backend: `docker compose up` из `backend/`. Поднимает `web` на `:8000` и `db` (Postgres) на `:5432`.
- Frontend: `npm run dev` из `frontend/`. Vite dev-сервер на `:5173`.

Фронт обращается к `http://localhost:8000/api/v1/...`. Браузер делает cross-origin запрос, поэтому критичен CORS (см. CR-005).

### Настройки CORS (из CR-005)

Уже зафиксировано в change request. Основные правила:

- `CORS_ALLOWED_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"]`
- `CORS_ALLOW_CREDENTIALS = True`
- `SESSION_COOKIE_SAMESITE = "Lax"` — этого достаточно для localhost, потому что браузер считает localhost и 127.0.0.1 same-site.

### CSRF в dev

Django защищает unsafe methods (POST/PATCH/DELETE) через CSRF. Для работы с фронтом:

1. Фронт при старте дергает `GET /api/v1/auth/csrf/` — эндпоинт с `@ensure_csrf_cookie`. Django ставит `csrftoken` cookie.
2. Фронт читает cookie через `document.cookie` (в `lib/csrf.ts`).
3. На все unsafe-запросы добавляется заголовок `X-CSRFToken: <value>`.
4. Django проверяет совпадение.

Альтернатива — отключить CSRF для API и использовать SameSite=Lax + session cookie. Но это слабее, не рекомендую.

### Vite proxy (опционально)

Если хочется избежать CORS в dev и ходить по относительным путям (`/api/v1/...`), Vite может проксировать:

```ts
// vite.config.ts
export default {
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
};
```

Тогда `VITE_API_BASE_URL=/api/v1` и запросы идут на `localhost:5173/api/v1/...`, Vite редиректит на `localhost:8000`. **Плюсы:** нет CORS-проблем, cookies работают как same-origin. **Минусы:** prod-режим будет отличаться.

**Рекомендация:** использовать CORS как основной путь (ближе к prod), proxy как fallback для тех, кому неудобно возиться с CSRF.

---

## 2. Prod-окружение

### Архитектура

Вариант A (simpler) — оба за одним reverse-proxy (nginx):

```
              nginx (:443)
              /    \
         /api/v1/   /
             ↓      ↓
         Django   static (dist/ от Vite build)
         :8000    (served by nginx)
```

При такой схеме фронт и бэк — same-origin, CORS не нужен. CSRF — стандартный Django-флоу.

Вариант B (split) — разные поддомены:

```
  api.tronus.app        app.tronus.app
       ↓                      ↓
     Django            frontend static hosting (Vercel / Cloudflare Pages)
```

Требует:
- `CORS_ALLOWED_ORIGINS = ["https://app.tronus.app"]`
- `SESSION_COOKIE_DOMAIN = ".tronus.app"`
- `SESSION_COOKIE_SECURE = True`
- `SESSION_COOKIE_SAMESITE = "None"` (для cross-subdomain требуется None + Secure)

**Для MVP** — вариант A. Проще, дешевле, быстрее.

### Media files

В prod `MEDIA_ROOT` — persistent volume. nginx отдаёт `/media/*` напрямую, в обход Django.

При переходе на S3-like storage (Cloudflare R2) — `django-storages` + `DEFAULT_FILE_STORAGE` + `MEDIA_URL = "https://r2.tronus.app/media/"`. Это ADR, когда дойдём.

### Static files

Django `collectstatic` → `staticfiles/`. nginx отдаёт `/static/*`.

Фронт `npm run build` → `frontend/dist/`. nginx отдаёт как корневой root.

---

## 3. Auth flow

### Регистрация

```
Фронт         Бэк
  │            │
  ├─ POST /api/v1/auth/register/  {email, password, nickname}
  │            │→ создаёт User(is_active=False), Profile, возвращает {id, status: "pending_approval"}
  │  ← 201 ────┤
  │            │
  │ показываем экран «ждите апрува»
```

Owner заходит в Django admin → список pending → выбирает → action "Approve selected users" → `User.is_active=True`, добавляется в группу `player`.

### Логин

```
Фронт         Бэк
  │            │
  ├─ GET /api/v1/auth/csrf/
  │  ← 200 (Set-Cookie: csrftoken) ──
  │            │
  ├─ POST /api/v1/auth/login/  {email, password}
  │  Headers: X-CSRFToken: <value>
  │            │→ authenticate, login, создаёт sessionid
  │  ← 200 (Set-Cookie: sessionid; HttpOnly) PrivateUserSerializer
  │            │
  ├─ GET /api/v1/auth/me/  (все последующие запросы)
  │  Headers: Cookie: sessionid=...
  │  ← 200 PrivateUserSerializer
```

Если `is_active=False` → `403 {code: "account_pending_approval"}`. Фронт показывает соответствующее сообщение.

### Logout

```
Фронт         Бэк
  │            │
  ├─ POST /api/v1/auth/logout/
  │  Headers: X-CSRFToken, Cookie: sessionid
  │            │→ logout, очищает sessionid
  │  ← 204 ────┤
  │            │
  │ очищаем AuthContext, редиректим на /
```

### Anonymous access

Read-only endpoints (`GET /sessions/`, `/stats/*`, `/users/*`) работают без sessionid — см. ADR-0005. Фронт на anonymous сессии показывает всю публичную часть и предлагает логин для действий.

---

## 4. Error shape

Все ошибки от бэка — единый формат (ADR-0003 и `API_CONTRACT.md`):

```json
{
  "error": {
    "code": "validation_error",
    "message": "Validation error.",
    "details": {
      "email": ["A user with this email already exists."]
    }
  }
}
```

Фронт в `api/client.ts` ловит это в `ApiError` и прокидывает в UI.

**Известные коды:**
- `validation_error` — 400, поля в details.
- `invalid_credentials` — 400.
- `account_pending_approval` — 403.
- `rate_limited` — 429.
- `unauthorized` — 401.
- `permission_denied` — 403 (не pending).
- `not_found` — 404.

---

## 5. Environment variables — шпаргалка

### Backend (`.env` / prod env)

```
DEBUG=false
SECRET_KEY=<random-32+-chars>
DATABASE_URL=postgresql://user:pass@host:5432/tronus
ALLOWED_HOSTS=api.tronus.app,localhost
CORS_ALLOWED_ORIGINS=https://app.tronus.app
CSRF_TRUSTED_ORIGINS=https://app.tronus.app
SESSION_COOKIE_SAMESITE=Lax
SESSION_COOKIE_SECURE=true
MEDIA_ROOT=/var/tronus/media
```

### Frontend (`.env`)

```
VITE_API_BASE_URL=https://api.tronus.app/api/v1
VITE_USE_MOCKS=false
VITE_APP_NAME=Tronus
```

### Draft files in repo

- `deploy/docker-compose.prod.yml` — draft stack `frontend + backend + db`
- `deploy/nginx/tronus.conf` — same-origin reverse proxy, SPA fallback, static/media routing
- `deploy/env/backend.prod.env.example` — example backend/prod env
- `deploy/env/frontend.prod.env.example` — example frontend build env
- `frontend/Dockerfile.prod` — multi-stage `Vite -> nginx`

This is intentionally still a draft:

- backend is not moved to `gunicorn` / `uvicorn` yet
- external TLS and domain routing are not finalized
- `.example` env files are placeholders for local production-like smoke

---

## 6. Deploy strategy (draft)

Не в scope MVP, но закладываем:

- **Backend:** Dockerfile уже есть. Кандидаты: Fly.io, Railway, Render, DigitalOcean App Platform. Один маленький worker + managed Postgres.
- **Frontend:** статик. Кандидаты: Cloudflare Pages, Vercel, GitHub Pages.
- **Media:** локальный volume в MVP. При росте → Cloudflare R2.
- **CI:** GitHub Actions (уже есть для бэка, по T-005) → добавить шаг билда и деплоя фронта.

Полный deploy-план — отдельный ADR когда будем готовы.

---

## 7. Контрольные точки интеграции

Дорожная карта до первого «кликает → данные бегут»:

1. **I-001:** CR-005 выполнен. CORS, CSRF, env настроены. Backend отдаёт корректные CORS-заголовки.
2. **F-001:** Vite-проект создан, базовая структура, Tailwind, роутинг, AppShell.
3. **F-002:** Auth flow через API (register, login, logout, me).
4. **F-003:** List/detail сессий через API (когда T-024 + T-025 закроются).
5. **I-002:** Smoke-тест интеграции — owner руками проходит путь «зарегистрировался → owner апрувит → залогинился → создал сессию → финализировал → увидел в списке».
6. **F-004..F-010:** Остальные экраны, каждый на готовый endpoint или мок до его готовности.
7. **I-003:** Deploy-конфиги, prod env.

Детали — в задачах `I-XXX` и `F-XXX` в `BACKLOG.md`.
