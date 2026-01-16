# AffinityCalc/Server/Dockerfile
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# System deps (optional but commonly useful)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir gunicorn

# Copy app
COPY . /app

# Default: gunicorn serves "app" object from module path
# You can override FLASK_APP_MODULE in docker-compose.yml if needed.
ENV FLASK_APP_MODULE=main:app \
    PORT=5000

EXPOSE 5000

CMD ["sh", "-c", "gunicorn -w 2 -k gthread --threads 8 -b 0.0.0.0:${PORT} ${FLASK_APP_MODULE}"]
