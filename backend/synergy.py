def calculate_deck_score(pokemon_list, trainer_list, energy_list):
    """
    Calculate your deck's score in a fun and simple way.

    Think of it like this:
    - Every Pokémon card in your deck gives you 10 points.
    - Every Trainer card adds 5 points.
    - Every Energy card gives you an extra 3 points.

    This way, you can quickly see how balanced and strong your deck is!

    Args:
        pokemon_list (list): A list of Pokémon cards (each as a dictionary).
        trainer_list (list): A list of Trainer cards (each as a dictionary).
        energy_list (list): A list of Energy cards (each as a dictionary).

    Returns:
        int: The total score of your deck.
    """
    pokemon_points = len(pokemon_list) * 10
    trainer_points = len(trainer_list) * 5
    energy_points = len(energy_list) * 3

    return pokemon_points + trainer_points + energy_points


# For testing the function directly:
if __name__ == "__main__":
    sample_pokemon = [{"id": 1}, {"id": 4}, {"id": 7}]
    sample_trainers = [{"name": "Tropical Wind"}, {"name": "Pokémon Fan Club"}]
    sample_energy = [{"name": "Fire Energy"}, {"name": "Water Energy"}]

    score = calculate_deck_score(sample_pokemon, sample_trainers, sample_energy)
    print("Your sample deck score is:", score)
