# IN PROGRESS

Задачи, выданные агентам. Каждая закрывается через approve в `APPROVALS.md`; только после этого агент берёт следующую.

---

## Волна 8 — 2026-04-30 — Production hardening + первые шаги Phase 3

**Phase 2 закрыта.** Wave 8 фокусируется на двух направлениях:

1. **Production hardening** (после реального деплоя на VPS юзера) — мониторинг, бэкапы, безопасность, мониторинг.
2. **Первые шаги Phase 3** (Gamification) — Seasons и Achievements, чтобы есть что показать после реального использования.

**Объём:** 12 задач. **Phase 3 задачи** идут вторым приоритетом, начинаются после production hardening.

---

### 🔴 Track A — Production hardening (приоритет, делать первыми)

- [ ] **T-128** — CR-009: replace placeholder Westeros card slugs
  - agent: `backend-coder`
  - **STATUS: blocked** — ждём список реальных карт от владельца.
  - spec: `BACKLOG.md` → T-128, `CR-009`
  - Если владелец принесёт список карт сейчас (до конца Wave 8) — задача станет первой и быстрой (~30 минут).

- [ ] **I-005** — Production deployment на VPS (host-nginx setup)
  - agent: owner (это developer ops, не code task)
  - **STATUS: ready, ждёт владельца**
  - spec: `deploy/README.md`
  - **Это инструкция, а не код-задача.** Architect (я) переписал deploy под сценарий с хост-nginx. Owner следует `deploy/README.md` шаги 1-6.
  - После успешного деплоя — owner подтверждает в чате, и я фиксирую I-005 как done.

- [ ] **I-006** — Sentry / error monitoring
  - agent: `backend-coder` + `frontend-coder` (один агент в двух частях)
  - spec: `BACKLOG.md` → I-006
  - report: `ai-docs/reports/YYYY-MM-DD-I-006.md`
  - Backend: `sentry-sdk[django]`, DSN в env, capture errors. Frontend: `@sentry/react`, init в `main.tsx`.
  - Free tier Sentry: 5K events/month — достаточно для closed-group.

- [ ] **I-007** — Postgres backup automation
  - agent: `integration-agent`
  - spec: `BACKLOG.md` → I-007
  - report: `ai-docs/reports/YYYY-MM-DD-I-007.md`
  - Cron на хосте, который запускает `pg_dump` через `docker compose exec` каждую ночь, ротация 7 дней. Простой shell-скрипт + systemd timer (или crontab).

- [ ] **I-008** — Healthcheck endpoint и monitoring
  - agent: `backend-coder`
  - spec: `BACKLOG.md` → I-008
  - report: `ai-docs/reports/YYYY-MM-DD-I-008.md`
  - `GET /api/v1/health/` — возвращает `{"status": "ok", "db": "ok"}` если БД доступна. Без auth, чтобы внешний uptime-monitor мог дёргать.

- [ ] **I-009** — Security headers + rate limiting hardening
  - agent: `backend-coder`
  - spec: `BACKLOG.md` → I-009
  - report: `ai-docs/reports/YYYY-MM-DD-I-009.md`
  - Заголовки `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Content-Security-Policy` (минимально для SPA). Settings в `config/settings/prod.py`. Также — глобальный rate-limit на API (sliding window).

### 🟡 Track B — Tech debt cleanup

- [ ] **T-129** — Verify полная test suite зелёная end-to-end
  - agent: `backend-coder`
  - spec: `BACKLOG.md` → T-129
  - report: `ai-docs/reports/YYYY-MM-DD-T-129.md`
  - Прогнать `pytest backend/` целиком на чистой Postgres базе. Все миграции 0001..0004 применяются. Все 200+ тестов зелёные. Если есть проблемы — fix.
  - Frontend: `npm test` зелёный.
  - **Малая задача (~1 час)**, но критическая после всех wave 6-7 манипуляций.

### 🟢 Track C — Phase 3 первые шаги (после production hardening)

