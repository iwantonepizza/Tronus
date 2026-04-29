# Changelog

Хронологический журнал принятых изменений по проекту. Новое — в начало.

## Unreleased

### 2026-04-29 — Architect iteration 5 — Wave 5 closed, Wave 6 outlined

- Batch-review Wave 5 (12 задач) — все приняты, T-105 с environment-комментарием.
- Hotfixes Phase 2 устранены: avatar URL, mobile viewport, RSVP кнопки disabled-stub, cancel button рабочая.
- Auth полностью переработан: secret word + repeat password + auto-active (T-110), password reset через секрет (T-111), change password (T-112), login по email или нику (T-113).
- Reference layer переписан: `GameMode` с rule-fields (T-105), House decks → 2 варианта (T-106), `validate_session_setup` rules engine (T-107).
- Все backend validation messages — на русском (T-115), Django переведён в `ru-ru`.
- CR-006 закрыт через T-106.
- Bonus T-118: вычистил остатки `expansion_a/b` из тестов и фронта.
- Wave 6 выдана — фундамент Phase 2 round system: T-100 (lifecycle), T-101 (RoundSnapshot), T-120 (Invitations) + frontend двойник.

### 2026-04-27 — Architect iteration 4 — Phase 2 pivot

- Batch-review wave 4 (T-080, T-081, T-082, I-004, F-015, F-016) — все приняты, Phase 1 полностью закрыта.
- Получен большой user feedback после первого реального теста MVP (см. `ai-docs/source/USER_FEEDBACK_2026-04-27.md`).
- Создан анализ feedback с категоризацией: `ai-docs/source/USER_FEEDBACK_ANALYSIS_2026-04-27.md`.
- Открыты 7 архитектурных решений:
  - ADR-0009: расширенный lifecycle сессии (`planned → in_progress → completed`).
  - ADR-0010: модель `RoundSnapshot` для трекинга треков игры.
  - ADR-0011: event decks (Westeros) как захардкоженные карты.
  - ADR-0012: game mode rules engine с правилами доступности фракций по режимам.
  - ADR-0013: invitations & RSVP как отдельная модель `SessionInvite`.
  - ADR-0014: единый timeline для событий партии + chronicler в чате.
  - ADR-0015: русский язык, без i18n-библиотеки.
- Открыты 2 change request:
  - CR-006: redesign колод (House decks → 2 варианта; event decks отдельно).
  - CR-007: finalize_session выводит победителя из RoundSnapshot, не принимает руками.
- Полностью переписан `BACKLOG.md` под Phase 2 — 6 групп задач, ~30 новых tickets.
- Wave 5 выдана агентам — 11 задач в 3 параллельных трека (hotfixes, auth refactor, rules pivot).
- Чистка: удалён leftover `Tronus/`, кеш-папки, sqlite-файлы, vite-логи, dist.

### 2026-04-23 — Architect iteration 3

- Batch-review 29 задач wave 3 (T-023..T-072, I-001..I-003, F-001..F-011) — все приняты.
- CR-001, CR-003, CR-004, CR-005 закрыты их задачами. CR-002 явно отменён владельцем (8 фракций, без Tully).
- **Phase 1 MVP закрыта** — весь backend, frontend и dev-integration готовы.
- Чистка репозитория:
  - Удалены устаревшие дубли корня: `apps/`, `config/`, `tests/`, корневой `conftest.py`, `manage.py`, `docker-compose.yml`, `Dockerfile`, `Makefile`, `pyproject.toml`, `pytest.ini`, `requirements.*`.
  - Удалены 16 тестовых sqlite-файлов, vite-логи, `__pycache__`, `.pytest_cache`, `.ruff_cache`, `frontend/dist/`, `frontend/src/build/`.
  - `.env.example` перенесён в `backend/`, создан `frontend/.env.example`.
  - Единый `.gitignore` на корне монорепы.
- Документация синхронизирована с реальностью:
  - `FRONTEND_ARCHITECTURE.md` очищен от stale Tully-палитры.
  - `README.md` переписан под готовое состояние.
  - `AGENTS.md` раздел 8 отражает Phase 1 complete.
- Открыта **Phase 2 seed**: T-080..T-082 (polish), I-004 (frontend CI), T-100..T-102 (RSVP, Celery, AI avatars), T-200..T-201 (seasons, achievements), F-012..F-014 (UI для Phase 2).

### 2026-04-22..23 — Codex iteration 3

- Закрыт весь остаток Phase 1 в 29 задач: backend `games` API (T-023..T-025), `comments`/`ratings` (T-030/T-031), полный `stats` слой (T-040..T-044), `avatars` Pillow MVP (T-050), admin tuning (T-060), change requests (T-070..T-072).
- Integration: CORS/CSRF (I-001), end-to-end dev smoke (I-002), draft deploy (I-003).
- Frontend с нуля до production: Vite + React + TS + Tailwind, 18 страниц, 7 доменных компонентных папок, 11 API-модулей, 12 React Query хуков (F-001..F-011).
- 160 pytest passing (backend) + 15 vitest passing (frontend).

### 2026-04-22 — Architect iteration 2

- Проект переорганизован в монорепу: `backend/`, `frontend/`, `frontend-design/`.
- `AGENTS.md` и `ai-docs/` подняты на корень монорепы.
- Batch-review 14 задач (T-001..T-022). Все приняты, 5 замечаний вынесены в CR-001..CR-005.
- Добавлены документы `FRONTEND_ARCHITECTURE.md`, `INTEGRATION_PLAN.md`.
- Дизайн-прототип от Claude Design сохранён в `frontend-design/` как read-only референс.

### 2026-04-22 — Codex iteration 2

- Реализованы Phase 0 (T-001..T-005) и первая волна Phase 1 (T-010..T-015, T-020..T-022).
- 62 pytest passing.
- Документация перенесена из корня в `ai-docs/` — улучшение принято.

### 2026-04-21 — Architect iteration 1

- Создан скелет документации: AGENTS.md, ARCHITECTURE.md, DATA_MODEL.md, API_CONTRACT.md, CONVENTIONS.md, ROADMAP.md, DESIGN_BRIEF.md.
- ADR-0001..ADR-0007 приняты.
- BACKLOG наполнен задачами Phase 0 и Phase 1.
