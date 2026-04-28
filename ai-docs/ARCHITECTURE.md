# ARCHITECTURE.md

## Tech Stack

| Слой             | Выбор                            | Причина                                                    |
|------------------|----------------------------------|------------------------------------------------------------|
| Framework        | Django 5.x                       | Монолит, быстрый старт, admin из коробки.                  |
| API              | Django REST Framework            | Стандарт для Django API.                                   |
| DB               | PostgreSQL 15+                   | Реляционные инварианты, оконные функции для статистики.    |
| Cache / broker   | Redis (опционально, Phase 2)     | Только когда появятся тяжёлые агрегации или Celery.        |
| Async tasks      | Celery (Phase 2)                 | Для AI-генерации аватаров через внешнее API.               |
| Image processing | Pillow                           | MVP-аватар: фото + рамка фракции без внешних сервисов.     |
| Tests            | pytest + pytest-django           | Фикстуры, параметризация, лучше стандартного unittest.     |
| Config           | django-environ                   | 12-factor, `.env` для dev.                                 |
| Deps             | pip-tools (requirements.in/txt)  | Детерминированная lock-версия без лишних инструментов.     |

**Phase 1 (MVP) без Redis и Celery.** Добавляем только когда подтвердится bottleneck.

---

## Структура проекта

```
got-tracker/
├── config/
│   ├── settings/
│   │   ├── base.py
│   │   ├── dev.py
│   │   └── prod.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── apps/
│   ├── core/
│   ├── accounts/
│   ├── reference/
│   ├── games/
│   ├── ratings/
│   ├── comments/
│   ├── stats/
│   └── avatars/
├── api/
│   └── v1/
│       ├── urls.py
│       └── __init__.py
├── tests/                  # интеграционные, сквозные сценарии
├── requirements.in
├── requirements.txt
├── manage.py
├── pytest.ini
├── AGENTS.md
└── ai-docs/
```

---

## Apps: ответственность и границы

### `core`
Базовые классы моделей (`TimestampedModel` с `created_at`/`updated_at`), общие миксины, валидаторы, утилиты. **Не содержит бизнес-логики.** Никто не импортирует из `core` ничего тяжёлого — только базовые классы.

### `accounts`
- **Модели:** `User` (кастомный, наследник `AbstractUser`), `Profile` (one-to-one, nickname, любимая фракция, bio).
- **Роли:** через Django groups (`guest`, `player`, `admin`). Permission-check в `permissions.py`.
- **Отвечает за:** регистрацию, логин, сессии, профиль.

### `reference`
Справочники. Почти immutable с точки зрения приложения, редактируются через Django admin.
- **Модели:** `Faction`, `GameMode`, `Deck`.
- **Не зависит ни от кого.** Все остальные аппы ссылаются на эти модели через FK.

### `games`
Ядро домена.
- **Модели:** `GameSession`, `Participation`, `Outcome`.
- **Жизненный цикл:** `planned` → `in_progress` (опционально) → `completed` / `cancelled`.
- **Сервисы:** `create_session`, `add_participant`, `remove_participant`, `finalize_session` (создаёт Outcome, блокирует изменения), `cancel_session`.
- **Селекторы:** `get_session_with_participants`, `list_sessions_for_user`, `list_planned_sessions`.
- **Инварианты:** состав игроков в сессии соответствует диапазону режима (например, «классика» = 3–6), одна фракция не используется дважды в рамках сессии.

### `ratings`
- **Модели:** `MatchVote` (from_user, to_user, session, vote_type, created_at, updated_at).
- **Сервисы:** `cast_vote` — enforce инварианты: голосующий участвовал в сессии; нельзя голосовать за себя; один голос на пару `from→to` в сессии; редактирование допустимо в течение 24ч после `Outcome.created_at`.
- **API отдаёт нейтральные названия** (`positive`, `negative`), внутри хранится enum (`CROWN`, `SHIT`). Это чтобы потом можно было переименовать UI без миграции.

### `comments`
- **Модели:** `MatchComment` (session, author, body, created_at, edited_at).
- **Сервисы:** `post_comment`, `edit_comment`, `delete_comment`. Редактирование/удаление — только автором, админом всегда.
- **Inline-чат под матчем** — это просто список комментариев, отсортированный по времени.

