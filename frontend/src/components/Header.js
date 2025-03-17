import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";
import instructionsImage from "../assets/instructions_image.png";
import "./Header.css";

function Header() {
  const [showInstructions, setShowInstructions] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const token = localStorage.getItem("token");
  const isLoggedIn = !!token;

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <header className="app-header">
      <div className="logo-container">
        <img
          src={logo}
          alt="Pokemon Deck Builder Logo"
          className="logo-img"
          onClick={() => navigate("/")}
        />
        <div className="logo-overlay">Lets go home!</div>
      </div>

      {/* Info button */}
      <div
        className="header-info-btn"
        onClick={() => setShowInstructions(true)}
      >
        <span style={{ fontSize: "40px", fontWeight: "bold" }}>?</span>
      </div>

      {/* Pop-up / Modal for instructions */}
      {showInstructions && (
        <div className="instructions-modal">
          <div className="instructions-content">
            <button
              className="modal-close-btn"
              onClick={() => setShowInstructions(false)}
            >
              X
            </button>
            <div className="modal-body">
              <div className="modal-text">
            <h2>Welcome to Your Pokémon Deck Builder!</h2>
            <p>Hi there, Pokémon Trainer!</p>
            <p>Are you ready to create your awesome Pokémon deck?</p>
            <p>Here, you can choose your favorite Pokémon, Trainer cards, and Energy cards to build the strongest deck possible!</p>
            <h3>Here is what you can do:</h3>
            <ul>
            <li>Select Pokémon Cards: Choose your favorite Pokémon to add to your deck.</li>
            <li>Discover Trainers and Energy Cards: Learn what each card does and how it helps your Pokémon during battles.</li>
            <li>Improve Your Deck: Follow the helpful recommendations to make your deck stronger and better.</li>
            </ul>
            <h3>Getting Started:</h3>
            <p>First, make sure you sign-up if it is your first time here.</p>
            <p>If you already have an account, simply log in and wait for your saved deck to load.</p>
            <h3>Important Tip!</h3>
            <p>Each time you add or remove cards, do not forget to click the "Update Now!" button. This makes sure your deck is saved correctly and helps the program suggest even better recommendations for your next moves!</p>
            <h3>What’s the Deck Strength Meter?</h3>
            <p>The Deck Strength Meter shows how powerful your deck is. A higher meter means your Pokémon team is ready for battle!</p>
            <h3>What’s the Deck Score?</h3>
            <p>The Deck Score helps you understand how balanced and strong your deck is overall. Aim for the highest score possible!</p>
            <h3>Please Note:</h3>
            <p>Updating your deck might take a few moments because the program is thinking hard about the best recommendations to help you become a Pokémon Master!</p>
            <p>Thanks for your patience!</p>
            </div>
            <div className="modal-image">
              <img
                src={instructionsImage}
                alt="Pokémon Inteleon"
              />
            </div>
          </div>
        </div>
      </div>
      )}

      <nav className="header-nav">
        <button className="header-nav-home-btn" onClick={() => navigate("/deck")}>
          Build it
        </button>

        {isLoggedIn ? (
          <button className="header-nav-logout-btn" onClick={handleLogout}>
            Logout
          </button>
        ) : (
          <>
            <button className="header-nav-login-btn" onClick={() => navigate("/login")}>
              Login
            </button>
            <button className="header-nav-signup-btn" onClick={() => navigate("/signup")}>
              SignUp
            </button>
          </>
        )}

        <button
          className="header-nav-about-btn"
          onClick={() => {
            if (location.pathname !== "/") {
              navigate("/", { state: { scrollToAbout: true } });
            } else {
              const aboutSection = document.getElementById("about");
              if (aboutSection) {
                aboutSection.scrollIntoView({ behavior: "smooth" });
              }
            }
          }}
        >
          About
        </button>
      </nav>
    </header>
  );
}

export default Header;
