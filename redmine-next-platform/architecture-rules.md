# Redmine Project Architecture Rules

Status: Draft
Date: 2026-07-03

## Purpose

These rules define the architecture direction for the Redmine migration project:

- `.NET 10` backend API
- Next.js frontend
- Docker-first deployment
- feature-by-feature migration from the current dashboard

## Core Principles

1. Keep backend and frontend separate.
2. Keep business rules out of UI and controllers.
3. Prefer stable contracts over shared implementation.
4. Migrate one feature at a time.
5. Make Docker the default runtime target.

## System Boundaries

### Backend

- Owns all Redmine integration and business rules.
- Exposes only stable API contracts to the frontend.
- Must not return raw vendor payloads unless explicitly wrapped in DTOs.

### Frontend

- Owns rendering, interaction, and client-side state.
- Must not embed business rules that belong to the backend.
- Consumes backend APIs through services and hooks.

### Infrastructure

- Docker, deployment, environment configuration, logging, and transport concerns belong here.
- No business rules should leak into infrastructure code.

## Backend Architecture Rules

### Layering

Use Clean Architecture:

- `redmine/Api`
- `redmine/Application`
- `redmine/Domain`
- `redmine/Infrastructure`
- `redmine/Services`

Dependencies must point inward.

### Backend Naming Rule

- Use `redmine` as the backend root folder.
- Do not rename the root folder to `redmine-api` unless a second backend service actually exists.
- Keep the service identity in the inner structure, not in an over-specific top-level name.

### Backend Dependency Rule

- `Domain` must not depend on any other project layer.
- `Application` may depend on `Domain` only.
- `Infrastructure` may depend on `Application` and `Domain`, but not on `Api`.
- `Api` may depend on `Application` and `Infrastructure`, but not on implementation details inside `Domain`.
- `Services` may depend on `Application` and `Domain` when they implement cross-cutting business workflows, but they should never become a second domain layer.
- Dependencies must always point inward; outer layers may implement inner abstractions, but inner layers must stay free of outer references.

### Domain Rules

- Domain entities and value objects hold business invariants.
- Domain code must not depend on HTTP, database, filesystem, or UI concerns.
- Keep domain logic small, explicit, and testable.

### Application Rules

- Application layer owns use cases.
- Use cases orchestrate domain logic and external dependencies through interfaces.
- Keep command/query handlers thin and focused.
- Prefer `OneOf` only when a use case naturally has a small, explicit set of outcomes.

### Infrastructure Rules

- Redmine API clients, caching, persistence, and transport adapters live here.
- Infrastructure implements interfaces defined in inner layers.
- Do not let infrastructure dictate application flow.

### API Rules

- Controllers stay thin.
- Controllers translate HTTP to use cases and use cases to HTTP responses.
- Validation, error mapping, and authentication middleware should be centralized.
- Prefer `Mapperly` for DTO mapping from backend outputs to API contracts.

### Services Rules

- Shared technical workflows that are not pure domain logic may live in `Services`.
- Keep services small and explicit.
- Do not hide domain rules inside services.

## Dependency Rules

Recommended backend dependencies:

- `Mapperly` for compile-time mapping
- `FluentValidation` for request and command validation
- `OneOf` for explicit multi-outcome results
- `MediatR` if use cases are organized as command/query handlers
- `Serilog` for structured logging
- `Swashbuckle.AspNetCore` or `NSwag` for OpenAPI
- `Hellang.Middleware.ProblemDetails` or equivalent for consistent API errors
- `Polly` for resilient Redmine calls
- `OpenTelemetry` if observability is required early

Avoid adding overlapping libraries unless there is a concrete need.

## Frontend Architecture Rules

### Layout

- Use Next.js App Router.
- Keep feature code grouped by domain area.
- Keep shared UI primitives separate from feature components.
- Centralize backend response-code handling in a shared client layer, not inside individual pages.

### Data Flow

- API calls belong in `services/`.
- React Query hooks belong in `hooks/`.
- Feature components should render data, not orchestrate backend logic.
- All backend response codes should flow through one normalization layer before reaching pages.

### State Rules

- Server state goes through React Query.
- Local UI state should stay local to the component or feature.
- Do not duplicate server truth in multiple places unless there is a clear reason.
- Standardize handling for `400`, `401`, `403`, `404`, and `5xx` so pages do not interpret them differently.

### Internationalization

- All visible UI strings must come from locale catalogs.
- Never hard-code translatable strings in components.

## Contract Rules

- Use DTOs for all public API responses.
- Keep response shapes stable.
- Add fields in a backward-compatible way.
- Version endpoints or DTOs if a breaking change is unavoidable.

## Migration Rules

- Start with backend foundation first.
- Migrate features in the order that gives the most business value and least coupling.
- Keep the old implementation running until the new path is verified.
- Remove legacy code only after parity is confirmed.

## Docker Rules

- Every runnable app must have a Docker image.
- Local development should be possible with `docker compose`.
- Environment variables should configure runtime behavior.
- Secrets must not be committed into source control.

## Documentation Rules

- Architecture decisions should be recorded before implementation.
- Each major change should update the relevant docs.
- Keep rules short enough that they are readable during implementation.
