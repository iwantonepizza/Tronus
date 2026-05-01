"""Wave 11 / T-173: cleanup orphan Participation rows on planned sessions.

ADR-0019 mandates that ``Participation`` is created only at ``start_session``.
Pre-Wave-11 frontend (CreateSessionPage / EditSessionPage) created
Participation rows during planning, which now collides with start_session
when it tries to bulk_create new ones.

This idempotent management command:
- Finds sessions in ``status='planned'`` with at least one Participation.
- Optionally converts each Participation into a SessionInvite with
  rsvp_status='maybe' and the same desired_faction (so the planning roster
  is preserved for the user).
- Deletes the orphan Participation rows.

Run on prod once after deploying Wave 11:

    docker compose exec backend python manage.py cleanup_orphan_participations

Re-running is a no-op once it's clean.
"""

from __future__ import annotations

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.games.models import GameSession, Participation, SessionInvite


class Command(BaseCommand):
    help = (
        "Clean up Participation rows that exist on planned sessions "
        "(legacy data from pre-Wave-11 CreateSessionPage flow). "
        "Converts them to SessionInvite(rsvp_status=maybe) before delete."
    )

    def add_arguments(self, parser) -> None:
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Print what would happen without writing anything.",
        )
        parser.add_argument(
            "--keep",
            action="store_true",
            help="Do not convert to invites, just delete orphan participations.",
        )

    def handle(self, *args, **options) -> None:
        dry_run: bool = options["dry_run"]
        keep_only: bool = options["keep"]

        affected_session_ids = list(
            Participation.objects.filter(session__status=GameSession.Status.PLANNED)
            .values_list("session_id", flat=True)
            .distinct()
        )
        affected_count = len(affected_session_ids)

        if affected_count == 0:
            self.stdout.write(
                self.style.SUCCESS("No orphan participations found. Nothing to do.")
            )
            return

        self.stdout.write(
            self.style.WARNING(
                f"Found orphan Participations on {affected_count} planned session(s)."
            )
        )

        converted = 0
        deleted = 0

        for session_id in affected_session_ids:
            with transaction.atomic():
                session = GameSession.objects.select_for_update().get(pk=session_id)
                if session.status != GameSession.Status.PLANNED:
                    continue

                participations = list(
                    Participation.objects.select_for_update()
                    .filter(session=session)
                    .select_related("faction")
                )

                for p in participations:
                    if not keep_only:
                        # Convert to SessionInvite if not already invited
                        existing = SessionInvite.objects.filter(
                            session=session, user_id=p.user_id
                        ).first()
                        if existing is None:
                            self.stdout.write(
                                f"  session #{session.pk} — converting user_id={p.user_id} "
                                f"(faction={p.faction.slug}) → invite (maybe)"
                            )
                            if not dry_run:
                                SessionInvite.objects.create(
                                    session=session,
                                    user_id=p.user_id,
                                    invited_by=session.created_by,
                                    desired_faction=p.faction,
                                    rsvp_status=SessionInvite.RsvpStatus.MAYBE,
                                )
                            converted += 1
                        else:
                            self.stdout.write(
                                f"  session #{session.pk} — user_id={p.user_id} "
                                f"already has invite, skipping conversion"
                            )

                self.stdout.write(
                    f"  session #{session.pk} — deleting "
                    f"{len(participations)} orphan participation(s)"
                )
                if not dry_run:
                    deleted_count, _ = Participation.objects.filter(
                        session=session
                    ).delete()
                    deleted += deleted_count
                else:
                    deleted += len(participations)

        verb = "would" if dry_run else "did"
        self.stdout.write(
            self.style.SUCCESS(
                f"{verb} convert {converted} participation(s) to invites and "
                f"delete {deleted} participation(s)."
            )
        )
