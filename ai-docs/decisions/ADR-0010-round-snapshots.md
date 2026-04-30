# ADR-0010: Round Snapshots — модель прогресса игры

**Status:** accepted
**Date:** 2026-04-27
**Deciders:** architect
**Related:** ADR-0009, USER_FEEDBACK 2026-04-27 §1.2.

---

## Context

Юзер описал детально, какие игровые трекеры должны фиксироваться по окончании каждого раунда:

- **3 трека власти** (Iron Throne, Sword/Fiefdoms, King's Court) — упорядоченные списки игроков (1-е, 2-е, 3-е, ...).
- **Supply track** — `supply: 0..6`, на одной отметке может быть несколько игроков.
- **Castles track** — `castles: 0..7`, 0 — красная зона, 7 — победа.
- **Wildlings threat** — фиксированные 7 позиций `0/2/4/6/8/10/12`, старт 4.

После каждого раунда (но не более 10 раундов; в Feast for Crows и Dance with Dragons — 7) фиксируется **снимок** этих треков. По нажатию кнопки админом (или, опционально, всеми участниками отдельно) — снимок становится финальным, начинается следующий раунд.

История раундов и переход в раунд должны быть просматриваемы из `MatchDetailPage`.

## Decision

Заводим **одну immutable модель `RoundSnapshot`**, хранящую полное состояние игры на момент окончания раунда:

```python
class RoundSnapshot(TimestampedModel):
    session = FK(GameSession, related_name="round_snapshots")
    round_number = PositiveSmallIntegerField()  # 0..10
    influence_throne = JSONField()  # ordered list of participation_ids (top-first)
    influence_sword  = JSONField()
    influence_court  = JSONField()
    supply  = JSONField()           # {participation_id: 0..6}
    castles = JSONField()           # {participation_id: 0..7}
    wildlings_threat = PositiveSmallIntegerField()  # one of 0,2,4,6,8,10,12
    note = TextField(blank=True)    # optional admin comment

    class Meta:
        unique_together = [("session", "round_number")]
        ordering = ["round_number"]
        constraints = [
            CheckConstraint(
                check=Q(wildlings_threat__in=[0,2,4,6,8,10,12]),
                name="games_round_snapshot_wildlings_valid",
            ),
            CheckConstraint(
                check=Q(round_number__gte=0) & Q(round_number__lte=10),
                name="games_round_snapshot_number_range",
            ),
        ]
```

**Особенности:**

1. **Round 0 (initial snapshot)** создаётся при `start_session()`. Содержит начальное состояние:
   - Все игроки на 1 supply (или по правилам стартового положения).
   - Castles = стартовые замки фракции.
   - `wildlings_threat = 4`.
   - `influence_*` = инициализированные согласно стартовому раскладу.
   Это упрощает sequence — `last_round = max(round_number)` всегда есть.

2. **Round N** создаётся через `complete_round(session, payload)`, где `payload` — диктионарь с полными новыми значениями всех треков.

3. **Validation в сервисе:**
   - Все три `influence_*` — ordered lists длиной = числу participations, без дублей.
   - `supply` и `castles` ключи = participation_ids в сессии (не другие).
   - `wildlings_threat` ∈ enum.
   - Если все participations имеют `castles == 0` — это допустимо (хотя странно), но если castles > 7 хоть у одного — ошибка.

4. **Immutability.** После создания `RoundSnapshot` не редактируется. Если ошибка — админ создаёт новый раунд с правильными данными или удаляет последний (через явный сервис `discard_last_round`).

5. **Maximum rounds per mode:**
   - `classic`: 10
   - `feast_for_crows`: 7
   - `dance_with_dragons`: 10
   - `mother_of_dragons`: 10
   В `complete_round` валидируется `round_number <= mode.max_rounds`.

## Alternatives considered

| Вариант | Плюсы | Минусы | Почему не выбран |
|---------|-------|--------|------------------|
| Отдельные модели per tracker (`InfluenceTrack`, `SupplyTrack`...) | Каждый трекер строго типизирован | 5 моделей на каждый раунд, JOIN-ад, миграции тяжёлые, нет преимуществ | Overengineering |
| Снимок per-tracker per-participation (длинная узкая таблица) | EAV-стиль, гибко | Никаких реальных запросов не требует EAV; восстановление снимка раунда = 5 join'ов | Worse without reason |
| Один JSON-блоб без структуры | Минимальный код | Нет валидации, нет CHK, бесполезно для агрегаций в Phase 3 | Защищаем инварианты |
| Хранить только diff между раундами | Экономия места | Сложность восстановления любого раунда; миллион edge cases | Преждевременная оптимизация (раундов будет ≤10) |

## Consequences

### Positive
- Полное состояние раунда восстанавливается одним запросом.
- История партии — это просто `session.round_snapshots.all()`.
- Финализация (ADR-0009) использует `last_round = session.round_snapshots.last()` — никакой логики, кроме чтения.
- Frontend timeline тривиален: отображаем по дате `RoundSnapshot.created_at`.

### Negative / Trade-offs
- JSONField для `influence_*` — Django ORM не может фильтровать «у кого Старк на 1-м месте трона» SQL-удобно. Не критично — такие запросы для статистики делаются на уровне `selectors.py` через JSON path operators (Postgres поддерживает это нативно).
- Нет referential integrity для participation_id внутри JSON. Решаем валидацией в сервисе.

### Storage estimate
- 10 раундов × 30 партий/месяц = 300 snapshot/месяц. JSON ~500 bytes на каждый. **150 KB/месяц.** Безопасно.

## Implementation pointers

### Сервисы
- `apps/games/services.py::complete_round(session, payload)` — создаёт RoundSnapshot N+1.
- `apps/games/services.py::discard_last_round(session)` — для коррекции ошибок (admin only).
- `apps/games/selectors.py::get_session_timeline(session)` — возвращает раунды + другие timeline events отсортированно.

### API
- `POST /api/v1/sessions/<id>/rounds/` — complete round.
- `GET /api/v1/sessions/<id>/rounds/` — list (already part of session detail).
- `DELETE /api/v1/sessions/<id>/rounds/<round_id>/` — discard last only.

### Frontend
- В `MatchDetailPage` — список раундов, drill-in в `RoundDetailModal`.
- Активный раунд: форма ввода в `MatchInProgressPage`.

## Revisit when

- Если число партий вырастет до сотен в день и JSONFields станут bottleneck — миграция в нормализованные таблицы.
- Если игроки начнут жаловаться, что хотят отметить только часть треков (не весь снимок) — добавим partial-snapshots.
