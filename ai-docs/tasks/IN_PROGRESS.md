# IN PROGRESS

Задачи, выданные агентам. Каждая закрывается через approve в `APPROVALS.md`; только после этого агент берёт следующую.

---

## Волна 10 — 2026-04-30 — Второй прод-тест: UX-rework и баги

**Контекст:** после Wave 9 (RSVP 500, мохибейк, retroactive finalize, admin tab) владелец прогнал второй реальный тест на `got.craft-hookah.ru` и принёс ~20 пунктов фидбэка. Полный анализ — в `ai-docs/source/USER_FEEDBACK_ANALYSIS_2026-04-30.md`. Исходный текст — `USER_FEEDBACK_2026-04-30.md`.

Это **последний UX-полировочный спринт перед стабильным релизом**. Wave 11 будет про production hardening и Phase 3.

**Объём:** 17 задач в 4 параллельных трека. Часть переносим из Wave 9 (хвост незакрытого). Часть — новая.

---

### 🔴 Track A — Главное архитектурное изменение: «участники = инвайты» в UI

**Проблема (юзер):** «Если ты нажимаешь присоединится ты добавляешься в участники, но не появляешься в турнирной таблице, почему? это разное?... и зачем эти два меню?»

Решение зафиксировано в **ADR-0017** (см. `ai-docs/decisions/ADR-0017-invites-as-canonical-roster.md`).

- [ ] **T-140** — расширить `SessionInvite` сериализатор + permissions для `withdraw_invite` (creator/admin)
  - agent: `backend-coder`
  - spec: `BACKLOG.md` → T-140
  - report: `ai-docs/reports/YYYY-MM-DD-T-140.md`
  - **scope:**
    - `apps/games/serializers.py::SessionInviteSerializer` — добавить вложенный `desired_faction_summary` (slug + display_name + color), вложенный user (id, nickname, avatar_url).
    - `apps/games/views.py::SessionInviteDetailView` (DELETE) — позволить creator/admin удалить чужой инвайт. Добавить `IsInviteOwnerOrSessionCreatorOrAdmin` permission.
    - Тесты: creator может удалять, admin может, рядовой игрок — только свой.
  - **малая задача (~1 час).**

- [ ] **F-210** — `MatchDetailPage` rework: единый список «Участники» = инвайты
  - agent: `frontend-coder`
  - spec: `BACKLOG.md` → F-210
  - depends_on: T-140
  - report: `ai-docs/reports/YYYY-MM-DD-F-210.md`
  - **scope (большая задача, ~4-6 часов):**
    - При `status=planned`: показывать только список invites. Для каждой строки: avatar, nickname, желаемая фракция, RSVP-бейдж (Иду/Под вопросом/Не иду/Не отреагировал), кнопка-«крестик» для creator/admin (delete invite).
    - Свернутая секция «Не пойдут (N)» для declined.
    - Подсветка моей строки + RSVP-кнопки.
    - Скрыть «Турнирную таблицу» (Participations) пока `status=planned`.
    - Показать таблицу при `status=in_progress` или `status=completed`.
    - При `status=cancelled`: список invites read-only (без RSVP-кнопок), плюс чат и инфа о планировании; **скрыть** share-button, ссылку на профиль создателя как отдельную секцию, и блок «Турнирная таблица» с пустым местом.

- [ ] **F-211** — RSVP на главной странице (HomePage) + удаление дубля «Присоединиться»
  - agent: `frontend-coder`
  - spec: `BACKLOG.md` → F-211
  - depends_on: F-210 (использует тот же `RsvpBlock`)
  - report: `ai-docs/reports/YYYY-MM-DD-F-211.md`
  - **scope:**
    - В `HomePage.tsx` блоке `next_match` — заменить self-rolled `useState<RsvpState>` на `<RsvpBlock matchId={...} />` или эквивалент.
    - Убрать кнопку «Присоединиться» как отдельный элемент. Вход — через RSVP «Я иду». Если пользователь не залогинен — показать «Войти».
    - Идентичное поведение в `MatchDetailPage` и на главной.

### 🟢 Track B — UI-баги и polish

