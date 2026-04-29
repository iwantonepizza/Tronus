from __future__ import annotations

from django.contrib.auth.models import Group
from django.db import transaction
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from .models import Profile, User


@receiver(post_save, sender=User)
def create_profile_for_user(
    sender,
    instance: User,
    created: bool,
    **kwargs,
) -> None:
    if not created:
        return

    Profile.objects.get_or_create(
        user=instance,
        defaults={"nickname": instance.username},
    )


@receiver(pre_save, sender=User)
def cache_user_previous_is_active(
    sender,
    instance: User,
    **kwargs,
) -> None:
    if instance.pk is None:
        instance._previous_is_active = None
        return

    instance._previous_is_active = (
        sender.objects.filter(pk=instance.pk).values_list("is_active", flat=True).first()
    )


@receiver(post_save, sender=User)
def ensure_profile_and_player_group_on_activation(
    sender,
    instance: User,
    created: bool,
    **kwargs,
) -> None:
    previous_is_active = getattr(instance, "_previous_is_active", None)
    activated = not created and previous_is_active is False and instance.is_active is True

    if not activated:
        return

    with transaction.atomic():
        Profile.objects.get_or_create(
            user=instance,
            defaults={"nickname": instance.username},
        )
        player_group, _ = Group.objects.get_or_create(name="player")
        instance.groups.add(player_group)
