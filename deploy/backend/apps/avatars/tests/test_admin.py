from __future__ import annotations

from django.contrib.admin.sites import site

from apps.avatars.admin import AvatarAssetAdmin
from apps.avatars.models import AvatarAsset


def test_avatar_asset_model_is_registered_with_custom_admin() -> None:
    assert site.is_registered(AvatarAsset)
    assert isinstance(site._registry[AvatarAsset], AvatarAssetAdmin)


def test_avatar_asset_admin_has_expected_filters_and_search() -> None:
    admin_instance = site._registry[AvatarAsset]

    assert admin_instance.list_filter == ("style", "is_current", "faction")
    assert admin_instance.raw_id_fields == ("user",)
    assert admin_instance.autocomplete_fields == ("faction",)
