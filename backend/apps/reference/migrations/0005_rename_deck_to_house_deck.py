from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("reference", "0004_game_mode_rules"),
    ]

    operations = [
        migrations.RenameModel(
            old_name="Deck",
            new_name="HouseDeck",
        ),
    ]
