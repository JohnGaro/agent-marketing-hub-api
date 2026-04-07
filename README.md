# Agent Marketing Hub — API

NestJS · TypeORM · PostgreSQL · Anthropic Claude

---

## Prerequisites

- [Docker](https://www.docker.com/) & Docker Compose

---

## Quick start

### 1. Configure environment

Copy the example file and **add your Anthropic API key**:

```bash
cp .env.example .env
```

Open `.env` and replace `your-anthropic-api-key-here` with your actual key:

```env
ANTHROPIC_API_KEY=sk-ant-...
```

### 2. Build & start the services

```bash
docker compose up --build
```

This starts:

- **PostgreSQL 16** on port `5432`
- **NestJS API** on port `3000` (with hot-reload)

The API is available at [http://localhost:3000](http://localhost:3000).

### 3. Run migrations

Open a shell inside the running API container, then run migrations:

```bash
docker compose exec api npm run typeorm migration:run
```

### 4. Seed the database

Populate the database with mock data:

```bash
docker compose exec api npm run seed
```

---

## Stop the services

```bash
docker compose down
```

To also remove the database volume:

```bash
docker compose down -v
```
