import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./DeckPage.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";
import backToDeckImg from "../assets/back_to_deck_img.png";

const MAX_DECK_SIZE = 60;
const MAX_POKEMON = 20;
const MAX_TRAINER = 20;
const MAX_ENERGY = 20;

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

  const [recIndexPokemon, setRecIndexPokemon] = useState(0);
  const [recIndexTrainerEnergy, setRecIndexTrainerEnergy] = useState(0);

  const navigate = useNavigate();

  const fetchDeck = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in to view your deck.");
      navigate("/login");
      return;
    }
    try {
      const response = await axios.get("http://localhost:8000/deck", {
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

  useEffect(() => {
  console.log("Deck Recommendations:", deckData.recommendations);
  }, [deckData.recommendations]);

  const handleAddPokemon = async (rec) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in first");
      return;
    }

    const pokemonId = rec?.id || rec?.pokemon_id;

    if (!pokemonId) {
      console.error("Error: Pokémon ID is missing from data:", rec);
      alert("Failed to add Pokémon. No valid ID found.");
      return;
    }

    const payload = { pokemon_ids: [pokemonId], trainer_names: [], energy_types: [] };
    console.log("Sending Pokémon payload:", payload);

    await axios.post("http://localhost:8000/deck/", payload, {
    headers: { "Authorization": `Bearer ${token}`, "Content-Type":
     "application/json" },
     });

    fetchDeck();
  } catch (error) {
    console.error("Error adding Pokémon:", error.response ? error.response.data : error);
    alert("Failed to add the Pokémon to your deck.");
  }
};

const handleAddTrainer = async (trainerName) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in first");
      return;
    }

    const payload = { pokemon_ids: [], trainer_names: [trainerName], energy_types: [] };
    console.log("Sending Trainer payload:", payload);

    try {
    await axios.post("http://localhost:8000/deck/", payload, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });

    fetchDeck();
  } catch (error) {
    console.error("Error adding Trainer:", error.response ? error.response.data : error);
  }
};

