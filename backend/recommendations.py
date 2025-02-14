from synergy import calculate_deck_score


def generate_recommendations(pokemon_list, trainer_list, energy_list):
    """
    Based on your deck's composition, this function gives you simple
    recommendations to improve your deck's balance. Think of it like a
    little coach offering friendly advice!

    Recommendations are as follows:
      - If you don't have enough Energy cards compared to your Pokémon,
        it suggests adding more.
      - If you have no Trainer cards, it recommends adding at least one.
      - If your overall deck synergy score (a simple score based on the number
        of each card type) is below a certain threshold, it will suggest overall
        improvements.

    Args:
        pokemon_list (list): A list of Pokémon cards (each as a dictionary).
        trainer_list (list): A list of Trainer cards (each as a dictionary).
        energy_list (list): A list of Energy cards (each as a dictionary).

    Returns:
        list: A list of friendly recommendation strings.
    """
    recommendations = []

    # Calculate a basic synergy score using our simple function
    synergy_score = calculate_deck_score(pokemon_list, trainer_list, energy_list)

    # Friendly rules for recommendations:
    if len(energy_list) < len(pokemon_list) / 2:
        recommendations.append("It looks like you might need more Energy cards to"
                               " support your Pokémon!")

    if len(trainer_list) == 0:
        recommendations.append("Consider adding at least one Trainer card to boost"
                               " your deck's abilities.")

    if synergy_score < 50:
        recommendations.append(
            f"Your deck's synergy score is {synergy_score}, which is lower than the ideal"
            f" target of around 50. Consider adding more Energy or Trainer cards to "
            f"improve your deck's balance."
        )
    elif synergy_score >= 50:
        recommendations.append(
            f"Your deck's synergy score is {synergy_score}. That's a great start!"
            f" You might consider fine-tuning your deck further for even better balance."
        )

    if not recommendations:
        recommendations.append("Great job! Your deck seems well-balanced!")

    return recommendations


# For testing purposes:
if __name__ == "__main__":
    # Sample data for testing
    sample_pokemon = [{"id": 1}, {"id": 4}, {"id": 7}, {"id": 25}]
    sample_trainers = []
    sample_energy = [{"name": "Fire Energy"}, {"name": "Water Energy"},
                     {"name": "Grass Energy"}]

    recs = generate_recommendations(sample_pokemon, sample_trainers, sample_energy)
    print("Recommendations:")
    for rec in recs:
        print("-", rec)
