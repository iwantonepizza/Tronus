# ADR-0009: Расширенный lifecycle сессии (`in_progress`)

**Status:** accepted
**Date:** 2026-04-27
**Deciders:** architect, owner
**Supersedes:** часть ADR-0001 / DATA_MODEL для `GameSession.status`.
**Related:** USER_FEEDBACK 2026-04-27 §1.1, ADR-0010 (rounds), ADR-0013 (RSVP).

---

## Context

Текущий жизненный цикл `GameSession`:

```
planned ─(finalize)─▶ completed
   │
   └─(cancel)──────▶ cancelled
```

Юзер прямо жалуется: *«пишет что финализировать можно только planned, странно»*. Это симптом более глубокой проблемы — между «партия спланирована» и «партия закончилась» сейчас **ничего не происходит на бэкенде**, и поэтому feature-список из feedback (раунды, события, замены) вообще некуда повесить.

## Decision

Вводим явный третий статус `in_progress`:

```
planned ─(start_session)─▶ in_progress ─(finalize_session)─▶ completed
   │                            │
   └─(cancel_session)──────────┴──────────────▶ cancelled
```

**Семантика:**

| Status        | Что разрешено                                                                             |
|---------------|-------------------------------------------------------------------------------------------|
| `planned`     | RSVP, приглашения, замена `desired_faction`. Состав ещё не зафиксирован. Переход → `in_progress` через `start_session()`.|
| `in_progress` | Все timeline-события: раунды, нападения одичалых, битва королей, замены, розыгрыш карт. Переход → `completed` через `finalize_session()`. Можно `cancel_session()`. |
| `completed`   | Read-only по сессии и раундам. Голосование/комментарии открыты. Edit только админом. |
| `cancelled`   | Read-only, в статистику не идёт. Невозможны переходы дальше.                                |

**Ключевые сервисы:**

```python
# apps/games/services.py

def start_session(*, session: GameSession, factions_assignment: dict[int, str]) -> GameSession:
    """planned → in_progress."""
    # Валидируем что мин. кол-во участников по mode достигнуто
    # Применяем фракции из assignment (может быть результатом randomize_factions)
    # Создаём Participations из confirmed SessionInvites (RSVP=going)
    # Status → in_progress
    # Создаём начальный RoundSnapshot (round 0): supply=1, castles=начальные по фракции, wildlings=4

def finalize_session(*, session: GameSession, confirm: bool) -> GameSession:
    """in_progress → completed.
    Победитель выводится автоматически из последнего RoundSnapshot:
      - кандидаты = участники с castles == 7
      - если несколько — побеждает тот, кто выше на influence_throne
      - если ни у кого 7 замков — ValidationError, нельзя финализировать.
    Создаёт Outcome с автоматически рассчитанными places.
    """

def cancel_session(*, session: GameSession) -> GameSession:
    """planned | in_progress → cancelled. Существующие данные (RoundSnapshots, Comments) сохраняются для истории, но в статистику не идут."""
```

## Alternatives considered

| Вариант | Плюсы | Минусы | Почему не выбран |
|---------|-------|--------|------------------|
| Оставить только `planned/completed/cancelled`, всё in-game состояние класть в `Outcome` | Не нужно менять status enum | `Outcome` — сейчас финальный объект; превращать его в «текущее состояние» — двойная роль | Конфликтует с принципом immutable Outcome |
| Завести отдельную модель `SessionState` с состоянием игры | Чистое разделение «событие» и «прогресс» | Лишняя сущность; всё равно нужны 3 фазы у `GameSession` для семантики | Overengineering |
| Использовать `is_started: bool` рядом со `status` | Минимальное изменение схемы | Два поля для одного состояния, легко рассинхронить | Антипаттерн |

## Consequences

### Positive
- Чётко разделены три фазы. Каждое API понимает, в какой фазе оно вызывается.
- Семантика `finalize` упрощается: «зафиксировать финальный результат текущей игры», а не «преобразовать план в результат».
- Появляется естественное место для timeline-событий и round snapshots.

### Negative / Trade-offs
- Breaking change в `finalize_session` API (см. CR-007).
- Добавляется один лишний шаг для пользователя — нажать «Начать партию». В обмен на чёткость состояния.

### Migration
- Schema migration: `GameSession.Status` enum получает новое значение `IN_PROGRESS = "in_progress"`.
- Data migration не требуется — у нас нет prod данных.

## Revisit when

- Если в будущем понадобится «pause» (партия прервана и продолжается на следующий день) — добавим `paused` параллельно с `in_progress`.
