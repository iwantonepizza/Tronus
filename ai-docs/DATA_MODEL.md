# DATA_MODEL.md

Все модели наследуются от `core.models.TimestampedModel`, если не указано иное. Это даёт `created_at` / `updated_at` автоматически.

Стиль: в документации описываем бизнес-поля и инварианты. Технические мелочи (indexes, db_index) — в коде.

---

## `accounts`

### `User` (наследник `AbstractUser`)
Стандартный Django user. Кастомный класс нужен, чтобы в будущем легко добавлять поля без миграции auth-модели.

| Поле        | Тип          | Примечание                                                                  |
|-------------|--------------|-----------------------------------------------------------------------------|
| username    | str          | Стандарт Django.                                                            |
| email       | str, unique  | Обязательно.                                                                |
| is_active   | bool         | **По умолчанию `False` при регистрации.** Owner апрувит через admin.        |

**Registration flow (ADR-0004):** пользователь регистрируется по email через `POST /auth/register/`. Создаётся `User(is_active=False)`. Логин невозможен до апрува. Owner открывает Django admin → фильтр по `is_active=False` → выбирает пользователей → action `Approve selected users`. Сервис `accounts.services.approve_user(user)` ставит `is_active=True` и (через signal) создаёт `Profile` и добавляет в группу `player`.

**Роли** — через Django groups: `player`, `admin`. `guest` — не отдельная группа, это просто anonymous-пользователь с read-only доступом (ADR-0005).

### `Profile`
| Поле              | Тип                    | Примечание                                           |
|-------------------|------------------------|------------------------------------------------------|
| user              | OneToOne(User)         | PK = user_id.                                        |
| nickname          | str, unique            | Отображаемое имя в UI.                               |
| favorite_faction  | FK(Faction), nullable  | Для квика выбора в создании партии.                  |
| bio               | text, blank            | Короткое описание.                                   |
| current_avatar    | FK(AvatarAsset), null  | Текущая выбранная аватарка.                          |

---

## `reference`

Справочники. Заполняются через Django admin или data migration.

### `Faction`
| Поле        | Тип         | Примечание                                 |
|-------------|-------------|--------------------------------------------|
| slug        | str, unique | `stark`, `lannister`, ...                  |
| name        | str         | `Старки`, `Ланнистеры`.                    |
| color       | str         | HEX, базовый цвет фракции для UI и генерации аватара. |
| on_primary  | str         | HEX, цвет текста/иконок поверх `color`.    |
| sigil       | image       | Герб.                                      |
| is_active   | bool        | Скрыть неактуальные без удаления.          |

### `GameMode`
| Поле              | Тип         | Примечание                                     |
|-------------------|-------------|------------------------------------------------|
| slug              | str, unique | `classic`, `quests`, `alternative`, `dragons`. |
| name              | str         | Отображаемое название.                         |
| min_players       | int         | 3 / 4 / 4 / 4.                                 |
| max_players       | int         | 6 / 4 / 4 / 8.                                 |
| description       | text        |                                                |

### `Deck`
| Поле        | Тип         | Примечание                                     |
|-------------|-------------|------------------------------------------------|
| slug        | str, unique | `original`, `expansion_a`, `expansion_b`.      |
| name        | str         |                                                |
| description | text        |                                                |

---

## `games`

### `GameSession`
Событие партии — и план, и результат. Одна сущность, а не две, чтобы не плодить синхронизацию.

| Поле              | Тип                     | Примечание                                                        |
|-------------------|-------------------------|-------------------------------------------------------------------|
| scheduled_at      | datetime                | Когда запланирована / сыграна.                                    |
| mode              | FK(GameMode)            |                                                                   |
| deck              | FK(Deck)                |                                                                   |
| created_by        | FK(User)                | Автор создания сессии.                                            |
| status            | enum                    | `planned` / `completed` / `cancelled`.                            |
| planning_note     | text, blank             | Комментарий при планировании.                                     |

**Инварианты:**
- `status=completed` ⇒ существует `Outcome`.
- `status=completed` ⇒ все `Participation.place` заполнены.
- Количество `Participation` ∈ [`mode.min_players`, `mode.max_players`].
- Фракции уникальны в рамках сессии.

Переход `planned → completed` делается только через `games.services.finalize_session(...)`. Руками трогать статус нельзя.

