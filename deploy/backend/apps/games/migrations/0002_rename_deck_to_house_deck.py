import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("reference", "0006_house_decks_two_variants"),
        ("games", "0001_initial"),
    ]

    operations = [
        migrations.RenameField(
            model_name="gamesession",
            old_name="deck",
            new_name="house_deck",
        ),
        migrations.AlterField(
            model_name="gamesession",
            name="house_deck",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name="sessions",
                to="reference.housedeck",
            ),
        ),
    ]
