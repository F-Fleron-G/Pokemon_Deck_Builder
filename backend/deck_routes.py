from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from database import SessionLocal
from models import (User, Deck, DeckPokemon, Pokemon,
                    Trainer, Energy, DeckTrainer, DeckEnergy)
from schemas import DeckUpdate
from auth import oauth2_scheme, decode_token, get_api_key
from synergy import calculate_deck_score
from recommendations import generate_recommendations
from utils import fetch_pokemon_data, fetch_trainer_data, fetch_energy_data
from fastapi.encoders import jsonable_encoder


"""
    This module handles all API routes related to deck management.
    It provides endpoints for getting the user deck, saving/updating the
    deck, and removing cards.
"""

router = APIRouter()


def get_db():
    """
        Provides a database session for deck routes.
        Yields:
            Session: A SQLAlchemy session.
    """

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(token: str = Depends(oauth2_scheme),
                     db: Session = Depends(get_db)):
    """
        Retrieves the current authenticated user based on the JWT token.
        Args:
            token (str): The JWT token provided via OAuth2.
            db (Session): The database session.
        Returns:
            User: The authenticated user object.
        Raises:
            HTTPException: If authentication fails.
    """

    user_email = decode_token(token)
    user = db.query(User).filter(and_(User.email == user_email)).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid authentication")
    return user


@router.get("/", openapi_extra={"security": [{"BearerAuth": []}]})
def get_user_deck(user: User = Depends(get_current_user),
                  db: Session = Depends(get_db)):
    """
        Retrieves the user's deck, including all Pokémon, Trainer, and Energy cards,
        as well as a deck count and dynamic recommendations.
        Args:
            user (User): The current authenticated user.
            db (Session): The database session.
        Returns:
            dict: A dictionary containing the deck details, deck count, and
            recommendations.
    """

    user_deck = db.query(Deck).filter(and_(Deck.user_id == user.id)).first()
    if not user_deck:
        return {
            "message": "No deck found. Create one!",
            "deck": {"pokemon": [], "trainers": [], "energy": []},
            "deck_count": 0,
            "deck_score": 0,
            "recommendations": [],
        }

    pokemon_entries = db.query(DeckPokemon).filter(and_(DeckPokemon.deck_id == user_deck.id)).all()
    trainer_entries = db.query(DeckTrainer).filter(and_(DeckTrainer.deck_id == user_deck.id)).all()
    energy_entries = db.query(DeckEnergy).filter(and_(DeckEnergy.deck_id == user_deck.id)).all()

    pokemon_list = db.query(Pokemon).filter(
        Pokemon.id.in_([entry.pokemon_id for entry in pokemon_entries])
    ).all()
    trainer_list = db.query(Trainer).filter(
        Trainer.id.in_([entry.trainer_id for entry in trainer_entries])
    ).all()
    energy_list = db.query(Energy).filter(
        Energy.id.in_([entry.energy_id for entry in energy_entries])
    ).all()

    base_score = calculate_deck_score(pokemon_list, trainer_list, energy_list)
    max_score = 360
    if base_score > max_score:
        base_score = max_score
    deck_score_percent = int(round((base_score / max_score) * 100))

    recommendations = generate_recommendations(user_deck, db)

    return {
        "deck": {
            "pokemon": [
                {"id": p.id, "name": p.name, "image_url": p.image_url,
                 "strengths": p.strengths, "weaknesses": p.weaknesses}
                for p in pokemon_list
            ],
            "trainers": [
                {"id": t.id, "name": t.name, "tcg_image_url": t.tcg_image_url}
                for t in trainer_list
            ],
            "energy": [
                {"id": e.id, "name": e.name, "tcg_image_url": e.tcg_image_url}
                for e in energy_list
            ],
        },
        "deck_count": len(pokemon_list) + len(trainer_list) + len(energy_list),
        "deck_score": deck_score_percent,
        "recommendations": recommendations,
    }


