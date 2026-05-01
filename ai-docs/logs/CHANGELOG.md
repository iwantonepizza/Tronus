# Changelog

Хронологический журнал принятых изменений по проекту. Новое — в начало.

## Unreleased

### 2026-05-01 — Architect iteration 11 — Wave 11 hotfix pivot (production blockers)

После Wave 10 на проде вылезли блокеры третьего тестового цикла. Юзер не мог:
- Создать сессию обычным flow (получалась пустая, потому что `addParticipant` ронялся).
- Запустить партию (400 на `/start/` из-за orphan Participations, конфликт с unique constraint).
- Получить 405 на GET `/start/` — был 500 (MethodNotAllowed классифицировался как unhandled).
- Нажать «Под вопросом» в RSVP без предварительного «Я иду» (UI требовал invite).

**Принят ADR-0019:** при создании сессии создаются `SessionInvite` со статусом `maybe`, не `Participation`. Старый `addParticipant` flow в `CreateSessionPage`/`EditSessionPage` устарел и убирается. `Participation` появляется только в `start_session()`.

**Backend хотфиксы** (architect-applied прямо в коде):
- `MethodNotAllowed` явно ловится в `ErrorHandlingMixin` и возвращает честный 405 (`code: "method_not_allowed"`) — в `apps/games/views.py` и `apps/ratings/views.py`.
- `invite_user` и `self_invite` принимают `desired_faction` и `rsvp_status` (default-совместимые).
- `InviteUserSerializer` расширен; новый `SelfInviteSerializer`.
- `reset_password` принимает только `email` (не `login`/nickname) — security fix. `PasswordResetSerializer` использует `EmailField`.
- Новая management команда `cleanup_orphan_participations` для починки прод-данных от Wave 10.

**Wave 11 IN_PROGRESS выдана** — 9 задач:
- 4 backend (T-170, T-171, T-172, T-173) — agent дописывает тесты на architect-applied код.
- 5 frontend (F-230, F-231, F-232, F-233, F-213) — главные F-230 + F-231 разблокируют создание сессии и RSVP.
- 1 carry-over (T-160 force_remove_participation).

**Деплой инструкция в IN_PROGRESS.md** — `cleanup_orphan_participations --dry-run`, потом без флага.

### 2026-04-30 — Architect iteration 10 — Wave 10 outlined (UI rework + bug spree)

- Получен второй прод-фидбэк после реального теста на `got.craft-hookah.ru` — `ai-docs/source/USER_FEEDBACK_2026-04-30.md` (~20 пунктов).
- Architect разобрал в `USER_FEEDBACK_ANALYSIS_2026-04-30.md` — категоризация, приоритеты, мэппинг в задачи.
- **ADR-0017** принят: UI roster = SessionInvite во время `planned`, Participation только при `in_progress`/`completed`. Кнопка «Присоединиться» убирается, её заменяет «Я иду» в RSVP-блоке.
- Wave 10 выдана — 17 задач в 4 трека:
  - **Track A** (главный rework): T-140, F-210, F-211 — единый список «Участники = инвайты» в UI.
  - **Track B** (UI баги/polish): T-150 (admin 500 на GameMode), T-151 + F-219 (TZ Asia/Yekaterinburg), F-212..F-221 — десяток мелких UI правок.
  - **Track C**: T-152 + F-222 (H2H autopick).
  - **Track D** (Wave 9 carry-over): T-160 (force_remove_participation), T-161 (votes lifecycle, blocked → нужен ADR-0018), T-162 (verify pytest), T-163 (тесты finalize_played), F-204 (admin badge).
- Wave 8 + Wave 9 формально внесены в `DONE.md` и `APPROVALS.md` (codex закрывал их без формального approve в архитекторе).
- **Cleanup repo (повторно)**: повторно удалены мусорные дубли в `deploy/` — `deploy/AGENTS.md`, `deploy/backend/`, `deploy/frontend/`, `deploy/ai-docs/`, `deploy/deploy/`, `deploy/.github/`, `deploy/backup/`, `deploy/nginx/`. Codex продолжает генерировать их в каждом архиве (устойчивая проблема паковки).
- `deploy/README.md` восстановлен из правильной host-nginx версии (codex её потерял).

### 2026-04-30 — Wave 9 — Hotfixes по второму юзер-тесту + admin moderation

После второго реального теста на проде (got.craft-hookah.ru) пришёл фидбэк, который заблокировал запуск:

