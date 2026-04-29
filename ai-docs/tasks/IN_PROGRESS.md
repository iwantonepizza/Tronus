# IN PROGRESS

Задачи, выданные агентам. Каждая закрывается через approve в `APPROVALS.md`; только после этого агент берёт следующую.

---

## Волна 6 — 2026-04-29 — Phase 2 ядро: lifecycle + rounds + invitations

После закрытия Wave 5 (auth/hotfix/rules) разблокирован самый большой и важный слой Phase 2 — **домен партии в реальном времени**. Эта волна заводит расширенный lifecycle (`planned → in_progress → completed`), систему раундов (RoundSnapshot), приглашения и RSVP, и весь связанный frontend.

**Объём:** 14 задач, 4 параллельных трека. Около ~25-30 часов работы codex суммарно. Разбит так, чтобы можно было выдать в 2 партии ≈ 10 + 4.

**Стратегия:** треки A, B, C идут **последовательно по backend'у** (зависят друг от друга). Frontend трек D начинает после завершения соответствующих backend-задач.

---

### 🔵 Трек A — Session Lifecycle & Invitations (foundation)

Это фундамент. **Без него нельзя начать рисовать round-систему.**

- [ ] **T-100** — `start_session` service & API (расширенный lifecycle, ADR-0009)
  - agent: `backend-coder`
  - spec: `BACKLOG.md` → T-100
  - references: `ADR-0009-extended-session-lifecycle.md`, `ADR-0010` §round 0
  - report: `ai-docs/reports/YYYY-MM-DD-T-100.md`
  - **критическая задача**, всё остальное от неё зависит.

- [ ] **T-120** — Invitations & RSVP (ADR-0013)
  - agent: `backend-coder`
  - spec: `BACKLOG.md` → T-120
  - depends_on: T-100 (необходимо для start_session интеграции с invites)
  - references: `ADR-0013-invitations-rsvp.md`
  - report: `ai-docs/reports/YYYY-MM-DD-T-120.md`

- [ ] **T-121** — Random faction assignment
  - agent: `backend-coder`
  - spec: `BACKLOG.md` → T-121
  - depends_on: T-107 (done), T-120
  - report: `ai-docs/reports/YYYY-MM-DD-T-121.md`
  - **малая задача** (~1 час).

### 🟣 Трек B — Round system

После T-100. Это второй по важности слой — без раундов нет ни finalize, ни таймлайна.

- [ ] **T-101** — RoundSnapshot model + complete_round service (ADR-0010)
  - agent: `backend-coder`
  - spec: `BACKLOG.md` → T-101
  - depends_on: T-100
  - references: `ADR-0010-round-snapshots.md`
  - report: `ai-docs/reports/YYYY-MM-DD-T-101.md`

- [ ] **T-123** — Finalize redesign (CR-007): победитель из последнего RoundSnapshot
  - agent: `backend-coder`
  - spec: `BACKLOG.md` → T-123, `CR-007`
  - depends_on: T-101
  - references: `CR-007-finalize-from-rounds.md`
  - report: `ai-docs/reports/YYYY-MM-DD-T-123.md`

- [ ] **T-122** — Replace participant
  - agent: `backend-coder`
  - spec: `BACKLOG.md` → T-122
  - depends_on: T-101 (нужен `current_round` из последнего snapshot)
  - report: `ai-docs/reports/YYYY-MM-DD-T-122.md`

### 🟠 Трек C — Timeline events

После T-101. Тут же event_cards.py с захардкоженными карточками.

- [ ] **T-102** — Wildlings raid timeline event
  - agent: `backend-coder`
  - spec: `BACKLOG.md` → T-102
  - depends_on: T-101
  - references: `ADR-0014-match-timeline.md`
  - report: `ai-docs/reports/YYYY-MM-DD-T-102.md`

- [ ] **T-103** — Clash of Kings timeline event
  - agent: `backend-coder`
  - spec: `BACKLOG.md` → T-103
  - depends_on: T-102
  - report: `ai-docs/reports/YYYY-MM-DD-T-103.md`

- [ ] **T-104** — Event card played + WESTEROS_DECKS hardcoded
  - agent: `backend-coder`
  - spec: `BACKLOG.md` → T-104
  - depends_on: T-101
  - references: `ADR-0011-event-decks.md`
  - report: `ai-docs/reports/YYYY-MM-DD-T-104.md`

- [ ] **T-126** — Match timeline endpoint + chronicler в comments
  - agent: `backend-coder`
  - spec: `BACKLOG.md` → T-126
  - depends_on: T-102, T-103, T-104, T-122
  - references: `ADR-0014`
  - report: `ai-docs/reports/YYYY-MM-DD-T-126.md`

