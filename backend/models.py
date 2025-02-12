from sqlalchemy import Column, Integer, String, ForeignKey, JSON
from sqlalchemy.orm import relationship
from database import Base


# ✅ User Model (For Authentication)
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)

    decks = relationship("Deck", back_populates="user")


# ✅ Pokémon Model (Now with TCG Data)

class Pokemon(Base):
    __tablename__ = "pokemon"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    types = Column(JSON)
    strengths = Column(JSON)
    weaknesses = Column(JSON)
    moves = Column(JSON)
    abilities = Column(JSON)  # ✅ NEW: Store abilities
    hp = Column(Integer, default=0)  # ✅ NEW: Store HP
    attack = Column(Integer, default=0)  # ✅ NEW: Store Attack
    defense = Column(Integer, default=0)  # ✅ NEW: Store Defense
    special_attack = Column(Integer, default=0)  # ✅ NEW: Store Special Attack
    special_defense = Column(Integer, default=0)  # ✅ NEW: Store Special Defense
    speed = Column(Integer, default=0)  # ✅ NEW: Store Speed

    # ✅ Add TCG Attributes
    tcg_id = Column(String, nullable=True)
    tcg_image_url = Column(String, nullable=True)
    tcg_set = Column(String, nullable=True)
    tcg_rarity = Column(String, nullable=True)


# ✅ Deck Model (User's Pokémon Deck)
class Deck(Base):
    __tablename__ = "decks"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    user = relationship("User", back_populates="decks")
    deck_pokemon = relationship("DeckPokemon", back_populates="deck", cascade="all, delete")

    deck_trainer = relationship("DeckTrainer", back_populates="deck", cascade="all, delete")
    deck_energy = relationship("DeckEnergy", back_populates="deck", cascade="all, delete")


# ✅ Deck-Pokemon Model (Link Between Decks and Pokémon)
class DeckPokemon(Base):
    __tablename__ = "deck_pokemon"
    id = Column(Integer, primary_key=True, index=True)
    deck_id = Column(Integer, ForeignKey("decks.id", ondelete="CASCADE"))
    pokemon_id = Column(Integer, ForeignKey("pokemon.id"))

    deck = relationship("Deck", back_populates="deck_pokemon")


class Trainer(Base):
    __tablename__ = "trainers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    tcg_id = Column(String, nullable=True)
    tcg_image_url = Column(String, nullable=True)
    tcg_set = Column(String, nullable=True)
    tcg_rarity = Column(String, nullable=True)
    effect = Column(String, nullable=True)  # Simple text or short description

    # Relationship to DeckTrainer (the junction table)
    deck_trainer = relationship("DeckTrainer", back_populates="trainer", cascade="all, delete")


class Energy(Base):
    __tablename__ = "energy"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    tcg_id = Column(String, nullable=True)
    tcg_image_url = Column(String, nullable=True)
    tcg_set = Column(String, nullable=True)
    tcg_rarity = Column(String, nullable=True)
    energy_type = Column(String, nullable=True)

    # Relationship to DeckEnergy (the junction table)
    deck_energy = relationship("DeckEnergy", back_populates="energy", cascade="all, delete")


class DeckTrainer(Base):
    __tablename__ = "deck_trainers"

    id = Column(Integer, primary_key=True, index=True)
    deck_id = Column(Integer, ForeignKey("decks.id", ondelete="CASCADE"))
    trainer_id = Column(Integer, ForeignKey("trainers.id", ondelete="CASCADE"))

    # Relationship to Deck
    deck = relationship("Deck", back_populates="deck_trainer")

    # Relationship to Trainer
    trainer = relationship("Trainer", back_populates="deck_trainer")


class DeckEnergy(Base):
    __tablename__ = "deck_energy"

    id = Column(Integer, primary_key=True, index=True)
    deck_id = Column(Integer, ForeignKey("decks.id", ondelete="CASCADE"))
    energy_id = Column(Integer, ForeignKey("energy.id", ondelete="CASCADE"))

    # Relationship to Deck
    deck = relationship("Deck", back_populates="deck_energy")

    # Relationship to Energy
    energy = relationship("Energy", back_populates="deck_energy")
