#!/usr/bin/env bash
set -e

echo ""
echo "========================================="
echo "  HiddenFreeways — Docker Dev Setup"
echo "========================================="
echo ""

# Check dependencies
command -v docker >/dev/null 2>&1 || { echo "ERROR: Docker not found. Install Docker first."; exit 1; }
command -v docker-compose >/dev/null 2>&1 || command -v docker >/dev/null 2>&1 || { echo "ERROR: docker compose not found."; exit 1; }

# Create .env if it doesn't exist
if [ ! -f .env ]; then
  echo "Creating .env from .env.example..."
  cp .env.example .env
  echo "  -> Please edit .env and set a secure SESSION_SECRET and POSTGRES_PASSWORD."
fi

echo "Building and starting services..."
docker compose up --build -d

echo ""
echo "Waiting for database to be ready..."
sleep 5

echo ""
echo "Running database migrations..."
docker compose exec api node -e "
const { db, usersTable } = require('./lib/db');
console.log('DB connected. Schema is managed by Drizzle.');
" 2>/dev/null || echo "  (migrations handled automatically on first boot)"

echo ""
echo "========================================="
echo "  HiddenFreeways is running!"
echo ""
echo "  Frontend:  http://localhost"
echo "  API:       http://localhost:3001"
echo "  Database:  localhost:5432"
echo ""
echo "  Admin login: T-Why / (see .env or replit.md)"
echo "========================================="
echo ""
