# CR-008: Cleanup дубликатов в `apps/games/{models,views}.py`

**Status:** open
**Created:** 2026-04-30
**Author:** architect
**Related:** T-100, T-123, T-126.

---

## Проблема

При работе над Wave 6 agent оставил два дубликата классов:

### 1. `class MatchTimelineEvent` дважды в `apps/games/models.py`

- **Строки 262–300** — первое определение, `happened_at = DateTimeField(auto_now_add=True)`.
- **Строки 303–341** — второе определение, `happened_at = DateTimeField(default=timezone.now)`.

Python использует **последнее** определение, поэтому действующая модель — вторая (mutable timestamp). Это работает, но:
- Любой автогенератор миграций может запутаться.
- Будущий agent, читая файл сверху, делает неверные предположения.
- Различие в `auto_now_add` vs `default` не задокументировано.

### 2. `class SessionFinalizeView` дважды в `apps/games/views.py`

- **Строка 276** — старое определение (до CR-007).
- **Строка 582** — новое определение (после CR-007 редизайна).

Действует второе (так как `urls.py` импортирует именно последнее, или Python берёт более позднюю привязку имени).

## Решение

**Удалить первые определения**, оставить только финальные (которые соответствуют ADR-0014 и CR-007 соответственно).

**Для `MatchTimelineEvent`:** проверить, что **активное** поведение (`happened_at = default=timezone.now`) — то, которое мы хотим. Если да — удалить первое определение со всем содержимым (строки 262–300, включая пустую строку до). Если первое определение задумано (immutable timestamp) — обсудить и оставить именно его.

→ **Рекомендация: оставить второе** (mutable). Зачем — `chronicler_event` создаётся в сервисе и `happened_at` редко нужен с точностью «момент создания записи в БД». Будущая поддержка backdate-переноса событий проще с `default=now`.

**Для `SessionFinalizeView`:** удалить первое определение (старая логика с `participations` payload). Оставить только финальное (новая логика, читает из RoundSnapshot).

## Impact на файлы

- `backend/apps/games/models.py` — удалить строки 262–301 (включая пустую разделительную).
- `backend/apps/games/views.py` — удалить класс `SessionFinalizeView` около строки 276 (старый). Оставить только тот, что реализует CR-007.
- `backend/apps/games/tests/` — все тесты после `Cleanup` — должны продолжать работать.
- Никаких миграций не требуется (модель не меняется, последнее определение = действующее).

## Acceptance

- [ ] `grep -c "class MatchTimelineEvent" backend/apps/games/models.py` → 1.
- [ ] `grep -c "class SessionFinalizeView" backend/apps/games/views.py` → 1.
- [ ] Все существующие тесты продолжают работать (нет regressions).
- [ ] `python manage.py makemigrations --dry-run apps.games` → No changes detected.

## Порождает задачу

**T-127** в BACKLOG.
