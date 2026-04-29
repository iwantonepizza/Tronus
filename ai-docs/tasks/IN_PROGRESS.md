# IN PROGRESS

Задачи, выданные агентам. Каждая закрывается через approve в `APPROVALS.md`; только после этого агент берёт следующую.

---

## Волна 7 — 2026-04-30 — Phase 2 завершение

После Wave 6 backend домен партии **полностью закрыт**: lifecycle, раунды, инвайты, замены, timeline события — всё работает через API. Frontend имеет 4 главных новых экрана. Wave 7 закрывает Phase 2 целиком: оставшиеся модалки, notifications, search, русификация, error pages, технический долг.

**Объём:** 16 задач, 5 параллельных треков. Самая большая волна; рассчитываем на 2 codex-сеанса (≈10 + 6 задач).

---

### 🟠 Трек A — Action modals (frontend, на готовом backend)

Все backend для этих фич уже есть (Wave 6). Это чисто UI-модалки/wizard'ы поверх существующих API.

- [ ] **F-113** — Wildlings raid action modal
  - agent: `frontend-coder`
  - spec: `BACKLOG.md` → F-113
  - depends_on: T-102 (done)
  - report: `ai-docs/reports/YYYY-MM-DD-F-113.md`
  - **3-step wizard:** ставки → win/loss → карта-исхода. Submit → POST /timeline/wildlings-raid/.

- [ ] **F-114** — Clash of Kings action modal
  - agent: `frontend-coder`
  - spec: `BACKLOG.md` → F-114
  - depends_on: T-103 (done)
  - report: `ai-docs/reports/YYYY-MM-DD-F-114.md`
  - **3-step wizard:** ставки и места по каждому из 3 треков (throne, sword, court).

- [ ] **F-115** — Event card played UI в RoundTrackerPage
  - agent: `frontend-coder`
  - spec: `BACKLOG.md` → F-115
  - depends_on: T-104 (done), F-112 (done)
  - report: `ai-docs/reports/YYYY-MM-DD-F-115.md`
  - 3 (или 4) dropdown в форме раунда; запрос карт через `/api/v1/reference/event-decks/?mode=...`. Допустим пустой выбор.

- [ ] **F-117** — Replace participant UI
  - agent: `frontend-coder`
  - spec: `BACKLOG.md` → F-117
  - depends_on: T-122 (done)
  - report: `ai-docs/reports/YYYY-MM-DD-F-117.md`
  - Кнопка «Заменить игрока» в `MatchDetailPage` или `RoundTrackerPage` для in_progress sessions. Modal: select user (not in session) + confirm.

### 🟡 Трек B — Match timeline UI

- [ ] **F-116** — Match timeline component + chronicler hide toggle
  - agent: `frontend-coder`
  - spec: `BACKLOG.md` → F-116
  - depends_on: T-126 (done)
  - report: `ai-docs/reports/YYYY-MM-DD-F-116.md`
  - Хронология как лист карточек событий; иконки на kind. Drill-in на round → existing RoundDetail или новый RoundDetailModal.
  - Chronicler messages в comments — добавить filter toggle в шапке чата (localStorage `tronus.chat.hideChronicler`).

### 🔔 Трек C — Notifications subsystem (бэк + фронт)

- [ ] **T-130** — In-app notifications backend
  - agent: `backend-coder`
  - spec: `BACKLOG.md` → T-130
  - report: `ai-docs/reports/YYYY-MM-DD-T-130.md`
  - Модель `Notification(user, kind, payload, is_read, created_at)`. Сервисы create/mark_read. API `GET /notifications/`, `POST /notifications/<id>/read/`, `POST /notifications/read-all/`. Триггеры: invite received/accepted/declined.

- [ ] **F-101** — Notifications dropdown в TopBar
  - agent: `frontend-coder`
  - spec: `BACKLOG.md` → F-101
  - depends_on: T-130
  - report: `ai-docs/reports/YYYY-MM-DD-F-101.md`
  - Bell icon → dropdown с непрочитанными. Polling каждые 60s. Bell badge с числом unread.

