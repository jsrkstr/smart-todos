# Quick Install Instructions

## Fix the Module Error

The error you're seeing is because we need to install the updated dependencies. Run:

```bash
cd apps/agent-python

# If you have a virtual environment (recommended):
source venv/bin/activate  # or 'venv\Scripts\activate' on Windows

# Install/update dependencies
pip install -r requirements.txt
```

## Key Changes Made

1. **Updated imports** - Changed from `psycopg2` to `psycopg` (v3)
2. **Added checkpoint package** - `langgraph-checkpoint-postgres`
3. **Added connection pool** - `psycopg-pool`

## Updated Requirements

```
langgraph>=0.2.0
langgraph-checkpoint-postgres>=2.0.0
langchain>=0.3.0
langchain-openai>=0.2.0
psycopg[binary]>=3.2.0
psycopg-pool>=3.2.0
python-dotenv>=1.0.0
pydantic>=2.0.0
fastapi>=0.115.0
uvicorn>=0.32.0
```

## After Installing

Start the server:

```bash
./start.sh
```

Or:

```bash
python -m uvicorn src.server:app --host 0.0.0.0 --port 8001 --reload
```

## Verify It's Working

```bash
curl http://localhost:8001/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "smarttodos-agent"
}
```

## If You Still Get Errors

### Virtual Environment Not Activated

Make sure your virtual environment is activated:

```bash
# Create if you don't have one:
python3 -m venv venv

# Activate it:
source venv/bin/activate  # macOS/Linux
# or
venv\Scripts\activate  # Windows
```

### Python Version

Ensure you're using Python 3.9 or higher:

```bash
python --version
```

### Clean Install

If problems persist:

```bash
# Remove old packages
pip uninstall -y psycopg2 psycopg2-binary

# Clean install
pip install --upgrade pip
pip install -r requirements.txt
```
