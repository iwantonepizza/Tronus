# BACKLOG

Очередь задач. Architect перекладывает задачи в `IN_PROGRESS.md` при назначении агенту.

Префиксы:
- `T-XXX` — backend (Django). Директория `backend/`.
- `F-XXX` — frontend (React). Директория `frontend/`.
- `I-XXX` — integration / devops.

---

## Phase 1 — MVP → **CLOSED**

Все 40+ задач Phase 1 закрыты (см. `DONE.md`). Phase 1 считается поставленной:
- Backend: полный API по `API_CONTRACT.md`, 160 pytest passing.
- Frontend: все 18 экранов из `DESIGN_BRIEF.md`, 15 vitest passing.
- Integration: dev-режим фронт+бэк подтверждён end-to-end (I-002).

Следующий шаг — Phase 2.

---

## 🔥 Priority 1 — Polish после Phase 1

Мелкие замечания из батч-ревью wave 3, которые не критичны, но дают «чистый» Phase 1.

### T-080: Unify avatar style enum naming

**Phase:** 1.5
**Depends on:** T-050 (done)

#### Context
В коде `AvatarAsset.style = "basic_frame"`, в `ai-docs/DATA_MODEL.md` значится `basic`. Никто не читает это значение снаружи пока, но документация и код должны совпадать.

#### Scope
- Решить: источник истины — **код** (`basic_frame` — точнее отражает суть).
- Обновить `ai-docs/DATA_MODEL.md` раздел `avatars` → `style: basic_frame | ...`.
- Обновить `ai-docs/decisions/ADR-0007-avatar-pillow-mvp.md` если там упоминается.

#### Acceptance criteria
- [ ] Поиск по репозиторию `grep -r "\"basic\"" backend/apps/avatars/ ai-docs/` — никаких упоминаний `"basic"` как enum value.
- [ ] `ai-docs/DATA_MODEL.md` согласован с моделью.

---

### T-081: Production WSGI server в draft deploy stack

**Phase:** 1.5
**Depends on:** I-003 (done)
**Blocks:** I-005 (staging deploy)

#### Context
В `deploy/docker-compose.prod.yml` бэкенд запускается через `python manage.py runserver`, что Django явно не рекомендует для prod. В MVP это было ок, но для staging/prod нужен нормальный WSGI-сервер.

#### Scope
- Добавить `gunicorn` в `backend/requirements.in` + `pip-compile`.
- Обновить `backend/Dockerfile` (или создать `backend/Dockerfile.prod`) с CMD `gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3 --timeout 60 --access-logfile -`.
- Обновить `deploy/docker-compose.prod.yml` — использовать prod-Dockerfile.
- Dev стек (`backend/docker-compose.yml`) **не трогать** — там runserver остаётся для HMR.
- Обновить `deploy/README.md`.

#### Acceptance criteria
- [ ] `docker compose -f deploy/docker-compose.prod.yml up --build` поднимает backend на gunicorn.
- [ ] `curl http://localhost:8080/api/v1/reference/factions/` возвращает 200.
- [ ] `backend/docker-compose.yml` работает по-прежнему (dev runserver нетронут).

#### Files to touch
- `backend/requirements.in` + `.txt`
- `backend/Dockerfile.prod` (create)
- `deploy/docker-compose.prod.yml`
- `deploy/README.md`

#### References
- `ai-docs/INTEGRATION_PLAN.md` раздел 6

---

### T-082: pytest-cov coverage gate (optional)

**Phase:** 1.5
**Depends on:** T-005 (CI workflow — done)
**Priority:** low

#### Scope
Добавить `pytest-cov` в dev-dependencies, настроить в `backend/pyproject.toml` минимальный threshold (например, 75% для services/selectors), обновить CI workflow.

Опционально — можем решить, что coverage не нужен для личного проекта.

---

### I-004: Frontend CI workflow

**Phase:** 1.5
**Depends on:** F-001 (done)

#### Context
`.github/workflows/ci.yml` покрывает только backend (lint + pytest). Frontend тоже стоит гонять автоматически.

#### Scope
- Добавить `.github/workflows/frontend-ci.yml`: `npm ci`, `npm run lint`, `npm run test`, `npm run build`.
- Кеширование npm.
- Запуск на PR и push в main, если `frontend/**` изменился (path filter).

#### Acceptance criteria
- [ ] PR с правкой в `frontend/` триггерит frontend workflow.
- [ ] PR с правкой в `backend/` не триггерит frontend workflow.
- [ ] Все три шага (`lint`, `test`, `build`) зелёные на текущей ветке.

---

### I-005: Staging deploy на реальной платформе

**Phase:** 1.5 / 2
**Depends on:** T-081
**Priority:** medium

#### Context
Draft prod-stack (I-003) поднимается локально. Для реального использования нужно развернуть где-то снаружи: Fly.io / Railway / DO App Platform / VPS + Docker.

#### Scope — architect decision required

Прежде чем начинать задачу, владелец и architect выбирают:
- Платформу для backend (Fly.io vs Railway vs DO vs VPS).
- Платформу для frontend (Cloudflare Pages vs Vercel vs статика через тот же nginx same-origin).
- Схему hosting'а: same-origin (вариант A из `INTEGRATION_PLAN`) или split-subdomain.
- Обработку media: локальный volume vs S3-совместимое (R2).
- Секреты / env management.

После решения → детальная задача с `Files to touch`.

---

## 🎯 Phase 2 — Обогащение функциональности

Фичи, которые делают сервис «живым». См. `ai-docs/ROADMAP.md`.

