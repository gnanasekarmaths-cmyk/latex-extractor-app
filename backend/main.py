"""
FastAPI application entry point.

Registers all route modules and configures middleware.
Run with: uvicorn main:app --reload --port 8001
"""

import logging
import time

from fastapi import FastAPI, Request
from starlette.middleware.cors import CORSMiddleware

from config import settings
from routes.upload import router as upload_router
from routes.extract import router as extract_router
from routes.page_text import router as page_text_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("backend")

app = FastAPI(
    title="LaTeX Equation Extractor",
    version="2.0.0",
    description="Upload a PDF, select a region, and get exact LaTeX via self-hosted pix2tex.",
)

# --- CORS middleware (MUST be added before routers / other middleware) -----
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Request logging ------------------------------------------------------
@app.middleware("http")
async def log_requests(request: Request, call_next):
    t0 = time.perf_counter()
    logger.info("%s %s", request.method, request.url.path)
    response = await call_next(request)
    elapsed = (time.perf_counter() - t0) * 1000
    logger.info("%s %s → %d (%.0fms)", request.method, request.url.path, response.status_code, elapsed)
    return response


# --- Routers --------------------------------------------------------------
app.include_router(upload_router, prefix="/api")
app.include_router(extract_router, prefix="/api")
app.include_router(page_text_router, prefix="/api")


@app.get("/")
async def root():
    return {"message": "Backend running"}


@app.get("/health")
async def health_check():
    return {"status": "ok"}
