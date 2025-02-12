from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models  # ✅ Ensure models are imported
from database import Base, engine  # ✅ Import engine to bind models
from auth import router as auth_router
from deck_routes import router as deck_router  # ✅ Import deck routes
from tcg_routes import router as tcg_router

# ✅ Initialize FastAPI App
app = FastAPI()


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
    return {"message": "Welcome to the Pokémon Deck Creator!"}
