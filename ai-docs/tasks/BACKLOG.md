# BACKLOG

Очередь задач. Architect перекладывает задачи в `IN_PROGRESS.md` при назначении агенту.

Префиксы:
- `T-XXX` — backend (Django). Директория `backend/`.
- `F-XXX` — frontend (React). Директория `frontend/`.
- `I-XXX` — integration / devops.

**Phase 1 MVP — CLOSED. Phase 2 — IN PROGRESS** (после user feedback 2026-04-27).

---

## Контекст: User feedback 2026-04-27

Полный анализ — в `ai-docs/source/USER_FEEDBACK_ANALYSIS_2026-04-27.md`.
Исходник владельца — в `ai-docs/source/USER_FEEDBACK_2026-04-27.md`.

Краткий итог: после первого реального теста MVP владелец прислал большой feedback с критическими багами и фундаментальными доменными уточнениями. Открыты ADR-0009..0015, CR-006, CR-007.

---

# 🔥 Группа 1 — Hotfixes (P0, должно быть в первой волне)

Это баги, которые ломают MVP. Делаем первыми, в малых задачах.

### T-114: Fix avatar URL в API responses

**Phase:** 2
**Depends on:** —
**Type:** bug

#### Context
Юзер: «Авы почему то не видны ни у кого». Корень проблемы: `PublicUserSerializer.get_current_avatar` возвращает `avatar.generated_image.url` — относительный путь `/media/avatars/...`. Браузер запрашивает его относительно фронта (`localhost:5173/media/...`) и получает 404, потому что Vite не проксирует `/media`.

#### Scope
- `backend/apps/accounts/serializers.py::PublicUserSerializer.get_current_avatar` — возвращать абсолютный URL через `request.build_absolute_uri(avatar.generated_image.url)`.
- Аналогично для `apps/avatars/serializers.py` если там есть такие же поля.
- `apps/reference/serializers.py::FactionSerializer.sigil` — то же самое для герба, если используется.
- `frontend/vite.config.ts` — добавить proxy для `/media/`:
  ```ts
  server: {
    proxy: {
      "/api": "http://localhost:8000",
      "/admin": "http://localhost:8000",
      "/media": "http://localhost:8000",
    },
  },
  ```
- Тесты: `apps/accounts/tests/test_api.py` — проверить что URL абсолютный.

#### Acceptance
- [ ] `GET /api/v1/users/<id>/` возвращает `current_avatar` в виде `http://localhost:8000/media/avatars/...png`.
- [ ] В UI аватарки отображаются на всех страницах (Home, Match detail, Profile).
- [ ] Тесты проходят.

---

### T-113: Login by email **или** nickname

**Phase:** 2
**Depends on:** —
**Type:** feature/bug

#### Context
Юзер: «Можно входить как по нику + пароль, так и по емейл + пароль». Сейчас только email.

#### Scope
- `backend/apps/accounts/serializers.py::LoginSerializer` — переименовать поле `email` → `login` (string).
- `backend/apps/accounts/services.py::find_user_by_login(login)` — ищет по `email__iexact` ИЛИ `Profile.nickname__iexact`. Если не нашёл — `None`.
- `backend/apps/accounts/views.py::LoginView` — использовать новый сервис.
- API contract: `POST /api/v1/auth/login/` принимает `{login, password}` (раньше `{email, password}`).
- `frontend/src/api/auth.ts::login()` — обновить сигнатуру.
- `frontend/src/pages/LoginPage.tsx` — label «Email или ник», placeholder «yourname или you@example.com».
- `ai-docs/API_CONTRACT.md` — обновить.

#### Acceptance
- [ ] Логин по email работает.
- [ ] Логин по нику работает.
- [ ] Login с правильным email но не активным пользователем → 403 `account_pending_approval`.
- [ ] Тесты на оба пути.

---

### F-100: Match detail bugfixes (RSVP buttons, cancel, search/notifications stubs)

**Phase:** 2
**Depends on:** T-120 (RSVP) для полного RSVP, но кнопка cancel не зависит.
**Type:** bug

#### Context
Юзер: «В матч сейчас не получается вступить» (кнопки без onClick); «Уведомления не работают» (кнопка без onClick); «Поиск тоже не работает» (кнопка без onClick).

