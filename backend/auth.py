from datetime import datetime, timedelta
from typing import Optional
import os
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

# Configuration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Security
security = HTTPBearer()

# Pydantic models
class UserRegistration(BaseModel):
    nom: str
    telephone: str  # Format +237XXXXXXXXX
    mot_de_passe: str
    type_utilisateur: str  # "patient" ou "medecin"
    
    # Champs spécifiques patient
    age: Optional[int] = None
    ville: Optional[str] = None
    
    # Champs spécifiques médecin
    specialite: Optional[str] = None
    experience: Optional[str] = None
    tarif: Optional[int] = None
    diplomes: Optional[str] = None

class UserLogin(BaseModel):
    telephone: str
    mot_de_passe: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_data: dict

class TokenData(BaseModel):
    telephone: Optional[str] = None
    user_type: Optional[str] = None

# Utility functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Vérifier un mot de passe"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hasher un mot de passe"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Créer un token JWT"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Vérifier et décoder un token JWT"""
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        telephone: str = payload.get("sub")
        user_type: str = payload.get("user_type")
        
        if telephone is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token invalide",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        token_data = TokenData(telephone=telephone, user_type=user_type)
        return token_data
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide",
            headers={"WWW-Authenticate": "Bearer"},
        )

def validate_cameroon_phone(telephone: str) -> bool:
    """Valider un numéro de téléphone camerounais"""
    # Format attendu: +237XXXXXXXXX (9 chiffres après +237)
    if not telephone.startswith("+237"):
        return False
    
    number_part = telephone[4:]  # Enlever +237
    if len(number_part) != 9:
        return False
    
    if not number_part.isdigit():
        return False
        
    # Vérifier que ça commence par 6, 7 ou 2 (préfixes camerounais)
    if not number_part[0] in ['6', '7', '2']:
        return False
        
    return True

# Fonction pour obtenir l'utilisateur actuel depuis le token
async def get_current_user(token_data: TokenData = Depends(verify_token)):
    """Obtenir l'utilisateur actuel depuis le token"""
    return token_data