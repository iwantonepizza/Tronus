# DONE

Лог закрытых задач. Append-only. Новые — в начало.

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
