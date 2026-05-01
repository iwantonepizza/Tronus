# ADR-0019: Invites at session creation (no Participations until start_session)

- **Status:** accepted
- **Date:** 2026-05-01
- **Wave:** 11 (hotfix-pivot после третьего прод-теста)
- **Supersedes:** дополняет ADR-0013 (Invitations & RSVP) и ADR-0017 (Invites as canonical roster).

## Context

После Wave 10 на проде наблюдались блокирующие баги при попытке провести
полный цикл партии:

1. Создание сессии через `CreateSessionPage` (flow «обычная партия») в форме
   позволяло сразу собрать состав игроков с фракциями. Фронт делал:
   ```ts
   const session = await createSession(...)
   for (const seed of draft.participantSeeds) {
     await addParticipant(session.id, { user: seed.userId, faction: seed.faction })
   }
   ```
   Это создавало `Participation` строки **до старта партии**.

2. ADR-0017 уже определил, что **до `start_session`** канонический ростер — это
   `SessionInvite[]`, а `Participation` создаётся только в `start_session()`
   через `bulk_create`. Однако фронтовая форма создания/редактирования всё ещё
   следовала старому flow.

3. На странице «Начать партию» юзер выбирал фракции через инвайты, нажимал
   «Начать», и `start_session()` падал с 400:
   ```
   IntegrityError: UNIQUE constraint failed: games_participation (session_id, faction_id)
   ```
   Потому что в БД уже лежали `Participation` от создания, и `bulk_create`
   пытался добавить ту же фракцию ещё раз.

4. Дополнительно — `finalize_played_session()` отказывается работать, если в
   сессии уже есть `Participation` (защита от двойной финализации). Сценарий
   «быстрая отметка» падал по этой же причине.

5. UI «под вопросом» в `RsvpBlock` был disabled, пока пользователь не нажмёт
   «Я иду» (то есть пока не появится `SessionInvite`). Логика создания инвайта
   была завязана только на статус `going`.

## Decision

**До `start_session()` единственный способ положить пользователя в ростер —
это `SessionInvite`. `Participation` создаётся только внутри `start_session()`
и далее.**

Конкретно:

1. **Backend** (минимальные правки, совместимо с уже задеплоенным API):
   - `services.invite_user(*, session, inviter, invitee, desired_faction=None,
     rsvp_status=None)` — теперь принимает `desired_faction` и `rsvp_status`.
     Дефолт `rsvp_status` — `invited`.
   - `services.self_invite(*, session, user, desired_faction=None,
     rsvp_status=None)` — то же. Дефолт `rsvp_status` — `going` (старое
     поведение).
   - `serializers.InviteUserSerializer` — поля `user_id`, `desired_faction`
     (optional), `rsvp_status` (optional).
   - Новый `serializers.SelfInviteSerializer` — поля `desired_faction`
     (optional), `rsvp_status` (optional).
   - Views пробрасывают новые поля.

2. **Frontend** (поведенческий pivot):
   - `CreateSessionPage` для `entryMode === 'planned'` **больше не зовёт**
     `addParticipant()`. Вместо этого вызывает `inviteUser(sessionId, {
     user_id, desired_faction, rsvp_status: 'maybe' })` для каждого
     `participantSeed`.
   - `EditSessionPage` — то же для блока «Пригласить игроков». Существующие
     инвайты оставляются как есть; новые создаются как `maybe`.
   - `RsvpBlock` — кнопки `going/maybe/declined` всегда активны для авторизованного
     пользователя без инвайта. При нажатии:
     - если инвайт есть → `updateRsvp(inviteId, { rsvp_status })`,
     - если нет → `selfInvite(sessionId, { rsvp_status })`.
   - Кнопка-CTA «Присоединиться» удалена — её роль выполняет «Я иду».

3. **Прод-данные** (T-173): management команда
   `cleanup_orphan_participations` находит `Participation` на `planned`
   сессиях, конвертирует их в `SessionInvite(rsvp_status='maybe')` с тем же
   `desired_faction`, затем удаляет участия. Идемпотентна.

## Why default `maybe` (а не `invited`) для seed-ов из формы

Создатель сессии собирает в форме людей, которые **уже договорились**
сыграть, но статус «иду» подтверждается лично. `maybe` — честный дефолт:
«я тебя записал, подтверди».

Альтернатива — `invited` (чистый зов). Отвергнута, потому что в текущем UI
`invited` визуально равнозначен «не отреагировал», и состав в карточке
выглядел бы пустым до первого RSVP. `maybe` показывает, что игрок учтён.

## Consequences

**Положительные:**
- `start_session()` больше не падает на UNIQUE constraint.
- `finalize_played_session()` работает в «быстрой отметке».
- UI ростера и бэкендный source of truth теперь идентичны (ADR-0017
  замкнут).
- Кнопка «Под вопросом» доступна сразу, без обходного клика на «Я иду».

**Отрицательные:**
- Сериализатор `InviteUserSerializer` стал шире: теперь принимает 3 поля
  вместо 1. Backwards-compat сохранён (новые поля optional).
- На проде нужно один раз прогнать `cleanup_orphan_participations` после
  деплоя, иначе уже созданные кривые сессии останутся неисправными.

## Notes

- ADR-0013 («Приглашения и RSVP») — фундамент. Не меняется.
- ADR-0017 («Invites as canonical roster») — UI-уровень. Это ADR закрывает
  последнюю дыру, где фронт всё ещё создавал `Participation` помимо инвайтов.
- `force_remove_participation` (T-160) — отдельная история, для уже
  стартовавших сессий. Не пересекается с этим ADR.
