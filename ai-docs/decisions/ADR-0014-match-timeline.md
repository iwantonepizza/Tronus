# ADR-0014: Match Timeline Events & Chronicler

**Status:** accepted
**Date:** 2026-04-27
**Deciders:** architect
**Related:** ADR-0010 (rounds), USER_FEEDBACK §3.7, §3.8, §3.9.

---

## Context

Партия — это не только раунды. Между раундами происходит:
- Нападение одичалых (wildlings raid).
- Битва королей (clash of kings) — особый раунд с тремя ставочными этапами.
- Розыгрыш карт событий (event card played).
- Замены игроков (participant replaced).

Юзер хочет, чтобы все эти события **появлялись в хронологии партии** и в чате — как сообщения от системного «летописца» (`chronicler`). Каждый игрок может **локально отключить** видимость летописца в чате.

## Decision

Заводим единую таблицу `MatchTimelineEvent`:

```python
class MatchTimelineEvent(TimestampedModel):
    session = FK(GameSession, related_name="timeline_events")
    kind = CharField(choices=Kind.choices, max_length=32)
    happened_at = DateTimeField(default=now)
    actor = FK(User, null=True, blank=True, related_name="+")  # initiator
    payload = JSONField()  # схема зависит от kind, валидация в сервисе

    class Meta:
        ordering = ["happened_at"]
        indexes = [Index(fields=["session", "happened_at"])]


class Kind(TextChoices):
    SESSION_STARTED       = "session_started",       "Session started"
    ROUND_COMPLETED       = "round_completed",       "Round completed"
    WILDLINGS_RAID        = "wildlings_raid",        "Wildlings raid"
    CLASH_OF_KINGS        = "clash_of_kings",        "Clash of kings"
    EVENT_CARD_PLAYED     = "event_card_played",     "Event card played"
    PARTICIPANT_REPLACED  = "participant_replaced",  "Participant replaced"
    SESSION_FINALIZED     = "session_finalized",     "Session finalized"
```

**Payload schemas (TS-side discriminated union):**

```ts
type WildlingsRaidPayload = {
  kind: "wildlings_raid";
  bids: { participation_id: number; amount: number }[];
  outcome: "win" | "loss";
  outcome_card_slug: string | null;  // null если не указано
  wildlings_threat_after: number;
};

type ClashOfKingsPayload = {
  kind: "clash_of_kings";
  tracks: {
    influence_throne: { participation_id: number; bid: number; place: number }[];
    influence_sword:  { participation_id: number; bid: number; place: number }[];
    influence_court:  { participation_id: number; bid: number; place: number }[];
  };
};

type RoundCompletedPayload = { kind: "round_completed"; round_number: number; round_snapshot_id: number };
// ... и т.д.
```

**Rendering в чате (chronicler):**

`MatchComment` уже существует. Добавляем:

```python
class MatchComment(TimestampedModel):
    # ...existing fields...
    chronicler_event = FK(MatchTimelineEvent, null=True, blank=True, related_name="chronicler_messages")
```

Когда сервис создаёт timeline event — он же создаёт комментарий-летописец:

```python
def _emit_chronicler_message(*, event: MatchTimelineEvent, body: str) -> MatchComment:
    return MatchComment.objects.create(
        session=event.session,
        author=None,          # системный
        body=body,
        chronicler_event=event,
    )
```

**Hide chronicler (per-user):** на фронте — настройка в localStorage `tronus.chat.hideChronicler = true`. Не пишем в БД, это чисто UI preference. Filter в `CommentsList`.

**API:**
- `GET /api/v1/sessions/<id>/timeline/` — список всех timeline events с payload, отсортирован по `happened_at`.
- Comments endpoint остаётся как был, добавляется поле `chronicler_event_id` в сериализаторе.

## Alternatives considered

| Вариант | Минусы |
|---------|--------|
| Полиморфные модели (Django GenericForeignKey) | Сложнее, JOIN-ы, JSONField проще и в нашем масштабе достаточно. |
| Отдельные модели per kind | 6 моделей вместо одной, и каждая со своими endpoints — нет ценности. |
| Не сохранять как Comments, а синтезировать на фронте | Плохо для скрытия (filter становится сложнее), плохо для notification subsystem. |

## Consequences

- Один линейный feed событий — UI простой.
- Discriminated union на TS — typesafe.
- Chronicler messages показываются вместе с user-comments в одном `MatchComment` listing — простая фильтрация по `author IS NULL OR chronicler_event IS NULL`.
- Notifications система может ходить по `MatchTimelineEvent.created_at > last_seen` для каждого пользователя.

## Validation

`payload` валидируется в сервисе (`apps/games/services.py::record_timeline_event`) против per-kind schema (json schema или вручную). Не доверяем фронту.
