from synergy import calculate_deck_score
from utils import fetch_pokemon_data, fetch_trainer_data, fetch_energy_data
from sqlalchemy.orm import Session
from database import SessionLocal
from models import DeckPokemon, DeckTrainer, DeckEnergy, Pokemon, Trainer, Energy
from type_matchups import type_chart, get_strengths_and_weaknesses
from sqlalchemy import and_
import random
import requests

"""
    This file returns recommendations in a structured format (list of dicts).
    For example:
    [
      {
        "type": "pokemon",
        "name": "Charizard",
        "tcg_image_url": "https://img.pokemondb.net/artwork/large/charizard.jpg",
        "message": "Your deck has 2 Pokémon weak to Grass. Consider adding Charizard!"
      },
      ...
    ]

    Key points:
      - We do not call fetch_pokemon_tcg_card() for recommended Pokémon.
        Instead, we use official PokemonDB images.
      - This 'Option A' approach shows TCG images for trainers and energies
        you already have in your deck, but recommended Pokémon use PokemonDB art.
"""


def generate_recommendations(user_deck, db: Session):
    """
    Generates a list of recommendation objects to improve the deck, using:
      - PokemonDB images for recommended Pokémon
      - Basic logic for trainers, energy, synergy score
    """
    if not user_deck:
        return [{
            "type": "info",
            "name": "No Deck",
            "image_url": "",
            "message": "Your deck is empty! Start adding Pokémon."
        }]

    recommendations = []

    pokemon_entries = (db.query(DeckPokemon)
                       .filter(and_(DeckPokemon.deck_id == user_deck.id)).all())
    trainer_entries = (db.query(DeckTrainer)
                       .filter(and_(DeckTrainer.deck_id == user_deck.id)).all())
    energy_entries = (db.query(DeckEnergy)
                      .filter(and_(DeckEnergy.deck_id == user_deck.id)).all())

    pokemon_list = (db.query(Pokemon)
                    .filter(Pokemon.id.in_([entry.pokemon_id for entry in pokemon_entries])).all())
    trainer_list = (db.query(Trainer)
                    .filter(Trainer.id.in_([entry.trainer_id for entry in trainer_entries])).all())
    energy_list = (db.query(Energy)
                   .filter(Energy.id.in_([entry.energy_id for entry in energy_entries])).all())

    deck_score = calculate_deck_score(pokemon_list, trainer_list, energy_list)

    deck_types = [fetch_pokemon_data(p.id).get("types", []) for p in pokemon_list]
    flat_types = [t for sublist in deck_types for t in sublist]
    strengths, weaknesses = get_strengths_and_weaknesses(flat_types)
    weaknesses_count = {w: weaknesses.count(w) for w in set(weaknesses)}

    for weak_type, count in weaknesses_count.items():
        strong_pokemon = fetch_pokemon_by_strength(weak_type)
        if strong_pokemon and strong_pokemon["name"] != "No strong Pokémon found":
            rec_obj = {
                "id": strong_pokemon["id"],
                "type": "pokemon",
                "name": strong_pokemon["name"],
                "tcg_image_url": f"https://img.pokemondb.net/artwork/large/{strong_pokemon['name'].lower()}.jpg",
                "message": f"Your deck has {count} Pokémon weak to {weak_type}. Consider adding {strong_pokemon['name']}!"
            }
            recommendations.append(rec_obj)

    cached_trainers = db.query(Trainer).all()
    deck_trainer_names = {t.name.lower() for t in trainer_list}
    for trainer in cached_trainers:
        if trainer.name.lower() not in deck_trainer_names:
            recommendations.append({
                "type": "trainer",
                "name": trainer.name,
                "tcg_image_url": trainer.tcg_image_url,
                "message": f"Consider adding {trainer.name} to improve your deck!"
            })

    cached_energy = db.query(Energy).all()
    deck_energy_names = {e.name.lower() for e in energy_list}
    for energy in cached_energy:
        if energy.name.lower() not in deck_energy_names:
            recommendations.append({
                "type": "energy",
                "name": energy.name,
                "tcg_image_url": energy.tcg_image_url,
                "message": f"Consider adding more {energy.name} for better balance!"
            })

    if deck_score < 50:
        recommendations.append({
            "type": "info",
            "name": "Low Synergy",
            "tcg_image_url": "",
            "message": f"Your deck score is {deck_score}. Try balancing your Pokémon, Trainers, and Energy."
        })
    else:
        recommendations.append({
            "type": "info",
            "name": "Deck Score",
            "tcg_image_url": "",
            "message": f"Your deck score is {deck_score}. Nice job!"
        })

    if not recommendations:
        recommendations.append({
            "type": "info",
            "name": "No Suggestions",
            "tcg_image_url": "",
            "message": "Your deck seems balanced already!"
        })

    return recommendations


pokemon_with_images_cache = set()


def has_valid_image(pokemon_name):
    """
        Check if a Pokémon has an image in PokémonDB.
        Uses caching to prevent repeated slow requests.
    """

    image_url = f"https://img.pokemondb.net/artwork/large/{pokemon_name.lower()}.jpg"

    if pokemon_name in pokemon_with_images_cache:
        return True

    response = requests.head(image_url, timeout=3)
    if response.status_code == 200:
        pokemon_with_images_cache.add(pokemon_name)
        return True
    return False


def fetch_pokemon_by_strength(weak_type: str):
    """
        Fetch a random Pokémon that is strong against the given 'weak_type'.
        Ensures that only Pokémon with a valid image in PokémonDB are selected.
    """
    strong_types = [
        p_type for p_type, matchups in type_chart.items() if weak_type in matchups["weak_to"]
    ]

    if not strong_types:
        return {"name": "No strong Pokémon found", "id": None}

    chosen_type = random.choice(strong_types)

    pokeapi_url = f"https://pokeapi.co/api/v2/type/{chosen_type.lower()}/"
    response = requests.get(pokeapi_url, timeout=5)

    if response.status_code != 200:
        return {"name": "No strong Pokémon found", "id": None}

    data = response.json()
    all_pokemon = [
        {
            "name": p["pokemon"]["name"].capitalize(),
            "id": int(p["pokemon"]["url"].split("/")[-2])
        }
        for p in data["pokemon"]
    ]

    valid_pokemon = [p for p in all_pokemon if has_valid_image(p["name"])]

    if not valid_pokemon:
        return {"name": "Garchomp", "id": 445}

    selected_pokemon = random.choice(valid_pokemon)
    return selected_pokemon
