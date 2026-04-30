# ADR-0017: UI roster shows SessionInvite during planned phase

**Status:** accepted
**Date:** 2026-04-30
**Deciders:** architect, owner
**Related:** ADR-0009 (lifecycle), ADR-0013 (invitations & RSVP), USER_FEEDBACK 2026-04-30 §1.

---

## Context

В Wave 6 был принят ADR-0013 («Invitations & RSVP — отдельная модель `SessionInvite`»). В соответствии с ним:

- `SessionInvite` — намерение участвовать (RSVP: going / maybe / declined / invited), существует во время `planned`.
- `Participation` — реальный участник партии (фракция, место, замки), создаётся при `start_session()`.

Это **архитектурно правильно** и сохраняется. Но в UI это породило путаницу:

> «Если ты нажимаешь присоединится ты добавляешься в участники, но не появляешься в турнирной таблице, почему? это разное?... зачем эти два меню?»  
> — owner, 2026-04-30

Текущий `MatchDetailPage` показывает оба списка одновременно во время `planned`:
- «Турнирная таблица» (Participations) — пустая, потому что start_session ещё не было.
- «Участники» (SessionInvites) — наполняется по мере RSVP.

Owner интерпретировал это как баг («те кто вступил попадают в участники только»).

## Decision

**В UI используем `SessionInvite` как канонический список «Участники» во время `planned`.** Participations показываются только тогда, когда они реально существуют:

| `session.status` | UI roster source | RSVP buttons | Tournament table (places) |
|---|---|---|---|
| `planned` | SessionInvites | active | hidden |
| `in_progress` | Participations | hidden | visible (places=null until finalize) |
| `completed` | Participations | hidden | visible (with places, MVP) |
| `cancelled` | SessionInvites (read-only) | hidden | hidden |

**Важно: API не меняется.** SessionInvite и Participation продолжают быть отдельными ресурсами на бэке. Меняется только presentation layer на фронте.

### Subsumed UX rules (от owner)

1. Кнопка «Присоединиться» убирается. Её роль выполняет «Я иду» в RSVP-блоке. Любой залогиненный игрок может self-RSVP в `going`.
2. Приглашённый, который не нажал ни одной RSVP-кнопки, отображается с пометкой «Не отреагировал».
3. Приглашённый со статусом `declined` показывается в свёрнутой секции «Не пойдут (N)», не удаляется.
4. Creator/admin может удалить любой инвайт через крестик рядом с именем.
5. При `cancelled` страница показывает: список инвайтов (read-only), чат, инфу о планировании. Скрывается: share-кнопка, отдельный блок профиля создателя как CTA, пустая турнирная таблица.

## Alternatives considered

| Вариант | Минусы |
|---|---|
| Слить `SessionInvite` и `Participation` в одну модель | Сломает constraint `unique(session, faction)` и потребует nullable faction до start. Нарушит ADR-0013. |
| Скрывать пустую «Турнирную таблицу» при planned, оставить два списка | Не решит концептуальную проблему — owner всё равно увидит «Участники» рядом с «Турнирной таблицей» когда она появится после start. |
| Считать participations.count == 0 → planned phase, рендерить только invites | Хрупко — теряется при partial finalize и других edge cases. Лучше полагаться на explicit status. |

## Consequences

### Positive

- UI понятный: один список «Участники» в любой момент жизни партии.
- RSVP остаётся прозрачным.
- Architecturally чисто — модели не меняются.

### Negative

- Frontend компонент `MatchDetailPage` становится сложнее (4 разных рендера для 4 статусов). Но это естественная сложность задачи.

### Implementation pointers

- `frontend/src/pages/MatchDetailPage.tsx` — основная правка. Switch on status.
- `frontend/src/components/match/RosterList.tsx` — новый компонент или extend существующего.
- `frontend/src/components/match/InviteRow.tsx` — отображение строки инвайта с RSVP-бейджем и admin actions.
- Backend: `T-140` расширяет SessionInvite сериализатор (вложенный user, desired_faction).
- Backend: permission `IsInviteOwnerOrSessionCreatorOrAdmin` для DELETE invite.

→ Реализация в задачах T-140 + F-210 + F-211 + F-213.
