![Pikachu](https://github.com/F-Fleron-G/Pokemon_Deck_Builder/blob/main/images/pokemon-battle-image.jpg?raw=true)

# Pokémon Deck Builder


Welcome to the **Pokémon Deck Builder**, a FastAPI-based application that helps kids build and optimise their Pokémon
battle decks! This project uses PostgreSQL to store user accounts, detailed Pokémon data, and user decks—drawing data
from both the PokéAPI and the Pokémon TCG API.
The front end (built with React) gives users an interactive experience to create, manage, and improve their decks.

---

## Table of Contents
1. [Features](#features)
2. [Technologies](#technologies)
3. [Project Structure](#project-structure)
4. [Setup Instructions](#setup-instructions)
5. [Endpoints Overview](#endpoints-overview)
6. [Future Enhancements](#future-enhancements)
7. [Credits](#credits)
8. [License](#license)

---

## Features

- **Pokémon Data**: 
  - Retrieves detailed Pokémon stats (types, moves, abilities, etc.) from PokéAPI.  
  - Displays attractive Pokémon images from PokémonDB.net.  
  - Automatically calculates type strengths & weaknesses.
  
  
- **Deck Building & Management**: 
  - **Authentication**: Secure signup and login using JWT (implemented in `auth.py`).
  - **Deck CRUD Operations**: Create, update, and delete cards from decks (see `deck_routes.py`).
  - **Dynamic Recommendations**: Suggestions based on deck synergy & weaknesses (see `recommendations.py`).
  
  
- **TCG Integration**:
  - Fetch Trainer and Energy card details from the Pokémon TCG API (handled in `tcg_routes.py`).


- **Front-End Experience**:
  - Interactive React-based UI (in `frontend/src/`).  
  - Kid-friendly interface with deck counters, recommended cards, synergy scores, etc.
  
  
- **Deck Strength Scoring**:
  - Points-based system for quick synergy evaluation (see `synergy.py`).
  

---

## Technologies

- **Backend**: [FastAPI](https://fastapi.tiangolo.com/)
- **Database**: PostgreSQL
- **ORM**: SQLAlchemy
- **Authentication**: JSON Web Tokens (JWT)
- **Front End**: React (Axios, React Router, etc.)
- **Test Framework**: Pytest
- **Deployment**: Backend is live on Render | Frontend is planned upon completion.

Refer to `requirements.txt` for all Python dependencies.

---

## Project Structure

### Backend
- **main.py**:  
  - Initializes the FastAPI app, configures CORS and custom OpenAPI docs, sets up the database (using `database.py`),
  and includes routers for authentication (`auth.py`), deck management (`deck_routes.py`),
  and TCG data (`tcg_routes.py`).
  

- **auth.py**:  
  - Endpoints for signup/login, handling password hashing (bcrypt), JWT creation, etc.
  
  
- **database.py**:  
  - Sets up PostgreSQL connection, SQLAlchemy engine, and session. Defines `create_tables()` to initialize DB tables.
  
  
- **models.py**:  
  - Contains SQLAlchemy ORM models (User, Pokemon, Deck, DeckPokemon, Trainer, Energy, association tables).
  
  
- **schemas.py**:  
  - Pydantic models for data validation and auto-generated docs.
  
  
- **utils.py**:  
  - Helper modules for fetching data from PokéAPI / TCG API, mapping type strengths and weaknesses, etc.
  
  
- **type_matchups.py**:  
  - Contains a type chart with strengths and weaknesses for Pokémon types and a helper function to calculate these.
  
  
- **synergy.py**:  
  - Computes deck synergy score.
  
  
- **deck_routes.py**:  
  - Manages deck-building routes (CRUD operations, synergy scoring, recommendations).
  
  
- **recommendations.py**:  
  - Generates actionable suggestions to improve decks based on synergy and type weaknesses.
  

- **tcg_routes.py**:  
  - Fetches Trainer/Energy data from the Pokémon TCG API, optionally caches them in local tables.
  
  
- **test_main.py**  
  - Simple Pytest-based tests for the main FastAPI endpoints.

### Frontend
- **React Application** (located in `frontend/src/`):
  - **Pages**:
    - **HomePage.js**: The deck builder page where users can scroll through cards, see detailed Pokémon
    information (including weaknesses), and add cards to their deck.
    - **DeckPage.js**: Displays the user’s final deck in a two-column layout.  
      - **Left Column**: Shows current Pokémon, Trainer, and Energy cards with counters (e.g., "11/20 Pokémon")
      and delete buttons. Cards that need replacement are visually marked. 
      - **Right Column**: Contains a vertical slider with recommended cards to add and a deck strength score
      (shown as a percentage or visual meter).
    - **LandingPage.js**, **LoginPage.js**, **SignUpPage.js**: Handle user navigation, authentication, and onboarding.
  - **Components**:
    - **Header.js** and **Footer.js**: Provide consistent navigation and include buttons like "Back to Top"
    and "Back to Building Deck".
  - **Assets**:  
    - Images and CSS files for styling the pages and components.

---

## Setup Instructions

### Prerequisites

- **Python 3.10+** installed on your system.
- **PostgreSQL** installed and running.
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
Visit http://127.0.0.1:8000 to see the welcome message. 
Swagger docs are at http://127.0.0.1:8000/docs.

### Step 6: Run the Front End (Optional)

If you’d like to run the React app:

1. `cd frontend` (assuming your frontend folder is named "frontend").
2. `npm install`
3. `npm start`
4. Open http://localhost:3000 to access the front end, which communicates with the FastAPI app
on http://localhost:8000.

---

## Endpoints Overview
Authentication (JWT-based):

- POST /auth/signup - Create a new user account.
- POST /auth/login - Log in, receive a JWT.

Deck Management (Requires JWT):

- GET /deck - get current user’s deck & synergy score.
- POST /deck - add/update cards in the user’s deck.
- DELETE /deck/pokemon/{pokemon_id} - remove a Pokémon.
- DELETE /deck/trainer/{trainer_id} - remove a Trainer.
- DELETE /deck/energy/{energy_id} - remove an Energy.

##  TCG Data Endpoints
- **GET /tcg/external/trainers** – Fetch Trainer cards from the TCG API.
- **GET /tcg/external/energy** – Fetch Energy cards from the TCG API.
- POST /tcg/external/cache - cache trainer/energy data in DB.

---

## Latest Updates

- **Deck Synergy & Scoring**: Refined algorithm to better reflect strategic strengths.
- **TCG Data Integration**: Improved local caching of Trainer/Energy cards.
- **Mobile Responsiveness**: Full layout adjustment for small screens.
- **UI/UX Enhancements**: 
  - Updated spacing, hover effects, typography
  - Improved layout across React pages
- **Bug Fixes**: Endpoints now fully stable and cleanly documented.

---

## Credits
- PokéAPI for Pokémon data.
- Pokémon TCG API for trainer/energy card data.
- PokémonDB.net for high-quality Pokémon images (used under fair use).
- Banner image from Wallpapers.com.
- Built by Frederic G. Fleron Grignard and his creative son!

---

## License
This project is licensed under the MIT License. 
See [LICENSE](LICENSE) for details.

---

## Contributing
Have a fix or a feature to add? Feel free to submit a Pull Request. 
For any large changes, please open an issue first to discuss.