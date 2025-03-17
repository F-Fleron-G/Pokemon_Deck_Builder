import React from "react";
import "./Footer.css";

import ftLeftImage from "../assets/ft_left_image.png";
import ftRightImage from "../assets/ft_right_image.png";

function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-column footer-left">
          <img src={ftLeftImage} alt="Pokemon Monferno" />
        </div>
        <div className="footer-column footer-center">
          <p>© 2025 F &amp; J Fleron Grignard</p>
          <p>All rights reserved</p>
          <p>Not affiliated with The Pokémon Company</p>
        </div>
        <div className="footer-column footer-right">
          <img src={ftRightImage} alt="Right decoration" />
        </div>
      </div>
      <div className="credits">
        <p>
          Data and images courtesy of Pokeapi, TCG Api, and Pokemondb.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