### `Participation`
| Поле           | Тип                    | Примечание                                                  |
|----------------|------------------------|-------------------------------------------------------------|
| session        | FK(GameSession)        |                                                             |
| user           | FK(User)               |                                                             |
| faction        | FK(Faction)            | Обязательна с момента старта планирования.                  |
| place          | int, nullable          | 1, 2, 3, ... Заполняется при finalize.                      |
| castles        | int, nullable          | Число замков на момент окончания.                           |
| is_winner      | bool, default False    | Денормализация: `place == 1`. Для быстрых запросов.         |
| notes          | text, blank             | Личные заметки про игрока в этой партии.                   |

**Unique constraints:**
- `(session, user)` — один пользователь не может участвовать дважды.
- `(session, faction)` — одна фракция за партию.

### `Outcome`
One-to-one к `GameSession`, создаётся при `finalize_session`.

| Поле              | Тип                  | Примечание                                                     |
|-------------------|----------------------|----------------------------------------------------------------|
| session           | OneToOne(GameSession)| PK = session_id.                                               |
| rounds_played     | int                  | Сколько раундов шла игра.                                      |
| end_reason        | enum                 | `castles_7` / `timer` / `rounds_end` / `early` / `other`.      |
| mvp               | FK(User), nullable   | Опционально — «лучший игрок матча».                            |
| final_note        | text, blank          | Итоговый комментарий автора сессии.                            |

---

## `ratings`

### `MatchVote`
| Поле         | Тип             | Примечание                                             |
|--------------|-----------------|--------------------------------------------------------|
| session      | FK(GameSession) | Только `status=completed`.                             |
| from_user    | FK(User)        | Должен быть `Participation` в этой сессии.             |
| to_user      | FK(User)        | Должен быть `Participation` в этой сессии, ≠ from_user.|
| vote_type    | enum            | `CROWN` / `SHIT`.                                      |

**Unique:** `(session, from_user, to_user)`.

**Окно редактирования:** 24 часа с момента `Outcome.created_at`. Дальше read-only. Enforce в service.

**API mapping:** наружу отдаётся как `positive` / `negative`. Мэппинг в сериализаторе.

---

## `comments`

### `MatchComment`
| Поле         | Тип             | Примечание                                             |
|--------------|-----------------|--------------------------------------------------------|
| session      | FK(GameSession) |                                                        |
| author       | FK(User)        | Может комментировать любой авторизованный.             |
| body         | text            | Max 2000 символов.                                     |
| edited_at    | datetime, null  | Фиксируется при редактировании.                        |
| is_deleted   | bool            | Soft-delete. Для модерации админом.                    |

Редактировать/удалять — автор или админ.

---

## `avatars`

### `AvatarAsset`
| Поле             | Тип                  | Примечание                                                        |
|------------------|----------------------|-------------------------------------------------------------------|
| user             | FK(User)             |                                                                   |
| faction          | FK(Faction)          |                                                                   |
| style            | enum                 | `basic_frame` (MVP) / `realistic` / `dark` / `heraldic` (Phase 2). |
| source_photo     | image, nullable      | Загруженное фото (может отсутствовать для `basic_frame`).          |
| generated_image  | image                | Финальная аватарка.                                               |
| is_current       | bool                 | True если `profile.current_avatar = self`.                        |

Один пользователь может иметь много `AvatarAsset` (история). Текущая — через `Profile.current_avatar`.

---

## Диаграмма связей (логическая)

```
User ───── 1:1 ───── Profile
  │                     │
  │                     └── FK ──► Faction (favorite)
  │                     └── FK ──► AvatarAsset (current)
  │
  ├── M:N через Participation ──► GameSession
  │
  ├── 1:M ──► AvatarAsset
  │
  ├── 1:M ──► MatchVote (from_user / to_user)
  │
  └── 1:M ──► MatchComment (author)

GameSession
  ├── FK ──► GameMode
  ├── FK ──► Deck
  ├── 1:M ──► Participation
  ├── 1:1 ──► Outcome
  ├── 1:M ──► MatchVote
  └── 1:M ──► MatchComment

Participation
  ├── FK ──► GameSession
  ├── FK ──► User
  └── FK ──► Faction
```

---

## Миграционная стратегия

- Каждая модификация схемы — отдельная миграция, сгенерированная `makemigrations`.
- Имя миграции осмысленное: `0003_add_outcome_end_reason.py`, не `0003_auto.py`.
- Data migration (например, заполнение `is_winner` из `place`) — отдельной миграцией, не в рамках schema-change.
- Reversible миграции обязательны, где это не требует нереалистичных усилий.
