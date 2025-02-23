from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from database import SessionLocal
from models import (User, Deck, DeckPokemon, Pokemon,
                    Trainer, Energy, DeckTrainer, DeckEnergy)
from schemas import DeckUpdate
from auth import oauth2_scheme, decode_token
from auth import get_api_key
from synergy import calculate_deck_score
from recommendations import generate_recommendations
from utils import fetch_pokemon_data, fetch_trainer_data, fetch_energy_data

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


@router.get("/deck", openapi_extra={"security": [{"BearerAuth": []}]})
def get_user_deck(user: User = Depends(get_current_user),
                  db: Session = Depends(get_db)):
    user_deck = db.query(Deck).filter(and_(Deck.user_id == user.id)).first()
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

    if not user_deck:
        return {
            "message": "No deck found. Create one!",
            "deck": {"pokemon": [], "trainers": [], "energy": []},
            "deck_count": 0,
            "recommendations": [],
        }

    pokemon_entries = (db.query(DeckPokemon)
                       .filter(and_(DeckPokemon.deck_id == user_deck.id)).all())
    pokemon_list = (db.query(Pokemon)
                    .filter(Pokemon.id.in_([entry.pokemon_id for entry in pokemon_entries])).all())

    trainer_entries = (db.query(DeckTrainer)
                       .filter(and_(DeckTrainer.deck_id == user_deck.id)).all())
    trainer_list = db.query(Trainer).filter(Trainer.id.in_([entry.trainer_id
                                                            for entry in trainer_entries])).all()

    energy_entries = db.query(DeckEnergy).filter(and_(DeckEnergy.deck_id
                                                      == user_deck.id)).all()
    energy_list = db.query(Energy).filter(Energy.id.in_([entry.energy_id
                                                         for entry in energy_entries])).all()

    deck_count = len(pokemon_list) + len(trainer_list) + len(energy_list)

    recommendations = generate_recommendations(user_deck, db)

    return {
        "deck": {
            "pokemon": [{"id": p.id, "name": p.name,
                         "image_url": p.image_url} for p in pokemon_list],
            "trainers": [{"id": t.id, "name": t.name,
                          "tcg_image_url": t.tcg_image_url} for t in trainer_list],
            "energy": [{"id": e.id, "name": e.name,
                        "tcg_image_url": e.tcg_image_url} for e in energy_list],
        },
        "deck_count": deck_count,
        "recommendations": recommendations,
    }


@router.post("/deck")
def save_deck(deck_update: DeckUpdate, db: Session = Depends(get_db),
              token: str = Depends(get_api_key)):
    """
        Updates the user's deck by adding new Pokémon, Trainer, and Energy cards.
        It avoids duplicate entries and returns updated deck details including
        the deck score and dynamic recommendations.
        Args:
            deck_update (DeckUpdate): The update payload with Pokémon IDs, Trainer names,
            and Energy types.
            db (Session): The database session.
            token (str): The API key token from the Authorization header.
        Returns:
            dict: A dictionary with a success message, the newly added cards, deck score,
            and recommendations.
    """

    if " " in token:
        actual_token = token.split(" ")[1]
    else:
        actual_token = token
    user_email = decode_token(actual_token)

    user = db.query(User).filter(and_(User.email == user_email)).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid authentication")

    user_deck = db.query(Deck).filter(and_(Deck.user_id == user.id)).first()
    if not user_deck:
        user_deck = Deck(user_id=user.id)
        db.add(user_deck)
        db.commit()
        db.refresh(user_deck)

    db.commit()

    added_pokemon = []
    existing_pokemon_ids = {p.pokemon_id for p in
                            db.query(DeckPokemon).filter(and_(DeckPokemon.deck_id == user_deck.id)).all()}

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
                new_deck_pokemon = DeckPokemon(deck_id=user_deck.id,
                                               pokemon_id=existing_pokemon.id)
                db.add(new_deck_pokemon)
                added_pokemon.append({
                    "id": existing_pokemon.id,
                    "name": existing_pokemon.name,
                    "image_url": existing_pokemon.image_url
                })

    added_trainers = []
    existing_trainer_names = {t.trainer_id for t in
                              db.query(DeckTrainer).filter(and_(DeckTrainer.deck_id == user_deck.id)).all()}

    for trainer_name in deck_update.trainer_names:
        trainer_data = fetch_trainer_data(trainer_name)
        if trainer_data:
            selected_trainer = trainer_data[0]
            existing_trainer = (db.query(Trainer)
                                .filter(and_(Trainer.name == selected_trainer["name"])).first())

            if not existing_trainer:
                new_trainer = Trainer(**selected_trainer)
                db.add(new_trainer)
                db.commit()
                db.refresh(new_trainer)
                trainer_id = new_trainer.id
            else:
                trainer_id = existing_trainer.id

            if trainer_id not in existing_trainer_names:
                new_deck_trainer = DeckTrainer(deck_id=user_deck.id, trainer_id=trainer_id)
                db.add(new_deck_trainer)
                added_trainers.append(selected_trainer)

    added_energy = []
    existing_energy_names = {e.energy_id for e in
                             db.query(DeckEnergy).filter(and_(DeckEnergy.deck_id == user_deck.id)).all()}

    for energy_type in deck_update.energy_types:
        energy_data = fetch_energy_data(energy_type)
        if energy_data:
            selected_energy = energy_data[0]
            existing_energy = (db.query(Energy)
                               .filter(and_(Energy.name == selected_energy["name"])).first())

            if not existing_energy:
                new_energy = Energy(**selected_energy)
                db.add(new_energy)
                db.commit()
                db.refresh(new_energy)
                energy_id = new_energy.id
            else:
                energy_id = existing_energy.id

            if energy_id not in existing_energy_names:
                new_deck_energy = DeckEnergy(deck_id=user_deck.id, energy_id=energy_id)
                db.add(new_deck_energy)
                added_energy.append(selected_energy)

    db.commit()

    deck_score = calculate_deck_score(added_pokemon, added_trainers, added_energy)
    recommendations = generate_recommendations(user_deck, db)

    return {
        "message": "Deck updated successfully",
        "added_pokemon": added_pokemon,
        "added_trainers": added_trainers,
        "added_energy": added_energy,
        "deck_score": deck_score,
        "recommendations": recommendations
    }


@router.delete("/deck/{pokemon_id}",
               openapi_extra={"security": [{"BearerAuth": []}]})
def remove_from_deck(pokemon_id: int, user: User = Depends(get_current_user),
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
