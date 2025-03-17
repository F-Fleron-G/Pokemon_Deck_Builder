import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import axios from "axios";
import "./DeckPage.css";
import trainerImage from "../assets/trainer_bottom.png";
import energyImage from "../assets/energy_bottom.png";
import updateImage from "../assets/update_button_image.png";
import deckSummaryImage from '../assets/deck_summary_img.png';
import deckStrengthImage from '../assets/deck_strength_img.png';
import updateInstructionsImage from '../assets/update_instructions_image.png';
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";

const MAX_DECK_SIZE = 60;
const MAX_POKEMON = 20;
const MAX_TRAINER = 20;
const MAX_ENERGY = 20;

const typeColors = {
  normal: "#A8A77A",
  fire: "#EE8130",
  water: "#6390F0",
  electric: "#F7D02C",
  grass: "#7AC74C",
  ice: "#96D9D6",
  fighting: "#C22E28",
  poison: "#A33EA1",
  ground: "#E2BF65",
  flying: "#A98FF3",
  psychic: "#F95587",
  bug: "#A6B91A",
  rock: "#B6A136",
  ghost: "#735797",
  dragon: "#6F35FC",
  dark: "#705746",
  steel: "#B7B7CE",
  fairy: "#D685AD"
};

function DeckPage() {
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
  // eslint-disable-next-line no-unused-vars
  const [deckScore, setDeckScore] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [recommendations, setRecommendations] = useState([]);

  const [hoveredFilter, setHoveredFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [typesList, setTypesList] = useState("");

  const [trainerFilter, setTrainerFilter] = useState("");
  const [energyFilter, setEnergyFilter] = useState("");

  const [caughtCardIndex, setCaughtCardIndex] = useState(null);
  const [isCatching, setIsCatching] = useState(false);

  const fetchAllData = useCallback(async () => {
  const token = localStorage.getItem("token");
  try {
    const [
      typesRes,
      pokemonRes,
      trainersRes,
      deckRes
    ] = await Promise.all([
      axios.get("https://pokeapi.co/api/v2/type"),
      selectedType
        ? axios.get(`https://pokeapi.co/api/v2/type/${selectedType}`)
        : axios.get("https://pokeapi.co/api/v2/pokemon?limit=1000"),
      axios.get("http://localhost:8000/tcg/external/trainers"),
      token
        ? axios.get("http://localhost:8000/deck", { headers: { Authorization: `Bearer ${token}` } })
        : Promise.resolve({ data: { deck: { pokemon: [], trainers: [], energy: [] } } })
    ]);

    setTypesList(typesRes.data.results);

    if (selectedType) {
      const pokemonOfType = pokemonRes.data.pokemon.map((p) => p.pokemon);
      setPokemonList(pokemonOfType);
    } else {
      setPokemonList(pokemonRes.data.results);
    }

    setTrainersList(trainersRes.data);

    const serverDeck = [];
    deckRes.data.deck.pokemon.forEach((p) => {
      serverDeck.push({ id: p.id, name: p.name, type: "pokemon" });
    });
    deckRes.data.deck.trainers.forEach((t) => {
      serverDeck.push({ id: t.id, name: t.name, type: "trainer" });
    });
    deckRes.data.deck.energy.forEach((e) => {
      serverDeck.push({ id: e.id, name: e.name, type: "energy" });
    });
    setDeck(serverDeck);
    } catch (error) {
    console.error("Error fetching data:", error);
    }
    }, [selectedType]);

  useEffect(() => {
  const fetchEnergyData = async () => {
    try {
      const response = await axios.get("http://localhost:8000/tcg/cached/energy");
      setEnergyList(response.data);
    } catch (error) {
      console.error("Error fetching energy data:", error);
    }
  };

  fetchEnergyData();
  }, []);

  useEffect(() => {
  fetchAllData();
  }, [fetchAllData]);

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
          const pokemonData = res.data;

          const speciesRes = await axios.get(pokemonData.species.url);
          const description = speciesRes.data.flavor_text_entries.find(
            entry => entry.language.name === "en"
          )?.flavor_text || "No description available.";

          setSelectedCardDetail((prevDetail) => {
            if (prevDetail && prevDetail.name === pokemonData.name) {
              return prevDetail;
            }
            return {
              ...pokemonData,
              type: "pokemon",
              description,
            };
          });
        } catch (error) {
          console.error("Error fetching Pokémon details:", error);
        }
      } else {
        setSelectedCardDetail((prevDetail) => {
          if (prevDetail && prevDetail.name === card.name) {
            return prevDetail;
          }
          return {
            ...card,
            description: null,
          };
        });
      }
    }
  };

  if (selectedIndex >= 0 && selectedIndex < unifiedCardsFiltered.length) {
    updateDetail();
  }
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
      energy_types: deck.filter((c) => c.type === "energy").map((c) => c.energy_type || c.name),
    };

    const response = await axios.post("http://localhost:8000/deck", payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    setDeckScore(response.data.deck_score);
    setRecommendations(response.data.recommendations);

    await fetchDeck();

    alert("Deck updated successfully!");

    setDeck([]);
   } catch (error) {
    console.error("Error updating deck:", error);
    alert("Failed to update your deck. Please log in first.");
   }
  };

  const addCardToDeck = (card, source = "caught") => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in first!");
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

    if (card.type === "energy" && !card.energy_type) {
    card.energy_type = card.name.replace(" Energy", "").trim();
    }

    setDeck((prevDeck) => [...prevDeck, card]);

    if (source === "caught") {
    setIsCatching(true);
    setTimeout(() => setIsCatching(false), 1000);

    setCaughtCardIndex(selectedIndex);
    setTimeout(() => setCaughtCardIndex(null), 1000);
  }
  };

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

  const fetchDeck = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
       if (window.location.pathname !== "/login") {
      alert("Please log in to view your deck.");
      navigate("/login");
    }
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


