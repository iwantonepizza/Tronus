# Approvals Log

Журнал решений по review и change requests. Новые записи — в начало.

---

## 2026-04-29 — Wave 5 — Phase 2 первая партия (12 задач)

- decision: `approved` (11) и `approved_with_comments` (1: T-105)
- reviewer: architect
- source: `ai-docs/reviews/2026-04-29-batch-wave5.md`
- notes: agent `codex` закрыл всю Wave 5 + bonus T-118. Hotfixes устранены, auth полностью переработан, reference layer переписан под новые правила игры. Замечание по T-105 — environment-only (Postgres-зависимый ArrayField), не блокирует. Wave 6 разблокирована: lifecycle, round system, invitations.
- CR-006 (decks redesign) → закрыт через T-106. Помечен как resolved.

---

## 2026-04-27 — Wave 4 — Phase 1 polish (6 задач)

- decision: `approved`
- reviewer: architect
- source: `ai-docs/tasks/DONE.md` (per-task entries)
- notes: T-080, T-081, T-082, I-004, F-015, F-016 — все приняты. Phase 1 на 100% завершена. Тесты зелёные. После этого — большой user feedback и pivot в Phase 2.

---

## 2026-04-27 — User feedback 2026-04-27 → ADR series + CRs

После реального теста MVP владелец прислал большой feedback (см. `ai-docs/source/USER_FEEDBACK_2026-04-27.md` и `USER_FEEDBACK_ANALYSIS_2026-04-27.md`). Открыты:
- ADR-0009 (extended lifecycle), accepted by architect.
- ADR-0010 (round snapshots), accepted.
- ADR-0011 (event decks), accepted.
- ADR-0012 (game mode rules), accepted.
- ADR-0013 (invitations & RSVP), accepted.
- ADR-0014 (timeline events), accepted.
- ADR-0015 (russian localization), accepted.
- CR-006 (decks redesign) — open, → T-106.
- CR-007 (finalize from rounds) — open, → T-123.

---

## 2026-04-23 — Batch wave 3 (29 задач)

- decision: `approved` и `approved_with_comments`
- reviewer: architect
- source: `ai-docs/reviews/2026-04-23-batch-wave3.md`
- notes: agent `codex` закрыл весь остаток Phase 1 — backend (T-023..T-072, 15 задач), frontend (F-001..F-011, 11 задач) и integration (I-001, I-002, I-003). Повторение паттерна "batch без промежуточных review", но качество соответствует планке: 160 pytest passing на бэке, 15 vitest passing на фронте, end-to-end smoke подтверждён. Точечные замечания не блокируют — оформлены как T-080..T-082, I-004 в BACKLOG.

Decision-таблица — в review-файле выше.

---

## 2026-04-23 — CR-001: sync faction colors → closed
- decision: `closed`
- resolved_by: T-070
- source: `ai-docs/changes/CR-001-sync-faction-colors.md`

## 2026-04-22 — CR-002: add Tully faction → cancelled
- decision: `cancelled`
- rationale: владелец проекта подтвердил 8 фракций без Tully
- source: `ai-docs/changes/CR-002-add-tully-faction.md`

## 2026-04-23 — CR-003: harden accounts register/login → closed
- decision: `closed`
- resolved_by: T-071
- source: `ai-docs/changes/CR-003-harden-accounts-register.md`

## 2026-04-23 — CR-004: MEDIA settings → closed
- decision: `closed`
- resolved_by: T-072
- source: `ai-docs/changes/CR-004-media-settings.md`

## 2026-04-23 — CR-005: CORS + CSRF → closed
- decision: `closed`
- resolved_by: I-001
- source: `ai-docs/changes/CR-005-cors-csrf-frontend.md`

---

## 2026-04-22 — Batch T-001 … T-022 (14 задач)
- decision: `approved` и `approved_with_comments`
- reviewer: architect
- source: `ai-docs/reviews/2026-04-22-batch-T001-T022.md`
- notes: Agent `codex` выполнил 14 задач подряд без промежуточных review. Все приняты в batch; выявлено 5 замечаний архитектурного уровня, вынесены в CR-001..CR-005.

| Task | Decision | CR |
|------|----------|-----|
| T-001 | approved_with_comments | — (CR-004, CR-005 — не scope) |
| T-002 | approved | — |
| T-003 | approved | — |
| T-004 | approved | — |
| T-005 | approved | — |
| T-010 | approved_with_comments | CR-001, CR-002 |
| T-011 | approved | — |
| T-012 | approved | — |
| T-013 | approved_with_comments | CR-003 |
| T-014 | approved | — |
| T-015 | approved | — |
| T-020 | approved | — |
| T-021 | approved | — |
| T-022 | approved | — |
