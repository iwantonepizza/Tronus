from __future__ import annotations

import pytest

from apps.avatars.models import AvatarAsset
from apps.avatars.services import delete_avatar, generate_basic_avatar, set_current_avatar


@pytest.mark.django_db
def test_generate_basic_avatar_creates_asset_and_files(
    avatar_media_root,
    make_user,
    ensure_faction,
    make_photo_file,
) -> None:
    user = make_user(email="arya@example.com")
    faction = ensure_faction()

    avatar = generate_basic_avatar(
        user=user,
        faction=faction,
        photo_file=make_photo_file(),
    )

    assert avatar.style == AvatarAsset.Style.BASIC_FRAME
    assert avatar.is_current is False
    assert avatar.source_photo.name.startswith(f"avatars/{user.pk}/sources/")
    assert avatar.generated_image.name.startswith(f"avatars/{user.pk}/")
    assert avatar_media_root.joinpath(avatar.source_photo.name).exists()
    assert avatar_media_root.joinpath(avatar.generated_image.name).exists()
    assert avatar_media_root.joinpath(
        avatar.generated_image.name.replace(".png", "_thumb.png")
    ).exists()


@pytest.mark.django_db
def test_generate_basic_avatar_rejects_oversized_upload(
    make_user,
    ensure_faction,
    make_photo_file,
) -> None:
    user = make_user(email="oversize@example.com")
    faction = ensure_faction()
    photo = make_photo_file()
    photo.size = (10 * 1024 * 1024) + 1

    with pytest.raises(Exception) as exc_info:
        generate_basic_avatar(user=user, faction=faction, photo_file=photo)

    assert "Изображение должно быть не больше 10 МБ." in str(exc_info.value)


@pytest.mark.django_db
def test_set_current_avatar_updates_profile_and_flags(
    avatar_media_root,
    make_user,
    ensure_faction,
    make_photo_file,
) -> None:
    user = make_user(email="bran@example.com")
    faction = ensure_faction()
    first = generate_basic_avatar(user=user, faction=faction, photo_file=make_photo_file())
    second = generate_basic_avatar(user=user, faction=faction, photo_file=make_photo_file())

    set_current_avatar(avatar=first)
    set_current_avatar(avatar=second)
    first.refresh_from_db()
    second.refresh_from_db()
    user.refresh_from_db()

    assert user.profile.current_avatar_id == second.pk
    assert first.is_current is False
    assert second.is_current is True


@pytest.mark.django_db
def test_delete_avatar_clears_current_profile_and_removes_files(
    avatar_media_root,
    make_user,
    ensure_faction,
    make_photo_file,
) -> None:
    user = make_user(email="jon@example.com")
    faction = ensure_faction()
    avatar = generate_basic_avatar(user=user, faction=faction, photo_file=make_photo_file())
    set_current_avatar(avatar=avatar)
    source_path = avatar_media_root.joinpath(avatar.source_photo.name)
    generated_path = avatar_media_root.joinpath(avatar.generated_image.name)
    thumb_path = avatar_media_root.joinpath(
        avatar.generated_image.name.replace(".png", "_thumb.png")
    )

    delete_avatar(avatar=avatar)
    user.refresh_from_db()

    assert AvatarAsset.objects.filter(pk=avatar.pk).exists() is False
    assert user.profile.current_avatar is None
    assert source_path.exists() is False
    assert generated_path.exists() is False
    assert thumb_path.exists() is False
