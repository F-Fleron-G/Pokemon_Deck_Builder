from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from database import SessionLocal
from models import User, Deck, DeckPokemon, Pokemon, Trainer, Energy, DeckTrainer, DeckEnergy
from schemas import DeckUpdate
from auth import oauth2_scheme, decode_token
from auth import get_api_key
from utils import fetch_trainer_data, fetch_energy_data


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
def save_deck(
        deck_update: DeckUpdate,
        db: Session = Depends(get_db),
        token: str = Depends(get_api_key)  # Use get_api_key instead of oauth2_scheme
):
    # Extract the actual token from the "Bearer <token>" string
    if " " in token:
        actual_token = token.split(" ")[1]
    else:
        actual_token = token
    user_email = decode_token(actual_token)

    # (Rest of your deck logic follows below)
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

    # Clear and update deck entries for Pokémon
    db.query(DeckPokemon).filter(and_(DeckPokemon.deck_id == user_deck.id)).delete()
    db.commit()

    added_pokemon = []
    for pokemon_id in deck_update.pokemon_ids:
        # ... (existing Pokémon handling code)
        pass  # (Your existing Pokémon logic here)

    # Process Trainer Cards
    added_trainers = []
    if deck_update.trainer_names:
        db.query(DeckTrainer).filter(and_(DeckTrainer.deck_id == user_deck.id)).delete()
        db.commit()
        for trainer_name in deck_update.trainer_names:
            trainer_data = fetch_trainer_data(trainer_name)
            if not trainer_data:
                continue  # Skip if no trainer card found
            existing_trainer = db.query(Trainer).filter(and_(Trainer.name == trainer_data.get("name"))).first()
            if not existing_trainer:
                new_trainer = Trainer(**trainer_data)
                db.add(new_trainer)
                db.commit()
                db.refresh(new_trainer)
                trainer_id = new_trainer.id
            else:
                trainer_id = existing_trainer.id
            new_deck_trainer = DeckTrainer(deck_id=user_deck.id, trainer_id=trainer_id)
            db.add(new_deck_trainer)
            added_trainers.append(trainer_data)
        db.commit()

    # Process Energy Cards
    added_energy = []
    if deck_update.energy_types:
        db.query(DeckEnergy).filter(and_(DeckEnergy.deck_id == user_deck.id)).delete()
        db.commit()
        for energy_type in deck_update.energy_types:
            energy_data = fetch_energy_data(energy_type)
            if not energy_data:
                continue  # Skip if no energy card found
            existing_energy = db.query(Energy).filter(and_(Energy.name == energy_data.get("name"))).first()
            if not existing_energy:
                new_energy = Energy(**energy_data)
                db.add(new_energy)
                db.commit()
                db.refresh(new_energy)
                energy_id = new_energy.id
            else:
                energy_id = existing_energy.id
            new_deck_energy = DeckEnergy(deck_id=user_deck.id, energy_id=energy_id)
            db.add(new_deck_energy)
            added_energy.append(energy_data)
        db.commit()

    db.commit()  # Final commit

    return {
        "message": "Deck updated successfully",
        "added_pokemon": added_pokemon,
        "added_trainers": added_trainers,
        "added_energy": added_energy
    }


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
