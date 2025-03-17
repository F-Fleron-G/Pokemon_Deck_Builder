import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./LoginPage.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import loginFormImage from "../assets/login_form_image.png";

const API_URL = "http://localhost:8000";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      localStorage.setItem("token", response.data.access_token);
      axios.post(`${API_URL}/tcg/external/cache`)
      .then(() => console.log("TCG data cached successfully."))
      .catch((err) => console.error("Error caching TCG data:", err));
      alert("Login successful!");
      navigate("/deck");
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed.");
    }
  };

  return (
    <>
      <Header />
      <div className="login-page">
        <section className="log-in-section">
          <div className="login-auth-container">
            <div className="login-auth-header">
              <img
                src={loginFormImage}
                alt="Pokemon Klefki"
                className="login-form-image"
              />
              <h2>Login</h2>
            </div>
            {error && <p className="login-error-text">{error}</p>}
            <form onSubmit={handleLogin}>
              <div className="login-auth-field">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="login-auth-field">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="login-auth-button">Login</button>
            </form>
            <h2>Why Log In?</h2>
            <p>
              Logging in lets you save your deck, view your synergy scores, and refine your deck strategy.</p>
            <p>Create and customize your winning deck today!</p>
            <p className="login-auth-link">
              New here? Let’s get you started—<Link to="/signup">Sign Up!</Link>
            </p>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}

export default LoginPage;
