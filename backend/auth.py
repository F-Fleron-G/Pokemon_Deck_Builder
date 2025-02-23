from fastapi import APIRouter, Depends, HTTPException, Security
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from models import User
from schemas import UserCreate, UserLogin
from passlib.context import CryptContext
import jwt
import os
from datetime import datetime, timedelta, timezone
from fastapi.security import OAuth2PasswordBearer, APIKeyHeader

"""
    This module handles authentication and authorisation.
    It defines endpoints for user signup, login, token creation, and token decoding,
    using JWTs and password hashing with bcrypt.
"""


Base.metadata.create_all(engine)

SECRET_KEY = os.getenv("SECRET_KEY", "your_default_secret_key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

api_key_header = APIKeyHeader(name="Authorization", auto_error=False)


def get_api_key(api_key: str = Security(api_key_header)):
    """
        Validates the API key from the Authorization header.
        Args:
            api_key (str): The API key string from the request header.
        Returns:
            str: The API key if valid.
        Raises:
            HTTPException: If the API key is missing or does not start with 'Bearer '.
        """

    if not api_key or not api_key.startswith("Bearer "):
        raise HTTPException(status_code=403, detail="Not authenticated")
    return api_key


router = APIRouter()


def get_db():
    """
        Provides a database session for request handling.
        Yields:
            Session: A SQLAlchemy session.
        """

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def hash_password(password: str) -> str:
    """
        Hashes the provided password using bcrypt.
        Args:
            password (str): The plain text password.
        Returns:
            str: The hashed password.
        """

    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
        Verifies that the plain password matches the hashed password.
        Args:
            plain_password (str): The plain text password.
            hashed_password (str): The hashed password.
        Returns:
            bool: True if the password matches, otherwise False.
        """

    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: timedelta = None):
    """
        Creates a JWT access token.
        Args:
            data (dict): The data to include in the token payload.
            expires_delta (timedelta, optional): Token expiration time. Defaults to ACCESS_TOKEN_EXPIRE_MINUTES.
        Returns:
            str: The encoded JWT access token.
        """

    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire.timestamp()})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


@router.post("/signup")
def signup(user: UserCreate, db: Session = Depends(get_db)):
    """
        Registers a new user by hashing the password and saving the user to the database.
        Args:
            user (UserCreate): The user data for registration.
            db (Session): The database session.
        Returns:
            dict: A success message upon registration.
        Raises:
            HTTPException: If the email already exists.
        """

    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="This email already exists.")

    hashed_password = hash_password(user.password)
    new_user = User(email=user.email, password=hashed_password)

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "Success! You can now login."}


@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    """
        Logs in a user by verifying credentials and returning a JWT access token.
        Args:
            user (UserLogin): The login credentials.
            db (Session): The database session.
        Returns:
            dict: The access token and token type.
        Raises:
            HTTPException: If authentication fails.
        """

    db_user = db.query(User).filter(User.email == user.email).first()

    if not db_user or not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=401, detail="Try again! Your email or password are wrong.")

    access_token = create_access_token(data={"sub": db_user.email})
    return {"access_token": access_token, "token_type": "bearer"}


def decode_token(token: str):
    """
        Decodes a JWT token and extracts the subject (user email).
        Args:
            token (str): The JWT token.
        Returns:
            str: The user's email (subject) extracted from the token.
        Raises:
            HTTPException: If the token is expired or invalid.
        """

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