- [ ] **T-150** — починить 500 в admin при сохранении GameMode
  - agent: `backend-coder`
  - spec: `BACKLOG.md` → T-150
  - report: `ai-docs/reports/YYYY-MM-DD-T-150.md`
  - **scope:**
    - `apps/reference/admin.py::GameModeAdmin` — добавить `formfield_overrides` для `ArrayField` и `JSONField`, чтобы admin форма умела их редактировать.
    - Для `allowed_factions` / `required_factions` (ArrayField of slugs) — текстовый виджет с валидацией.
    - Для `factions_by_player_count` (JSONField) — стандартный JSON редактор (Django по умолчанию умеет, но иногда падает на edit; проверить).
    - Тест: создать GameMode через admin form factory, сохранить, перечитать — без 500.
  - **малая задача (~1-2 часа).**

- [ ] **T-151** — backend timezone Asia/Yekaterinburg
  - agent: `backend-coder`
  - spec: `BACKLOG.md` → T-151
  - report: `ai-docs/reports/YYYY-MM-DD-T-151.md`
  - **scope:**
    - `config/settings/base.py` — `TIME_ZONE = "Asia/Yekaterinburg"`. `USE_TZ = True` остаётся.
    - Все DateTime поля в БД продолжают храниться в UTC; меняется только display tz.
    - Проверить, что admin показывает время в Yekaterinburg.
  - **очень малая задача (~15 минут).**

- [ ] **F-219** — frontend: формат всех дат через Intl с `Asia/Yekaterinburg`
  - agent: `frontend-coder`
  - spec: `BACKLOG.md` → F-219
  - depends_on: T-151
  - report: `ai-docs/reports/YYYY-MM-DD-F-219.md`
  - **scope:**
    - `frontend/src/lib/dates.ts` — все форматтеры используют `Intl.DateTimeFormat('ru', { timeZone: 'Asia/Yekaterinburg', ... })`.
    - **НЕ** добавлять `date-fns-tz` (новая зависимость не оправдана).
    - Проверить отображение `scheduled_at` в `MatchCard`, `MatchDetailPage`, `HomePage`.

- [ ] **F-212** — клик по ближайшей партии на главной → переход на её страницу
  - agent: `frontend-coder`
  - spec: `BACKLOG.md` → F-212
  - report: `ai-docs/reports/YYYY-MM-DD-F-212.md`
  - **малая задача (~30 минут).** В `HomePage.tsx::next_match` блок обернуть в `<Link to={`/matches/${id}`}>`.

- [ ] **F-213** — UI отменённой партии (cancelled): спрятать share/profile/turnir, оставить чат и список
  - agent: `frontend-coder`
  - spec: `BACKLOG.md` → F-213
  - depends_on: F-210 (общий rework MatchDetailPage)
  - report: `ai-docs/reports/YYYY-MM-DD-F-213.md`
  - Может быть объединена с F-210 — на усмотрение agent.

- [ ] **F-214** — текстовая правка: «Колода: <name>» вместо просто «<name>»
  - agent: `frontend-coder`
  - spec: `BACKLOG.md` → F-214
  - report: `ai-docs/reports/YYYY-MM-DD-F-214.md`
  - **малая задача (~10 минут).**

- [ ] **F-215** — формат игроков `min-max` → если `min == max`, показать одно число
  - agent: `frontend-coder`
  - spec: `BACKLOG.md` → F-215
  - report: `ai-docs/reports/YYYY-MM-DD-F-215.md`
  - **scope:**
    - Утилита `frontend/src/lib/format.ts::formatPlayerRange(min, max)` → `"4"` если равны, иначе `"3-6"`.
    - Использовать везде где сейчас `${min}-${max}`.
  - **малая задача (~30 минут).**

- [ ] **F-216** — кнопки edit/cancel/start видны только creator/admin
  - agent: `frontend-coder`
  - spec: `BACKLOG.md` → F-216
  - report: `ai-docs/reports/YYYY-MM-DD-F-216.md`
  - **scope:**
    - В `MatchDetailPage` — обернуть кнопки в условие `isCreator || isStaff`. У нас уже есть `useAuth().user.is_staff` после Wave 9.
    - Тест: рядовой игрок не видит кнопки.

- [ ] **F-217** — текст hero-блока на главной
  - agent: `frontend-coder`
  - spec: `BACKLOG.md` → F-217
  - report: `ai-docs/reports/YYYY-MM-DD-F-217.md`
  - **очень малая задача (~5 минут).** Заменить «Главная теперь строится от реальных stats endpoints...» на «Все игры в Игру престолов записываются!».

