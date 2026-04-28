# IN PROGRESS

Задачи, выданные агентам. Каждая закрывается через approve в `APPROVALS.md`; только после этого агент берёт следующую из `BACKLOG.md`.

---

## Волна 4 — 2026-04-23 — Polish после Phase 1

Phase 1 закрыта. Эта волна — 4 небольшие задачи полировки, чтобы в Phase 2 войти с чистым состоянием. Задачи независимы, можно выдавать параллельно разным агентам (или одному по очереди).

### 🟢 Трек A — Backend polish

- [x] **T-080** — Унификация enum `AvatarAsset.style` (basic_frame vs basic)
  - agent: `backend-coder`
  - spec: `ai-docs/tasks/BACKLOG.md` → T-080
  - report: `ai-docs/reports/2026-04-27-T-080.md`
  - мелкая задача, ~10 минут.

- [x] **T-081** — Gunicorn в production deploy stack
  - agent: `backend-coder`
  - spec: `ai-docs/tasks/BACKLOG.md` → T-081
  - report: `ai-docs/reports/2026-04-27-T-081.md`

### 🟢 Трек B — CI / DevOps

- [x] **I-004** — Frontend CI workflow
  - agent: `integration-agent`
  - spec: `ai-docs/tasks/BACKLOG.md` → I-004
  - report: `ai-docs/reports/2026-04-27-I-004.md`

### 🟢 Трек C — Frontend polish

- [x] **F-015** — Animation polish pass
  - agent: `frontend-coder`
  - spec: `ai-docs/tasks/BACKLOG.md` → F-015
  - report: `ai-docs/reports/2026-04-27-F-015.md`
  - references: `ai-docs/DESIGN_BRIEF.md` раздел 9

---

## Инструкция для агентов этой волны

**Перед началом — прочитать:**

1. `AGENTS.md` целиком, раздел 5 (Workflow) и раздел 6 (Жёсткие правила).
2. `ai-docs/CONVENTIONS.md` (backend) или `ai-docs/FRONTEND_ARCHITECTURE.md` раздел 10 (frontend).
3. Свою задачу в `BACKLOG.md` — целиком.
4. Change request / ADR, на которые задача ссылается.

**Правило:** одна задача → отчёт → остановка. Архитектор ревьюит, потом следующая. Batch-режим (как в прошлые волны) был принят по факту, но **не является нормой**.

**Блокеры** пишем в `Open questions / blockers` раздел отчёта. Не гадаем.

**Отчёт** — по `ai-docs/reports/TEMPLATE.md`, кладём в `ai-docs/reports/YYYY-MM-DD-<TASK_ID>.md`.

---

## Дальнейшие зависимости

После закрытия текущей волны:

```
T-080 → unblocks nothing (cosmetic)
T-081 → unblocks I-005 (staging deploy)
I-004 → unblocks nothing (CI hygiene)
F-015 → unblocks F-016 (a11y audit)

Next waves:
  Wave 5: I-005 (staging deploy — требует архитектурного решения владельца),
          F-016 (a11y audit).
  Wave 6 (Phase 2): ADR-0008 (RSVP model) → T-100, F-012.
                    T-101 (Celery) → T-102 (AI avatars) → F-011 расширение.
  Wave 7 (Phase 3): T-200 (Seasons), T-201 (Achievements), F-013, F-014.
```

---

## Опциональные задачи (можно добавить в волну, если есть ресурс)

- **T-082** — pytest-cov coverage gate (низкий приоритет).
- **F-016** — accessibility audit (после F-015).
