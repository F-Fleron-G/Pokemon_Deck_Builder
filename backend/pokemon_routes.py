from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Pokemon
from utils import fetch_pokemon_data
from fastapi.security import OAuth2PasswordBearer
from auth import oauth2_scheme, decode_token

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/pokemon/{pokemon_id}")
def get_pokemon_details(pokemon_id: int, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
       Retrieves detailed Pokémon info by ID from the local database if it exists.
       Otherwise, it fetches the data from the external PokéAPI, stores it in the
       local database (for caching), and then returns it to the client.

       Args:
           pokemon_id (int): The integer ID of the Pokémon to look up.
           token (str, optional): An OAuth2 Bearer token for user authentication.
           db (Session): A SQLAlchemy database session, injected via dependency.

       Returns:
           dict: A dictionary containing the Pokémon's details, including name,
           stats, type-based strengths/weaknesses, image URL, and more.

       Raises:
           HTTPException:
               - 401 if the user token is invalid or missing.
               - 404 if the Pokémon is not found in the local DB or in the external PokéAPI.
    """

    user = decode_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    pokemon = db.query(Pokemon).filter(Pokemon.id == pokemon_id).first()
    if pokemon:
        return {
            "id": pokemon.id,
            "name": pokemon.name,
            "image_url": pokemon.image_url,
            "types": pokemon.types,
            "strengths": pokemon.strengths,
            "weaknesses": pokemon.weaknesses,
            "moves": pokemon.moves,
            "abilities": pokemon.abilities,
            "hp": pokemon.hp,
            "attack": pokemon.attack,
            "defense": pokemon.defense,
            "special_attack": pokemon.special_attack,
            "special_defense": pokemon.special_defense,
            "speed": pokemon.speed
        }

    data = fetch_pokemon_data(pokemon_id)
    if not data:
        raise HTTPException(status_code=404, detail="Pokemon not found")

    new_pokemon = Pokemon(
        id=data["id"],
        name=data["name"],
        image_url=data["image_url"],
        types=data["types"],
        strengths=data["strengths"],
        weaknesses=data["weaknesses"],
        moves=data["moves"],
        abilities=data["abilities"],
        hp=data["hp"],
        attack=data["attack"],
        defense=data["defense"],
        special_attack=data["special_attack"],
        special_defense=data["special_defense"],
        speed=data["speed"]
    )
    db.add(new_pokemon)
    db.commit()
    db.refresh(new_pokemon)
    return data