### 🟢 Трек D — Frontend для нового lifecycle

Frontend задачи начинают **только** после соответствующих backend. Можно делать параллельно с C, если backend C завершён.

- [ ] **F-110** — RSVP flow в Match detail
  - agent: `frontend-coder`
  - spec: `BACKLOG.md` → F-110
  - depends_on: T-120
  - report: `ai-docs/reports/YYYY-MM-DD-F-110.md`

- [ ] **F-111** — Match start wizard (planned → in_progress)
  - agent: `frontend-coder`
  - spec: `BACKLOG.md` → F-111
  - depends_on: T-100, T-121
  - report: `ai-docs/reports/YYYY-MM-DD-F-111.md`

- [ ] **F-112** — Round tracker UI (in_progress)
  - agent: `frontend-coder`
  - spec: `BACKLOG.md` → F-112
  - depends_on: T-101
  - **главный новый UI экран**. Большая задача (~6-8 часов).
  - report: `ai-docs/reports/YYYY-MM-DD-F-112.md`

- [ ] **F-118** — Finalize redesign UI (превращается в подтверждение)
  - agent: `frontend-coder`
  - spec: `BACKLOG.md` → F-118
  - depends_on: T-123
  - **малая задача**, ~2 часа.
  - report: `ai-docs/reports/YYYY-MM-DD-F-118.md`

---

## Что **НЕ** в этой волне

Откладывается на **Wave 7**, потому что иначе текущая волна не помещается в один codex-сеанс:

- **F-113** Wildlings raid action UI
- **F-114** Clash of Kings action UI
- **F-115** Event card played UI
- **F-116** Match timeline + chronicler hide
- **F-117** Replace participant UI
- **F-119** Fun facts модалка
- **T-130 / F-101** Notifications
- **T-131 / F-102** Search
- **T-132** Fun facts service
- **F-105** Russian translation pass (большая, отдельная волна)
- **F-106** Custom error pages
- **I-005..I-009** Production prep (ждёт решения по платформе)

---

## Граф зависимостей Wave 6

```
                           T-100 (lifecycle)
                           /              \
                          T-120 (invites)   T-101 (rounds)
                          /                  /  |  \
                       T-121 (random)    T-123  T-122  T-102 (wildlings)
                          |                       \    /
                       F-111 (start UI)            T-103 (clash)
                          |                            \
                       F-110 (RSVP UI)                 T-104 (event cards)
                                                            \
                                                          T-126 (timeline)
                                                              |
                                                          F-112 (round UI)
                                                              |
                                                          F-118 (finalize)
```

---

## Инструкция для агентов этой волны

**Перед началом — обязательно прочитать:**

1. `AGENTS.md` целиком (особенно раздел 5 Workflow и 6 Жёсткие правила).
2. `ai-docs/source/USER_FEEDBACK_ANALYSIS_2026-04-27.md` — общий контекст pivot.
3. `ai-docs/CONVENTIONS.md` (backend) или `ai-docs/FRONTEND_ARCHITECTURE.md` раздел 10 (frontend).
4. **Свою задачу** в `BACKLOG.md` целиком.
5. ADR/CR из references задачи.

**Правило:** одна задача → отчёт → стоп до approve. Если задача малая (≤30 минут) и явно завязана на следующую — можно сделать пару подряд, но **отдельные отчёты** обязательны.

**Frontend изменения внутри backend-задач** — в этой волне нет такой практики. Trek D отдельно от backend, потому что задачи фронта здесь крупные (особенно F-112).

**Блокеры пишем в `Open questions / blockers`** раздел отчёта. Не гадаем, но и не теряемся в мелочах — если из контекста ADR ответ очевиден, делаем по ADR.

**Особое внимание для Wave 6:**
- T-100 создаёт **initial RoundSnapshot (round 0)** — это часть ADR-0010, не забывать.
- T-101 — **immutable** snapshot, никаких PATCH endpoints.
- T-120 — `SessionInvite` отдельная модель, **не путать** с `Participation`.
- T-123 — победитель определяется **из последнего snapshot**, не из payload.
- F-112 — главный новый экран. Использовать `frontend-design/` как визуальный референс, плюс свободу в реализации round trackers (drag-and-drop influence tracks, supply/castles steppers, wildlings stepper). При сомнении — открыть Open question.

---

## Что разблокирует Wave 6

После закрытия Wave 6 разблокируется **Wave 7** — всё остальное Phase 2:

- Завершение frontend для timeline/wildlings/clash/event cards
- Notifications subsystem
- Search
- Fun facts
- Russian translation pass (F-105)
- Custom error pages (F-106)

Затем — Wave 8 (Production prep, требует решения owner по платформе) и Phase 3 (Seasons, Achievements, Tournaments).
