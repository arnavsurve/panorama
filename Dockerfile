# Use a multi-stage build to separate frontend and backend

# Stage 1: Build the frontend
FROM node:16 as build

WORKDIR /app/client

COPY client/package.json client/package-lock.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Setup the server
FROM python:3.9

WORKDIR /app/server

# Copy the server code
COPY server/ ./

# Create and activate a virtual environment
RUN python -m venv venv
ENV PATH="/app/server/venv/bin:$PATH"

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the built frontend from the previous stage
COPY --from=build /app/client/dist ./static

# Expose the port the app runs on
EXPOSE 8000

# Command to run the FastAPI server using uvicorn
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]