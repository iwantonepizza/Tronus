"""Hardcoded Westeros event deck cards (ADR-0011).

Cards are fixed game rules — no DB table needed.
Slugs will be used for statistics and serialization.
Human-readable names live in the frontend i18n dictionary.

Owner will supply the real card slugs; using placeholder slugs for now.
All decks have 10 cards.
"""
from __future__ import annotations

# fmt: off
_CLASSIC_DECK_1 = [
    "throne_of_blades",
    "muster",
    "supply",
    "clash_of_kings",
    "put_to_the_sword",
    "winter_is_coming",
    "wildlings_attack",
    "game_of_thrones",
    "rains_of_autumn",
    "the_last_days_of_summer",
]

_CLASSIC_DECK_2 = [
    "the_iron_throne",
    "a_feast_for_crows",
    "storm_of_swords",
    "clash_of_kings_2",
    "wildlings_attack_2",
    "muster_2",
    "supply_2",
    "game_of_thrones_2",
    "sea_of_storms",
    "the_long_summer",
]

_CLASSIC_DECK_3 = [
    "white_walkers",
    "dark_wings_dark_words",
    "clash_of_kings_3",
    "wildlings_attack_3",
    "put_to_the_sword_3",
    "sea_of_storms_3",
    "storm_of_swords_3",
    "game_of_thrones_3",
    "the_rains_of_castamere",
    "the_winds_of_winter",
]

# Feast for Crows uses a special Deck 1
_FFC_DECK_1 = [
    "a_feast_for_crows_ffc",
    "supply_ffc",
    "muster_ffc",
    "clash_of_kings_ffc",
    "put_to_the_sword_ffc",
    "wildlings_attack_ffc",
    "winter_is_coming_ffc",
    "game_of_thrones_ffc",
    "rains_of_autumn_ffc",
    "the_last_days_of_summer_ffc",
]

# Mother of Dragons exclusive 4th deck
_MOD_DECK_4 = [
    "mother_of_dragons",
    "fire_and_blood",
    "dracarys",
    "dance_of_dragons",
    "targaryens_wrath",
    "blood_of_my_blood",
    "shadow_dragon",
    "unburnt",
    "born_of_storm",
    "last_of_her_name",
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