### 🔍 Трек D — Search subsystem

- [ ] **T-131** — Search API
  - agent: `backend-coder`
  - spec: `BACKLOG.md` → T-131
  - report: `ai-docs/reports/YYYY-MM-DD-T-131.md`
  - `GET /api/v1/search/?q=...` — ищет по никам, planning_note сессий, slug фракций. Лимит 5 на каждый тип. Anonymous read OK (ADR-0005).

- [ ] **F-102** — Search command palette (Cmd+K)
  - agent: `frontend-coder`
  - spec: `BACKLOG.md` → F-102
  - depends_on: T-131
  - report: `ai-docs/reports/YYYY-MM-DD-F-102.md`
  - Modal со списком, hotkey Cmd+K / Ctrl+K, debounced fetch.

### 🎉 Трек E — Fun facts + Russian + Error pages + Tech debt

- [ ] **T-132** — Fun facts service
  - agent: `backend-coder`
  - spec: `BACKLOG.md` → T-132
  - depends_on: T-101 (done)
  - report: `ai-docs/reports/YYYY-MM-DD-T-132.md`
  - `apps/stats/selectors.py::session_fun_facts(session)` — 3-5 фактов: longest round, biggest comeback, no-supply winner, etc. В `Outcome` сериализатор добавить `fun_facts` поле.

- [ ] **F-119** — Fun facts модалка после finalize
  - agent: `frontend-coder`
  - spec: `BACKLOG.md` → F-119
  - depends_on: T-132
  - report: `ai-docs/reports/YYYY-MM-DD-F-119.md`
  - Показывается на FinalizeSessionPage после успешного submit (или при первом открытии завершённой сессии).

- [ ] **F-105** — Russian translation pass (BIG)
  - agent: `frontend-coder`
  - spec: `BACKLOG.md` → F-105
  - references: `ADR-0015`, `USER_FEEDBACK_ANALYSIS §4.6`
  - report: `ai-docs/reports/YYYY-MM-DD-F-105.md`
  - **Большая задача (~6 часов).** Пройти все .tsx файлы и заменить все английские строки на русские. Шрифт: Cinzel оставить только для латинских акцентов, основной кириллический — Spectral / PT Serif. Обновить tailwind.config.ts и globals.css.
  - Не вводить i18next — статичные русские строки.

- [ ] **F-106** — Custom error pages (404, 500, 403, network)
  - agent: `frontend-coder`
  - spec: `BACKLOG.md` → F-106
  - report: `ai-docs/reports/YYYY-MM-DD-F-106.md`
  - 4 страницы в стиле проекта (тёмные, fantasy palette).

- [ ] **F-108** — Hide chronicler toggle (settings)
  - agent: `frontend-coder`
  - spec: `BACKLOG.md` → F-108
  - depends_on: F-116
  - report: `ai-docs/reports/YYYY-MM-DD-F-108.md`
  - **малая задача**, ~30 минут. Если F-116 уже добавил inline-toggle — F-108 сводится к добавлению в Settings (если есть).

### 🧹 Трек F — Tech debt cleanup

- [ ] **T-127** — CR-008: cleanup duplicate classes в models/views
  - agent: `backend-coder`
  - spec: `BACKLOG.md` → T-127, `CR-008`
  - report: `ai-docs/reports/YYYY-MM-DD-T-127.md`
  - **малая задача, ~20 минут.** Удалить старые версии `MatchTimelineEvent` и `SessionFinalizeView`.

- [ ] **T-119 (mini)** — Stats endpoints учитывают только `status=completed`
  - agent: `backend-coder`
  - spec: `BACKLOG.md` → T-119
  - report: `ai-docs/reports/YYYY-MM-DD-T-119.md`
  - **малая задача.** Audit: все stats selectors фильтруют `session__status="completed"` (не `cancelled`, не `in_progress`).

---

## Не в этой волне (Phase 2 hard limit / blocked)

