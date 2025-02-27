import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./LandingPage.css";

import deckImage from "../assets/deck_image.png";
import loginImage from "../assets/login_image.png";
import aboutImage from "../assets/about_image.png";

import Header from "../components/Header";
import Footer from "../components/Footer";

function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    if (location.state?.scrollToAbout) {
      setTimeout(() => {
        const aboutSection = document.getElementById("about");
        if (aboutSection) {
          aboutSection.scrollIntoView({ behavior: "smooth" });
        }
      }, 200);
    }
  }, [location.state]);

  return (
    <div className="landing-container">
      <Header />

      <section className="welcome-section" id="welcome">
        <div className="two-column">
          <div className="text-column">
            <h1>Welcome to Pokémon Deck Builder!</h1>
            <p>
              Build powerful decks and have a blast exploring synergy
              strategies!
            </p>
            <button
              className="cta-button"
              onClick={() => navigate("/home")}
            >
              Go To Deck Builder
            </button>
          </div>
          <div className="image-column">
            <img
              src={deckImage}
              alt="Deck Building"
              className="clickable-image"
              onClick={() => navigate("/home")}
            />
          </div>
        </div>
      </section>
      <section className="login-section" id="login-section">
        <div className="two-column reverse-layout">
          <div className="text-column">
            <h1>Save Your Deck!</h1>
            <p>
              Log in or sign up to store your deck and unlock synergy scores for
              every card.
            </p>
            <p>
              Track your progress and share with friends!
            </p>
            <button
              className="cta-button"
              onClick={() => navigate("/login")}
            >
              Log In / Sign Up
            </button>
          </div>
          <div className="image-column">
            <img
              src={loginImage}
              alt="Login Prompt"
              className="clickable-image"
              onClick={() => navigate("/login")}
            />
          </div>
        </div>
      </section>
      <section className="about-section" id="about">
        <div className="two-column">
          <div className="text-column">
            <h1>Hello Pokémon Fans!</h1>
            <p>
              With the help of my son—a passionate Pokémon club member who loves discovering great tips
              and tricks for building awesome decks—we’re excited to bring you this app!
            </p>
            <p>
              His firsthand experience and love for the game helped shape an app that’s fun, easy to use,
              and packed with awesome features for every aspiring deck builder!
            </p>
            <p>
              Designed especially for kids ages 8–12 who love Pokémon, this app lets you explore, filter,
              and add Pokémon, trainers, and energy cards to build your ultimate battle deck.
            </p>
            <p>
              Test your strategy, boost your synergy score, and have a blast discovering new ways to
              become a Pokémon Master!
            </p>

            <button className="back-to-top" onClick={scrollToTop}>
              ⬆ Go Up!
            </button>
          </div>
          <div className="image-column">
            <img
              src={aboutImage}
              alt="About Pokemon"
              className="about-image"
            />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default LandingPage;