@router.post("/", openapi_extra={"security": [{"BearerAuth": []}]})
def save_deck(
    deck_update: DeckUpdate,
    user: User = Depends(get_current_user),
        db: Session = Depends(get_db)):

    """
        Updates the user's deck by adding new Pokémon, Trainer, and Energy cards.
        It avoids duplicate entries and returns updated deck details including
        the deck score and dynamic recommendations.

        Args:
            deck_update (DeckUpdate): The update payload with Pokémon IDs, Trainer names,
                and Energy types.
            user (User): The currently authenticated user object (provided by get_current_user).
            db (Session): The database session.

        Returns:
            dict: A dictionary containing:
                - "message": A success message upon updating the deck,
                - "added_pokemon": Any newly added Pokémon details,
                - "added_trainers": Any newly added Trainer cards,
                - "added_energy": Any newly added Energy cards,
                - "deck_score": The updated synergy score,
                - "recommendations": Dynamic suggestions to improve the deck.
    """

    user_deck = db.query(Deck).filter(and_(Deck.user_id == user.id)).first()
    if not user_deck:
        user_deck = Deck(user_id=user.id)
        db.add(user_deck)
        db.commit()
        db.refresh(user_deck)

    db.commit()

    added_pokemon = []
    added_trainers = []
    added_energy = []

    existing_pokemon_ids = {
        p.pokemon_id for p in db.query(DeckPokemon)
        .filter(and_(DeckPokemon.deck_id == user_deck.id)).all()
    }
    for pokemon_id in deck_update.pokemon_ids:
        if pokemon_id not in existing_pokemon_ids:
            existing_pokemon = db.query(Pokemon).filter(and_(Pokemon.id == pokemon_id)).first()
            if not existing_pokemon:
                pokemon_data = fetch_pokemon_data(pokemon_id)
                if pokemon_data:
                    pokemon_data.pop("id", None)
                    new_pokemon = Pokemon(id=pokemon_id, **pokemon_data)
                    db.add(new_pokemon)
                    db.commit()
                    db.refresh(new_pokemon)
                    existing_pokemon = new_pokemon

            if existing_pokemon:
                db.add(DeckPokemon(deck_id=user_deck.id, pokemon_id=existing_pokemon.id))
                added_pokemon.append({
                    "id": existing_pokemon.id,
                    "name": existing_pokemon.name,
                    "image_url": existing_pokemon.image_url
                })

    existing_trainer_ids = {
        t.trainer_id for t in db.query(DeckTrainer)
        .filter(and_(DeckTrainer.deck_id == user_deck.id)).all()
    }
    for trainer_name in deck_update.trainer_names:
        existing_trainer = db.query(Trainer) \
            .filter(Trainer.name.ilike(f"%{trainer_name}%")).first()
        if not existing_trainer:
            continue
        trainer_id = existing_trainer.id
        if trainer_id not in existing_trainer_ids:
            db.add(DeckTrainer(deck_id=user_deck.id, trainer_id=trainer_id))
            added_trainers.append({
                "name": existing_trainer.name,
                "tcg_image_url": existing_trainer.tcg_image_url
            })

    existing_energy_ids = {
        e.energy_id for e in db.query(DeckEnergy)
        .filter(and_(DeckEnergy.deck_id == user_deck.id)).all()
    }
    for energy_type in deck_update.energy_types:
        existing_energy = db.query(Energy) \
            .filter(and_(Energy.energy_type == energy_type)).first()
        if not existing_energy:
            continue
        energy_id = existing_energy.id
        if energy_id not in existing_energy_ids:
            db.add(DeckEnergy(deck_id=user_deck.id, energy_id=energy_id))
            added_energy.append({
                "name": existing_energy.name,
                "tcg_image_url": existing_energy.tcg_image_url
            })

    db.commit()

    pokemon_entries = db.query(DeckPokemon).filter(and_(DeckPokemon.deck_id == user_deck.id)).all()
    trainer_entries = db.query(DeckTrainer).filter(and_(DeckTrainer.deck_id == user_deck.id)).all()
    energy_entries = db.query(DeckEnergy).filter(and_(DeckEnergy.deck_id == user_deck.id)).all()

    full_pokemon_list = db.query(Pokemon).filter(
        Pokemon.id.in_([entry.pokemon_id for entry in pokemon_entries])
    ).all()
    full_trainer_list = db.query(Trainer).filter(
        Trainer.id.in_([entry.trainer_id for entry in trainer_entries])
    ).all()
    full_energy_list = db.query(Energy).filter(
        Energy.id.in_([entry.energy_id for entry in energy_entries])
    ).all()

    deck_score = calculate_deck_score(full_pokemon_list, full_trainer_list, full_energy_list)

    recommendations = generate_recommendations(user_deck, db)

    return {
        "message": "Deck updated successfully",
        "added_pokemon": added_pokemon,
        "added_trainers": added_trainers,
        "added_energy": added_energy,
        "deck_score": deck_score,
        "recommendations": recommendations
    }


