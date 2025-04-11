import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo
} from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import "./DeckPage.css";
import deleteIcon from "../assets/delete_btn.png";
import trainerImage from "../assets/trainer_bottom.png";
import energyImage from "../assets/energy_bottom.png";
import updateImage from "../assets/update_button_image.png";
import deckSummaryImage from "../assets/deck_summary_img.png";
import deckStrengthImage from "../assets/deck_strength_img.png";
import updateInstructionsImage from "../assets/update_instructions_image.png";

import deleteGarbodorImage from "../assets/delete_garbodor.png";

import cartoonStrengthEye from "../assets/cartoon_strength_eye.png";
import cartoonWeaknessEye from "../assets/cartoon_weakness_eye.png";
import gengarSpinner from "../assets/pokemon-gengar.gif";
import Header from "../components/Header";
import Footer from "../components/Footer";

import ExpandableCardWrapper from "../components/ExpandableCardWrapper";
import { getCanonicalPokemonName } from "../utils/pokemonNameUtils";

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

const markers = [
  { label: "90", angle: 90 },
  { label: "180", angle: 180 },
  { label: "270", angle: 270 },
  { label: "360/0", angle: 360 }
];

const ClockMarkers = ({ radius = 90, markerSize = 20, margin = 2 }) => {
  const effectiveRadius = radius - markerSize / 2 - margin;
  return (
    <div style={{ position: "relative", width: radius * 2, height: radius * 2 }}>
      {markers.map((marker) => {
        const rad = ((marker.angle - 90) * Math.PI) / 180;
        const x = radius + effectiveRadius * Math.cos(rad) - markerSize / 2;
        const y = radius + effectiveRadius * Math.sin(rad) - markerSize / 2;
        return (
          <div
            key={marker.label}
            style={{
              position: "absolute",
              left: `${x}px`,
              top: `${y}px`,
              width: `${markerSize}px`,
              height: `${markerSize}px`,
              textAlign: "center",
              lineHeight: `${markerSize}px`,
              fontSize: "12px",
              fontFamily: "Comic Sans MS, sans-serif",
              color: "#262626"
            }}
          >
            {marker.label}
          </div>
        );
      })}
    </div>
  );
};

