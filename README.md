# Equation to LaTeX Extractor

This repository contains a React frontend and FastAPI backend for extracting exact LaTeX from a highlighted region in a PDF.

## Architecture

- `frontend/` - React app with `pdf.js` rendering and bounding-box selection.
- `backend/` - FastAPI app with PyMuPDF cropping and `pix2tex` OCR.

## Backend Setup

1. Create a virtual environment and install dependencies:

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

1. Run the API server:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Frontend Setup

1. Install dependencies:

```bash
cd frontend
npm install
```

1. Start the React app:

```bash
npm start
```

## Notes

- The backend expects a self-hosted `pix2tex` installation in the same Python environment.
- The frontend maps canvas coordinates to PDF page points and sends exact crop coordinates to the backend.
- The backend validates PDF dimensions before cropping and returns exact LaTeX without correction or simplification.
