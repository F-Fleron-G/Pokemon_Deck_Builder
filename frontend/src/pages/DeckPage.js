import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./DeckPage.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";

const MAX_DECK_SIZE = 60;

function DeckPage() {
  const [deckData, setDeckData] = useState({
    deck: { pokemon: [], trainers: [], energy: [] },
    deck_score: 0,
    recommendations: [],
    suggestionImage: null,
  });

  const [showMorePokemon, setShowMorePokemon] = useState(false);
  const [showMoreTrainers, setShowMoreTrainers] = useState(false);
  const [showMoreEnergy, setShowMoreEnergy] = useState(false);

  const navigate = useNavigate();

  const fetchDeck = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in to view your deck.");
      navigate("/login");
      return;
    }
    try {
      const response = await axios.get("http://localhost:8000/user/deck", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setDeckData({
        deck: {
          pokemon: response.data.deck?.pokemon || [],
          trainers: response.data.deck?.trainers || [],
          energy: response.data.deck?.energy || [],
        },
        deck_score: response.data.deck_score || 0,
        recommendations: response.data.recommendations || [],
        suggestionImage: response.data.suggestionImage || null,
      });

    } catch (error) {
      console.error("Error fetching deck:", error);
      alert("Failed to load your deck.");
    }
  }, [navigate]);

  useEffect(() => {
    fetchDeck();
  }, [fetchDeck]);

  return (
    <>
      <Header />
      <div className="deck-top-section">
        <div className="deck-summary-column">
          <h3>Your Deck</h3>
          <p>Pokémon: {deckData.deck.pokemon.length}</p>
          <p>Trainer Cards: {deckData.deck.trainers.length}</p>
          <p>Energy Cards: {deckData.deck.energy.length}</p>
          <p>Total: {deckData.deck.pokemon.length + deckData.deck.trainers.length + deckData.deck.energy.length} / {MAX_DECK_SIZE}</p>
        </div>
        <div className="deck-recommendations-column">
          <h3>Recommendations</h3>
          <ul>
            {deckData.recommendations.map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </div>
        <div className="deck-suggestion-column">
          <h3>Suggested Addition</h3>
          {deckData.suggestionImage ? (
            <img
              src={deckData.suggestionImage}
              alt="Suggested Card"
              className="suggestion-img"
            />
          ) : (
            <p>No suggestion available</p>
          )}
        </div>
      </div>

      <div className="deck-page-container" style={{ padding: "20px", textAlign: "center" }}>
        <div className="deck-cards-section">
          {/* Pokémon Cards Section */}
          <div className="deck-cards-group">
            <h4>Pokémon</h4>
            <div className="deck-cards-grid">
              {(showMorePokemon ? deckData.deck.pokemon : deckData.deck.pokemon.slice(0, 5)).map((card) => (
                <div key={card.id} className="deck-card">
                  <img
                    src={`https://img.pokemondb.net/artwork/large/${card.name}.jpg`}
                    alt={card.name}
                    style={{ width: "150px", height: "150px", objectFit: "contain" }}
                  />
                  <p>{card.name}</p>
                </div>
              ))}
            </div>
            {deckData.deck.pokemon.length > 5 && !showMorePokemon && (
              <button onClick={() => setShowMorePokemon(true)}>See More</button>
            )}
          </div>

          {/* Trainer Cards Section */}
          <div className="deck-cards-group">
            <h4>Trainers</h4>
            <div className="deck-cards-grid">
              {(showMoreTrainers ? deckData.deck.trainers : deckData.deck.trainers.slice(0, 5)).map((card, idx) => (
                <div key={`trainer-${idx}`} className="deck-card">
                  <img
                    src={card.tcg_image_url}
                    alt={card.name}
                    style={{ width: "150px", height: "150px", objectFit: "contain" }}
                  />
                  <p>{card.name}</p>
                </div>
              ))}
            </div>
            {deckData.deck.trainers.length > 5 && !showMoreTrainers && (
              <button onClick={() => setShowMoreTrainers(true)}>See More</button>
            )}
          </div>

          {/* Energy Cards Section */}
          <div className="deck-cards-group">
            <h4>Energy</h4>
            <div className="deck-cards-grid">
              {(showMoreEnergy ? deckData.deck.energy : deckData.deck.energy.slice(0, 5)).map((card, idx) => (
                <div key={`energy-${idx}`} className="deck-card">
                  <img
                    src={card.tcg_image_url}
                    alt={card.name}
                    style={{ width: "150px", height: "150px", objectFit: "contain" }}
                  />
                  <p>{card.name}</p>
                </div>
              ))}
            </div>
            {deckData.deck.energy.length > 5 && !showMoreEnergy && (
              <button onClick={() => setShowMoreEnergy(true)}>See More</button>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default DeckPage;
