import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./HomePage.css";
import Header from "../components/Header";
import Footer from "../components/Footer";

const MAX_DECK_SIZE = 60;
const MAX_POKEMON = 20;
const MAX_TRAINER = 20;
const MAX_ENERGY = 20;

function HomePage() {
  const navigate = useNavigate();
  const wheelTimeoutRef = useRef(null);
  const touchStartYRef = useRef(null);
  const sliderContainerRef = useRef(null);

  const [pokemonList, setPokemonList] = useState([]);
  const [trainersList, setTrainersList] = useState([]);
  const [energyList, setEnergyList] = useState([]);

  const [cardCategory, setCardCategory] = useState("pokemon");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedCardDetail, setSelectedCardDetail] = useState(null);

  const [deck, setDeck] = useState([]);
  const [deckScore, setDeckScore] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  const [hoveredFilter, setHoveredFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [typesList, setTypesList] = useState("");

  const [trainerFilter, setTrainerFilter] = useState("");
  const [energyFilter, setEnergyFilter] = useState("");

  const [caughtCardIndex, setCaughtCardIndex] = useState(null);
  const [isCatching, setIsCatching] = useState(false);

  const getUnifiedCards = useCallback(() => {
    if (cardCategory === "pokemon") {
      return pokemonList.map((p) => ({ ...p, type: "pokemon" }));
    } else if (cardCategory === "trainer") {
      return trainersList.map((t) => ({ ...t, type: "trainer" }));
    } else if (cardCategory === "energy") {
      return energyList.map((e) => ({ ...e, type: "energy" }));
    }
    return [];
  }, [cardCategory, pokemonList, trainersList, energyList]);

  const unifiedCards = getUnifiedCards();

  useEffect(() => {
    const sliderElem = sliderContainerRef.current;
    if (!sliderElem) return;

    const nonPassiveWheelHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (wheelTimeoutRef.current) return;
      if (e.deltaY < 0 && selectedIndex > 0) {
        setSelectedIndex((prev) => prev - 1);
      } else if (e.deltaY > 0 && selectedIndex < unifiedCards.length - 1) {
        setSelectedIndex((prev) => prev + 1);
      }
      wheelTimeoutRef.current = setTimeout(() => {
        wheelTimeoutRef.current = null;
      }, 300);
    };

    sliderElem.addEventListener("wheel", nonPassiveWheelHandler, { passive: false });
    return () => {
      sliderElem.removeEventListener("wheel", nonPassiveWheelHandler);
    };
  }, [selectedIndex, unifiedCards.length]);

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const res = await axios.get("https://pokeapi.co/api/v2/type");
        setTypesList(res.data.results);
      } catch (error) {
        console.error("Error fetching types:", error);
      }
    };
    fetchTypes();
  }, []);

  useEffect(() => {
    const fetchPokemonList = async () => {
      try {
        if (selectedType) {
          const res = await axios.get(`https://pokeapi.co/api/v2/type/${selectedType}`);
          const pokemonOfType = res.data.pokemon.map((p) => p.pokemon);
          setPokemonList(pokemonOfType);
        } else {
          const res = await axios.get("https://pokeapi.co/api/v2/pokemon?limit=1000");
          setPokemonList(res.data.results);
        }
      } catch (error) {
        console.error("Error fetching Pokémon list:", error);
      }
    };
    if (cardCategory === "pokemon") {
      fetchPokemonList();
    }
  }, [selectedType, cardCategory]);

  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        const res = await axios.get("http://localhost:8000/tcg/external/trainers");
        setTrainersList(res.data);
      } catch (error) {
        console.error("Error fetching trainers:", error);
      }
    };
    if (cardCategory === "trainer") {
      fetchTrainers();
    }
  }, [cardCategory]);

  useEffect(() => {
    const fetchEnergies = async () => {
      try {
        const res = await axios.get("http://localhost:8000/tcg/external/energy");
        setEnergyList(res.data);
      } catch (error) {
        console.error("Error fetching energy cards:", error);
      }
    };
    if (cardCategory === "energy") {
      fetchEnergies();
    }
  }, [cardCategory]);

  useEffect(() => {
    const fetchUserDeck = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const response = await axios.get("http://localhost:8000/deck", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const serverDeck = [];
        response.data.deck.pokemon.forEach((p) => {
          serverDeck.push({ id: p.id, name: p.name, type: "pokemon" });
        });
        response.data.deck.trainers.forEach((t) => {
          serverDeck.push({ id: t.id, name: t.name, type: "trainer" });
        });
        response.data.deck.energy.forEach((e) => {
          serverDeck.push({ id: e.id, name: e.name, type: "energy" });
        });
        setDeck(serverDeck);
      } catch (error) {
        console.error("Error loading user deck:", error);
        setDeck([]);
      }
    };
    fetchUserDeck();
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchTerm]);

  const filteredPokemon = pokemonList.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredTrainers = trainersList.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (!trainerFilter || t.tcg_rarity === trainerFilter)
  );
  const filteredEnergies = energyList.filter((e) =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (!energyFilter || e.energy_type === energyFilter)
  );

