FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
RUN pip install --no-cache-dir \
    fastapi==0.136.3 \
    uvicorn==0.48.0 \
    pydantic==2.13.4 \
    pydantic-settings==2.14.1 \
    sqlalchemy==2.0.50 \
    aiosqlite==0.22.1 \
    alembic==1.18.4 \
    google-genai==2.7.0 \
    geopy==2.4.1 \
    aiofiles==25.1.0 \
    python-multipart==0.0.29 \
    python-dotenv==1.2.2 \
    loguru==0.7.3 \
    slowapi==0.1.9 \
    PyJWT==2.10.1 \
    passlib[bcrypt]==1.7.4 \
    Pillow==11.3.0

COPY . .

EXPOSE 8000

RUN chmod +x /app/start.sh

CMD ["/app/start.sh"]
