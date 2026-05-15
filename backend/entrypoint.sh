#!/bin/sh
set -e

echo "[typikon] Running database migrations..."
alembic upgrade head || {
    echo "[typikon] WARNING: Migration failed. Continuing anyway — DB may not be ready."
}

echo "[typikon] Starting application..."
exec "$@"
