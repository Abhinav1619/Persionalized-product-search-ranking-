from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "RankWise AI"
    debug: bool = True
    database_url: str = "sqlite:///./rankwise.db"
    cors_origins: str = (
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:5174,http://127.0.0.1:5174"
    )

    semantic_model_name: str = "sentence-transformers/all-MiniLM-L6-v2"
    semantic_device: str = "cpu"
    enable_semantic_model: bool = True

    rank_w_semantic: float = 0.45
    rank_w_structured: float = 0.25
    rank_w_personalization: float = 0.30

    mmoe_checkpoint_path: str = ""
    log_level: str = "INFO"

    @property
    def cors_origin_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
