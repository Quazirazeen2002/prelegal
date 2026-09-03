import secrets
from pathlib import Path

from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

# OPENROUTER_API_KEY (used by litellm) lives in the repo-root .env, not backend/.env,
# so the LLM call works under `uv run uvicorn` regardless of the working directory.
load_dotenv(Path(__file__).resolve().parents[2] / ".env")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    db_path: str = "data/app.db"
    secret_key: str = secrets.token_urlsafe(32)
    frontend_origin: str = "http://localhost:3000"
    access_token_expire_minutes: int = 60 * 24 * 7
    static_dir: str = "static"


settings = Settings()
