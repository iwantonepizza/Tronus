# CR-009: WESTEROS_DECKS — replace placeholder slugs with real card names

**Status:** blocked (waits owner)
**Created:** 2026-04-30
**Author:** architect
**Related:** T-104 (closed with placeholders), ADR-0011.

---

## Проблема

В `backend/apps/games/event_cards.py` agent T-104 захардкодил структуру Westeros decks (3 колоды × 10 карт × 4 режима = 120 slugs + 4 wildlings outcome cards), но **slugs — placeholder'ы**, не реальные карты из настольной игры.

Это позволяет полностью протестировать API контракт и frontend selectors, но конечный пользователь увидит ненастоящие имена карт.

## Решение

Когда владелец пришлёт реальный список карт (по 10 на каждую колоду каждого режима), заменить slugs одной коммитной правкой `event_cards.py` без изменения структуры или API.

## Импакт на файлы

- `backend/apps/games/event_cards.py` — обновить slugs в WESTEROS_DECKS и WILDLINGS_OUTCOME_CARDS.
- `frontend/src/lib/i18n/event-cards.ts` (если будет создан в F-105) — обновить русские названия.
- Никаких миграций — данные не в БД.

## Acceptance

- [ ] Реальный список карт получен от владельца.
- [ ] Все slugs заменены, структура та же.
- [ ] Frontend получает данные через `/api/v1/reference/event-decks/?mode=...` без изменений.

## Что нужно от владельца

Список карт по форме:

```
Mode: classic
Westeros Deck 1 (10 cards):
  - "Throne of Blades" (slug?)
  - ...
Westeros Deck 2 (10 cards): ...
Westeros Deck 3 (10 cards): ...

Mode: feast_for_crows
Westeros Deck 1 (10 cards): ...
Westeros Deck 2: same as classic
Westeros Deck 3: same as classic

Mode: dance_with_dragons
All 3 decks: same as classic

Mode: mother_of_dragons
Westeros Decks 1-3: same as classic
Westeros Deck 4 (10 cards):
  - ...

Wildlings Outcome Cards (4):
  - ...
```

## Порождает задачу

**T-128** в BACKLOG (blocked до получения списка от владельца).
