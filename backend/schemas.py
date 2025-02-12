from pydantic import BaseModel, EmailStr, constr
from typing import List, Optional


# ✅ User Signup Schema
class UserCreate(BaseModel):
    """Schema for user registration"""
    email: EmailStr
    password: constr(min_length=6)  # Enforce a minimum password length

    class Config:
        from_attributes = True  # Enables ORM compatibility


# ✅ User Login Schema
class UserLogin(BaseModel):
    """Schema for user login"""
    email: EmailStr
    password: str

    class Config:
        from_attributes = True


# ✅ Deck Update Schema - List of Pokémon IDs
class DeckUpdate(BaseModel):
    """Schema for updating a user's deck with Pokémon IDs"""
    pokemon_ids: List[int]  # A list of Pokémon IDs to save in the user's deck

    class Config:
        from_attributes = True


# -- Trainer Schemas --
class TrainerBase(BaseModel):
    name: str
    tcg_id: Optional[str] = None
    tcg_image_url: Optional[str] = None
    tcg_set: Optional[str] = None
    tcg_rarity: Optional[str] = None
    effect: Optional[str] = None


class TrainerCreate(TrainerBase):
    pass  # If identical to TrainerBase


class TrainerUpdate(TrainerBase):
    pass  # Could override if partial updates differ


class TrainerOut(TrainerBase):
    id: int

    class Config:
        orm_mode = True


# -- Energy Schemas --
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
