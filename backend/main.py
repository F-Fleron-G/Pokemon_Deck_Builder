from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
import models
from database import Base, engine
from auth import router as auth_router
from deck_routes import router as deck_router
from tcg_routes import router as tcg_router

"""
    Main entry point for the Pokémon Deck Builder API.
    
    This file sets up the FastAPI application, configures CORS and OpenAPI (Swagger) documentation,
    initializes the database tables, and includes all the necessary routers for authentication,
    deck management, and TCG data.
"""

app = FastAPI()


def custom_openapi():
    """
       Generates a custom OpenAPI schema for the application.
       This function adds security schemes for the API key authentication and updates
       the default schema provided by FastAPI.
       Returns:
           dict: The custom OpenAPI schema.
    """

    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title="Pokémon Deck Builder API",
        version="1.0.0",
        description="API for Pokémon Deck Builder",
        routes=app.routes,
    )
    openapi_schema["components"]["securitySchemes"] = {
        "APIKeyHeader": {
            "type": "apiKey",
            "in": "header",
            "name": "Authorization"
        }
    }
    openapi_schema["security"] = [{"APIKeyHeader": []}]
    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi


def setup_database():
    """
        Creates all database tables defined in the models if they do not already exist.
        This function ensures that the database schema is in place before the
        application starts handling requests.
    """

    print("Ensuring database tables exist...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully!")


setup_database()

# noinspection PyTypeChecker
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(deck_router, prefix="/user", tags=["Deck Management"])
app.include_router(tcg_router, prefix="/tcg", tags=["TCG"])


@app.get("/")
def read_root():
    """
       Returns a welcome message for the Pokémon Deck Builder API.
       Returns:
           dict: A dictionary containing a welcome message.
    """

    return {"message": "Welcome to the Pokémon Deck Builder!"}
