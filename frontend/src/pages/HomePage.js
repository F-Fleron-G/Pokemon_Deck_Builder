import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./HomePage.css";
import Header from "../components/Header";
import Footer from "../components/Footer";

const MAX_DECK_SIZE = 60;

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

  const [isCatching,setIsCatching] = useState(false);

  const getUnifiedCards = useCallback(() => {
    if (cardCategory === "all") {
      return [
        ...pokemonList.map((p) => ({ ...p, type: "pokemon" })),
        ...trainersList.map((t) => ({ ...t, type: "trainer" })),
        ...energyList.map((e) => ({ ...e, type: "energy" })),
      ];
    } else if (cardCategory === "pokemon") {
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
    if (cardCategory === "all" || cardCategory === "trainer") {
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
    if (cardCategory === "all" || cardCategory === "energy") {
      fetchEnergies();
    }
  }, [cardCategory]);

  useEffect(() => {
     const fetchUserDeck = async () => {
     const token = localStorage.getItem("token");
     if (!token) return;
     try {
     const response = await axios.get("http://localhost:8000/user/deck", {
      headers: { Authorization: `Bearer ${token}` },
    });

    setDeck(Array.isArray(response.data.deck) ? response.data.deck : []);
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
        if (card) {
          if (card.type === "pokemon") {
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
      }
    };
    updateDetail();
  }, [selectedIndex, unifiedCardsFiltered]);

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

  const handleCardClick = (card, index) => {
    setSelectedIndex(index);
    if (card.type === "pokemon") {
      axios
        .get(card.url)
        .then((res) => setSelectedCardDetail({ ...res.data, type: "pokemon" }))
        .catch((error) =>
          console.error("Error fetching Pokémon details:", error)
        );
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
        alert("Hey, you forgot to log in first!");
        return;
      }

    const payload = {
      pokemon_ids: (Array.isArray(deck) ? deck : []).filter((c) => c.type === "pokemon").map((c) => c.id),
      trainer_names: (Array.isArray(deck) ? deck : []).filter((c) => c.type === "trainer").map((c) => c.name),
      energy_types: (Array.isArray(deck) ? deck : []).filter((c) => c.type === "energy").map((c) => c.name),
    };

      const response = await axios.post(
        "http://localhost:8000/user/deck",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setDeckScore(response.data.deck_score);
      setRecommendations(response.data.recommendations);
    } catch (error) {
      console.error("Error updating deck:", error);
      alert("Oops! Something went wrong while updating your deck.");
    }
  };

  const addCardToDeck = async (card) => {
    if (deck.length >= MAX_DECK_SIZE) {
      alert("Your deck is full! (Max: 60 cards total)");
      return;
    }
    const countByType = deck.reduce((acc, cur) => {
      acc[cur.type] = (acc[cur.type] || 0) + 1;
      return acc;
    }, {});
    if (card.type === "pokemon" && (countByType.pokemon || 0) >= 20) {
      alert("Maximum of 20 Pokémon cards allowed!");
      return;
    }
    if (card.type === "trainer" && (countByType.trainer || 0) >= 20) {
      alert("Maximum of 20 Trainer cards allowed!");
      return;
    }
    if (card.type === "energy" && (countByType.energy || 0) >= 20) {
      alert("Maximum of 20 Energy cards allowed!");
      return;
    }
    setDeck((prevDeck) => [...prevDeck, card]);
    setIsCatching(true);
    setTimeout(() => setIsCatching(false), 1000);

    setCaughtCardIndex(selectedIndex);
    setTimeout(() => setCaughtCardIndex(null), 1000);
    if (card.type === "pokemon") {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("Hey, you forgot to login first!");
          return;
        }
        const pokemonIds = deck
          .filter((c) => c.type === "pokemon")
          .map((c) => c.id)
          .concat(card.id);
        await axios.post(
          "http://localhost:8000/user/deck",
          { pokemon_ids: pokemonIds },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (error) {
        console.error("Error saving deck:", error);
        alert("Oops..you need to be logged in!");
      }
    }
  };

    const deckSummary = {
  pokemon: (Array.isArray(deck) ? deck : []).filter((c) => c.type === "pokemon").length,
  trainer: (Array.isArray(deck) ? deck : []).filter((c) => c.type === "trainer").length,
  energy: (Array.isArray(deck) ? deck : []).filter((c) => c.type === "energy").length,
  total: Array.isArray(deck) ? deck.length : 0,
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
        <div className="filter-buttons-section" style={{ marginBottom: "10px" }}>

      {/* Pokémon Filter Group */}
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

      {/* Trainers Filter Group */}
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

  {/* Energy Filter Group */}
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
</div>

        {/* Deck Builder Area */}
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
                {unifiedCardsFiltered.map((card, index) => (
                  <div
                    key={`${card.name || card.tcg_id}-${index}`}
                    className={`card-item ${index === selectedIndex ? "active" : "inactive"}
                    ${index === caughtCardIndex ? "caught" : ""}`}
                    style={{
                      transform: index === selectedIndex ? "scale(1.3)" : "scale(1)",
                      opacity: index === selectedIndex ? 1 : 0.4,
                      transition: "transform 0.3s, opacity 0.3s",
                    }}
                    onClick={() => handleCardClick(card, index)}
                  >
                    {card.type === "pokemon" ? (
                      <img
                        src={`https://img.pokemondb.net/artwork/large/${card.name}.jpg`}
                        alt={card.name}
                        className="card-img"
                      />
                    ) : (
                      <>
                        <img
                          src={card.tcg_image_url}
                          alt={card.name}
                          className="card-img"
                        />
                        <p style={{ fontSize: "10px", color: "#262626" }}>
                          {card.type === "trainer"
                            ? card.effect || (card.tcg_set ? `Set: ${card.tcg_set}` : "")
                            : card.type === "energy"
                            ? `Type: ${card.energy_type}`
                            : ""}
                        </p>
                      </>
                    )}
                    <h3>{card.name.toUpperCase()}</h3>
                  </div>
                ))}
                {unifiedCardsFiltered.length === 0 && (
                  <div style={{ marginTop: 50, color: "#262626" }}>
                    <h3>Hang on, I am getting the cards!</h3>
                  </div>
                )}
              </div>
              {/* Total Cards Overlay */}
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
              {/* Arrow Buttons */}
              <div className="arrow-buttons-vertical">
                <button
                  className="start-btn"
                  onClick={() => setSelectedIndex(0)}
                  disabled={selectedIndex === 0}
                >
                  Start
                </button>
                <button
                  className="arrow-btn-vertical"
                  onClick={() => setSelectedIndex((prev) => prev - 1)}
                  disabled={selectedIndex === 0}
                >
                  ▲
                </button>
                <button
                  className="arrow-btn-vertical"
                  onClick={() => setSelectedIndex((prev) => prev + 1)}
                  disabled={
                    unifiedCardsFiltered.length === 0 ||
                    selectedIndex === unifiedCardsFiltered.length - 1
                  }
                >
                  ▼
                </button>
                <button
                  className="go-end-btn"
                  onClick={() =>
                    setSelectedIndex(unifiedCardsFiltered.length - 1)
                  }
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
                <h2 className="detail-name">{selectedCardDetail.name.toUpperCase()}</h2>
               <div className="detail-image-section" style={{ position: "relative", textAlign: "center" }}>
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
                    className="detail-img"
                  />
                )}
                <button
                    onClick={() => addCardToDeck(selectedCardDetail)}
                    className={`catch-btn ${isCatching ? "catching" : ""}`}
                    style={{ position: "absolute", bottom: "0", right: "0" }}
                  ></button>
                  <div className="catch-btn-text"
                  style={{ position: "absolute", bottom: "-30px", right: "0", fontSize: "16px" }}
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
                    <p><strong>{selectedCardDetail.name.toUpperCase()}</strong></p>
                    {selectedCardDetail.type === "trainer" && (
                      <p>
                        {selectedCardDetail.effect
                          ? selectedCardDetail.effect
                          : selectedCardDetail.tcg_set
                            ? `Set: ${selectedCardDetail.tcg_set}`
                            : ""}
                      </p>
                    )}
                    {selectedCardDetail.type === "energy" && (
                      <p>{selectedCardDetail.energy_type ? `Energy Type: ${selectedCardDetail.energy_type}` : ""}</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="no-detail">
                <h3>Select Pókemon, Trainers or Energy to view details</h3>
              </div>
            )}
          </div>
        </div>
        {/* Deck Update Section */}
        <div className="deck-update-section" style={{ textAlign: "center", marginBottom: "20px" }}>
          <button onClick={updateDeck} className="deck-update-button">
            Update My Deck
          </button>
        </div>
        {/* Deck Summary Section with Score & Recommendations */}
        <div className="deck-summary-section" style={{ display: "flex", gap: "30px", marginBottom: "30px" }}>
          <div className="deck-summary" style={{ flex: 1 }}>
            <h3>Your Deck Summary</h3>
            <p>Pokémon: {deckSummary.pokemon}</p>
            <p>Trainer Cards: {deckSummary.trainer}</p>
            <p>Energy Cards: {deckSummary.energy}</p>
            <p>Total Cards: {deckSummary.total} / {MAX_DECK_SIZE}</p>
          </div>
          <div className="deck-recommendations" style={{ flex: 1 }}>
            <h3>Deck Score & Recommendations</h3>
            <p>Deck Score: {deckScore}</p>
            <ul>
              {recommendations.map((rec, idx) => (
               <li key={idx}>{rec}</li>
              ))}
            </ul>
            <button className="deck-button" onClick={() => navigate("/deck")}>
              View My Deck
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default HomePage;
