from __future__ import annotations

from django.contrib.admin.sites import site

from apps.ratings.admin import MatchVoteAdmin
from apps.ratings.models import MatchVote


def test_match_vote_model_is_registered_with_custom_admin() -> None:
    assert site.is_registered(MatchVote)
    assert isinstance(site._registry[MatchVote], MatchVoteAdmin)


def test_match_vote_admin_has_expected_filters_and_search() -> None:
    admin_instance = site._registry[MatchVote]

    assert admin_instance.list_filter == ("vote_type", "created_at")
    assert admin_instance.raw_id_fields == ("session", "from_user", "to_user")
    assert admin_instance.date_hierarchy == "created_at"
