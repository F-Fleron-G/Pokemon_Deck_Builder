import requests

POKEAPI_BASE_URL = "https://pokeapi.co/api/v2/pokemon"


def fetch_pokemon_data(pokemon_name: str):
    """Fetch Pokémon data from PokéAPI."""
    url = f"{POKEAPI_BASE_URL}/{pokemon_name.lower()}"
    response = requests.get(url)

    if response.status_code != 200:
        return None

    data = response.json()

    return {
        "id": data["id"],
        "name": data["name"],
        "types": [t["type"]["name"] for t in data["types"]],
        "abilities": [a["ability"]["name"] for a in data["abilities"]],
        "base_experience": data["base_experience"],
        "stats": {stat["stat"]["name"]: stat["base_stat"] for stat in data["stats"]},
    }
