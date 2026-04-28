# AI Docs

Вся документация проекта **Tronus** для работы Architect, Coder и Reviewer.

## Карта каталогов

### Архитектурные документы

- `AGENTS.md` (на корне монорепы) — контракт для всех агентов, читается первым.
- `ARCHITECTURE.md` — backend apps, слои, tech stack.
- `FRONTEND_ARCHITECTURE.md` — frontend стек, структура, правила.
- `DATA_MODEL.md` — сущности, поля, связи и инварианты.
- `API_CONTRACT.md` — REST endpoints и форматы запросов/ответов.
- `INTEGRATION_PLAN.md` — как фронт и бэк живут вместе (CORS, auth, env, deploy).
- `CONVENTIONS.md` — правила backend-кода, тестов и структуры приложений.
- `ROADMAP.md` — фазы проекта, что в MVP, что дальше.
- `DESIGN_BRIEF.md` — исходный бриф для Claude Design, reference для дизайн-системы.

### Рабочие каталоги

- `decisions/` — ADR и шаблон.
- `changes/` — change requests.
- `tasks/` — `BACKLOG.md`, `IN_PROGRESS.md`, `DONE.md`, шаблон.
- `reports/` — отчёты агентов (file-per-task).
- `reviews/` — review-файлы и `APPROVALS.md`.
- `logs/CHANGELOG.md` — хронологический лог принятых изменений.

## Базовый порядок чтения для агента

1. `AGENTS.md` (на корне)
2. `ai-docs/CONVENTIONS.md` (если backend-задача) либо `ai-docs/FRONTEND_ARCHITECTURE.md` раздел 10 (если frontend)
3. Назначенная задача в `ai-docs/tasks/IN_PROGRESS.md`
4. Ссылки из задачи: архитектура, модель данных, API, ADR, CR

## Текущее состояние

- **Фаза:** Phase 1 MVP закрыта, началась Phase 2 (сейчас — polish волна).
- **Закрыто задач:** 43 (T-001..T-072, I-001..I-003, F-001..F-011).
- **Backend tests:** 160 pytest passing.
- **Frontend tests:** 15 vitest passing.
- **Текущая волна:** T-080, T-081, I-004, F-015 — см. `ai-docs/tasks/IN_PROGRESS.md`.

Подробный статус — в `AGENTS.md` разделе 8 и в `ai-docs/tasks/DONE.md`.
