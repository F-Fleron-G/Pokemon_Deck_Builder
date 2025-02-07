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
    tcg_id = Column(String, nullable=True)  # Card ID
    tcg_image_url = Column(String, nullable=True)  # Image URL
    tcg_set = Column(String, nullable=True)  # Set Name
    tcg_rarity = Column(String, nullable=True)  # Rarity


# ✅ Deck Model (User's Pokémon Deck)
class Deck(Base):
    __tablename__ = "decks"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    user = relationship("User", back_populates="decks")
    deck_pokemon = relationship("DeckPokemon", back_populates="deck", cascade="all, delete")


# ✅ Deck-Pokemon Model (Link Between Decks and Pokémon)
class DeckPokemon(Base):
    __tablename__ = "deck_pokemon"
    id = Column(Integer, primary_key=True, index=True)
    deck_id = Column(Integer, ForeignKey("decks.id", ondelete="CASCADE"))
    pokemon_id = Column(Integer, ForeignKey("pokemon.id"))

    deck = relationship("Deck", back_populates="deck_pokemon")
