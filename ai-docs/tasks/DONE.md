# DONE

Лог закрытых задач. Append-only. Новые — в начало.

---

## 2026-04-30 — Wave 7 — Phase 2 завершение (16 задач + production fixes)

Review: `ai-docs/reviews/2026-04-30-batch-wave7.md`. Все приняты.

### Frontend

### 2026-04-30 — F-119: Fun facts modal после finalize
- agent: claude-sonnet-4-6 — report: `ai-docs/reports/2026-04-30-wave7-complete.md` — **approved**

### 2026-04-30 — F-117: Replace participant UI
- agent: claude-sonnet-4-6 — report: `ai-docs/reports/2026-04-30-F-117.md` — **approved**

### 2026-04-30 — F-116: Match timeline component + chronicler hide toggle
- agent: claude-sonnet-4-6 — report: `ai-docs/reports/2026-04-30-F-116.md` — **approved**

### 2026-04-30 — F-115: Event card played UI в RoundTrackerPage
- agent: Codex — report: `ai-docs/reports/2026-04-30-F-115.md` — **approved**

### 2026-04-30 — F-114: Clash of Kings action UI
- agent: Codex — report: `ai-docs/reports/2026-04-30-F-114.md` — **approved**

### 2026-04-30 — F-113: Wildlings raid action UI
- agent: claude-sonnet-4-6 — report: `ai-docs/reports/2026-04-30-wave7-complete.md` — **approved**

### 2026-04-30 — F-108: Hide chronicler toggle в Settings
- agent: claude-sonnet-4-6 — report: `ai-docs/reports/2026-04-30-wave7-complete.md` — **approved**

### 2026-04-30 — F-106: Custom error pages (404, 500, 403, network)
- agent: claude-sonnet-4-6 — report: `ai-docs/reports/2026-04-30-wave7-complete.md` — **approved**

### 2026-04-30 — F-105: Russian translation pass
- agent: claude-sonnet-4-6 — report: `ai-docs/reports/2026-04-30-wave7-complete.md` — **approved**

### 2026-04-30 — F-102: Search command palette (Cmd+K)
- agent: claude-sonnet-4-6 — report: `ai-docs/reports/2026-04-30-wave7-complete.md` — **approved**

### 2026-04-30 — F-101: Notifications dropdown в TopBar
- agent: claude-sonnet-4-6 — report: `ai-docs/reports/2026-04-30-wave7-complete.md` — **approved**

### Backend

### 2026-04-30 — T-132: Fun facts service
- agent: claude-sonnet-4-6 — report: `ai-docs/reports/2026-04-30-wave7-complete.md` — **approved**

### 2026-04-30 — T-131: Search API
- agent: claude-sonnet-4-6 — report: `ai-docs/reports/2026-04-30-T-131.md` — **approved**

### 2026-04-30 — T-130: In-app notifications backend
- agent: claude-sonnet-4-6 — report: `ai-docs/reports/2026-04-30-T-130.md` — **approved**

### 2026-04-29 — T-127: CR-008 — cleanup duplicate classes
- agent: Codex — report: `ai-docs/reports/2026-04-29-T-127.md` — **approved**
- notes: изначально partial из-за конфликта миграций; конфликт устранён в production fixes

### 2026-04-29 — T-119: Stats endpoints учитывают только status=completed
- agent: Codex — report: `ai-docs/reports/2026-04-29-T-119.md` — **approved**
- notes: изначально partial; нашёл реальный дефект в overview.total_matches; исправлено + полный audit с тестами

### Production fixes (8 critical issues)

- agent: claude-sonnet-4-6 — report: `ai-docs/reports/2026-04-30-wave7-complete.md` — **approved_with_pivot**
- notes: устранены: конфликт миграций 0004*, comments/0002 link, gunicorn dependency, Dockerfile.prod вместо Dockerfile, ENTRYPOINT, .env conditional load, complete env example, nginx timeouts. Дополнительно architect сделал pivot на host-nginx сценарий — см. CR-010.

