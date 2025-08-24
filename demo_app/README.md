# Todo App (Express + PostgreSQL + Redis)

Simple todo app for Kubernetes demos. Tiny frontend, REST API, and Redis caching. Fully dockerized with local compose.

## Run locally with Docker

```bash
cd /Users/adriansilaghi/work/softia/uc/k8s-demo/demo_app
docker compose up -d --build
```

Open http://localhost:3000.

## Environment variables

- PORT (default 3000)
- PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE
- REDIS_URL (default redis://localhost:6379)
- CACHE_TTL_SECONDS (default 10)

## API

- GET /api/todos – list todos (cached)
- POST /api/todos – { title: string } create a todo
- PUT /api/todos/:id – { title?: string, completed?: boolean } update a todo
- DELETE /api/todos/:id – delete a todo
- GET /health – health probe for DB and Redis

## Kubernetes notes

- Inject DB/Redis config via ConfigMap/Secret env vars.
- Use readinessProbe on /health.
- Backing services can be external or in-cluster.