### T-100: `games` — RSVP (статусы участия на плановую сессию)

**Phase:** 2
**Depends on:** T-025 (done)

#### Context
Сейчас участники добавляются к плановой сессии вместе с фракцией. Для планирования этого мало: нужно понимать, кто реально придёт. Идея — статус участия (`going` / `maybe` / `not_going` / `pending`).

#### Scope — architect pre-work required

Перед реализацией architect пишет **ADR-0008: RSVP model** с выбором:
- Добавить поле `rsvp_status` в `Participation` (и разрешить `faction=null` до подтверждения) ИЛИ
- Создать отдельную модель `SessionInvite` отдельно от `Participation`.

После ADR → детальная задача.

---

### T-101: Celery + Redis инфраструктура

**Phase:** 2
**Depends on:** T-081, I-005

#### Context
Celery нужен для T-102 (AI avatars, асинхронная генерация). В MVP мы сознательно обошлись без него.

#### Scope
- `redis` сервис в `backend/docker-compose.yml` и `deploy/docker-compose.prod.yml`.
- `celery[redis]` в `backend/requirements.in`.
- `backend/config/celery.py` — настройка.
- `backend/apps/core/tasks.py` — demo-task `ping`.
- CI-интеграция: worker не блокирует тесты.

#### Acceptance criteria
- [ ] `docker compose up` поднимает `web`, `db`, `redis`, `worker`.
- [ ] `demo.ping.delay()` в Django shell возвращает результат.
- [ ] Тесты работают в eager mode (`CELERY_TASK_ALWAYS_EAGER=True` в `dev.py`).

---

### T-102: AI avatar generation

**Phase:** 2
**Depends on:** T-101, T-050 (done)

#### Context
В T-050 сделан базовый Pillow-аватар (фото + цветная рамка). Это MVP. Phase 2 — добавить стили через внешний AI API.

#### Scope — architect decision required
- Какой AI-провайдер: OpenAI `images.generate`, Replicate, Fal, Stability.
- Как хранить ключи (env vs secret manager).
- Какие стили предложить пользователю.

После выбора → детальная задача с `AvatarAsset.style in {basic_frame, realistic, dark, heraldic, portrait}` и `generate_ai_avatar(...)` как Celery task.

---

### T-200: Seasons

**Phase:** 3
**Depends on:** T-025 (done)

#### Context
Сезоны = отрезки времени с отдельной таблицей статистики. Например, «весна 2026» с 2026-03-01 по 2026-05-31. Статистика считается только по сыгранным в сезоне партиям.

#### Scope
- Модель `Season(name, slug, start_at, end_at, is_current)`.
- Поле `session.season` опциональное (заполняется при finalize на основе `scheduled_at`).
- Селекторы stats с фильтром по сезону.
- API: `/api/v1/seasons/`, `/api/v1/stats/seasons/<slug>/`.

---

### T-201: Achievements

**Phase:** 3
**Depends on:** T-025 (done), T-040..T-044 (done)

#### Context
Ачивки привязывают к событиям: первая победа, 10 игр за фракцию, 3 победы подряд, хет-трик корон.

#### Scope — architect decision required
- Какие ачивки в MVP ачивок (выбрать 10).
- Как их вычислять: triggered (на событие `session.finalized` через signal) или periodically (Celery beat).

---

## 🎨 Phase 2 — Frontend

### F-012: RSVP widget в Match detail

**Phase:** 2
**Depends on:** T-100

Встроенный в `MatchDetailPage` виджет «Идёшь?» для плановых сессий. Каждому приглашённому показывается статус, владелец сессии может добавлять/убирать.

---

### F-013: Achievements page

**Phase:** 3
**Depends on:** T-201

Экран 7.20 из `DESIGN_BRIEF.md`: grid карточек ачивок с прогрессом. Подключается к бэку после T-201.

---

### F-014: Seasons UI

**Phase:** 3
**Depends on:** T-200

Экран 7.21: селектор сезона, отфильтрованная статистика, «Чемпион сезона».

---

### F-015: Polish — анимации и микро-интеракции

**Phase:** 2
**Depends on:** все F-* done

#### Scope
Пройтись по `DESIGN_BRIEF.md` раздел 9 и убедиться, что все обязательные анимации на месте:
- Number count-up в `StatTile` при появлении во viewport.
- Confetti при финализации партии (цвет фракции победителя).
- Vote button particle bursts.
- Leaderboard reorder (FLIP) при смене метрики.
- Faction color transition на avatar generator.
- `prefers-reduced-motion` — глобальный respect.

---

### F-016: Accessibility audit

**Phase:** 2
**Depends on:** F-015

#### Scope
- Проверка ARIA-ролей на нестандартных интерактивных элементах (VoteButtons, NumberStepper, Drag-and-drop в Finalize wizard).
- Контраст цветов (WCAG AA) — особенно фракционных.
- Keyboard navigation.
- Screen reader smoke на 3 ключевых экранах: Home, Match detail, Finalize.

---

## 🔭 Будущее — без даты и приоритета

- Email-уведомления (T-110).
- Telegram-бот для RSVP (T-111).
- Экспорт истории партий в JSON/CSV для бэкапов (T-112).
- Tournaments: серии турнирных партий с общей таблицей (T-202).
- «Легендарные матчи» подборка (F-017).

---

## Рабочие задачи / DevOps

- **I-006:** настроить dependabot / renovate для автообновления зависимостей.
- **I-007:** backup стратегия для Postgres (когда задеплоимся).
- **I-008:** мониторинг ошибок (Sentry / simple JSON logging).
