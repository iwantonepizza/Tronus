# CR-007: Finalize redesign — победитель из RoundSnapshot, не из payload

**Status:** closed
**Closed:** 2026-04-30
**Resolved by:** T-123
**Created:** 2026-04-27
**Author:** architect
**Related:** T-022 (closed), ADR-0009, ADR-0010, USER_FEEDBACK §3.6.

---

## Проблема

Текущий `finalize_session(session, places=[(participation_id, place), ...])` принимает места **руками от админа**. Это противоречит правилам игры:

1. Победитель — кто первым набрал 7 замков. Это видно по последнему RoundSnapshot, не нужно вводить.
2. При нескольких игроках с 7 замками — определяется треком трона. Это снова из RoundSnapshot.
3. Места `2..N` тоже выводимы: `castles desc, then influence_throne position`.

Юзер прямо: *«если игра окончена можно нажать кнопку закончить игру, только инфа по победителю идет из последнего результата раунда, то есть там должен быть победитель с 7 замками, иначе разворот»*.

## Решение

Меняем сигнатуру:

```python
# До
def finalize_session(*, session, places: list[tuple[int, int]], ...) -> Outcome:

# После
def finalize_session(*, session: GameSession, final_note: str = "", mvp: User | None = None) -> Outcome:
    """
    1. Берёт последний RoundSnapshot.
    2. Кандидаты на 1-е место = participations с castles == 7.
       Если их 0 → ValidationError("no_winner_yet"). Нельзя финализировать.
       Если 1 → он победитель.
       Если несколько → побеждает тот, кто выше на influence_throne.
    3. Остальные места: sort by (-castles, throne_position).
    4. Создаёт Outcome.
    5. session.status = COMPLETED.
    """
```

Соответственно — это **breaking change для T-022**, поэтому открываем CR-007.

## Impact на файлы

- `backend/apps/games/services.py::finalize_session` — переписать.
- `backend/apps/games/serializers.py::FinalizeSessionSerializer` — упростить (только `final_note`, `mvp_id`).
- `backend/apps/games/tests/test_services.py` — переписать тесты finalize.
- `backend/apps/games/views.py::SessionFinalizeView` — обновить endpoint.
- `frontend/src/api/sessions.ts::finalizeSession` — payload меняется.
- `frontend/src/pages/FinalizeSessionPage.tsx` — превращается в **подтверждение** (не ввод мест).

## API change

```
POST /api/v1/sessions/<id>/finalize/

before:
  {"places": [{"participation_id": 7, "place": 1}, ...], "rounds_played": 8, "end_reason": "castles_7", "mvp": ..., "final_note": ""}

after:
  {"mvp_id": 5, "final_note": "GG"}
  → 200 OK with computed outcome
  → 400 {"error": {"code": "no_winner_yet", ...}} if no participation has 7 castles
```

## Acceptance

- [ ] Невозможно finalize, если в последнем раунде нет castles=7 → ошибка.
- [ ] Несколько с castles=7: побеждает выше по trone.
- [ ] Frontend показывает превью результата перед нажатием «Закончить».

## Порождает задачу

**T-123** в BACKLOG (часть Phase 2 round-domain).
