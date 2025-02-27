from fastapi.testclient import TestClient
from main import app  # Import your FastAPI app

client = TestClient(app)


def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to the Pokémon Deck Builder!"}  # Updated expected response
