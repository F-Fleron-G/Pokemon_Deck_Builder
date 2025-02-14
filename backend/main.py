from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
import models  # ✅ Ensure models are imported
from database import Base, engine  # ✅ Import engine to bind models
from auth import router as auth_router
from deck_routes import router as deck_router  # ✅ Import deck routes
from tcg_routes import router as tcg_router

# ✅ Initialize FastAPI App
app = FastAPI()


def custom_openapi():
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


# ✅ Ensure database tables are created
def setup_database():
    print("Ensuring database tables exist...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully!")


setup_database()  # ✅ Call after `app = FastAPI()`

# noinspection PyTypeChecker
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Register Routes
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(deck_router, prefix="/user", tags=["Deck Management"])  # ✅ Include deck routes
app.include_router(tcg_router, prefix="/tcg", tags=["TCG"])


# ✅ Root Endpoint
@app.get("/")
def read_root():
    return {"message": "Welcome to the Pokémon Deck Builder!"}
