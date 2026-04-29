# Tronus

Трекер партий настольной «Игры престолов» для закрытой компании друзей.

**Phase 1 MVP — CLOSED. Phase 2 — IN PROGRESS** (после реального теста и пользовательского feedback 2026-04-27).

---

## Что нового в Phase 2

После первого теста владелец прислал большой feedback: критичные баги (авы не отображаются, RSVP не работает, поиск/уведомления — заглушки) и фундаментальные доменные уточнения (раунды, треки власти, замена игроков, инвайты). Pivot оформлен в:

- `ai-docs/source/USER_FEEDBACK_2026-04-27.md` — исходник владельца.
- `ai-docs/source/USER_FEEDBACK_ANALYSIS_2026-04-27.md` — разбор по категориям.
- `ai-docs/decisions/ADR-0009..0015` — 7 архитектурных решений.
- `ai-docs/changes/CR-006..007` — 2 change requests.
- `ai-docs/tasks/BACKLOG.md` — полностью переписанный backlog Phase 2.

---

## Монорепа

- **`AGENTS.md`** — начни отсюда, если ты агент.
- **`ai-docs/`** — архитектура, задачи, ADR, change requests, отчёты.
  - Текущие задачи — `ai-docs/tasks/IN_PROGRESS.md`.
  - Полный backlog — `ai-docs/tasks/BACKLOG.md`.
  - Roadmap — `ai-docs/ROADMAP.md`.
- **`backend/`** — Django 5 + DRF, 8 apps. Phase 1 endpoints готовы; Phase 2 расширит до ~60.
- **`frontend/`** — React 19 + Vite + TS + Tailwind + React Query, 18 страниц.
- **`frontend-design/`** — HTML/JSX прототип Claude Design (READ-ONLY reference).
- **`deploy/`** — draft production stack (nginx + compose.prod) с gunicorn.

---

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
# /api/*, /admin/*, /media/* проксируются на backend:8000
```

### End-to-end

1. Запустить backend + frontend.
2. В админке создать суперпользователя.
3. На фронте `/register` → создать игрока.
   - Если ввёл секретное слово (`lovecraft` после T-110) — сразу активный.
   - Иначе — в админке `Approve selected users`.
4. Логин (по email или нику после T-113) → создать сессию → инвайт игроков → начать партию (T-100, после Wave 6) → отмечать раунды (T-101) → финализировать → увидеть в `/matches`.

> Hotfix-задачи Wave 5 (T-114, F-100, F-104) исправляют **критичные баги**, без которых end-to-end сейчас не идёт.

---

## Статус

| Метрика                             | Значение |
|-------------------------------------|----------|
| Phase                               | 1 closed → 2 in progress |
| Закрытых задач                      | 49       |
| Backend tests                       | 160+ pass |
| Frontend tests                      | 15+ pass  |
| ADR принятых                        | 15       |
| Change requests open                | 2        |

Текущая волна — `ai-docs/tasks/IN_PROGRESS.md` (волна 5).
