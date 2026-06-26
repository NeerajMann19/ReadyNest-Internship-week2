"""
CustomerIQ - Database Configuration
Sets up the asynchronous SQLAlchemy engine, session maker, base model, and DB session generator.
"""

from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import settings

# Create async engine using the database url (postgresql+asyncpg://)
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True
)

# Async session maker
async_session_maker = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Base model class using SQLAlchemy 2.0 DeclarativeBase
class Base(DeclarativeBase):
    pass

# Dependency to get async DB session for route handlers
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()
