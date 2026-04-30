# ADR-0013: Invitations & RSVP — пред-состав партии

**Status:** accepted
**Date:** 2026-04-27
**Deciders:** architect
**Related:** ADR-0009, USER_FEEDBACK §3.1, §3.2.

---

## Context

В текущей реализации `Participation` создаётся **сразу** через `add_participant(session, user, faction)`. Это работает только для очень узкого случая — «админ добавляет уже определившегося игрока с фракцией».

Юзер хочет:
1. Любой авторизованный игрок может **отозваться на сессию** (RSVP: going / maybe / declined / no-response).
2. Создатель сессии может **пригласить** конкретных игроков.
3. Игрок может указать **желаемую фракцию** до начала игры — это не уникально, может пересекаться с другими.
4. Когда сессия начинается, создатель/админ распределяет фракции среди тех, у кого RSVP=`going`.

Текущая `Participation` не годится для этого, потому что:
- Имеет CONSTRAINT `unique(session, faction)` — а до начала несколько игроков могут хотеть одну фракцию.
- Жёстко нужна фракция при создании.

## Decision

Делим намерение и реальное участие на **две модели**:

```python
class SessionInvite(TimestampedModel):
    """Намерение участвовать. Существует только при status=planned."""
    session = FK(GameSession, related_name="invites")
    user = FK(User, related_name="session_invites")
    rsvp_status = CharField(choices=[
        ("going", "Going"),
        ("maybe", "Maybe"),
        ("declined", "Declined"),
        ("invited", "Invited (no response)"),  # дефолт для приглашений
    ], default="invited")
    desired_faction = FK(Faction, null=True, blank=True)
    invited_by = FK(User, null=True, blank=True, related_name="+")  # null = self-invited

    class Meta:
        unique_together = [("session", "user")]
        # Намеренно НЕТ unique по desired_faction — несколько могут хотеть одно
```

```python
class Participation(...):
    """Реальный участник партии. Существует с момента status=in_progress."""
    # ... как сейчас, faction обязательна, unique(session, faction) ...
    # NEW: для замен (см. ADR-0009 §replacement)
    replaced_by_participation = OneToOneField(
        "self", null=True, blank=True, on_delete=SET_NULL, related_name="replaces"
    )
    joined_at_round = PositiveSmallIntegerField(default=0)  # 0 = с самого начала
    left_at_round = PositiveSmallIntegerField(null=True, blank=True)
```

**Lifecycle:**

```
[planned]
  └── SessionInvite created — sent OR self-RSVP
       │
       ├── user accepts → rsvp_status=going (+ optionally desired_faction)
       └── user declines → rsvp_status=declined

[start_session called by admin]
  └── For each Invite with rsvp_status=going:
        Participation created with assigned faction (from admin's payload)
  └── Invites сохраняются как история (не удаляем — нужны для статистики "RSVP-history")
  └── Status → in_progress

[in_progress]
  └── replace_participant(out_user, in_user):
        old.left_at_round = current_round
        new = Participation(faction=old.faction, joined_at_round=current_round)
        old.replaced_by_participation = new
```

## Alternatives considered

| Вариант | Плюсы | Минусы | Почему не выбран |
|---------|-------|--------|------------------|
| Один Participation с поля `is_confirmed` | Меньше сущностей | unique(session, faction) ломается; faction должна быть nullable; код становится `if confirmed` повсюду | Переусложнение |
| Отдельные `Invitation` и `RSVP` модели | Семантика приглашения от админа vs самозапись | Дубль, никакой ценности — invited_by=null покрывает | YAGNI |
| Таблица только `Participation`, до старта `faction=null` | Не нужна вторая таблица | Половина инвариантов нарушаются (constraint nullable); фракция как «desired» != фракция как «текущая» | Грязная семантика |

## Consequences

### Positive
- Чистое разделение «хочу играть» vs «играю». Каждое API понимает контекст.
- Замены игроков моделируются естественно через `replaced_by_participation`.
- Можно показывать в UI обе вещи одновременно: «приглашённые», «участвующие».
- Stats в Phase 3 могут учитывать «no-show rate» — кто часто говорит going и не приходит.

### Negative / Trade-offs
- Две модели вместо одной — больше кода.
- При переходе planned→in_progress нужен trans от SessionInvite к Participation.

### Privacy & permissions

| Действие | Кто | Когда |
|----------|-----|-------|
| Создать self-invite (`POST /sessions/<id>/invites/me/`) | любой auth user | session.status=planned |
| Изменить свой RSVP | self | planned |
| Пригласить другого (`POST /sessions/<id>/invites/`) | session.created_by, admin | planned |
| Удалить чужой invite | session.created_by, admin | planned |
| List invites | публично (read-only по ADR-0005) | всегда |

## Notifications

Создание/изменение invite порождает in-app notification (см. T-130 для notifications subsystem):

- `invitation.received` — пришло приглашение.
- `invitation.accepted` — игрок согласился (организатору).
- `invitation.declined` — игрок отказался (организатору).
- `session.starting_soon` — сессия скоро (Phase 2.5+).

## Revisit when

- Если появятся «открытые» сессии (любой может присоединиться) — добавим `is_open: bool` на сессию, тогда self-invite не требует приглашения.
- Если desired_faction начнёт массово конфликтовать (10 хотят Старка) — добавим UI «таблица голосования».