---

## 2026-04-30 — Wave 6 — Phase 2 ядро (14 задач)

Review: `ai-docs/reviews/2026-04-30-batch-wave6.md`. Все 14 — approved.

### Frontend (Track D)

### 2026-04-29 — F-118: FinalizeSessionPage redesign (CR-007)
- agent: Claude Sonnet 4.6 — report: `ai-docs/reports/2026-04-29-frontend-wave6-complete.md` — **approved**

### 2026-04-29 — F-112: RoundTrackerPage (главный новый экран)
- agent: Claude Sonnet 4.6 — report: `ai-docs/reports/2026-04-29-frontend-wave6-complete.md` — **approved**

### 2026-04-29 — F-111: MatchStartPage wizard (planned → in_progress)
- agent: Claude Sonnet 4.6 — report: `ai-docs/reports/2026-04-29-frontend-wave6-complete.md` — **approved**

### 2026-04-29 — F-110: RsvpBlock component в MatchDetailPage
- agent: Claude Sonnet 4.6 — report: `ai-docs/reports/2026-04-29-frontend-wave6-complete.md` — **approved**

### Backend Track C — Timeline events

### 2026-04-29 — T-126: Match timeline endpoint + chronicler в comments (ADR-0014)
- agent: Claude Sonnet 4.6 — report: `ai-docs/reports/2026-04-29-T-126.md` + `wave6-backend-complete.md` — **approved**

### 2026-04-29 — T-104: Event card played + WESTEROS_DECKS hardcoded (ADR-0011)
- agent: Claude Sonnet 4.6 — report: `ai-docs/reports/2026-04-29-T-104.md` — **approved_with_comments**
- notes: WESTEROS_DECKS slugs — placeholder, нужен реальный список от владельца → CR-009

### 2026-04-29 — T-103: Clash of Kings timeline event
- agent: Claude Sonnet 4.6 — report: `ai-docs/reports/2026-04-29-T-103.md` — **approved**

### 2026-04-29 — T-102: Wildlings raid timeline event
- agent: Claude Sonnet 4.6 — report: `ai-docs/reports/2026-04-29-T-102.md` — **approved**

### Backend Track B — Round system

### 2026-04-29 — T-122: Replace participant
- agent: Claude Sonnet 4.6 — report: `ai-docs/reports/2026-04-29-T-122.md` — **approved**

### 2026-04-29 — T-123: Finalize redesign (CR-007 → closed)
- agent: Claude Sonnet 4.6 — report: `ai-docs/reports/2026-04-29-T-123.md` — **approved_with_comments**
- notes: код работает, но дубликат `class SessionFinalizeView` в views.py → CR-008

### 2026-04-29 — T-101: RoundSnapshot complete_round + discard_last (ADR-0010)
- agent: Claude Sonnet 4.6 — report: `ai-docs/reports/2026-04-29-T-101.md` — **approved**

### Backend Track A — Lifecycle & Invitations

### 2026-04-29 — T-121: Random faction assignment
- agent: Claude Sonnet 4.6 — report: `ai-docs/reports/2026-04-29-T-121.md` — **approved**

### 2026-04-29 — T-120: Invitations & RSVP (ADR-0013)
- agent: Claude Sonnet 4.6 — report: `ai-docs/reports/2026-04-29-T-120.md` — **approved**

### 2026-04-29 — T-100: start_session service & API (lifecycle ADR-0009)
- agent: Claude Sonnet 4.6 — report: `ai-docs/reports/2026-04-29-T-100.md` — **approved_with_comments**
- notes: agent создал SessionInvite + RoundSnapshot модели сразу, что технически было scope T-120 и T-101, но это разумный pragmatic decision — модели нужны для start_session integration. Принято. Дубль `MatchTimelineEvent` оставлен в models.py → CR-008.

---

## 2026-04-29 — Wave 5 — Phase 2 первая партия (12 задач)

Review: `ai-docs/reviews/2026-04-29-batch-wave5.md`. Все 12 — approved.

