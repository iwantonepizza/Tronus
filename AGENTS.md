# AGENTS.md

**Источник истины** для всех агентов, работающих над проектом **Tronus** — трекер партий настольной «Игры престолов».

Любой агент перед началом работы обязан прочитать этот файл целиком.

---

## 1. Что мы строим

Closed-group веб-приложение для компании друзей. Пользователи заносят результаты сыгранных партий, планируют будущие, видят статистику метагейма.

**Это не** соцсеть, не турнирная платформа, не публичный сервис. Нагрузка: десятки партий в месяц, десятки пользователей.

**Ключевая ценность** — агрегации: винрейты, матчапы, серии. Схема БД должна позволять считать их одним SQL-запросом.

---

## 2. Структура монорепы

```
tronus/
├── AGENTS.md              ← этот файл, единый контракт
├── README.md              ← навигация
├── .gitignore             ← единый для монорепы
├── .dockerignore
├── ai-docs/               ← вся документация и процессы
├── backend/               ← Django API (Python 3.12, DRF)
├── frontend/              ← production React (TS + Vite + Tailwind)
├── frontend-design/       ← HTML/JSX прототип от Claude Design. READ-ONLY reference.
└── deploy/                ← draft production compose + nginx config
```

**Важно:**
- `frontend-design/` — **референс**, не код. Если нужно что-то в нём менять — это архитектурное решение через ADR.
- `ai-docs/` существует **только на корне монорепы**. Не заводить `backend/ai-docs/` или `frontend/ai-docs/`.
- Все пути в задачах и отчётах даются **относительно корня монорепы** (`backend/apps/games/models.py`, не `apps/games/models.py`).
- Backend dev стек — `backend/docker-compose.yml`. Prod draft — `deploy/docker-compose.prod.yml`. Не путать.

---

## 3. Роли агентов

| Роль          | Кто          | Что делает                                                                     |
|---------------|--------------|--------------------------------------------------------------------------------|
| Architect     | Claude (я)   | Планирует, создаёт задачи, ревьюшит, обновляет ADR и основные документы.       |
| Backend coder | AI-агент     | Берёт задачу `T-XXX` из `ai-docs/tasks/IN_PROGRESS.md`, работает в `backend/`. |
| Frontend coder| AI-агент     | Берёт задачу `F-XXX` из `ai-docs/tasks/IN_PROGRESS.md`, работает в `frontend/`.|
| Integration   | AI-агент     | Задачи `I-XXX`: CORS, proxy, deploy, CI, env.                                  |
| Reviewer      | Architect    | Review → `ai-docs/reviews/`, approve → `APPROVALS.md` и `DONE.md`.             |
| Human (owner) | Пользователь | Принимает архитектурные решения, подтверждает спорные изменения.               |

Coder **не принимает архитектурных решений** самостоятельно. Если задача требует выбора между вариантами — блокируется и пишет вопрос в отчёт.

---

## 4. Префиксы задач

| Префикс  | Значение                       | Где работает агент                |
|----------|--------------------------------|-----------------------------------|
| `T-XXX`  | Backend (Django API)           | `backend/`                        |
| `F-XXX`  | Frontend (React production)    | `frontend/`                       |
| `I-XXX`  | Integration / DevOps           | Root + `backend/` + `frontend/`   |
| `CR-XXX` | Change request (от architect)  | Scope-изменение, ссылается на T/F |
| `ADR-XX` | Architecture Decision Record   | `ai-docs/decisions/`              |

Нумерация независимая: `T-080`, `F-015`, `I-004` — три разные задачи.

---

## 5. Workflow

### Для Architect

1. Требование от owner → анализ impact.
2. Если меняется архитектура — ADR в `ai-docs/decisions/`.
3. Обновляет `ARCHITECTURE.md` / `DATA_MODEL.md` / `API_CONTRACT.md` / `FRONTEND_ARCHITECTURE.md`.
4. Если изменяется scope уже closed задачи — change request в `ai-docs/changes/CR-XXX-*.md`.
5. Пишет задачу по `ai-docs/tasks/TEMPLATE.md`, кладёт в `BACKLOG.md`.
6. Переносит в `IN_PROGRESS.md` при назначении.
7. Review → `ai-docs/reviews/YYYY-MM-DD-<TASK_ID>.md`.
8. Approve → запись в `APPROVALS.md`, перенос в `DONE.md`, апдейт `CHANGELOG.md`.

### Для Coder

