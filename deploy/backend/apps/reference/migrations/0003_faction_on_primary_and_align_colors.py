from django.core.validators import RegexValidator
from django.db import migrations, models

OLD_FACTION_COLORS = {
    "arryn": "#60A5FA",
    "baratheon": "#F59E0B",
    "greyjoy": "#111827",
    "lannister": "#B91C1C",
    "martell": "#D97706",
    "stark": "#9CA3AF",
    "targaryen": "#7F1D1D",
    "tyrell": "#15803D",
}

NEW_FACTION_COLORS = {
    "arryn": ("Аррены", "#8AAFC8", "#1A2A3A"),
    "baratheon": ("Баратеоны", "#F0B323", "#1A1A22"),
    "greyjoy": ("Грейджои", "#1C3B47", "#E0E6E8"),
    "lannister": ("Ланнистеры", "#9B2226", "#F5E6C8"),
    "martell": ("Мартеллы", "#C94E2A", "#F5E6C8"),
    "stark": ("Старки", "#6B7B8C", "#F0F0F0"),
    "targaryen": ("Таргариены", "#5B2D8A", "#E0D0F0"),
    "tyrell": ("Тиреллы", "#4B6B3A", "#F0E6D2"),
}


def align_faction_colors(apps, schema_editor) -> None:
    faction_model = apps.get_model("reference", "Faction")

    for slug, (name, color, on_primary) in NEW_FACTION_COLORS.items():
        faction_model.objects.update_or_create(
            slug=slug,
            defaults={
                "name": name,
                "color": color,
                "on_primary": on_primary,
                "is_active": True,
            },
        )


def restore_faction_colors(apps, schema_editor) -> None:
    faction_model = apps.get_model("reference", "Faction")

    for slug, color in OLD_FACTION_COLORS.items():
        faction_model.objects.filter(slug=slug).update(color=color)


class Migration(migrations.Migration):

    dependencies = [
        ("reference", "0002_seed_initial_data"),
    ]

    operations = [
        migrations.AddField(
            model_name="faction",
            name="on_primary",
            field=models.CharField(
                default="#FFFFFF",
                max_length=7,
                validators=[
                    RegexValidator(
                        regex=r"^#[0-9A-Fa-f]{6}$",
                        message="Color must be a HEX value like #AABBCC.",
                    )
                ],
            ),
            preserve_default=False,
        ),
        migrations.RunPython(align_faction_colors, restore_faction_colors),
    ]
