from django.db import migrations

FACTIONS = [
    {"slug": "arryn", "name": "Аррены", "color": "#60A5FA", "is_active": True},
    {"slug": "baratheon", "name": "Баратеоны", "color": "#F59E0B", "is_active": True},
    {"slug": "greyjoy", "name": "Грейджои", "color": "#111827", "is_active": True},
    {"slug": "lannister", "name": "Ланнистеры", "color": "#B91C1C", "is_active": True},
    {"slug": "martell", "name": "Мартеллы", "color": "#D97706", "is_active": True},
    {"slug": "stark", "name": "Старки", "color": "#9CA3AF", "is_active": True},
    {"slug": "targaryen", "name": "Таргариены", "color": "#7F1D1D", "is_active": True},
    {"slug": "tyrell", "name": "Тиреллы", "color": "#15803D", "is_active": True},
]

GAME_MODES = [
    {
        "slug": "classic",
        "name": "Классика",
        "min_players": 3,
        "max_players": 6,
        "description": "Базовый режим настольной Игры престолов.",
    },
    {
        "slug": "quests",
        "name": "Пир воронов",
        "min_players": 4,
        "max_players": 4,
        "description": "Сценарий из дополнения Feast for Crows для четырёх игроков.",
    },
    {
        "slug": "alternative",
        "name": "Танец с драконами",
        "min_players": 4,
        "max_players": 4,
        "description": "Сценарий A Dance with Dragons для опытных игроков.",
    },
    {
        "slug": "dragons",
        "name": "Мать драконов",
        "min_players": 4,
        "max_players": 8,
        "description": "Игра с дополнением Mother of Dragons и поддержкой 8 игроков.",
    },
]

DECKS = [
    {
        "slug": "original",
        "name": "Оригинальная",
        "description": "Базовые колоды домов из основной игры.",
    },
    {
        "slug": "expansion_a",
        "name": "Дополнение A",
        "description": "Дополнительная колода для расширенных сценариев.",
    },
    {
        "slug": "expansion_b",
        "name": "Дополнение B",
        "description": "Альтернативная колода для дополнений и домашних правил.",
    },
]


def seed_reference_data(apps, schema_editor) -> None:
    deck_model = apps.get_model("reference", "Deck")
    faction_model = apps.get_model("reference", "Faction")
    game_mode_model = apps.get_model("reference", "GameMode")

    for faction in FACTIONS:
        faction_model.objects.update_or_create(slug=faction["slug"], defaults=faction)

    for game_mode in GAME_MODES:
        game_mode_model.objects.update_or_create(slug=game_mode["slug"], defaults=game_mode)

    for deck in DECKS:
        deck_model.objects.update_or_create(slug=deck["slug"], defaults=deck)


def unseed_reference_data(apps, schema_editor) -> None:
    deck_model = apps.get_model("reference", "Deck")
    faction_model = apps.get_model("reference", "Faction")
    game_mode_model = apps.get_model("reference", "GameMode")

    deck_model.objects.filter(slug__in=[deck["slug"] for deck in DECKS]).delete()
    faction_model.objects.filter(slug__in=[faction["slug"] for faction in FACTIONS]).delete()
    game_mode_model.objects.filter(slug__in=[mode["slug"] for mode in GAME_MODES]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("reference", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_reference_data, unseed_reference_data),
    ]
