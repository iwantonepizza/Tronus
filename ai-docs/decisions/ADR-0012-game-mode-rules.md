# ADR-0012: Game Mode Rules Engine

**Status:** accepted
**Date:** 2026-04-27
**Deciders:** architect, owner
**Related:** USER_FEEDBACK §1.6.

---

## Context

Юзер чётко зафиксировал правила доступности фракций по режимам:

| Slug | Название | Игроков | Доступные фракции | Обязательные | Раундов | Westeros decks |
|------|----------|---------|-------------------|--------------|---------|----------------|
| `classic` | Классика | 3–6 | stark/lannister/baratheon (3); +greyjoy (4); +tyrell (5); +martell (6) | — | 10 | 3 |
| `feast_for_crows` | Пир воронов | 4 | arryn, stark, lannister, baratheon | — | 7 | 3 (1-я особая) |
| `dance_with_dragons` | Танец с драконами | 6 | classic-состав без arryn и targaryen | — | 10 | 3 |
| `mother_of_dragons` | Мать драконов | 4–8 | все 8 | targaryen | 10 | 4 |

В коде сейчас `min_players`/`max_players` есть, но правил доступности фракций — нет, и `dance_with_dragons` неправильно зашит как 4–4.

## Decision

Расширяем модель `GameMode`:

```python
class GameMode(TimestampedModel):
    slug = SlugField(unique=True)
    name = CharField()
    min_players = PositiveSmallIntegerField()
    max_players = PositiveSmallIntegerField()
    max_rounds = PositiveSmallIntegerField(default=10)
    description = TextField(blank=True)
    westeros_deck_count = PositiveSmallIntegerField(default=3)  # 3 or 4

    # Новые поля — список slug фракций
    allowed_factions = ArrayField(SlugField(), default=list)  # пустой = все 8
    required_factions = ArrayField(SlugField(), default=list)
    factions_by_player_count = JSONField(default=dict)
    # {"3": ["stark", "lannister", "baratheon"], "4": [...8 дefault], ...}
    # Используется только в classic. В других режимах — пусто, тогда allowed_factions используется напрямую.
```

**Сервис валидации:**

```python
# apps/games/services.py

def validate_session_setup(*, mode: GameMode, faction_slugs: list[str]) -> None:
    """
    Проверяет, что состав фракций соответствует правилам режима.
    Используется в start_session() и при randomize_factions().
    """
    n = len(faction_slugs)
    if not (mode.min_players <= n <= mode.max_players):
        raise ValidationError({"players": [...]})

    allowed = _get_allowed_factions_for(mode, n)
    for slug in faction_slugs:
        if slug not in allowed:
            raise ValidationError({"factions": [f"{slug} not allowed in {mode.slug} for {n} players"]})

    for required in mode.required_factions:
        if required not in faction_slugs:
            raise ValidationError({"factions": [f"{required} is required in {mode.slug}"]})

    if len(set(faction_slugs)) != len(faction_slugs):
        raise ValidationError({"factions": ["Duplicate factions"]})


def _get_allowed_factions_for(mode: GameMode, player_count: int) -> set[str]:
    if mode.factions_by_player_count:
        # classic: для каждого N свой список
        return set(mode.factions_by_player_count.get(str(player_count), []))
    return set(mode.allowed_factions or ALL_FACTION_SLUGS)
```

**Seed migration values:**

```python
GAME_MODES = [
    {
        "slug": "classic",
        "name": "Классика",
        "min_players": 3, "max_players": 6, "max_rounds": 10,
        "westeros_deck_count": 3,
        "allowed_factions": [],  # see factions_by_player_count
        "required_factions": [],
        "factions_by_player_count": {
            "3": ["stark", "lannister", "baratheon"],
            "4": ["stark", "lannister", "baratheon", "greyjoy"],
            "5": ["stark", "lannister", "baratheon", "greyjoy", "tyrell"],
            "6": ["stark", "lannister", "baratheon", "greyjoy", "tyrell", "martell"],
        },
    },
    {
        "slug": "feast_for_crows",
        "name": "Пир воронов",
        "min_players": 4, "max_players": 4, "max_rounds": 7,
        "westeros_deck_count": 3,
        "allowed_factions": ["arryn", "stark", "lannister", "baratheon"],
        "required_factions": [],
        "factions_by_player_count": {},
    },
    {
        "slug": "dance_with_dragons",
        "name": "Танец с драконами",
        "min_players": 6, "max_players": 6, "max_rounds": 10,
        "westeros_deck_count": 3,
        "allowed_factions": ["stark", "lannister", "baratheon", "greyjoy", "tyrell", "martell"],
        "required_factions": [],
        "factions_by_player_count": {},
    },
    {
        "slug": "mother_of_dragons",
        "name": "Мать драконов",
        "min_players": 4, "max_players": 8, "max_rounds": 10,
        "westeros_deck_count": 4,
        "allowed_factions": [],  # все 8
        "required_factions": ["targaryen"],
        "factions_by_player_count": {},
    },
]
```

## Alternatives considered

| Вариант | Минусы |
|---------|--------|
| Захардкодить правила в Python | Нельзя править через admin; ОК было бы, но хочется вариативности; в БД — не дороже. |
| Полный rule engine (DSL) | Overkill |

## Consequences

- В классике нельзя выбрать `stark + lannister + arryn` (из allowed по количеству игроков `arryn` отсутствует).
- В Mother of Dragons партия с 5 игроками без `targaryen` — отвергается.
- Random faction assignment автоматически уважает правила.
- Modes, которые описаны в текущем seed как `quests` и `alternative` — переименовываются в `feast_for_crows` и `dance_with_dragons` (slug change). Mode `dragons` → `mother_of_dragons`. **Это breaking change в API**, но т.к. prod-данных нет — миграцией обновляем slugs.

## Migration strategy

В `backend/apps/reference/migrations/0004_game_mode_rules.py`:
1. Schema: добавить поля `max_rounds`, `westeros_deck_count`, `allowed_factions`, `required_factions`, `factions_by_player_count`.
2. Data: переименовать существующие slugs (`quests` → `feast_for_crows`, `alternative` → `dance_with_dragons`, `dragons` → `mother_of_dragons`), пересчитать `max_players`, заполнить новые поля.
3. Reverse: обратная переименовка.
