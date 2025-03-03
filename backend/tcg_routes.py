from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
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
    url = f"{TCG_API_URL}?q={query}&pageSize=100"
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
    url = f"{TCG_API_URL}?q={query}&pageSize=100"
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
        if energy_type and energy_type.lower() not in card.get("name", "").lower():
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