- **`backend/apps/games/services.py`** — баг `RsvpStatus.NOT_GOING` (атрибут не существует) ронял PATCH `/sessions/<id>/invites/<id>/` с 500 на любом RSVP-переходе. Заменён на `DECLINED`. Уведомления в `update_rsvp` и `invite_user` обёрнуты в `try/except`, чтобы не валить flow.
- **`backend/apps/reference/migrations/0004_game_mode_rules.py`** — переписан с правильным UTF-8: «Классика», «Пир воронов», «Танец с драконами», «Мать драконов» (раньше был cp1251→utf-8 мохибейк).
- **`backend/apps/reference/migrations/0008_fix_mode_names_encoding.py`** — новая идемпотентная data-миграция, чинит уже сохранённый на проде мохибейк. Безопасна на чистой БД (no-op).
- **`backend/apps/games/views.py` и `backend/apps/ratings/views.py`** — `ErrorHandlingMixin` теперь конвертирует любую необработанную ошибку в структурированный 500 с `code/exception_class/exception_message/trace_tail`. Слепых "Internal Server Error" больше не будет.

Новый функционал:

- **Ретроактивная партия (T-133/F-202):** `POST /api/v1/sessions/<id>/finalize-played/`, страница `frontend/src/pages/FinalizePlayedPage.tsx`. Поток "Только что сыграли" из CreateSessionPage теперь ведёт на новую страницу, проводит сессию `planned → completed` за один шаг с заполнением мест и замков вручную. Создаётся синтетический RoundSnapshot для совместимости с stats/fun_facts.
- **Admin moderation (T-134/F-203):** 3 endpoint (`GET/POST/POST /api/v1/admin/pending-users/...`), новая permission `IsAdminUser`, страница `/admin/registrations` с подтверждением через двойное нажатие. В сайдбаре виден только staff-юзерам через `adminOnly` флаг в `navigation.ts`. `PrivateUserSerializer` теперь экспонирует `is_staff`/`is_superuser`.

Что осталось на Wave 10: T-135 (force-remove participation), T-136 (votes до finalize — нужен ADR), T-137 (verify pytest suite), T-138 (тесты для finalize_played_session), F-204 (admin badge в TopBar), весь production-hardening блок (I-006..I-010).

### 2026-04-30 — Architect iteration 7 — Phase 2 closed, deploy pivoted to host-nginx

- **Phase 2 закрыта полностью.** Все 16+ задач Wave 7 приняты (T-119, T-127, T-130, T-131, T-132, F-101, F-102, F-105, F-106, F-108, F-113-F-119) + production deployment fixes.
- Codex проактивно устранил 8 критических проблем prod-стека (конфликт миграций, gunicorn dep, Dockerfile.prod, .env loading, и т.д.).
- **Architect pivot deployment под host-nginx сценарий** (юзер использует nginx вне контейнеров на собственном VPS):
  - `deploy/docker-compose.prod.yml` переписан: только `db` и `backend` в контейнерах, gunicorn слушает `127.0.0.1:8000`, статика/медиа bind-mount в `/var/www/tronus/`.
  - Создан `deploy/nginx-host/tronus.conf` — готовый конфиг для копирования.
  - Старый bundled-стек сохранён как fallback в `deploy/docker-compose.bundled.yml` + `deploy/nginx-bundled/`.
  - `deploy/README.md` полностью переписан с пошаговой инструкцией.
- **CR-010**: cleanup `.gitignore` — обнаружено, что `.gitignore` исключал `AGENTS.md` и `ai-docs/`, что фактически блокировало архитектурную документацию из git. Исправлено.
- Удалены мусорные дубли в `deploy/`: `deploy/AGENTS.md`, `deploy/ai-docs/`, `deploy/backend/`, `deploy/frontend/`, `deploy/frontend-design/`, `deploy/deploy/`, `deploy/.github/`, дубль `deploy/.gitignore`.
- `frontend/Dockerfile.prod` — поправлен путь к nginx config после переименования директории.
- Wave 8 (Phase 3 prep + production hardening) — выдана.

### 2026-04-30 — Architect iteration 6 — Wave 6 closed, Wave 7 outlined

- Batch-review Wave 6 (14 задач) — все приняты, 3 с комментариями.
- **Phase 2 backend домен закрыт полностью**: lifecycle (T-100), RoundSnapshot (T-101), invitations/RSVP (T-120), random factions (T-121), replace participant (T-122), finalize redesign (T-123), wildlings/clash/event-cards timeline (T-102/103/104), match timeline endpoint + chronicler (T-126).
- **Phase 2 frontend ядро закрыто**: RsvpBlock (F-110), MatchStartPage (F-111), RoundTrackerPage (F-112) — главный новый экран, FinalizeSessionPage redesign (F-118).
- CR-007 закрыт через T-123.
- Открыты CR-008 (дубль classes в models/views — T-127) и CR-009 (real Westeros card slugs, blocked owner — T-128).
- Wave 7 выдана: оставшиеся frontend модалки (wildlings, clash, event cards, replace, fun facts), notifications, search, custom error pages, технический долг.

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