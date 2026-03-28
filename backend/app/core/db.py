from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.base import Base

DATABASE_URL = "postgresql+psycopg://postgres:postgres@localhost:5432/operations_platform"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