const handleAddPokemon = (rec) => {
  if (!rec || !rec.name) {
    alert("No valid Pokémon found!");
    return;
  }

  const pokemonId = rec.id || rec.pokemon_id;
  if (!pokemonId) {
    alert("No valid Pokémon ID found in recommendation.");
    return;
  }

  const newCard = {
    id: pokemonId,
    name: rec.name.trim(),
    type: "pokemon",
  };

  addCardToDeck(newCard, "recommendation");
};

const handleAddTrainer = (rec) => {
  if (!rec || !rec.name) {
    alert("No valid trainer found.");
    return;
  }

  const newCard = {
    name: rec.name.trim(),
    type: "trainer",
  };

  addCardToDeck(newCard, "recommendation");
};

const handleAddEnergy = (rec) => {
  if (!rec || !rec.name) {
    alert("No valid energy found!");
    return;
  }

  let eType = rec.energy_type;
  if (!eType) {
    eType = rec.name.replace(/Energy$/i, "").trim();
  }

  const newCard = {
    name: rec.name.trim(),
    type: "energy",
    energy_type: eType,
  };

  addCardToDeck(newCard, "recommendation");
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

    setDeckData((prev) => ({
      ...prev,
      deck: {
        ...prev.deck,
        pokemon: prev.deck.pokemon.filter((card) => card.id !== pokemonId),
      },
    }));
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

    setDeckData((prev) => ({
      ...prev,
      deck: {
        ...prev.deck,
        trainers: prev.deck.trainers.filter((card) => card.id !== trainerId),
      },
    }));
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

    setDeckData((prev) => ({
      ...prev,
      deck: {
        ...prev.deck,
        energy: prev.deck.energy.filter((card) => card.id !== energyId),
      },
    }));
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

  // eslint-disable-next-line no-unused-vars
  const topTrainerEnergyRecommendations = [...trainerRecommendations, ...energyRecommendations];

  const [showInstructions, setShowInstructions] = useState(false);

  let meterColor = "#5cb85c";
  if (deckData.deck_score < 34) {
    meterColor = "#d9534f"; // red
  } else if (deckData.deck_score < 67) {
    meterColor = "#f0ad4e";
  }

  const clockDegree = (deckData.deck_score / 100) * 360;

  return (
    <>
      <Header />
      <div className="app-container">
        <div style={{ display: "none", textAlign: "center", marginTop: "10px" }}>
          <h1 style={{ fontSize: "2rem", margin: "0", color: "#262626" }}>
            Pokémon Deck Builder
          </h1>
        </div>

      <div className="deck-top-section">
        <div className="deck-page-three-cols">
        <div className="left-slider-col" style={{ flex: "1" }}>
         <div className="left-col-header">
      <div className="search-filter-top">
        <input
          type="text"
          className="search-input"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      </div>
      <div className="left-col-body">
        <div
          className="slider-container"
          ref={sliderContainerRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >

        <div
        className="filter-group"
        style={{ display: "inline-block", position: "relative", marginRight: "10px"}}
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
              <option value="">Filter</option>
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
              <option value="">Filter</option>
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
              <option value="">Filter</option>
              {uniqueEnergyTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
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
          <div style={{ marginTop: 50, textAlign: 'center', }}>
            <h3>Loading...</h3>
            <h3>Scroll through Pokémon, Trainer or Energy.</h3>
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
                  border: "2px solid #262626",
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
         </div>

         <div className="card-detail-col">
          <div className="middle-col-header">
            <h4 style={{ margin: 0 }}>What You Need To Know</h4>
          </div>
          <div className="middle-col-body">
            {selectedCardDetail ? (
            <div
             className="detail-card"
             style={{
             backgroundColor:
                selectedCardDetail?.types && selectedCardDetail.type === "pokemon"
                ? typeColors[selectedCardDetail.types[0].type.name.toLowerCase()]
                : "#fff",
             }}
          >
      {selectedCardDetail.type === "pokemon" ? (
        <>
         <div className="card-header">
            <h2 className="detail-name">
              {selectedCardDetail.name.charAt(0).toUpperCase() +
                selectedCardDetail.name.slice(1)}
            </h2>
            {selectedCardDetail.stats && (
              <div className="hp-container">
                <span className="hp-text">HP</span>
                <span className="hp-value">
                  {selectedCardDetail.stats.find(
                    (stat) => stat.stat.name === "hp"
                  )?.base_stat || "???"}
                </span>
                <img
                  src={require(`../assets/types/${selectedCardDetail.types[0].type.name.toLowerCase()}.png`)}
                  alt={`${selectedCardDetail.types[0].type.name} type`}
                  className="type-symbol"
                />
              </div>
            )}
          </div>

          <div
            className="pokemon-detail-image-container"
            style={{ position: "relative", textAlign: "center" }}
          >
            <img
              src={`https://img.pokemondb.net/artwork/large/${selectedCardDetail.name}.jpg`}
              alt={selectedCardDetail.name}
              className="detail-img"
            />
            <button
              onClick={() => addCardToDeck(selectedCardDetail)}
              className={`catch-btn ${isCatching ? "catching" : ""}`}
              style={{ position: "absolute", bottom: "0", right: "0" }}
            />
            <div
              className="catch-btn-text"
              style={{ position: "absolute", bottom: "-30px", right: "0", fontSize: "16px" }}
            >
              Catch it!
            </div>
          </div>

         {selectedCardDetail.height && selectedCardDetail.weight && (
            <div className="pokemon-size-info">
              <p>
                Height: {selectedCardDetail.height / 10} m | Weight: {selectedCardDetail.weight / 10} kg
              </p>
            </div>
          )}
          {selectedCardDetail.stats && (
            <div className="detail-info">
              <div className="detail-section type-section">
                <h4>Type</h4>
                <div className="type-badges">
                  {selectedCardDetail.types.map((t) => (
                    <span key={t.type.name} className="type-badge">
                      {t.type.name.charAt(0).toUpperCase() + t.type.name.slice(1)}
                    </span>
                  ))}
                </div>
              </div>
              <div className="detail-section">
                <h4>Stats</h4>
                <div className="stats-grid">
                  {selectedCardDetail.stats
                    .filter((st) => st.stat.name !== "hp")
                    .map((st) => (
                      <div key={st.stat.name} className="stat-item">
                        <span className="stat-name">
                          {st.stat.name
                            .split("-")
                            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(" ")}
                        </span>
                        : {st.base_stat}
                      </div>
                    ))}
                </div>
              </div>
           <div className="detail-section">
            <h4>Moves</h4>
            <p className="moves-text">
              {selectedCardDetail.moves
                .slice(0, 4)
                .map((m) =>
                  m.move.name
                    .split("-")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")
                )
                .join(" - ")}
                </p>
              </div>
            </div>
          )}
          {selectedCardDetail.description && (
            <div className="detail-section">
              <h4>Description</h4>
              <div className="pokemon-description-container">
                <p className="pokemon-description">
                  {selectedCardDetail.description}
                </p>
              </div>
            </div>
          )}
        </>

      ) : selectedCardDetail.type === "trainer" ? (
        <div className="trainer-detail-container">
          <div className="trainer-detail-image-container">
      <img
        src={selectedCardDetail.tcg_image_url}
        alt={selectedCardDetail.name}
        className="tcg-zoom"
      />
      <button
        onClick={() => addCardToDeck(selectedCardDetail)}
        className={`catch-btn ${isCatching ? "catching" : ""}`}
        style={{ position: "absolute", bottom: "330px", right: "5px" }}
      />
      <div
        className="catch-btn-text"
        style={{ position: "absolute", bottom: "305px", right: "5px", fontSize: "16px" }}
      >
       Catch it!
     </div>
    </div>
    <div className="trainer-info">
      {selectedCardDetail.tcg_set && (
        <div className="trainer-set">
          <p><strong>Set:</strong> {selectedCardDetail.tcg_set}</p>
        </div>
      )}
      <div className={`trainer-rarity ${selectedCardDetail.tcg_rarity ? '' : 'empty'}`}>
    <p><strong>Rarity:</strong> {selectedCardDetail.tcg_rarity || ' '}</p>
  </div>

    <div className="trainer-bottom-container">
      <div className="trainer-bottom-image">
        <img src={trainerImage} alt="Pokémon Trainer illustration" />
      </div>
    <div className="trainer-comment-block">
      <p>Trainers are super helpful! They give your Pokémon extra power, heal them,
       and help you win battles faster!</p>
    </div>
   </div>
  </div>
 </div>


) : selectedCardDetail.type === "energy" ? (
  <div className="energy-detail-container">
    <div className="energy-detail-image-container">
      <img
        src={selectedCardDetail.tcg_image_url}
        alt={selectedCardDetail.name}
        className="tcg-zoom"
      />
      <button
        onClick={() => addCardToDeck(selectedCardDetail)}
        className={`catch-btn ${isCatching ? "catching" : ""}`}
        style={{ position: "absolute", bottom: "330px", right: "5px" }}
      />
      <div
        className="catch-btn-text"
        style={{ position: "absolute", bottom: "305px", right: "5px", fontSize: "16px" }}
      >
       Catch it!
     </div>
    </div>
    <div className="energy-info">
      {selectedCardDetail.energy_type && (
      <div className="energy-type">
      <p><strong>Type:</strong> {selectedCardDetail.energy_type}</p>
    </div>
    )}
  <div className="energy-bottom-container">
    <div className="energy-comment-block">
      <p>Pokémon need Energy to power up their awesome moves and be ready for battle!</p>
    </div>
    <div className="energy-bottom-image">
      <img src={energyImage} alt="Energy illustration" />
    </div>

  </div>
  </div>
 </div>
  ) : null}
    </div>
  ) : (
    <div className="no-detail" style={{ textAlign: 'center' }}>
      <h3>Loading...</h3>
      <h3>Pick your cards and click 'Catch it!'</h3>
    </div>
  )}
</div>
</div>


          <div className="right-slider-col" style={{ flex: "1" }}>
            <div className="right-col-header">
              <h4 style={{ margin: 0 }}>Recommendations</h4>
            </div>
            <div className="right-col-body">
            <div className="recommendations-slider-container">
              <div
              className="recommendations-slider"
              style={{
            transform: `translateY(${- (cardCategory === "pokemon" ? recIndexPokemon : recIndexTrainerEnergy) * 450}px)`,
          }}
        >
          {deckData.recommendations
            .filter((rec) => rec.type === cardCategory)
            .map((rec, index) => (
              <div key={index} className="recommendation-card">
                {rec.tcg_image_url && (
                  <img
                    src={rec.tcg_image_url}
                    alt={rec.name}
                    style={{
                      width: "200px",
                      height: "200px",
                      objectFit: "contain",
                    }}
                  />
                )}
                <p style={{ color: "#262626", fontWeight: "bold", fontSize: "20px" }}>
                  {rec.name}
                </p>
                {rec.message && (
                  <p style={{ fontStyle: "italic" }}>{rec.message}</p>
                )}
                <button
                  onClick={() => {
                    if (cardCategory === "pokemon") {
                      handleAddPokemon(rec);
                    } else if (cardCategory === "trainer") {
                      handleAddTrainer(rec);
                    } else if (cardCategory === "energy") {
                      handleAddEnergy(rec);
                    }
                  }}
                >
                  Add
                </button>
              </div>
            ))}
        </div>
        <div className="vertical-slider-controls">
          <button disabled={cardCategory === "pokemon"? recIndexPokemon === 0
                : recIndexTrainerEnergy === 0}
            onClick={() => {
              if (cardCategory === "pokemon") {
                setRecIndexPokemon((prev) => prev - 1);
              } else {
                setRecIndexTrainerEnergy((prev) => prev - 1);
              }
            }}
          >
            ▲
          </button>
          <button
            disabled={
              deckData.recommendations.filter(
                (r) => r.type === cardCategory
              ).length === 0 ||
              ((cardCategory === "pokemon"
                ? (recIndexPokemon + 2) * 200
                : (recIndexTrainerEnergy + 2) * 200) >=
                deckData.recommendations.filter(
                  (r) => r.type === cardCategory
                ).length * 200)
            }
            onClick={() => {
              if (cardCategory === "pokemon") {
                setRecIndexPokemon((prev) => prev + 1);
              } else {
                setRecIndexTrainerEnergy((prev) => prev + 1);
              }
            }}
          >
            ▼
          </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

      <div className="deck-extra-row">
        <div className="deck-extra-col-l">
          <h3>Cards To Be Added</h3>
          <p>
            Pokémon: {deck.filter((c) => c.type === "pokemon").length} &nbsp;|&nbsp;
            Trainers: {deck.filter((c) => c.type === "trainer").length} &nbsp;|&nbsp;
            Energy: {deck.filter((c) => c.type === "energy").length}
          </p>

          <div className="update-deck-container">
          <button onClick={updateDeck} className="deck-update-button">
            UPDATE NOW!
          </button>
          <div className="deck-update-image">
          <img src={updateImage} alt="Tyrogue Pokémon Illustration" />
          </div>
          </div>
          <div className="instructions-trigger">
          <p
            onClick={() => setShowInstructions(true)}
          >
            Stuck? Click <u>here</u>!
          </p>
          </div>
        </div>

        <div className="deck-extra-col-m" style={{
        backgroundImage: `url(${deckSummaryImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        paddingBottom: '105px',
        }}>
          <h3>Your Deck Summary</h3>
          <p>Pokémon: {deckData.deck.pokemon.length} / 20</p>
          <p>Trainers: {deckData.deck.trainers.length} / 20</p>
          <p>Energy: {deckData.deck.energy.length} / 20</p>
          <p>Total: {totalDeckCount} / 60</p>
        </div>

        <div className="deck-extra-col-r deck-strength-container" style={{
        backgroundImage: `url(${deckStrengthImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        }}>
          <h3>Deck Strength</h3>
          <div className="deck-strength-meter">
            <div
              className="meter-bar"
              style={{ width: deckData.deck_score + "%", backgroundColor: meterColor }}
            />
            <p className="meter-label">{deckData.deck_score}%</p>
          </div>

          <h3>Deck Score: {Math.round((deckData.deck_score / 100) * 360)} / 360</h3>
          <div className="deck-score-clock">

            <div
              className="clock-pointer"
              style={{ transform: `rotate(${clockDegree}deg)` }}
            />
          </div>
        </div>
      </div>

      {showInstructions && (
        <div className="instructions-modal">
          <div className="instructions-content">
            <button
              className="modal-close-btn"
              onClick={() => setShowInstructions(false)}
            >
              X
            </button>
            <h2 style={{ textAlign: 'center'}} >Follow These Instructions!</h2>
            <ol>
            <li>Click on <b>'Catch it'</b> button to add the cards to your deck.</li>
            <li>Click on <b>'Add'</b> button to add recommendations to your deck.</li>
            <li>Click on <b>'Update Now!'</b> to see the changes in your deck.</li>
            <li>You have to <b>'Update Now!'</b> after deleting your cards too.</li>
            </ol>
            <h3 style={{ textAlign: 'center'}} ><i>
              Have fun building your deck!</i>
            </h3>
              <img
                src={updateInstructionsImage}
                alt="Pokemon Klang"
                className="update-instructions-image"
              />
          </div>
        </div>
      )}

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
                  <button onClick={() => handleDeletePokemon(card.id)}>X</button>
                </div>
              ))}
            </div>
            {deckData.deck.pokemon.length > 5 && (
              <button className="see-more-btn" onClick={() => setShowMorePokemon(prev => !prev)}>
             {showMorePokemon ? "See Less" : "See More"}
              </button>
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
                   <button onClick={() => handleDeleteTrainer(card.id)}>X</button>
                </div>
              ))}
            </div>
            {deckData.deck.trainers.length > 5 && (
              <button className="see-more-btn" onClick={() => setShowMoreTrainers(prev => !prev)}>
             {showMoreTrainers ? "See Less" : "See More"}
              </button>
            )}
          </div>
          <div className="deck-cards-group">
            <h4>Energy</h4>
            <div className="deck-cards-grid">
              {(showMoreEnergy? deckData.deck.energy: deckData.deck.energy.slice(0, 5)).map((card, idx) => (
                <div key={`energy-${idx}`} className="deck-card">
                  <img
                    src={card.tcg_image_url}
                    alt={card.name}
                    style={{ width: "150px", height: "150px", objectFit: "contain" }}
                  />
                  <p>{card.name}</p>
                  <button onClick={() => handleDeleteEnergy(card.id)}>X</button>
                </div>
              ))}
          </div>
            {deckData.deck.energy.length > 5 && (
            <button className="see-more-btn" onClick={() => setShowMoreEnergy(prev => !prev)}>
             {showMoreEnergy ? "See Less" : "See More"}
            </button>
           )}
          </div>
        </div>
      </div>
      </div>
      <Footer />
    </>
  );
}

export default DeckPage;
