# Redmine Migration Architecture Notes

Status: Draft
Date: 2026-07-03

## Goal

Migrate the current Redmine dashboard into a new system built with:

- `.NET 10` for backend API
- `Next.js` for frontend
- Docker for local development and deployment

The current repository stays as a temporary working area for design notes only. The actual new repo can be created later after the docs are finalized.

## Guiding Principles

1. Keep the backend and frontend as separate deployable units.
2. Move feature by feature instead of rewriting everything at once.
3. Keep domain/business rules out of controllers and UI components.
4. Prefer stable contracts over direct shared implementation.
5. Make Docker the default runtime target from the beginning.

## Target System

### Backend

The backend should be a `.NET 10` Web API using Clean Architecture:

- `redmine/Api`
- `redmine/Application`
- `redmine/Domain`
- `redmine/Infrastructure`
- `redmine/Services`

Controllers stay thin and only translate HTTP requests into application calls.

The backend root folder is `redmine`, not `src`.

### Frontend

The frontend should be a separate Next.js app that consumes the backend API.

Recommended frontend stack:

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- Axios
- `next-intl`
- React Hook Form
- Zod

### Deployment

Docker should be supported in two layers:

- local development with `docker compose`
- production deployment with separate app containers

## Proposed Repo Layout

### Backend repo

```text
redmine/
  Api/
  Application/
  Domain/
  Infrastructure/
  Services/
tests/
docker/
```

### Frontend repo

```text
src/
  app/
  components/
  hooks/
  lib/
  services/
  types/
  schemas/
  constants/
messages/
```

## Dependency Notes

### Backend

Recommended:

- Mapperly
- FluentValidation
- OneOf
- MediatR
- Serilog
- Swashbuckle.AspNetCore or NSwag

Optional when needed:

- Hellang.Middleware.ProblemDetails
- Polly
- OpenTelemetry

### Frontend

Recommended:

- Tailwind CSS
- shadcn/ui
- TanStack Query
- Axios
- next-intl
- React Hook Form
- Zod

## Frontend Response Handling

All backend response codes should be normalized once in a shared client layer.

- Pages should not interpret the same HTTP code differently.
- Use one error mapping policy for `400`, `401`, `403`, `404`, and `5xx`.
- Keep page components focused on rendering normalized states.

## Backend Architecture

### Domain Layer

Contains:

- entities
- value objects
- domain events
- invariants
- business rules

No HTTP, database, or external service dependencies should live here.

### Application Layer

Contains:

- use cases
- commands and queries
- handlers
- validators
- DTO mapping

This layer orchestrates the feature flow.

### Infrastructure Layer

Contains:

- Redmine API client
- persistence if later needed
- caching if later needed
- logging integrations

External details stay behind interfaces defined inward.

### API Layer

Contains:

- controllers
- auth middleware
- request/response models
- exception handling
- API versioning if needed later

## Feature Breakdown

Start by migrating the current behaviors as separate backend modules:

1. Dashboard
2. Daily Report
3. Weekly Report
4. My Task
5. Login Time

Each module should expose its own endpoints and DTOs.

## API Contract Rules

- Use versioned DTOs for public responses.
- Avoid returning raw Redmine payloads directly to the frontend.
- Keep response shapes stable across frontend migrations.
- Add new fields without breaking existing clients.
- Prefer explicit view models over over-sharing backend entities.

## Frontend Architecture

### Core Rules

- Keep API access in `services/`
- Keep feature state and orchestration in `hooks/`
- Keep UI components presentational where possible
- Keep localization in message catalogs, not inline strings

### Recommended Feature Structure

```text
src/components/features/dashboard/
src/components/features/daily-report/
src/components/features/weekly-report/
src/components/features/my-task/
src/components/features/login-time/
```

Each feature should own:

- UI pieces
- query hooks
- form schemas
- local view models

## Migration Strategy

### Phase 1: Backend foundation

Build the `.NET 10` API skeleton first:

- solution structure
- configuration
- logging
- error handling
- API contracts
- Redmine client abstraction

### Phase 2: Parallel endpoint migration

Move one feature at a time:

- implement backend endpoint
- wire frontend to the new endpoint
- validate behavior
- remove old path only after parity is confirmed

### Phase 3: Frontend rewrite

Replace the static SPA screen by screen.

### Phase 4: Dockerization

Once the app shape is stable:

- add Dockerfile for backend
- add Dockerfile for frontend
- add docker compose for local dev
- add production compose or deployment manifest

## Docker Layout

### Backend container

The backend container should:

- run the ASP.NET API
- read config from environment variables
- expose a single HTTP port

### Frontend container

The frontend container should:

- build Next.js
- serve the app in production mode
- read public config through environment variables

### Compose

Use compose for:

- backend
- frontend
- optional reverse proxy
- optional Redis if caching becomes necessary

## Decision Notes

### Why not monolith first?

A single big rewrite increases risk. Migration by module gives quicker feedback and easier rollback.

### Why not copy the current SPA structure directly?

The current app is a static JS dashboard. The new architecture needs stronger boundaries because the target is a multi-repo Dockerized setup.

### Why separate repos?

Separate repos make frontend/backend release cycles cleaner and fit the current direction already used by Anemoi-style architecture.

## Open Questions

1. Should the backend talk to Redmine directly, or should there be an adapter/proxy layer first?
2. Should auth be simple API key based or evolve into full user auth later?
3. Should the frontend keep the same five views, or should some screens be merged in the new UI?
