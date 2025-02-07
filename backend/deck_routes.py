from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from database import SessionLocal
from models import User, Deck, DeckPokemon, Pokemon
from schemas import DeckUpdate
from auth import oauth2_scheme, decode_token
from services.pokeapi_service import fetch_pokemon_data
from utils import fetch_pokemon_data, fetch_pokemon_tcg_card


# ✅ Create FastAPI Router
router = APIRouter()


# ✅ Database Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ✅ Get the Current User
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    user_email = decode_token(token)
    user = db.query(User).filter(and_(User.email == user_email)).first()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid authentication")
    return user


# ✅ GET: Retrieve User's Deck
@router.get("/deck")
def get_user_deck(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user_deck = db.query(Deck).filter(and_(Deck.user_id == user.id)).first()

    if not user_deck:
        return {"message": "No deck found. Create one!"}

    deck_entries = db.query(DeckPokemon).filter(and_(DeckPokemon.deck_id == user_deck.id)).all()
    pokemon_list = [db.query(Pokemon).filter(and_(Pokemon.id == entry.pokemon_id)).first() for entry in deck_entries]

    return {"deck": [{"id": p.id, "name": p.name} for p in pokemon_list]}


# # ✅ POST: Create or Update User's Deck

@router.post("/deck")
def save_deck(deck_update: DeckUpdate, db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    """Save or update a user's deck with Pokémon from PokéAPI and TCG API."""

    user_email = decode_token(token)
    user = db.query(User).filter(and_(User.email == user_email)).first()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid authentication")

    # Ensure the user has a deck
    user_deck = db.query(Deck).filter(and_(Deck.user_id == user.id)).first()

    if not user_deck:
        user_deck = Deck(user_id=user.id)
        db.add(user_deck)
        db.commit()
        db.refresh(user_deck)

    # Clear the existing deck before adding new Pokémon
    db.query(DeckPokemon).filter(and_(DeckPokemon.deck_id == user_deck.id)).delete()
    db.commit()

    added_pokemon = []

    for pokemon_id in deck_update.pokemon_ids:
        # Fetch Pokémon data from PokéAPI
        pokemon_data = fetch_pokemon_data(str(pokemon_id))

        if not pokemon_data:
            raise HTTPException(status_code=404, detail=f"Pokémon with ID {pokemon_id} not found.")

        # Fetch Pokémon TCG card details
        tcg_card = fetch_pokemon_tcg_card(pokemon_data["name"]) or {}

        # Check if Pokémon already exists in the database
        existing_pokemon = db.query(Pokemon).filter(and_(Pokemon.id == pokemon_data["id"])).first()

        if not existing_pokemon:
            # Insert Pokémon into the database with all details
            new_pokemon = Pokemon(
                id=pokemon_data["id"],
                name=pokemon_data["name"],
                types=pokemon_data["types"],
                strengths=pokemon_data.get("strengths", []),
                weaknesses=pokemon_data.get("weaknesses", []),
                moves=pokemon_data.get("moves", []),
                abilities=pokemon_data.get("abilities", []),
                hp=pokemon_data.get("hp", 0),
                attack=pokemon_data.get("attack", 0),
                defense=pokemon_data.get("defense", 0),
                special_attack=pokemon_data.get("special_attack", 0),
                special_defense=pokemon_data.get("special_defense", 0),
                speed=pokemon_data.get("speed", 0),
                tcg_id=tcg_card.get("tcg_id"),
                tcg_image_url=tcg_card.get("tcg_image_url"),
                tcg_set=tcg_card.get("tcg_set"),
                tcg_rarity=tcg_card.get("tcg_rarity")
            )
            db.add(new_pokemon)
            db.commit()
            db.refresh(new_pokemon)

        # Now that the Pokémon exists, add it to the deck
        new_entry = DeckPokemon(deck_id=user_deck.id, pokemon_id=pokemon_data["id"])
        db.add(new_entry)

        added_pokemon.append({
            "id": pokemon_data["id"],
            "name": pokemon_data["name"],
            "types": pokemon_data["types"],
            "strengths": pokemon_data.get("strengths", []),
            "weaknesses": pokemon_data.get("weaknesses", []),
            "moves": pokemon_data.get("moves", []),
            "abilities": pokemon_data.get("abilities", []),
            "hp": pokemon_data.get("hp", 0),
            "attack": pokemon_data.get("attack", 0),
            "defense": pokemon_data.get("defense", 0),
            "special_attack": pokemon_data.get("special_attack", 0),
            "special_defense": pokemon_data.get("special_defense", 0),
            "speed": pokemon_data.get("speed", 0),
            "tcg_image_url": tcg_card.get("tcg_image_url"),
            "tcg_set": tcg_card.get("tcg_set"),
            "tcg_rarity": tcg_card.get("tcg_rarity")
        })

    db.commit()  # Commit all changes

    return {"message": "Deck updated successfully", "added_pokemon": added_pokemon}


# ✅ DELETE: Remove Pokémon from Deck
@router.delete("/deck/{pokemon_id}")
def remove_from_deck(pokemon_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user_deck = db.query(Deck).filter(and_(Deck.user_id == user.id)).first()

    if not user_deck:
        raise HTTPException(status_code=404, detail="No deck found")

    db.query(DeckPokemon).filter(and_(DeckPokemon.deck_id == user_deck.id,
                                      DeckPokemon.pokemon_id == pokemon_id)).delete()
    db.commit()

    return {"message": "Pokémon removed from deck"}