В этой задаче — **только** кнопка отмены сессии и stub-disable для search/notifications с пометкой «coming soon». Полные RSVP (T-120) и Notifications (F-101) — отдельно.

#### Scope
- `frontend/src/pages/MatchDetailPage.tsx`:
  - Добавить кнопку «Отменить партию» рядом с «Финализировать» — видна только creator/admin при `status=planned`.
  - При клике — confirm dialog → вызвать `cancelSession(matchId)` → invalidate query → toast «Партия отменена».
- `frontend/src/components/layout/TopBar.tsx`:
  - Search кнопка: добавить `onClick={() => alert('Поиск скоро будет')}` или сделать `disabled` с tooltip «coming soon».
  - Notifications кнопка: то же самое.
- Кнопки RSVP «Я иду / под вопросом / не иду» в `MatchDetailPage` — **временно** добавить `disabled` + tooltip «RSVP скоро будет», полная логика в T-120/F-110.

#### Acceptance
- [ ] Кнопка cancel работает, статус сессии меняется на `cancelled`.
- [ ] Search/notifications кнопки явно показывают, что не реализованы (а не молчат).

---

### F-104: Mobile viewport fix (iPhone 7 safe area)

**Phase:** 2
**Depends on:** —
**Type:** bug

#### Context
Юзер: «Мне показалось или сайт на айфон 7 как-то не сразу на весь экран раскрывается, приходится чуть подраскрыть пальцами».

Типичная проблема: `<meta name="viewport">` без `viewport-fit=cover`, и нет CSS `env(safe-area-inset-*)` для iPhone notches.

#### Scope
- `frontend/index.html`:
  ```html
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  ```
- `frontend/src/styles/globals.css` — добавить:
  ```css
  body {
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
    padding-left: env(safe-area-inset-left);
    padding-right: env(safe-area-inset-right);
  }
  /* Если sticky bottom nav — учесть */
  .bottom-nav {
    padding-bottom: env(safe-area-inset-bottom);
  }
  ```
- Проверить mobile viewport в DevTools (iPhone SE / iPhone 12).
- Если есть `100vh` где-то — заменить на `100dvh` (Safari iOS issues).

#### Acceptance
- [ ] На iPhone 7 размере (375×667) сайт раскрывается на весь экран сразу.
- [ ] Bottom nav не перекрывается home indicator.

---

# 🛠 Группа 2 — Auth refactor

### T-110: Registration с secret word + повтор пароля + auto-active

**Phase:** 2
**Depends on:** —
**Type:** feature

#### Context
Юзер хочет: при регистрации — повтор пароля и опциональное «секретное слово». Если слово совпадает (`lovecraft`, регистр не важен) — пользователь сразу активен, без approve.

#### Scope
- `backend/config/settings/base.py` — добавить `REGISTRATION_SECRET_WORD = env("REGISTRATION_SECRET_WORD", default="")` (default пустая строка = слово отключено).
- `backend/.env.example` — `REGISTRATION_SECRET_WORD=lovecraft`.
- `backend/apps/accounts/serializers.py::RegisterSerializer`:
  - Поля: `email`, `nickname`, `password`, `password_repeat`, `secret_word` (optional).
  - `validate`: `password == password_repeat` иначе ValidationError.
- `backend/apps/accounts/services.py::register_user`:
  - Принимает `secret_word: str | None`.
  - Если `secret_word and settings.REGISTRATION_SECRET_WORD and secret_word.strip().lower() == settings.REGISTRATION_SECRET_WORD.lower()` → `is_active=True`.
  - Иначе — `is_active=False` (как сейчас).
  - Возвращает `{user, auto_activated: bool}` для view.
- `backend/apps/accounts/views.py::RegisterView` — в ответе `status: "active" | "pending_approval"` соответственно.
- `frontend/src/pages/RegisterPage.tsx`:
  - Добавить поля `password_repeat`, `secret_word` (placeholder «секретное слово (опционально)»).
  - Если ответ `auto_activated=true` → редирект на login.
  - Если `pending_approval` → экран «ждите апрува» как сейчас.
- `ai-docs/API_CONTRACT.md` — обновить.

