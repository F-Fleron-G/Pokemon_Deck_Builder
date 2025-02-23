from sqlalchemy import Column, Integer, String, ForeignKey, JSON
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    """
        Represents a user in the system with unique email and hashed password.
    """

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)

    decks = relationship("Deck", back_populates="user")


class Pokemon(Base):
    """
        Represents a Pokémon with detailed attributes including name, image URL,
        types, strengths, weaknesses, moves, abilities, and stats.
    """

    __tablename__ = "pokemon"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    image_url = Column(String)
    types = Column(JSON)
    strengths = Column(JSON)
    weaknesses = Column(JSON)
    moves = Column(JSON)
    abilities = Column(JSON)
    hp = Column(Integer, default=0)
    attack = Column(Integer, default=0)
    defense = Column(Integer, default=0)
    special_attack = Column(Integer, default=0)
    special_defense = Column(Integer, default=0)
    speed = Column(Integer, default=0)


class Deck(Base):
    """
        Represents a deck belonging to a user, containing collections of Pokémon,
        Trainer, and Energy cards.
    """

    __tablename__ = "decks"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    user = relationship("User", back_populates="decks")
    deck_pokemon = relationship("DeckPokemon", back_populates="deck",
                                cascade="all, delete")

    deck_trainer = relationship("DeckTrainer", back_populates="deck",
                                cascade="all, delete")
    deck_energy = relationship("DeckEnergy", back_populates="deck",
                               cascade="all, delete")


class DeckPokemon(Base):
    """
        Association table linking a deck to its Pokémon.
    """

    __tablename__ = "deck_pokemon"
    id = Column(Integer, primary_key=True, index=True)
    deck_id = Column(Integer, ForeignKey("decks.id", ondelete="CASCADE"))
    pokemon_id = Column(Integer, ForeignKey("pokemon.id"))

    deck = relationship("Deck", back_populates="deck_pokemon")


class Trainer(Base):
    """
        Represents a Trainer card from the TCG with details like name, image, set,
        rarity, and effect.
    """

    __tablename__ = "trainers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    tcg_id = Column(String, nullable=True)
    tcg_image_url = Column(String, nullable=True)
    tcg_set = Column(String, nullable=True)
    tcg_rarity = Column(String, nullable=True)
    effect = Column(String, nullable=True)

    deck_trainer = relationship("DeckTrainer", back_populates="trainer",
                                cascade="all, delete")


class Energy(Base):
    """
        Represents an Energy card from the TCG with details like name, image, set,
        rarity, and energy type.
    """

    __tablename__ = "energy"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    tcg_id = Column(String, nullable=True)
    tcg_image_url = Column(String, nullable=True)
    tcg_set = Column(String, nullable=True)
    tcg_rarity = Column(String, nullable=True)
    energy_type = Column(String, nullable=True)

    deck_energy = relationship("DeckEnergy", back_populates="energy",
                               cascade="all, delete")


class DeckTrainer(Base):
    """
        Association table linking a deck to its Trainer cards.
    """

    __tablename__ = "deck_trainers"

    id = Column(Integer, primary_key=True, index=True)
    deck_id = Column(Integer, ForeignKey("decks.id", ondelete="CASCADE"))
    trainer_id = Column(Integer, ForeignKey("trainers.id", ondelete="CASCADE"))

    deck = relationship("Deck", back_populates="deck_trainer")

    trainer = relationship("Trainer", back_populates="deck_trainer")


class DeckEnergy(Base):
    """
        Association table linking a deck to its Energy cards.
    """

    __tablename__ = "deck_energy"

    id = Column(Integer, primary_key=True, index=True)
    deck_id = Column(Integer, ForeignKey("decks.id", ondelete="CASCADE"))
    energy_id = Column(Integer, ForeignKey("energy.id", ondelete="CASCADE"))

    deck = relationship("Deck", back_populates="deck_energy")

    energy = relationship("Energy", back_populates="deck_energy")
