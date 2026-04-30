# CR-006: House Decks → 2 варианта; Event Decks как отдельная сущность

**Status:** closed
**Closed:** 2026-04-29
**Resolved by:** T-106
**Created:** 2026-04-27
**Author:** architect
**Related:** T-010 (closed), USER_FEEDBACK §1.4, §1.5, ADR-0011.

---

## Проблема

Текущая модель `reference.Deck` имеет 3 записи:
- `original` — Базовые колоды домов из основной игры.
- `expansion_a` — Дополнительная колода для расширенных сценариев.
- `expansion_b` — ...

Это смешение двух разных понятий:
1. **Колоды домов** (House Decks) — карты приказов и звёзд каждого дома, которые игрок берёт перед игрой. Тут владелец хочет **2 варианта**: оригинальная и альтернативная.
2. **Колоды событий** (Westeros decks) — 3 (или 4 в Mother of Dragons) колоды по 10 карт, разыгрываемые по одной в каждом раунде. См. ADR-0011.

Сейчас `Deck` пытается быть обоими.

## Решение

1. **Переименовать `Deck` → `HouseDeck`** в коде и UI. Это **колода карт домов**, как звучит.
2. Сократить записи до **2 значений:** `original`, `alternative`. Удалить `expansion_a`, `expansion_b` (нет prod-данных).
3. **Event decks не лежат в БД** (см. ADR-0011), а захардкожены в `apps/games/event_cards.py`.

## Impact на файлы

- `backend/apps/reference/models.py` — переименовать модель `Deck` → `HouseDeck`.
- `backend/apps/reference/migrations/0005_rename_deck_to_house_deck.py` — schema rename.
- `backend/apps/reference/migrations/0006_house_decks_two_variants.py` — data migration: переименовать `original` → оставить, `expansion_a` `expansion_b` → удалить, добавить `alternative`. *Если есть ссылки из GameSession.deck — переключить на ближайший.*
- `backend/apps/reference/serializers.py::DeckSerializer` → `HouseDeckSerializer`.
- `backend/apps/reference/views.py` → `HouseDeckListView`.
- `backend/apps/reference/urls.py` — `decks/` остаётся endpoint, отдаёт house decks.
- `backend/apps/games/models.py::GameSession.deck` — FK переименовать `house_deck`.
- `backend/apps/games/serializers.py` — синхронизировать.
- `frontend/src/api/types.ts` — `Deck` → `HouseDeck`.
- `frontend/src/api/reference.ts` — endpoint и типы.
- `frontend/src/pages/CreateSessionPage.tsx`, `EditSessionPage.tsx`, `MatchDetailPage.tsx`, `MatchesPage.tsx` — где упоминается `deck`.

## Acceptance

- [ ] `GET /api/v1/reference/decks/` возвращает 2 элемента: `original`, `alternative`.
- [ ] `POST /api/v1/sessions/` с `deck="original"` работает, с `deck="expansion_a"` отклоняет (404 на reference).
- [ ] Frontend форма создания сессии показывает 2 варианта.

## Порождает задачу

**T-106** в BACKLOG.