function DeckPage() {
  // ---------- LOCAL STATE + LOCALSTORAGE INTEGRATION -----------
  const [showStrengthInfo, setShowStrengthInfo] = useState(false);


  const [showPokemonTips, setShowPokemonTips] = useState(false);
  const [showTrainerTips, setShowTrainerTips] = useState(false);
  const [showEnergyTips, setShowEnergyTips] = useState(false);

  const [expandedTrainerId, setExpandedTrainerId] = useState(null);
  const [expandedEnergyId, setExpandedEnergyId] = useState(null);

  const [hoveredTrainerId, setHoveredTrainerId] = useState(null);
  const [hoveredEnergyId, setHoveredEnergyId] = useState(null);

  const navigate = useNavigate();
  const [deckData, setDeckData] = useState(() => {
    const saved = localStorage.getItem("deckData");
    if (saved) return JSON.parse(saved);
    return {
      deck: { pokemon: [], trainers: [], energy: [] },
      deck_score: 0,
      recommendations: [],
      suggestionImage: null
    };
  });

  const [pokemonList, setPokemonList] = useState(() => {
    const saved = localStorage.getItem("pokemonList");
    return saved ? JSON.parse(saved) : [];
  });
  const [trainersList, setTrainersList] = useState(() => {
    const saved = localStorage.getItem("trainersList");
    return saved ? JSON.parse(saved) : [];
  });
  const [energyList, setEnergyList] = useState(() => {
    const saved = localStorage.getItem("energyList");
    return saved ? JSON.parse(saved) : [];
  });
  const [typesList, setTypesList] = useState(() => {
    const saved = localStorage.getItem("typesList");
    return saved ? JSON.parse(saved) : [];
  });

  const [shouldFetchFromServer, setShouldFetchFromServer] = useState(() => {
   const savedDeckData = localStorage.getItem("deckData");
   return savedDeckData ? false : true;
  });

  const token = localStorage.getItem("token");

  const [loading, setLoading] = useState(true);

  const wheelTimeoutRef = useRef(null);
  const touchStartYRef = useRef(null);
  const sliderContainerRef = useRef(null);

  const [cardCategory, setCardCategory] = useState(() => {
   const savedCategory = localStorage.getItem("cardCategory");
   return savedCategory || "pokemon";
  });
  const [selectedIndex, setSelectedIndex] = useState(() => {
   const savedIndex = localStorage.getItem("selectedIndex");
   return savedIndex ? Number(savedIndex) : 0;
  });

  useEffect(() => {
  localStorage.setItem("cardCategory", cardCategory);
  }, [cardCategory]);

  useEffect(() => {
  localStorage.setItem("selectedIndex", selectedIndex.toString());
  }, [selectedIndex]);

  const [selectedCardDetail, setSelectedCardDetail] = useState(null);

  const [deck, setDeck] = useState([]);

  const [hoveredFilter, setHoveredFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("");

  const [trainerFilter, setTrainerFilter] = useState("");
  const [energyFilter, setEnergyFilter] = useState("");

  const [caughtCardIndex, setCaughtCardIndex] = useState(null);
  const [isCatching, setIsCatching] = useState(false);

  // --------------------- UNIFIED FETCH ----------------------
  const loadEverything = useCallback(async () => {
    if (!shouldFetchFromServer && token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [
        typesRes,
        pokemonRes,
        trainersRes,
        deckRes,
        energiesRes
      ] = await Promise.all([
        axios.get("https://pokeapi.co/api/v2/type"),
        selectedType
          ? axios.get(`https://pokeapi.co/api/v2/type/${selectedType}`)
          : axios.get("https://pokeapi.co/api/v2/pokemon?limit=1000"),

        axios.get("http://localhost:8000/tcg/external/trainers"),
        token
          ? axios.get("http://localhost:8000/deck", {
              headers: { Authorization: `Bearer ${token}` }
            })
          : Promise.resolve({
              data: { deck: { pokemon: [], trainers: [], energy: [] } }
            }),
        axios.get("http://localhost:8000/tcg/cached/energy")
      ]);

      setTypesList(typesRes.data.results);
      localStorage.setItem("typesList", JSON.stringify(typesRes.data.results));

      if (selectedType) {
        const pOfType = pokemonRes.data.pokemon.map((p) => p.pokemon);
        setPokemonList(pOfType);
        localStorage.setItem("pokemonList", JSON.stringify(pOfType));
      } else {
        setPokemonList(pokemonRes.data.results);
        localStorage.setItem(
          "pokemonList",
          JSON.stringify(pokemonRes.data.results)
        );
      }

      setTrainersList(trainersRes.data);
      localStorage.setItem("trainersList", JSON.stringify(trainersRes.data));

      setEnergyList(energiesRes.data);
      localStorage.setItem("energyList", JSON.stringify(energiesRes.data));

      const serverDeck = deckRes.data.deck || {
        pokemon: [],
        trainers: [],
        energy: []
      };

      const newDeckData = {
        deck: {
          pokemon: serverDeck.pokemon || [],
          trainers: serverDeck.trainers || [],
          energy: serverDeck.energy || []
        },
        deck_score: deckRes.data.deck_score || 0,
        recommendations: deckRes.data.recommendations || [],
        suggestionImage: deckRes.data.suggestionImage || null
      };
      setDeckData(newDeckData);
      localStorage.setItem("deckData", JSON.stringify(newDeckData));

      setShouldFetchFromServer(false);
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedType, token, shouldFetchFromServer]);

  useEffect(() => {
  if (!token) {
    setLoading(false);
    alert("Please log in or sign up first!");
    navigate("/login");
    return;
  }

  if (shouldFetchFromServer) {
    loadEverything();
  } else {
    setLoading(false);
  }
}, [shouldFetchFromServer, token, loadEverything, navigate]);


  // -----------------------------------------------------------

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

    sliderElem.addEventListener("wheel", nonPassiveWheelHandler, {
      passive: false
    });
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
  const filteredTrainers = trainersList.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (!trainerFilter || t.tcg_rarity === trainerFilter)
  );
  const filteredEnergies = energyList.filter(
    (e) =>
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
            const description =
              speciesRes.data.flavor_text_entries.find(
                (entry) => entry.language.name === "en"
              )?.flavor_text || "No description available.";

            setSelectedCardDetail((prevDetail) => {
              if (prevDetail && prevDetail.name === pokemonData.name) {
                return prevDetail;
              }
              return {
                ...pokemonData,
                type: "pokemon",
                description
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
              description: null
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

    if (card.type !== "pokemon") {
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

  // -------------------------- UPDATE DECK -------------------------
  const updateDeck = async () => {
  if (!token) {
    alert("Hey, you must login first!");
    return;
  }

  setLoading(true);

  try {
    const payload = {
      pokemon_ids: deck.filter((c) => c.type === "pokemon").map((c) => c.id),
      trainer_names: deck.filter((c) => c.type === "trainer").map((c) => c.name),
      energy_types: deck.filter((c) => c.type === "energy").map((c) => c.energy_type || c.name)
    };

    await axios.post("http://localhost:8000/deck", payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    const deckRes = await axios.get("http://localhost:8000/deck", {
      headers: { Authorization: `Bearer ${token}` }
    });

    const serverDeck = deckRes.data.deck || {
      pokemon: [],
      trainers: [],
      energy: []
    };

    const newDeckData = {
      deck: {
        pokemon: serverDeck.pokemon || [],
        trainers: serverDeck.trainers || [],
        energy: serverDeck.energy || []
      },
      deck_score: deckRes.data.deck_score || 0,
      recommendations: deckRes.data.recommendations || [],
      suggestionImage: deckRes.data.suggestionImage || null
    };

    setDeckData(newDeckData);
    localStorage.setItem("deckData", JSON.stringify(newDeckData));

    setDeck([]);

    setLoading(false);

    alert("Deck updated successfully!");

  } catch (error) {
    console.error("Error updating deck:", error);
    alert("Failed to update your deck. Please log in first.");

    setLoading(false);
  }
};

  const addCardToDeck = (card, source = "caught") => {
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

  const handleAddPokemon = async (rec) => {
    if (!rec || !rec.name) {
      alert("No valid Pokémon found!");
      return;
    }

    const pokemonId = rec.id || rec.pokemon_id;
    if (!pokemonId) {
      alert("No valid Pokémon ID found in recommendation.");
      return;
    }

    let strengths = rec.strengths || [];
    let weaknesses = rec.weaknesses || [];

    if (strengths.length === 0 || weaknesses.length === 0) {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`http://localhost:8000/pokemon/${pokemonId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        strengths = response.data.strengths;
        weaknesses = response.data.weaknesses;
      } catch (error) {
        console.error("Error fetching Pokémon details", error);
      }
    }

    const newCard = {
      id: pokemonId,
      name: rec.name.trim(),
      type: "pokemon",
      strengths,
      weaknesses
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
      type: "trainer"
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
      energy_type: eType
    };

    addCardToDeck(newCard, "recommendation");
  };

  const [showMorePokemon, setShowMorePokemon] = useState(false);
  const [showMoreTrainers, setShowMoreTrainers] = useState(false);
  const [showMoreEnergy, setShowMoreEnergy] = useState(false);

  const [recIndexPokemon, setRecIndexPokemon] = useState(0);
  const [recIndexTrainerEnergy, setRecIndexTrainerEnergy] = useState(0);

  const [overlayState, setOverlayState] = useState({ cardId: null, type: null });

  const toggleOverlay = (cardId, type) => {
    if (overlayState.cardId === cardId && overlayState.type === type) {
      setOverlayState({ cardId: null, type: null });
    } else {
      setOverlayState({ cardId, type });
    }
  };

  const closeOverlay = () => {
    setOverlayState({ cardId: null, type: null });
  };

  const handleDeletePokemon = async (pokemonId) => {
    try {
      if (!token) {
        alert("Please log in first");
        return;
      }
      await axios.delete(`http://localhost:8000/deck/pokemon/${pokemonId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setDeckData((prev) => ({
        ...prev,
        deck: {
          ...prev.deck,
          pokemon: prev.deck.pokemon.filter((card) => card.id !== pokemonId)
        }
      }));
    } catch (error) {
      console.error("Error deleting Pokémon:", error);
      alert("Failed to delete the Pokémon from your deck.");
    }
  };

  const handleDeleteTrainer = async (trainerId) => {
    try {
      if (!token) {
        alert("Please log in first");
        return;
      }
      await axios.delete(`http://localhost:8000/deck/trainer/${trainerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setDeckData((prev) => ({
        ...prev,
        deck: {
          ...prev.deck,
          trainers: prev.deck.trainers.filter((card) => card.id !== trainerId)
        }
      }));
    } catch (error) {
      console.error("Error deleting Trainer:", error);
      alert("Failed to delete the Trainer card from your deck.");
    }
  };

  const handleDeleteEnergy = async (energyId) => {
    try {
      if (!token) {
        alert("Please log in first");
        return;
      }
      await axios.delete(`http://localhost:8000/deck/energy/${energyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setDeckData((prev) => ({
        ...prev,
        deck: {
          ...prev.deck,
          energy: prev.deck.energy.filter((card) => card.id !== energyId)
        }
      }));
    } catch (error) {
      console.error("Error deleting Energy:", error);
      alert("Failed to delete the Energy card from your deck.");
    }
  };

  const [showInstructions, setShowInstructions] = useState(false);

  return (
    <>
      {loading ? (
        <div className="loading-container">
          <p style={{ marginLeft: "20px", color: "#fff" }}>
            Please wait...
          </p>
          <img src={gengarSpinner} alt="Loading..." className="spinner-img" />
        </div>
      ) : (
        <>
          <Header />
          <div className="app-container">
            <div
              style={{
                display: "none",
                textAlign: "center",
                marginTop: "10px"
              }}
            >
              <h1 style={{ fontSize: "2rem", margin: "0", color: "#262626" }}>
                Pokémon Deck Builder
              </h1>
            </div>

            <div className="deck-top-section">
              <div className="deck-page-three-cols">
                {/* --------------------
                  LEFT COLUMN
                --------------------- */}
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
                      {/* POKEMON FILTER GROUP */}
                      <div
                        className="filter-group"
                        style={{
                          display: "inline-block",
                          position: "relative",
                          marginRight: "10px"
                        }}
                        onMouseEnter={() => setHoveredFilter("pokemon")}
                        onMouseLeave={() => setHoveredFilter("")}
                      >
                        <button
                          className={
                            cardCategory === "pokemon" ? "active-tab" : ""
                          }
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
                                const value = e.target.value;
                                setSelectedType(value);
                                setSelectedIndex(0);
                                if (value === ""){
                                localStorage.removeItem("pokemonList");
                                }
                                setShouldFetchFromServer(true);
                              }}
                            >
                              <option value="">See All</option>
                              {typesList.map((t) => (
                                <option key={t.name} value={t.name}>
                                  {t.name.charAt(0).toUpperCase() +
                                    t.name.slice(1)}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                      {/* TRAINER FILTER GROUP */}
                      <div
                        className="filter-group"
                        style={{
                          display: "inline-block",
                          position: "relative",
                          marginRight: "10px"
                        }}
                        onMouseEnter={() => setHoveredFilter("trainer")}
                        onMouseLeave={() => setHoveredFilter("")}
                      >
                        <button
                          className={
                            cardCategory === "trainer" ? "active-tab" : ""
                          }
                          onClick={() => {
                            setCardCategory("trainer");
                            setSelectedIndex(0);
                          }}
                        >
                          Trainers
                        </button>
                        {hoveredFilter === "trainer" &&
                          uniqueTrainerTypes.length > 0 && (
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
                      {/* ENERGY FILTER GROUP */}
                      <div
                        className="filter-group"
                        style={{
                          display: "inline-block",
                          position: "relative",
                          marginRight: "10px"
                        }}
                        onMouseEnter={() => setHoveredFilter("energy")}
                        onMouseLeave={() => setHoveredFilter("")}
                      >
                        <button
                          className={
                            cardCategory === "energy" ? "active-tab" : ""
                          }
                          onClick={() => {
                            setCardCategory("energy");
                            setSelectedIndex(0);
                          }}
                        >
                          Energy
                        </button>
                        {hoveredFilter === "energy" &&
                          uniqueEnergyTypes.length > 0 && (
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
                      {/* SCROLLABLE CARDS */}
                      <div
                        className="cards-slider"
                        style={{
                          transform: `translateY(${165 - selectedIndex * 270}px)`,
                          transition: "transform 0.3s ease"
                        }}
                      >
                        {unifiedCardsFiltered.map((card, i) => (
                          <div
                            key={`${card.name || card.tcg_id}-${i}`}
                            className={`card-item ${
                              i === selectedIndex ? "active" : "inactive"
                            } ${i === caughtCardIndex ? "caught" : ""}`}
                            style={{
                              transform: i === selectedIndex ? "scale(1.3)" : "scale(1)",
                              opacity: i === selectedIndex ? 1 : 0.4,
                              transition: "transform 0.3s, opacity 0.3s"
                            }}
                            onClick={() => handleCardClick(card, i)}
                          >
                            {card.type === "pokemon" ? (
                              <img
                                src={`https://img.pokemondb.net/artwork/large/${getCanonicalPokemonName(card.name)}.jpg`}
                                alt={card.name}
                                className="card-img"

                                onError={(e) => {
                                e.target.onerror = null; // prevent infinite loop
                                e.target.src = `https://img.pokemondb.net/sprites/home/normal/${getCanonicalPokemonName(card.name)}.png`;
                              }}

                              />
                            ) : (
                              <img
                                src={card.tcg_image_url}
                                alt={card.name}
                                className="card-img"
                              />
                            )}
                            <h3>{card.name || ""}</h3>
                          </div>
                        ))}
                        {unifiedCardsFiltered.length === 0 && (
                          <div
                            style={{
                              marginTop: 50,
                              textAlign: "center"
                            }}
                          >
                            <h3>Pick a tab: Pokémon, Trainer or Energy</h3>
                            <h3>Then scroll through to learn about the cards.</h3>
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
                          fontSize: "14px"
                        }}
                      >
                        Total Cards Found: {unifiedCardsFiltered.length}
                      </div>
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
                </div>

                {/* --------------- MIDDLE COLUMN FOR CARD DETAILS --------------- */}
                <div className="card-detail-col">
                  <div className="middle-col-header">
                    <h4 style={{ margin: 0 }}>Pokémon Card Info</h4>
                  </div>
                  <div className="middle-col-body">
                    {selectedCardDetail ? (
                      <div
                        className="detail-card"
                        style={{
                          backgroundColor:
                            selectedCardDetail?.types &&
                            selectedCardDetail.type === "pokemon"
                              ? typeColors[
                                  selectedCardDetail.types[0].type.name.toLowerCase()
                                ]
                              : "#fff"
                        }}
                      >
                        {selectedCardDetail.type === "pokemon" ? (
                          <>
                            <div className="card-header">
                              <h2 className="detail-name">
                                {selectedCardDetail.name
                                  .charAt(0)
                                  .toUpperCase() +
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
                              style={{
                                position: "relative",
                                textAlign: "center"
                              }}
                            >
                              <img
                                src={`https://img.pokemondb.net/artwork/large/${getCanonicalPokemonName(selectedCardDetail.name)}.jpg`}
                                alt={selectedCardDetail.name}
                                className="detail-img"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = `https://img.pokemondb.net/sprites/home/normal/${getCanonicalPokemonName(selectedCardDetail.name)}.png`;
                                }}
                              />
                              <button
                                onClick={() => addCardToDeck(selectedCardDetail)}
                                className={`catch-btn ${
                                  isCatching ? "catching" : ""
                                }`}
                                style={{
                                  position: "absolute",
                                  bottom: "0",
                                  right: "0"
                                }}
                              />
                              <div
                                className="catch-btn-text"
                                style={{
                                  position: "absolute",
                                  bottom: "-30px",
                                  right: "0",
                                  fontSize: "16px"
                                }}
                              >
                                Catch it!
                              </div>
                            </div>

                            {selectedCardDetail.height &&
                              selectedCardDetail.weight && (
                                <div className="pokemon-size-info">
                                  <p>
                                    Height:{" "}
                                    {selectedCardDetail.height / 10} m | Weight:{" "}
                                    {selectedCardDetail.weight / 10} kg
                                  </p>
                                </div>
                              )}
                            {selectedCardDetail.stats && (
                              <div className="detail-info">
                                <div className="detail-section type-section">
                                  <h4>Type</h4>
                                  <div className="type-badges">
                                    {selectedCardDetail.types.map((t) => (
                                      <span
                                        key={t.type.name}
                                        className="type-badge"
                                      >
                                        {t.type.name
                                          .charAt(0)
                                          .toUpperCase() +
                                          t.type.name.slice(1)}
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
                                        <div
                                          key={st.stat.name}
                                          className="stat-item"
                                        >
                                          <span className="stat-name">
                                            {st.stat.name
                                              .split("-")
                                              .map(
                                                (word) =>
                                                  word.charAt(0).toUpperCase() +
                                                  word.slice(1)
                                              )
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
                                          .map(
                                            (word) =>
                                              word.charAt(0).toUpperCase() +
                                              word.slice(1)
                                          )
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
                                onClick={() =>
                                  addCardToDeck(selectedCardDetail)
                                }
                                className={`catch-btn ${
                                  isCatching ? "catching" : ""
                                }`}
                                style={{
                                  position: "absolute",
                                  bottom: "347px",
                                  right: "5px"
                                }}
                              />
                              <div
                                className="catch-btn-text"
                                style={{
                                  position: "absolute",
                                  bottom: "322px",
                                  right: "5px",
                                  fontSize: "16px"
                                }}
                              >
                                Catch it!
                              </div>
                            </div>
                            <div className="trainer-info">
                              {selectedCardDetail.tcg_set && (
                                <div className="trainer-set">
                                  <p>
                                    <strong>Set:</strong>{" "}
                                    {selectedCardDetail.tcg_set}
                                  </p>
                                </div>
                              )}
                              <div
                                className={`trainer-rarity ${
                                  selectedCardDetail.tcg_rarity ? "" : "empty"
                                }`}
                              >
                                <p>
                                  <strong>Rarity:</strong>{" "}
                                  {selectedCardDetail.tcg_rarity || " "}
                                </p>
                              </div>

                              <div className="trainer-bottom-container">
                                <div className="trainer-bottom-image">
                                  <img
                                    src={trainerImage}
                                    alt="Pokémon Trainer illustration"
                                  />
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
                                onClick={() =>
                                  addCardToDeck(selectedCardDetail)
                                }
                                className={`catch-btn ${
                                  isCatching ? "catching" : ""
                                }`}
                                style={{
                                  position: "absolute",
                                  bottom: "347px",
                                  right: "5px"
                                }}
                              />
                              <div
                                className="catch-btn-text"
                                style={{
                                  position: "absolute",
                                  bottom: "322px",
                                  right: "5px",
                                  fontSize: "16px"
                                }}
                              >
                                Catch it!
                              </div>
                            </div>
                            <div className="energy-info">
                              {selectedCardDetail.energy_type && (
                                <div className="energy-type">
                                  <p>
                                    <strong>Type:</strong>{" "}
                                    {selectedCardDetail.energy_type}
                                  </p>
                                </div>
                              )}
                              <div className="energy-bottom-container">
                                <div className="energy-bottom-image">
                                  <img
                                    src={energyImage}
                                    alt="Pikachu Energy illustration"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="no-detail" style={{ textAlign: "center" }}>
                        <h3>Pokémon, Trainer and Energy Cards</h3>
                        <h3>Pick the ones you like best and click 'Catch it!'</h3>
                      </div>
                    )}
                  </div>
                </div>

                {/* --------------- RIGHT COLUMN (RECOMMENDATIONS) --------------- */}
                <div className="right-slider-col" style={{ flex: "1" }}>
                  <div className="right-col-header">
                    <h4 style={{ margin: 0 }}>Recommendations</h4>
                  </div>
                  <div className="right-col-body">
                    <div className="recommendations-slider-container">
                      <div
                        className="recommendations-slider"
                        style={{
                          transform: `translateY(${
                            -(
                              cardCategory === "pokemon"
                                ? recIndexPokemon
                                : recIndexTrainerEnergy
                            ) * 450
                          }px)`
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
                                    objectFit: "contain"
                                  }}
                                  className={
                                    cardCategory !== "pokemon"
                                      ? "tcg-zoom"
                                      : ""
                                  }
                                />
                              )}
                              <p
                                style={{
                                  color: "#262626",
                                  fontWeight: "bold",
                                  fontSize: "20px"
                                }}
                              >
                                {rec.name}
                              </p>
                              {rec.message && (
                                <p style={{ fontStyle: "italic" }}>
                                  {rec.message}
                                </p>
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
                        <button
                          disabled={
                            cardCategory === "pokemon"
                              ? recIndexPokemon === 0
                              : recIndexTrainerEnergy === 0
                          }
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
                            (cardCategory === "pokemon"
                              ? (recIndexPokemon + 2) * 200
                              : (recIndexTrainerEnergy + 2) * 200) >=
                              deckData.recommendations.filter(
                                (r) => r.type === cardCategory
                              ).length *
                                200
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

            {/* -------------- BOTTOM SECTION WITH "UPDATE NOW!" -------------- */}
            <div className="deck-extra-row">
              <div className="deck-extra-col-l">
                <h3>Cards To Be Added</h3>
                <p>
                  Pokémon: {deck.filter((c) => c.type === "pokemon").length} |
                  Trainers: {deck.filter((c) => c.type === "trainer").length} |
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
                  <p onClick={() => setShowInstructions(true)}>
                    Stuck? Click <u>here</u>!
                  </p>
                </div>
              </div>
              <div
                className="deck-extra-col-m"
                style={{
                  backgroundImage: `url(${deckSummaryImage})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  paddingBottom: "105px"
                }}
              >
                <h3>Your Deck Summary</h3>
                <p>Pokémon: {deckData.deck.pokemon.length} / 20</p>
                <p>Trainers: {deckData.deck.trainers.length} / 20</p>
                <p>Energy: {deckData.deck.energy.length} / 20</p>
                <p>
                  Total:{" "}
                  {deckData.deck.pokemon.length +
                    deckData.deck.trainers.length +
                    deckData.deck.energy.length}{" "}
                  / 60
                </p>
              </div>

              <div
                className="deck-extra-col-r deck-strength-container"
                style={{
                  backgroundImage: `url(${deckStrengthImage})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center"
                }}
              >
                <h3>Deck Strength</h3>
                <div className="deck-strength-meter">
                  <div
                    className="meter-bar"
                    style={{
                      width: deckData.deck_score + "%",
                      backgroundColor:
                        deckData.deck_score < 34
                          ? "#d9534f"
                          : deckData.deck_score < 67
                          ? "#f0ad4e"
                          : "#5cb85c"
                    }}
                  />
                  <p className="meter-label">{deckData.deck_score}%</p>
                </div>

                <h3>
                  Deck Score:{" "}
                  {Math.round((deckData.deck_score / 100) * 360)} / 360
                </h3>
                <div
                  className="deck-score-clock"
                  style={{ position: "relative", width: 180, height: 180 }}
                >
                  <ClockMarkers radius={88} markerSize={20} margin={2} />
                  <div
                    className="clock-pointer"
                    style={{
                      position: "absolute",
                      width: "5px",
                      height: "78px",
                      top: "8px",
                      left: "50%",
                      transform: `translateX(-50%) rotate(${
                        (deckData.deck_score / 100) * 360
                      }deg)`,
                      transformOrigin: "bottom center",
                      backgroundColor:
                        deckData.deck_score < 34
                          ? "#d9534f"
                          : deckData.deck_score < 67
                          ? "#f0ad4e"
                          : "#5cb85c",
                      transition: "background-color 0.3s ease"
                    }}
                  />
                </div>
                  <button
                    className="deck-info-btn"
                    onClick={() => setShowStrengthInfo(true)}
                  >
                    i
                  </button>
                </div>
              </div>
              {showStrengthInfo && (
              <div className="deck-info-overlay">
                <div className="deck-info-content">
                  <button
                    className="update-modal-close-btn"
                    onClick={() => setShowStrengthInfo(false)}
                  >
                    X
                  </button>
                  <div className="deck-info-text">
                    <h3>What’s the Deck Strength Meter?</h3>
                    <p>
                      The Deck Strength Meter shows how powerful your deck is.<br /> A higher meter means your Pokémon team is ready for battle!
                    </p>

                    <h3>What’s the Deck Score?</h3>
                    <p>
                      The Deck Score helps you understand how balanced and strong your deck is overall. Aim for the highest score possible!
                    </p>
                  </div>
                </div>
              </div>
            )}
            {showInstructions && (
              <div className="update-instructions-modal">
                <div className="update-instructions-content">
                  <button
                    className="update-modal-close-btn"
                    onClick={() => setShowInstructions(false)}
                  >
                    X
                  </button>
                  <h2 style={{ textAlign: "center" }}>
                    Follow These Instructions!
                  </h2>
                  <ol>
                    <li>
                      Click on <b>'Catch it'</b> button to add the cards to your
                      deck.
                    </li>
                    <li>
                      Click on <b>'Add'</b> button to add recommendations to your
                      deck.
                    </li>
                    <li>
                      Click on <b>'Update Now!'</b> to see the changes in your
                      deck.
                    </li>
                    <li>
                      You have to <b>'Update Now!'</b> after deleting your cards
                      as well.
                    </li>
                  </ol>
                  <h3 style={{ textAlign: "center" }}>
                    Have fun building your deck!
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
                {/* ---------------- POKEMON GROUP -------------- */}
                <div className="deck-cards-group">
                 <div className="deck-header-with-button">
                  <h4>Your Pokémon Cards</h4>
                   <button
                      className="deck-tips-btn"
                      onClick={() => setShowPokemonTips(true)}
                      style={{ marginBottom: "10px" }}
                   >
                     Check Out These Tips!
                   </button>
                   </div>
                   {showPokemonTips && (
                  <div className="deck-tip-overlay" onClick={() => setShowPokemonTips(false)}>
                    <div
                      className="deck-tip-content"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="collapse-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowPokemonTips(false);
                        }}
                      >
                        X
                      </button>
                      <h3>Building Your Pokémon Deck</h3>
                      <ul className="tip-points">
                        <li>Check the strengths and weaknesses of the Pokémon in your deck.</li>
                        <li>Then head over to the recommendations slider to see which Pokémon would
                         be a great match-up to make your deck stronger!</li>
                        <li>If you choose to 'Add' a recommended Pokémon, don’t forget to click the <strong>'Update Now!'</strong>
                          button to make it part of your team!</li>
                      </ul>
                          <div className="garbodor-tip-row">
                            <p className="garbodor-tip-text">
                              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>Deleting a card?</span><br/ ><br />
                              No worries — Garbodor Gigantamax LOVES munching unwanted cards!<br/ ><br />
                              Just click the bin icon followed by <strong>'Update Now!'</strong>
                            </p>
                            <img
                              src={deleteGarbodorImage}
                              alt="Garbodor enjoying trash"
                              className="garbodor-tip-img"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  <div className="deck-cards-grid">
                    {(showMorePokemon
                      ? deckData.deck.pokemon
                      : deckData.deck.pokemon.slice(0, 5)
                    ).map((card) => (
                      <div
                        key={card.id}
                        className="deck-pokemon-card"
                        style={{ position: "relative" }}
                      >
                      <div
                        className="delete-pokemon-btn"
                        onClick={() => handleDeletePokemon(card.id)}
                      >
                        <img src={deleteIcon} alt="Delete card" className="delete-icon" />
                      </div>
                        <img
                          src={`https://img.pokemondb.net/artwork/large/${getCanonicalPokemonName(card.name)}.jpg`}
                          alt={card.name}
                          className="deck-pokemon-img"
                        />
                        <h3>
                          {card.name.charAt(0).toUpperCase() +
                            card.name.slice(1)}
                        </h3>
                        <div className="labels-grid">
                          <div className="label-col">
                            <button
                              className="eye-strength-btn"
                              onClick={() =>
                                toggleOverlay(card.id, "strengths")
                              }
                            >
                              <img
                                src={cartoonStrengthEye}
                                alt="View Pokemon Strengths"
                                className="eye-icon"
                              />
                            </button>
                            <span>Strengths</span>
                          </div>
                          <div className="label-col">
                            <button
                              className="eye-weakness-btn"
                              onClick={() =>
                                toggleOverlay(card.id, "weaknesses")
                              }
                            >
                              <img
                                src={cartoonWeaknessEye}
                                alt="View Pokemon Weaknesses"
                                className="eye-icon"
                              />
                            </button>
                            <span>Weaknesses</span>
                          </div>
                        </div>
                        {overlayState.cardId === card.id && (
                          <div className="overlay">
                            <div className="overlay-content">
                              <h3>
                                {overlayState.type === "strengths"
                                  ? "Strengths"
                                  : "Weaknesses"}
                              </h3>
                              <p className="overlay-text">
                                {(
                                  overlayState.type === "strengths"
                                    ? card.strengths || []
                                    : card.weaknesses || []
                                )
                                  .map(
                                    (item) =>
                                      item.charAt(0).toUpperCase() +
                                      item.slice(1)
                                  )
                                  .join(", ")}
                              </p>
                              <button onClick={closeOverlay}>Close</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {deckData.deck.pokemon.length > 5 && (
                    <button
                      className="see-more-btn"
                      onClick={() => setShowMorePokemon((prev) => !prev)}
                    >
                      {showMorePokemon ? "See Less" : "See More"}
                    </button>
                  )}
                </div>

                {/* ---------------- TRAINERS GROUP -------------- */}
                <div className="deck-cards-group">
                <div className="deck-header-with-button">
                  <h4>Your Trainers Cards</h4>

                  <button
                      className="deck-tips-btn"
                      onClick={() => setShowTrainerTips(true)}
                      style={{ marginBottom: "10px" }}
                    >
                      Tips For Better Moves!
                    </button>
                    </div>
                    {showTrainerTips && (
                      <div className="deck-tip-overlay" onClick={() => setShowTrainerTips(false)}>
                        <div
                          className="deck-tip-content"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className="collapse-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowTrainerTips(false);
                            }}
                          >
                            X
                          </button>
                          <h3>Building Your Trainer Deck</h3>
                          <ul className="tip-points">
                              <li>Trainer cards help you in battles — they can heal your Pokémon, give you more cards,
                               or mess with your opponent!</li>
                              <li>Take a moment to read what each Trainer does. Some help all decks, while others are
                               super powerful in the right combo!</li>
                              <li>Need better cards? Check the recommendations slider and see if there’s a Trainer that
                               fits your battle plan!</li>
                          </ul>
                          <div className="garbodor-tip-row">
                            <p className="garbodor-tip-text">
                              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>Deleting a card?</span><br/ ><br />
                              No worries — Garbodor Gigantamax LOVES munching unwanted cards!<br/ ><br />
                              Just click the bin icon followed by <strong>'Update Now!'</strong>
                            </p>
                            <img
                              src={deleteGarbodorImage}
                              alt="Garbodor enjoying trash"
                              className="garbodor-tip-img"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  <div className="deck-cards-grid">
                      {(showMoreTrainers
                        ? deckData.deck.trainers
                        : deckData.deck.trainers.slice(0, 5)
                      ).map((card) => (
                        <ExpandableCardWrapper
                          key={`trainer-${card.id}`}
                          card={card}
                          isExpanded={expandedTrainerId === card.id}
                          onExpand={setExpandedTrainerId}
                          onCollapse={() => setExpandedTrainerId(null)}
                          onDelete={handleDeleteTrainer}
                        >
                          <div
                            onMouseEnter={() => setHoveredTrainerId(card.id)}
                            onMouseLeave={() => setHoveredTrainerId(null)}
                            className={`card-hover-wrapper ${
                              hoveredTrainerId === card.id || expandedTrainerId === card.id
                                ? "card-clear"
                                : "card-dim"
                            }`}
                          >
                          <img
                            src={card.tcg_image_url}
                            alt={card.name}
                            style={{ width: "200px", height: "250px", objectFit: "contain" }}
                          />
                          </div>
                        </ExpandableCardWrapper>
                      ))}
                    </div>

                  {deckData.deck.trainers.length > 5 && (
                    <button
                      className="see-more-btn"
                      onClick={() => setShowMoreTrainers((prev) => !prev)}
                    >
                      {showMoreTrainers ? "See Less" : "See More"}
                    </button>
                  )}
                </div>

                {/* ---------------- ENERGY GROUP -------------- */}
                <div className="deck-cards-group">
                 <div className="deck-header-with-button">
                  <h4>Your Energy Cards</h4>
                  <button
                  className="deck-tips-btn"
                  onClick={() => setShowEnergyTips(true)}
                  style={{ marginBottom: "10px" }}
                >
                  Get Energy Card Advice!
                </button>
                </div>
                {showEnergyTips && (
                  <div className="deck-tip-overlay" onClick={() => setShowEnergyTips(false)}>
                    <div
                      className="deck-tip-content"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="collapse-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowEnergyTips(false);
                        }}
                      >
                        X
                      </button>
                      <h3>Building Your Energy Deck</h3>
                      <ul className="tip-points">
                        <li>Pokémon need the right energy to attack! Make sure your deck has the energy types that match your Pokémon.</li>
                        <li>Basic Energy powers up your attacks — and some special energy cards give extra bonuses!</li>
                        <li>Use the recommendations slider to fill in any missing energy cards and keep your deck ready to battle!</li>
                      </ul>
                      <div className="garbodor-tip-row">
                        <p className="garbodor-tip-text">
                          <span style={{ fontSize: '18px', fontWeight: 'bold' }}>Deleting a card?</span><br/ ><br />
                          No worries — Garbodor Gigantamax LOVES munching unwanted cards!<br/ ><br />
                          Just click the bin icon followed by <strong>'Update Now!'</strong>
                        </p>
                        <img
                          src={deleteGarbodorImage}
                          alt="Garbodor enjoying trash"
                          className="garbodor-tip-img"
                        />
                      </div>
                    </div>
                  </div>
                )}
                  <div className="deck-cards-grid">
                    {(showMoreEnergy
                      ? deckData.deck.energy
                      : deckData.deck.energy.slice(0, 5)
                    ).map((card) => (
                      <ExpandableCardWrapper
                        key={`energy-${card.id}`}
                        card={card}
                        isExpanded={expandedEnergyId === card.id}
                        onExpand={setExpandedEnergyId}
                        onCollapse={() => setExpandedEnergyId(null)}
                        onDelete={handleDeleteEnergy}
                      >
                        <div
                          onMouseEnter={() => setHoveredEnergyId(card.id)}
                          onMouseLeave={() => setHoveredEnergyId(null)}
                          className={`card-hover-wrapper ${
                            hoveredEnergyId === card.id || expandedEnergyId === card.id
                              ? "card-clear"
                              : "card-dim"
                          }`}
                        >
                        <img
                          src={card.tcg_image_url}
                          alt={card.name}
                          style={{ width: "200px", height: "250px", objectFit: "contain" }}
                        />
                        </div>
                      </ExpandableCardWrapper>
                    ))}
                  </div>

                  {deckData.deck.energy.length > 5 && (
                    <button
                      className="see-more-btn"
                      onClick={() => setShowMoreEnergy((prev) => !prev)}
                    >
                      {showMoreEnergy ? "See Less" : "See More"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          <Footer />
        </>
      )}
    </>
  );
}

export default DeckPage;

// e.target.src = "/path/to/default/image.png";