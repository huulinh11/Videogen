#!/bin/bash
# Videogen quick start script

echo "=== Videogen Self-Hosted ==="

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "Please edit .env with your credentials"
fi

# Install dependencies
echo "Installing server dependencies..."
cd server && npm install && cd ..

echo "Installing client dependencies..."
cd client && npm install && cd ..

# Build frontend
echo "Building frontend..."
cd client && npm run build && cd ..

# Create data directory
mkdir -p data

echo ""
echo "Setup complete!"
echo ""
echo "To run in development:"
echo "  Terminal 1: cd server && npm run dev"
echo "  Terminal 2: cd client && npm run dev"
echo ""
echo "To run with Docker:"
echo "  docker compose up -d --build"
echo ""
echo "Frontend: http://localhost:5173"
echo "Backend API: http://localhost:3001/api"
echo ""
