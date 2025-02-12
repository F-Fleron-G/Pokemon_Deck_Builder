from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Trainer, Energy
from schemas import (
    TrainerUpdate, TrainerOut,
    EnergyUpdate, EnergyOut
)
from auth import oauth2_scheme, decode_token
from utils import fetch_trainer_data, fetch_energy_data


router = APIRouter()


# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Optional: Current user check if you want endpoints restricted
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    user_email = decode_token(token)
    # ... fetch user from DB
    # return user


# ============ TRAINER ENDPOINTS ============

@router.post("/trainers", response_model=TrainerOut)
def create_trainer(trainer_name: str, db: Session = Depends(get_db)):
    # Fetch trainer data from TCG API using the provided trainer_name
    trainer_data = fetch_trainer_data(trainer_name)
    if not trainer_data:
        raise HTTPException(status_code=404, detail="Trainer card not found.")

    # Create the trainer instance using the fetched data
    trainer = Trainer(**trainer_data)
    db.add(trainer)
    db.commit()
    db.refresh(trainer)
    return trainer


@router.get("/trainers/{trainer_id}", response_model=TrainerOut)
def get_trainer(trainer_id: int, db: Session = Depends(get_db)):
    trainer = db.query(Trainer).get(trainer_id)
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer not found.")
    return trainer


@router.get("/trainers", response_model=list[TrainerOut])
def list_trainers(db: Session = Depends(get_db)):
    trainers = db.query(Trainer).all()
    return trainers


@router.put("/trainers/{trainer_id}", response_model=TrainerOut)
def update_trainer(trainer_id: int, trainer_in: TrainerUpdate, db: Session = Depends(get_db)):
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
    trainer = db.query(Trainer).get(trainer_id)
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer not found.")

    db.delete(trainer)
    db.commit()
    return {"message": "Trainer deleted successfully"}


# ============ ENERGY ENDPOINTS ============

@router.post("/energy", response_model=EnergyOut)
def create_energy(energy_type: str, db: Session = Depends(get_db)):
    energy_data = fetch_energy_data(energy_type)
    if not energy_data:
        raise HTTPException(status_code=404, detail="Energy card not found.")

    energy = Energy(**energy_data)
    db.add(energy)
    db.commit()
    db.refresh(energy)
    return energy


@router.get("/energy/{energy_id}", response_model=EnergyOut)
def get_energy(energy_id: int, db: Session = Depends(get_db)):
    energy = db.query(Energy).get(energy_id)
    if not energy:
        raise HTTPException(status_code=404, detail="Energy not found.")
    return energy


@router.get("/energy", response_model=list[EnergyOut])
def list_energy(db: Session = Depends(get_db)):
    return db.query(Energy).all()


@router.put("/energy/{energy_id}", response_model=EnergyOut)
def update_energy(energy_id: int, energy_in: EnergyUpdate, db: Session = Depends(get_db)):
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
    energy = db.query(Energy).get(energy_id)
    if not energy:
        raise HTTPException(status_code=404, detail="Energy not found.")

    db.delete(energy)
    db.commit()
    return {"message": "Energy deleted successfully"}
