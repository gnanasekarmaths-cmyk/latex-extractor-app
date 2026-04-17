"""
Centralised application settings.

All tunables are read from environment variables with sensible defaults
so the app works out of the box for local development.
"""

import os
from pathlib import Path


class Settings:
    BASE_DIR: Path = Path(__file__).resolve().parent

    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8001"))

    # Persistent upload directory (survives request lifecycle)
    UPLOAD_DIR: Path = Path(os.getenv("UPLOAD_DIR", str(BASE_DIR / "uploads")))
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    # Scratch space for intermediate crops
    TEMP_DIR: Path = Path(os.getenv("TEMP_DIR", str(BASE_DIR / "tmp")))
    TEMP_DIR.mkdir(parents=True, exist_ok=True)

    # CORS origins allowed by the frontend
    _EXTRA_ORIGINS = [
        "http://localhost:3002",
        "https://frontend-beryl-eta-skcq2mv6q7.vercel.app",
        "https://mis.ganitra.org",
    ]
    _env_origins = [
        o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()
    ]
    CORS_ORIGINS: list[str] = list(set(_env_origins + _EXTRA_ORIGINS))

    # Hugging Face Inference API token (optional — avoids rate-limiting)
    HF_TOKEN: str | None = os.getenv("HF_TOKEN", None)

    # Maximum upload size in megabytes
    UPLOAD_MAX_SIZE_MB: int = int(os.getenv("UPLOAD_MAX_SIZE_MB", "20"))


settings = Settings()
