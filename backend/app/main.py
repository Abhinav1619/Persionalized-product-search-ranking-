from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import analytics, events, products, rank, search, users
from app.core.config import get_settings
from app.core.logging import setup_logging
from app.db.init_db import init_db
from app.ml.model_loader import model_registry


@asynccontextmanager
async def lifespan(_: FastAPI):
    setup_logging()
    init_db()
    model_registry.initialize()
    yield


settings = get_settings()
app = FastAPI(
    title=settings.app_name,
    description=(
        "Personalized Product Search Ranking demo inspired by a multi-task learning "
        "framework with tabular and non-tabular (semantic) features."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analytics.router)
app.include_router(products.router)
app.include_router(search.router)
app.include_router(rank.router)
app.include_router(events.router)
app.include_router(users.router)


@app.get("/")
def root() -> dict:
    return {
        "app": settings.app_name,
        "docs": "/docs",
        "health": "/api/health",
    }