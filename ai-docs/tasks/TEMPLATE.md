# Task Template

Скопируй эту секцию в `ai-docs/tasks/BACKLOG.md` и заполни.

---

## T-XXX: <короткое название>

**Status:** `backlog` | `in_progress` | `review` | `done` | `blocked`
**Assignee:** `architect` | `coder-agent` | `<имя>`
**Phase:** 0 / 1 / 2 / 3
**Depends on:** `T-YYY`, `T-ZZZ` (или `-`)

### Context

Зачем нужна задача. 2–4 предложения. Почему именно сейчас.

### Scope

Что входит в задачу. Буллеты.

- ...
- ...

### Out of scope

Что явно не делаем в этой задаче (чтобы не расползалось).

- ...

### Files to touch

Точный список файлов, которые можно создавать/редактировать. Если агент хочет выйти за рамки — блокер и вопрос в отчёт.

- `apps/games/models.py` (create)
- `apps/games/services.py` (edit)
- `apps/games/tests/test_services.py` (create)

### Acceptance criteria

Что должно выполниться, чтобы задача считалась сделанной. Формулировки проверяемые.

- [ ] Модель `X` создана с полями из `DATA_MODEL.md`.
- [ ] Миграция сгенерирована и применяется на чистой БД.
- [ ] Сервис `y(...)` покрыт тестами happy-path + 2 edge case.
- [ ] `ruff check` проходит.
- [ ] `pytest` проходит.

### References

Какие разделы docs агент обязан прочитать перед началом.

- `AGENTS.md` (целиком)
- `ai-docs/CONVENTIONS.md`
- `ai-docs/DATA_MODEL.md` раздел `<аппа>`
- `ai-docs/API_CONTRACT.md` раздел `<endpoint>`

### Notes

Любые уточнения, предупреждения, ссылки на ADR.

---
