# Agent Report Template

Имя файла: `ai-docs/reports/YYYY-MM-DD-T-XXX.md`.

---

# Report for T-XXX: <название задачи>

**Agent:** <n>
**Date:** YYYY-MM-DD
**Status:** `completed` | `blocked` | `partial`

---

## Summary

1–3 предложения: что сделано.

---

## Changes

Список изменённых файлов с короткой аннотацией.

- `apps/games/models.py` — добавлены модели `GameSession`, `Participation`, `Outcome`.
- `apps/games/migrations/0001_initial.py` — начальная миграция.
- `apps/games/tests/test_models.py` — тесты констрейнтов.

---

## Tests

- Добавлено тестов: N.
- Покрытие новых сервисов/селекторов: %.
- Команда запуска: `pytest apps/games/tests -v`.
- Все проходят: ✓ / ✗.

---

## Decisions made

Решения, принятые в процессе, которые выходят за рамки буквального описания задачи. Каждое обосновано.

- Использовал `CheckConstraint` вместо валидации в service для `mode.min_players ≤ participants`, потому что это enforce на уровне БД, надёжнее.
- ...

Если решения меняют архитектуру — **предложить ADR в этом разделе**, architect оформит.

---

## Deviations from task

Если что-то пришлось сделать не так, как написано в задаче.

- В `Files to touch` не был указан `apps/core/validators.py`, но пришлось добавить туда `validate_non_negative_int` — используется в двух моделях. Обосновал в отчёте, жду подтверждения.

Если отклонения нет — пиши `—`.

---

## Open questions / blockers

Вопросы к architect. Без них задача не закроется.

- Статус `in_progress` — нужен он или нет в `GameSession.status`? В `DATA_MODEL.md` упомянут как опциональный. Оставил без него до решения.
- ...

Если нет — пиши `—`.

---

## How to verify

Шаги для architect, чтобы проверить работу локально.

1. `git pull && make up`.
2. `make migrate`.
3. `make test` — всё зелёное.
4. `curl -X POST .../api/v1/sessions/ ...` — возвращает 201.

---

## Checklist (self-review)

- [ ] Тесты написаны и проходят.
- [ ] `ruff check` чистый.
- [ ] Миграции применяются на чистой БД.
- [ ] Нет ORM во views.
- [ ] Нет бизнес-логики в models/serializers.
- [ ] Публичный API соответствует `API_CONTRACT.md`.
- [ ] Отклонения от задачи описаны выше.
