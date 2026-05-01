# IN PROGRESS

Задачи, выданные агентам. Каждая закрывается через approve в `APPROVALS.md`.

---

## Волна 11 — 2026-05-01 — Hotfix-волна по третьему юзер-тесту

**Контекст:** после Wave 10 на проде вылезли блокирующие баги:
- Создание сессии обычным flow → пустая сессия (Participations не создаются, инвайты не создаются).
- «Начать партию» падает с 400 (orphan participations).
- `GET /sessions/<id>/start/` отвечает 500 (MethodNotAllowed как unhandled).
- Кнопка «Под вопросом» в RSVP-блоке disabled пока инвайт не создан.
- Восстановление пароля по нику = security hole.
- Поле пароля без toggle visibility.

Полный анализ — `ai-docs/source/USER_FEEDBACK_ANALYSIS_2026-05-01.md`.
Архитектурное решение — `ai-docs/decisions/ADR-0019-invites-at-session-creation.md`.

**Объём:** 9 задач, **строгий hotfix-режим** — ничего нового, только разблокировать прод.

---

### 🔴 Backend hotfixes (architect уже применил частично — agent дописывает тесты + миграции)

- [x] **T-171 (architect-applied)** — `MethodNotAllowed` ловится явно в ErrorHandlingMixin, возвращает честный 405 в стандартном формате `{error: {code: "method_not_allowed", ...}}`.
  - Файлы: `backend/apps/games/views.py`, `backend/apps/ratings/views.py`.
  - **agent должен:** добавить тесты `test_method_not_allowed_returns_405` для обоих apps. Сделать GET-запрос на endpoint который принимает только POST, ассертить status 405 и `code == "method_not_allowed"`.
  - report: `ai-docs/reports/YYYY-MM-DD-T-171.md`

- [x] **T-170 (architect-applied)** — `invite_user` и `self_invite` принимают `desired_faction` и `rsvp_status`. `InviteUserSerializer` и новый `SelfInviteSerializer` поддерживают эти поля. Views их пробрасывают.
  - Файлы: `backend/apps/games/services.py`, `backend/apps/games/serializers.py`, `backend/apps/games/views.py`.
  - **agent должен:** добавить тесты `test_invite_user_with_desired_faction_and_maybe_status`, `test_self_invite_as_maybe`, `test_invite_user_invalid_rsvp_status_400`.
  - report: `ai-docs/reports/YYYY-MM-DD-T-170.md`

- [x] **T-172 (architect-applied)** — `reset_password` принимает только `email`, не `login`. `PasswordResetSerializer` использует `EmailField`.
  - Файлы: `backend/apps/accounts/services.py`, `backend/apps/accounts/serializers.py`.
  - **agent должен:** обновить тесты `test_password_reset_*` — сменить payload `login` → `email`. Добавить `test_password_reset_by_nickname_does_not_work` (на старый login=nickname → 400).
  - report: `ai-docs/reports/YYYY-MM-DD-T-172.md`

- [x] **T-173 (architect-applied)** — management command `cleanup_orphan_participations` для починки прод-данных.
  - Файл: `backend/apps/games/management/commands/cleanup_orphan_participations.py`.
  - **agent должен:** добавить **idempotent test** — фикстура: planned session + 2 Participations → run command → assertions: 2 invites созданы, 0 participations, status=planned. Re-run: no-op.
  - report: `ai-docs/reports/YYYY-MM-DD-T-173.md`

---

### 🔴 Frontend P0 (БЛОКЕРЫ)

- [ ] **F-230** — `CreateSessionPage` + `EditSessionPage` создают invites вместо Participations
  - agent: `frontend-coder`
  - depends_on: T-170 (done)
  - report: `ai-docs/reports/YYYY-MM-DD-F-230.md`
  - **scope:**
    - В `frontend/src/pages/CreateSessionPage.tsx` найти цикл `for (const participant of draft.participantSeeds) { await addParticipant(...) }` и заменить на:
      ```ts
      for (const participant of draft.participantSeeds) {
        await inviteUser(createdSession.id, {
          user_id: participant.userId,
          desired_faction: participant.faction ?? null,
          rsvp_status: 'maybe',  // ADR-0019: default «под вопросом»
        })
      }
      ```
    - В `frontend/src/pages/EditSessionPage.tsx` — то же самое для блока «Пригласить игроков».
    - В `frontend/src/api/sessions.ts::inviteUser(sessionId, payload)` — расширить тип payload: `{user_id: number; desired_faction?: string | null; rsvp_status?: RsvpStatus}`.
    - В `frontend/src/api/types.ts::InviteUserPayload` — синхронизировать.
    - Убрать импорт `addParticipant` из CreateSessionPage если он больше не нужен.
    - **Тесты frontend:** обновить vitest для CreateSessionPage flow если есть — проверить что не вызывается `POST /participations/` при `entryMode='planned'`.
  - **critical: это разблокирует юзера сразу.**

- [ ] **F-231** — `RsvpBlock`: любая RSVP-кнопка работает без предварительного инвайта
  - agent: `frontend-coder`
  - depends_on: T-170 (done)
  - report: `ai-docs/reports/YYYY-MM-DD-F-231.md`
  - **scope:**
    - В `frontend/src/components/match/RsvpBlock.tsx` (или где он живёт):
      - Если у пользователя нет invite → кнопки **активны**.
      - При нажатии любой кнопки:
        - Если invite есть → `updateRsvp(invite.id, {rsvp_status: status})`.
        - Если нет → `selfInvite(sessionId, {rsvp_status: status})`.
    - Убрать кнопку «Присоединиться» как отдельный элемент — её роль выполняет «Я иду». Если пользователь не залогинен — показать «Войти, чтобы участвовать».
    - В `frontend/src/api/sessions.ts::selfInvite(sessionId, payload)` — расширить тип: `{rsvp_status?: RsvpStatus; desired_faction?: string | null}`.
    - **тесты frontend:** обновить vitest для RsvpBlock.
  - **critical: исправляет «Под вопросом disabled пока не нажмёшь Я иду».**

