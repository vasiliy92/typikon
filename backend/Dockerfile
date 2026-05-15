# --- Build stage: install Python dependencies ---
FROM python:3.11-slim AS builder

WORKDIR /build

# Copy pyproject.toml and create a stub package so pip can resolve deps
COPY pyproject.toml ./
RUN mkdir -p app && touch app/__init__.py
RUN pip install --no-cache-dir --prefix=/install .

# --- Runtime stage ---
FROM python:3.11-slim

WORKDIR /app

RUN groupadd -r typikon && useradd -r -g typikon typikon

# Installed dependencies from builder (includes stub app — overridden below)
COPY --from=builder /install /usr/local

# Real application code (overrides stub)
COPY . .

# Run Alembic migrations on startup, then start uvicorn
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

USER typikon

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
