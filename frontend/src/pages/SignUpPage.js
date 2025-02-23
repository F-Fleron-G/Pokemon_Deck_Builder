
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./SignUpPage.css";
import Header from "../components/Header";
import Footer from "../components/Footer";

const API_URL = "http://localhost:8000";

function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await axios.post(`${API_URL}/auth/signup`, { email, password });
      alert("Sign-up successful! Please log in.");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.detail || "Sign-up failed.");
    }
  };

  return (
    <>
      <Header />
      <div className="signup-page">
        {/* Sign-Up Form Section */}
        <section className="signup-section">
      <div className="signup-auth-container">
        <h2>Sign Up</h2>
        {error && <p className="signup-error-text">{error}</p>}
        <form onSubmit={handleSignUp}>
          <div className="signup-auth-field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="signup-auth-field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="signup-auth-button">Sign Up</button>
        </form>
        <h2>Jump into the adventure!</h2>
        <p>Build your own Pokémon deck, discover awesome Pokémon,
          Trainers, and Energy cards, and master the art of synergy!</p>
        <p>Sign up now and start your journey to becoming a deck-building champion!</p>
        <p className="signup-auth-link">
          Got an account? Tap here to <Link to="/login">Log In!</Link>
        </p>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}

export default SignUpPage;
