import requests
import urllib.parse
from type_matchups import get_strengths_and_weaknesses
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Pokemon, Trainer, Energy
from functools import lru_cache


"""
    This module contains utility functions for fetching Pokémon data from the
    PokéAPI and TCG card data from the Pokémon TCG API. It also uses type match-up
    information (from type_matchups.py) to calculate strengths and weaknesses,
    so you can easily build a well-balanced deck.
"""


POKEAPI_URL = "https://pokeapi.co/api/v2/pokemon/"
TCG_API_URL = "https://api.pokemontcg.io/v2/cards"
TCG_API_HEADERS = {"X-Api-Key": "32cf5b1e-8a85-42bc-8f67-de814b3894ed"}


def fetch_pokemon_data(pokemon_id_or_name):
    """
        Fetches Pokémon data from the PokéAPI and calculates its strengths and
        weaknesses. This function retrieves the Pokémon details by ID or name,
        processes the data to extract the Pokémon's name, types, moves, abilities,
        stats, and calculates its strengths and weaknesses using our type match-up
        helper.
        Args:
            pokemon_id_or_name (int or str): The Pokémon's ID or name to fetch.
        Returns:
            dict: A dictionary containing Pokémon details including a nicely formatted
            image URL (using PokémonDB.net), or None if the Pokémon is not found.
    """

    response = requests.get(f"{POKEAPI_URL}{str(pokemon_id_or_name).lower()}")

    if response.status_code != 200:
        return None

    data = response.json()

    name = data["name"]
    types = [t["type"]["name"].capitalize() for t in data["types"]]
    strengths, weaknesses = get_strengths_and_weaknesses(types)
    moves = [move["move"]["name"].capitalize() for move in data["moves"][:4]]
    abilities = [ability["ability"]["name"].capitalize()
                 for ability in data["abilities"]]
    stats = {stat["stat"]["name"]: stat["base_stat"] for stat in data["stats"]}
    print(f"DEBUG: {name} - Types: {types} - Strengths: {strengths} - Weaknesses: {weaknesses}")

    return {
        "id": data["id"],
        "name": name,
        "types": types,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "moves": moves,
        "abilities": abilities,
        "hp": stats.get("hp", 0),
        "attack": stats.get("attack", 0),
        "defense": stats.get("defense", 0),
        "special_attack": stats.get("special-attack", 0),
        "special_defense": stats.get("special-defense", 0),
        "speed": stats.get("speed", 0),
        "image_url":
            f"https://img.pokemondb.net/artwork/large/{data['name'].lower()}.jpg"
    }


def fetch_pokemon_tcg_card(pokemon_name):
    """
        Fetches Pokémon TCG card data based on the given Pokémon name.
        This function queries the TCG API using the Pokémon's name and returns key TCG
        card details such as the TCG ID, image URL, set name, and rarity.
        Args:
            pokemon_name (str): The name of the Pokémon for which to fetch TCG card data.
        Returns:
            dict: A dictionary with TCG card details, or None if no data is found.
    """

    response = requests.get(f"{TCG_API_URL}?q=name:{pokemon_name}")

    if response.status_code != 200:
        return None

    data = response.json()

    if "data" not in data or not data["data"]:
        return None

    card = data["data"][0]
    return {
        "tcg_id": card.get("id"),
        "tcg_image_url": card.get("images", {}).get("large"),
        "tcg_set": card.get("set", {}).get("name"),
        "tcg_rarity": card.get("rarity"),
    }


def fetch_trainer_data(trainer_name: str):
    """
        Fetches Trainer card data from the TCG API for the given trainer name.
        It sends a request to the TCG API and filters the results based on the
        provided trainer name.
        Only Trainer cards with available images are returned.
        Args:
            trainer_name (str): The name (or partial name) of the Trainer card to
            search for.
        Returns:
            list: A list of dictionaries containing trainer card details, or None if
            no matches are found.
    """

    query = "supertype:Trainer"
    url = f"{TCG_API_URL}?q={query}&pageSize=250"
    print("Fetching trainer data with URL:", url)
    response = requests.get(url, headers=TCG_API_HEADERS)
    print("Status Code:", response.status_code)
    print("Response Text:", response.text)
    if response.status_code != 200:
        return None
    data = response.json()
    if "data" not in data or not data["data"]:
        return None
    matches = []
    for card in data["data"]:
        if trainer_name.lower() in card.get("name", "").lower():
            image_url = card.get("images", {}).get("large")
            if image_url:
                matches.append({
                    "name": card.get("name"),
                    "tcg_id": card.get("id"),
                    "tcg_image_url": image_url,
                    "tcg_set": card.get("set", {}).get("name"),
                    "tcg_rarity": card.get("rarity"),
                    "effect": card.get("text", None)
                })
    return matches if matches else None


def fetch_energy_data(energy_type: str):
    """
        Fetches Energy card data from the TCG API based on the provided energy type.
        The function requests Energy cards from the TCG API and filters them based on
        the energy type.
        It returns only those Energy cards that have an associated image.
        Args:
            energy_type (str): The type of Energy card to search for.
        Returns:
            list: A list of dictionaries with Energy card details, or None if no
            matching cards are found.
    """

    query = "supertype:Energy"
    url = f"{TCG_API_URL}?q={query}&pageSize=250"
    print("Fetching energy data with URL:", url)
    response = requests.get(url, headers=TCG_API_HEADERS)
    print("Status Code:", response.status_code)
    print("Response Text:", response.text)
    if response.status_code != 200:
        return None
    data = response.json()
    if "data" not in data or not data["data"]:
        return None
    matches = []
    for card in data["data"]:
        if energy_type.lower() in " ".join(card.get("subtypes", [])).lower():
            image_url = card.get("images", {}).get("large")
            if image_url:
                matches.append({
                    "name": card.get("name"),
                    "tcg_id": card.get("id"),
                    "tcg_image_url": image_url,
                    "tcg_set": card.get("set", {}).get("name"),
                    "tcg_rarity": card.get("rarity"),
                    "energy_type": card.get("subtypes", [])[0] if card.get("subtypes") else ""
                })
    return matches if matches else None
