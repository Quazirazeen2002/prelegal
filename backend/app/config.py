import secrets

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    db_path: str = "data/app.db"
    secret_key: str = secrets.token_urlsafe(32)
    frontend_origin: str = "http://localhost:3000"
    access_token_expire_minutes: int = 60 * 24 * 7
    static_dir: str = "static"


settings = Settings()
