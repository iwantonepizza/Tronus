from __future__ import annotations

from apps.games.event_cards import WESTEROS_DECKS, get_decks_for_mode


def test_classic_westeros_decks_use_owner_card_slugs() -> None:
    decks = get_decks_for_mode("classic")

    assert [deck["deck_number"] for deck in decks] == [1, 2, 3]
    assert [card["slug"] for card in decks[0]["cards"]] == [
        "supply",
        "supply",
        "supply",
        "muster",
        "muster",
        "muster",
        "throne_of_blades",
        "throne_of_blades",
        "winter_is_coming",
        "the_last_days_of_summer",
    ]
    assert [card["slug"] for card in decks[1]["cards"]] == [
        "clash_of_kings",
        "clash_of_kings",
        "clash_of_kings",
        "game_of_thrones",
        "game_of_thrones",
        "game_of_thrones",
        "dark_wings_dark_words",
        "dark_wings_dark_words",
        "winter_is_coming",
        "the_last_days_of_summer",
    ]
    assert [card["slug"] for card in decks[2]["cards"]] == [
        "wildlings_attack",
        "wildlings_attack",
        "wildlings_attack",
        "sea_of_storms",
        "rains_of_autumn",
        "a_feast_for_crows",
        "web_of_lies",
        "storm_of_swords",
        "put_to_the_sword",
        "put_to_the_sword",
    ]


def test_special_mode_decks_reuse_or_extend_owner_card_lists() -> None:
    feast_decks = get_decks_for_mode("feast_for_crows")
    mother_of_dragons_decks = get_decks_for_mode("mother_of_dragons")

    assert [card["slug"] for card in feast_decks[0]["cards"]] == [
        "famine",
        "muster_ffc",
        "ironborn_raid",
        "new_information",
        "rally_the_men",
        "rally_the_men",
        "shifting_ambitions",
        "shifting_ambitions",
        "the_burden_of_power",
        "the_burden_of_power",
    ]
    assert WESTEROS_DECKS[("feast_for_crows", 2)] == WESTEROS_DECKS[("classic", 2)]
    assert WESTEROS_DECKS[("feast_for_crows", 3)] == WESTEROS_DECKS[("classic", 3)]
    assert [deck["deck_number"] for deck in mother_of_dragons_decks] == [1, 2, 3, 4]
    assert [card["slug"] for card in mother_of_dragons_decks[3]["cards"]] == [
        "domestic_disputes",
        "empty_promises",
        "fire_made_flesh",
        "playing_with_fire",
        "scattering_dissent",
        "southron_ambitions",
        "strongholds_of_resistance",
        "the_long_plan",
        "watering_the_seed",
        "word_spreads_quickly",
    ]
