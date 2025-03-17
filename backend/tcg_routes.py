from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from database import SessionLocal
from models import Trainer, Energy
from schemas import (
    TrainerUpdate, TrainerOut,
    EnergyUpdate, EnergyOut,
    TrainerBase, EnergyBase
)
from auth import oauth2_scheme, decode_token
from utils import fetch_trainer_data, fetch_energy_data
from utils import TCG_API_URL, TCG_API_HEADERS
from typing import List
import requests


"""
    This module provides endpoints to fetch Trainer and Energy card data directly 
    from the Pokémon TCG API. Users can view these cards (with or without logging in) 
    to see what is available for deck building. Actual deck additions or deletions 
    are handled by the 'deck_routes.py' module.

    Current endpoints:
      - GET /tcg/external/trainers
      - GET /tcg/external/energy
"""


router = APIRouter()


def get_db():
    """
        Provides a database session for TCG routes.
        Yields:
            Session: A SQLAlchemy session used for database operations.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/external/trainers", response_model=List[TrainerBase])
def get_external_trainers(trainer_name: str = ""):
    """
        Fetches a list of Trainer cards directly from the TCG API.
        Args:
            trainer_name (str, optional): If provided, filters the results to
            include only Trainer cards containing this string in their name.
            Defaults to an empty string.
        Returns:
            List[TrainerBase]: A list of Trainer cards matching the criteria.
        Raises:
            HTTPException: If there is an error fetching data or no matching
            Trainer cards are found.
    """

    query = "supertype:Trainer"
    url = f"{TCG_API_URL}?q={query}&pageSize=250"
    response = requests.get(url, headers=TCG_API_HEADERS)
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code,
                            detail="Error fetching trainer data.")
    data = response.json()
    if "data" not in data or not data["data"]:
        raise HTTPException(status_code=404, detail="No trainer cards found.")

    matches = []
    for card in data["data"]:
        image_url = card.get("images", {}).get("large")
        if not image_url:
            continue

        if trainer_name and trainer_name.lower() not in card.get("name", "").lower():
            continue
        matches.append({
            "name": card.get("name"),
            "tcg_id": card.get("id"),
            "tcg_image_url": image_url,
            "tcg_set": card.get("set", {}).get("name"),
            "tcg_rarity": card.get("rarity"),
            "effect": card.get("text", None)
        })
    if not matches:
        raise HTTPException(status_code=404, detail="No matching trainer cards found.")
    return matches


@router.get("/external/energy", response_model=List[EnergyBase])
def get_external_energy(energy_type: str = ""):
    """
        Fetches a list of Energy cards directly from the TCG API.
        Args:
            energy_type (str, optional): If provided, filters the results to
            include only Energy cards containing this string in their name.
            Defaults to an empty string.
        Returns:
            List[EnergyBase]: A list of Energy cards matching the criteria.
        Raises:
            HTTPException: If there is an error fetching data or no matching
            Energy cards are found.
    """

    query = "supertype:Energy"
    url = f"{TCG_API_URL}?q={query}&pageSize=250"
    response = requests.get(url, headers=TCG_API_HEADERS)
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code,
                            detail="Error fetching energy data.")
    data = response.json()
    if "data" not in data or not data["data"]:
        raise HTTPException(status_code=404, detail="No energy cards found.")

    matches = []
    for card in data["data"]:
        image_url = card.get("images", {}).get("large")
        if not image_url:
            continue
        if energy_type and energy_type.lower() not in " ".join(card.get("subtypes", [])).lower():
            continue
        matches.append({
            "name": card.get("name"),
            "tcg_id": card.get("id"),
            "tcg_image_url": image_url,
            "tcg_set": card.get("set", {}).get("name"),
            "tcg_rarity": card.get("rarity"),
            "energy_type": energy_type
        })
    if not matches:
        raise HTTPException(status_code=404, detail="No matching energy cards found.")
    return matches


@router.post("/external/cache")
def cache_tcg_data(db: Session = Depends(get_db)):
    """
    Fetches Trainer and Energy data from the TCG API and upserts them into the database.
    This endpoint can be called periodically to refresh your local cache.
    """
    # --- Cache Trainers ---
    query = "supertype:Trainer"
    url = f"{TCG_API_URL}?q={query}&pageSize=250"
    trainer_response = requests.get(url, headers=TCG_API_HEADERS)
    if trainer_response.status_code != 200:
        raise HTTPException(status_code=trainer_response.status_code,
                            detail="Error fetching trainer data.")
    trainer_data = trainer_response.json()
    trainers = []
    if "data" in trainer_data:
        for card in trainer_data["data"]:
            image_url = card.get("images", {}).get("large")
            if not image_url:
                continue
            trainers.append({
                "name": card.get("name"),
                "tcg_id": card.get("id"),
                "tcg_image_url": image_url,
                "tcg_set": card.get("set", {}).get("name"),
                "tcg_rarity": card.get("rarity"),
                "effect": card.get("text", None)
            })

    for trainer in trainers:
        existing = db.query(Trainer).filter(and_(Trainer.tcg_id == trainer["tcg_id"])).first()
        if existing:
            existing.name = trainer["name"]
            existing.tcg_image_url = trainer["tcg_image_url"]
            existing.tcg_set = trainer["tcg_set"]
            existing.tcg_rarity = trainer["tcg_rarity"]
            existing.effect = trainer["effect"]
        else:
            new_trainer = Trainer(**trainer)
            db.add(new_trainer)
    db.commit()

    # --- Cache Energy Cards ---
    query = "supertype:Energy"
    url = f"{TCG_API_URL}?q={query}&pageSize=250"
    energy_response = requests.get(url, headers=TCG_API_HEADERS)
    if energy_response.status_code != 200:
        raise HTTPException(status_code=energy_response.status_code,
                            detail="Error fetching energy data.")
    energy_data = energy_response.json()
    energies = []
    if "data" in energy_data:
        for card in energy_data["data"]:
            image_url = card.get("images", {}).get("large")
            if not image_url:
                continue
            energies.append({
                "name": card.get("name"),
                "tcg_id": card.get("id"),
                "tcg_image_url": image_url,
                "tcg_set": card.get("set", {}).get("name"),
                "tcg_rarity": card.get("rarity"),
                "energy_type": card.get("name", "").replace(" Energy", "").strip()
            })

    for energy in energies:
        existing = db.query(Energy).filter(and_(Energy.tcg_id == energy["tcg_id"])).first()
        if existing:
            existing.name = energy["name"]
            existing.tcg_image_url = energy["tcg_image_url"]
            existing.tcg_set = energy["tcg_set"]
            existing.tcg_rarity = energy["tcg_rarity"]
            existing.energy_type = energy["energy_type"]
        else:
            new_energy = Energy(**energy)
            db.add(new_energy)
    db.commit()

    return {
        "message": "TCG data cached successfully",
        "trainers_count": len(trainers),
        "energies_count": len(energies)
    }


@router.get("/cached/energy", response_model=List[EnergyBase])
def get_cached_energy(db: Session = Depends(get_db)):
    """
    Retrieves energy cards from the local database cache.
    This endpoint returns the energy cards that have been previously cached
    via the /tcg/external/cache endpoint.
    """
    energies = db.query(Energy).all()
    if not energies:
        raise HTTPException(status_code=404, detail="No energy cards found in cache.")
    results = []
    for energy in energies:
        results.append({
            "name": energy.name,
            "tcg_id": energy.tcg_id,
            "tcg_image_url": energy.tcg_image_url,
            "tcg_set": energy.tcg_set,
            "tcg_rarity": energy.tcg_rarity,
            "energy_type": energy.energy_type,
        })
    return results
