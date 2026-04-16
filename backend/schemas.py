"""Pydantic models shared across routes."""

from pydantic import BaseModel, Field


class UploadResponse(BaseModel):
    file_id: str
    stored_filename: str
    original_filename: str | None = None


class ExtractRequest(BaseModel):
    file_id: str
    page_number: int = Field(..., gt=0)
    x: float = Field(..., ge=0)
    y: float = Field(..., ge=0)
    width: float = Field(..., gt=0)
    height: float = Field(..., gt=0)
    page_width: float = Field(..., gt=0)
    page_height: float = Field(..., gt=0)


class OCRResponse(BaseModel):
    latex: str
