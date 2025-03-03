![Pikachu](https://github.com/F-Fleron-G/Pokemon_Deck_Builder/blob/main/images/pokemon-battle-image.jpg?raw=true)

# Pokémon Deck Builder


Welcome to the **Pokémon Deck Builder**, a FastAPI-based application that helps kids build and optimize their Pokémon
battle decks! This project uses PostgreSQL to store user accounts, detailed Pokémon data, and user decks—drawing data
from both the PokéAPI and the Pokémon TCG API.
The front end (built with React) gives users an interactive experience to create, manage, and improve their decks.

---

## Features

- **Pokémon Data**: 
  - Retrieves detailed Pokémon stats, types, moves, abilities, and calculates strengths & weaknesses (see `utils.py`
    and `type_matchups.py`).
  - Displays attractive Pokémon images from PokémonDB.net.
  
- **Deck Building & Management**: 
  - **Authentication**: Secure signup and login using JWT (implemented in `auth.py`).
  - **Deck CRUD Operations**: Create, update, and delete cards from decks (see `deck_routes.py`).
  - **Dynamic Recommendations**: Get actionable suggestions to improve deck balance based on weaknesses and synergy
    (see `recommendations.py`).
  
- **TCG Integration**:
  - Fetch and display Trainer and Energy card details from the Pokémon TCG API (handled in `tcg_routes.py`).
  
- **Front-End Experience**:
  - Interactive pages built with React (files in `frontend/src/pages` and `frontend/src/components`).
  - Clean, kid-friendly interface with visual cues (e.g., deck counters, overlays for cards to be replaced,
    vertical sliders for recommendations).
  
- **Deck Strength Scoring**:
  - A future enhancement will evaluate deck balance and display an overall deck strength as a percentage or visual
    meter.


---

## Technologies

- **Backend**: [FastAPI](https://fastapi.tiangolo.com/)
- **Database**: PostgreSQL
- **ORM**: SQLAlchemy
- **Authentication**: JSON Web Tokens (JWT)
- **Front End**: React
- **Deployment**: (Planned for future development)

---

## Project Structure

### Backend
- **main.py**:  
  - Initializes the FastAPI app, configures CORS and custom OpenAPI docs, sets up the database (using `database.py`), and includes routers for authentication (`auth.py`), deck management (`deck_routes.py`), and TCG data (`tcg_routes.py`).

- **auth.py**:  
  - Contains endpoints for signup and login, functions to hash and verify passwords, and JWT token creation and decoding.
  
- **database.py**:  
  - Configures the PostgreSQL connection, creates the SQLAlchemy engine and session, and runs table creation.
  
- **models.py**:  
  - Defines the data models (User, Pokemon, Deck, DeckPokemon, Trainer, Energy, DeckTrainer, DeckEnergy) used throughout the application.
  
- **schemas.py**:  
  - Contains Pydantic models for data validation (for user registration, login, and deck updates).
  
- **utils.py**:  
  - Provides utility functions for fetching Pokémon data from the PokéAPI and TCG card data from the Pokémon TCG API.
  
- **type_matchups.py**:  
  - Contains a type chart with strengths and weaknesses for Pokémon types and a helper function to calculate these.
  
- **synergy.py**:  
  - Calculates the deck score based on the number of Pokémon, Trainer, and Energy cards in a fun, points-based system.
  
- **deck_routes.py**:  
  - Handles deck management endpoints, including getting the user deck, saving/updating the deck, and removing cards.
  
- **recommendations.py**:  
  - Generates actionable deck recommendations based on the current deck composition and weaknesses.

- **tcg_routes.py**:  
  - Manages endpoints for fetching and manipulating Trainer and Energy cards using the TCG API.

### Frontend
- **React Application** (located in `frontend/src/`):
  - **Pages**:  
    - **HomePage.js**: The deck builder page where users can scroll through cards, see detailed Pokémon information (including weaknesses), and add cards to their deck.
    - **DeckPage.js**: Displays the user’s final deck in a two-column layout.  
      - **Left Column**: Shows current Pokémon, Trainer, and Energy cards with counters (e.g., "11/20 Pokémon") and delete buttons. Cards that need replacement are visually marked.
      - **Right Column**: Contains a vertical slider with recommended cards to add and a deck strength score (shown as a percentage or visual meter).
    - **LandingPage.js**, **LoginPage.js**, **SignUpPage.js**: Handle user navigation, authentication, and onboarding.
  - **Components**:
    - **Header.js** and **Footer.js**: Provide consistent navigation and include buttons like "Back to Top" and "Back to Building Deck".
  - **Assets**:  
    - Images and CSS files for styling the pages and components.

---

## Setup Instructions

### Prerequisites

- Python 3.10+ installed on your system.
- PostgreSQL installed and running.
- A GitHub account (if you’d like to clone this repo).

### Step 1: Clone the Repository

```bash
git clone https://github.com/F-Fleron-G/Pokemon_Deck_Builder.git
cd Pokemon_Deck_Builder
```

### Step 2: Create a Virtual Environment
```bash
python -m venv .venv
source .venv/bin/activate  # macOS/Linux
.venv\Scripts\activate     # Windows
```

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Set Up Environment Variables
Create a .env file in the root folder with the following content:
```env
DATABASE_URL=postgresql://postgres:<YOUR_DB_PASSWORD>@localhost/pokemon_deck_builder
SECRET_KEY=<YOUR_SECRET_KEY>
```
Replace <YOUR_DB_PASSWORD> with your actual password.
Replace <YOUR_SECRET_KEY> with a random secret string for JWT encoding.


### Step 5: Start the Application
Run the FastAPI application:
```bash
uvicorn main:app --reload
```
Open your browser and visit http://127.0.0.1:8000 to access the app.

### Step 6: Front-End Setup (Optional)

If you'd like to run the React front end locally, follow these steps:

1. `cd frontend` (assuming your frontend folder is named "frontend")
2. `npm install`
3. `npm start`
4. Open [http://localhost:3000](http://localhost:3000) to access the front end. By default, it will communicate with the backend running at [http://localhost:8000](http://localhost:8000).

---

## Endpoints Overview
Authentication (JWT-based):

- POST /auth/signup - Create a new user account.
- POST /auth/login - Log in, receive a JWT.

Deck Management (Requires JWT):

- GET /deck - Retrieve the current user’s deck along with counts and recommendations.
- POST /deck - Create or update the user’s deck.
  Request Payload Example:
```json
{
  "pokemon_ids": [1, 4, 7],
  "trainer_names": ["Tropical Wind", "Pokémon Fan Club"],
  "energy_types": ["Fire", "Water"]
}
```
- DELETE /deck/{pokemon_id} - Remove a specific Pokémon from the user’s deck.
- **DELETE /deck/trainer/{trainer_id}** – Remove a Trainer card
- **DELETE /deck/energy/{energy_id}** – Remove an Energy card

##  TCG Data Endpoints
- **GET /tcg/external/trainers** – Fetch Trainer cards from the TCG API
- **GET /tcg/external/energy** – Fetch Energy cards from the TCG API

*(All older Trainer/Energy CRUD endpoints have been removed in favor of local deck storage + direct external fetch.)*

---

## Future Enhancements
- Deck Synergy & Scoring: Implement an algorithm to evaluate deck balance and offer direct suggestions.
- Advanced TCG Data: Expand filtering and detailed card data.
- Front-End Enhancements: Refine the UI/UX with vertical recommendation sliders, card overlays, and improved deck
  counters.
- Deployment: Host the application on platforms like Render, AWS, or PythonAnywhere.
- It is planned to cache or locally store TCG data in the trainers and energy tables to reduce load times. 
  Currently, data is fetched from the TCG API on demand, which may be slower for large sets.
---

## Credits
- PokéAPI for Pokémon stats and type data.
- Pokémon TCG API for card images, sets, and rarity data.
- PokémonDB.net: For the high-quality Pokémon images used in the application. 
  (Used under fair use guidelines for non-commercial, educational purposes. Please see PokémonDB.net Terms of Use
  for more details.)
- Banner image from Wallpapers.com.
- Built by Frederic G. Fleron Grignard.

---

## License
This project is licensed under the MIT License. See the LICENSE file for details.
