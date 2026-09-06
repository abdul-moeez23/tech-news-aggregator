# Docker Infrastructure Setup

This document outlines the containerized infrastructure for the Tech News Aggregator for local development. By using Docker for our infrastructure, we keep the host operating system clean and ensure consistency.

## Overview
We use Docker to run our system-level dependencies:
1. **PostgreSQL**: The main relational database for storing user preferences and article metadata.
2. **Redis**: The in-memory message broker used by Celery to manage background tasks (fetching RSS feeds and APIs).

The application code (Django API, Celery Workers, React Frontend) will run locally on the host machine using isolated Virtual Environments / Node modules to ensure fast hot-reloading and easy debugging.

## Docker Compose Configuration

Create a file named `docker-compose.yml` in the root of the project with the following contents when you are ready to start development:

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  db:
    image: postgres:15-alpine
    container_name: tech_news_db
    restart: always
    environment:
      POSTGRES_USER: tech_user
      POSTGRES_PASSWORD: tech_password
      POSTGRES_DB: tech_news_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  # Redis Message Broker (for Celery)
  redis:
    image: redis:7-alpine
    container_name: tech_news_redis
    restart: always
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

# Persistent Volumes
volumes:
  postgres_data:
  redis_data:
```

## How to Run

1. Ensure Docker Desktop is installed and running on your system.
2. Open a terminal in the project root directory.
3. Run the following command to start the infrastructure in the background:
   ```bash
   docker-compose up -d
   ```
4. To stop the containers without deleting data:
   ```bash
   docker-compose down
   ```
5. To completely wipe the database and start fresh:
   ```bash
   docker-compose down -v
   ```