### Track A — Hotfixes

### 2026-04-29 — F-104: Mobile viewport + iPhone safe-area
- agent: codex — report: `ai-docs/reports/2026-04-29-F-104.md` — **approved**

### 2026-04-29 — F-100: Match detail bugfixes (cancel + stubs)
- agent: codex — report: `ai-docs/reports/2026-04-29-F-100.md` — **approved**

### 2026-04-29 — T-114: Fix avatar URL (absolute + Vite /media proxy)
- agent: codex — report: `ai-docs/reports/2026-04-29-T-114.md` — **approved**

### Track B — Auth refactor

### 2026-04-29 — T-112: Change password (logged-in)
- agent: codex — report: `ai-docs/reports/2026-04-29-T-112.md` — **approved**

### 2026-04-29 — T-111: Password reset via secret word
- agent: codex — report: `ai-docs/reports/2026-04-29-T-111.md` — **approved**

### 2026-04-29 — T-110: Registration с secret word + повтор пароля + auto-active
- agent: codex — report: `ai-docs/reports/2026-04-29-T-110.md` — **approved**

### 2026-04-29 — T-113: Login by email **или** nickname
- agent: codex — report: `ai-docs/reports/2026-04-29-T-113.md` — **approved**

### Track C — Reference & rules pivot

### 2026-04-29 — T-118: Audit для удаления `expansion_a/b` (bonus)
- agent: codex — report: `ai-docs/reports/2026-04-29-T-118.md` — **approved**

### 2026-04-29 — T-115: Russian validation messages в backend
- agent: codex — report: `ai-docs/reports/2026-04-29-T-115.md` — **approved**

### 2026-04-29 — T-107: GameMode rules engine — `validate_session_setup`
- agent: codex — report: `ai-docs/reports/2026-04-29-T-107.md` — **approved**

### 2026-04-29 — T-106: House decks redesign (CR-006)
- agent: codex — report: `ai-docs/reports/2026-04-29-T-106.md` — **approved**

### 2026-04-29 — T-105: GameMode rules schema (ADR-0012)
- agent: codex — report: `ai-docs/reports/2026-04-29-T-105.md` — **approved_with_comments**
- notes: ArrayField требует Postgres — env-note, не архитектурная проблема. CI и dev-stack — Postgres, всё работает.

---

## 2026-04-27 — Wave 4 — Polish после Phase 1 (6 задач)

### 2026-04-27 — F-015: Animation polish pass
- agent: codex — report: `ai-docs/reports/2026-04-27-F-015.md` — **approved**

### 2026-04-27 — I-004: Frontend CI workflow
- agent: codex — report: `ai-docs/reports/2026-04-27-I-004.md` — **approved**

### 2026-04-27 — T-081: Gunicorn в production deploy stack
- agent: codex — report: `ai-docs/reports/2026-04-27-T-081.md` — **approved**

### 2026-04-27 — T-080: Унификация enum AvatarAsset.style
- agent: codex — report: `ai-docs/reports/2026-04-27-T-080.md` — **approved**

### 2026-04-24 — F-016: Accessibility audit pass
- agent: codex — report: `ai-docs/reports/2026-04-24-F-016.md` — **approved**

### 2026-04-24 — T-082: pytest-cov coverage gate
- agent: codex — report: `ai-docs/reports/2026-04-24-T-082.md` — **approved**

---

## 2026-04-23 — Batch wave 3 (29 задач)

Review: `ai-docs/reviews/2026-04-23-batch-wave3.md`
Reviewer: architect

### Frontend

### 2026-04-23 — F-011: my profile + avatar generator
- agent: codex — report: `ai-docs/reports/2026-04-23-F-011.md` — **approved**

### 2026-04-23 — F-010: connect sessions / comments / ratings API
- agent: codex — report: `ai-docs/reports/2026-04-23-F-010.md` — **approved**

### 2026-04-23 — F-009: connect stats API, drop mocks from prod
- agent: codex — report: `ai-docs/reports/2026-04-23-F-009.md` — **approved**

