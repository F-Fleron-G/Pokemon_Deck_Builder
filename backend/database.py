from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import os

"""
    This module sets up the database connection and session for the application.
    It loads environment variables, creates the SQLAlchemy engine, and defines 
    the base class for models.
"""

env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(env_path)

print("DEBUG: DATABASE_URL =", os.getenv("DATABASE_URL"))

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def create_tables():
    """
        Imports all models and creates the database tables if they do not exist.
        This function is used for initial table creation and debugging.
        """

    from models import Base
    print("Creating tables in the database...")
    Base.metadata.create_all(engine)
    print("✅ Tables successfully created!")
    engine.dispose()


if __name__ == "__main__":
    create_tables()