1. Читает в этом порядке: `AGENTS.md` → `ai-docs/CONVENTIONS.md` (backend) или `ai-docs/FRONTEND_ARCHITECTURE.md` (frontend) → **свою задачу** → references из задачи.
2. Работает в директориях, указанных в `Files to touch`. Выходить за рамки — только через блокер.
3. Пишет код по конвенциям, добавляет тесты.
4. Отчёт по `ai-docs/reports/TEMPLATE.md` → `ai-docs/reports/YYYY-MM-DD-<TASK_ID>.md`.
5. Если пришлось изменить scope — фиксирует в `Deviations from task` либо просит architect открыть CR.

**Правило по batch-режиму:** предпочтительно одна задача → отчёт → стоп до approve. На практике агенты успешно закрывают несколько задач подряд; это приемлемо при условии качества, но не отменяет обязанности делать отчёт по каждой задаче отдельно.

---

## 6. Жёсткие правила

### DO

- Следовать `ai-docs/CONVENTIONS.md` (backend) и `ai-docs/FRONTEND_ARCHITECTURE.md` (frontend).
- Работать в границах указанных файлов.
- Тесты к каждой новой логике.
- Спрашивать, если задача двусмысленная.
- Использовать `backend/...` и `frontend/...` как префикс путей в отчётах.

### DON'T

- Не переписывать то, что не просили.
- Не менять публичный API (URL, сериализаторы, shape mock-данных) без ADR / CR.
- Не менять схему БД без warning в отчёте.
- **Не использовать ORM во views** — только через `selectors` / `services`.
- Не добавлять зависимости (`requirements.in`, `package.json`) без согласования.
- Не коммитить `.env`, секреты, реальные фото в моки.
- **Не трогать `frontend-design/`** — это read-only reference.
- Не оставлять в репозитории: тестовые sqlite-файлы, `__pycache__`, `dist/`, vite-логи.

---

## 7. Структура документации

| Файл                                     | Назначение                                              | Кто правит |
|------------------------------------------|---------------------------------------------------------|------------|
| `AGENTS.md`                              | Этот файл.                                              | Architect  |
| `ai-docs/README.md`                      | Индекс и навигация.                                     | Architect  |
| `ai-docs/ARCHITECTURE.md`                | Backend apps, слои, стек.                               | Architect  |
| `ai-docs/FRONTEND_ARCHITECTURE.md`       | Frontend стек, структура, правила.                      | Architect  |
| `ai-docs/DATA_MODEL.md`                  | Сущности, поля, инварианты.                             | Architect  |
| `ai-docs/API_CONTRACT.md`                | REST endpoints.                                         | Architect  |
| `ai-docs/INTEGRATION_PLAN.md`            | Как фронт и бэк живут вместе (CORS, auth, env, deploy). | Architect  |
| `ai-docs/CONVENTIONS.md`                 | Backend код-стайл.                                      | Architect  |
| `ai-docs/ROADMAP.md`                     | Фазы проекта.                                           | Architect  |
| `ai-docs/DESIGN_BRIEF.md`                | Бриф для Claude Design (исходник прототипа).            | Architect  |
| `ai-docs/tasks/TEMPLATE.md`              | Шаблон задачи.                                          | Architect  |
| `ai-docs/tasks/BACKLOG.md`               | Очередь задач.                                          | Architect  |
| `ai-docs/tasks/IN_PROGRESS.md`           | Выданные задачи.                                        | Architect  |
| `ai-docs/tasks/DONE.md`                  | Лог закрытых задач.                                     | Architect  |
| `ai-docs/reports/TEMPLATE.md`            | Шаблон отчёта агента.                                   | Architect  |
| `ai-docs/reports/*.md`                   | Отчёты по задачам.                                      | Coder      |
| `ai-docs/decisions/ADR-*.md`             | Architecture Decision Records.                          | Architect  |
| `ai-docs/changes/TEMPLATE.md`            | Шаблон change request.                                  | Architect  |
| `ai-docs/changes/CR-*.md`                | Change requests.                                        | Architect  |
| `ai-docs/reviews/TEMPLATE.md`            | Шаблон review.                                          | Architect  |
| `ai-docs/reviews/*.md`                   | Review-отчёты.                                          | Reviewer   |
| `ai-docs/reviews/APPROVALS.md`           | Журнал approve / reject.                                | Reviewer   |
| `ai-docs/logs/CHANGELOG.md`              | Хронологический лог.                                    | Architect  |

---

## 8. Текущее состояние проекта

**Актуальная дата:** 2026-04-23.

**Фаза:** **Phase 1 MVP — CLOSED**. Следующая — Phase 2.

**Статистика выполнения (на 2026-04-30, конец дня):**

