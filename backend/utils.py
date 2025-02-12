import requests
import urllib.parse
from type_matchups import get_strengths_and_weaknesses

POKEAPI_URL = "https://pokeapi.co/api/v2/pokemon/"
TCG_API_URL = "https://api.pokemontcg.io/v2/cards"
TCG_API_HEADERS = {"X-Api-Key": "32cf5b1e-8a85-42bc-8f67-de814b3894ed"}


def fetch_pokemon_data(pokemon_id_or_name):
    """Fetch Pokémon data from PokéAPI and calculate strengths/weaknesses dynamically."""
    response = requests.get(f"{POKEAPI_URL}{pokemon_id_or_name.lower()}")

    if response.status_code != 200:
        return None  # Pokémon not found

    data = response.json()

    # Extract Pokémon name and types
    name = data["name"]
    types = [t["type"]["name"].capitalize() for t in data["types"]]

    # ✅ Dynamically calculate strengths and weaknesses
    strengths, weaknesses = get_strengths_and_weaknesses(types)

    # ✅ Extract moves (limit to 4 moves for simplicity)
    moves = [move["move"]["name"].capitalize() for move in data["moves"][:4]]

    # ✅ Extract abilities
    abilities = [ability["ability"]["name"].capitalize() for ability in data["abilities"]]

    # ✅ Extract base stats
    stats = {stat["stat"]["name"]: stat["base_stat"] for stat in data["stats"]}

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
    }


def fetch_pokemon_tcg_card(pokemon_name):
    """Fetch Pokémon TCG card data by Pokémon name."""
    response = requests.get(f"{TCG_API_URL}?q=name:{pokemon_name}")

    if response.status_code != 200:
        return None

    data = response.json()

    if "data" not in data or not data["data"]:
        return None  # No matching card found

    card = data["data"][0]  # Take the first matching card
    return {
        "tcg_id": card.get("id"),
        "tcg_image_url": card.get("images", {}).get("large"),
        "tcg_set": card.get("set", {}).get("name"),
        "tcg_rarity": card.get("rarity"),
    }


def fetch_trainer_data(trainer_name: str):
    # Use a more generic query to get all trainer cards
    query = "supertype:Trainer"
    url = f"{TCG_API_URL}?q={query}"

    # Debug prints:
    print("Fetching trainer data with URL:", url)
    response = requests.get(url, headers=TCG_API_HEADERS)
    print("Status Code:", response.status_code)
    print("Response Text:", response.text)

    if response.status_code != 200:
        return None
    data = response.json()
    if "data" not in data or not data["data"]:
        return None  # No matching cards found

    # Now, filter the returned cards for one that matches the trainer_name
    for card in data["data"]:
        if trainer_name.lower() in card.get("name", "").lower():
            image_url = card.get("images", {}).get("large")
            if not image_url:
                return None  # Skip if no image available
            return {
                "name": card.get("name"),
                "tcg_id": card.get("id"),
                "tcg_image_url": image_url,
                "tcg_set": card.get("set", {}).get("name"),
                "tcg_rarity": card.get("rarity"),
                "effect": card.get("text", None)
            }
    return None


def fetch_energy_data(energy_type: str):
    encoded_type = urllib.parse.quote(energy_type)
    # Use a generic query for energy cards
    query = "supertype:Energy"
    url = f"{TCG_API_URL}?q={query}"

    print("Fetching energy data with URL:", url)
    response = requests.get(url, headers=TCG_API_HEADERS)
    print("Status Code:", response.status_code)
    print("Response Text:", response.text)

    if response.status_code != 200:
        return None
    data = response.json()
    if "data" not in data or not data["data"]:
        return None
    for card in data["data"]:
        # Filter cards that match the energy type in their name
        if energy_type.lower() in card.get("name", "").lower():
            image_url = card.get("images", {}).get("large")
            if not image_url:
                return None
            return {
                "name": card.get("name"),
                "tcg_id": card.get("id"),
                "tcg_image_url": image_url,
                "tcg_set": card.get("set", {}).get("name"),
                "tcg_rarity": card.get("rarity"),
                "energy_type": energy_type
            }
    return None
