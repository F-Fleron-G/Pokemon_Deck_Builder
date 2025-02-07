from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import os

# ✅ Load environment variables
env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(env_path)

# ✅ Debugging
print("DEBUG: DATABASE_URL =", os.getenv("DATABASE_URL"))

# ✅ PostgreSQL Database URL
DATABASE_URL = os.getenv("DATABASE_URL")

# ✅ Create Engine
engine = create_engine(DATABASE_URL)

# ✅ Session Maker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ✅ Base Class for Models (used in models.py)
Base = declarative_base()


# ✅ Run Table Creation
def create_tables():
    from models import Base  # Ensure models are imported before creating tables
    print("Creating tables in the database...")  # ✅ Debugging
    Base.metadata.create_all(engine)
    print("✅ Tables successfully created!")
    engine.dispose()  # ✅ Close connection properly


# ✅ Only run if script is executed directly
if __name__ == "__main__":
    create_tables()