const handleAddEnergy = async (energyType) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in first");
      return;
    }

    const payload = { pokemon_ids: [], trainer_names: [], energy_types: [energyType] };
    console.log("Sending Energy payload:", payload);

    await axios.post("http://localhost:8000/deck/", payload, {
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    });

    fetchDeck();
  } catch (error) {
    console.error("Error adding Energy:", error.response ? error.response.data : error);
    alert("Failed to add the Energy card to your deck.");
  }
};

  const handleDeletePokemon = async (pokemonId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please log in first");
        return;
      }
      await axios.delete(`http://localhost:8000/deck/pokemon/${pokemonId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      fetchDeck();
    } catch (error) {
      console.error("Error deleting Pokémon:", error);
      alert("Failed to delete the Pokémon from your deck.");
    }
  };

  const handleDeleteTrainer = async (trainerId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please log in first");
        return;
      }
      await axios.delete(`http://localhost:8000/deck/trainer/${trainerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      fetchDeck();
    } catch (error) {
      console.error("Error deleting Trainer:", error);
      alert("Failed to delete the Trainer card from your deck.");
    }
  };

  const handleDeleteEnergy = async (energyId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please log in first");
        return;
      }
      await axios.delete(`http://localhost:8000/deck/energy/${energyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      fetchDeck();
    } catch (error) {
      console.error("Error deleting Energy:", error);
      alert("Failed to delete the Energy card from your deck.");
    }
  };

  const totalDeckCount = deckData.deck.pokemon.length
    + deckData.deck.trainers.length
    + deckData.deck.energy.length;

  const trainerRecommendations = deckData.recommendations
  .filter(rec => rec.type === "trainer")
  .slice(0, 5);

  const energyRecommendations = deckData.recommendations
  .filter(rec => rec.type === "energy")
  .slice(0, 5);

  const topTrainerEnergyRecommendations = [...trainerRecommendations, ...energyRecommendations];

  return (
    <>
      <Header />
      <div className="deck-top-section">
        <div className="deck-page-three-cols">
          <div className="deck-left-col">
            <h3>Your Deck</h3>
            <p>
              Pokémon: {deckData.deck.pokemon.length} / {MAX_POKEMON}
            </p>
            <p>
              Trainer Cards: {deckData.deck.trainers.length} / {MAX_TRAINER}
            </p>
            <p>
              Energy Cards: {deckData.deck.energy.length} / {MAX_ENERGY}
            </p>
            <p>
              Total: {totalDeckCount} / {MAX_DECK_SIZE}
            </p>
            <div className="deck-strength-meter-container">
              <h4>Deck Strength</h4>
              <div className="deck-strength-meter">
                <div
                  className="meter-bar"
                  style={{ width: `${deckData.deck_score || 0}%` }}
                />
                <p className="meter-label">{deckData.deck_score || 0}%</p>
                </div>
              </div>
               <div className="back-to-deck-section">
               <img src={backToDeckImg} alt="Back to Deck"/>
                <div className="back-to-deck-builder-container">
              <button className="back-to-deck-builder-button" onClick={()=>
              navigate("/home")}>◀ Deck Builder</button>
              </div>
            </div>
          </div>
          <div className="deck-middle-col">
            <h3>Recommended Pokémon</h3>
            <div className="recommendations-slider-container">
              <div
                className="recommendations-slider"
                style={{
                  transform: `translateY(${-recIndexPokemon * 450}px)`,
                }}
              >
                {deckData.recommendations.filter(rec => rec.type === "pokemon").map((rec, index) => (
                  <div key={index} className="recommendation-card">
                    {rec.tcg_image_url ? (
                      <img
                        src={rec.tcg_image_url}
                        alt={rec.name}
                        style={{ width: "200px", height: "200px", objectFit: "contain" }}
                      />
                    ) : null}
                    <p style={{ color: "#262626", fontWeight: "bold", fontSize: "20px" }}>{rec.name}</p>
                    {rec.message && (
                      <p style={{ fontStyle: "italic" }}>{rec.message}</p>
                    )}
                       <button onClick={() => handleAddPokemon(rec)}>Add</button>

                  </div>
                ))}
              </div>
              <div className="vertical-slider-controls">
                <button
                  disabled={recIndexPokemon === 0}
                  onClick={() => setRecIndexPokemon((prev) => prev - 1)}
                >
                  ▲
                </button>
                <button
                  disabled={
                  deckData.recommendations.filter(r => r.type === "pokemon").length === 0 ||
                  (recIndexPokemon + 2) * 200>= deckData.recommendations.filter(r => r.type
                   === "pokemon").length * 200}
                  onClick={() => setRecIndexPokemon((prev) => prev + 1)}
                >
                  ▼
                </button>
              </div>
            </div>
          </div>
        <div className="deck-right-col">
         <h3>Suggested Trainer & Energy</h3>
          <div className="recommendations-slider-container">
           <div className="recommendations-slider" style={{ transform:
            `translateY(${-recIndexTrainerEnergy * 450}px)`,}}>
             {topTrainerEnergyRecommendations.map((rec, idx) => (
            <div key={idx} className="recommendation-card">
            {rec.tcg_image_url && (
              <img
                src={rec.tcg_image_url}
                alt={rec.name}
                style={{ width: "200px", height: "200px", objectFit: "contain" }}
              />
            )}
            <p style={{ color: "#262626", fontWeight: "bold", fontSize: "20px" }}>{rec.name}</p>
            {rec.message && <p style={{ fontStyle: "italic" }}>{rec.message}</p>}
            <button onClick={() => rec.type === "trainer" ? handleAddTrainer(rec.name)
            : handleAddEnergy(rec.name)}> Add </button>
            </div>
            ))}
           </div>
            <div className="vertical-slider-controls">
              <button
                disabled={recIndexTrainerEnergy === 0}
                onClick={() => setRecIndexTrainerEnergy((prev) => prev - 1)}
              >
                ▲
              </button>
              <button
                disabled={
                 deckData.recommendations.filter(r => r.type === "trainer"
                  || r.type === "energy").length === 0 ||
                  (recIndexTrainerEnergy + 2) * 200 >= deckData.recommendations
                  .filter(r => r.type === "trainer" || r.type === "energy").length * 200}
                onClick={() => setRecIndexTrainerEnergy((prev) => prev + 1)}
              >
                ▼
              </button>
            </div>
          </div>
        </div>
       </div>
      </div>
      <div className="deck-page-container">
        <div className="deck-cards-section">
          <div className="deck-cards-group">
            <h4>Pokémon</h4>
            <div className="deck-cards-grid">
              {(showMorePokemon
                ? deckData.deck.pokemon
                : deckData.deck.pokemon.slice(0, 5)
              ).map((card) => (
                <div key={card.id} className="deck-card">
                  <img
                    src={`https://img.pokemondb.net/artwork/large/${card.name}.jpg`}
                    alt={card.name}
                    style={{ width: "150px", height: "150px", objectFit: "contain" }}
                  />
                  <p>{card.name}</p>
                  <button onClick={() => handleDeletePokemon(card.id)}>Delete</button>
                </div>
              ))}
            </div>
            {deckData.deck.pokemon.length > 5 && !showMorePokemon && (
              <button onClick={() => setShowMorePokemon(true)}>See More</button>
            )}
          </div>
          <div className="deck-cards-group">
            <h4>Trainers</h4>
            <div className="deck-cards-grid">
              {(showMoreTrainers
                ? deckData.deck.trainers
                : deckData.deck.trainers.slice(0, 5)
              ).map((card, idx) => (
                <div key={`trainer-${idx}`} className="deck-card">
                  <img
                    src={card.tcg_image_url}
                    alt={card.name}
                    style={{ width: "150px", height: "150px", objectFit: "contain" }}
                  />
                  <p>{card.name}</p>
                   <button onClick={() => handleDeleteTrainer(card.id)}>Delete</button>
                </div>
              ))}
            </div>
            {deckData.deck.trainers.length > 5 && !showMoreTrainers && (
              <button onClick={() => setShowMoreTrainers(true)}>See More</button>
            )}
          </div>
          <div className="deck-cards-group">
            <h4>Energy</h4>
            <div className="deck-cards-grid">
              {(showMoreEnergy
                ? deckData.deck.energy
                : deckData.deck.energy.slice(0, 5)
              ).map((card, idx) => (
                <div key={`energy-${idx}`} className="deck-card">
                  <img
                    src={card.tcg_image_url}
                    alt={card.name}
                    style={{ width: "150px", height: "150px", objectFit: "contain" }}
                  />
                  <p>{card.name}</p>
                  <button onClick={() => handleDeleteEnergy(card.id)}>Delete</button>
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
