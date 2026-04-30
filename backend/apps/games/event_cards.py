"""Hardcoded Westeros event deck cards (ADR-0011).

Cards are fixed game rules — no DB table needed.
Slugs will be used for statistics and serialization.
Human-readable names live in the frontend i18n dictionary.

Card slugs come from the owner-provided WESTEROS_DECKS reference.
All decks have 10 cards.
"""
from __future__ import annotations

# fmt: off
_CLASSIC_DECK_1 = [
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

_CLASSIC_DECK_2 = [
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

_CLASSIC_DECK_3 = [
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

# Feast for Crows uses a special Deck 1
_FFC_DECK_1 = [
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

# Mother of Dragons exclusive 4th deck
_MOD_DECK_4 = [
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


WESTEROS_DECKS: dict[tuple[str, int], list[str]] = {
    ("classic", 1): _CLASSIC_DECK_1,
    ("classic", 2): _CLASSIC_DECK_2,
    ("classic", 3): _CLASSIC_DECK_3,
    ("feast_for_crows", 1): _FFC_DECK_1,
    ("feast_for_crows", 2): _CLASSIC_DECK_2,
    ("feast_for_crows", 3): _CLASSIC_DECK_3,
    ("dance_with_dragons", 1): _CLASSIC_DECK_1,
    ("dance_with_dragons", 2): _CLASSIC_DECK_2,
    ("dance_with_dragons", 3): _CLASSIC_DECK_3,
    ("mother_of_dragons", 1): _CLASSIC_DECK_1,
    ("mother_of_dragons", 2): _CLASSIC_DECK_2,
    ("mother_of_dragons", 3): _CLASSIC_DECK_3,
    ("mother_of_dragons", 4): _MOD_DECK_4,
}

WILDLINGS_OUTCOME_CARDS = ["raven", "horn", "feast", "frost"]


def get_decks_for_mode(mode_slug: str) -> list[dict]:
    """Return ordered list of decks for a given mode slug."""
    result = []
    deck_num = 1
    while (mode_slug, deck_num) in WESTEROS_DECKS:
        result.append({
            "deck_number": deck_num,
            "cards": [{"slug": s} for s in WESTEROS_DECKS[(mode_slug, deck_num)]],
        })
        deck_num += 1
    return result
