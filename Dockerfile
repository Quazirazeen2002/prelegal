# syntax=docker/dockerfile:1

FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
COPY templates /app/templates
RUN npm run build

FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim AS backend
WORKDIR /app
ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    STATIC_DIR=/app/static \
    DB_PATH=/app/data/app.db

COPY backend/pyproject.toml backend/uv.lock* /app/backend/
WORKDIR /app/backend
RUN uv sync --no-dev --no-install-project

COPY backend/app /app/backend/app
RUN uv sync --no-dev

# app/catalog.py resolves this the same way it resolves the repo root locally
# (two directories up from backend/app/): /app here, repo root in local dev.
COPY catalog.json /app/catalog.json

COPY --from=frontend-builder /app/frontend/out /app/static

EXPOSE 8000
CMD [".venv/bin/uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