- [ ] **T-200** — Seasons backend
  - agent: `backend-coder`
  - **Depends on: I-005..I-008 closed (production stable).**
  - spec: `BACKLOG.md` → T-200
  - report: `ai-docs/reports/YYYY-MM-DD-T-200.md`
  - Модель `Season(name, slug, start_at, end_at, is_current)`. Поле `session.season` опциональное (заполняется при finalize по `scheduled_at`). Селекторы stats с фильтром `season=`. API `/api/v1/seasons/`, `/api/v1/stats/seasons/<slug>/`.

- [ ] **T-201** — Achievements backend
  - agent: `backend-coder`
  - **Depends on: T-200**
  - spec: `BACKLOG.md` → T-201
  - report: `ai-docs/reports/YYYY-MM-DD-T-201.md`
  - **Architect pre-work: ADR-0016 — Achievement system (triggered vs scheduled).** Потом задача.
  - Минимальный набор ачивок: 10 (first_win, 5_wins, 10_games, win_streak_3, all_factions, ...).

- [ ] **F-200** — Seasons UI
  - agent: `frontend-coder`
  - **Depends on: T-200**
  - spec: `BACKLOG.md` → F-200 (был F-014)
  - report: `ai-docs/reports/YYYY-MM-DD-F-200.md`
  - Селектор сезона на главной/leaderboard, отфильтрованная статистика, чемпион сезона.

- [ ] **F-201** — Achievements page
  - agent: `frontend-coder`
  - **Depends on: T-201**
  - spec: `BACKLOG.md` → F-201 (был F-013)
  - report: `ai-docs/reports/YYYY-MM-DD-F-201.md`
  - Grid карточек ачивок с прогрессом. Полученные / не полученные. По дизайну — экран 7.20 из `DESIGN_BRIEF.md`.

---

## Что НЕ в этой волне (ждёт)

- **Tournaments (T-202)** — Phase 3, после реального использования Seasons.
- **Push / Telegram уведомления (T-111-future)** — Phase 3+.
- **«Легендарные матчи» (F-017)** — Phase 3+.

---

## Граф зависимостей Wave 8

```
T-128 (Westeros cards) — blocked owner

I-005 (deploy) — owner action
   │
   ├──▶ I-006 (Sentry)
   ├──▶ I-007 (backup)
   ├──▶ I-008 (healthcheck)
   └──▶ I-009 (security)

T-129 (test suite verify) — independent

После всех I-* зелёные:
   T-200 (Seasons backend) ── F-200 (Seasons UI)
       └──▶ T-201 (Achievements backend) ── F-201 (Achievements UI)
```

---

## Стратегия выдачи

**Сессия 1 (production hardening, ~5 задач):**
- T-129 (verify tests)
- I-006 (Sentry)
- I-007 (backups)
- I-008 (healthcheck)
- I-009 (security headers + rate limit)

**Сессия 2 (Phase 3 первые, ~4 задачи):**
- ADR-0016 от architect (асинхронно)
- T-200 (Seasons)
- T-201 (Achievements)
- F-200, F-201 (UI)

**Owner-side:**
- I-005 — деплой на VPS по `deploy/README.md`. Подтвердит когда поднимет.
- T-128 — список карт.

---

## Инструкция для агентов

**Перед началом — обязательно прочитать:**

1. `AGENTS.md` целиком.
2. `ai-docs/source/USER_FEEDBACK_ANALYSIS_2026-04-27.md` — общий контекст pivot.
3. `ai-docs/CONVENTIONS.md` (backend) или `ai-docs/FRONTEND_ARCHITECTURE.md` раздел 10 (frontend).
4. `deploy/README.md` — для I-005..I-009 это критически важно.
5. **Свою задачу** в `BACKLOG.md` целиком.
6. ADR/CR из references задачи.

**Правило:** одна задача → отчёт → стоп до approve.

**Особое внимание для Wave 8:**

- **I-005** — это **owner action**, агент НЕ должен это делать. Architect (я) уже сделал всю подготовку (compose, nginx config, README). Owner следует инструкции вручную.
- **I-006 / I-007 / I-008 / I-009** — настоящие задачи для агента. Backend изменения, env vars, минимально инвазивно.
- **T-129** — НЕ открывать новые тесты. Просто запустить, найти что красное, исправить.
- **T-200 / T-201** — крупные задачи Phase 3. Делать после production-hardening, чтобы не размыть фокус.

**Блокеры пишем в `Open questions / blockers`** раздел отчёта.