### `stats`
Чистый read-only модуль. **Не имеет своих моделей** в MVP.
- **Селекторы:** `player_profile_stats(user_id)`, `faction_winrate(faction_id)`, `head_to_head(user_a, user_b)`, `recent_matches(limit)`, `leaderboard(metric)`.
- Всё через Django ORM aggregations + оконные функции где нужно.
- Если заметим тормоза — денормализуем в Phase 2 (`PlayerSeasonStats` и подобное), но не раньше.

### `avatars`
- **Модели:** `AvatarAsset` (user, faction, source_photo, generated_image, style, created_at).
- **Сервисы MVP:** `generate_basic_avatar(user, faction, photo)` — Pillow-композиция: кадрирование фото + наложение рамки/цвета фракции. Синхронно, без Celery.
- **Phase 2:** `generate_ai_avatar` — асинхронно через Celery + внешний AI API.

---

## Слои внутри аппы

```
views.py       ─▶ permissions.py
    │
    ├─▶ services.py    (мутации, транзакции)
    │       └─▶ models.py
    │
    └─▶ selectors.py   (чтение, агрегации)
            └─▶ models.py

serializers.py  ─▶ models.py   (только shape, без логики)
```

**Жёсткие правила:**
1. `views.py` не импортирует `models` напрямую. Только через `services` / `selectors`.
2. `services.py` всегда работает в транзакции (`@transaction.atomic`), если мутация затрагивает >1 запись.
3. `selectors.py` — чистые функции, без сайд-эффектов.
4. `serializers.py` не содержит бизнес-логики. Валидация уровня «форматы полей» — да. Валидация уровня «этот игрок уже в сессии» — нет, это в service.
5. `models.py` содержит только поля, `Meta`, `__str__`, и валидаторы уровня БД. Никаких `def calculate_winrate(self)`.

---

## Межаппные границы

**Правило:** аппа `A` импортирует из аппы `B` **только из** `B.services`, `B.selectors`, `B.models` (FK). Никогда из `B.views` / `B.serializers`.

Схема зависимостей (стрелка = зависит от):

```
accounts ─┐
          ├─▶ reference
games ────┘       ▲
  ▲               │
  ├─ ratings ─────┤
  ├─ comments ────┤
  ├─ avatars ─────┘
  │
  └─ stats  (читает games, accounts)
```

`reference` — листовой узел, ни от кого не зависит.
`core` — параллельно, импортируется всеми для базовых классов.

---

## API-слой

`api/v1/urls.py` собирает роутеры всех аппов:

```
/api/v1/auth/          ← accounts
/api/v1/users/         ← accounts
/api/v1/reference/     ← reference (факции, режимы, колоды)
/api/v1/sessions/      ← games
/api/v1/sessions/<id>/participants/
/api/v1/sessions/<id>/outcome/
/api/v1/sessions/<id>/comments/
/api/v1/sessions/<id>/votes/
/api/v1/stats/...
/api/v1/avatars/
```

Подробности — в `API_CONTRACT.md`.

**Versioning:** URL-based (`/v1/`). Breaking changes → `/v2/`, старый держим до окончательной миграции фронта.

**Auth:** `SessionAuthentication` + `TokenAuthentication` (DRF). Без JWT в MVP.

**CORS:** настроен на домен фронта через `django-cors-headers`.

---

## Admin

Используем Django admin для:
- управления справочниками (`reference`);
- модерации комментариев и голосов;
- ручного исправления результатов партий (с логированием через `django-simple-history` — решение в ADR-0004, когда потребуется).

Админка — **не** основной интерфейс owner'а. Основной — сайт.

---

## Безопасность и приватность

Closed-group сервис, но базовая гигиена обязательна:

- Registration закрыта или через invite-token. Конкретика — в ADR (создадим при реализации `accounts`).
- Пароли — стандартный Django hasher (argon2 предпочтительно).
- Rate-limiting на login — `django-ratelimit` или `django-axes`.
- Все мутации под auth, read-эндпоинты могут быть публичными (роль `guest`). Окончательно решить в Phase 1 — см. задачу `T-010`.
- HTTPS обязателен в prod. HSTS, secure cookies.

---

## Testing strategy

- **Unit:** services и selectors покрываются pytest.
- **Integration:** API endpoints через `APIClient`.
- **Фикстуры:** `pytest-factoryboy` для моделей.
- **Coverage target:** сервисы и селекторы — 90%+. Views — smoke-тесты.
- **БД в тестах:** реальный Postgres (через `pytest-django`), не SQLite — избегаем расхождений.
