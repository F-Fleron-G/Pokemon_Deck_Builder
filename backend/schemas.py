from pydantic import BaseModel, EmailStr, constr
from typing import List, Optional

"""
    This module defines Pydantic models (schemas) for user registration, login,
    deck updates, and Trainer/Energy card details. These schemas are used for data
    validation and API documentation.
"""


class UserCreate(BaseModel):
    """
        Schema for creating a new user account.

        Attributes:
            email (EmailStr): A valid email address for the user.
            password (constr): A password string with at least 6 characters.
    """

    email: EmailStr
    password: constr(min_length=6)

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    """
        Schema for user login credentials.

        Attributes:
            email (EmailStr): The user's email address.
            password (str): The user's password in plaintext.
    """

    email: EmailStr
    password: str

    class Config:
        from_attributes = True


class DeckUpdate(BaseModel):
    """
        Schema for updating a user's deck with new cards.

        Attributes:
            pokemon_ids (List[int]): A list of Pokémon IDs to add.
            trainer_names (List[str]): Optional list of Trainer card names to add.
            energy_types (List[str]): Optional list of Energy types to add.
    """

    pokemon_ids: List[int]
    trainer_names: Optional[List[str]] = []
    energy_types: Optional[List[str]] = []

    class Config:
        from_attributes = True


class TrainerBase(BaseModel):
    """
       Base schema for Trainer card data, which includes shared attributes
       for creating, updating, and reading Trainer objects.

       Attributes:
           name (str): The name of the trainer card.
           tcg_id (str): The unique TCG ID for this trainer card.
           tcg_image_url (str): A URL to the trainer card’s image.
           tcg_set (str): The set name the trainer card belongs to.
           tcg_rarity (str): The rarity of the trainer card.
           effect (str): The trainer card’s effect text.
    """

    name: str
    tcg_id: Optional[str] = None
    tcg_image_url: Optional[str] = None
    tcg_set: Optional[str] = None
    tcg_rarity: Optional[str] = None
    effect: Optional[str] = None


class TrainerCreate(TrainerBase):
    """
        Schema for creating a new Trainer card entry.
        Inherits attributes from TrainerBase.
    """

    pass


class TrainerUpdate(TrainerBase):
    """
        Schema for updating an existing Trainer card entry.
        Inherits attributes from TrainerBase.
    """

    pass


class TrainerOut(TrainerBase):
    """
        Schema for reading a Trainer card from the API, with an additional ID.

        Attributes:
            id (int): The unique database ID of the trainer record.
    """

    id: int

    class Config:
        from_attributes = True


class EnergyBase(BaseModel):
    """
       Base schema for Energy card data, which includes shared attributes
       for creating, updating, and reading Energy objects.

       Attributes:
           name (str): The name of the energy card.
           tcg_id (str): The unique TCG ID for this energy card.
           tcg_image_url (str): A URL to the card’s image.
           tcg_set (str): The set name the energy card belongs to.
           tcg_rarity (str): The rarity of the energy card.
           energy_type (str): The specific type of energy (Fire, Water, etc.).
    """

    name: str
    tcg_id: Optional[str] = None
    tcg_image_url: Optional[str] = None
    tcg_set: Optional[str] = None
    tcg_rarity: Optional[str] = None
    energy_type: Optional[str] = None


class EnergyCreate(EnergyBase):
    """
        Schema for creating a new Energy card entry.
        Inherits attributes from EnergyBase.
    """

    pass


class EnergyUpdate(EnergyBase):
    """
        Schema for updating an existing Energy card entry.
        Inherits attributes from EnergyBase.
    """

    pass


class EnergyOut(EnergyBase):
    """
        Schema for reading an Energy card from the API, with an additional ID.

        Attributes:
            id (int): The unique database ID of the energy record.
    """

    id: int

    class Config:
        from_attributes = True
