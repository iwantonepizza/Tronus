# ADR-0005: Публичный read-access для неавторизованных пользователей

**Status:** accepted
**Date:** 2026-04-21
**Deciders:** architect, owner

---

## Context

Owner хочет, чтобы статистика и результаты партий были доступны без логина — приятно показать знакомым винрейт по фракциям или красивую последнюю партию без «зарегистрируйся сначала». Но все мутации — строго под auth.

---

## Decision

**Read-only endpoints публичны. Все write — только под auth.**

Конкретно:

**Публично (GET без auth):**
- `/api/v1/reference/*` — справочники.
- `/api/v1/sessions/` (список) и `/api/v1/sessions/<id>/` (детали + participants + outcome).
- `/api/v1/sessions/<id>/comments/` (чтение комментариев).
- `/api/v1/sessions/<id>/votes/` (чтение голосов).
- `/api/v1/users/` и `/api/v1/users/<id>/` (публичные профили).
- `/api/v1/stats/*` — вся статистика.

**Только под auth:**
- Всё что `POST` / `PATCH` / `DELETE`.
- `/api/v1/auth/me/`.
- `/api/v1/avatars/*` (личные аватарки).

**Уровень DRF:** `DEFAULT_PERMISSION_CLASSES = ("rest_framework.permissions.IsAuthenticatedOrReadOnly",)`. Индивидуальные view переопределяют в сторону большей строгости (например, `/auth/me/` → `IsAuthenticated`).

---

## Alternatives considered

| Вариант | Плюсы | Минусы | Почему не выбран |
|---------|-------|--------|------------------|
| Всё под auth | Проще permission-модель | Нужно регаться ради «посмотреть винрейт» — против желания owner'а | Противоречит ответу owner'а. |
| Отдельный публичный URL-префикс `/public/api/v1/` | Явное разделение | Дублирование роутеров, двойная поддержка | Overkill, `IsAuthenticatedOrReadOnly` решает то же без дубля. |
| Guest как Django group с особыми permissions | Единообразие | Django-permissions для anonymous пользователей требуют лишней гимнастики | Лишняя сложность. |

---

## Consequences

### Positive
- Нулевое трение для owner'а показать статистику знакомому.
- Индексация поисковиками возможна (если надо в будущем).
- Read-запросы масштабируются независимо (можно cachить на CDN уровне, если понадобится).

### Negative / Trade-offs
- **Privacy:** email пользователя не должен светиться в публичных endpoints. Сериализатор `PublicUserSerializer` отдаёт `id / nickname / favorite_faction / current_avatar`. Email, username (если отличается от ника) — **только** в `/auth/me/` и private serializer.
- Риск scraping — для closed-group не критично, но rate-limiting на публичные endpoints добавим (django-ratelimit).

### Neutral
- Возможность в Phase 2 включить invite-only режим через переменную окружения `PUBLIC_READ_ACCESS=false` — один флаг, переключает default permission.

---

## Implications на сериализаторы

Обязательная пара для `User` и `Profile`:

- `PublicUserSerializer` — без email / username (если username != nickname).
- `PrivateUserSerializer` — полный, используется только в `/auth/me/` и `/users/<id>/profile/` когда запрашивает сам пользователь.

Селекторы отдают модели, сериализатор выбирается во view в зависимости от `request.user == target_user`.

---

## Revisit when

- Появится запрос «хочу закрыть статистику от чужих» — добавляем feature-flag.
- Поисковый трафик станет нагрузкой (маловероятно) — кэш или CDN.
