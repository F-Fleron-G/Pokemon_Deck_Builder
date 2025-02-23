from pydantic import BaseModel, EmailStr, constr
from typing import List, Optional

"""
    This module defines Pydantic models (schemas) for user registration, login,
    deck updates, and Trainer/Energy card details. These schemas are used for data
    validation and API documentation.
"""


class UserCreate(BaseModel):
    email: EmailStr
    password: constr(min_length=6)

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: EmailStr
    password: str

    class Config:
        from_attributes = True


class DeckUpdate(BaseModel):
    pokemon_ids: List[int]
    trainer_names: Optional[List[str]] = []
    energy_types: Optional[List[str]] = []

    class Config:
        from_attributes = True


class TrainerBase(BaseModel):
    name: str
    tcg_id: Optional[str] = None
    tcg_image_url: Optional[str] = None
    tcg_set: Optional[str] = None
    tcg_rarity: Optional[str] = None
    effect: Optional[str] = None


class TrainerCreate(TrainerBase):
    pass


class TrainerUpdate(TrainerBase):
    pass


class TrainerOut(TrainerBase):
    id: int

    class Config:
        orm_mode = True


class EnergyBase(BaseModel):
    name: str
    tcg_id: Optional[str] = None
    tcg_image_url: Optional[str] = None
    tcg_set: Optional[str] = None
    tcg_rarity: Optional[str] = None
    energy_type: Optional[str] = None


class EnergyCreate(EnergyBase):
    pass


class EnergyUpdate(EnergyBase):
    pass


class EnergyOut(EnergyBase):
    id: int

    class Config:
        orm_mode = True
