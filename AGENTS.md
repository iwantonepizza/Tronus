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

**Статистика выполнения (на 2026-04-30):**

| Метрика                             | Значение |
|-------------------------------------|----------|
| Закрытых задач                      | 91       |
| Backend tests passing               | 200+     |
| Frontend tests passing              | 15+      |
| Backend API endpoints               | ~62      |
| Frontend pages                      | 21       |
| ADR принятых                        | 15       |
| Change requests resolved / cancelled| 9 / 1    |
| Change requests open                | 1 (CR-009 — blocked owner) |

**Phase 1 — CLOSED. Phase 2 — CLOSED. Wave 8 — Production hardening + Phase 3 prep.**

**Что сделано в Phase 2:**

✅ **Wave 5 — auth/hotfix/rules pivot:** secret word, login email/nick, password reset/change, GameMode rules, House decks → 2, русские validation messages, hotfixes avatars/mobile.

✅ **Wave 6 — Phase 2 ядро:** lifecycle расширен (planned/in_progress/completed), RoundSnapshot, SessionInvite, randomize/replace participant, finalize из последнего snapshot, timeline events (wildlings/clash/event_cards), chronicler в comments, frontend RoundTrackerPage.

✅ **Wave 7 — Phase 2 завершение:** action modals (wildlings/clash/event-cards/replace UI), timeline UI, notifications subsystem, search Cmd+K, fun facts, русификация, error pages, hide chronicler, технический долг (T-119, T-127). Plus 8 production deployment fixes от codex.

**Architect iteration 7 дополнительно:**
- **Pivot deploy под host-nginx** (сценарий юзера с собственным nginx вне контейнеров): `deploy/docker-compose.prod.yml` без frontend-контейнера, gunicorn на `127.0.0.1:8000`, статика/медиа bind-mount в `/var/www/tronus/`. Готовый конфиг хост-nginx в `deploy/nginx-host/tronus.conf`. Старый bundled-вариант сохранён как fallback.
- **CR-010**: критичная находка — `.gitignore` исключал `AGENTS.md` и `ai-docs/`, что блокировало архитектурную документацию из git. Также удалены мусорные дубли в `deploy/` (полные зеркала проекта во вложенных директориях).

**Что в Wave 8 (текущая, 12 задач):**
- 🔴 Production hardening: I-005 (deploy на VPS — owner action, готова инструкция), I-006 (Sentry), I-007 (Postgres backup), I-008 (healthcheck), I-009 (security headers + rate limit), I-010 (dependabot).
- 🟡 Tech debt: T-129 (verify полный test suite зелёный после wave 6/7).
- 🟢 Phase 3 первые шаги (после production stable): T-200 (Seasons backend), T-201 (Achievements backend), F-200 (Seasons UI), F-201 (Achievements UI). ADR-0016 от architect.

**Blocked / waiting owner:**
- CR-009 / T-128 — реальные slugs Westeros карт (placeholder сейчас).
- I-005 — нужна реализация на стороне owner: `deploy/README.md` пошаговая инструкция готова.
- ADR-0016 (Achievements engine) — architect создаст когда дойдём.

**Что ждёт после Wave 8:**
- Wave 9 — Phase 3 расширение: Tournaments (T-202), F-201 polish, push notifications, легендарные матчи.

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
