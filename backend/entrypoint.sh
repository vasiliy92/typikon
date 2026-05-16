#!/bin/sh
set -e

echo "[typikon] Running database migrations..."
alembic upgrade head || {
    echo "[typikon] WARNING: Migration failed. Continuing anyway — DB may not be ready."
}

if [ "${SEED_DATA}" = "true" ]; then
    echo "[typikon] Seeding demo data..."
    python -m scripts.seed || {
        echo "[typikon] WARNING: Seed failed. Data may already exist."
    }
fi

echo "[typikon] Starting application..."
exec "$@"