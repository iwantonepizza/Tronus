from __future__ import annotations

from pathlib import Path
from uuid import uuid4

from django.core.files.base import ContentFile
from django.db import transaction

from apps.accounts.models import Profile, User
from apps.reference.models import Faction

from .imaging import render_basic_avatar
from .models import AvatarAsset
from .validators import FORMAT_TO_EXTENSION, validate_image_file


def thumbnail_name_for(generated_image_name: str) -> str:
    path = Path(generated_image_name)
    return str(path.with_name(f"{path.stem}_thumb.png"))


def _set_current_avatar(*, profile: Profile, avatar: AvatarAsset | None) -> None:
    AvatarAsset.objects.filter(user=profile.user, is_current=True).update(is_current=False)

    update_fields = ["current_avatar", "updated_at"]
    profile.current_avatar = avatar
    profile.save(update_fields=update_fields)

    if avatar is not None and not avatar.is_current:
        avatar.is_current = True
        avatar.save(update_fields=["is_current", "updated_at"])


@transaction.atomic
def generate_basic_avatar(*, user: User, faction: Faction, photo_file) -> AvatarAsset:
    image_format = validate_image_file(photo_file)
    photo_file.seek(0)
    source_bytes = photo_file.read()

    generated_bytes, thumbnail_bytes = render_basic_avatar(
        photo_bytes=source_bytes,
        frame_color=faction.color,
    )

    asset_uuid = uuid4().hex
    avatar = AvatarAsset(
        user=user,
        faction=faction,
        style=AvatarAsset.Style.BASIC_FRAME,
        is_current=False,
    )
    avatar.source_photo.save(
        f"{asset_uuid}.{FORMAT_TO_EXTENSION[image_format]}",
        ContentFile(source_bytes),
        save=False,
    )
    avatar.generated_image.save(
        f"{asset_uuid}.png",
        ContentFile(generated_bytes),
        save=False,
    )
    avatar.save()

    avatar.generated_image.storage.save(
        thumbnail_name_for(avatar.generated_image.name),
        ContentFile(thumbnail_bytes),
    )

    return avatar


@transaction.atomic
def set_current_avatar(*, avatar: AvatarAsset) -> AvatarAsset:
    profile = avatar.user.profile
    _set_current_avatar(profile=profile, avatar=avatar)
    avatar.refresh_from_db()
    return avatar


@transaction.atomic
def delete_avatar(*, avatar: AvatarAsset) -> None:
    profile = avatar.user.profile
    if profile.current_avatar_id == avatar.pk:
        _set_current_avatar(profile=profile, avatar=None)

    storage = avatar.generated_image.storage
    generated_name = avatar.generated_image.name
    source_name = avatar.source_photo.name if avatar.source_photo else ""
    thumbnail_name = thumbnail_name_for(generated_name)

    avatar.delete()

    if source_name:
        storage.delete(source_name)
    storage.delete(generated_name)
    storage.delete(thumbnail_name)
