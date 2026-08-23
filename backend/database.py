from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

def normalize_database_url(url: str) -> str:
    """Ensure PostgreSQL URL uses postgresql:// dialect required by SQLAlchemy."""
    if not url:
        return url
    cleaned = url.strip().strip("'\"")
    if cleaned.startswith("postgres://"):
        cleaned = "postgresql://" + cleaned[len("postgres://"):]
    elif cleaned.startswith("ostgresql://"):
        cleaned = "postgresql://" + cleaned[len("ostgresql://"):]
    elif cleaned.startswith("postgresq://"):
        cleaned = "postgresql://" + cleaned[len("postgresq://"):]
    return cleaned

# Check for unified production DATABASE_URL first (e.g. Render, Supabase, Neon, Railway)
raw_db_url = os.environ.get('DATABASE_URL')

if not raw_db_url:
    DB_USER = os.environ.get('POSTGRES_USER', 'postgres')
    DB_PASS = os.environ.get('POSTGRES_PASSWORD', 'postgres')
    DB_HOST = os.environ.get('POSTGRES_HOST', 'localhost')
    DB_PORT = os.environ.get('POSTGRES_PORT', '5432')
    DB_NAME = os.environ.get('POSTGRES_DB', 'aegis_aml')
    DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
else:
    DATABASE_URL = normalize_database_url(raw_db_url)

# Production engine with pre-ping and connection pooling
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