- [ ] **F-218** — дефолтное `scheduled_at` = `now` при создании сессии
  - agent: `frontend-coder`
  - spec: `BACKLOG.md` → F-218
  - report: `ai-docs/reports/YYYY-MM-DD-F-218.md`
  - **scope:** В `CreateSessionPage.tsx` инициализировать `scheduledAt` через `new Date()` (с округлением до 5 минут). С учётом T-151 / F-219 — это будет показано как локальное время GMT+5.
  - **малая задача (~30 минут).**

- [ ] **F-220** — запоминать последний выбор `mode` и `house_deck` пользователя в localStorage
  - agent: `frontend-coder`
  - spec: `BACKLOG.md` → F-220
  - report: `ai-docs/reports/YYYY-MM-DD-F-220.md`
  - **scope:** При success создания сессии — сохранить `{modeSlug, deckSlug}` в `localStorage.tronus.lastCreate`. При следующем открытии формы — использовать как дефолты, если они валидны.
  - **малая задача (~45 минут).**

- [ ] **F-221** — мобильные фильтры партий: кнопка «Применить» + закрытие модалки
  - agent: `frontend-coder`
  - spec: `BACKLOG.md` → F-221
  - report: `ai-docs/reports/YYYY-MM-DD-F-221.md`
  - **scope:**
    - В `MatchesPage.tsx` мобильную модалку фильтров (`isFiltersOpen`) — добавить footer с двумя кнопками: «Применить» (закрывает + применяет фильтры), «Отмена» (закрывает без сохранения).
    - Проверить swipe-down-to-close или backdrop-click.

### 🔵 Track C — H2H autopick

- [ ] **T-152** — endpoint `/api/v1/stats/head-to-head/suggested/?for_user=<id>`
  - agent: `backend-coder`
  - spec: `BACKLOG.md` → T-152
  - report: `ai-docs/reports/YYYY-MM-DD-T-152.md`
  - **scope:**
    - `apps/stats/selectors.py::suggest_h2h_opponent(*, for_user_id) -> int | None` — простая эвристика: тот игрок, с которым у `for_user` больше всего совместных completed-партий, исключая самого пользователя. Если совместных нет — топ leaderboard.
    - View public read.
    - Test: закидываем 3 партии, проверяем что лучший candidate возвращается.

- [ ] **F-222** — H2H autopick на UI
  - agent: `frontend-coder`
  - spec: `BACKLOG.md` → F-222
  - depends_on: T-152
  - report: `ai-docs/reports/YYYY-MM-DD-F-222.md`
  - **scope:**
    - `HeadToHeadPage.tsx` — если `?user_a` отсутствует и юзер залогинен → user_a = self.
    - Если `?user_b` отсутствует → запросить suggested и подставить.
    - Селекторы остаются — пользователь может поменять.

### 🟡 Track D — Хвост Wave 9 (carry-over)

Это задачи которые codex отметил как открытые в Wave 9. Включаем в Wave 10 чтобы не потерялись.

- [ ] **T-141** — admin может удалять чужие инвайты
  - agent: `backend-coder`
  - **note:** покрыто T-140. Если T-140 выполнен — T-141 закрывается автоматически.

- [ ] **T-160** — flow удаления участника после старта (`force_remove_participation`)
  - agent: `backend-coder`
  - spec: `BACKLOG.md` → T-160
  - report: `ai-docs/reports/YYYY-MM-DD-T-160.md`
  - **scope:**
    - **Architect pre-work**: не нужно, сценарий простой.
    - `apps/games/services.py::force_remove_participation(*, participation, by_user)` — admin/creator может удалить участника даже после `start_session`. Удаляет Participation и создаёт TimelineEvent kind=`participant_removed`.
    - Endpoint `DELETE /api/v1/sessions/<id>/participations/<pid>/?force=true`.
    - Permission: admin или creator.
    - Тесты.

- [ ] **T-161** — голоса (короны/говно) в `planned`/`in_progress`
  - agent: `backend-coder`
  - spec: `BACKLOG.md` → T-161
  - report: `ai-docs/reports/YYYY-MM-DD-T-161.md`
  - **архитектурный вопрос — нужен ADR-0018 от architect перед implementation.** Текущая модель `MatchVote` требует `Participation` (который не существует до start). Если разрешать голоса до старта — нужен или второй FK на User, или голоса только при completed.
  - **STATUS: blocked, ждёт ADR.**

