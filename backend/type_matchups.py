"""
    This module provides the type match-up information for Pokémon.
    It defines a type chart that maps each Pokémon type to the types it is weak to
    and strong against.
    Additionally, it includes a helper function to calculate the overall strengths
    and weaknesses based on a list of Pokémon types.
"""


type_chart = {
    "Normal": {"weak_to": ["Fighting"], "strong_against": []},
    "Fire": {"weak_to": ["Water", "Rock", "Ground"],
             "strong_against": ["Grass", "Bug", "Ice", "Steel"]},
    "Water": {"weak_to": ["Electric", "Grass"],
              "strong_against": ["Fire", "Ground", "Rock"]},
    "Electric": {"weak_to": ["Ground"], "strong_against": ["Water", "Flying"]},
    "Grass": {"weak_to": ["Fire", "Ice", "Poison", "Flying", "Bug"],
              "strong_against": ["Water", "Ground", "Rock"]},
    "Ice": {"weak_to": ["Fire", "Fighting", "Rock", "Steel"],
            "strong_against": ["Grass", "Ground", "Flying", "Dragon"]},
    "Fighting": {"weak_to": ["Flying", "Psychic", "Fairy"],
                 "strong_against": ["Normal", "Ice", "Rock", "Dark", "Steel"]},
    "Poison": {"weak_to": ["Ground", "Psychic"],
               "strong_against": ["Grass", "Fairy"]},
    "Ground": {"weak_to": ["Water", "Grass", "Ice"],
               "strong_against": ["Fire", "Electric", "Poison", "Rock", "Steel"]},
    "Flying": {"weak_to": ["Electric", "Ice", "Rock"],
               "strong_against": ["Grass", "Fighting", "Bug"]},
    "Psychic": {"weak_to": ["Bug", "Ghost", "Dark"],
                "strong_against": ["Fighting", "Poison"]},
    "Bug": {"weak_to": ["Fire", "Flying", "Rock"],
            "strong_against": ["Grass", "Psychic", "Dark"]},
    "Rock": {"weak_to": ["Water", "Grass", "Fighting",
                         "Ground", "Steel"], "strong_against": ["Fire", "Ice", "Flying", "Bug"]},
    "Ghost": {"weak_to": ["Ghost", "Dark"],
              "strong_against": ["Psychic", "Ghost"]},
    "Dragon": {"weak_to": ["Ice", "Dragon", "Fairy"],
               "strong_against": ["Dragon"]},
    "Dark": {"weak_to": ["Fighting", "Bug", "Fairy"],
             "strong_against": ["Psychic", "Ghost"]},
    "Steel": {"weak_to": ["Fire", "Fighting", "Ground"],
              "strong_against": ["Ice", "Rock", "Fairy"]},
    "Fairy": {"weak_to": ["Poison", "Steel"],
              "strong_against": ["Fighting", "Dragon", "Dark"]}
}


def get_strengths_and_weaknesses(pokemon_types):
    """
    Calculate the combined strengths and weaknesses for a list of Pokémon types.
    Given a list of Pokémon types (for example, ["Fire", "Water"]), this function
    uses a predefined type chart to determine which types these Pokémon are
    collectively strong against and which types they are weak against.
    Args:
        pokemon_types (list): A list of Pokémon types as strings.
    Returns:
        tuple: Two lists:
            - The first list contains the types that the given Pokémon types
              are strong against.
            - The second list contains the types that the given Pokémon types
              are weak against.
    """

    strengths = set()
    weaknesses = set()

    for p_type in pokemon_types:
        if p_type in type_chart:
            strengths.update(type_chart[p_type]["strong_against"])
            weaknesses.update(type_chart[p_type]["weak_to"])

    return list(strengths), list(weaknesses)
