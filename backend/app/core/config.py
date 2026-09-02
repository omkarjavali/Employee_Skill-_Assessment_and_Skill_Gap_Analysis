from pydantic_settings import BaseSettings


class Settings(BaseSettings):

    DATABASE_URL: str

    OPENROUTER_API_KEY: str

    # =====================================================
    # JWT SETTINGS
    # =====================================================

    JWT_SECRET_KEY: str

    JWT_ALGORITHM: str = "HS256"

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    class Config:
        env_file = ".env"


settings = Settings()