### 2026-04-23 — F-007: player profile + leaderboard + factions + H2H screens
- agent: codex — report: `ai-docs/reports/2026-04-23-F-007.md` — **approved**

### 2026-04-22 — F-008: create / edit / finalize session screens
- agent: codex — report: `ai-docs/reports/2026-04-22-F-008.md` — **approved**

### 2026-04-22 — F-006: matches list + detail screens
- agent: codex — report: `ai-docs/reports/2026-04-22-F-006.md` — **approved**

### 2026-04-22 — F-005: home page (on mocks)
- agent: codex — report: `ai-docs/reports/2026-04-22-F-005.md` — **approved**

### 2026-04-22 — F-004: UI atoms + domain components
- agent: codex — report: `ai-docs/reports/2026-04-22-F-004.md` — **approved**

### 2026-04-22 — F-003: AppShell + routing skeleton
- agent: codex — report: `ai-docs/reports/2026-04-22-F-003.md` — **approved**

### 2026-04-22 — F-002: API client + types + auth flow
- agent: codex — report: `ai-docs/reports/2026-04-22-F-002.md` — **approved**

### 2026-04-22 — F-001: Vite + React + TS + Tailwind bootstrap
- agent: codex — report: `ai-docs/reports/2026-04-22-F-001.md` — **approved**

### Integration

### 2026-04-23 — I-003: draft deploy configs (nginx + compose.prod)
- agent: codex — report: `ai-docs/reports/2026-04-23-I-003.md` — **approved_with_comments**
- notes: Runserver вместо gunicorn в prod-stack → см. T-081

### 2026-04-23 — I-002: end-to-end smoke test in dev
- agent: codex — report: `ai-docs/reports/2026-04-23-I-002.md` — **approved**
- notes: HTTP-level e2e через Vite proxy на живой Docker-бэк прошёл

### 2026-04-22 — I-001: CORS + CSRF + `/auth/csrf/` endpoint
- agent: codex — report: `ai-docs/reports/2026-04-22-I-001.md` — **approved**

### Backend — Change Requests

### 2026-04-22 — T-072: MEDIA_ROOT / MEDIA_URL settings (CR-004)
- agent: codex — report: `ai-docs/reports/2026-04-22-T-072.md` — **approved**

### 2026-04-22 — T-071: harden accounts register/login (CR-003)
- agent: codex — report: `ai-docs/reports/2026-04-22-T-071.md` — **approved**

### 2026-04-22 — T-070: faction colors + on_primary field (CR-001); CR-002 cancelled
- agent: codex — report: `ai-docs/reports/2026-04-22-T-070.md` — **approved**

### Backend — Phase 1 completion

### 2026-04-23 — T-060: admin tuning for owner
- agent: codex — report: `ai-docs/reports/2026-04-23-T-060.md` — **approved**

### 2026-04-23 — T-050: avatars — Pillow MVP generation
- agent: codex — report: `ai-docs/reports/2026-04-23-T-050.md` — **approved**
- notes: full backend suite 160 passing

### 2026-04-23 — T-044: stats head-to-head endpoint
- agent: codex — report: `ai-docs/reports/2026-04-23-T-044.md` — **approved**

### 2026-04-23 — T-043: stats leaderboard endpoint
- agent: codex — report: `ai-docs/reports/2026-04-23-T-043.md` — **approved**

### 2026-04-23 — T-042: stats overview endpoint
- agent: codex — report: `ai-docs/reports/2026-04-23-T-042.md` — **approved**

### 2026-04-23 — T-041: stats faction winrate endpoint
- agent: codex — report: `ai-docs/reports/2026-04-23-T-041.md` — **approved**

### 2026-04-23 — T-040: stats player profile endpoint
- agent: codex — report: `ai-docs/reports/2026-04-23-T-040.md` — **approved**

### 2026-04-22 — T-031: ratings — full vertical slice
- agent: codex — report: `ai-docs/reports/2026-04-22-T-031.md` — **approved**

