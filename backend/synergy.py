"""
    This module provides a fun and simple way to calculate your deck's strength.
    It defines a function to compute a deck score based on the number of Pokémon,
    Trainer, and Energy cards. The idea is to give you a quick glimpse into how
    balanced and strong your deck is, using an easy-to-understand points system.
"""


def calculate_deck_score(pokemon_list, trainer_list, energy_list):
    """
        Calculates the deck's synergy score based on the number of Pokémon,
        Trainer, and Energy cards.

        Args:
            pokemon_list (list): List of Pokémon objects (or dicts) in the deck.
            trainer_list (list): List of Trainer objects (or dicts) in the deck.
            energy_list (list): List of Energy objects (or dicts) in the deck.

        Returns:
            int: The total deck score, computed as:
                 (10 * number_of_pokemon) + (5 * number_of_trainers) + (3 * number_of_energy).
    """

    pokemon_points = len(pokemon_list) * 10
    trainer_points = len(trainer_list) * 5
    energy_points = len(energy_list) * 3

    return pokemon_points + trainer_points + energy_points


if __name__ == "__main__":
    sample_pokemon = [{"id": 1}, {"id": 4}, {"id": 7}]
    sample_trainers = [{"name": "Tropical Wind"}, {"name": "Pokémon Fan Club"}]
    sample_energy = [{"name": "Fire Energy"}, {"name": "Water Energy"}]

    score = calculate_deck_score(sample_pokemon, sample_trainers, sample_energy)
    print("Your sample deck score is:", score)
