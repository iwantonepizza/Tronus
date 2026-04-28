# Tronus

Трекер партий настольной «Игры престолов» для закрытой компании друзей.

**Phase 1 MVP закрыта.** Backend + Frontend готовы, интеграция подтверждена end-to-end в dev. Draft prod-stack существует. Следующий шаг — Phase 2 (RSVP, Celery, AI avatars, Seasons, Achievements).

## Монорепа

- **`AGENTS.md`** — начни отсюда, если ты агент.
- **`ai-docs/`** — архитектура, задачи, ADR, change requests, отчёты.
  - Актуальный статус — `ai-docs/tasks/DONE.md` и `ai-docs/tasks/IN_PROGRESS.md`.
  - Roadmap и фазы — `ai-docs/ROADMAP.md`.
- **`backend/`** — Django 5 + DRF, 8 apps, ~35 endpoints, 160 pytest passing.
- **`frontend/`** — React 19 + Vite + TS + Tailwind + React Query, 18 страниц.
- **`frontend-design/`** — HTML/JSX прототип от Claude Design (READ-ONLY reference).
- **`deploy/`** — draft production stack (nginx + compose.prod).

## Быстрый старт dev

### Backend

```bash
cd backend
cp .env.example .env
docker compose up -d db
docker compose run --rm web python manage.py migrate
docker compose up web
# backend на http://localhost:8000
# admin на http://localhost:8000/admin/
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
# фронт на http://localhost:5173
# `/api/*` и `/admin/*` проксируются через Vite на backend:8000
```

### End-to-end smoke (подтверждён в I-002)

1. Запустить backend + frontend как выше.
2. В админке `/admin/` создать суперпользователя.
3. На фронте `/register` создать игрока → в админке выбрать и `Approve selected users`.
4. Логин → создать сессию → финализировать → увидеть в `/matches`.

## Draft prod-compose

```bash
cd deploy
docker compose -f docker-compose.prod.yml config   # валидация
docker compose -f docker-compose.prod.yml up --build
# single-origin на http://localhost:8080, /api и /admin проксируются на backend
```

**Важно:** draft prod-stack сейчас использует `runserver`. Для реального staging нужно закрыть T-081 (gunicorn) и I-005 (развёртывание на платформе).

## Статус

| Метрика                             | Значение |
|-------------------------------------|----------|
| Phase                               | 1 MVP — closed → Phase 2 started |
| Закрытых задач                      | 43       |
| Backend tests                       | 160 pass |
| Frontend tests                      | 15 pass  |
| API endpoints                       | ~35      |
| Frontend pages                      | 18       |

Текущая волна задач (polish + CI) — в `ai-docs/tasks/IN_PROGRESS.md`.
Полный backlog — `ai-docs/tasks/BACKLOG.md`.
