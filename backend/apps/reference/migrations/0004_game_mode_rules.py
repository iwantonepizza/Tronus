from __future__ import annotations

from django.db import migrations, models

LEGACY_MODE_VALUES = [
    {
        "slug": "classic",
        "name": "РљР»Р°СЃСЃРёРєР°",
        "min_players": 3,
        "max_players": 6,
        "description": "Р‘Р°Р·РѕРІС‹Р№ СЂРµР¶РёРј РЅР°СЃС‚РѕР»СЊРЅРѕР№ РРіСЂС‹ РїСЂРµСЃС‚РѕР»РѕРІ.",
    },
    {
        "slug": "quests",
        "name": "РџРёСЂ РІРѕСЂРѕРЅРѕРІ",
        "min_players": 4,
        "max_players": 4,
        "description": "РЎС†РµРЅР°СЂРёР№ РёР· РґРѕРїРѕР»РЅРµРЅРёСЏ Feast for Crows РґР»СЏ С‡РµС‚С‹СЂС‘С… РёРіСЂРѕРєРѕРІ.",
    },
    {
        "slug": "alternative",
        "name": "РўР°РЅРµС† СЃ РґСЂР°РєРѕРЅР°РјРё",
        "min_players": 4,
        "max_players": 4,
        "description": "РЎС†РµРЅР°СЂРёР№ A Dance with Dragons РґР»СЏ РѕРїС‹С‚РЅС‹С… РёРіСЂРѕРєРѕРІ.",
    },
    {
        "slug": "dragons",
        "name": "РњР°С‚СЊ РґСЂР°РєРѕРЅРѕРІ",
        "min_players": 4,
        "max_players": 8,
        "description": "РРіСЂР° СЃ РґРѕРїРѕР»РЅРµРЅРёРµРј Mother of Dragons Рё РїРѕРґРґРµСЂР¶РєРѕР№ 8 РёРіСЂРѕРєРѕРІ.",
    },
]

GAME_MODE_RULES = [
    {
        "slug": "classic",
        "legacy_slug": "classic",
        "name": "РљР»Р°СЃСЃРёРєР°",
        "min_players": 3,
        "max_players": 6,
        "max_rounds": 10,
        "description": "Р‘Р°Р·РѕРІС‹Р№ СЂРµР¶РёРј РЅР°СЃС‚РѕР»СЊРЅРѕР№ РРіСЂС‹ РїСЂРµСЃС‚РѕР»РѕРІ.",
        "westeros_deck_count": 3,
        "allowed_factions": [],
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
        "legacy_slug": "quests",
        "name": "РџРёСЂ РІРѕСЂРѕРЅРѕРІ",
        "min_players": 4,
        "max_players": 4,
        "max_rounds": 7,
        "description": "РЎС†РµРЅР°СЂРёР№ РёР· РґРѕРїРѕР»РЅРµРЅРёСЏ Feast for Crows РґР»СЏ С‡РµС‚С‹СЂС‘С… РёРіСЂРѕРєРѕРІ.",
        "westeros_deck_count": 3,
        "allowed_factions": ["arryn", "stark", "lannister", "baratheon"],
        "required_factions": [],
        "factions_by_player_count": {},
    },
    {
        "slug": "dance_with_dragons",
        "legacy_slug": "alternative",
        "name": "РўР°РЅРµС† СЃ РґСЂР°РєРѕРЅР°РјРё",
        "min_players": 6,
        "max_players": 6,
        "max_rounds": 10,
        "description": "РЎС†РµРЅР°СЂРёР№ A Dance with Dragons РґР»СЏ РѕРїС‹С‚РЅС‹С… РёРіСЂРѕРєРѕРІ.",
        "westeros_deck_count": 3,
        "allowed_factions": [
            "stark",
            "lannister",
            "baratheon",
            "greyjoy",
            "tyrell",
            "martell",
        ],
        "required_factions": [],
        "factions_by_player_count": {},
    },
    {
        "slug": "mother_of_dragons",
        "legacy_slug": "dragons",
        "name": "РњР°С‚СЊ РґСЂР°РєРѕРЅРѕРІ",
        "min_players": 4,
        "max_players": 8,
        "max_rounds": 10,
        "description": "РРіСЂР° СЃ РґРѕРїРѕР»РЅРµРЅРёРµРј Mother of Dragons Рё РїРѕРґРґРµСЂР¶РєРѕР№ 8 РёРіСЂРѕРєРѕРІ.",
        "westeros_deck_count": 4,
        "allowed_factions": [],
        "required_factions": ["targaryen"],
        "factions_by_player_count": {},
    },
]


def _upsert_mode(mode_model, *, lookup_slug: str, target_slug: str, defaults: dict) -> None:
    mode = mode_model.objects.filter(slug=lookup_slug).first()
    if mode is None and lookup_slug != target_slug:
        mode = mode_model.objects.filter(slug=target_slug).first()

    if mode is None:
        mode_model.objects.create(slug=target_slug, **defaults)
        return

    for field, value in defaults.items():
        setattr(mode, field, value)
    mode.slug = target_slug
    mode.save()


def seed_forward_game_modes(apps, schema_editor) -> None:
    game_mode_model = apps.get_model("reference", "GameMode")

    for payload in GAME_MODE_RULES:
        defaults = {
            "name": payload["name"],
            "min_players": payload["min_players"],
            "max_players": payload["max_players"],
            "max_rounds": payload["max_rounds"],
            "description": payload["description"],
            "westeros_deck_count": payload["westeros_deck_count"],
            "allowed_factions": payload["allowed_factions"],
            "required_factions": payload["required_factions"],
            "factions_by_player_count": payload["factions_by_player_count"],
        }
        _upsert_mode(
            game_mode_model,
            lookup_slug=payload["legacy_slug"],
            target_slug=payload["slug"],
            defaults=defaults,
        )


def seed_reverse_game_modes(apps, schema_editor) -> None:
    game_mode_model = apps.get_model("reference", "GameMode")

    for payload in LEGACY_MODE_VALUES:
        defaults = {
            "name": payload["name"],
            "min_players": payload["min_players"],
            "max_players": payload["max_players"],
            "max_rounds": 10,
            "description": payload["description"],
            "westeros_deck_count": 3,
            "allowed_factions": [],
            "required_factions": [],
            "factions_by_player_count": {},
        }
        lookup_slug = next(
            (
                item["slug"]
                for item in GAME_MODE_RULES
                if item["legacy_slug"] == payload["slug"]
            ),
            payload["slug"],
        )
        _upsert_mode(
            game_mode_model,
            lookup_slug=lookup_slug,
            target_slug=payload["slug"],
            defaults=defaults,
        )


class Migration(migrations.Migration):

    dependencies = [
        ("reference", "0003_faction_on_primary_and_align_colors"),
    ]

    operations = [
        migrations.AddField(
            model_name="gamemode",
            name="allowed_factions",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="gamemode",
            name="factions_by_player_count",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name="gamemode",
            name="max_rounds",
            field=models.PositiveSmallIntegerField(default=10),
        ),
        migrations.AddField(
            model_name="gamemode",
            name="required_factions",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="gamemode",
            name="westeros_deck_count",
            field=models.PositiveSmallIntegerField(default=3),
        ),
        migrations.RunPython(seed_forward_game_modes, seed_reverse_game_modes),
    ]
