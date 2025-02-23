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
    This module handles endpoints related to TCG (Trading Card Game) data for
    Trainer and Energy cards. 
    It provides routes for creating, reading, updating, and deleting Trainer
    and Energy cards, as well as endpoints to fetch external TCG data from the
    TCG API.
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


def get_current_user(token: str = Depends(oauth2_scheme),
                     db: Session = Depends(get_db)):
    """
        Retrieves the current authenticated user based on the provided JWT token.
        Args:
            token (str): The JWT token extracted from the request.
            db (Session): The database session.
        Note:
            This function currently decodes the token to get the user email.
            (You might want to extend it to return a full user object if needed.)
    """
    user_email = decode_token(token)


@router.post("/trainers", response_model=List[TrainerBase])
def create_trainer(trainer_name: str, db: Session = Depends(get_db)):
    """
        Fetches Trainer card data from the TCG API based on the provided trainer name.
        Args:
            trainer_name (str): The name (or part of the name) of the Trainer card
            to search for.
            db (Session): The database session.
        Returns:
            List[TrainerBase]: A list of Trainer cards matching the search criteria.
        Raises:
            HTTPException: If no Trainer card is found with the given name.
    """

    trainer_data = fetch_trainer_data(trainer_name)
    if not trainer_data:
        raise HTTPException(status_code=404, detail="Trainer card not found.")
    return trainer_data


@router.get("/trainers/{trainer_id}", response_model=TrainerOut)
def get_trainer(trainer_id: int, db: Session = Depends(get_db)):
    """
        Retrieves a specific Trainer card from the database using its ID.
        Args:
            trainer_id (int): The ID of the Trainer card.
            db (Session): The database session.
        Returns:
            TrainerOut: The Trainer card details.
        Raises:
            HTTPException: If the Trainer card is not found.
    """

    trainer = db.query(Trainer).get(trainer_id)
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer not found.")
    return trainer


@router.get("/trainers", response_model=list[TrainerOut])
def list_trainers(db: Session = Depends(get_db)):
    """
        Retrieves a list of all Trainer cards stored in the database.
        Args:
            db (Session): The database session.
        Returns:
            list[TrainerOut]: A list of all Trainer cards.
    """

    trainers = db.query(Trainer).all()
    return trainers


@router.put("/trainers/{trainer_id}", response_model=TrainerOut)
def update_trainer(trainer_id: int, trainer_in: TrainerUpdate,
                   db: Session = Depends(get_db)):
    """
        Updates an existing Trainer card with new information.
        Args:
            trainer_id (int): The ID of the Trainer card to update.
            trainer_in (TrainerUpdate): The updated data for the Trainer.
            db (Session): The database session.
        Returns:
            TrainerOut: The updated Trainer card details.
        Raises:
            HTTPException: If the Trainer card is not found.
    """

    trainer = db.query(Trainer).get(trainer_id)
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer not found.")

    for field, value in trainer_in.model_dump(exclude_unset=True).items():
        setattr(trainer, field, value)

    db.commit()
    db.refresh(trainer)
    return trainer


@router.delete("/trainers/{trainer_id}")
def delete_trainer(trainer_id: int, db: Session = Depends(get_db)):
    """
        Deletes a Trainer card from the database based on its ID.
        Args:
            trainer_id (int): The ID of the Trainer card to delete.
            db (Session): The database session.
        Returns:
            dict: A confirmation message indicating successful deletion.
        Raises:
            HTTPException: If the Trainer card is not found.
    """

    trainer = db.query(Trainer).get(trainer_id)
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer not found.")

    db.delete(trainer)
    db.commit()
    return {"message": "Trainer deleted successfully"}


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
        raise HTTPException(status_code=response.status_code, detail="Error fetching trainer data.")
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


@router.post("/energy", response_model=List[EnergyBase])
def create_energy(energy_type: str, db: Session = Depends(get_db)):
    """
        Fetches Energy card data from the TCG API based on the provided energy type.
        Args:
            energy_type (str): The type of Energy card to search for.
            db (Session): The database session.
        Returns:
            List[EnergyBase]: A list of Energy cards that match the criteria.
        Raises:
            HTTPException: If no Energy card is found for the given type.
    """

    energy_data = fetch_energy_data(energy_type)
    if not energy_data:
        raise HTTPException(status_code=404, detail="Energy card not found.")
    return energy_data


@router.get("/energy/{energy_id}", response_model=EnergyOut)
def get_energy(energy_id: int, db: Session = Depends(get_db)):
    """
        Retrieves a specific Energy card from the database using its ID.
        Args:
            energy_id (int): The ID of the Energy card.
            db (Session): The database session.
        Returns:
            EnergyOut: The Energy card details.
        Raises:
            HTTPException: If the Energy card is not found.
    """

    energy = db.query(Energy).get(energy_id)
    if not energy:
        raise HTTPException(status_code=404, detail="Energy not found.")
    return energy


@router.get("/energy", response_model=list[EnergyOut])
def list_energy(db: Session = Depends(get_db)):
    """
        Retrieves a list of all Energy cards stored in the database.
        Args:
            db (Session): The database session.
        Returns:
            list[EnergyOut]: A list of all Energy cards.
    """

    return db.query(Energy).all()


@router.put("/energy/{energy_id}", response_model=EnergyOut)
def update_energy(energy_id: int, energy_in: EnergyUpdate,
                  db: Session = Depends(get_db)):
    """
        Updates an existing Energy card with new information.
        Args:
            energy_id (int): The ID of the Energy card to update.
            energy_in (EnergyUpdate): The updated data for the Energy card.
            db (Session): The database session.
        Returns:
            EnergyOut: The updated Energy card details.
        Raises:
            HTTPException: If the Energy card is not found.
    """

    energy = db.query(Energy).get(energy_id)
    if not energy:
        raise HTTPException(status_code=404, detail="Energy not found.")

    for field, value in energy_in.model_dump(exclude_unset=True).items():
        setattr(energy, field, value)

    db.commit()
    db.refresh(energy)
    return energy


@router.delete("/energy/{energy_id}")
def delete_energy(energy_id: int, db: Session = Depends(get_db)):
    """
        Deletes an Energy card from the database based on its ID.
        Args:
            energy_id (int): The ID of the Energy card to delete.
            db (Session): The database session.
        Returns:
            dict: A confirmation message indicating successful deletion.
        Raises:
            HTTPException: If the Energy card is not found.
    """

    energy = db.query(Energy).get(energy_id)
    if not energy:
        raise HTTPException(status_code=404, detail="Energy not found.")

    db.delete(energy)
    db.commit()
    return {"message": "Energy deleted successfully"}


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
        raise HTTPException(status_code=response.status_code, detail="Error fetching energy data.")
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
