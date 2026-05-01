from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("games", "0005_rename_games_timeline_session_happened_idx_games_match_session_b17af8_idx_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="matchtimelineevent",
            name="kind",
            field=models.CharField(
                choices=[
                    ("session_started", "Session started"),
                    ("round_completed", "Round completed"),
                    ("wildlings_raid", "Wildlings raid"),
                    ("clash_of_kings", "Clash of kings"),
                    ("event_card_played", "Event card played"),
                    ("participant_removed", "Participant removed"),
                    ("participant_replaced", "Participant replaced"),
                    ("session_finalized", "Session finalized"),
                ],
                max_length=32,
            ),
        ),
    ]
