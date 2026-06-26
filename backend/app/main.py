"""
CustomerIQ - Backend Main Entrypoint
Initializes the FastAPI application, mounts middlewares, and registers API routers.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.routers import auth, datasets, analytics

# Import models so SQLAlchemy detects them for create_all
from app import models 

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Asynchronously create tables on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Dispose of engine connection pool on shutdown
    await engine.dispose()

app = FastAPI(
    title="CustomerIQ API",
    description="Business Intelligence & Growth Analytics Platform API",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router, prefix="/api")
app.include_router(datasets.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")

@app.get("/")
async def root():
    return {
        "app": "CustomerIQ API",
        "status": "healthy",
        "version": "1.0.0",
        "documentation": "/docs"
    }