- **T-128** (CR-009 real Westeros card slugs) — **blocked**, ждёт список карт от владельца.
- **I-005..I-009** (Production prep) — ждёт решения владельца по платформе.
- **Phase 3** (Seasons, Achievements, Tournaments) — после полного закрытия Phase 2 и реального prod-теста.

---

## Граф зависимостей Wave 7

```
backend ready (Wave 6) ─┬─ F-113 (wildlings UI)
                         ├─ F-114 (clash UI)
                         ├─ F-115 (event cards UI)
                         ├─ F-116 (timeline + chronicler hide) ─ F-108
                         ├─ F-117 (replace UI)
                         └─ F-119 (fun facts UI) ── T-132 ── F-119

T-130 ── F-101 (notifications)
T-131 ── F-102 (search)

F-105 (russian)         ← independent, can be done anytime
F-106 (error pages)     ← independent
T-127 (CR-008 cleanup)  ← independent
T-119 (stats audit)     ← independent
```

---

## Стратегия выдачи

Wave 7 — **самая большая** (16 задач). Codex может закрыть её в 2 сеанса:

**Сессия 1 (~10 задач):**
- Backend: T-127, T-119, T-130, T-131, T-132 (5 backend, все средние или малые).
- Frontend: F-113, F-114, F-115, F-116, F-117 (action modals + timeline — связанная серия).

**Сессия 2 (~6 задач):**
- Frontend: F-101 (notif dropdown), F-102 (search palette), F-119 (fun facts modal), F-108 (hide chronicler).
- Frontend large: F-105 (russian translation pass).
- Frontend medium: F-106 (error pages).

Если codex осилит всё за один сеанс — пусть. В прошлых волнах он демонстрировал такую способность.

---

## Инструкция для агентов

**Перед началом — обязательно прочитать:**

1. `AGENTS.md` целиком (особенно раздел 5 Workflow и 6 Жёсткие правила).
2. `ai-docs/source/USER_FEEDBACK_ANALYSIS_2026-04-27.md` — общий контекст pivot.
3. `ai-docs/CONVENTIONS.md` (backend) или `ai-docs/FRONTEND_ARCHITECTURE.md` раздел 10 (frontend).
4. **Свою задачу** в `BACKLOG.md` целиком.
5. ADR/CR из references задачи.

**Правило:** одна задача → отчёт → стоп до approve. Если задача малая — можно сделать пару подряд, отдельные отчёты обязательны. Большие задачи (F-105, F-112-style) — отдельный отчёт.

**Frontend изменения внутри backend-задач** — в этой волне НЕТ такой практики. Trek A полностью frontend, Trek C/D parallel backend+frontend (в разных задачах).

**Блокеры пишем в `Open questions / blockers`** раздел отчёта. Не гадаем, но и не теряемся.

**Особое внимание для Wave 7:**

- **F-105** — БОЛЬШАЯ задача. Ожидаем full pass по всем .tsx файлам. Шрифт менять в `frontend/index.html` и `tailwind.config.ts`. Не путать с маркетинговыми экранами — у нас всё внутреннее.
- **F-101** — polling, не WebSocket (см. ADR-0006 для consistency с comments).
- **T-130 / T-131** — простые модели, без излишеств. Notifications: kind enum, payload JSON. Search: одна view, разбивает по типам.
- **CR-009 / T-128** — НЕ берём, blocked. Ждём список карт.
- **F-116** — chronicler messages показываются вместе с user comments в одном MatchComment list, отличаются `chronicler_event !== null`. Filter — клиентский, через localStorage.

---

## Что разблокирует Wave 7

После Wave 7 **Phase 2 закрыта полностью**. Следующая Wave 8:

- **I-005** — production deployment (требует решения owner: Fly.io / Railway / DO / VPS).
- **I-006** — Sentry / monitoring.
- **I-007** — Postgres backup.
- **T-128** (если придут реальные slugs карт от owner).

И затем — **Phase 3** (Gamification): Seasons, Achievements, Tournaments, push notifications.