### 2026-04-22 — T-030: comments — full vertical slice (soft-delete, cursor pagination)
- agent: codex — report: `ai-docs/reports/2026-04-22-T-030.md` — **approved**

### 2026-04-22 — T-025: games API endpoints
- agent: codex — report: `ai-docs/reports/2026-04-22-T-025.md` — **approved**

### 2026-04-22 — T-024: games selectors
- agent: codex — report: `ai-docs/reports/2026-04-22-T-024.md` — **approved**

### 2026-04-22 — T-023: games `cancel_session` service
- agent: codex — report: `ai-docs/reports/2026-04-22-T-023.md` — **approved**

---

## 2026-04-22 — Batch wave 2 (14 задач)

Review: `ai-docs/reviews/2026-04-22-batch-T001-T022.md`

## 2026-04-22 — T-022: games — `finalize_session` service
- agent: codex
- report: `ai-docs/reports/2026-04-22-T-022.md`
- reviewer: architect
- outcome: approved
- notes: service + тесты. Эталонная валидация (непрерывность мест, MVP, единый finalize).

## 2026-04-22 — T-021: games — planning services
- agent: codex
- report: `ai-docs/reports/2026-04-22-T-021.md`
- reviewer: architect
- outcome: approved
- notes: create_session / add_participant / remove_participant / update_planning с `select_for_update`.

## 2026-04-22 — T-020: games — модели
- agent: codex
- report: `ai-docs/reports/2026-04-22-T-020.md`
- reviewer: architect
- outcome: approved
- notes: 5 constraints на уровне БД (unique user/faction/place, single winner, winner=place 1).

## 2026-04-22 — T-015: accounts — admin approval action
- agent: codex
- report: `ai-docs/reports/2026-04-22-T-015.md`
- reviewer: architect
- outcome: approved
- notes: admin action + сигнал через `pre_save` для детектирования перехода `is_active False→True`.

## 2026-04-22 — T-014: accounts — публичные/приватные профили
- agent: codex
- report: `ai-docs/reports/2026-04-22-T-014.md`
- reviewer: architect
- outcome: approved

## 2026-04-22 — T-013: accounts — auth API
- agent: codex
- report: `ai-docs/reports/2026-04-22-T-013.md`
- reviewer: architect
- outcome: approved_with_comments
- change_requests: CR-003 (harden register_user + login)

## 2026-04-22 — T-012: accounts — Profile модель
- agent: codex
- report: `ai-docs/reports/2026-04-22-T-012.md`
- reviewer: architect
- outcome: approved

## 2026-04-22 — T-011: reference — admin + read-only API
- agent: codex
- report: `ai-docs/reports/2026-04-22-T-011.md`
- reviewer: architect
- outcome: approved

## 2026-04-22 — T-010: reference — модели и seed
- agent: codex
- report: `ai-docs/reports/2026-04-22-T-010.md`
- reviewer: architect
- outcome: approved_with_comments
- change_requests: CR-001 (цвета фракций), CR-002 (Tully — cancelled)

## 2026-04-22 — T-005: GitHub Actions CI
- agent: codex
- report: `ai-docs/reports/2026-04-22-T-005.md`
- reviewer: architect
- outcome: approved

## 2026-04-22 — T-004: pytest + factory_boy
- agent: codex
- report: `ai-docs/reports/2026-04-22-T-004.md`
- reviewer: architect
- outcome: approved

## 2026-04-22 — T-003: скелеты apps
- agent: codex
- report: `ai-docs/reports/2026-04-22-T-003.md`
- reviewer: architect
- outcome: approved

## 2026-04-21 — T-002: Docker Compose для dev
- agent: codex
- report: `ai-docs/reports/2026-04-21-T-002.md`
- reviewer: architect
- outcome: approved

## 2026-04-21 — T-001: инициализация Django-проекта
- agent: codex
- report: `ai-docs/reports/2026-04-21-T-001.md`
- reviewer: architect
- outcome: approved_with_comments