@router.delete("/pokemon/{pokemon_id}", openapi_extra={"security": [{"BearerAuth": []}]})
def remove_pokemon_from_deck(pokemon_id: int,
                             user: User = Depends(get_current_user),
                             db: Session = Depends(get_db)):
    """
        Removes a specified Pokémon from the user's deck.
        Args:
            pokemon_id (int): The ID of the Pokémon to remove.
            user (User): The current authenticated user.
            db (Session): The database session.
        Returns:
            dict: A message confirming the removal of the Pokémon.
        Raises:
            HTTPException: If no deck is found.
    """

    user_deck = db.query(Deck).filter(and_(Deck.user_id == user.id)).first()
    if not user_deck:
        raise HTTPException(status_code=404, detail="No deck found")

    db.query(DeckPokemon).filter(
        and_(DeckPokemon.deck_id == user_deck.id, DeckPokemon.pokemon_id == pokemon_id)
    ).delete()
    db.commit()
    return {"message": "Pokémon removed from deck"}


@router.delete("/trainer/{trainer_id}", openapi_extra={"security": [{"BearerAuth": []}]})
def remove_trainer_from_deck(trainer_id: int,
                             user: User = Depends(get_current_user),
                             db: Session = Depends(get_db)):
    """
        Removes a specified Trainer from the user's deck.
        Args:
            trainer_id (int): The ID of the Trainer to remove.
            user (User): The current authenticated user.
            db (Session): The database session.
        Returns:
            dict: A message confirming the removal of the Pokémon.
        Raises:
            HTTPException: If no deck is found.
    """

    user_deck = db.query(Deck).filter(and_(Deck.user_id == user.id)).first()
    if not user_deck:
        raise HTTPException(status_code=404, detail="No deck found")

    db.query(DeckTrainer).filter(
        and_(DeckTrainer.deck_id == user_deck.id, DeckTrainer.trainer_id == trainer_id)
    ).delete()
    db.commit()
    return {"message": "Trainer removed from deck"}


@router.delete("/energy/{energy_id}", openapi_extra={"security": [{"BearerAuth": []}]})
def remove_energy_from_deck(energy_id: int,
                            user: User = Depends(get_current_user),
                            db: Session = Depends(get_db)):
    """
        Removes a specified Trainer from the user's deck.
        Args:
            energy_id (int): The ID of the Energy to remove.
            user (User): The current authenticated user.
            db (Session): The database session.
        Returns:
            dict: A message confirming the removal of the Pokémon.
        Raises:
            HTTPException: If no deck is found.
    """

    user_deck = db.query(Deck).filter(and_(Deck.user_id == user.id)).first()
    if not user_deck:
        raise HTTPException(status_code=404, detail="No deck found")

    db.query(DeckEnergy).filter(
        and_(DeckEnergy.deck_id == user_deck.id, DeckEnergy.energy_id == energy_id)
    ).delete()
    db.commit()
    return {"message": "Energy removed from deck"}