#### Acceptance
- [ ] Регистрация без secret_word → pending_approval (как было).
- [ ] Регистрация с секретным словом «lovecraft» (любой регистр) → активный сразу.
- [ ] Регистрация с неправильным секретом → pending_approval (мы НЕ отвергаем регистрацию, просто игнорируем).
- [ ] `password != password_repeat` → 400.

---

### T-111: Password reset через secret word

**Phase:** 2
**Depends on:** T-110

#### Context
Юзер: «страницу восстановления пароля, где нужно ввести почту или ник + секретное слово (lovecraft)».

#### Scope
- `backend/apps/accounts/services.py::reset_password(login, secret_word, new_password, new_password_repeat) -> User`:
  - Найти пользователя по login (email или nickname, как T-113).
  - `secret_word.strip().lower() == settings.REGISTRATION_SECRET_WORD.lower()` иначе `ValidationError`.
  - `new_password == new_password_repeat`, `validate_password(new_password)`.
  - `user.set_password(new_password); user.save()`.
- `backend/apps/accounts/views.py::PasswordResetView` — `POST /api/v1/auth/password/reset/`.
- `frontend/src/pages/PasswordResetPage.tsx` — новая страница с формой.
- Routing: `/password-reset` в `App.tsx`.
- Link на `LoginPage`: «Забыли пароль?»
- `ai-docs/API_CONTRACT.md` — обновить.

#### Acceptance
- [ ] Reset с правильным `secret_word` меняет пароль, можно залогиниться.
- [ ] Reset с неправильным словом → 400.
- [ ] Reset для несуществующего login → 400 с тем же сообщением (anti-enumeration).

---

### T-112: Change password (logged-in)

**Phase:** 2
**Depends on:** —

#### Context
Юзер: «Кнопка поменять пароль со всей логикой по смене дальше».

#### Scope
- `backend/apps/accounts/services.py::change_password(user, current_password, new_password, new_password_repeat)`:
  - `user.check_password(current_password)` иначе `ValidationError("invalid_current_password")`.
  - Валидация new password.
- `backend/apps/accounts/views.py::PasswordChangeView` — `POST /api/v1/auth/password/change/`, IsAuthenticated.
- `frontend/src/pages/MyProfilePage.tsx` — секция «Изменить пароль» с тремя полями.
- `frontend/src/api/auth.ts::changePassword(...)`.

#### Acceptance
- [ ] Logged-in user меняет пароль, может перелогиниться.
- [ ] Неправильный current_password → 400.

---

### T-115: Russian validation messages в backend

**Phase:** 2
**Depends on:** —
**Type:** chore

#### Context
ADR-0015. Все русифицируем.

#### Scope
- Пройти `apps/*/services.py`, `apps/*/serializers.py` и заменить `ValidationError` сообщения на русские.
- Сохранить структуру `{error: {code: "...", message: "Русский текст", details: {...}}}`.
- Code остаётся английским ("invalid_credentials", "no_winner_yet" и т.п.).