| Метрика                             | Значение |
|-------------------------------------|----------|
| Закрытых задач                      | ~108 (Phase 1 49 + Wave 5/6/7/8/9) |
| Backend tests passing               | 200+     |
| Frontend tests passing              | 15+      |
| Backend API endpoints               | ~70      |
| Frontend pages                      | 23 (Wave 9 добавил FinalizePlayedPage, AdminRegistrationsPage) |
| ADR принятых                        | 16 (ADR-0017 новый) |
| Change requests resolved / cancelled| 10 / 1   |
| Change requests open                | 0        |

**Phase 1 — CLOSED. Phase 2 — IN PROD на `got.craft-hookah.ru`. Wave 10 — UI polish после второго юзер-теста.**

**Что закрыто:**

✅ **Phase 1 MVP** (Waves 0-4): backend домен (8 apps, ~35 endpoints), frontend (18 страниц), CI, хостинг draft.

✅ **Wave 5 (Phase 2 hotfix/auth/rules):** secret word, login email/nick, password reset/change, GameMode rules, House decks → 2, русские validation messages, hotfixes avatars/mobile.

✅ **Wave 6 (Phase 2 ядро):** lifecycle расширен (planned/in_progress/completed), RoundSnapshot, SessionInvite, randomize/replace participant, finalize из последнего snapshot, timeline events (wildlings/clash/event_cards), chronicler в comments, frontend RoundTrackerPage.

✅ **Wave 7 (Phase 2 завершение):** action modals (wildlings/clash/event-cards/replace UI), timeline UI, notifications subsystem, search Cmd+K, fun facts, русификация, error pages.

✅ **Wave 8 (production hardening):** T-128 (real Westeros cards), T-129 (verify tests), I-005 (deploy на VPS owner с host-nginx), I-006 (Sentry), I-007 (Postgres backup), I-008 (healthcheck), I-009 (security headers).

✅ **Wave 9 (хотфиксы после первого прод-теста):** T-130 (RSVP NOT_GOING fix), T-131 (encoding fix + миграция 0008), T-132 (robust 500 handler), T-133 + F-202 (retroactive finalize), T-134 + F-203 (admin tab подтверждения регистраций). Параллельно — bugfix на 403 (IsPlayerUser) и UI status=in_progress.

**Что в Wave 10 (текущая, 17 задач):**

- 🔴 **Track A — главный rework:** ADR-0017 (UI roster = invites), T-140 (serializer + permissions), F-210 (MatchDetailPage rework: один список «Участники» вместо двух), F-211 (RSVP на главной).
- 🟡 **Track B — UI баги/polish:** T-150 (admin 500 на GameMode), T-151 + F-219 (TZ Asia/Yekaterinburg GMT+5), F-212 (клик по next match), F-213 (cancelled UI), F-214 («Колода: …»), F-215 (формат игроков `min-max` → `N`), F-216 (perm на edit/cancel/start), F-217 (текст hero), F-218 (default scheduled_at = now), F-220 (memo last mode/deck), F-221 (мобильные фильтры).
- 🔵 **Track C:** T-152 + F-222 (H2H autopick).
- 🟢 **Track D — Wave 9 carry-over:** T-160 (force_remove_participation), T-161 (votes lifecycle, blocked → ADR-0018), T-162 (verify pytest), T-163 (тесты finalize_played), F-204 (admin badge).

**Blocked / waiting:**
- T-161 (votes до finalize) — нужен ADR-0018 от architect.
- Phase 3 (Seasons, Achievements, Tournaments) — после Wave 10 closed и стабилизации в prod.

**Что ждёт после Wave 10:**
- Wave 11 — production observability (если что-то не дотянули в I-006..I-009).
- Phase 3 — Seasons (T-200), Achievements (T-201), Tournaments (T-202).

---

## 9. Глоссарий

- **Session / GameSession** — партия как событие (план или сыгранная).
- **Participation** — участие игрока в сессии (фракция, место, замки).
- **Outcome** — итог партии (раунды, причина окончания, MVP).
- **MatchVote** — оценка «корона/говно» от участника участнику в рамках партии. API: `positive` / `negative`.
- **MatchComment** — комментарий под партией, soft-delete.
- **AvatarAsset** — сгенерированный аватар пользователя (Pillow MVP или будущий AI).
- **Reference data** — справочники (Faction, GameMode, Deck).
- **Selector** — функция чтения данных без сайд-эффектов.
- **Service** — функция мутации данных в транзакции.
- **Mock data** — фикстуры в `frontend/src/mocks/`, shape совпадает с API-контрактом. Dev-only, не попадает в prod-бандл.
