FROM python:3.11-slim

WORKDIR /app

# Copy dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY backend/ /app/backend/
COPY ml/ /app/ml/
COPY database/ /app/database/

ENV PYTHONPATH=/app/backend:/app/ml

# Generate synthetic datasets & train models before starting app
RUN python /app/ml/generate_data.py
RUN python /app/ml/train_models.py
RUN python /app/database/seed.py

EXPOSE 8000

CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