#### Acceptance
- [ ] grep -rn '"[A-Z][a-z]* [a-z]' backend/apps/*/services.py — нет английских сообщений.
- [ ] Тесты проверяют code, не message — не сломались.

---

# 🎮 Группа 3 — Domain pivot (Phase 2 core)

Это самая большая группа задач. Реализует pivot доменной модели по ADR-0009..0014. **Делается строго по порядку**, потому что много зависимостей.

### T-105: Backend pre-work — переименовать Game modes по ADR-0012

**Phase:** 2
**Depends on:** —
**Type:** schema migration

#### Scope
- Расширить `GameMode` model: `max_rounds`, `westeros_deck_count`, `allowed_factions` (ArrayField), `required_factions` (ArrayField), `factions_by_player_count` (JSONField).
- Миграция `0004_game_mode_rules`:
  - Schema: новые поля.
  - Data: пересоздать GameModes с правильными slug и значениями (см. ADR-0012, секция Seed migration values).
  - Reverse: переключить обратно.
- `apps/reference/serializers.py::GameModeSerializer` — добавить новые поля.
- `apps/reference/admin.py` — list_display.
- `apps/reference/tests/` — обновить.
- **Frontend**: типы `GameMode` в `src/api/types.ts` обновить.

#### Acceptance
- [ ] `GET /api/v1/reference/modes/` отдает 4 mode с новыми slugs (`classic`, `feast_for_crows`, `dance_with_dragons`, `mother_of_dragons`).
- [ ] Поле `max_rounds` корректно для каждого режима.
- [ ] `mother_of_dragons.required_factions == ["targaryen"]`.
- [ ] Миграция reversible.

#### References
- ADR-0012.

---

### T-106: House decks redesign (CR-006)

**Phase:** 2
**Depends on:** T-105

#### Scope
См. CR-006 раздел «Impact на файлы».

#### Acceptance
См. CR-006.

---

### T-107: GameMode rules engine — `validate_session_setup`

**Phase:** 2
**Depends on:** T-105

#### Scope
- `apps/games/services.py::validate_session_setup(*, mode, faction_slugs)`.
- Используется в `start_session` и `randomize_factions`.
- Тесты на все 4 mode + edge cases (Mother of Dragons без targaryen → fail; classic 5 игроков с arryn → fail; ...).

#### Acceptance
- [ ] 12+ тестов проходят, покрывают все режимы.

---

### T-100: Lifecycle — `start_session` service & API (ADR-0009)

**Phase:** 2
**Depends on:** T-107
**Blocks:** T-101..T-104, T-120..T-126

#### Scope
- `apps/games/models.py::GameSession.Status.IN_PROGRESS = "in_progress"`.
- Миграция `0002_status_in_progress` (добавить choice).
- `apps/games/services.py::start_session(*, session, factions_assignment: dict[user_id, faction_slug])`:
  - Валидирует, что все going-инвайты в assignment.
  - `validate_session_setup` для (mode, factions).
  - Создаёт `Participation` записи.
  - Создаёт **initial RoundSnapshot** (round_number=0) — см. ADR-0010.
  - `status → IN_PROGRESS`.
- `apps/games/views.py::SessionStartView` — `POST /api/v1/sessions/<id>/start/`.
- Тесты: happy path, попытка start без RSVP=going, попытка start с дубликатом фракции.
- ADR-0009 ссылается отсюда — реальная реализация.

#### Files to touch
- `backend/apps/games/models.py`
- `backend/apps/games/migrations/000X_status_in_progress.py`
- `backend/apps/games/services.py`
- `backend/apps/games/views.py`
- `backend/apps/games/urls.py`
- `backend/apps/games/serializers.py`
- `backend/apps/games/tests/test_services.py`
- `backend/apps/games/tests/test_api.py`
- `ai-docs/API_CONTRACT.md`
- `ai-docs/DATA_MODEL.md`

#### Acceptance
- [ ] POST `/sessions/<id>/start/` переводит планируемую сессию в `in_progress`.
- [ ] При этом создаются Participation для всех «going» invites.
- [ ] Создаётся RoundSnapshot с round_number=0 (initial).
- [ ] Несоблюдение правил режима → 400.
- [ ] Финализировать без start → 400 (only in_progress can be finalized — поменяли с planned).
- [ ] Cancel из in_progress тоже работает (тест).

---

### T-101: RoundSnapshot model + complete_round service (ADR-0010)

**Phase:** 2
**Depends on:** T-100

#### Scope
- `apps/games/models.py::RoundSnapshot` со всеми полями из ADR-0010.
- Миграция.
- `apps/games/services.py::complete_round(session, payload)` — валидация всех полей, immutability check.
- `apps/games/services.py::discard_last_round(session)` — admin-only.
- `apps/games/selectors.py::get_session_rounds(session)`.
- API:
  - `POST /api/v1/sessions/<id>/rounds/` — complete next round.
  - `GET /api/v1/sessions/<id>/rounds/` — list (already in detail).
  - `DELETE /api/v1/sessions/<id>/rounds/<round_id>/` — discard last.

#### Acceptance
- [ ] Создание Round 1 после Round 0 ok.
- [ ] Невозможно создать Round 5, если есть только до 3.
- [ ] `wildlings_threat` ∈ enum, иначе 400.
- [ ] Невозможно изменить созданный snapshot (PATCH 405).
- [ ] discard_last удаляет только последний.

---

### T-102: Wildlings raid timeline event (ADR-0014)

**Phase:** 2
**Depends on:** T-101

#### Scope
- `apps/games/models.py::MatchTimelineEvent` (см. ADR-0014).
- Миграция.
- `apps/games/services.py::record_wildlings_raid(session, bids, outcome, outcome_card_slug)`:
  - Валидация bids (participations в сессии, amounts ≥ 0).
  - Создаёт MatchTimelineEvent.
  - Создаёт comment-летописец.
- API: `POST /api/v1/sessions/<id>/timeline/wildlings-raid/`.
- Карты-исхода — заглушка `["raven", "horn", "feast", "frost"]` в `apps/games/event_cards.py`. Юзер пришлёт реальный список — тогда CR.

#### Acceptance
- [ ] POST создаёт TimelineEvent с правильным kind.
- [ ] В чате появляется летописец.

---

### T-103: Clash of Kings timeline event

**Phase:** 2
**Depends on:** T-102

#### Scope
- `apps/games/services.py::record_clash_of_kings(session, tracks)`:
  - tracks = {throne: [...], sword: [...], court: [...]}, каждый — список ставок и мест.
- API: `POST /api/v1/sessions/<id>/timeline/clash-of-kings/`.
- Тесты валидации.

---

### T-104: Event card played + Discard last

**Phase:** 2
**Depends on:** T-101

#### Scope
- `apps/games/event_cards.py::WESTEROS_DECKS` — захардкожены slugs (10 на колоду, по ADR-0011).
- `apps/games/services.py::record_event_card_played(session, deck_number, card_slug)`.
- API: `POST /api/v1/sessions/<id>/timeline/event-card/`.
- `GET /api/v1/reference/event-decks/?mode=...` — список карт по режиму.
- Frontend types и API client.

---

### T-120: Invitations & RSVP (ADR-0013)

**Phase:** 2
**Depends on:** T-100

#### Scope
- `apps/games/models.py::SessionInvite`.
- Миграция.
- `apps/games/services.py`: `invite_user`, `update_rsvp`, `withdraw_invite`, `set_desired_faction`.
- API:
  - `POST /api/v1/sessions/<id>/invites/` (creator → user).
  - `POST /api/v1/sessions/<id>/invites/me/` (self-invite).
  - `PATCH /api/v1/sessions/<id>/invites/<invite_id>/` (изменить rsvp, desired_faction).
  - `DELETE /api/v1/sessions/<id>/invites/<invite_id>/`.
- Permissions: см. ADR-0013.
- Notifications subsystem (T-130) — отдельная задача, но invite создаёт InApp notification.

#### Acceptance
- [ ] Создатель приглашает игрока → invite со статусом `invited`.
- [ ] Self-invite со статусом `going`.
- [ ] Несколько инвайтов с одинаковым desired_faction разрешены.
- [ ] start_session использует только invites со статусом `going`.

---

### T-121: Random faction assignment

**Phase:** 2
**Depends on:** T-107, T-120

#### Scope
- `apps/games/services.py::randomize_factions(session) -> dict[user_id, faction_slug]`:
  - Берёт `going` invites, число игроков N.
  - Использует `_get_allowed_factions_for(mode, N)`.
  - Учитывает `required_factions` (Mother of Dragons targaryen).
  - Возвращает random assignment.
- API: `POST /api/v1/sessions/<id>/randomize-factions/` — preview, не сохраняет.
- Frontend: кнопка «Случайное распределение» в UI «начать партию».

---

### T-122: Replace participant (ADR-0013 §replacement)

**Phase:** 2
**Depends on:** T-101

#### Scope
- Поля в `Participation`: `replaced_by_participation`, `joined_at_round`, `left_at_round`. Миграция.
- `apps/games/services.py::replace_participant(session, out_user, in_user)`:
  - Проверка status=in_progress.
  - Создаёт новую Participation с той же фракцией.
  - Старая получает `left_at_round = current_round`.
  - Создаёт TimelineEvent kind=`participant_replaced`.
- API: `POST /api/v1/sessions/<id>/replace-participant/`.

---

### T-123: Finalize redesign (CR-007)

**Phase:** 2
**Depends on:** T-101

#### Scope
См. CR-007.

#### Acceptance
- [ ] Невозможно finalize без castles=7.
- [ ] Победитель определяется автоматически.
- [ ] Outcome.places рассчитан по правилам.

---

### T-126: Match timeline endpoint + chronicler in comments (ADR-0014)

**Phase:** 2
**Depends on:** T-101..T-104, T-122

#### Scope
- `apps/comments/models.py::MatchComment.chronicler_event` FK.
- `apps/games/selectors.py::get_session_timeline(session)` — все TimelineEvents отсорт. по `happened_at`.
- API: `GET /api/v1/sessions/<id>/timeline/`.
- В сериализаторе comment добавить `chronicler_event_id`.

---

# 🎨 Группа 4 — Frontend домен (большой UI)

Это **отдельная серия** задач, которая идёт параллельно с backend по мере готовности соответствующих endpoint'ов.

### F-110: RSVP flow в Match detail

**Phase:** 2
**Depends on:** T-120

UI для приглашений: список приглашённых, мои инвайты, кнопки accept/decline/maybe, выбор desired_faction.

### F-111: Match start wizard (planned → in_progress)

**Phase:** 2
**Depends on:** T-100, T-121

Экран распределения фракций админом, кнопка «Случайно», кнопка «Начать партию».

### F-112: Round tracker UI (in_progress)

**Phase:** 2
**Depends on:** T-101

Главный новый экран: 3 трека влияния, supply, castles, wildlings. Drag-and-drop для треков влияния. Подсветка castles красная зона / 7. Stars on King's Court вычислять по таблице (см. analysis §1.3 утилита `frontend/src/lib/court-stars.ts`).

Отображение текущего раунда + история (drill-in в раунд).

### F-113: Wildlings raid action

**Phase:** 2
**Depends on:** T-102, F-112

Модалка-wizard в 3 шага: ставки, выбор win/loss, выбор карты-исхода (заглушка).

### F-114: Clash of Kings action

**Phase:** 2
**Depends on:** T-103, F-112

Модалка в 3 этапа за каждый трек.

### F-115: Event card played UI

**Phase:** 2
**Depends on:** T-104

В round-tracker — 3 (или 4) dropdown для выбора карты из активной колоды. Можно оставить пустым.

### F-116: Match timeline component + chronicler hide

**Phase:** 2
**Depends on:** T-126

Хронология: список карточек событий с иконками. Drill-in на раунд → RoundSnapshot detail.
В чате: системные сообщения от летописца с иконкой/значком; localStorage toggle «Скрыть летописца».

### F-117: Replace participant UI

**Phase:** 2
**Depends on:** T-122

В active match: кнопка «Заменить игрока», select user из not-in-session, confirm.

### F-118: Finalize redesign UI

**Phase:** 2
**Depends on:** T-123

`FinalizeSessionPage` превращается в **подтверждение результата**: показывает текущий лидер по castles + throne, информирует «закончить партию?». Если castles<7 у всех — disabled с сообщением.

### F-119: Fun facts на match completion

**Phase:** 2
**Depends on:** T-132

После finalize — модалка с забавными фактами (longest round, biggest comeback, ...). Фактов — список из бэка.

---

# 🔔 Группа 5 — Notifications, Search, Profile

### T-130: In-app notifications backend

**Phase:** 2
**Depends on:** T-120

#### Scope
- Модель `Notification(user, kind, payload, is_read, created_at)`.
- Сервисы create/mark_read.
- API: `GET /api/v1/notifications/`, `POST /api/v1/notifications/<id>/read/`, `POST /api/v1/notifications/read-all/`.
- Триггеры: invite received/accepted/declined.

### F-101: Notifications dropdown в TopBar

**Phase:** 2
**Depends on:** T-130

Bell icon → dropdown с непрочитанными. Polling каждые 60s.

### T-131: Search API

**Phase:** 2
**Depends on:** —

#### Scope
- `GET /api/v1/search/?q=...` — ищет по никам, названиям сессий (planning_note), фракциям.
- Лимит 5 на каждый тип.

### F-102: Search command palette (Cmd+K)

**Phase:** 2
**Depends on:** T-131

Modal со списком, hotkey, debounced fetch.

### T-132: Fun facts service

**Phase:** 2
**Depends on:** T-101 (rounds)

После finalize: вычисление 3-5 интересных фактов матча (самый долгий раунд, неожиданная победа, etc.).
- `apps/stats/selectors.py::session_fun_facts(session) -> list[dict]`.
- В `Outcome` сериализаторе — поле `fun_facts`.

### F-103: AvatarUploader bug + display fixes

**Phase:** 2
**Depends on:** T-114

После T-114 проверить, что аватары везде корректно отображаются. Возможно, нужны мелкие правки.

### F-105: Russian translation pass

**Phase:** 2
**Depends on:** ADR-0015

Пройти все .tsx файлы и заменить все английские строки на русские. Шрифт замены см. ADR-0015 (Spectral / Marck Script вместо Cinzel для кириллицы).

### F-106: Custom error pages

**Phase:** 2
**Depends on:** —

`/404`, `/500`, `/403`, `/network-error` — кастомные страницы в стиле проекта (тёмные, fantasy palette).

### F-108: Hide chronicler toggle

**Phase:** 2
**Depends on:** F-116

В Settings или в шапке чата — переключатель.

---

# 🚀 Группа 6 — Production prep

### I-005: Production deployment plan (architect decision required)

**Phase:** 2

Owner и architect решают платформу. Без этого — нельзя двигаться к реальному prod.

#### Open questions
- Платформа: Fly.io / Railway / DO / VPS?
- Frontend hosting: Cloudflare Pages / Vercel / nginx-same-origin?
- Media: local volume или S3-compatible?
- Domain?
- SSL: managed (Cloudflare) или Let's Encrypt?

### I-006: Sentry / error monitoring

**Phase:** 2
**Depends on:** I-005

### I-007: Postgres backup strategy

**Phase:** 2
**Depends on:** I-005

### I-008: GitHub dependabot

**Phase:** 2

### F-107: Production manifest, favicon, OG tags

**Phase:** 2

`<title>`, OG image, manifest.json.

---

# 🎯 Phase 3 — Gamification (стоит за Phase 2)

Без изменений: Seasons (T-200), Achievements (T-201), Tournaments (T-202), Push notifications. Все ждут стабилизации Phase 2.

---

# Меньшие задачи и tech debt

- **T-082:** pytest-cov gate (closed, see DONE.md).
- **F-016:** a11y audit (closed, see DONE.md).
- **T-118:** Audit для удаления `expansion_a/b` (closed, see DONE.md).

### T-119: Stats endpoints учитывают только `status=completed`

**Phase:** 2
**Type:** audit / chore

#### Scope
Audit `apps/stats/selectors.py` — все агрегации фильтруют `session__status="completed"`. Сейчас может быть так, что включаются `cancelled` или (новое) `in_progress`. Тест-кейсы: cancelled session не появляется в leaderboard / overview / player profile / faction stats / head-to-head.

### T-127: CR-008 — cleanup duplicate classes

**Phase:** 2
**Depends on:** Wave 6 closed
**Type:** chore

#### Scope
См. CR-008. Удалить старые версии `MatchTimelineEvent` (apps/games/models.py) и `SessionFinalizeView` (apps/games/views.py). Без миграции (последнее определение и так действует).

#### Acceptance
- [ ] `grep -c "class MatchTimelineEvent" backend/apps/games/models.py` → 1.
- [ ] `grep -c "class SessionFinalizeView" backend/apps/games/views.py` → 1.
- [ ] Все тесты проходят, makemigrations dry-run чистый.

### T-128: CR-009 — replace placeholder slugs with real Westeros card names

**Phase:** 2
**Status:** blocked (waits owner)
**Depends on:** список карт от владельца

#### Scope
См. CR-009. Update `event_cards.py` со slugs из настоящей игры. Структура не меняется, миграций нет.

---

# 🔮 Future / парковка

- Email-уведомления (T-110-future).
- Telegram-бот для RSVP (T-111-future).
- Экспорт истории партий (T-112-future).
- Tournaments (T-202).
- «Легендарные матчи» подборка (F-017).
