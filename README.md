![Pikachu](https://github.com/F-Fleron-G/Pokemon_Deck_Builder/blob/main/images/pokemon-battle-image.jpg?raw=true)

# Pokémon Deck Builder

Welcome to the **Pokémon Deck Builder**, a FastAPI-based application that helps kids build and optimize their Pokémon 
battle decks! This project uses PostgreSQL to store user accounts, Pokémon data, and user decks—including data fetched
from both the PokéAPI and the Pokémon TCG API.

---

## Features

- **Pokémon Data**: Retrieves detailed Pokémon stats, types, strengths, weaknesses, moves, and TCG card images.
- **Build & Manage Decks**: 
  - Sign up / Log in (JWT Authentication).
  - Create and update decks that include not only Pokémon but also Trainer and Energy cards. 
  - Deck update requests now accept lists of Pokémon IDs, Trainer names, and Energy types.
- **TCG Integration**: Automatically fetch and store card images, set names, and rarity for Pokémon, Trainers, 
    and Energy cards from the Pokémon TCG API.
- **Future Synergy & Scoring**: A planned algorithm will evaluate deck balance by considering Pokémon stats,
    Trainer card effects, and Energy matching.

---

## Technologies

- **Backend**: [FastAPI](https://fastapi.tiangolo.com/)
- **Database**: PostgreSQL
- **ORM**: SQLAlchemy
- **Authentication**: JSON Web Tokens (JWT)
- **Deployment**: (Planned for future development)

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

---

## Endpoints Overview
Authentication (JWT-based):

- POST /auth/signup - Create a new user account.
- POST /auth/login - Log in, receive a JWT.

Deck Management (Requires JWT):

- GET /user/deck - Retrieve the current user’s deck.
- POST /user/deck - Create or update the user’s deck.
  Request Payload Example:
```json
{
  "pokemon_ids": [1, 4, 7],
  "trainer_names": ["Tropical Wind", "Pokémon Fan Club"],
  "energy_types": ["Fire", "Water"]
}
```
- DELETE /user/deck/{pokemon_id} - Remove a specific Pokémon from the user’s deck.

---

## Future Enhancements
- Deck Synergy & Scoring: Implement an algorithm to evaluate deck balance and offer suggestions for improvement based on Pokémon stats,
  Trainer effects, and Energy matching.
- Advanced TCG Data: Expand functionality to include more detailed card data and improve filtering based on card 
  effects.
- Front-End Integration: Develop a React or Vue.js front end to provide an interactive user experience, tailored 
  for kids (8–12 years old) and Pokémon enthusiasts.
- Deployment: Host the application on a platform like Render, AWS, or PythonAnywhere.

---

## Credits
- PokéAPI for Pokémon stats and type data.
- Pokémon TCG API for card images, sets, and rarity data.
- Banner image from Wallpapers.com.
- Built by Frederic G. Fleron Grignard.

---

## License
This project is licensed under the MIT License. See the LICENSE file for details.
