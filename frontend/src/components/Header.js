import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";
import "./Header.css";

function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header className="app-header">
      <img
        src={logo}
        alt="Pokemon Deck Builder Logo"
        className="logo-img"
        onClick={() => navigate("/")}
      />
      <nav className="header-nav">
        <button className="header-nav-home-btn" onClick={() => navigate("/home")}>
          Build it
        </button>
        <button className="header-nav-login-btn" onClick={() => navigate("/login")}>
          Login
        </button>
        <button className="header-nav-signup-btn" onClick={() => navigate("/signup")}>
          SignUp
        </button>
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
