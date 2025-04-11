import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from database import Base, engine
from auth import router as auth_router
from deck_routes import router as deck_router
from tcg_routes import router as tcg_router
from pokemon_routes import router as pokemon_router

app = FastAPI()

origins = [
    "http://localhost:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(deck_router, prefix="/deck", tags=["Deck Management"])
app.include_router(tcg_router, prefix="/tcg", tags=["TCG"])
app.include_router(pokemon_router, tags=["Pokemon"])


def custom_openapi():
    """
       Generates and customises the OpenAPI schema for this FastAPI application.
       It adds a 'BearerAuth' security scheme so that the OpenAPI docs show
       JWT/Bearer token usage clearly.

       Returns:
           dict: The modified OpenAPI schema with a Bearer security definition.
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
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT"
        }
    }
    openapi_schema["security"] = [{"BearerAuth": []}]
    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi


def setup_database():
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully!")


setup_database()


@app.get("/")
def read_root():
    return {"message": "Welcome to the Pokémon Deck Builder!"}