- [ ] **T-162** — verify pytest suite целиком + fix реgressions
  - agent: `backend-coder`
  - spec: `BACKLOG.md` → T-162
  - report: `ai-docs/reports/YYYY-MM-DD-T-162.md`
  - **scope:** `pytest backend/` на чистой Postgres БД. Все 200+ тестов зелёные.

- [ ] **T-163** — расширенные тесты для `finalize_played_session`
  - agent: `backend-coder`
  - spec: `BACKLOG.md` → T-163
  - report: `ai-docs/reports/YYYY-MM-DD-T-163.md`
  - **scope:** покрытие всех validation paths, edge cases (3 игрока в classic, 8 в MoD без targaryen → fail, разрывы в places, MVP не в roster).

- [ ] **F-204** — индикатор админ-режима в TopBar/Profile
  - agent: `frontend-coder`
  - spec: `BACKLOG.md` → F-204
  - report: `ai-docs/reports/YYYY-MM-DD-F-204.md`
  - **малая задача (~30 минут).** Показать бейдж «admin» рядом с никнеймом если `user.is_staff || user.is_superuser`.

---

## Что НЕ в этой волне

- **Wave 11**: Sentry/healthcheck/security (I-006..I-009 из старого плана) — после Wave 10.
- **Phase 3**: Seasons, Achievements, Tournaments — после стабильного prod.
- **CR-009 / T-128** уже закрыт в Wave 9 (real Westeros card slugs).

---

## Граф зависимостей Wave 10

```
T-140 (invite serializer) ── F-210 (UI rework) ── F-211 (HomePage RSVP)
                              └── F-213 (cancelled UI, может быть в F-210)
                              └── F-216 (perm на кнопки)

T-150 (admin GameMode 500)  — independent
T-151 (TZ backend) ── F-219 (TZ frontend)
F-212, F-214, F-215, F-217, F-218, F-220, F-221  — independent

T-152 (H2H suggest) ── F-222 (H2H autopick)

T-160, T-161 (blocked), T-162, T-163, F-204  — independent
```

---

## Стратегия выдачи

**Сессия 1 (главное архитектурное + основные баги, ~7 задач):**
- T-140, F-210, F-211 (Track A)
- T-150 (admin 500)
- T-151 + F-219 (timezone)
- F-216 (permissions)

**Сессия 2 (мелкие UI и polish, ~6 задач):**
- F-212, F-213, F-214, F-215, F-217, F-218

**Сессия 3 (carry-over Wave 9 + H2H, ~6 задач):**
- T-152 + F-222
- T-160, T-162, T-163, F-204, F-220, F-221

**Не для агента, нужно от architect:**
- ADR-0018 (votes lifecycle) перед T-161.

---

## Инструкция для агентов

**Перед началом — обязательно прочитать:**

1. `AGENTS.md` целиком.
2. `ai-docs/source/USER_FEEDBACK_ANALYSIS_2026-04-30.md` — общий контекст Wave 10.
3. `ai-docs/decisions/ADR-0017-invites-as-canonical-roster.md` (для T-140 / F-210).
4. `ai-docs/CONVENTIONS.md` (backend) или `ai-docs/FRONTEND_ARCHITECTURE.md` раздел 10 (frontend).
5. Свою задачу в `BACKLOG.md` целиком.

**Правило:** одна задача → отчёт → стоп до approve. Если задача малая (≤30 минут) и явно завязана на следующую — можно сделать пару подряд, но **отдельные отчёты** обязательны.

**Особое внимание для Wave 10:**

- **F-210** — самая большая задача. Делай её целиком, не пропуская ни одного состояния (planned/in_progress/completed/cancelled). Тестируй вручную в браузере на каждом из 4 статусов.
- **T-151 / F-219** — timezone правка не должна сломать существующие даты в БД. Они хранятся в UTC, меняем только display.
- **T-150** — 500 в admin. Сначала воспроизведи (открой admin/reference/gamemode/<id>/change/, попробуй сохранить). Reproduce → fix → verify.
- **T-161 голоса до finalize** — НЕ берись пока architect не написал ADR-0018.

**Блокеры пишем в `Open questions / blockers`** раздел отчёта. Не гадаем.