const uniqueTrainerTypes = useMemo(() => {
const types = new Set();
  trainersList.forEach((trainer) => {
    if (trainer.tcg_rarity) types.add(trainer.tcg_rarity);
  });
    return Array.from(types);
  }, [trainersList]);

const uniqueEnergyTypes = useMemo(() => {
const types = new Set();
    energyList.forEach((energy) => {
    if (energy.energy_type) types.add(energy.energy_type);
  });
    return Array.from(types);
  }, [energyList]);


const unifiedCardsFiltered = useMemo(() => {
    if (cardCategory === "pokemon") {
      return filteredPokemon.map((p) => ({ ...p, type: "pokemon" }));
    } else if (cardCategory === "trainer") {
      return filteredTrainers.map((t) => ({ ...t, type: "trainer" }));
    } else if (cardCategory === "energy") {
      return filteredEnergies.map((e) => ({ ...e, type: "energy" }));
    }
    return [];
  }, [cardCategory, filteredPokemon, filteredTrainers, filteredEnergies]);

  useEffect(() => {
    const updateDetail = async () => {
      if (unifiedCardsFiltered.length > 0) {
        const card = unifiedCardsFiltered[selectedIndex];
        if (card && card.type === "pokemon" && card.url) {
          try {
            const res = await axios.get(card.url);
            setSelectedCardDetail({ ...res.data, type: "pokemon" });
          } catch (error) {
            console.error("Error fetching Pokémon details:", error);
          }
        } else {
          setSelectedCardDetail(card);
        }
      }
    };
    updateDetail();
  }, [selectedIndex, unifiedCardsFiltered]);

  const handleCardClick = (card, index) => {
    setSelectedIndex(index);
    if (card.type === "pokemon" && card.url) {
      axios.get(card.url)
        .then((res) => setSelectedCardDetail({ ...res.data, type: "pokemon" }))
        .catch((error) => console.error("Error fetching Pokémon details:", error));
    } else {
      setSelectedCardDetail(card);
    }
  };

  const handleTouchStart = (e) => {
    touchStartYRef.current = e.touches[0].clientY;
  };
  const handleTouchMove = (e) => {
    if (!touchStartYRef.current) return;
    const currentY = e.touches[0].clientY;
    const diff = touchStartYRef.current - currentY;
    if (Math.abs(diff) > 30) {
      if (diff > 0 && selectedIndex < unifiedCardsFiltered.length - 1) {
        setSelectedIndex((prev) => prev + 1);
      } else if (diff < 0 && selectedIndex > 0) {
        setSelectedIndex((prev) => prev - 1);
      }
      touchStartYRef.current = currentY;
    }
    e.preventDefault();
    e.stopPropagation();
  };
  const handleTouchEnd = () => {
    touchStartYRef.current = null;
  };

  const updateDeck = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Hey, you must login first!");
        return;
      }

      const payload = {
        pokemon_ids: deck.filter((c) => c.type === "pokemon").map((c) => c.id),
        trainer_names: deck.filter((c) => c.type === "trainer").map((c) => c.name),
        energy_types: deck.filter((c) => c.type === "energy").map((c) => c.name),
      };

      const response = await axios.post("http://localhost:8000/deck", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      setDeckScore(response.data.deck_score);
      setRecommendations(response.data.recommendations);

      alert("Deck updated successfully!");
      // Clear the local deck state
      setDeck([]);
    } catch (error) {
      console.error("Error updating deck:", error);
      alert("Failed to update your deck. Please log in first or check console.");
    }
  };

  const addCardToDeck = async (card) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Hey, you need to login first!");
      return;
    }

    if (deck.length >= MAX_DECK_SIZE) {
      alert("Your deck is full! (Max: 60 cards total)");
      return;
    }
    const countByType = deck.reduce((acc, cur) => {
      acc[cur.type] = (acc[cur.type] || 0) + 1;
      return acc;
    }, {});
    if (card.type === "pokemon" && (countByType.pokemon || 0) >= MAX_POKEMON) {
      alert("Maximum of 20 Pokémon cards allowed!");
      return;
    }
    if (card.type === "trainer" && (countByType.trainer || 0) >= MAX_TRAINER) {
      alert("Maximum of 20 Trainer cards allowed!");
      return;
    }
    if (card.type === "energy" && (countByType.energy || 0) >= MAX_ENERGY) {
      alert("Maximum of 20 Energy cards allowed!");
      return;
    }

    if (card.type === "pokemon" && !card.id && card.url) {
    const parts = card.url.split("/").filter(Boolean);
    card.id = parseInt(parts[parts.length - 1], 10);
    }

    if (card.type === "trainer" && card.name) {
        card.name = card.name.trim();
    }

    setDeck((prevDeck) => [...prevDeck, card]);
    setIsCatching(true);
    setTimeout(() => setIsCatching(false), 1000);

    setCaughtCardIndex(selectedIndex);
    setTimeout(() => setCaughtCardIndex(null), 1000);
  };

  const deckSummary = {
    pokemon: deck.filter((c) => c.type === "pokemon").length,
    trainer: deck.filter((c) => c.type === "trainer").length,
    energy: deck.filter((c) => c.type === "energy").length,
    total: deck.length,
  };

  return (
    <>
      <Header />
      <div className="app-container">
        {/* Search Bar */}
        <div className="search-filter-top">
          <input
            type="text"
            className="search-input"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      <div
        className="filter-group"
        style={{ display: "inline-block", position: "relative", marginRight: "10px" }}
        onMouseEnter={() => setHoveredFilter("pokemon")}
        onMouseLeave={() => setHoveredFilter("")}
      >
        <button
          className={cardCategory === "pokemon" ? "active-tab" : ""}
          onClick={() => {
            setCardCategory("pokemon");
            setSelectedIndex(0);
          }}
        >
          Pokémon
        </button>
        {hoveredFilter === "pokemon" && typesList && (
          <div
            className="dropdown-container"
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              zIndex: 10,
              width: "100%"
            }}
          >
            <select
              className="type-select"
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setSelectedIndex(0);
              }}
            >
              <option value="">All Types</option>
              {typesList.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.name.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div
        className="filter-group"
        style={{ display: "inline-block", position: "relative", marginRight: "10px" }}
        onMouseEnter={() => setHoveredFilter("trainer")}
        onMouseLeave={() => setHoveredFilter("")}
      >
        <button
          className={cardCategory === "trainer" ? "active-tab" : ""}
          onClick={() => {
            setCardCategory("trainer");
            setSelectedIndex(0);
          }}
        >
          Trainers
        </button>
        {hoveredFilter === "trainer" && uniqueTrainerTypes.length > 0 && (
          <div
            className="dropdown-container"
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              zIndex: 10,
              width: "100%"
            }}
          >
            <select
              className="type-select"
              value={trainerFilter}
              onChange={(e) => {
                setTrainerFilter(e.target.value);
                setSelectedIndex(0);
              }}
            >
              <option value="">All Trainer Types</option>
              {uniqueTrainerTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div
        className="filter-group"
        style={{ display: "inline-block", position: "relative", marginRight: "10px" }}
        onMouseEnter={() => setHoveredFilter("energy")}
        onMouseLeave={() => setHoveredFilter("")}
      >
        <button
          className={cardCategory === "energy" ? "active-tab" : ""}
          onClick={() => {
            setCardCategory("energy");
            setSelectedIndex(0);
          }}
        >
      Energy
        </button>
        {hoveredFilter === "energy" && uniqueEnergyTypes.length > 0 && (
          <div
            className="dropdown-container"
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              zIndex: 10,
              width: "100%"
            }}
          >
            <select
              className="type-select"
              value={energyFilter}
              onChange={(e) => {
                setEnergyFilter(e.target.value);
                setSelectedIndex(0);
              }}
            >
              <option value="">All Energy Types</option>
              {uniqueEnergyTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
        <div className="deck-builder-area">
          <div className="left-col">
            <div
              className="slider-container"
              ref={sliderContainerRef}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div
                className="cards-slider"
                style={{
                  transform: `translateY(${165 - selectedIndex * 270}px)`,
                  transition: "transform 0.3s ease",
                }}
              >
                {unifiedCardsFiltered.map((card, i) => (
                  <div
                    key={`${card.name || card.tcg_id}-${i}`}
                    className={`card-item ${i === selectedIndex ? "active" : "inactive"}
                      ${i === caughtCardIndex ? "caught" : ""}`}
                    style={{
                      transform: i === selectedIndex ? "scale(1.3)" : "scale(1)",
                      opacity: i === selectedIndex ? 1 : 0.4,
                      transition: "transform 0.3s, opacity 0.3s",
                    }}
                    onClick={() => handleCardClick(card, i)}
                  >
                    {card.type === "pokemon" ? (
                      <img
                        src={`https://img.pokemondb.net/artwork/large/${card.name}.jpg`}
                        alt={card.name}
                        className="card-img"
                      />
                    ) : (
                      <img
                        src={card.tcg_image_url}
                        alt={card.name}
                        className="card-img"
                      />
                    )}
                    <h3>{(card.name || "").toUpperCase()}</h3>
                  </div>
                ))}
                {unifiedCardsFiltered.length === 0 && (
                  <div style={{ marginTop: 50 }}>
                    <h3>Loading...</h3>
                  </div>
                )}
              </div>
              <div
                className="total-cards"
                style={{
                  position: "absolute",
                  bottom: "10px",
                  left: "10px",
                  backgroundColor: "rgba(255,255,255,0.7)",
                  padding: "8px",
                  borderRadius: "8px",
                  border: "3px solid #262626",
                  fontSize: "14px",
                }}
              >
                Total Cards Found: {unifiedCardsFiltered.length}
              </div>
              <div className="arrow-buttons-vertical">
                <button className="start-btn" onClick={() => setSelectedIndex(0)} disabled={selectedIndex === 0}>
                  Start
                </button>
                <button className="arrow-btn-vertical"
                  onClick={() => setSelectedIndex((prev) => prev - 1)}
                  disabled={selectedIndex === 0}
                >
                  ▲
                </button>
                <button className="arrow-btn-vertical"
                  onClick={() => setSelectedIndex((prev) => prev + 1)}
                  disabled={selectedIndex === unifiedCardsFiltered.length - 1}
                >
                  ▼
                </button>
                <button className="go-end-btn"
                  onClick={() => setSelectedIndex(unifiedCardsFiltered.length - 1)}
                  disabled={unifiedCardsFiltered.length < 2}
                >
                  End
                </button>
              </div>
            </div>
          </div>
          <div className="right-col">
            {selectedCardDetail ? (
              <div className="detail-card">
                <h2 className="detail-name">
                  {(selectedCardDetail.name || "").toUpperCase()}
                </h2>
                <div style={{ position: "relative" }}>
                  {selectedCardDetail.type === "pokemon" ? (
                    <img
                      src={`https://img.pokemondb.net/artwork/large/${selectedCardDetail.name}.jpg`}
                      alt={selectedCardDetail.name}
                      className="detail-img"
                    />
                  ) : (
                    <img
                      src={selectedCardDetail.tcg_image_url}
                      alt={selectedCardDetail.name}
                      className="detail-img tcg-zoom"
                    />
                  )}
                  <button
                    onClick={() => addCardToDeck(selectedCardDetail)}
                    className={`catch-btn ${isCatching ? "catching" : ""}`}
                    style={{ position: "absolute", bottom: "0", right: "0" }}
                  ></button>
                  <div className="catch-btn-text"
                    style={{
                      position: "absolute",
                      bottom: "-30px",
                      right: "0",
                      fontSize: "16px",
                    }}
                  >
                    Catch it!
                  </div>
                </div>
                {selectedCardDetail.type === "pokemon" && selectedCardDetail.stats ? (
                  <div className="detail-info">
                    <div className="detail-section">
                      <h4>Types</h4>
                      <div className="type-badges">
                        {selectedCardDetail.types.map((t) => (
                          <span key={t.type.name} className="type-badge">
                            {t.type.name.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="detail-section">
                      <h4>Stats</h4>
                      <div className="stats-grid">
                        {selectedCardDetail.stats.map((st) => (
                          <div key={st.stat.name} className="stat-item">
                            <span className="stat-name">{st.stat.name.toUpperCase()}</span>: {st.base_stat}
                          </div>
                        ))}
                      </div>
                    </div>
                     <div className="detail-section">
                       <h4>Weaknesses</h4>
                       {selectedCardDetail.weaknesses && selectedCardDetail.weaknesses.length > 0 ? (
                        <p>{selectedCardDetail.weaknesses.join(", ")}</p>
                       ) : (
                         <p>No weaknesses found</p>
                       )}
                     </div>
                     <div className="detail-section">
                       <h4>Strengths</h4>
                       {selectedCardDetail.strengths && selectedCardDetail.strengths.length > 0 ? (
                         <p>{selectedCardDetail.strengths.join(", ")}</p>
                       ) : (
                         <p>No strengths found</p>
                       )}
                     </div>
                        <div className="detail-section">
                          <h4>Moves</h4>
                          <div className="moves-list">
                            {selectedCardDetail.moves.slice(0, 10).map((m) => (
                              <span key={m.move.name} className="move-badge">
                                {m.move.name.toUpperCase()}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                  <div className="detail-info">
                    {selectedCardDetail.type === "trainer" && (
                      <div>
                            {selectedCardDetail.tcg_set && (
                              <p><strong>Set:</strong> {selectedCardDetail.tcg_set}</p>
                            )}
                            {selectedCardDetail.tcg_rarity && (
                              <p><strong>Rarity:</strong> {selectedCardDetail.tcg_rarity}</p>
                            )}
                          </div>
                        )}
                    {selectedCardDetail.type === "energy" && (
                      <div>
                        {selectedCardDetail.tcg_set && (
                          <p><strong>Set:</strong> {selectedCardDetail.tcg_set}</p>
                        )}
                        {selectedCardDetail.tcg_rarity && (
                          <p><strong>Rarity:</strong> {selectedCardDetail.tcg_rarity}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
          </div>
            ) : (
              <div className="no-detail">
                <h3>Select a Pokémon, Trainer, or Energy</h3>
              </div>
            )}
          </div>
        </div>
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <button onClick={updateDeck} className="deck-update-button">
            Update My Deck
          </button>
        </div>
        <div className="deck-summary-section" style={{ display: "flex", gap: "30px", marginBottom: "30px" }}>
          <div className="deck-summary" style={{ flex: 1 }}>
            <h3>Your Deck Summary</h3>
            <p>Pokémon: {deckSummary.pokemon} / {MAX_POKEMON}</p>
            <p>Trainers: {deckSummary.trainer} / {MAX_TRAINER}</p>
            <p>Energy: {deckSummary.energy} / {MAX_ENERGY}</p>
            <p>Total: {deckSummary.total} / {MAX_DECK_SIZE}</p>
          </div>
          <div className="deck-recommendations" style={{ flex: 1 }}>
            <h3>Deck Score & Recommendations</h3>
            <p>Deck Score: {deckScore}</p>
            <ul>
              {recommendations.map((rec, idx) => (
                <li key={idx}>{rec.message || rec}</li>
              ))}
            </ul>
            <button className="deck-button" onClick={() => navigate("/deck")}>View My Deck</button>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}

export default HomePage;
