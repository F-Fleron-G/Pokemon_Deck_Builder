from synergy import calculate_deck_score
from utils import fetch_pokemon_data
from sqlalchemy.orm import Session
from database import SessionLocal
from models import DeckPokemon, DeckTrainer, DeckEnergy, Pokemon, Trainer, Energy
from type_matchups import type_chart

"""
    This module provides functions for generating deck recommendations based on the user's
    deck composition. It analyzes strengths, weaknesses, and overall deck synergy to suggest
    actionable improvements.
"""


def generate_recommendations(user_deck, db):
    """
       Generates a list of recommendations to improve the deck based on current composition.
       This function queries the database to fetch Pokémon, Trainer, and Energy cards in the deck,
       calculates the deck's synergy score, and identifies weaknesses. It then returns actionable
       suggestions, such as adding or replacing cards.
       Args:
           user_deck (Deck): The user's deck object.
           db (Session): The database session.
       Returns:
           list: A list of recommendation strings.
    """

    if not user_deck:
        return ["Your deck is empty! Start adding Pokémon!"]

    recommendations = []

    pokemon_entries = db.query(DeckPokemon).filter(DeckPokemon.deck_id == user_deck.id).all()
    trainer_entries = db.query(DeckTrainer).filter(DeckTrainer.deck_id == user_deck.id).all()
    energy_entries = db.query(DeckEnergy).filter(DeckEnergy.deck_id == user_deck.id).all()

    pokemon_list = db.query(Pokemon).filter(Pokemon.id.in_([entry.pokemon_id for entry in pokemon_entries])).all()
    trainer_list = db.query(Trainer).filter(Trainer.id.in_([entry.trainer_id for entry in trainer_entries])).all()
    energy_list = db.query(Energy).filter(Energy.id.in_([entry.energy_id for entry in energy_entries])).all()

    synergy_score = calculate_deck_score(pokemon_list, trainer_list, energy_list)

    weaknesses = {}
    for pokemon in pokemon_list:
        pokemon_data = fetch_pokemon_data(pokemon.id)
        if pokemon_data:
            for weak in pokemon_data["weaknesses"]:
                weaknesses[weak] = weaknesses.get(weak, 0) + 1

    for weak_type, count in weaknesses.items():
        strong_pokemon = fetch_pokemon_by_strength(weak_type)
        recommendations.append(f"Your deck has {count} Pokémon weak to {weak_type}."
                               f" Consider adding {strong_pokemon}.")

    if len(energy_list) < len(pokemon_list) / 2:
        recommendations.append("It looks like you might need more Energy cards to"
                               " support your Pokémon!")

    if len(trainer_list) == 0:
        recommendations.append("Consider adding at least one Trainer card to boost"
                               " your deck's abilities.")

    if synergy_score < 50:
        recommendations.append(
            f"Your deck's synergy score is {synergy_score}, which is lower than"
            f" the ideal target of 50. "
            f"Consider adjusting your Energy or Trainer cards for better balance."
        )
    else:
        recommendations.append(
            f"Your deck's synergy score is {synergy_score}. That's a great start! "
            f"You might consider fine-tuning your deck further for even better balance."
        )

    if not recommendations:
        recommendations.append("Great job! Your deck seems well-balanced!")

    return recommendations


def fetch_pokemon_by_strength(weak_type):
    """
        Finds a Pokémon that is strong against a specified weakness type.
        This function uses the type chart from 'type_matchups.py' and the
        fetch_pokemon_data() utility to return the name of a Pokémon type
        that counters the given weakness.
        Args:
            weak_type (str): The weakness type to counter.
        Returns:
            str: The name of a Pokémon that is strong against the given weakness.
    """

    strong_types = [
        p_type for p_type, matchups in type_chart.items() if weak_type in matchups["strong_against"]
    ]

    if not strong_types:
        return "No strong Pokémon found"

    for strong_type in strong_types:
        strong_pokemon_data = fetch_pokemon_data(strong_type)
        if strong_pokemon_data:
            return strong_pokemon_data["name"].capitalize()

    return "No strong Pokémon found"
