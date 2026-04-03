# Agent Marketing Hub API

API NestJS, TypeORM & PostgreSQL.

## Prerequisites

- [Docker](https://www.docker.com/) & Docker Compose
- [Node.js 20](https://nodejs.org/) (for local development without Docker)

## Getting started

### 1. Configure environment

```bash
cp .env.example .env
```

### 2. Start the services

```bash
docker compose up
```

This starts:
- **PostgreSQL 16** on port `5432`
- **NestJS API** on port `3000` (with hot-reload)

The API is available at [http://localhost:3000](http://localhost:3000).

### 3. Run tests

```bash
# Unit tests
docker compose run --rm api npm run test

# E2E tests
docker compose run --rm api npm run test:e2e
```

### 4. Stop the services

```bash
docker compose down
```

To also remove the database volume:

```bash
docker compose down -v
```

## Local development (without Docker)

```bash
npm install
npm run start:dev
```

Make sure a PostgreSQL instance is running and the `.env` file is configured accordingly.
