"""Fix cp1251→utf-8 mojibake in GameMode names/descriptions on existing databases.

The original migration ``0004_game_mode_rules`` shipped with strings that were
double-encoded (cp1251 bytes interpreted as latin-1, then re-encoded as utf-8).
That migration is now corrected for fresh deploys, but databases that already
ran the broken version still hold the corrupted strings. This data migration
detects the mojibake and rewrites those rows in place. Idempotent: rows that
already look correct are left alone.
"""
from __future__ import annotations

from django.db import migrations

CORRECT_BY_SLUG = {
    "classic": {
        "name": "Классика",
        "description": "Базовый режим настольной Игры престолов.",
    },
    "feast_for_crows": {
        "name": "Пир воронов",
        "description": "Сценарий из дополнения Feast for Crows для четырёх игроков.",
    },
    "dance_with_dragons": {
        "name": "Танец с драконами",
        "description": "Сценарий A Dance with Dragons для опытных игроков.",
    },
    "mother_of_dragons": {
        "name": "Мать драконов",
        "description": "Игра с дополнением Mother of Dragons и поддержкой 8 игроков.",
    },
    # Legacy slugs (in case 0004 forward step never ran on this DB)
    "quests": {
        "name": "Пир воронов",
        "description": "Сценарий из дополнения Feast for Crows для четырёх игроков.",
    },
    "alternative": {
        "name": "Танец с драконами",
        "description": "Сценарий A Dance with Dragons для опытных игроков.",
    },
    "dragons": {
        "name": "Мать драконов",
        "description": "Игра с дополнением Mother of Dragons и поддержкой 8 игроков.",
    },
}


def _looks_like_mojibake(value: str) -> bool:
    """Return True if ``value`` contains the cp1251→utf-8 mojibake marker.

    The lowercase Cyrillic 'р' (U+0440) preceded by uppercase 'Р' (U+0420)
    is the textbook signature of cp1251 bytes interpreted as utf-8.
    """
    if not value:
        return False
    return "Р" in value and any(ch in value for ch in "Р°РёР»СЂСЃ")


def fix_mode_encoding_forward(apps, schema_editor) -> None:
    GameMode = apps.get_model("reference", "GameMode")
    for mode in GameMode.objects.all():
        canonical = CORRECT_BY_SLUG.get(mode.slug)
        if canonical is None:
            continue
        # Only rewrite fields that look mojibake — preserve any manual edits.
        dirty: list[str] = []
        if _looks_like_mojibake(mode.name):
            mode.name = canonical["name"]
            dirty.append("name")
        if _looks_like_mojibake(mode.description):
            mode.description = canonical["description"]
            dirty.append("description")
        if dirty:
            dirty.append("updated_at")
            mode.save(update_fields=dirty)


def fix_mode_encoding_reverse(apps, schema_editor) -> None:
    # No-op reverse: we don't want to put the mojibake back.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("reference", "0007_localize_hex_color_validator"),
    ]

    operations = [
        migrations.RunPython(fix_mode_encoding_forward, fix_mode_encoding_reverse),
    ]
