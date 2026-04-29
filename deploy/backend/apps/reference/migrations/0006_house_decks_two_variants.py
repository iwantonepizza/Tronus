from django.db import migrations

HOUSE_DECKS = {
    "original": {
        "name": "Оригинальная",
        "description": "Базовые колоды домов из основной игры.",
    },
    "alternative": {
        "name": "Альтернативная",
        "description": "Альтернативные колоды домов для расширенных сценариев и хоумрулов.",
    },
}

LEGACY_HOUSE_DECKS = {
    "original": {
        "name": "Оригинальная",
        "description": "Базовые колоды домов из основной игры.",
    },
    "expansion_a": {
        "name": "Дополнение A",
        "description": "Дополнительная колода для расширенных сценариев.",
    },
    "expansion_b": {
        "name": "Дополнение B",
        "description": "Альтернативная колода для дополнений и домашних правил.",
    },
}


def seed_house_decks_forward(apps, schema_editor) -> None:
    house_deck_model = apps.get_model("reference", "HouseDeck")

    original = house_deck_model.objects.filter(slug="original").first()
    alternative = house_deck_model.objects.filter(slug="alternative").first()

    if original is None:
        original = house_deck_model.objects.create(
            slug="original",
            **HOUSE_DECKS["original"],
        )
    else:
        original.name = HOUSE_DECKS["original"]["name"]
        original.description = HOUSE_DECKS["original"]["description"]
        original.save(update_fields=["name", "description"])

    if alternative is None:
        expansion_b = house_deck_model.objects.filter(slug="expansion_b").first()
        candidate = expansion_b or house_deck_model.objects.filter(slug="expansion_a").first()
        if candidate is None:
            house_deck_model.objects.create(slug="alternative", **HOUSE_DECKS["alternative"])
        else:
            candidate.slug = "alternative"
            candidate.name = HOUSE_DECKS["alternative"]["name"]
            candidate.description = HOUSE_DECKS["alternative"]["description"]
            candidate.save(update_fields=["slug", "name", "description"])
    else:
        alternative.name = HOUSE_DECKS["alternative"]["name"]
        alternative.description = HOUSE_DECKS["alternative"]["description"]
        alternative.save(update_fields=["name", "description"])

    house_deck_model.objects.filter(slug="expansion_a").delete()
    house_deck_model.objects.filter(slug="expansion_b").delete()


def seed_house_decks_reverse(apps, schema_editor) -> None:
    house_deck_model = apps.get_model("reference", "HouseDeck")

    original = house_deck_model.objects.filter(slug="original").first()
    if original is None:
        house_deck_model.objects.create(slug="original", **LEGACY_HOUSE_DECKS["original"])
    else:
        original.name = LEGACY_HOUSE_DECKS["original"]["name"]
        original.description = LEGACY_HOUSE_DECKS["original"]["description"]
        original.save(update_fields=["name", "description"])

    alternative = house_deck_model.objects.filter(slug="alternative").first()
    if alternative is None:
        house_deck_model.objects.create(slug="expansion_b", **LEGACY_HOUSE_DECKS["expansion_b"])
    else:
        alternative.slug = "expansion_b"
        alternative.name = LEGACY_HOUSE_DECKS["expansion_b"]["name"]
        alternative.description = LEGACY_HOUSE_DECKS["expansion_b"]["description"]
        alternative.save(update_fields=["slug", "name", "description"])

    house_deck_model.objects.update_or_create(
        slug="expansion_a",
        defaults=LEGACY_HOUSE_DECKS["expansion_a"],
    )


class Migration(migrations.Migration):

    dependencies = [
        ("reference", "0005_rename_deck_to_house_deck"),
    ]

    operations = [
        migrations.RunPython(seed_house_decks_forward, seed_house_decks_reverse),
    ]
