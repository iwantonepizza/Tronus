# ADR-0011: Event Decks (Westeros decks) — фиксированные карты событий

**Status:** accepted
**Date:** 2026-04-27
**Deciders:** architect
**Related:** USER_FEEDBACK §1.4.

---

## Context

В правилах настольной игры есть **колоды событий «Westeros»**:
- 3 колоды по 10 карт каждая в обычной игре (`westeros_1`, `westeros_2`, `westeros_3`).
- 4-я колода добавляется в режиме Mother of Dragons (`westeros_4`).
- В режиме Feast for Crows колода `westeros_1` отличается от стандартной.

Каждая карта имеет название, и эти 30 (или 40) карт — **фиксированы навсегда**, могут быть захардкожены.

В каждом раунде игроки разыгрывают по одной карте из каждой активной колоды. Юзер хочет в UI видеть «какая карта была разыграна» с возможностью выбора из выпадающего списка или оставить пустым.

## Decision

Карты не лежат в БД, а **захардкожены** в `backend/apps/games/event_cards.py` как Python-структура:

```python
WESTEROS_DECKS = {
    ("classic", 1): ["throne_of_blades", "muster", "supply", ...],  # 10 cards
    ("classic", 2): [...],
    ("classic", 3): [...],
    ("feast_for_crows", 1): ["...", ...],  # alternate deck
    ("feast_for_crows", 2): WESTEROS_DECKS[("classic", 2)],  # share
    ("feast_for_crows", 3): WESTEROS_DECKS[("classic", 3)],
    ("dance_with_dragons", 1): WESTEROS_DECKS[("classic", 1)],
    ("dance_with_dragons", 2): WESTEROS_DECKS[("classic", 2)],
    ("dance_with_dragons", 3): WESTEROS_DECKS[("classic", 3)],
    ("mother_of_dragons", 1): WESTEROS_DECKS[("classic", 1)],
    ("mother_of_dragons", 2): WESTEROS_DECKS[("classic", 2)],
    ("mother_of_dragons", 3): WESTEROS_DECKS[("classic", 3)],
    ("mother_of_dragons", 4): ["...", ...],  # 10 cards, exclusive
}
```

Карты как доменные слаги, локализация — в frontend i18n словаре (или статический dict в backend для admin).

В `RoundSnapshot` добавляется опциональное поле:

```python
event_cards_played = JSONField(blank=True, default=dict)
# {"deck_1": "throne_of_blades" | None, "deck_2": "supply" | None, "deck_3": "muster" | None, "deck_4": "..." | None}
```

Если поле отсутствует / `None` — значит игрок не указал. UI отображает прочерк, никакой ошибки.

API endpoint reference выдаёт активные колоды по mode:

```
GET /api/v1/reference/event-decks/?mode=classic
→ {"decks": [{"deck_number": 1, "cards": [{"slug": "throne_of_blades", "name": "..."}, ...]}, ...]}
```

## Alternatives considered

| Вариант | Плюсы | Минусы |
|---------|-------|--------|
| `EventCard` model в БД | гибко, можно админить | overhead на миграции, для статичных правил не нужно |
| Free-text в RoundSnapshot | минимум кода | нет валидации, нет статистики «какая карта чаще играется» |

## Consequences

- Карты не правятся через admin — только в коде. Это норм, правила игры не меняются.
- Статистика «как часто разыгрывается каждая карта» возможна агрегацией JSON в Postgres.
- Если правила игры изменятся (новое дополнение) — добавляем константу в файл и миграция не нужна.
