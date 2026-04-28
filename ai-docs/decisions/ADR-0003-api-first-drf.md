# ADR-0003: API-first архитектура, DRF, без Django templates

**Status:** accepted
**Date:** 2026-04-21
**Deciders:** architect, owner

---

## Context

Owner генерирует фронт через Claude Design — это будет отдельное приложение (React / Next, HTML+JS, — решает Claude Design). Бэкенд должен отдавать данные через API, а не рендерить HTML.

---

## Decision

Бэкенд — **API-first** на **Django REST Framework**. Django-шаблоны не используем, кроме `admin`. Все endpoints под `/api/v1/`. Формат — JSON. Версионирование — URL-based.

Auth — `SessionAuthentication` + `TokenAuthentication` (DRF). JWT отложен.

---

## Alternatives considered

| Вариант | Плюсы | Минусы | Почему не выбран |
|---------|-------|--------|------------------|
| Django templates + HTMX | Быстро для небольшого сайта | Owner уже выбрал Claude Design как фронт-инструмент → фронт будет отдельный | Не совместим с выбранным фронт-флоу. |
| FastAPI | Современнее, async из коробки | Пришлось бы дублировать admin, миграции, auth — overhead для одного человека | Не стоит своих трудозатрат. |
| GraphQL (Strawberry / Graphene) | Гибкие запросы | Overkill для простых CRUD, стату лучше делать на бэке готовыми эндпоинтами | Нет пользы, только сложность. |
| DRF + JWT | Stateless | Session auth проще для закрытого сервиса с web-фронтом. JWT добавим если появится мобилка | Отложили. |

---

## Consequences

### Positive
- Фронт и бэк развязаны, можно менять одно без другого.
- DRF — зрелый инструмент, много готового (browsable API, throttling, pagination).
- Admin параллельно с API — owner может править данные руками.

### Negative / Trade-offs
- CORS и CSRF требуют настройки.
- Нет free SSR.
- Больше boilerplate, чем в чистом Django views.

### Neutral
- Движок статистики и фронт — разные подсистемы, можно замерять и оптимизировать независимо.

---

## Revisit when

- Появится потребность в realtime (чат под матчем) — добавлять Channels или WebSocket-слой, но это не меняет текущее решение.
- Мобильный клиент → JWT.
