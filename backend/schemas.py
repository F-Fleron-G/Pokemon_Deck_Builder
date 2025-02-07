from pydantic import BaseModel, EmailStr, constr
from typing import List


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
