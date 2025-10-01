#!/bin/bash
# Start script for the Python agent server

cd "$(dirname "$0")"

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Start the server
python -m uvicorn src.server:app --host 0.0.0.0 --port ${PORT:-8001} --reload
