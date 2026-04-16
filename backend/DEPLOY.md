# Backend Deployment

This backend is prepared for three deployment paths:

- Render
- Railway
- Simple VPS or Docker host

It expects a separate frontend such as the deployed Vercel app. Set `CORS_ORIGINS` to your frontend URL and set the Vercel frontend env `REACT_APP_API_BASE_URL` to `https://your-backend-domain/api`.

## Shared Environment Variables

Copy `.env.example` to `.env` for local or container-based runs.

- `HOST`: bind address, usually `0.0.0.0`
- `PORT`: app port, defaults to `8001`
- `CORS_ORIGINS`: comma-separated allowed frontend origins
- `MODEL_DEVICE`: `cpu` or `cuda`
- `OCR_TIMEOUT_SECONDS`: OCR timeout
- `UPLOAD_MAX_SIZE_MB`: upload limit
- `UPLOAD_DIR`: persistent upload directory
- `TEMP_DIR`: temp crop directory

## Render

Files:

- `Dockerfile`
- `render.yaml`

Steps:

1. Create a new Render Web Service from the repo.
2. Let Render detect `backend/render.yaml`, or point the service root to `backend/`.
3. Set `CORS_ORIGINS` to your Vercel frontend URL.
4. Keep the attached disk mounted at `/data` so uploads and temp files have writable storage.
5. Deploy and confirm `GET /health` returns `{"status":"ok"}`.

Notes:

- Render will inject its own external hostname.
- `PORT=8000` is set in `render.yaml` to match the container’s exposed port.

## Railway

Files:

- `Dockerfile`
- `railway.toml`

Steps:

1. Create a new Railway project from the repo and set the service root to `backend/`.
2. Railway will build from the `Dockerfile`.
3. Add env vars from `.env.example`.
4. Set `CORS_ORIGINS` to the Vercel frontend URL.
5. If you need persistent upload retention, attach a Railway volume and point `UPLOAD_DIR` and `TEMP_DIR` at that mounted path.

Notes:

- Railway usually injects `PORT` automatically; `start.py` now honors it.
- Without a volume, uploads are ephemeral between deployments/restarts.

## VPS / Docker

Files:

- `Dockerfile`
- `docker-compose.yml`
- `.env.example`

Steps:

1. Copy `.env.example` to `.env` and edit values.
2. Start the container:

```bash
docker compose up -d --build
```

3. Verify the API:

```bash
curl http://localhost:8001/health
```

4. Put Nginx or Caddy in front if you want HTTPS and a public domain.

Notes:

- The compose file mounts a named Docker volume at `/data`.
- Set `UPLOAD_DIR=/data/uploads` and `TEMP_DIR=/data/tmp` in `.env`.
