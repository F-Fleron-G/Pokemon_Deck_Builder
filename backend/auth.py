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

# ✅ Ensure tables are created before running API
Base.metadata.create_all(engine)

# ✅ Load Secret Key from Environment Variables
SECRET_KEY = os.getenv("SECRET_KEY", "your_default_secret_key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# ✅ Password Hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ✅ OAuth2 Token Scheme (still available if needed)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# ✅ New API Key Header Dependency for direct token input in Swagger
api_key_header = APIKeyHeader(name="Authorization", auto_error=False)


def get_api_key(api_key: str = Security(api_key_header)):
    if not api_key or not api_key.startswith("Bearer "):
        raise HTTPException(status_code=403, detail="Not authenticated")
    return api_key  # Returns the full "Bearer <token>" string


# ✅ FastAPI Router
router = APIRouter()


# ✅ Database Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ✅ Hash Password Function
def hash_password(password: str) -> str:
    return pwd_context.hash(password)


# ✅ Verify Password Function
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# ✅ Create JWT Token
def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire.timestamp()})  # ✅ Store expiration as Unix timestamp
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# ✅ Signup Endpoint
@router.post("/signup")
def signup(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = hash_password(user.password)
    new_user = User(email=user.email, password=hashed_password)

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    print(f"✅ User signed up: {user.email}")  # ✅ Debugging
    return {"message": "User created successfully"}


# ✅ Login Endpoint
@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()

    if not db_user or not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(data={"sub": db_user.email})
    print(f"✅ User logged in: {user.email}")  # ✅ Debugging
    return {"access_token": access_token, "token_type": "bearer"}


# ✅ Decode JWT Token
def decode_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")  # The "sub" contains the user's email
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