---

### 🟡 Frontend P1 (UX/security)

- [ ] **F-232** — toggle visibility для всех password-полей
  - agent: `frontend-coder`
  - report: `ai-docs/reports/YYYY-MM-DD-F-232.md`
  - **scope:**
    - В `frontend/src/components/ui/Input.tsx` (или где живёт base input) добавить prop `type="password"` поведение: иконка eye/eye-off справа, click → toggle между type=password и type=text. Use `lucide-react` `Eye` и `EyeOff`.
    - Применить в:
      - `LoginPage.tsx` — поле password.
      - `RegisterPage.tsx` — password + password_repeat.
      - `PasswordResetPage.tsx` — new_password + new_password_repeat.
      - В `MyProfilePage.tsx` секция «Изменить пароль» — current_password + new_password + new_password_repeat.
    - Не дублировать код — сделать `<PasswordInput />` или прокинуть в `Input` пропс.
  - **малая задача (~1 час).**

- [ ] **F-233** — `PasswordResetPage`: только email, без подсказки секретного слова
  - agent: `frontend-coder`
  - depends_on: T-172 (done)
  - report: `ai-docs/reports/YYYY-MM-DD-F-233.md`
  - **scope:**
    - В `frontend/src/pages/PasswordResetPage.tsx`:
      - Убрать поле «Email или ник» → заменить на просто «Email» (label, placeholder `you@example.com`, `type="email"`).
      - В payload отправлять `email` вместо `login`.
      - На поле секретного слова: убрать любые **placeholder/helper text** которые подсказывают что слово такое. Должен быть просто пустой `placeholder=""` и label «Секретное слово». Helper-текст под полем — нейтральный, например «Секретное слово сообщит администратор» (или вообще пустой).
    - В `frontend/src/api/auth.ts::resetPassword(payload)` — payload теперь `{email, secret_word, new_password, new_password_repeat}`.
    - **малая задача (~30 минут).**

---

### 🟢 Carry-over из Wave 10

- [ ] **F-213** — UI отменённой партии (cancelled): спрятать share/profile/turnirnaya, оставить чат и planning info
  - agent: `frontend-coder`
  - report: `ai-docs/reports/YYYY-MM-DD-F-213.md`
  - depends_on: F-210 (done in Wave 10)
  - **scope:**
    - В `MatchDetailPage.tsx` если `session.status === 'cancelled'`:
      - Скрыть: кнопку Share, отдельный блок «Профиль создателя» (если такой есть), пустую турнирную таблицу.
      - Оставить: список инвайтов (read-only), planning_note, чат.

- [ ] **T-160** — `force_remove_participation` для admin/creator
  - agent: `backend-coder`
  - report: `ai-docs/reports/YYYY-MM-DD-T-160.md`
  - **scope:**
    - `apps/games/services.py::force_remove_participation(*, participation, by_user)` — admin/creator может удалить participation после `start_session`.
    - Удаляет Participation, создаёт MatchTimelineEvent kind=`participant_removed` с пейлоадом `{participation_id, user_id, faction_slug}`.
    - Endpoint: `DELETE /api/v1/sessions/<id>/participations/<pid>/?force=true` — параметр `?force=true` обязателен (без него — старая логика, разрешена только в planned).
    - Permission: admin или creator.
    - Тест: admin удаляет participation in_progress сессии → 204, timeline event создан.
  - **средняя задача (~1.5 часа).**

---

## Что **НЕ** в этой волне

- T-161 (votes до finalize) — нужен ADR-0018, отложен.
- T-162 / T-163 (расширенные тесты) — следующая волна.
- F-204 (admin badge) — следующая волна.
- Phase 3 (Seasons / Achievements) — после стабилизации.

---

## Стратегия выдачи

**Сессия 1 (немедленно после получения архитектором — БЛОКЕРЫ):**
- F-230 (создание сессии через invites) — блокер №1.
- F-231 (RSVP без предварительного invite) — блокер №2.
- T-171, T-170, T-172, T-173 (тесты на architect-applied код).

**Сессия 2:**
- F-232 (password toggle).
- F-233 (reset by email + чистый UI).
- F-213 (cancelled UI).
- T-160 (force remove).

---

## Деплой Wave 11 на прод (для owner)

После одобрения волны:

```bash
cd ~/tronus
git pull
docker compose -f deploy/docker-compose.prod.yml up -d --build

# Однократно после deploy — починить orphan participations:
docker compose -f deploy/docker-compose.prod.yml exec backend \
  python manage.py cleanup_orphan_participations --dry-run
# проверить вывод, потом:
docker compose -f deploy/docker-compose.prod.yml exec backend \
  python manage.py cleanup_orphan_participations

# Frontend
cd frontend && npm ci && npm run build
sudo rsync -a --delete dist/ /var/www/tronus/dist/
```

После Wave 11 цикл «создать партию → нажать “Я иду” / “Под вопросом” → начать → разметить → финализировать» **должен работать без 500 и без 400**.